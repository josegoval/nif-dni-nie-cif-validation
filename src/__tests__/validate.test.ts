import { describe, expect, it } from "vitest";
import {
  describeCifOrganisation,
  getNifType,
  type NifErrorCode,
  validate,
} from "..";
import { es } from "../locales/es";

// validate() and getNifType() (#56). Every test name starts with the SPEC.md
// rule it exercises.

describe("validate(): acceptance criteria of #56", () => {
  it("DNI-2: 12345678A has the wrong letter, Z is expected", () => {
    const result = validate("12345678A");
    expect(result.valid).toBe(false);
    expect(result.type).toBe("DNI");
    expect(result.normalized).toBe("12345678A");
    expect(result.error?.code).toBe("INVALID_CONTROL_CHARACTER");
    expect(result.error?.expected).toBe("Z");
    expect(result.error?.rule).toBe("DNI-2");
  });

  it("CIF-3: G1234567D is invalid, and valid with cifControl: 'lenient'", () => {
    expect(validate("G1234567D").error).toMatchObject({
      code: "INVALID_CONTROL_CHARACTER",
      rule: "CIF-3",
      expected: "4",
    });
    expect(validate("G1234567D", { cifControl: "lenient" })).toEqual({
      valid: true,
      type: "CIF",
      normalized: "G1234567D",
      meta: { orgKey: "G", orgDescription: "Association" },
    });
  });

  it("POLICY-1: 00000000T is valid, and rejected with rejectPlaceholders", () => {
    expect(validate("00000000T").valid).toBe(true);
    expect(validate("00000000T", { rejectPlaceholders: true })).toMatchObject({
      valid: false,
      type: "DNI",
      normalized: "00000000T",
      error: { code: "PLACEHOLDER", rule: "POLICY-1" },
    });
  });

  it("NORM-3: ' b-1234567-4 ' is the valid CIF B12345674", () => {
    expect(validate(" b-1234567-4 ")).toMatchObject({
      valid: true,
      type: "CIF",
      normalized: "B12345674",
    });
  });
});

describe("validate(): valid documents", () => {
  it.each([
    ["12345678Z", "DNI", "12345678Z"],
    ["K1234567L", "NIF_KLM", "K1234567L"],
    ["X1234567L", "NIE", "X1234567L"],
  ])("DNI-2 / KLM-2 / NIE-2: %s is a valid %s", (value, type, normalized) => {
    expect(validate(value)).toEqual({ valid: true, type, normalized });
  });

  it("CIF-4: P2807900B (Ayuntamiento de Madrid) is a valid CIF, with meta", () => {
    expect(validate("P2807900B")).toEqual({
      valid: true,
      type: "CIF",
      normalized: "P2807900B",
      meta: { orgKey: "P", orgDescription: "Local authority" },
    });
  });

  it("NIE-3: the old NIE form is normalized, with or without normalize", () => {
    expect(validate("X01234567L").normalized).toBe("X1234567L");
    expect(validate("x01234567l", { normalize: false })).toEqual({
      valid: true,
      type: "NIE",
      normalized: "X1234567L",
    });
  });

  it("NORM-4: a 7-digit DNI is padded, only when normalizing", () => {
    expect(validate("1234567L").normalized).toBe("01234567L");
    expect(validate("1234567L", { normalize: false }).error).toMatchObject({
      code: "INVALID_LENGTH",
      rule: "DNI-1",
    });
  });

  it("NORM-2: separators are an error with normalize: false", () => {
    expect(validate("12345678-Z", { normalize: false }).error?.rule).toBe(
      "DNI-1"
    );
    expect(validate(" 12345678Z", { normalize: false }).error?.rule).toBe(
      "NIF-1"
    );
  });
});

type ErrorCase = [
  input: unknown,
  code: NifErrorCode,
  rule: string,
  type: string | null,
  expected?: string,
];

