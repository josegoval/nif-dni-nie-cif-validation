import { describe, expect, it } from "vitest";
import { isValidCif, isValidCifControlCode, isValidLegalEntityNif } from "..";

const testCases = [
  { text: "whatever", expect: false },
  { text: "Z9332057L", expect: false },
  { text: "X9864761S", expect: false },
  { text: "Y2541026T", expect: false },
  { text: "Y2541026A", expect: false },
  { text: "U2541026T", expect: false },
  { text: "22541026T", expect: false },
  { text: "9332057L", expect: false },
  { text: "04618341X", expect: false },
  { text: "A07727886", expect: true },
  { text: "B91662627", expect: true },
  { text: "B72327000", expect: true },
  { text: "C90684846", expect: true },
  { text: "D78118080", expect: true },
  { text: "E05070164", expect: true },
  { text: "F49420151", expect: true },
  { text: "G21111513", expect: true },
  { text: "H37648599", expect: true },
  { text: "J34790493", expect: true },
  { text: "N1847858F", expect: true },
  { text: "P5925945G", expect: true },
  { text: "Q2106894E", expect: true },
  { text: "R3838940I", expect: true },
  { text: "S7345549E", expect: true },
  { text: "U07984792", expect: true },
  { text: "V23932064", expect: true },
  { text: "W7759996G", expect: true },
  // does not allow old cases
  // { text: "K3841569T", expect: true },
  // { text: "L2841589T", expect: true },
  // { text: "M5275115T", expect: true },
];

describe("legal entity nif validation", () => {
  testCases.forEach((testCase) => {
    it(`test case ${testCase.text}`, () =>
      expect(isValidLegalEntityNif(testCase.text)).toBe(testCase.expect));
  });
});

describe("CIF-3: the control type depends only on the organisation key (#33)", () => {
  it("CIF-3: B00123455 is valid (B takes a digit, even when the number starts with 00)", () =>
    expect(isValidCif("B00123455")).toBe(true));

  it("CIF-3: B0012345E is invalid (there is no '00 means letter' rule)", () =>
    expect(isValidCif("B0012345E")).toBe(false));
});

describe("CIF-3: N takes a letter control (#38)", () => {
  it("CIF-3: N requires a letter control, so N18478586 is invalid", () =>
    expect(isValidCif("N18478586")).toBe(false));

  it("CIF-3: N1234567D is valid", () =>
    expect(isValidCif("N1234567D")).toBe(true));

  it("CIF-3: N12345674 is invalid (digit control)", () =>
    expect(isValidCif("N12345674")).toBe(false));

  it("CIF-3: n1234567d is valid (NORM-1)", () =>
    expect(isValidCif("n1234567d")).toBe(true));

  it("CIF-3: isValidCifControlCode rejects a digit control for N", () =>
    expect(isValidCifControlCode("N18478586")).toBe(false));

  // v1 keeps the lenient behaviour for C D F G J U V; v2 makes them digit-only.
  it("CIF-3: G1234567D keeps its v1 behaviour (lenient until v2)", () =>
    expect(isValidCif("G1234567D")).toBe(true));
});

describe("NORM-1: CIF validation is case-insensitive (#33)", () => {
  it("NORM-1: p1234567d gives the same result as P1234567D", () => {
    expect(isValidCif("P1234567D")).toBe(true);
    expect(isValidCif("p1234567d")).toBe(true);
  });

  it.each(["P1234567d", "p1234567D", "r3838940i", "n1847858f", "w7759996g"])(
    "NORM-1: %s (lower or mixed case letter control) is valid",
    (cif) => expect(isValidCif(cif)).toBe(true)
  );

  it.each(["a07727886", "b12345674", "g21111513", "v23932064"])(
    "NORM-1: %s (lower-case key, digit control) is valid",
    (cif) => expect(isValidCif(cif)).toBe(true)
  );

  it.each(["p1234567e", "p1234567a", "r3838940j"])(
    "NORM-1: %s (lower case, wrong control letter) is still invalid",
    (cif) => expect(isValidCif(cif)).toBe(false)
  );

  it("NORM-1: isValidCifControlCode is case-insensitive", () => {
    expect(isValidCifControlCode("P1234567D")).toBe(true);
    expect(isValidCifControlCode("p1234567d")).toBe(true);
    expect(isValidCifControlCode("p1234567e")).toBe(false);
  });

  // toUpperCase() maps U+0131 (dotless i) to "I" and U+017F (long s) to "S".
  it.each(["R3838940ı", "ſ7345549E"])(
    "NORM-1: non-ASCII look-alike %s is still invalid",
    (cif) => expect(isValidCif(cif)).toBe(false)
  );
});

// isValidCifControlCode does not check the format (see its @WARNING). These
// pin its v1 behaviour, which the rewrite keeps exactly.
describe("CIF-4: isValidCifControlCode keeps its v1 behaviour", () => {
  it("CIF-4: white space in a digit position counts as 0, as `+' '` did", () => {
    expect(isValidCifControlCode("A 7727886")).toBe(true);
    expect(isValidCifControlCode("A0000000 ")).toBe(true);
  });

  it("CIF-1: a missing digit makes the control invalid", () =>
    expect(isValidCifControlCode("A123456")).toBe(false));

  it("CIF-3: a first character that is not a key takes a letter or a digit", () => {
    // P1234567D is valid, so the control of 1234567 is 4 (D).
    expect(isValidCifControlCode("X1234567D")).toBe(true);
    expect(isValidCifControlCode("X12345674")).toBe(true);
  });

  it("NORM-1: characters are read after toUpperCase(), as in v1", () => {
    // "ﬃ" upper-cases to "FFI": the control is then the final I, which is
    // the letter of 3838940 (R3838940I is valid).
    expect(isValidCifControlCode("C3838940ﬃ")).toBe(true);
    expect(isValidCifControlCode("P3838940ﬃ")).toBe(true);
    // "ß" upper-cases to "SS" and moves every position by one.
    expect(isValidCifControlCode("ß1234567D")).toBe(false);
  });
});
