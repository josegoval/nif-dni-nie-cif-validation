import fc from "fast-check";
import { describe, expect, expectTypeOf, it } from "vitest";
import { array, type InferType, object, ValidationError } from "yup";
import { type ValidateOptions, validate } from "..";
import { checkNif, type NifSchemaKind } from "../adapter";
import { createGenerator } from "../generate/index";
import { ca } from "../locales/ca";
import { en } from "../locales/en";
import { es } from "../locales/es";
import { eu } from "../locales/eu";
import { gl } from "../locales/gl";
import {
  type NifErrorParams,
  type NifSchema,
  yCif,
  yDni,
  yNie,
  yNif,
  ySpanishVat,
} from "../yup/index";

// The Yup adapter (#58, `nif-dni-nie-cif-validation/yup`), tested against
// Yup itself. The schemas must accept what validate() accepts, output its
// normalized value, and give its message, code and rule.

const SEED = 58;

/** The error of a failed validation. */
function failure(schema: NifSchema, value: unknown): ValidationError {
  try {
    schema.validateSync(value);
  } catch (error) {
    expect(error).toBeInstanceOf(ValidationError);
    return error as ValidationError;
  }
  throw new Error(`${JSON.stringify(value)} was accepted`);
}

const params = (error: ValidationError) =>
  error.params as unknown as NifErrorParams;

describe("NORM-1: valid values give the normalized value", () => {
  const CASES: [schema: () => NifSchema, input: string, output: string][] = [
    [yNif, "12345678Z", "12345678Z"],
    [yNif, " 12.345.678-z ", "12345678Z"],
    [yNif, "x-01234567-l", "X1234567L"],
    [yNif, "1234567L", "01234567L"],
    [yNif, "k1234567l", "K1234567L"],
    [yNif, " b-1234567-4 ", "B12345674"],
    [yNif, "p2807900b", "P2807900B"],
    [yDni, "12345678Z", "12345678Z"],
    [yDni, "1234567-l", "01234567L"],
    [yDni, "K1234567L", "K1234567L"],
    [yNie, "X1234567L", "X1234567L"],
    [yNie, "X01234567L", "X1234567L"],
    [yNie, " y 1234567 x ", "Y1234567X"],
    [yCif, "B12345674", "B12345674"],
    [yCif, "q-2826000-h", "Q2826000H"],
    [ySpanishVat, "ES12345678Z", "ES12345678Z"],
    [ySpanishVat, "es b-1234567-4", "ESB12345674"],
    [ySpanishVat, "E S 0 1 2 3 4 5 6 7 l", "ES01234567L"],
  ];
  for (const [schema, input, output] of CASES) {
    it(`${schema.name}(${JSON.stringify(input)}) gives ${output}`, async () => {
      expect(schema().validateSync(input)).toBe(output);
      expect(schema().cast(input)).toBe(output);
      expect(schema().isValidSync(input)).toBe(true);
      await expect(schema().validate(input)).resolves.toBe(output);
    });
  }

  it("NIE-3: an NIE in the old 10-character form is shortened", () => {
    expect(yNif().validateSync("X01234567L")).toBe("X1234567L");
  });

  it("NORM-4: a DNI with fewer than 8 digits is padded", () => {
    expect(yNif().validateSync("12-n")).toBe("00000012N");
    expect(yDni().validateSync("1234567L")).toBe("01234567L");
  });
});

