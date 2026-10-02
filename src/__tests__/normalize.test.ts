import { describe, expect, it } from "vitest";
import {
  isValidCif,
  isValidCifControlCode,
  isValidDni,
  isValidDniLetter,
  isValidNaturalPersonNif,
  isValidNie,
  isValidNif,
  normalize,
} from "..";

// Input cleanup (SPEC.md NORM-1 to NORM-4) and the NIE-3 canonical form.

describe("normalize()", () => {
  it("NORM-1: upper-cases ASCII letters", () => {
    expect(normalize("12345678z")).toBe("12345678Z");
    expect(normalize("x1234567l")).toBe("X1234567L");
    expect(normalize("b12345674")).toBe("B12345674");
  });

  it("NORM-1: upper-cases ñ, and keeps other non-ASCII look-alikes", () => {
    expect(normalize("12345678ñ")).toBe("12345678Ñ");
    // toUpperCase() maps "ı" to "I" and "ſ" to "S": not here.
    expect(normalize("12345678ı")).toBe("12345678ı");
    expect(normalize("X9864761ſ")).toBe("X9864761ſ");
  });

  it("NORM-2: removes spaces and dots anywhere, which also trims", () => {
    expect(normalize(" 12.345.678 Z ")).toBe("12345678Z");
    expect(normalize("B 1234567 4")).toBe("B12345674");
  });

  it("NORM-2: removes every JavaScript white-space character", () => {
    const whiteSpace = "\t\n\v\f\r          　﻿";
    expect(normalize(`${whiteSpace}1234${whiteSpace}5678Z`)).toBe("12345678Z");
  });

  it("NORM-3: removes hyphens and slashes anywhere", () => {
    expect(normalize("12345678-Z")).toBe("12345678Z");
    expect(normalize("X-1234567-L")).toBe("X1234567L");
    expect(normalize("B/1234567/4")).toBe("B12345674");
  });

  it("NORM-3: other punctuation is kept (it stays invalid)", () => {
    expect(normalize("12345678_Z")).toBe("12345678_Z");
    expect(normalize("12345678,Z")).toBe("12345678,Z");
    expect(normalize("12345678–Z")).toBe("12345678–Z"); // en dash
  });

  it("NORM-4: left-pads a DNI with fewer than 8 digits", () => {
    expect(normalize("1234567L")).toBe("01234567L");
    expect(normalize("8P")).toBe("00000008P");
    expect(normalize("1.234.567-l")).toBe("01234567L");
  });

  it("NORM-4: pads only digits followed by one letter", () => {
    expect(normalize("1234567")).toBe("1234567"); // no letter
    expect(normalize("L")).toBe("L"); // no digit
    expect(normalize("K123456L")).toBe("K123456L"); // not a DNI
    expect(normalize("123A567L")).toBe("123A567L");
    expect(normalize("12345678Z")).toBe("12345678Z"); // already 8 digits
  });

  it("NIE-3: X0 + 7 digits + letter becomes X + 7 digits + letter", () => {
    expect(normalize("X01234567L")).toBe("X1234567L");
    expect(normalize("x-0123456-7l")).toBe("X1234567L");
  });

  it("NIE-3: only X0 + 7 digits + a letter is the old form", () => {
    expect(normalize("X11234567L")).toBe("X11234567L");
    expect(normalize("Y01234567X")).toBe("Y01234567X");
    expect(normalize("X012345678")).toBe("X012345678");
    expect(normalize("X0123456AL")).toBe("X0123456AL");
  });

  it("NORM-1: returns the input itself when nothing changes", () => {
    const canonical = "B12345674";
    expect(normalize(canonical)).toBe(canonical);
    expect(normalize("")).toBe("");
  });

  it("NORM-1: is idempotent on the examples above", () => {
    for (const value of [" 12.345.678-z ", "1234567l", "x01234567l"])
      expect(normalize(normalize(value))).toBe(normalize(value));
  });

  it("#40: never throws, and returns an empty string for a non-string", () => {
    for (const value of [null, undefined, 42, {}, [], Symbol("x")])
      expect(normalize(value as unknown as string)).toBe("");
  });
});

describe("the boolean validators normalize by default", () => {
  it("NORM-2: isValidNif accepts spaces and dots", () => {
    expect(isValidNif(" 12.345.678 Z ")).toBe(true);
    expect(isValidNif("12.345.678-Z", { normalize: false })).toBe(false);
  });

  it("NORM-3: every validator accepts hyphens and slashes", () => {
    expect(isValidNif("B-1234567-4")).toBe(true);
    expect(isValidCif("b-1234567-4")).toBe(true);
    expect(isValidNie("X-1234567-L")).toBe(true);
    expect(isValidDni("12345678/Z")).toBe(true);
    expect(isValidNaturalPersonNif("K-1234567-L")).toBe(true);
    expect(isValidDniLetter("12345678-Z ")).toBe(true);
    expect(isValidCifControlCode("B-1234567-4")).toBe(true);
  });

  it("NORM-3: with normalize: false, separators make the value invalid", () => {
    const strict = { normalize: false };
    expect(isValidNif("B-1234567-4", strict)).toBe(false);
    expect(isValidCif("b-1234567-4", strict)).toBe(false);
    expect(isValidNie("X-1234567-L", strict)).toBe(false);
    expect(isValidDni("12345678/Z", strict)).toBe(false);
    expect(isValidNaturalPersonNif("K-1234567-L", strict)).toBe(false);
    expect(isValidDniLetter("12345678-Z ", strict)).toBe(false);
    expect(isValidCifControlCode("B-1234567-4", strict)).toBe(false);
  });

  it("NORM-4: a 7-digit DNI is valid, as its 8-digit form", () => {
    expect(isValidDni("1234567L")).toBe(true);
    expect(isValidNif("1234567L")).toBe(true);
    expect(isValidNaturalPersonNif("1234567L")).toBe(true);
    expect(isValidDni("1234567L", { normalize: false })).toBe(false);
    expect(isValidNif("1234567L", { normalize: false })).toBe(false);
  });

  it("NORM-4: padding never makes a NIE or a CIF out of a DNI", () => {
    expect(isValidNie("1234567L")).toBe(false);
    expect(isValidCif("1234567L")).toBe(false);
    expect(isValidDni("K-123456-L")).toBe(false);
  });

  it("NIE-3: the old NIE form is accepted with or without normalization", () => {
    expect(isValidNie("X01234567L")).toBe(true);
    expect(isValidNie("X01234567L", { normalize: false })).toBe(true);
    expect(isValidNie("X-01234567-L")).toBe(true);
  });

  it("NORM-1: lower case is accepted with or without normalization", () => {
    expect(isValidNif("x1234567l", { normalize: false })).toBe(true);
    expect(isValidNif("b12345674", { normalize: false })).toBe(true);
  });

  it("NORM-2: cleanup never makes an invalid document valid", () => {
    expect(isValidNif(" 12.345.678-A ")).toBe(false);
    expect(isValidNif("B-1234567-5")).toBe(false);
    expect(isValidNif("   ")).toBe(false);
    expect(isValidNif("1234567")).toBe(false);
  });

  it("#40: options may be null or a number (array.filter passes the index)", () => {
    expect(isValidNif("B-1234567-4", null as never)).toBe(true);
    // TypeScript rejects `.filter(isValidNif)` (the index is not an options
    // object), but plain JavaScript callers do it, so it must not break.
    const filter = isValidNif as (value: unknown, index: number) => boolean;
    expect(["12345678Z", "B-1234567-4", "x"].filter(filter)).toEqual([
      "12345678Z",
      "B-1234567-4",
    ]);
  });
});
