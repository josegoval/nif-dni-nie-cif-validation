import fc from "fast-check";
import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { type ValidateOptions, validate } from "..";
import { checkNif, type NifSchemaKind, notAStringMessage } from "../adapter";
import { createGenerator } from "../generate/index";
import { ca } from "../locales/ca";
import { en } from "../locales/en";
import { es } from "../locales/es";
import { eu } from "../locales/eu";
import { gl } from "../locales/gl";
import {
  type NifIssueParams,
  type NifSchema,
  zCif,
  zDni,
  zNie,
  zNif,
  zSpanishVat,
} from "../zod/index";

// The Zod adapter (#58, `nif-dni-nie-cif-validation/zod`), tested against
// Zod 4 itself. The schemas must accept what validate() accepts, output its
// normalized value, and give its message, code and rule.

const SEED = 58;

/** The first issue of a failed parse. */
function firstIssue(schema: z.ZodType, value: unknown) {
  const result = schema.safeParse(value);
  expect(result.success).toBe(false);
  return (result.error as z.ZodError).issues[0] as z.core.$ZodIssue;
}

const params = (issue: z.core.$ZodIssue) =>
  (issue as z.core.$ZodIssueCustom).params as NifIssueParams;

describe("NORM-1: valid values give the normalized value", () => {
  const CASES: [schema: () => NifSchema, input: string, output: string][] = [
    [zNif, "12345678Z", "12345678Z"],
    [zNif, " 12.345.678-z ", "12345678Z"],
    [zNif, "x-01234567-l", "X1234567L"],
    [zNif, "1234567L", "01234567L"],
    [zNif, "k1234567l", "K1234567L"],
    [zNif, " b-1234567-4 ", "B12345674"],
    [zNif, "p2807900b", "P2807900B"],
    [zDni, "12345678Z", "12345678Z"],
    [zDni, "1234567-l", "01234567L"],
    [zDni, "K1234567L", "K1234567L"],
    [zNie, "X1234567L", "X1234567L"],
    [zNie, "X01234567L", "X1234567L"],
    [zNie, " y 1234567 x ", "Y1234567X"],
    [zCif, "B12345674", "B12345674"],
    [zCif, "q-2826000-h", "Q2826000H"],
    [zSpanishVat, "ES12345678Z", "ES12345678Z"],
    [zSpanishVat, "es b-1234567-4", "ESB12345674"],
    [zSpanishVat, "E S 0 1 2 3 4 5 6 7 l", "ES01234567L"],
  ];
  for (const [schema, input, output] of CASES) {
    it(`${schema.name}(${JSON.stringify(input)}) gives ${output}`, () => {
      expect(schema().parse(input)).toBe(output);
      const result = schema().safeParse(input);
      expect(result.success).toBe(true);
      expect(result.data).toBe(output);
    });
  }

  it("NIE-3: an NIE in the old 10-character form is shortened", () => {
    expect(zNif().parse("X01234567L")).toBe("X1234567L");
  });

  it("NORM-4: a DNI with fewer than 8 digits is padded", () => {
    expect(zNif().parse("12-n")).toBe("00000012N");
    expect(zDni().parse("1234567L")).toBe("01234567L");
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
      const issue = firstIssue(zNif(), value);
      expect(issue.message).toBe(expected?.message);
      expect(issue.code).toBe("custom");
      expect(params(issue)).toEqual({
        code,
        rule,
        ...(expected?.expected === undefined
          ? {}
          : { expected: expected.expected }),
      });
    });
  }

  it("INVALID_CONTROL_CHARACTER: params has the expected control character", () => {
    const issue = firstIssue(zDni(), "12345678A");
    expect(params(issue)).toEqual({
      code: "INVALID_CONTROL_CHARACTER",
      rule: "DNI-2",
      expected: "Z",
    });
  });

  it("only the first problem is reported, once", () => {
    const result = zNif().safeParse("12345678A");
    expect(result.error?.issues).toHaveLength(1);
  });

  it("UNSUPPORTED_TYPE (POLICY-2): a valid document of another type", () => {
    const issue = firstIssue(zDni(), "X1234567L");
    expect(issue.message).toBe(
      validate("X1234567L", { types: ["DNI", "NIF_KLM"] }).error?.message
    );
    expect(params(issue).code).toBe("UNSUPPORTED_TYPE");
    expect(params(issue).rule).toBe("POLICY-2");
    expect(params(firstIssue(zNie(), "12345678Z")).code).toBe(
      "UNSUPPORTED_TYPE"
    );
    expect(params(firstIssue(zCif(), "12345678Z")).code).toBe(
      "UNSUPPORTED_TYPE"
    );
    expect(params(firstIssue(zCif(), "X1234567L")).code).toBe(
      "UNSUPPORTED_TYPE"
    );
    expect(params(firstIssue(zNie(), "B12345674")).code).toBe(
      "UNSUPPORTED_TYPE"
    );
  });

  it("PLACEHOLDER (POLICY-1): with rejectPlaceholders", () => {
    for (const value of ["00000000T", "00000001R", "99999999R", "X0000000T"]) {
      expect(zNif().parse(value)).toBe(value);
      const issue = firstIssue(zNif({ rejectPlaceholders: true }), value);
      expect(params(issue).code).toBe("PLACEHOLDER");
      expect(params(issue).rule).toBe("POLICY-1");
    }
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
      for (const schema of [zNif(), zDni(), zNie(), zCif(), zSpanishVat()]) {
        const issue = firstIssue(schema, value);
        expect(issue.code).toBe("invalid_type");
        expect(issue.message).toBe(validate(value).error?.message);
        expect(issue.message).toBe(en.messages.NOT_A_STRING);
      }
    });
  }

  it("the message is in the locale", () => {
    expect(firstIssue(zNif({ locale: es }), 5).message).toBe(
      es.messages.NOT_A_STRING
    );
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
        const issue = firstIssue(zNif({ locale }), value);
        expect(issue.message).toBe(validate(value, { locale }).error?.message);
      }
    }
    expect(firstIssue(zNif({ locale: es }), "12345678A").message).toBe(
      "El carácter de control no es correcto: para este DNI debería ser «Z»."
    );
    expect(firstIssue(zNif({ locale: es }), "12345678A").message).not.toBe(
      firstIssue(zNif(), "12345678A").message
    );
  });

  it("locale: an unknown locale gives English, as validate() does", () => {
    const issue = firstIssue(zNif({ locale: "es" as never }), "12345678A");
    expect(issue.message).toBe(
      en.messages.INVALID_CONTROL_CHARACTER("DNI", "Z")
    );
  });

  it("types: only those document types", () => {
    const schema = zNif({ types: ["DNI", "NIE"] });
    expect(schema.parse("12345678Z")).toBe("12345678Z");
    expect(schema.parse("X1234567L")).toBe("X1234567L");
    expect(params(firstIssue(schema, "B12345674")).code).toBe(
      "UNSUPPORTED_TYPE"
    );
    expect(params(firstIssue(schema, "K1234567L")).code).toBe(
      "UNSUPPORTED_TYPE"
    );
  });

  it("types: a type-specific schema ignores the types of the options", () => {
    const schema = zDni({ types: ["CIF"] } as never);
    expect(schema.parse("12345678Z")).toBe("12345678Z");
    expect(params(firstIssue(schema, "B12345674")).code).toBe(
      "UNSUPPORTED_TYPE"
    );
  });

  it("normalize: false turns the cleanup off", () => {
    expect(zNif().parse(" 12.345.678-Z ")).toBe("12345678Z");
    const strict = zNif({ normalize: false });
    expect(strict.safeParse(" 12.345.678-Z ").success).toBe(false);
    expect(strict.safeParse("1234567L").success).toBe(false);
    expect(strict.parse("12345678z")).toBe("12345678Z");
    expect(zDni({ normalize: false }).safeParse("1234567L").success).toBe(
      false
    );
  });

  it("cifControl: lenient accepts a letter for C D F G J U V", () => {
    expect(zNif().safeParse("G1234567D").success).toBe(false);
    expect(zNif({ cifControl: "lenient" }).parse("G1234567D")).toBe(
      "G1234567D"
    );
    expect(zCif({ cifControl: "lenient" }).parse("g1234567d")).toBe(
      "G1234567D"
    );
    expect(
      zCif({ cifControl: "official" }).safeParse("G1234567D").success
    ).toBe(false);
    // B still takes a digit.
    expect(zNif({ cifControl: "lenient" }).safeParse("B1234567D").success).toBe(
      false
    );
  });

  it("allowVatPrefix: zNif accepts ES and outputs the NIF only", () => {
    expect(zNif().safeParse("ES12345678Z").success).toBe(false);
    expect(zNif({ allowVatPrefix: true }).parse("ES12345678Z")).toBe(
      "12345678Z"
    );
    expect(zNif({ allowVatPrefix: true }).parse("12345678Z")).toBe("12345678Z");
  });

  it("all the options together", () => {
    const schema = zNif({
      types: ["DNI"],
      normalize: false,
      rejectPlaceholders: true,
      locale: es,
    } satisfies ValidateOptions);
    expect(schema.parse("12345678Z")).toBe("12345678Z");
    expect(firstIssue(schema, "00000000T").message).toBe(
      es.messages.PLACEHOLDER
    );
  });

  it("every schema takes null options, like validate()", () => {
    expect(zNif(null as never).parse("12345678Z")).toBe("12345678Z");
    expect(zDni(null as never).parse("12345678Z")).toBe("12345678Z");
    expect(zSpanishVat(null as never).parse("ES12345678Z")).toBe("ES12345678Z");
  });
});

