import fc from "fast-check";
import * as v from "valibot";
import { describe, expect, expectTypeOf, it } from "vitest";
import { type NifErrorCode, type ValidateOptions, validate } from "..";
import { checkNif, type NifSchemaKind } from "../adapter";
import { createGenerator } from "../generate/index";
import { ca } from "../locales/ca";
import { en } from "../locales/en";
import { es } from "../locales/es";
import { eu } from "../locales/eu";
import { gl } from "../locales/gl";
import {
  type NifAction,
  type NifIssue,
  type NifSchema,
  vCif,
  vDni,
  vNie,
  vNif,
  vSpanishVat,
} from "../valibot/index";

// The Valibot adapter (#58, `nif-dni-nie-cif-validation/valibot`), tested
// against Valibot itself. The schemas must accept what validate() accepts,
// output its normalized value, and give its message, code and rule.

const SEED = 58;

/** The first issue of a failed parse. */
function firstIssue(schema: NifSchema, value: unknown) {
  const result = v.safeParse(schema, value);
  expect(result.success).toBe(false);
  return (result.issues as v.BaseIssue<unknown>[])[0] as v.BaseIssue<unknown>;
}

/** The first issue, as the NIF issue that the transformation makes. */
const nifIssue = (schema: NifSchema, value: unknown) =>
  firstIssue(schema, value) as NifIssue;

