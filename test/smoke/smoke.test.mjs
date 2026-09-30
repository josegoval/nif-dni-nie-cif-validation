// Smoke test of the packed tarball as an ES module, on the oldest supported
// Node, with the built-in test runner. Like smoke.test.cjs it has no
// dependencies: CI installs the tarball into an empty folder and runs this
// file from there, so `import` below resolves the package exactly as a
// consumer would (through the "import" condition of its `exports`). See the
// `compat` job in .github/workflows/release.yml.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import * as esm from "nif-dni-nie-cif-validation";
// The namespace above, and the named imports below: linking fails if the ES
// module build lacks one of them.
import {
  CIF_CONTROL_LETTERS,
  CIF_REGEX,
  computeControlCharacter,
  DNI_CONTROL_LETTERS,
  DNI_REGEX,
  describeCifOrganisation,
  format,
  getNifType,
  isValidCif,
  isValidCifControlCode,
  isValidDni,
  isValidDniLetter,
  isValidLegalEntityNif,
  isValidLegalEntityNifControlCode,
  isValidNaturalPersonNif,
  isValidNie,
  isValidNif,
  isValidSpanishVat,
  LEGAL_ENTITY_CONTROL_LETTERS,
  LEGAL_ENTITY_NIF_REGEX,
  NIE_REGEX,
  normalize,
  replaceNieLetter,
  validate,
} from "nif-dni-nie-cif-validation";

const cjs = createRequire(import.meta.url)("nif-dni-nie-cif-validation");

describe("ES module build", () => {
  it("exports the same names as the CommonJS build", () => {
    const names = (lib) =>
      Object.keys(lib)
        .filter((name) => name !== "__esModule" && name !== "default")
        .sort();
    assert.deepEqual(names(esm), names(cjs));
    assert.ok(names(esm).length >= 24);
  });

  it("exports functions, strings and regular expressions", () => {
    for (const fn of [
      isValidNif,
      isValidNaturalPersonNif,
      isValidDniLetter,
      isValidDni,
      isValidNie,
      replaceNieLetter,
      isValidLegalEntityNifControlCode,
      isValidCifControlCode,
      isValidLegalEntityNif,
      isValidCif,
      validate,
      getNifType,
      normalize,
      format,
      computeControlCharacter,
      describeCifOrganisation,
      isValidSpanishVat,
    ]) {
      assert.equal(typeof fn, "function");
    }
    for (const letters of [
      DNI_CONTROL_LETTERS,
      LEGAL_ENTITY_CONTROL_LETTERS,
      CIF_CONTROL_LETTERS,
    ]) {
      assert.equal(typeof letters, "string");
    }
    for (const regex of [
      DNI_REGEX,
      NIE_REGEX,
      LEGAL_ENTITY_NIF_REGEX,
      CIF_REGEX,
    ]) {
      assert.ok(regex instanceof RegExp);
    }
  });

  it("CIF names are aliases of the legal entity names", () => {
    assert.equal(isValidCif, isValidLegalEntityNif);
    assert.equal(isValidCifControlCode, isValidLegalEntityNifControlCode);
    assert.equal(CIF_REGEX, LEGAL_ENTITY_NIF_REGEX);
    assert.equal(CIF_CONTROL_LETTERS, LEGAL_ENTITY_CONTROL_LETTERS);
  });

  it("isValidNif accepts valid documents and rejects invalid ones", () => {
    for (const value of ["12345678Z", "X1234567L", "K1234567L", "A58818501"]) {
      assert.equal(isValidNif(value), true, value);
    }
    for (const value of ["12345678A", "Y1234567L", "T12345678"]) {
      assert.equal(isValidNif(value), false, value);
    }
    assert.equal(isValidNif(null), false);
  });

  it("validate explains a wrong control character", () => {
    const result = validate("12345678A");
    assert.equal(result.valid, false);
    assert.equal(result.type, "DNI");
    assert.equal(result.error.code, "INVALID_CONTROL_CHARACTER");
    assert.equal(result.error.rule, "DNI-2");
    assert.equal(result.error.expected, "Z");
  });

  it("validate normalizes and describes a CIF, in Spanish", () => {
    const result = validate(" b-1234567-4 ", { locale: "es" });
    assert.equal(result.valid, true);
    assert.equal(result.normalized, "B12345674");
    assert.equal(
      result.meta.orgDescription,
      "Sociedad de responsabilidad limitada"
    );
  });

  it("normalize, format and computeControlCharacter work", () => {
    assert.equal(normalize(" x-0123456-7l "), "X1234567L");
    assert.equal(format("12345678z"), "12345678-Z");
    assert.equal(computeControlCharacter("B1234567"), "4");
  });

  it("only the documented entry points can be imported", async () => {
    await assert.rejects(
      import("nif-dni-nie-cif-validation/dist/esm/index.mjs"),
      { code: "ERR_PACKAGE_PATH_NOT_EXPORTED" }
    );
  });
});