describe("VAT-1: zSpanishVat", () => {
  it("VAT-1: requires the ES prefix, as isValidSpanishVat does", () => {
    const issue = firstIssue(zSpanishVat(), "12345678Z");
    expect(issue.message).toBe(en.messages.INVALID_LENGTH["VAT-1"]);
    expect(params(issue)).toEqual({ code: "INVALID_LENGTH", rule: "VAT-1" });
    expect(firstIssue(zSpanishVat({ locale: es }), "12345678Z").message).toBe(
      es.messages.INVALID_LENGTH["VAT-1"]
    );
  });

  it("VAT-1: the NIF after the prefix must be valid, with its own error", () => {
    const issue = firstIssue(zSpanishVat(), "ES12345678A");
    expect(params(issue)).toEqual({
      code: "INVALID_CONTROL_CHARACTER",
      rule: "DNI-2",
      expected: "Z",
    });
    expect(firstIssue(zSpanishVat(), "ES").message).toBe(
      en.messages.INVALID_LENGTH["VAT-1"]
    );
    // Without the prefix, an invalid NIF gives the NIF's error.
    expect(params(firstIssue(zSpanishVat(), "12345678A")).rule).toBe("DNI-2");
  });

  it("VAT-1: takes the other options", () => {
    expect(zSpanishVat({ types: ["CIF"] }).parse("ESB12345674")).toBe(
      "ESB12345674"
    );
    expect(
      params(firstIssue(zSpanishVat({ types: ["CIF"] }), "ES12345678Z")).code
    ).toBe("UNSUPPORTED_TYPE");
    expect(zSpanishVat({ cifControl: "lenient" }).parse("ESG1234567D")).toBe(
      "ESG1234567D"
    );
    expect(
      zSpanishVat({ rejectPlaceholders: true }).safeParse("ES00000000T").success
    ).toBe(false);
  });

  it("VAT-1: the output is a valid VAT number", () => {
    const gen = createGenerator(SEED);
    for (let i = 0; i < 500; i++) {
      const vat = zSpanishVat().parse(`es ${gen.nif({ format: true })}`);
      expect(vat).toMatch(/^ES[0-9A-Z]{9}$/);
      expect(zSpanishVat().parse(vat)).toBe(vat);
    }
  });
});

