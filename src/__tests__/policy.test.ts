import { describe, expect, it } from "vitest";
import {
  isValidCif,
  isValidDni,
  isValidDniLetter,
  isValidNaturalPersonNif,
  isValidNie,
  isValidNif,
} from "..";

// Opt-in policies (SPEC.md POLICY-*): never applied unless asked for.

const REJECT = { rejectPlaceholders: true } as const;
const DNI_PLACEHOLDERS = ["00000000T", "00000001R", "99999999R"];

describe("POLICY-1: placeholder numbers", () => {
  it.each([...DNI_PLACEHOLDERS, "X0000000T"])(
    "POLICY-1: %s is a valid document by default",
    (value) => {
      expect(isValidNif(value)).toBe(true);
      expect(isValidNaturalPersonNif(value)).toBe(true);
    }
  );

  it.each([...DNI_PLACEHOLDERS, "X0000000T"])(
    "POLICY-1: %s is rejected with rejectPlaceholders",
    (value) => {
      expect(isValidNif(value, REJECT)).toBe(false);
      expect(isValidNaturalPersonNif(value, REJECT)).toBe(false);
    }
  );

  it.each(DNI_PLACEHOLDERS)(
    "POLICY-1: isValidDni and isValidDniLetter reject %s only when asked",
    (value) => {
      expect(isValidDni(value)).toBe(true);
      expect(isValidDni(value, REJECT)).toBe(false);
      expect(isValidDniLetter(value)).toBe(true);
      expect(isValidDniLetter(value, REJECT)).toBe(false);
    }
  );

  it("POLICY-1: isValidNie rejects X0000000T only when asked", () => {
    expect(isValidNie("X0000000T")).toBe(true);
    expect(isValidNie("X0000000T", REJECT)).toBe(false);
  });

  it("POLICY-1: placeholders are rejected in every accepted form", () => {
    for (const value of [
      "00000000t", // NORM-1
      " 00.000.000-T ", // NORM-2, NORM-3
      "0T", // NORM-4
      "X00000000T", // NIE-3, old form
      "x-00000000-t",
    ]) {
      expect(isValidNif(value)).toBe(true);
      expect(isValidNif(value, REJECT)).toBe(false);
    }
    expect(isValidNie("x00000000t", { ...REJECT, normalize: false })).toBe(
      false
    );
  });

  it("POLICY-1: other valid documents are not affected", () => {
    for (const value of ["12345678Z", "00000002W", "X1234567L", "K0000000T"])
      expect(isValidNif(value, REJECT)).toBe(true);
    expect(isValidCif("B12345674", REJECT)).toBe(true);
  });
});
