import { describe, expect, it } from "vitest";
import { isValidDni, isValidDniLetter, isValidNif } from "..";

const testCases = [
  { text: "whatever", expect: false },
  { text: "36698729K", expect: true },
  { text: "57655929N", expect: true },
  { text: "41989851Q", expect: true },
  { text: "K0867756N", expect: true },
  { text: "L3453453A", expect: true },
  { text: "M5566542J", expect: true },
  { text: "41989851A", expect: false },
  { text: "4198981Q", expect: false },
  { text: "Z9332057L", expect: false },
  { text: "R7465845A", expect: false },
];

describe("dni validation", () => {
  testCases.forEach((testCase) => {
    it(`test case ${testCase.text}`, () =>
      expect(isValidDni(testCase.text)).toBe(testCase.expect));
  });
});

describe("KLM-1 / KLM-3: K, L or M + 7 digits + check letter", () => {
  it("KLM-1: K, L and M are the only letter prefixes of a DNI-style NIF", () => {
    expect(isValidDni("K1234567L")).toBe(true);
    expect(isValidDni("J1234567L")).toBe(false);
    expect(isValidNif("K1234567L")).toBe(true);
  });

  it("KLM-1: exactly 7 characters follow the prefix", () => {
    expect(isValidDni("K12345678L")).toBe(false);
    expect(isValidDni("K123456L")).toBe(false);
  });

  it("KLM-3: the 7 characters are digits", () => {
    expect(isValidDni("K123456AL")).toBe(false);
    expect(isValidNif("K123456AL")).toBe(false);
  });
});

// isValidDniLetter does not check the format (see its @WARNING). These pin
// its v1 behaviour, which the rewrite keeps exactly.
describe("DNI-2: isValidDniLetter keeps its v1 behaviour", () => {
  it("DNI-2: every ASCII digit anywhere in the string forms the number", () =>
    expect(isValidDniLetter("1-2-3-4-5-6-7-8-Z")).toBe(true));

  it("KLM-2: a K, L or M prefix counts as nothing", () =>
    expect(isValidDniLetter("K1234567L")).toBe(true));

  it("DNI-2: more than 15 digits are read as the nearest double, as in v1", () => {
    // 12345678901234567 mod 23 = 18 (H), but the nearest double,
    // 12345678901234568, gives 19 (L).
    expect(isValidDniLetter("12345678901234567L")).toBe(true);
    expect(isValidDniLetter("12345678901234567H")).toBe(false);
    // Over ~309 digits the number is Infinity, and v1 read index 0 (T).
    expect(isValidDniLetter(`${"9".repeat(400)}T`)).toBe(true);
  });

  it("NORM-1: the last character is compared after toUpperCase(), as in v1", () => {
    // "ﬅ" upper-cases to "ST", which ends in T, the letter of 00000000.
    expect(isValidDniLetter("00000000ﬅ")).toBe(true);
    // "ı" upper-cases to "I", which is never a check letter (DNI-3).
    expect(isValidDniLetter("00000000ı")).toBe(false);
  });

  it("DNI-1: the empty string has no letter", () =>
    expect(isValidDniLetter("")).toBe(false));
});