describe("NORM-1: valid values give the normalized value", () => {
  const CASES: [schema: () => NifSchema, input: string, output: string][] = [
    [vNif, "12345678Z", "12345678Z"],
    [vNif, " 12.345.678-z ", "12345678Z"],
    [vNif, "x-01234567-l", "X1234567L"],
    [vNif, "1234567L", "01234567L"],
    [vNif, "k1234567l", "K1234567L"],
    [vNif, " b-1234567-4 ", "B12345674"],
    [vNif, "p2807900b", "P2807900B"],
    [vDni, "12345678Z", "12345678Z"],
    [vDni, "1234567-l", "01234567L"],
    [vDni, "K1234567L", "K1234567L"],
    [vNie, "X1234567L", "X1234567L"],
    [vNie, "X01234567L", "X1234567L"],
    [vNie, " y 1234567 x ", "Y1234567X"],
    [vCif, "B12345674", "B12345674"],
    [vCif, "q-2826000-h", "Q2826000H"],
    [vSpanishVat, "ES12345678Z", "ES12345678Z"],
    [vSpanishVat, "es b-1234567-4", "ESB12345674"],
    [vSpanishVat, "E S 0 1 2 3 4 5 6 7 l", "ES01234567L"],
  ];
  for (const [schema, input, output] of CASES) {
    it(`${schema.name}(${JSON.stringify(input)}) gives ${output}`, () => {
      expect(v.parse(schema(), input)).toBe(output);
      const result = v.safeParse(schema(), input);
      expect(result.success).toBe(true);
      expect(result.output).toBe(output);
    });
  }

  it("NIE-3: an NIE in the old 10-character form is shortened", () => {
    expect(v.parse(vNif(), "X01234567L")).toBe("X1234567L");
  });

  it("NORM-4: a DNI with fewer than 8 digits is padded", () => {
    expect(v.parse(vNif(), "12-n")).toBe("00000012N");
    expect(v.parse(vDni(), "1234567L")).toBe("01234567L");
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
      const issue = nifIssue(vNif(), value);
      expect(issue.message).toBe(expected?.message);
      expect(issue.code).toBe(code);
      expect(issue.rule).toBe(rule);
      expect(issue.expected).toBe(expected?.expected ?? null);
      expect(issue.kind).toBe("transformation");
      expect(issue.type).toBe("nif");
      expect(issue.input).toBe(value);
      expect(issue.received).toBe(`"${value}"`);
    });
  }

  it("INVALID_CONTROL_CHARACTER: expected is the right control character", () => {
    const issue = nifIssue(vDni(), "12345678A");
    expect(issue.expected).toBe("Z");
    expect(issue.code).toBe("INVALID_CONTROL_CHARACTER");
    expect(issue.rule).toBe("DNI-2");
  });

  it("only the first problem is reported, once", () => {
    const result = v.safeParse(vNif(), "12345678A");
    expect(result.issues).toHaveLength(1);
  });

  it("UNSUPPORTED_TYPE (POLICY-2): a valid document of another type", () => {
    const issue = nifIssue(vDni(), "X1234567L");
    expect(issue.message).toBe(
      validate("X1234567L", { types: ["DNI", "NIF_KLM"] }).error?.message
    );
    expect(issue.code).toBe("UNSUPPORTED_TYPE");
    expect(issue.rule).toBe("POLICY-2");
    expect(nifIssue(vNie(), "12345678Z").code).toBe("UNSUPPORTED_TYPE");
    expect(nifIssue(vCif(), "12345678Z").code).toBe("UNSUPPORTED_TYPE");
    expect(nifIssue(vCif(), "X1234567L").code).toBe("UNSUPPORTED_TYPE");
    expect(nifIssue(vNie(), "B12345674").code).toBe("UNSUPPORTED_TYPE");
  });

  it("PLACEHOLDER (POLICY-1): with rejectPlaceholders", () => {
    for (const value of ["00000000T", "00000001R", "99999999R", "X0000000T"]) {
      expect(v.parse(vNif(), value)).toBe(value);
      const issue = nifIssue(vNif({ rejectPlaceholders: true }), value);
      expect(issue.code).toBe("PLACEHOLDER");
      expect(issue.rule).toBe("POLICY-1");
    }
  });

  it("the issue is a Valibot issue: flatten and getDotPath work", () => {
    const form = v.object({ nif: vNif({ locale: es }) });
    const result = v.safeParse(form, { nif: "12345678A" });
    const issues = result.issues as [v.BaseIssue<unknown>];
    expect(v.getDotPath(issues[0] as never)).toBe("nif");
    expect(v.flatten(issues as never).nested?.nif).toEqual([
      "El carácter de control no es correcto: para este DNI debería ser «Z».",
    ]);
  });

  it("the issue takes the language config of the parse", () => {
    const result = v.safeParse(vNif(), "12345678A", {
      lang: "es",
      abortEarly: true,
      abortPipeEarly: true,
    });
    const issue = result.issues?.[0] as NifIssue;
    expect(issue.lang).toBe("es");
    expect(issue.abortEarly).toBe(true);
    expect(issue.abortPipeEarly).toBe(true);
    // The message is the one of validate(), not Valibot's.
    expect(issue.message).toBe(
      en.messages.INVALID_CONTROL_CHARACTER("DNI", "Z")
    );
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
      for (const schema of [vNif(), vDni(), vNie(), vCif(), vSpanishVat()]) {
        const issue = firstIssue(schema, value);
        expect(issue.type).toBe("string");
        expect(issue.message).toBe(validate(value).error?.message);
        expect(issue.message).toBe(en.messages.NOT_A_STRING);
      }
    });
  }

  it("the message is in the locale", () => {
    expect(firstIssue(vNif({ locale: es }), 5).message).toBe(
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
        const issue = firstIssue(vNif({ locale }), value);
        expect(issue.message).toBe(validate(value, { locale }).error?.message);
      }
    }
    expect(firstIssue(vNif({ locale: es }), "12345678A").message).toBe(
      "El carácter de control no es correcto: para este DNI debería ser «Z»."
    );
    expect(firstIssue(vNif({ locale: es }), "12345678A").message).not.toBe(
      firstIssue(vNif(), "12345678A").message
    );
  });

  it("locale: an unknown locale gives English, as validate() does", () => {
    const issue = firstIssue(vNif({ locale: "es" as never }), "12345678A");
    expect(issue.message).toBe(
      en.messages.INVALID_CONTROL_CHARACTER("DNI", "Z")
    );
  });

  it("types: only those document types", () => {
    const schema = vNif({ types: ["DNI", "NIE"] });
    expect(v.parse(schema, "12345678Z")).toBe("12345678Z");
    expect(v.parse(schema, "X1234567L")).toBe("X1234567L");
    expect(nifIssue(schema, "B12345674").code).toBe("UNSUPPORTED_TYPE");
    expect(nifIssue(schema, "K1234567L").code).toBe("UNSUPPORTED_TYPE");
  });

  it("types: a type-specific schema ignores the types of the options", () => {
    const schema = vDni({ types: ["CIF"] } as never);
    expect(v.parse(schema, "12345678Z")).toBe("12345678Z");
    expect(nifIssue(schema, "B12345674").code).toBe("UNSUPPORTED_TYPE");
  });

  it("normalize: false turns the cleanup off", () => {
    expect(v.parse(vNif(), " 12.345.678-Z ")).toBe("12345678Z");
    const strict = vNif({ normalize: false });
    expect(v.safeParse(strict, " 12.345.678-Z ").success).toBe(false);
    expect(v.safeParse(strict, "1234567L").success).toBe(false);
    expect(v.parse(strict, "12345678z")).toBe("12345678Z");
    expect(v.safeParse(vDni({ normalize: false }), "1234567L").success).toBe(
      false
    );
  });

  it("cifControl: lenient accepts a letter for C D F G J U V", () => {
    expect(v.safeParse(vNif(), "G1234567D").success).toBe(false);
    expect(v.parse(vNif({ cifControl: "lenient" }), "G1234567D")).toBe(
      "G1234567D"
    );
    expect(v.parse(vCif({ cifControl: "lenient" }), "g1234567d")).toBe(
      "G1234567D"
    );
    expect(
      v.safeParse(vCif({ cifControl: "official" }), "G1234567D").success
    ).toBe(false);
    // B still takes a digit.
    expect(
      v.safeParse(vNif({ cifControl: "lenient" }), "B1234567D").success
    ).toBe(false);
  });

  it("allowVatPrefix: vNif accepts ES and outputs the NIF only", () => {
    expect(v.safeParse(vNif(), "ES12345678Z").success).toBe(false);
    expect(v.parse(vNif({ allowVatPrefix: true }), "ES12345678Z")).toBe(
      "12345678Z"
    );
    expect(v.parse(vNif({ allowVatPrefix: true }), "12345678Z")).toBe(
      "12345678Z"
    );
  });

  it("all the options together", () => {
    const schema = vNif({
      types: ["DNI"],
      normalize: false,
      rejectPlaceholders: true,
      locale: es,
    } satisfies ValidateOptions);
    expect(v.parse(schema, "12345678Z")).toBe("12345678Z");
    expect(firstIssue(schema, "00000000T").message).toBe(
      es.messages.PLACEHOLDER
    );
  });

  it("every schema takes null options, like validate()", () => {
    expect(v.parse(vNif(null as never), "12345678Z")).toBe("12345678Z");
    expect(v.parse(vDni(null as never), "12345678Z")).toBe("12345678Z");
    expect(v.parse(vSpanishVat(null as never), "ES12345678Z")).toBe(
      "ES12345678Z"
    );
  });
});

