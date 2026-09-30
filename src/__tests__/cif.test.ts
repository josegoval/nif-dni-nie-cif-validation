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

  it("CIF-3: G requires a digit control, so G1234567D is invalid (#38)", () =>
    expect(isValidCif("G1234567D")).toBe(false));

  it("CIF-3: G1234567D is valid with cifControl: 'lenient' (#38)", () =>
    expect(isValidCif("G1234567D", { cifControl: "lenient" })).toBe(true));
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
// pin its v1 behaviour, which the v1-compatible options keep exactly.
const V1 = { normalize: false, cifControl: "lenient" } as const;

describe("CIF-4: isValidCifControlCode keeps its v1 behaviour with the v1-compatible options", () => {
  it("CIF-4: white space in a digit position counts as 0, as `+' '` did", () => {
    expect(isValidCifControlCode("A 7727886", V1)).toBe(true);
    expect(isValidCifControlCode("A0000000 ", V1)).toBe(true);
  });

  it("CIF-1: a missing digit makes the control invalid", () =>
    expect(isValidCifControlCode("A123456", V1)).toBe(false));

  it("CIF-3: a first character that is not a key takes a letter or a digit", () => {
    // P1234567D is valid, so the control of 1234567 is 4 (D).
    expect(isValidCifControlCode("X1234567D", V1)).toBe(true);
    expect(isValidCifControlCode("X12345674", V1)).toBe(true);
  });

  it("CIF-3: by default, a first character that is not a key has no valid control", () => {
    expect(isValidCifControlCode("X1234567D")).toBe(false);
    expect(isValidCifControlCode("X12345674")).toBe(false);
  });

  it("NORM-1: characters are read after toUpperCase(), as in v1", () => {
    // "ﬃ" upper-cases to "FFI": the control is then the final I, which is
    // the letter of 3838940 (R3838940I is valid).
    expect(isValidCifControlCode("C3838940ﬃ", V1)).toBe(true);
    expect(isValidCifControlCode("P3838940ﬃ", V1)).toBe(true);
    // "ß" upper-cases to "SS" and moves every position by one.
    expect(isValidCifControlCode("ß1234567D", V1)).toBe(false);
    // By default C takes a digit (CIF-3), so the letter I is rejected.
    expect(isValidCifControlCode("C3838940ﬃ")).toBe(false);
    expect(isValidCifControlCode("P3838940ﬃ")).toBe(true);
  });
});

// CIF-3 (#38): the control type of all 17 organisation keys, with a digit
// and with a letter control, in both modes. The control of 1234567 is 4 (D).
describe("CIF-3: control type of every organisation key, official and lenient", () => {
  const DIGIT_KEYS = "ABCDEFGHJUV";
  const LENIENT_KEYS = "CDFGJUV";
  for (const key of "ABCDEFGHJNPQRSUVW") {
    const digitKey = DIGIT_KEYS.includes(key);
    const lenientKey = LENIENT_KEYS.includes(key);
    it(`CIF-3: ${key}1234567 with a digit (4) and a letter (D) control`, () => {
      expect(isValidCif(`${key}12345674`)).toBe(digitKey);
      expect(isValidCif(`${key}1234567D`)).toBe(!digitKey);
      expect(isValidCif(`${key}12345674`, { cifControl: "lenient" })).toBe(
        digitKey
      );
      expect(isValidCif(`${key}1234567D`, { cifControl: "lenient" })).toBe(
        !digitKey || lenientKey
      );
      expect(isValidCifControlCode(`${key}12345674`)).toBe(digitKey);
      expect(isValidCifControlCode(`${key}1234567D`)).toBe(!digitKey);
    });
  }
});

// CIF-5 (Orden EHA/451/2008 art. 2.b): the 7 digits are random since 2008,
// so the first two, once a province code, are never checked.
describe("CIF-5: no province code check", () => {
  // CIF-4, written independently of src/.
  function control(digits: string): number {
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const d = Number(digits[i]);
      sum += i % 2 === 0 ? Math.floor((2 * d) / 10) + ((2 * d) % 10) : d;
    }
    return (10 - (sum % 10)) % 10;
  }

  it("CIF-5: every two-digit prefix 00-99 is accepted", () => {
    for (let prefix = 0; prefix < 100; prefix++) {
      const digits = `${String(prefix).padStart(2, "0")}12345`;
      expect(isValidCif(`B${digits}${control(digits)}`)).toBe(true);
      expect(isValidCif(`P${digits}${"JABCDEFGHI"[control(digits)]}`)).toBe(
        true
      );
    }
  });
});
