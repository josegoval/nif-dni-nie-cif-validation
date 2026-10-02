"use strict";
// Smoke test for the packed tarball as CommonJS, run on the oldest supported
// Node with the built-in test runner. No dependencies on purpose: CI installs
// the tarball into an empty folder and runs this file from there, so `require`
// below resolves the package exactly as a consumer would (through the
// "require" condition of its `exports`). smoke.test.mjs does the same for ES
// modules. See the `compat` job in .github/workflows/release.yml.
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
  it("validate normalizes and describes a CIF, in Spanish", () => {
    const { es } = require("nif-dni-nie-cif-validation/locales/es");
    const result = lib.validate(" b-1234567-4 ", { locale: es });
    assert.equal(result.valid, true);
    assert.equal(result.normalized, "B12345674");
    assert.equal(
      result.meta.orgDescription,
      "Sociedad de responsabilidad limitada"
    );
  });
  it("a language code string is ignored: English", () => {
    const result = lib.validate("12345678A", { locale: "es" });
    assert.match(result.error.message, /^The control character/);
    assert.equal(
      lib.describeCifOrganisation("B", "es"),
      "Limited liability company"
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

// Every locale subpath (`exports`), required as CommonJS.
const LOCALES = ["en", "es", "ca", "eu", "gl"];

describe("locales", () => {
  for (const code of LOCALES) {
    it(`locales/${code} loads the CommonJS build, and validate uses it`, () => {
      const path = `nif-dni-nie-cif-validation/locales/${code}`;
      assert.match(
        require.resolve(path),
        new RegExp(`dist[\\\\/]cjs[\\\\/]locales[\\\\/]${code}\\.cjs$`)
      );
      const module = require(path);
      const locale = module[code];
      assert.equal(locale.code, code);
      assert.equal(module.default, locale);
      assert.equal(
        lib.validate("12345678A", { locale }).error.message,
        locale.messages.INVALID_CONTROL_CHARACTER("DNI", "Z")
      );
      assert.equal(
        lib.describeCifOrganisation("B", locale),
        locale.organisations.B
      );
    });
  }
});

// The opt-in test-data generators (`nif-dni-nie-cif-validation/generate`).
describe("generate", () => {
  const generate = require("nif-dni-nie-cif-validation/generate");

  it("loads the CommonJS build", () => {
    assert.match(
      require.resolve("nif-dni-nie-cif-validation/generate"),
      /dist[\\/]cjs[\\/]generate[\\/]index\.cjs$/
    );
    for (const name of [
      "generateDni",
      "generateNie",
      "generateCif",
      "generateNif",
      "generateInvalid",
      "createGenerator",
    ]) {
      assert.equal(typeof generate[name], "function", name);
    }
  });
  it("the core does not export the generators", () => {
    assert.equal(lib.generateDni, undefined);
  });
  it("gives valid values, the same for the same seed on every platform", () => {
    assert.equal(generate.generateDni({ seed: 1 }), "62707394X");
    assert.equal(generate.generateNie({ seed: 1 }), "Y0027357R");
    assert.equal(generate.generateCif({ seed: 1 }), "P0027357C");
    assert.equal(generate.generateNif({ seed: 1 }), "X5274470H");
    for (let i = 0; i < 50; i++) {
      assert.equal(lib.isValidNif(generate.generateNif()), true);
      assert.equal(lib.isValidNif(generate.generateNif({ seed: i })), true);
    }
  });
  it("generateInvalid gives the requested error code", () => {
    assert.equal(
      lib.validate(generate.generateInvalid("DNI", { seed: 1 })).error.code,
      "INVALID_CONTROL_CHARACTER"
    );
    assert.equal(
      lib.validate(
        generate.generateInvalid("CIF", { seed: 1, reason: "INVALID_LENGTH" })
      ).error.code,
      "INVALID_LENGTH"
    );
  });
  it("createGenerator makes a stream of different values", () => {
    const gen = generate.createGenerator(1);
    assert.equal(gen.dni(), "62707394X");
    assert.equal(gen.dni(), "00273574N");
  });
  it("a bad option throws a RangeError", () => {
    assert.throws(
      () => generate.generateCif({ orgKey: "B", control: "letter" }),
      {
        name: "RangeError",
      }
    );
  });
});

describe("package entry points", () => {
  it("require() loads the CommonJS build", () => {
    assert.match(
      require.resolve("nif-dni-nie-cif-validation"),
      /dist[\\/]cjs[\\/]index\.cjs$/
    );
  });
  it("package.json can be required", () => {
    const pkg = require("nif-dni-nie-cif-validation/package.json");
    assert.equal(pkg.name, "nif-dni-nie-cif-validation");
  });
  it("only the documented entry points can be required", () => {
    assert.throws(
      () => require("nif-dni-nie-cif-validation/dist/cjs/index.cjs"),
      { code: "ERR_PACKAGE_PATH_NOT_EXPORTED" }
    );
    assert.throws(() => require("nif-dni-nie-cif-validation/dist/index.js"), {
      code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
    });
  });
  it("import() from CommonJS loads the ES module build", async () => {
    const esm = await import("nif-dni-nie-cif-validation");
    assert.equal(typeof esm.validate, "function");
    assert.equal(esm.validate("12345678Z").valid, true);
  });
});