describe("VAT-1: vSpanishVat", () => {
  it("VAT-1: requires the ES prefix, as isValidSpanishVat does", () => {
    const issue = nifIssue(vSpanishVat(), "12345678Z");
    expect(issue.message).toBe(en.messages.INVALID_LENGTH["VAT-1"]);
    expect(issue.code).toBe("INVALID_LENGTH");
    expect(issue.rule).toBe("VAT-1");
    expect(firstIssue(vSpanishVat({ locale: es }), "12345678Z").message).toBe(
      es.messages.INVALID_LENGTH["VAT-1"]
    );
  });

  it("VAT-1: the NIF after the prefix must be valid, with its own error", () => {
    const issue = nifIssue(vSpanishVat(), "ES12345678A");
    expect(issue.code).toBe("INVALID_CONTROL_CHARACTER");
    expect(issue.rule).toBe("DNI-2");
    expect(issue.expected).toBe("Z");
    expect(firstIssue(vSpanishVat(), "ES").message).toBe(
      en.messages.INVALID_LENGTH["VAT-1"]
    );
    // Without the prefix, an invalid NIF gives the NIF's error.
    expect(nifIssue(vSpanishVat(), "12345678A").rule).toBe("DNI-2");
  });

  it("VAT-1: takes the other options", () => {
    expect(v.parse(vSpanishVat({ types: ["CIF"] }), "ESB12345674")).toBe(
      "ESB12345674"
    );
    expect(nifIssue(vSpanishVat({ types: ["CIF"] }), "ES12345678Z").code).toBe(
      "UNSUPPORTED_TYPE"
    );
    expect(v.parse(vSpanishVat({ cifControl: "lenient" }), "ESG1234567D")).toBe(
      "ESG1234567D"
    );
    expect(
      v.safeParse(vSpanishVat({ rejectPlaceholders: true }), "ES00000000T")
        .success
    ).toBe(false);
  });

  it("VAT-1: the output is a valid VAT number", () => {
    const gen = createGenerator(SEED);
    for (let i = 0; i < 500; i++) {
      const vat = v.parse(vSpanishVat(), `es ${gen.nif({ format: true })}`);
      expect(vat).toMatch(/^ES[0-9A-Z]{9}$/);
      expect(v.parse(vSpanishVat(), vat)).toBe(vat);
    }
  });
});

