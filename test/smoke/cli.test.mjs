// Smoke test of the command line interface of the packed tarball, on the
// oldest supported Node, with the built-in test runner. Like the other smoke
// tests it has no dependencies: it runs from a folder where the tarball is
// installed, and calls `npx nif-dni-nie-cif-validation` as a user would, so
// npx finds the package's `bin` in node_modules/.bin. (npx runs offline, so
// it can't download the published version if the bin were missing.) See the
// `compat` job in .github/workflows/release.yml, and `pnpm smoke` to run it
// locally.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

/** Runs `npx nif-dni-nie-cif-validation <args>` and logs what it printed. */
function npx(args) {
  const result = spawnSync("npx", ["nif-dni-nie-cif-validation", ...args], {
    encoding: "utf8",
    env: { ...process.env, npm_config_offline: "true" },
  });
  console.log(`$ npx nif-dni-nie-cif-validation ${args.join(" ")}`);
  console.log(`${result.stdout}${result.stderr}(exit code ${result.status})`);
  return result;
}

describe("npx nif-dni-nie-cif-validation", () => {
  it("validate 12345678Z --json prints its ValidationResult, exit code 0", () => {
    const result = npx(["validate", "12345678Z", "--json"]);
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout), [
      { input: "12345678Z", valid: true, type: "DNI", normalized: "12345678Z" },
    ]);
  });

  it("an invalid value gives exit code 1, with the rule and the message", () => {
    const result = npx(["validate", "12345678A"]);
    assert.equal(result.status, 1);
    assert.equal(
      result.stdout,
      '12345678A: invalid [DNI-2 INVALID_CONTROL_CHARACTER] The control character is not correct: for this DNI it should be "Z".\n'
    );
  });

  it("a usage error gives exit code 2", () => {
    const result = npx(["validate", "--strict", "12345678Z"]);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
  });

  it("--version prints the installed version", () => {
    const { version } = createRequire(import.meta.url)(
      "nif-dni-nie-cif-validation/package.json"
    );
    const result = npx(["--version"]);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, `${version}\n`);
  });

  it("generate, type, normalize and check work", () => {
    assert.equal(npx(["generate", "dni", "--seed", "1"]).stdout, "62707394X\n");
    assert.equal(npx(["type", "x1234567l"]).stdout, "NIE\n");
    assert.equal(npx(["normalize", " b-1234567-4 "]).stdout, "B12345674\n");
    writeFileSync("smoke.csv", '﻿id;nif\r\n1;"12345678Z"\r\n2;B12345675\r\n');
    const check = npx([
      "check",
      "--file",
      "smoke.csv",
      "--column",
      "nif",
      "--delimiter",
      ";",
    ]);
    assert.equal(check.status, 1);
    assert.match(check.stdout, /^row 3: B12345675: invalid \[CIF-4 /);
  });
});
