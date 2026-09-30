// Proves the packed tarball tree-shakes: an application that imports only the
// boolean validators must not bundle the error messages or the organisation
// names that only `validate()` and `describeCifOrganisation()` use.
//
// Usage: node scripts/check-tree-shaking.mjs <package tarball>
//
// It unpacks the tarball into a temporary project (so the bundler resolves the
// package through its `exports` map, as a consumer's does), bundles one import
// at a time with esbuild (minified, for the browser) and checks the output:
//
// - a boolean import's bundle contains none of the message or organisation
//   strings, nor the `messages` and `organisations` modules;
// - as controls, `validate` and `describeCifOrganisation` do contain them, so
//   a change that hides the strings from this check makes it fail.
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { build } from "esbuild";

const PACKAGE = "nif-dni-nie-cif-validation";

/** Strings and modules that only validate() and describeCifOrganisation() use. */
const STRINGS = [
  "El carácter de control", // messages.ts, Spanish
  "The control character is not correct", // messages.ts, English
  "Limited liability company", // organisations.ts, English
  "Sociedad de responsabilidad limitada", // organisations.ts, Spanish
];
const MODULES = ["messages.mjs", "organisations.mjs"];

/** Imports that must bundle without the messages and organisation names. */
const LEAN = [
  "isValidNif",
  "isValidNaturalPersonNif",
  "isValidDni",
  "isValidNie",
  "isValidCif",
  "isValidSpanishVat",
  "normalize",
  "format",
  "computeControlCharacter",
];

/** Imports that do need them: proof that the check can see them. */
const FULL = ["validate", "describeCifOrganisation"];

const tarball = process.argv[2];
if (!tarball || !existsSync(tarball)) {
  console.error(
    "Usage: node scripts/check-tree-shaking.mjs <package tarball>\n" +
      "Create it with `pnpm pack`."
  );
  process.exit(2);
}

// Unpack into <tmp>/node_modules/<package>, like a package manager does.
const project = mkdtempSync(join(tmpdir(), "tree-shaking-"));
try {
  const modules = join(project, "node_modules");
  mkdirSync(modules);
  execFileSync("tar", ["-xzf", resolve(tarball), "-C", modules]);
  renameSync(join(modules, "package"), join(modules, PACKAGE));

  /** Bundles `import { name } from "<package>"`: its text and modules. */
  const bundle = async (name) => {
    const result = await build({
      stdin: {
        contents: `import { ${name} } from "${PACKAGE}"; console.log(${name});`,
        resolveDir: project,
      },
      bundle: true,
      minify: true,
      format: "esm",
      platform: "browser",
      // Keep non-ASCII characters as they are, so the strings can be found.
      charset: "utf8",
      write: false,
      metafile: true,
    });
    const text = result.outputFiles[0].text;
    // Modules that contribute code to the output. Every module the bundler
    // parsed is in `metafile.inputs`, even if tree shaking dropped all of it.
    const [output] = Object.values(result.metafile.outputs);
    const inputs = Object.entries(output.inputs)
      .filter(([, { bytesInOutput }]) => bytesInOutput > 0)
      .map(([file]) => file);
    return { text, inputs };
  };

  const problems = [];
  const report = (name, found) => {
    const status = found.length === 0 ? "ok" : "FAIL";
    console.log(`${status.padEnd(4)} ${name}`);
  };

  for (const name of LEAN) {
    const { text, inputs } = await bundle(name);
    const found = [
      ...STRINGS.filter((s) => text.includes(s)),
      ...MODULES.filter((m) => inputs.some((f) => f.endsWith(m))),
    ];
    report(`${name} bundles no messages or organisations`, found);
    if (found.length > 0) {
      problems.push(`${name} pulls in: ${found.join(", ")}`);
    }
    if (!inputs.some((f) => f.includes("dist/esm/"))) {
      problems.push(
        `${name} was not bundled from dist/esm (the import condition)`
      );
    }
  }

  for (const name of FULL) {
    const { text } = await bundle(name);
    const found = STRINGS.filter((s) => text.includes(s));
    const status = found.length > 0 ? "ok" : "FAIL";
    console.log(`${status.padEnd(4)} ${name} (control) bundles them`);
    if (found.length === 0) {
      problems.push(
        `${name} should bundle message or organisation strings, but none were found: the check can't see them`
      );
    }
  }

  if (problems.length > 0) {
    console.error(`\n${problems.join("\n")}`);
    process.exit(1);
  }
  console.log(`\nTree shaking OK for ${LEAN.length} lean imports.`);
} finally {
  rmSync(project, { recursive: true, force: true });
}