describe("the schemas work like any Zod schema", () => {
  const form = z.object({
    nif: zNif({ types: ["DNI", "NIE"], locale: es }),
    company: zCif().optional(),
    others: z.array(zNie()),
  });

  it("z.object: parses to the normalized values", () => {
    expect(
      form.parse({
        nif: " 12.345.678-z ",
        company: "b-1234567-4",
        others: ["x1234567l", "Y 1234567 X"],
      })
    ).toEqual({
      nif: "12345678Z",
      company: "B12345674",
      others: ["X1234567L", "Y1234567X"],
    });
    expect(form.parse({ nif: "12345678Z", others: [] })).toEqual({
      nif: "12345678Z",
      others: [],
    });
  });

  it("z.object: the issues have a path, the message and the params", () => {
    const result = form.safeParse({
      nif: "12345678A",
      company: "B1",
      others: ["X1234567L", "x12"],
    });
    expect(result.success).toBe(false);
    const issues = result.error?.issues ?? [];
    expect(issues.map((i) => i.path.join("."))).toEqual([
      "nif",
      "company",
      "others.1",
    ]);
    expect(issues[0]?.message).toBe(
      "El carácter de control no es correcto: para este DNI debería ser «Z»."
    );
    expect(params(issues[0] as z.core.$ZodIssue).code).toBe(
      "INVALID_CONTROL_CHARACTER"
    );
    expect(params(issues[1] as z.core.$ZodIssue).code).toBe("INVALID_LENGTH");
  });

  it("z.flattenError gives the messages by field (React Hook Form)", () => {
    const result = form.safeParse({ nif: "", others: [] });
    const flat = z.flattenError(
      result.error as z.ZodError<z.infer<typeof form>>
    );
    expect(flat.fieldErrors.nif).toEqual([es.messages.EMPTY]);
  });

  it("optional and nullable still work", () => {
    expect(zNif().optional().parse(undefined)).toBeUndefined();
    expect(zNif().nullable().parse(null)).toBeNull();
    expect(zNif().nullable().parse("12345678z")).toBe("12345678Z");
    expect(zNif().optional().safeParse("bad").success).toBe(false);
  });

  it("parseAsync works too", async () => {
    await expect(zNif().parseAsync(" 12345678z")).resolves.toBe("12345678Z");
    await expect(zNif().parseAsync("12345678A")).rejects.toThrow(
      "The control character"
    );
  });

  it("the schema has no side effects: every call is independent", () => {
    const schema = zNif();
    expect(schema.parse("12345678Z")).toBe("12345678Z");
    expect(schema.safeParse("12345678A").success).toBe(false);
    expect(schema.parse("x1234567l")).toBe("X1234567L");
  });
});

