import { describe, expect, it, } from "vitest";
import {
  DNI_REGEX,
  isValidCif,
  isValidCifControlCode,
  isValidDni,
  isValidDniLetter,
  isValidLegalEntityNif,
  isValidLegalEntityNifControlCode,
  isValidNaturalPersonNif,
  isValidNie,
  isValidNif,
} from "..";

// NORM-1: the canonical form is upper case; accepting lower case is convention.

const validators: Record<string, (value: string) => boolean> = {
  isValidNif,
  isValidNaturalPersonNif,
  isValidDni,
  isValidDniLetter,
  isValidNie,
  isValidLegalEntityNif,
  isValidCif,
  isValidLegalEntityNifControlCode,
  isValidCifControlCode,
};

const fixtures = [
  // valid DNI, K/L/M, NIE and CIF
  "36698729K",
  "57655929N",
  "K0867756N",
  "L3453453A",
  "M5566542J",
  "X9864761S",
  "Y2541026T",
  "Z9332057L",
  "A07727886",
  "N1847858F",
  "P1234567D",
  "R3838940I",
  "W7759996G",
  // invalid: wrong control letter
  "36698729A",
  "K0867756A",
  "X9864761A",
  "P1234567E",
];

function mixedCase(value: string): string {
  return value
    .split("")
    .map((char, i) => (i % 2 ? char.toLowerCase() : char.toUpperCase()))
    .join("");
}

describe("NORM-1: every exported validator ignores case (#33, #37)", () => {
  Object.entries(validators).forEach(([name, validate]) => {
    it.each(fixtures)(`NORM-1: ${name}(%s) === lower === mixed case`, (s) => {
      const expected = validate(s);
      expect(validate(s.toLowerCase())).toBe(expected);
      expect(validate(mixedCase(s))).toBe(expected);
    });
  });
});

describe("NORM-1: DNI, K/L/M and NIE reproduction from #37", () => {
  it("NORM-1: DNI_REGEX accepts 36698729k", () =>
    expect(DNI_REGEX.test("36698729k")).toBe(true));
  it("NORM-1: isValidDni('36698729k') is true", () =>
    expect(isValidDni("36698729k")).toBe(true));
  it("NORM-1: isValidNie('x9864761s') is true", () =>
    expect(isValidNie("x9864761s")).toBe(true));
  it("NORM-1: isValidNie('X9864761s') is true", () =>
    expect(isValidNie("X9864761s")).toBe(true));
  it("NORM-1: isValidNif('k0867756n') is true", () =>
    expect(isValidNif("k0867756n")).toBe(true));
  it("NORM-1: isValidDniLetter('36698729k') is true", () =>
    expect(isValidDniLetter("36698729k")).toBe(true));
});

describe("NORM-1: lower case with a wrong control letter is still invalid", () => {
  it.each(["36698729a", "k0867756a", "x9864761a", "y2541026a", "z9332057a"])(
    "NORM-1: %s is invalid",
    (value) => expect(isValidNif(value)).toBe(false)
  );
});

describe("NORM-1: non-ASCII look-alikes are not folded to ASCII", () => {
  // toUpperCase() maps U+017F (long s) to "S"; X9864761S is a valid NIE.
  it("NORM-1: X9864761ſ is invalid", () => {
    expect(isValidNie("X9864761ſ")).toBe(false);
    expect(isValidNif("X9864761ſ")).toBe(false);
  });
});
