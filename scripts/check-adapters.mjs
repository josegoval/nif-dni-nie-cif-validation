// Checks that the schema adapters of the packed tarball (`/zod`, `/valibot`
// and `/yup`) import their schema library correctly, from the ES module build
// and from the CommonJS build, and work with the real library.
//
// Usage: node scripts/check-adapters.mjs <package tarball>
//
// The smoke tests in test/smoke have no dependencies on purpose, so they
// can't cover this. This script unpacks the tarball into a temporary project,
// as a package manager does, and puts the schema libraries that this
// repository installed as development dependencies next to it (links to the
// real installs, nothing is downloaded; set PEERS_NODE_MODULES to another
// node_modules folder, for example one with the oldest supported versions of
// the libraries, to check those). Then it runs one program as an ES
// module (`import`) and one as CommonJS (`require`), each using the three
// adapters. A wrong import in one format (for example a named import that
// Node can't find in a CommonJS library, which Yup is) fails here instead of
// in a user's application.
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE = "nif-dni-nie-cif-validation";
const PEERS = ["zod", "valibot", "yup"];
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** The node_modules folder that has the schema libraries to link. */
const peersDir = resolve(
  process.env.PEERS_NODE_MODULES ?? join(root, "node_modules")
);

const tarball = process.argv[2];
if (!tarball || !existsSync(tarball)) {
  console.error(
    "Usage: node scripts/check-adapters.mjs <package tarball>\n" +
      "Create it with `pnpm pack`."
  );
  process.exit(2);
}

/** What each program checks, written once for both module formats. */
const CHECKS = `
const SPANISH = "El carácter de control no es correcto: para este DNI debería ser «Z».";

// Zod: the output is normalized, the message is localized, the params have
// the code and the rule.
assert.equal(zNif({ locale: es }).parse(" 12.345.678-z "), "12345678Z");
assert.equal(zCif().parse("b-1234567-4"), "B12345674");
const zodResult = zDni({ locale: es }).safeParse("12345678A");
assert.equal(zodResult.success, false);
assert.equal(zodResult.error.issues[0].message, SPANISH);
assert.deepEqual(zodResult.error.issues[0].params, {
  code: "INVALID_CONTROL_CHARACTER",
  rule: "DNI-2",
  expected: "Z",
});

// Valibot.
assert.equal(valibot.parse(vNif({ locale: es }), " 12.345.678-z "), "12345678Z");
assert.equal(valibot.parse(vNie(), "x01234567l"), "X1234567L");
const valibotResult = valibot.safeParse(vDni({ locale: es }), "12345678A");
assert.equal(valibotResult.success, false);
assert.equal(valibotResult.issues[0].message, SPANISH);
assert.equal(valibotResult.issues[0].code, "INVALID_CONTROL_CHARACTER");
assert.equal(valibotResult.issues[0].rule, "DNI-2");

// Yup.
assert.equal(yNif({ locale: es }).validateSync(" 12.345.678-z "), "12345678Z");
assert.equal(ySpanishVat().validateSync("es b-1234567-4"), "ESB12345674");
assert.throws(() => yDni({ locale: es }).validateSync("12345678A"), (error) => {
  assert.equal(error.name, "ValidationError");
  assert.equal(error.message, SPANISH);
  assert.equal(error.params.code, "INVALID_CONTROL_CHARACTER");
  assert.equal(error.params.rule, "DNI-2");
  return true;
});

console.log("ok");
`;

const ES_MODULE = `import assert from "node:assert/strict";
import * as valibot from "valibot";
import { zNif, zDni, zCif } from "${PACKAGE}/zod";
import { vNif, vDni, vNie } from "${PACKAGE}/valibot";
import { yNif, yDni, ySpanishVat } from "${PACKAGE}/yup";
import { es } from "${PACKAGE}/locales/es";
${CHECKS}`;

const COMMON_JS = `"use strict";
const assert = require("node:assert/strict");
const valibot = require("valibot");
const { zNif, zDni, zCif } = require("${PACKAGE}/zod");
const { vNif, vDni, vNie } = require("${PACKAGE}/valibot");
const { yNif, yDni, ySpanishVat } = require("${PACKAGE}/yup");
const { es } = require("${PACKAGE}/locales/es");
${CHECKS}`;

const project = mkdtempSync(join(tmpdir(), "adapters-"));
let failed = false;
try {
  // Unpack into <tmp>/node_modules/<package>, like a package manager does.
  const modules = join(project, "node_modules");
  mkdirSync(modules);
  execFileSync("tar", ["-xzf", resolve(tarball), "-C", modules]);
  renameSync(join(modules, "package"), join(modules, PACKAGE));
  // The schema libraries, as the application would have installed them.
  // Linking the real directory lets each one find its own dependencies.
  for (const peer of PEERS) {
    const installed = join(peersDir, peer);
    if (!existsSync(installed)) {
      throw new Error(`${peer} is not installed in ${peersDir}`);
    }
    symlinkSync(realpathSync(installed), join(modules, peer), "dir");
  }

  for (const [format, file, code] of [
    ["ES module (import)", "check.mjs", ES_MODULE],
    ["CommonJS (require)", "check.cjs", COMMON_JS],
  ]) {
    writeFileSync(join(project, file), code);
    try {
      const output = execFileSync(process.execPath, [file], {
        cwd: project,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      console.log(`ok   ${format}: ${output.trim()}`);
    } catch (error) {
      failed = true;
      console.error(`FAIL ${format}\n${error.stderr || error.message}`);
    }
  }
} finally {
  rmSync(project, { recursive: true, force: true });
}
if (failed) process.exit(1);
console.log("\nAdapters OK: zod, valibot and yup, from import and require.");
