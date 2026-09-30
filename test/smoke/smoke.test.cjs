"use strict";
// Smoke test for the packed tarball, run on the oldest supported Node with the
// built-in test runner. No dependencies on purpose: CI installs the tarball
// into an empty folder and runs this file from there, so `require` below
// resolves the package exactly as a consumer would. See the `compat` job in
// .github/workflows/release.yml.
const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const lib = require("nif-dni-nie-cif-validation");

const FUNCTIONS = [
  "isValidNif",
  "isValidNaturalPersonNif",
  "isValidDniLetter",
  "isValidDni",
  "isValidNie",
  "replaceNieLetter",
  "isValidLegalEntityNifControlCode",
  "isValidCifControlCode",
  "isValidLegalEntityNif",
  "isValidCif",
  // v2
  "validate",
  "getNifType",
  "normalize",
  "format",
  "computeControlCharacter",
  "describeCifOrganisation",
  "isValidSpanishVat",
];
const STRINGS = [
  "DNI_CONTROL_LETTERS",
  "LEGAL_ENTITY_CONTROL_LETTERS",
  "CIF_CONTROL_LETTERS",
];
const REGEXES = [
  "DNI_REGEX",
  "NIE_REGEX",
  "LEGAL_ENTITY_NIF_REGEX",
  "CIF_REGEX",
];

describe("public exports", () => {
  for (const name of FUNCTIONS) {
    it(`${name} is a function`, () =>
      assert.equal(typeof lib[name], "function"));
  }
  for (const name of STRINGS) {
    it(`${name} is a string`, () => assert.equal(typeof lib[name], "string"));
  }
  for (const name of REGEXES) {
    it(`${name} is a RegExp`, () => assert.ok(lib[name] instanceof RegExp));
  }
  it("CIF names are aliases of the legal entity names", () => {
    assert.equal(lib.isValidCif, lib.isValidLegalEntityNif);
    assert.equal(
      lib.isValidCifControlCode,
      lib.isValidLegalEntityNifControlCode
    );
    assert.equal(lib.CIF_REGEX, lib.LEGAL_ENTITY_NIF_REGEX);
    assert.equal(lib.CIF_CONTROL_LETTERS, lib.LEGAL_ENTITY_CONTROL_LETTERS);
  });
});

// Values from SPEC.md.
describe("isValidNif", () => {
  const valid = [
    "12345678Z", // DNI
    "01234567L", // DNI with a leading zero
    "X1234567L", // NIE
    "Y1234567X",
    "Z1234567R",
    "X01234567L", // old NIE form
    "K1234567L", // DNI K
    "A58818501", // CIF, digit control
    "B12345674",
    "P2807900B", // CIF, letter control (Ayuntamiento de Madrid)
    "Q2826000H", // CIF, letter control (AEAT)
    "N1234567D",
    "12345678z", // lower case
  ];
  for (const value of valid) {
    it(`accepts ${value}`, () => assert.equal(lib.isValidNif(value), true));
  }

  const invalid = [
    "12345678A", // wrong control letter
    "Y1234567L",
    "N18478586", // letter control expected
    "T12345678", // no official prefix
  ];
  for (const value of invalid) {
    it(`rejects ${value}`, () => assert.equal(lib.isValidNif(value), false));
  }

  it("returns false for null instead of throwing", () => {
    assert.equal(lib.isValidNif(null), false);
  });
});

describe("specific validators", () => {
  it("isValidDni accepts a DNI and a DNI K", () => {
    assert.equal(lib.isValidDni("12345678Z"), true);
    assert.equal(lib.isValidDni("K1234567L"), true);
  });
  it("isValidNie accepts the old NIE form", () => {
    assert.equal(lib.isValidNie("X01234567L"), true);
  });
  it("isValidCif accepts CIFs and rejects a DNI", () => {
    assert.equal(lib.isValidCif("A58818501"), true);
    assert.equal(lib.isValidCif("P2807900B"), true);
    assert.equal(lib.isValidCif("12345678Z"), false);
  });
});

describe("v2 API", () => {
  it("validate explains a wrong control character", () => {
    const result = lib.validate("12345678A");
    assert.equal(result.valid, false);
    assert.equal(result.type, "DNI");
    assert.equal(result.error.code, "INVALID_CONTROL_CHARACTER");
    assert.equal(result.error.rule, "DNI-2");
    assert.equal(result.error.expected, "Z");
  });
  it("validate normalizes and describes a CIF", () => {
    const result = lib.validate(" b-1234567-4 ", { locale: "es" });
    assert.equal(result.valid, true);
    assert.equal(result.normalized, "B12345674");
    assert.equal(
      result.meta.orgDescription,
      "Sociedad de responsabilidad limitada"
    );
  });
  it("the booleans follow CIF-3 by default and restore v1 on request", () => {
    assert.equal(lib.isValidCif("G1234567D"), false);
    const v1 = { normalize: false, cifControl: "lenient" };
    assert.equal(lib.isValidCif("G1234567D", v1), true);
    assert.equal(lib.isValidNif(" 12.345.678-Z "), true);
    assert.equal(lib.isValidNif(" 12.345.678-Z ", v1), false);
  });
  it("normalize, format, computeControlCharacter and isValidSpanishVat", () => {
    assert.equal(lib.normalize(" x-0123456-7l "), "X1234567L");
    assert.equal(lib.format("12345678z"), "12345678-Z");
    assert.equal(lib.computeControlCharacter("B1234567"), "4");
    assert.equal(lib.isValidSpanishVat("ES12345678Z"), true);
  });
});
