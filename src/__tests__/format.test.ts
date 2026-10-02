import { describe, expect, it } from "vitest";
import { computeControlCharacter, format, isValidNif, validate } from "..";

describe("format()", () => {
  it.each([
    ["12345678z", "12345678-Z"],
    ["01234567L", "01234567-L"],
    ["1234567L", "01234567-L"],
  ])("DNI-1: %s is formatted as %s", (value, expected) => {
    expect(format(value)).toBe(expected);
  });

  it.each([
    [" x01234567l ", "X-1234567-L"],
    ["Y1234567X", "Y-1234567-X"],
    ["k1234567l", "K-1234567-L"],
  ])("NIE-1 / KLM-1: %s is formatted as %s", (value, expected) => {
    expect(format(value)).toBe(expected);
  });

  it.each([
    ["b12345674", "B-1234567-4"],
    ["P2807900B", "P-2807900-B"],
  ])("CIF-1: %s is formatted as %s", (value, expected) => {
    expect(format(value)).toBe(expected);
  });

  it("CIF-1: the separator can be a space or nothing", () => {
    expect(format("B12345674", { separator: " " })).toBe("B 1234567 4");
    expect(format("B-1234567-4", { separator: "" })).toBe("B12345674");
    expect(format("12345678Z", { separator: " " })).toBe("12345678 Z");
    expect(format("12345678Z", { separator: "." as never })).toBe("12345678-Z");
    expect(format("12345678Z", null as never)).toBe("12345678-Z");
  });

  it("DNI-2: invalid documents give null", () => {
    expect(format("12345678A")).toBeNull();
    expect(format("G1234567D")).toBeNull(); // CIF-3, official mode
    expect(format("T1234567A")).toBeNull();
    expect(format("ES12345678Z")).toBeNull();
    expect(format(42)).toBeNull();
  });
});

describe("computeControlCharacter()", () => {
  it.each([
    ["12345678", "Z"],
    ["X1234567", "L"],
    ["K1234567", "L"],
    ["B1234567", "4"],
    ["P2807900", "B"],
    ["Q2826000", "H"],
  ])("DNI-2 / NIE-2 / KLM-2 / CIF-3: %s -> %s", (partial, expected) => {
    expect(computeControlCharacter(partial)).toBe(expected);
  });

  it("NORM-4: fewer than 8 digits are padded", () => {
    expect(computeControlCharacter("1234567")).toBe("L");
    expect(computeControlCharacter("8")).toBe("P");
  });

  it("NIE-3: the old X0 form gives the same letter", () => {
    expect(computeControlCharacter("X01234567")).toBe("L");
    expect(computeControlCharacter("Y1234567")).toBe("X");
    expect(computeControlCharacter("Z1234567")).toBe("R");
  });

  it("CIF-3: C D F G J U V get a digit, N P Q R S W a letter", () => {
    expect(computeControlCharacter("G1234567")).toBe("4");
    expect(computeControlCharacter("N1234567")).toBe("D");
  });

  it("NORM-2: the input is cleaned first", () => {
    expect(computeControlCharacter(" 12.345.678 ")).toBe("Z");
    expect(computeControlCharacter("b-1234567")).toBe("4");
  });

  it("NIF-1: anything else gives null", () => {
    for (const partial of [
      "",
      "123456789",
      "T1234567",
      "K123456",
      "K12345678",
      "X11234567",
      "B123456A",
      "12345678Z",
      null,
      12345678,
    ])
      expect(computeControlCharacter(partial)).toBeNull();
  });

  it("CIF-4: the partial document plus the result validates", () => {
    for (const partial of ["00000000", "K0000000", "Z9999999", "W7759996"]) {
      const full = partial + computeControlCharacter(partial);
      expect(isValidNif(full)).toBe(true);
      expect(validate(full).valid).toBe(true);
    }
  });
});
