import { describe, expect, it } from "vitest";
import { getNifType, isValidNif, isValidSpanishVat, validate } from "..";

// VAT-1: Spanish VAT number = "ES" + NIF (RD 1065/2007 art. 25.1). Format
// only: a valid format doesn't mean the number is registered in VIES.

describe("isValidSpanishVat()", () => {
  it.each([
    "ES12345678Z",
    "ESK1234567L",
    "ESX1234567L",
    "ESX01234567L",
    "ESB12345674",
    "ESP2807900B",
  ])("VAT-1: %s is a valid VAT number format", (value) => {
    expect(isValidSpanishVat(value)).toBe(true);
  });

  it("VAT-1: the ES prefix is required", () => {
    expect(isValidSpanishVat("12345678Z")).toBe(false);
    expect(isValidSpanishVat("B12345674")).toBe(false);
  });

  it("VAT-1: the NIF after ES must be valid", () => {
    expect(isValidSpanishVat("ES12345678A")).toBe(false);
    expect(isValidSpanishVat("ES")).toBe(false);
    expect(isValidSpanishVat("ESES12345678Z")).toBe(false);
    expect(isValidSpanishVat("EST12345678")).toBe(false);
    expect(isValidSpanishVat(null)).toBe(false);
  });

  it("NORM-2: the input is normalized unless normalize: false", () => {
    expect(isValidSpanishVat(" es b-1234567-4 ")).toBe(true);
    expect(isValidSpanishVat("ES 1234567-L")).toBe(true); // NORM-4
    expect(isValidSpanishVat("es12345678z", { normalize: false })).toBe(true);
    expect(isValidSpanishVat("ES 12345678Z", { normalize: false })).toBe(false);
  });

  it("VAT-1: takes the boolean validators' options", () => {
    expect(isValidSpanishVat("ESG1234567D")).toBe(false);
    expect(isValidSpanishVat("ESG1234567D", { cifControl: "lenient" })).toBe(
      true
    );
    expect(isValidSpanishVat("ES00000000T")).toBe(true);
    expect(isValidSpanishVat("ES00000000T", { rejectPlaceholders: true })).toBe(
      false
    );
    expect(isValidSpanishVat("ES12345678Z", null as never)).toBe(true);
  });
});

describe("validate() with allowVatPrefix", () => {
  it("VAT-1: ES + NIF is rejected by default, with a hint", () => {
    expect(validate("ES12345678Z")).toMatchObject({
      valid: false,
      type: null,
      normalized: null,
      error: { code: "INVALID_FORMAT", rule: "VAT-1" },
    });
    expect(validate("ES12345678Z").error?.message).toMatch(/ES prefix/);
    expect(isValidNif("ES12345678Z")).toBe(false);
  });

  it("VAT-1: accepted with allowVatPrefix, normalized without ES", () => {
    expect(validate("ES12345678Z", { allowVatPrefix: true })).toEqual({
      valid: true,
      type: "DNI",
      normalized: "12345678Z",
    });
    expect(
      validate(" es-b-1234567-4 ", { allowVatPrefix: true }).normalized
    ).toBe("B12345674");
  });

  it("VAT-1: a bare NIF stays valid with allowVatPrefix", () => {
    expect(validate("12345678Z", { allowVatPrefix: true }).valid).toBe(true);
  });

  it("VAT-1: ES alone, or ES + an invalid NIF, is invalid", () => {
    expect(validate("ES", { allowVatPrefix: true }).error).toMatchObject({
      code: "INVALID_LENGTH",
      rule: "VAT-1",
    });
    expect(
      validate("ES12345678A", { allowVatPrefix: true }).error
    ).toMatchObject({
      code: "INVALID_CONTROL_CHARACTER",
      rule: "DNI-2",
      expected: "Z",
    });
  });

  it("VAT-1: getNifType accepts the prefix only with allowVatPrefix", () => {
    expect(getNifType("ES12345678Z")).toBeNull();
    expect(getNifType("ES12345678Z", { allowVatPrefix: true })).toBe("DNI");
  });
});
