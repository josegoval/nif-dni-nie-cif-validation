import { isValidNaturalPersonNif, isValidNie, isValidNif, NIE_REGEX } from "..";

const testCases = [
  { text: "Z9332057L", expect: true },
  { text: "X9864761S", expect: true },
  { text: "Y2541026T", expect: true },
  { text: "whatever", expect: false },
  { text: "Y2541026A", expect: false },
  { text: "U2541026T", expect: false },
  { text: "22541026T", expect: false },
  { text: "9332057L", expect: false },
  { text: "04618341X", expect: false },
  { text: "R7465845A", expect: false },
];

describe("nie validation", () => {
  testCases.forEach((testCase) =>
    it(`test case ${testCase.text}`, () =>
      expect(isValidNie(testCase.text)).toBe(testCase.expect))
  );
});

describe("NIE-3: old 10-character NIEs (#39)", () => {
  it("NIE-3: X01234567L is valid", () =>
    expect(isValidNie("X01234567L")).toBe(true));

  it("NIE-3: X01234567L validates like its canonical form X1234567L", () =>
    expect(isValidNie("X01234567L")).toBe(isValidNie("X1234567L")));

  it("NIE-3: x01234567l is valid (NORM-1)", () =>
    expect(isValidNie("x01234567l")).toBe(true));

  it("NIE-3: X01234567A is invalid (wrong letter)", () =>
    expect(isValidNie("X01234567A")).toBe(false));

  it("NIE-3: X11234567L is invalid (only a leading 0 may be dropped)", () =>
    expect(isValidNie("X11234567L")).toBe(false));

  it("NIE-3: Y01234567X is invalid (the old form is X only)", () =>
    expect(isValidNie("Y01234567X")).toBe(false));

  it("NIE-3: Z01234567R is invalid (the old form is X only)", () =>
    expect(isValidNie("Z01234567R")).toBe(false));

  it("NIE-3: X001234567L is invalid (only one leading 0)", () =>
    expect(isValidNie("X001234567L")).toBe(false));

  it("NIE-3: NIE_REGEX matches the old form for X only", () => {
    expect(NIE_REGEX.test("X01234567L")).toBe(true);
    expect(NIE_REGEX.test("X11234567L")).toBe(false);
    expect(NIE_REGEX.test("Y01234567X")).toBe(false);
    expect(NIE_REGEX.test("Z01234567R")).toBe(false);
  });

  it("NIE-3: isValidNaturalPersonNif and isValidNif accept X01234567L", () => {
    expect(isValidNaturalPersonNif("X01234567L")).toBe(true);
    expect(isValidNif("X01234567L")).toBe(true);
  });
});