describe("agreement with validate()", () => {
  const SCHEMAS: [NifSchemaKind, (opts?: never) => NifSchema][] = [
    ["nif", zNif],
    ["dni", zDni],
    ["nie", zNie],
    ["cif", zCif],
    ["vat", zSpanishVat],
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
        const result = schema.safeParse(value);
        expect(result.success).toBe(checked.ok);
        if (checked.ok) expect(result.data).toBe(checked.value);
        else
          expect(result.error?.issues[0]?.message).toBe(checked.error.message);
      }
    }
  });

  it("zNif agrees with validate() on arbitrary strings", () => {
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
        const result = zNif(opts).safeParse(value);
        expect(result.success).toBe(expected.valid);
        if (expected.valid) expect(result.data).toBe(expected.normalized);
        else {
          const issue = result.error?.issues[0] as z.core.$ZodIssue;
          expect(issue.message).toBe(expected.error?.message);
          expect(params(issue).code).toBe(expected.error?.code);
          expect(params(issue).rule).toBe(expected.error?.rule);
        }
      }),
      { seed: SEED, numRuns: 3000 }
    );
  });

  it("the output always validates again, unchanged", () => {
    const gen = createGenerator(SEED + 1);
    for (let i = 0; i < 1000; i++) {
      const output = zNif().parse(gen.nif({ format: true }));
      expect(validate(output).valid).toBe(true);
      expect(validate(output).normalized).toBe(output);
    }
  });
});