describe("the schemas work like any Valibot schema", () => {
  const form = v.object({
    nif: vNif({ types: ["DNI", "NIE"], locale: es }),
    company: v.optional(vCif()),
    others: v.array(vNie()),
  });

  it("object: parses to the normalized values", () => {
    expect(
      v.parse(form, {
        nif: " 12.345.678-z ",
        company: "b-1234567-4",
        others: ["x1234567l", "Y 1234567 X"],
      })
    ).toEqual({
      nif: "12345678Z",
      company: "B12345674",
      others: ["X1234567L", "Y1234567X"],
    });
    expect(v.parse(form, { nif: "12345678Z", others: [] })).toEqual({
      nif: "12345678Z",
      others: [],
    });
  });

  it("object: the issues have a path, the message and the metadata", () => {
    const result = v.safeParse(form, {
      nif: "12345678A",
      company: "B1",
      others: ["X1234567L", "x12"],
    });
    expect(result.success).toBe(false);
    const issues = (result.issues ?? []) as NifIssue[];
    expect(
      issues.map((i) => i.path?.map((p) => String(p.key)).join("."))
    ).toEqual(["nif", "company", "others.1"]);
    expect(issues[0]?.message).toBe(
      "El carácter de control no es correcto: para este DNI debería ser «Z»."
    );
    expect(issues[0]?.code).toBe("INVALID_CONTROL_CHARACTER");
    expect(issues[1]?.code).toBe("INVALID_LENGTH");
    expect(issues[2]?.rule).toBe("NIE-1");
  });

  it("flatten gives the messages by field (React Hook Form)", () => {
    const result = v.safeParse(form, { nif: "", others: [] });
    const flat = v.flatten<typeof form>(
      result.issues as [v.InferIssue<typeof form>]
    );
    expect(flat.nested?.nif).toEqual([es.messages.EMPTY]);
  });

  it("optional and nullable still work", () => {
    expect(v.parse(v.optional(vNif()), undefined)).toBeUndefined();
    expect(v.parse(v.nullable(vNif()), null)).toBeNull();
    expect(v.parse(v.nullable(vNif()), "12345678z")).toBe("12345678Z");
    expect(v.safeParse(v.optional(vNif()), "bad").success).toBe(false);
  });

  it("parseAsync works too", async () => {
    await expect(v.parseAsync(vNif(), " 12345678z")).resolves.toBe("12345678Z");
    await expect(v.parseAsync(vNif(), "12345678A")).rejects.toThrow(
      "The control character"
    );
  });

  it("the schema has no side effects: every call is independent", () => {
    const schema = vNif();
    expect(v.parse(schema, "12345678Z")).toBe("12345678Z");
    expect(v.safeParse(schema, "12345678A").success).toBe(false);
    expect(v.parse(schema, "x1234567l")).toBe("X1234567L");
  });

  it("the schema can be followed by more actions", () => {
    const schema = v.pipe(
      vNif(),
      v.check((value) => value.startsWith("X"), "Only an NIE starting with X")
    );
    expect(v.parse(schema, "x1234567l")).toBe("X1234567L");
    expect(firstIssue(schema as never, "12345678Z").message).toBe(
      "Only an NIE starting with X"
    );
    // The first failure stops the pipe: the later check doesn't run.
    expect(v.safeParse(schema, "12345678A").issues).toHaveLength(1);
  });

  it("a transformation is a valibot action of its own kind", () => {
    const [, action] = vNif().pipe;
    expect(action.kind).toBe("transformation");
    expect(action.type).toBe("nif");
    expect(action.async).toBe(false);
    expect(typeof action.reference).toBe("function");
    expect(action.reference("nif")).toMatchObject({ type: "nif" });
  });
});