const errorCases: ErrorCase[] = [
  [null, "NOT_A_STRING", "INPUT-1", null],
  [12345678, "NOT_A_STRING", "INPUT-1", null],
  ["", "EMPTY", "INPUT-2", null],
  [" - . / ", "EMPTY", "INPUT-2", null],
  ["T12345678", "INVALID_FORMAT", "NIF-1", null],
  ["ıX1234567L", "INVALID_FORMAT", "NIF-1", null],
  ["123456789Z", "INVALID_LENGTH", "DNI-1", null],
  ["12345678", "INVALID_LENGTH", "DNI-1", null],
  ["K12345678L", "INVALID_LENGTH", "KLM-1", null],
  ["X123456L", "INVALID_LENGTH", "NIE-1", null],
  ["X11234567L", "INVALID_LENGTH", "NIE-3", null],
  ["Y01234567X", "INVALID_LENGTH", "NIE-3", null],
  ["B1234567", "INVALID_LENGTH", "CIF-1", null],
  ["B123456745", "INVALID_LENGTH", "CIF-1", null],
  ["1234567AZ", "INVALID_FORMAT", "DNI-1", null],
  ["123456789", "INVALID_FORMAT", "DNI-1", null],
  ["K123456AL", "INVALID_FORMAT", "KLM-3", null],
  ["K12345678", "INVALID_FORMAT", "KLM-1", null],
  ["X123456AL", "INVALID_FORMAT", "NIE-1", null],
  ["X12345678", "INVALID_FORMAT", "NIE-1", null],
  ["B123456A4", "INVALID_FORMAT", "CIF-1", null],
  ["B1234567Ñ", "INVALID_FORMAT", "CIF-1", null],
  ["B1234567_", "INVALID_FORMAT", "CIF-1", null],
  ["12345678A", "INVALID_CONTROL_CHARACTER", "DNI-2", "DNI", "Z"],
  ["12345678I", "INVALID_CONTROL_CHARACTER", "DNI-3", "DNI", "Z"],
  ["12345678O", "INVALID_CONTROL_CHARACTER", "DNI-3", "DNI", "Z"],
  ["12345678U", "INVALID_CONTROL_CHARACTER", "DNI-3", "DNI", "Z"],
  ["12345678ñ", "INVALID_CONTROL_CHARACTER", "DNI-3", "DNI", "Z"],
  ["K1234567A", "INVALID_CONTROL_CHARACTER", "KLM-2", "NIF_KLM", "L"],
  ["Y1234567L", "INVALID_CONTROL_CHARACTER", "NIE-2", "NIE", "X"],
  ["B12345675", "INVALID_CONTROL_CHARACTER", "CIF-4", "CIF", "4"],
  ["B1234567D", "INVALID_CONTROL_CHARACTER", "CIF-3", "CIF", "4"],
  ["B1234567Z", "INVALID_CONTROL_CHARACTER", "CIF-3", "CIF", "4"],
  ["N12345674", "INVALID_CONTROL_CHARACTER", "CIF-3", "CIF", "D"],
  ["P2807900C", "INVALID_CONTROL_CHARACTER", "CIF-4", "CIF", "B"],
  ["P2807900Z", "INVALID_CONTROL_CHARACTER", "CIF-4", "CIF", "B"],
];

describe("validate(): every error code and its rule", () => {
  it.each(errorCases)(
    "%s gives %s (%s)",
    (input, code, rule, type, expected) => {
      const result = validate(input);
      expect(result.valid).toBe(false);
      expect(result.type).toBe(type);
      expect(result.normalized).toBe(type === null ? null : result.normalized);
      expect(result.error?.code).toBe(code);
      expect(result.error?.rule).toBe(rule);
      expect(result.error?.expected).toBe(expected);
      expect(result.error?.message).toMatch(/\S/);
    }
  );

  it("CIF-3: in lenient mode, C D F G J U V accept either class", () => {
    const lenient = { cifControl: "lenient" } as const;
    expect(validate("G12345674", lenient).valid).toBe(true);
    // A wrong letter: the class is accepted, the value is not (CIF-4), and
    // the expected character is in the class the user typed.
    expect(validate("G1234567E", lenient).error).toMatchObject({
      rule: "CIF-4",
      expected: "D",
    });
    expect(validate("G12345675", lenient).error).toMatchObject({
      rule: "CIF-4",
      expected: "4",
    });
    // Lenient mode doesn't change B (digit) or N (letter).
    expect(validate("B1234567D", lenient).error?.rule).toBe("CIF-3");
    expect(validate("N12345674", lenient).error?.rule).toBe("CIF-3");
  });
});

describe("validate(): types (POLICY-2)", () => {
  it("POLICY-2: a document of another type is UNSUPPORTED_TYPE", () => {
    expect(validate("12345678Z", { types: ["CIF"] })).toMatchObject({
      valid: false,
      type: "DNI",
      normalized: "12345678Z",
      error: { code: "UNSUPPORTED_TYPE", rule: "POLICY-2" },
    });
  });

  it("POLICY-2: it wins over a wrong control character", () => {
    expect(validate("B12345675", { types: ["DNI"] }).error?.code).toBe(
      "UNSUPPORTED_TYPE"
    );
  });

  it("POLICY-2: the listed types are accepted, and an empty list accepts none", () => {
    expect(validate("K1234567L", { types: ["DNI", "NIF_KLM"] }).valid).toBe(
      true
    );
    expect(validate("K1234567L", { types: [] }).error?.code).toBe(
      "UNSUPPORTED_TYPE"
    );
  });

  it("POLICY-2: a non-array `types` (plain JavaScript) is ignored", () => {
    expect(validate("12345678Z", { types: "CIF" as never }).valid).toBe(true);
  });
});