describe("a refused value gives the message, code and rule of validate()", () => {
  const VALUES: [value: string, code: string, rule: string][] = [
    ["", "EMPTY", "INPUT-2"],
    [" - ", "EMPTY", "INPUT-2"],
    ["1234567890123", "INVALID_LENGTH", "DNI-1"],
    ["X1234567", "INVALID_LENGTH", "NIE-1"],
    ["B123", "INVALID_LENGTH", "CIF-1"],
    ["1234567A1", "INVALID_FORMAT", "DNI-1"],
    ["T12345678", "INVALID_FORMAT", "NIF-1"],
    ["ES12345678Z", "INVALID_FORMAT", "VAT-1"],
    ["12345678A", "INVALID_CONTROL_CHARACTER", "DNI-2"],
    ["Y1234567L", "INVALID_CONTROL_CHARACTER", "NIE-2"],
    ["K1234567A", "INVALID_CONTROL_CHARACTER", "KLM-2"],
    ["B12345675", "INVALID_CONTROL_CHARACTER", "CIF-4"],
    ["G1234567D", "INVALID_CONTROL_CHARACTER", "CIF-3"],
    ["12345678I", "INVALID_CONTROL_CHARACTER", "DNI-3"],
  ];

  for (const [value, code, rule] of VALUES) {
    it(`${code} (${rule}): ${JSON.stringify(value)}`, () => {
      const expected = validate(value).error;
      expect(expected?.code).toBe(code);
      expect(expected?.rule).toBe(rule);
      const error = failure(yNif(), value);
      expect(error.message).toBe(expected?.message);
      expect(error.type).toBe("nif");
      expect(error.value).toBe(value);
      expect(error.errors).toEqual([expected?.message]);
      expect(params(error).code).toBe(code);
      expect(params(error).rule).toBe(rule);
      expect(params(error).expected).toBe(expected?.expected);
    });
  }

  it("INVALID_CONTROL_CHARACTER: params has the expected control character", () => {
    const error = failure(yDni(), "12345678A");
    expect(params(error)).toMatchObject({
      code: "INVALID_CONTROL_CHARACTER",
      rule: "DNI-2",
      expected: "Z",
    });
  });

  it("only the first problem is reported, once", () => {
    expect(failure(yNif(), "12345678A").inner).toHaveLength(0);
    let all: ValidationError | undefined;
    try {
      yNif().validateSync("12345678A", { abortEarly: false });
    } catch (error) {
      all = error as ValidationError;
    }
    expect(all?.errors).toHaveLength(1);
  });

  it("UNSUPPORTED_TYPE (POLICY-2): a valid document of another type", () => {
    const error = failure(yDni(), "X1234567L");
    expect(error.message).toBe(
      validate("X1234567L", { types: ["DNI", "NIF_KLM"] }).error?.message
    );
    expect(params(error).code).toBe("UNSUPPORTED_TYPE");
    expect(params(error).rule).toBe("POLICY-2");
    expect(params(failure(yNie(), "12345678Z")).code).toBe("UNSUPPORTED_TYPE");
    expect(params(failure(yCif(), "12345678Z")).code).toBe("UNSUPPORTED_TYPE");
    expect(params(failure(yCif(), "X1234567L")).code).toBe("UNSUPPORTED_TYPE");
    expect(params(failure(yNie(), "B12345674")).code).toBe("UNSUPPORTED_TYPE");
  });

  it("PLACEHOLDER (POLICY-1): with rejectPlaceholders", () => {
    for (const value of ["00000000T", "00000001R", "99999999R", "X0000000T"]) {
      expect(yNif().validateSync(value)).toBe(value);
      const error = failure(yNif({ rejectPlaceholders: true }), value);
      expect(params(error).code).toBe("PLACEHOLDER");
      expect(params(error).rule).toBe("POLICY-1");
    }
  });

  it("the message is not interpolated by Yup", () => {
    // Yup replaces ${name} in a message; the messages of validate() have none.
    for (const locale of [en, es, ca, eu, gl])
      expect(JSON.stringify(locale.messages)).not.toContain("${");
  });
});

