#!/usr/bin/env node
// Prepares the package for the runnable examples (examples/, #60): unpacks
// what `pnpm pack` would publish into examples/.pack/package, which every
// example installs with `"nif-dni-nie-cif-validation": "file:../.pack/package"`.
// So an example runs against the files of the tarball (`exports`, `files`,
// the types), not against src/ or a dist/ that npm would not ship.
//
// Usage:
//   node scripts/pack-for-examples.mjs            builds and packs
//   node scripts/pack-for-examples.mjs <tarball>  unpacks a tarball you made
//
// No dependencies, besides `pnpm` (to pack) and `tar`. The folder is in
// .gitignore.
import { execFileSync } from "node:child_process";
import {
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
const target = join(root, "examples", ".pack");

let tarball = process.argv[2];
let temporary;
if (tarball) {
  tarball = resolve(tarball);
  if (!existsSync(tarball)) {
    console.error(`pack-for-examples: ${tarball} does not exist`);
    process.exit(2);
  }
} else {
  // `prepack` builds dist/. Husky has nothing to do here.
  temporary = mkdtempSync(join(tmpdir(), "nif-pack-"));
  execFileSync("pnpm", ["pack", "--pack-destination", temporary], {
    cwd: root,
    env: { ...process.env, HUSKY: "0" },
    stdio: ["ignore", "ignore", "inherit"],
  });
  const [file] = readdirSync(temporary).filter((name) => name.endsWith(".tgz"));
  if (!file) {
    console.error("pack-for-examples: pnpm pack made no tarball");
    process.exit(1);
  }
  tarball = join(temporary, file);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
// A tarball made by npm or pnpm has everything under `package/`.
execFileSync("tar", ["-xzf", tarball, "-C", target], { stdio: "inherit" });
if (temporary) rmSync(temporary, { recursive: true, force: true });

if (!existsSync(join(target, "package", "package.json"))) {
  console.error("pack-for-examples: the tarball has no package/package.json");
  process.exit(1);
}
console.log(
  `Unpacked the package into ${join("examples", ".pack", "package")}`
);
