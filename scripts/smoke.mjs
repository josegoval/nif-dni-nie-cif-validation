#!/usr/bin/env node
// Runs the smoke tests of test/smoke/ against the packed package, as the
// `compat` job of .github/workflows/release.yml does: installs the tarball
// with npm into an empty temporary project, copies the smoke tests there and
// runs them with `node --test`. So `require`, `import` and
// `npx nif-dni-nie-cif-validation` resolve the package as a consumer's would.
//
// Usage:
//   pnpm smoke                          packs, then tests
//   node scripts/smoke.mjs <tarball>    tests a tarball you made
//
// The tests run with the `node` and `npx` of your PATH. For the oldest
// supported Node, pack first and put that Node first in PATH:
//   PATH=/path/to/node20/bin:$PATH node scripts/smoke.mjs <tarball>
// No dependencies, besides `pnpm` (to pack) and `npm`.
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const smoke = join(root, "test", "smoke");
const work = mkdtempSync(join(tmpdir(), "nif-smoke-"));

try {
  let tarball = process.argv[2] && resolve(process.argv[2]);
  if (tarball && !existsSync(tarball))
    throw new Error(`smoke: ${tarball} does not exist`);
  if (!tarball) {
    // `prepack` builds dist/. Husky has nothing to do here. The tarball's
    // name is read from the folder, never from pnpm's output.
    const pack = join(work, "pack");
    execFileSync("pnpm", ["pack", "--pack-destination", pack], {
      cwd: root,
      env: { ...process.env, HUSKY: "0" },
      stdio: ["ignore", "ignore", "inherit"],
    });
    const [file] = readdirSync(pack).filter((name) => name.endsWith(".tgz"));
    if (!file) throw new Error("smoke: pnpm pack made no tarball");
    tarball = join(pack, file);
  }

  const project = join(work, "project");
  const run = (command, args) =>
    execFileSync(command, args, { cwd: project, stdio: "inherit" });
  mkdirSync(project);
  execFileSync("npm", ["init", "-y"], { cwd: project, stdio: "ignore" });
  run("npm", ["install", "--no-audit", "--no-fund", tarball]);
  const tests = readdirSync(smoke).filter((name) =>
    /\.test\.[cm]js$/.test(name)
  );
  for (const name of tests)
    copyFileSync(join(smoke, name), join(project, name));
  run("node", ["--version"]);
  run("node", ["--test", ...tests]);
} finally {
  rmSync(work, { recursive: true, force: true });
}