describe("INPUT-1: a value that is not a string", () => {
  for (const value of [
    undefined,
    null,
    12345678,
    true,
    {},
    [],
    Symbol.for("x"),
  ]) {
    it(`${String(typeof value)} ${value === null ? "null" : ""} gives the NOT_A_STRING message`, () => {
      for (const schema of [yNif(), yDni(), yNie(), yCif(), ySpanishVat()]) {
        const error = failure(schema, value);
        expect(error.message).toBe(validate(value).error?.message);
        expect(error.message).toBe(en.messages.NOT_A_STRING);
      }
    });
  }

  it("a number is not turned into a string, unlike Yup's string()", () => {
    // 12345678 would be "12345678", a DNI number without its letter.
    expect(yNif().isValidSync(12345678)).toBe(false);
    expect(yNif().isValidSync(new String("12345678Z"))).toBe(false);
  });

  it("the message is in the locale", () => {
    expect(failure(yNif({ locale: es }), 5).message).toBe(
      es.messages.NOT_A_STRING
    );
    expect(failure(yNif({ locale: es }), undefined).message).toBe(
      es.messages.NOT_A_STRING
    );
  });

  it("an optional field accepts undefined", () => {
    expect(yNif().optional().validateSync(undefined)).toBeUndefined();
    expect(yNif().nullable().validateSync(null)).toBeNull();
  });
});

describe("the options of validate() are respected", () => {
  it("locale: every message is the one of the locale object", () => {
    for (const locale of [en, es, ca, eu, gl]) {
      for (const value of [
        "",
        "123",
        "T12345678",
        "12345678A",
        "1234567890123",
      ]) {
        expect(failure(yNif({ locale }), value).message).toBe(
          validate(value, { locale }).error?.message
        );
      }
    }
    expect(failure(yNif({ locale: es }), "12345678A").message).toBe(
      "El carácter de control no es correcto: para este DNI debería ser «Z»."
    );
    expect(failure(yNif({ locale: es }), "12345678A").message).not.toBe(
      failure(yNif(), "12345678A").message
    );
  });

  it("locale: an unknown locale gives English, as validate() does", () => {
    const error = failure(yNif({ locale: "es" as never }), "12345678A");
    expect(error.message).toBe(
      en.messages.INVALID_CONTROL_CHARACTER("DNI", "Z")
    );
  });

  it("types: only those document types", () => {
    const schema = yNif({ types: ["DNI", "NIE"] });
    expect(schema.validateSync("12345678Z")).toBe("12345678Z");
    expect(schema.validateSync("X1234567L")).toBe("X1234567L");
    expect(params(failure(schema, "B12345674")).code).toBe("UNSUPPORTED_TYPE");
    expect(params(failure(schema, "K1234567L")).code).toBe("UNSUPPORTED_TYPE");
  });

  it("types: a type-specific schema ignores the types of the options", () => {
    const schema = yDni({ types: ["CIF"] } as never);
    expect(schema.validateSync("12345678Z")).toBe("12345678Z");
    expect(params(failure(schema, "B12345674")).code).toBe("UNSUPPORTED_TYPE");
  });

  it("normalize: false turns the cleanup off", () => {
    expect(yNif().validateSync(" 12.345.678-Z ")).toBe("12345678Z");
    const strict = yNif({ normalize: false });
    expect(strict.isValidSync(" 12.345.678-Z ")).toBe(false);
    expect(strict.isValidSync("1234567L")).toBe(false);
    expect(strict.validateSync("12345678z")).toBe("12345678Z");
    expect(yDni({ normalize: false }).isValidSync("1234567L")).toBe(false);
  });

  it("cifControl: lenient accepts a letter for C D F G J U V", () => {
    expect(yNif().isValidSync("G1234567D")).toBe(false);
    expect(yNif({ cifControl: "lenient" }).validateSync("G1234567D")).toBe(
      "G1234567D"
    );
    expect(yCif({ cifControl: "lenient" }).validateSync("g1234567d")).toBe(
      "G1234567D"
    );
    expect(yCif({ cifControl: "official" }).isValidSync("G1234567D")).toBe(
      false
    );
    // B still takes a digit.
    expect(yNif({ cifControl: "lenient" }).isValidSync("B1234567D")).toBe(
      false
    );
  });

  it("allowVatPrefix: yNif accepts ES and outputs the NIF only", () => {
    expect(yNif().isValidSync("ES12345678Z")).toBe(false);
    expect(yNif({ allowVatPrefix: true }).validateSync("ES12345678Z")).toBe(
      "12345678Z"
    );
    expect(yNif({ allowVatPrefix: true }).validateSync("12345678Z")).toBe(
      "12345678Z"
    );
  });

  it("all the options together", () => {
    const schema = yNif({
      types: ["DNI"],
      normalize: false,
      rejectPlaceholders: true,
      locale: es,
    } satisfies ValidateOptions);
    expect(schema.validateSync("12345678Z")).toBe("12345678Z");
    expect(failure(schema, "00000000T").message).toBe(es.messages.PLACEHOLDER);
  });

  it("every schema takes null options, like validate()", () => {
    expect(yNif(null as never).validateSync("12345678Z")).toBe("12345678Z");
    expect(yDni(null as never).validateSync("12345678Z")).toBe("12345678Z");
    expect(ySpanishVat(null as never).validateSync("ES12345678Z")).toBe(
      "ES12345678Z"
    );
  });
});