describe("validate(): messages", () => {
  it("INPUT-1: English by default, Spanish with locale: es", () => {
    expect(validate(null).error?.message).toBe("The value must be text.");
    expect(validate(null, { locale: es }).error?.message).toBe(
      "El valor debe ser un texto."
    );
    expect(validate(null, { locale: "fr" as never }).error?.message).toBe(
      "The value must be text."
    );
  });

  it("DNI-2: the message includes the expected character, in both locales", () => {
    expect(validate("12345678A").error?.message).toBe(
      'The control character is not correct: for this DNI it should be "Z".'
    );
    expect(validate("12345678A", { locale: es }).error?.message).toBe(
      "El carácter de control no es correcto: para este DNI debería ser «Z»."
    );
  });

  it("POLICY-2: every error message is localized", () => {
    const inputs: unknown[] = [null, "", "T1", "1", "1234567AZ", "12345678A"];
    for (const input of inputs) {
      const english = validate(input).error?.message;
      const spanish = validate(input, { locale: es }).error?.message;
      expect(english).not.toBe(spanish);
    }
    expect(
      validate("12345678Z", { types: ["NIE"], locale: es }).error?.message
    ).toBe("Aquí no se admite un DNI.");
    expect(
      validate("00000000T", { rejectPlaceholders: true, locale: es }).error
        ?.message
    ).toMatch(/ejemplo/);
  });
});

describe("validate(): robustness (#40)", () => {
  it("INPUT-1: never throws, whatever the options", () => {
    expect(validate("12345678Z", null as never).valid).toBe(true);
    expect(validate("12345678Z", 3 as never).valid).toBe(true);
    for (const value of [undefined, {}, [], Symbol("x"), () => 1, BigInt(1)])
      expect(validate(value).error?.code).toBe("NOT_A_STRING");
  });
});

describe("getNifType(): format-based detection", () => {
  it("NIF-1: detects the type without checking the control character", () => {
    expect(getNifType("12345678Z")).toBe("DNI");
    expect(getNifType("12345678A")).toBe("DNI");
    expect(getNifType("k1234567l")).toBe("NIF_KLM");
    expect(getNifType("X01234567L")).toBe("NIE");
    expect(getNifType("B1234567D")).toBe("CIF");
    expect(getNifType("G1234567D")).toBe("CIF");
  });

  it("NIF-1: null when the format isn't recognisable", () => {
    expect(getNifType("T1234567A")).toBeNull();
    expect(getNifType("123456789")).toBeNull();
    expect(getNifType("1234567")).toBeNull();
    expect(getNifType("")).toBeNull();
    expect(getNifType(42)).toBeNull();
  });

  it("NORM-2: normalizes unless normalize: false", () => {
    expect(getNifType(" 12.345.678-Z ")).toBe("DNI");
    expect(getNifType(" 12.345.678-Z ", { normalize: false })).toBeNull();
    expect(getNifType("12345678Z", null as never)).toBe("DNI");
  });
});

describe("validate(): CIF organisation (meta)", () => {
  it("CIF-2: meta is set whenever the type is CIF, valid or not, localized", () => {
    expect(validate(" b-1234567-4 ", { locale: es }).meta).toEqual({
      orgKey: "B",
      orgDescription: "Sociedad de responsabilidad limitada",
    });
    expect(validate("B12345675").meta?.orgKey).toBe("B");
    expect(validate("Q2826000H", { types: ["DNI"] }).meta?.orgKey).toBe("Q");
  });

  it("CIF-2: no meta for other types or unrecognised formats", () => {
    expect(validate("12345678Z").meta).toBeUndefined();
    expect(validate("B123").meta).toBeUndefined();
  });
});

describe("describeCifOrganisation()", () => {
  const KEYS = "ABCDEFGHJNPQRSUVW";

  it.each(Array.from(KEYS))(
    "CIF-2: key %s has a description in English and Spanish",
    (key) => {
      const english = describeCifOrganisation(key);
      const spanish = describeCifOrganisation(key.toLowerCase(), es);
      expect(english).toMatch(/^[A-Z]/);
      expect(spanish).toMatch(/^[A-ZÁÉÍÓÚ]/);
      expect(english).not.toBe(spanish);
    }
  );

  it("CIF-2: the descriptions follow Orden EHA/451/2008", () => {
    expect(describeCifOrganisation("B")).toBe("Limited liability company");
    expect(describeCifOrganisation("b", es)).toBe(
      "Sociedad de responsabilidad limitada"
    );
    expect(describeCifOrganisation("N", es)).toBe("Entidad extranjera");
    expect(describeCifOrganisation("W", es)).toMatch(/^Establecimiento/);
    expect(describeCifOrganisation("J", es)).toBe("Sociedad civil");
  });

  it("CIF-2: anything else returns null", () => {
    for (const key of ["I", "K", "L", "M", "X", "Y", "Z", "O", "T", "1"])
      expect(describeCifOrganisation(key)).toBeNull();
    for (const key of ["", "BB", "B12345674", "ſ", null, 66, {}])
      expect(describeCifOrganisation(key)).toBeNull();
    expect(describeCifOrganisation("B", "fr" as never)).toBe(
      "Limited liability company"
    );
  });
});
