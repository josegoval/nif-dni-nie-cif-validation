// Proves the packed tarball tree-shakes:
//
// - an application that imports only the boolean validators bundles no text
//   at all: no locale, and none of the modules that pick a text;
// - `validate` and `describeCifOrganisation` bundle English (built in) and no
//   other language;
// - a language (`<package>/locales/<code>`) bundles only itself, and with
//   `validate` only itself and English.
//
// Usage: node scripts/check-tree-shaking.mjs <package tarball>
//
// It unpacks the tarball into a temporary project (so the bundler resolves the
// package and its locale subpaths through the `exports` map, as a consumer's
// does), bundles one snippet at a time with esbuild (minified, for the
// browser) and looks for each locale's marker strings and module in the
// output. Each check that expects a locale also proves the markers can be
// found, so a change that hides them from this script makes it fail.
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

/**
 * Each locale: strings only it contains (its INVALID_CONTROL_CHARACTER
 * message and its name for organisation key B), and its module.
 */
const LOCALES = {
  en: ["The control character is not correct", "Limited liability company"],
  es: ["El carácter de control", "Sociedad de responsabilidad limitada"],
  ca: ["El caràcter de control", "Societat de responsabilitat limitada"],
  eu: ["Kontrol-karakterea ez da zuzena", "Erantzukizun mugatuko sozietatea"],
  gl: ["O carácter de control", "Sociedade de responsabilidade limitada"],
};
const CODES = Object.keys(LOCALES);
const localeModule = (code) => `locales/${code}.mjs`;

/** Modules that only validate() and describeCifOrganisation() need. */
const TEXT_MODULES = ["localize.mjs", "organisations.mjs"];

/** Imports that must bundle no text at all. */
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
  "getNifType",
];

/** Imports that bundle English, and no other language. */
const ENGLISH_ONLY = ["validate", "describeCifOrganisation"];

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

  /** Bundles `contents`: its text and the modules that contribute code. */
  const bundle = async (contents) => {
    const result = await build({
      stdin: { contents, resolveDir: project },
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
    // Every module the bundler parsed is in `metafile.inputs`, even if tree
    // shaking dropped all of it, so keep those that contribute bytes.
    const [output] = Object.values(result.metafile.outputs);
    const inputs = Object.entries(output.inputs)
      .filter(([, { bytesInOutput }]) => bytesInOutput > 0)
      .map(([file]) => file);
    return { text, inputs };
  };

  /** Which locales a bundle contains, by marker string or by module. */
  const localesIn = ({ text, inputs }) =>
    CODES.filter(
      (code) =>
        LOCALES[code].some((marker) => text.includes(marker)) ||
        inputs.some((file) => file.endsWith(localeModule(code)))
    );

  const problems = [];
  const check = (label, ok, problem) => {
    console.log(`${(ok ? "ok" : "FAIL").padEnd(4)} ${label}`);
    if (!ok) problems.push(`${label}: ${problem}`);
  };
  const same = (a, b) => a.join() === b.join();

  for (const name of LEAN) {
    const result = await bundle(
      `import { ${name} } from "${PACKAGE}"; console.log(${name});`
    );
    const found = [
      ...localesIn(result),
      ...TEXT_MODULES.filter((m) => result.inputs.some((f) => f.endsWith(m))),
    ];
    check(
      `${name} bundles no text`,
      found.length === 0,
      `pulls in ${found.join(", ")}`
    );
    if (!result.inputs.some((f) => f.includes("dist/esm/"))) {
      problems.push(
        `${name} was not bundled from dist/esm (the import condition)`
      );
    }
  }

  for (const name of ENGLISH_ONLY) {
    const found = localesIn(
      await bundle(
        `import { ${name} } from "${PACKAGE}"; console.log(${name});`
      )
    );
    check(
      `${name} bundles English only`,
      same(found, ["en"]),
      `bundles [${found.join(", ")}]`
    );
  }

  for (const code of CODES) {
    const alone = localesIn(
      await bundle(
        `import { ${code} } from "${PACKAGE}/locales/${code}"; console.log(${code});`
      )
    );
    check(
      `locales/${code} bundles ${code} only`,
      same(alone, [code]),
      `bundles [${alone.join(", ")}]`
    );
    const withValidate = localesIn(
      await bundle(
        `import { validate } from "${PACKAGE}";\n` +
          `import { ${code} } from "${PACKAGE}/locales/${code}";\n` +
          `console.log(validate("", { locale: ${code} }));`
      )
    );
    const expected = code === "en" ? ["en"] : ["en", code];
    check(
      `validate + locales/${code} bundles ${expected.join(" and ")} only`,
      same(withValidate, expected),
      `bundles [${withValidate.join(", ")}]`
    );
  }

  if (problems.length > 0) {
    console.error(`\n${problems.join("\n")}`);
    process.exit(1);
  }
  console.log(
    `\nTree shaking OK: ${LEAN.length} lean imports, ${CODES.length} locales.`
  );
} finally {
  rmSync(project, { recursive: true, force: true });
}