describe("agreement with validate()", () => {
  const SCHEMAS: [NifSchemaKind, (opts?: never) => NifSchema][] = [
    ["nif", vNif],
    ["dni", vDni],
    ["nie", vNie],
    ["cif", vCif],
    ["vat", vSpanishVat],
  ];

  it("every schema accepts exactly what checkNif accepts, and outputs the same", () => {
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
        const result = v.safeParse(schema, value);
        expect(result.success).toBe(checked.ok);
        if (checked.ok) expect(result.output).toBe(checked.value);
        else expect(result.issues?.[0]?.message).toBe(checked.error.message);
      }
    }
  });

  it("vNif agrees with validate() on arbitrary strings", () => {
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
        const result = v.safeParse(vNif(opts), value);
        expect(result.success).toBe(expected.valid);
        if (expected.valid) expect(result.output).toBe(expected.normalized);
        else {
          const issue = result.issues?.[0] as NifIssue;
          expect(issue.message).toBe(expected.error?.message);
          expect(issue.code).toBe(expected.error?.code);
          expect(issue.rule).toBe(expected.error?.rule);
        }
      }),
      { seed: SEED, numRuns: 3000 }
    );
  });

  it("the output always validates again, unchanged", () => {
    const gen = createGenerator(SEED + 1);
    for (let i = 0; i < 1000; i++) {
      const output = v.parse(vNif(), gen.nif({ format: true }));
      expect(validate(output).valid).toBe(true);
      expect(validate(output).normalized).toBe(output);
    }
  });
});

describe("types", () => {
  it("every schema is a string schema: its input and output are string", () => {
    expectTypeOf<v.InferInput<NifSchema>>().toEqualTypeOf<string>();
    expectTypeOf<v.InferOutput<NifSchema>>().toEqualTypeOf<string>();
    expectTypeOf(vNif()).toEqualTypeOf<NifSchema>();
    expectTypeOf(vDni()).toEqualTypeOf<NifSchema>();
    expectTypeOf(vNie()).toEqualTypeOf<NifSchema>();
    expectTypeOf(vCif()).toEqualTypeOf<NifSchema>();
    expectTypeOf(vSpanishVat()).toEqualTypeOf<NifSchema>();
  });

  it("InferOutput, InferInput and InferIssue of a form are typed", () => {
    const form = v.object({
      nif: vNif(),
      vat: v.optional(vSpanishVat()),
    });
    expectTypeOf<v.InferOutput<typeof form>>().toEqualTypeOf<{
      nif: string;
      vat?: string | undefined;
    }>();
    expectTypeOf<v.InferInput<typeof form>>().toEqualTypeOf<{
      nif: string;
      vat?: string | undefined;
    }>();
    const result = v.safeParse(form, {});
    if (result.success) expectTypeOf(result.output.nif).toEqualTypeOf<string>();
    // The issues of a schema include the NIF issue, with its metadata.
    expectTypeOf<NifIssue>().toExtend<v.InferIssue<NifSchema>>();
  });

  it("the NIF issue has the code, the rule and the expected character", () => {
    expectTypeOf<NifIssue["code"]>().toEqualTypeOf<NifErrorCode>();
    expectTypeOf<NifIssue["rule"]>().toEqualTypeOf<string>();
    expectTypeOf<NifIssue["expected"]>().toEqualTypeOf<string | null>();
    expectTypeOf<NifIssue["kind"]>().toEqualTypeOf<"transformation">();
    expectTypeOf<NifIssue["type"]>().toEqualTypeOf<"nif">();
    expectTypeOf<NifAction["type"]>().toEqualTypeOf<"nif">();
  });

  it("the options are those of validate(), minus what the schema fixes", () => {
    expectTypeOf(vNif)
      .parameter(0)
      .toEqualTypeOf<ValidateOptions | undefined>();
    expectTypeOf(vDni)
      .parameter(0)
      .toEqualTypeOf<Omit<ValidateOptions, "types"> | undefined>();
    expectTypeOf(vSpanishVat)
      .parameter(0)
      .toEqualTypeOf<Omit<ValidateOptions, "allowVatPrefix"> | undefined>();
    // @ts-expect-error vDni fixes the types
    vDni({ types: ["CIF"] });
    // @ts-expect-error vSpanishVat always allows the prefix
    vSpanishVat({ allowVatPrefix: false });
    // @ts-expect-error a locale is an object, not a language code
    vNif({ locale: "es" });
  });
});