describe("the shared core", () => {
  it("notAStringMessage is the NOT_A_STRING message of the locale", () => {
    expect(notAStringMessage()).toBe(en.messages.NOT_A_STRING);
    expect(notAStringMessage({ locale: es })).toBe(es.messages.NOT_A_STRING);
  });

  it("checkNif gives the normalized value or the error, never throws", () => {
    expect(checkNif(" 12345678z", "nif")).toEqual({
      ok: true,
      value: "12345678Z",
    });
    expect(checkNif(null, "nif")).toMatchObject({
      ok: false,
      error: { code: "NOT_A_STRING" },
    });
    expect(checkNif(null, "vat")).toMatchObject({
      ok: false,
      error: { code: "NOT_A_STRING" },
    });
    expect(checkNif(5, "dni", { locale: es })).toMatchObject({
      ok: false,
      error: { message: es.messages.NOT_A_STRING },
    });
  });
});

describe("types", () => {
  it("every schema is a string schema: its input and output are string", () => {
    expectTypeOf<z.input<NifSchema>>().toEqualTypeOf<string>();
    expectTypeOf<z.output<NifSchema>>().toEqualTypeOf<string>();
    expectTypeOf(zNif()).toEqualTypeOf<NifSchema>();
    expectTypeOf(zDni()).toEqualTypeOf<NifSchema>();
    expectTypeOf(zNie()).toEqualTypeOf<NifSchema>();
    expectTypeOf(zCif()).toEqualTypeOf<NifSchema>();
    expectTypeOf(zSpanishVat()).toEqualTypeOf<NifSchema>();
    expectTypeOf<ReturnType<NifSchema["parse"]>>().toEqualTypeOf<string>();
  });

  it("z.infer and z.input of a form are typed", () => {
    const form = z.object({ nif: zNif(), vat: zSpanishVat().optional() });
    expectTypeOf<z.infer<typeof form>>().toEqualTypeOf<{
      nif: string;
      vat?: string | undefined;
    }>();
    expectTypeOf<z.input<typeof form>>().toEqualTypeOf<{
      nif: string;
      vat?: string | undefined;
    }>();
    const result = form.safeParse({});
    if (result.success) expectTypeOf(result.data.nif).toEqualTypeOf<string>();
  });

  it("the options are those of validate(), minus what the schema fixes", () => {
    expectTypeOf(zNif)
      .parameter(0)
      .toEqualTypeOf<ValidateOptions | undefined>();
    expectTypeOf(zDni)
      .parameter(0)
      .toEqualTypeOf<Omit<ValidateOptions, "types"> | undefined>();
    expectTypeOf(zSpanishVat)
      .parameter(0)
      .toEqualTypeOf<Omit<ValidateOptions, "allowVatPrefix"> | undefined>();
    // @ts-expect-error zDni fixes the types
    zDni({ types: ["CIF"] });
    // @ts-expect-error zSpanishVat always allows the prefix
    zSpanishVat({ allowVatPrefix: false });
    // @ts-expect-error a locale is an object, not a language code
    zNif({ locale: "es" });
  });

  it("NifIssueParams is what the issue params hold", () => {
    expectTypeOf<NifIssueParams["code"]>().toEqualTypeOf<
      import("..").NifErrorCode
    >();
    expectTypeOf<NifIssueParams["rule"]>().toEqualTypeOf<string>();
    expectTypeOf<NifIssueParams["expected"]>().toEqualTypeOf<
      string | undefined
    >();
  });
});