describe("VAT-1: ySpanishVat", () => {
  it("VAT-1: requires the ES prefix, as isValidSpanishVat does", () => {
    const error = failure(ySpanishVat(), "12345678Z");
    expect(error.message).toBe(en.messages.INVALID_LENGTH["VAT-1"]);
    expect(params(error)).toMatchObject({
      code: "INVALID_LENGTH",
      rule: "VAT-1",
    });
    expect(failure(ySpanishVat({ locale: es }), "12345678Z").message).toBe(
      es.messages.INVALID_LENGTH["VAT-1"]
    );
  });

  it("VAT-1: the NIF after the prefix must be valid, with its own error", () => {
    const error = failure(ySpanishVat(), "ES12345678A");
    expect(params(error)).toMatchObject({
      code: "INVALID_CONTROL_CHARACTER",
      rule: "DNI-2",
      expected: "Z",
    });
    expect(failure(ySpanishVat(), "ES").message).toBe(
      en.messages.INVALID_LENGTH["VAT-1"]
    );
    // Without the prefix, an invalid NIF gives the NIF's error.
    expect(params(failure(ySpanishVat(), "12345678A")).rule).toBe("DNI-2");
  });

  it("VAT-1: takes the other options", () => {
    expect(ySpanishVat({ types: ["CIF"] }).validateSync("ESB12345674")).toBe(
      "ESB12345674"
    );
    expect(
      params(failure(ySpanishVat({ types: ["CIF"] }), "ES12345678Z")).code
    ).toBe("UNSUPPORTED_TYPE");
    expect(
      ySpanishVat({ cifControl: "lenient" }).validateSync("ESG1234567D")
    ).toBe("ESG1234567D");
    expect(
      ySpanishVat({ rejectPlaceholders: true }).isValidSync("ES00000000T")
    ).toBe(false);
  });

  it("VAT-1: the output is a valid VAT number, and validates again", () => {
    const gen = createGenerator(SEED);
    for (let i = 0; i < 500; i++) {
      const vat = ySpanishVat().validateSync(`es ${gen.nif({ format: true })}`);
      expect(vat).toMatch(/^ES[0-9A-Z]{9}$/);
      expect(ySpanishVat().validateSync(vat)).toBe(vat);
    }
  });
});

