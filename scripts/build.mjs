// Builds the package into dist/ with no dependency besides TypeScript:
//
//   dist/esm/**/*.mjs, *.d.mts   ES modules (tsconfig.build.json)
//   dist/cjs/**/*.cjs, *.d.cts   CommonJS   (tsconfig.build.cjs.json)
//
// Subdirectories of src/ (src/locales/) keep their place in dist/.
//
// TypeScript emits .js and .d.ts files whose relative imports have no file
// extension, because the sources are written that way. Node resolves ES module
// imports only with the exact file name, and it reads .js as ES or CommonJS
// depending on the nearest package.json. So after each emit this script gives
// every file its final extension (.mjs/.d.mts or .cjs/.d.cts) and rewrites the
// relative specifiers to match, then checks that every relative import in the
// output points to a file that exists. Then the package works in Node and in
// bundlers, and `arethetypeswrong` finds the right types in every mode.
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tsc = join(root, "node_modules/typescript/bin/tsc");

const builds = [
  {
    project: "tsconfig.build.json",
    dir: "dist/esm",
    js: ".mjs",
    dts: ".d.mts",
  },
  {
    project: "tsconfig.build.cjs.json",
    dir: "dist/cjs",
    js: ".cjs",
    dts: ".d.cts",
  },
];

// A relative specifier in `from "./x"`, `import("./x")` or `require("./x")`.
const RELATIVE_SPECIFIER =
  /(\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)(["'])(\.{1,2}\/[^"']*)\2/g;

/** Every file under `dir`, in subdirectories too, as absolute paths. */
function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

rmSync(join(root, "dist"), { recursive: true, force: true });

for (const { project, dir, js, dts } of builds) {
  execFileSync(process.execPath, [tsc, "-p", join(root, project)], {
    stdio: "inherit",
  });

  const outDir = join(root, dir);
  for (const file of listFiles(outDir)) {
    const name = relative(outDir, file);
    const isDts = name.endsWith(".d.ts");
    if (!isDts && !name.endsWith(".js")) {
      throw new Error(
        `${dir}/${name}: unexpected file in the TypeScript output`
      );
    }
    const code = readFileSync(file, "utf8").replace(
      RELATIVE_SPECIFIER,
      (_match, before, quote, specifier) => {
        if (/\.[cm]?[jt]s$/.test(specifier)) {
          throw new Error(
            `${dir}/${name}: "${specifier}" already has an extension`
          );
        }
        return `${before}${quote}${specifier}${js}${quote}`;
      }
    );
    const base = file.slice(0, file.length - (isDts ? ".d.ts" : ".js").length);
    writeFileSync(file, code);
    renameSync(file, base + (isDts ? dts : js));
  }

  // Every relative import must point to a file that exists, relative to the
  // file that imports it.
  const files = listFiles(outDir);
  for (const file of files) {
    const code = readFileSync(file, "utf8");
    for (const [, , , specifier] of code.matchAll(RELATIVE_SPECIFIER)) {
      if (!existsSync(join(dirname(file), specifier))) {
        throw new Error(
          `${dir}/${relative(outDir, file)}: "${specifier}" does not exist`
        );
      }
    }
  }
  console.log(`${dir}: ${files.length} files`);
}