describe("the schemas work like any Yup schema", () => {
  const form = object({
    nif: yNif({ types: ["DNI", "NIE"], locale: es }),
    company: yCif().optional(),
    others: array(yNie().defined()).defined(),
  });

  it("object: validates to the normalized values", () => {
    expect(
      form.validateSync({
        nif: " 12.345.678-z ",
        company: "b-1234567-4",
        others: ["x1234567l", "Y 1234567 X"],
      })
    ).toEqual({
      nif: "12345678Z",
      company: "B12345674",
      others: ["X1234567L", "Y1234567X"],
    });
    expect(form.validateSync({ nif: "12345678Z", others: [] })).toEqual({
      nif: "12345678Z",
      others: [],
    });
  });

  it("object: the errors have a path, the message and the params", () => {
    let error: ValidationError | undefined;
    try {
      form.validateSync(
        { nif: "12345678A", company: "B1", others: ["X1234567L", "x12"] },
        { abortEarly: false }
      );
    } catch (caught) {
      error = caught as ValidationError;
    }
    const inner = error?.inner ?? [];
    expect(inner.map((e) => e.path)).toEqual(["nif", "company", "others[1]"]);
    expect(inner[0]?.message).toBe(
      "El carácter de control no es correcto: para este DNI debería ser «Z»."
    );
    expect(params(inner[0] as ValidationError).code).toBe(
      "INVALID_CONTROL_CHARACTER"
    );
    expect(params(inner[1] as ValidationError).code).toBe("INVALID_LENGTH");
    expect(params(inner[2] as ValidationError).rule).toBe("NIE-1");
  });

  it("the errors are usable by path (React Hook Form, Formik)", () => {
    let error: ValidationError | undefined;
    try {
      form.validateSync({ nif: "", others: [] }, { abortEarly: false });
    } catch (caught) {
      error = caught as ValidationError;
    }
    expect(error?.inner[0]?.path).toBe("nif");
    expect(error?.inner[0]?.message).toBe(es.messages.EMPTY);
  });

  it("validateAt and async validation work too", async () => {
    await expect(form.validateAt("nif", { nif: "x1234567l" })).resolves.toBe(
      "X1234567L"
    );
    await expect(yNif().validate("12345678A")).rejects.toThrow(
      "The control character"
    );
    await expect(yNif().validate("12345678A")).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it("the schema has no side effects: every call is independent", () => {
    const schema = yNif();
    expect(schema.validateSync("12345678Z")).toBe("12345678Z");
    expect(schema.isValidSync("12345678A")).toBe(false);
    expect(schema.validateSync("x1234567l")).toBe("X1234567L");
  });

  it("strict validation skips the transform but still checks with validate()", () => {
    // `strict` keeps the value as typed (the output is not normalized), and
    // the test accepts what validate() accepts.
    expect(yNif().validateSync(" 12345678z", { strict: true })).toBe(
      " 12345678z"
    );
    expect(yNif().isValidSync("12345678A", { strict: true })).toBe(false);
    expect(yNif().isValidSync("12345678Z", { strict: true })).toBe(true);
    expect(yNif().isValidSync(" 12345678z", { strict: true })).toBe(true);
  });

  it("cast gives the normalized value, or what was typed if it is refused", () => {
    expect(yNif().cast(" 12.345.678-z ")).toBe("12345678Z");
    expect(yNif().cast("nope", { assert: false })).toBe("nope");
  });
});

describe("agreement with validate()", () => {
  const SCHEMAS: [NifSchemaKind, (opts?: never) => NifSchema][] = [
    ["nif", yNif],
    ["dni", yDni],
    ["nie", yNie],
    ["cif", yCif],
    ["vat", ySpanishVat],
  ];

  // 3000 fast-check runs: well under a second locally, but slower on shared CI runners.
  it("every schema accepts exactly what checkNif accepts, and outputs the same", {
    timeout: 30_000,
  }, () => {
    const gen = createGenerator(SEED);
    const values: string[] = [];
    for (let i = 0; i < 400; i++) {
      values.push(gen.nif(), gen.nif({ format: true }));
      values.push(`ES${gen.nif()}`);
      for (const type of ["DNI", "NIF_KLM", "NIE", "CIF"] as const)
        for (const reason of [
          "INVALID_LENGTH",
          "INVALID_FORMAT",
          "INVALID_CONTROL_CHARACTER",
        ] as const)
          values.push(gen.invalid(type, { reason }));
    }
    for (const [kind, make] of SCHEMAS) {
      const schema = make();
      for (const value of values) {
        const checked = checkNif(value, kind);
        expect(schema.isValidSync(value)).toBe(checked.ok);
        if (checked.ok) expect(schema.validateSync(value)).toBe(checked.value);
        else expect(failure(schema, value).message).toBe(checked.error.message);
      }
    }
  });

  it("yNif agrees with validate() on arbitrary strings", () => {
    const options: ValidateOptions[] = [
      {},
      { normalize: false },
      { cifControl: "lenient" },
      { rejectPlaceholders: true },
      { allowVatPrefix: true },
      { types: ["NIE", "CIF"], locale: es },
    ];
    const text = fc.oneof(
      fc.string({ maxLength: 14 }),
      fc.stringMatching(/^[ES]{0,2}[0-9A-Z .-]{0,11}$/),
      fc.stringMatching(/^[A-Z]?[0-9]{0,8}[A-Z0-9]?$/)
    );
    fc.assert(
      fc.property(text, fc.constantFrom(...options), (value, opts) => {
        const expected = validate(value, opts);
        const schema = yNif(opts);
        expect(schema.isValidSync(value)).toBe(expected.valid);
        if (expected.valid)
          expect(schema.validateSync(value)).toBe(expected.normalized);
        else {
          const error = failure(schema, value);
          expect(error.message).toBe(expected.error?.message);
          expect(params(error).code).toBe(expected.error?.code);
          expect(params(error).rule).toBe(expected.error?.rule);
        }
      }),
      { seed: SEED, numRuns: 3000 }
    );
  });

  it("the output always validates again, unchanged", () => {
    const gen = createGenerator(SEED + 1);
    for (let i = 0; i < 1000; i++) {
      const output = yNif().validateSync(gen.nif({ format: true }));
      expect(validate(output).valid).toBe(true);
      expect(validate(output).normalized).toBe(output);
    }
  });
});

describe("types", () => {
  it("every schema is a string schema: its input and output are string", () => {
    expectTypeOf<InferType<NifSchema>>().toEqualTypeOf<string>();
    expectTypeOf(yNif()).toEqualTypeOf<NifSchema>();
    expectTypeOf(yDni()).toEqualTypeOf<NifSchema>();
    expectTypeOf(yNie()).toEqualTypeOf<NifSchema>();
    expectTypeOf(yCif()).toEqualTypeOf<NifSchema>();
    expectTypeOf(ySpanishVat()).toEqualTypeOf<NifSchema>();
    expectTypeOf<
      ReturnType<NifSchema["validateSync"]>
    >().toEqualTypeOf<string>();
  });

  it("InferType of a form is typed", () => {
    const schema = object({
      nif: yNif(),
      vat: ySpanishVat().optional(),
    });
    expectTypeOf<InferType<typeof schema>>().toEqualTypeOf<{
      nif: string;
      vat?: string | undefined;
    }>();
  });

  it("the error params are what the error holds", () => {
    expectTypeOf<NifErrorParams["code"]>().toEqualTypeOf<
      import("..").NifErrorCode
    >();
    expectTypeOf<NifErrorParams["rule"]>().toEqualTypeOf<string>();
    expectTypeOf<NifErrorParams["expected"]>().toEqualTypeOf<
      string | undefined
    >();
  });

  it("the options are those of validate(), minus what the schema fixes", () => {
    expectTypeOf(yNif)
      .parameter(0)
      .toEqualTypeOf<ValidateOptions | undefined>();
    expectTypeOf(yDni)
      .parameter(0)
      .toEqualTypeOf<Omit<ValidateOptions, "types"> | undefined>();
    expectTypeOf(ySpanishVat)
      .parameter(0)
      .toEqualTypeOf<Omit<ValidateOptions, "allowVatPrefix"> | undefined>();
    // @ts-expect-error yDni fixes the types
    yDni({ types: ["CIF"] });
    // @ts-expect-error ySpanishVat always allows the prefix
    ySpanishVat({ allowVatPrefix: false });
    // @ts-expect-error a locale is an object, not a language code
    yNif({ locale: "es" });
  });
});
