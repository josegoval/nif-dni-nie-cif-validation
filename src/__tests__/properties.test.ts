import fc from "fast-check";
import { describe, expect, it } from "vitest";
import * as lib from "..";
import {
  computeControlCharacter,
  getNifType,
  type IsValidOptions,
  isValidCif,
  isValidDni,
  isValidNaturalPersonNif,
  isValidNie,
  isValidNif,
  normalize,
  type ValidateOptions,
  validate,
} from "..";
import { SPEC_RULES } from "./specRules";

// Property-based tests (#41, #40) with fast-check. The generators build
// documents with their own implementation of the published algorithms, so
// they don't reuse the code under test. Seeded, so a failure reproduces.

const SEED = 41;
const RUNS = 3000;
const params = { seed: SEED, numRuns: RUNS };

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const CIF_LETTERS = "JABCDEFGHI";
const CIF_KEYS = "ABCDEFGHJNPQRSUVW";
const CIF_LETTER_KEYS = "NPQRSW";
const LENIENT_KEYS = "CDFGJUV";
const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const pad = (n: number, length: number) => String(n).padStart(length, "0");

function cifControl(digits: string): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const d = Number(digits[i]);
    sum += i % 2 === 0 ? Math.floor((2 * d) / 10) + ((2 * d) % 10) : d;
  }
  return (10 - (sum % 10)) % 10;
}

const dni = fc
  .integer({ min: 0, max: 99_999_999 })
  .map((n) => pad(n, 8) + DNI_LETTERS[n % 23]);
const klm = fc
  .tuple(fc.constantFrom("K", "L", "M"), fc.integer({ min: 0, max: 9_999_999 }))
  .map(([prefix, n]) => prefix + pad(n, 7) + DNI_LETTERS[n % 23]);
const nie = fc
  .tuple(fc.integer({ min: 0, max: 2 }), fc.integer({ min: 0, max: 9_999_999 }))
  .map(
    ([p, n]) => "XYZ"[p] + pad(n, 7) + DNI_LETTERS[(p * 10_000_000 + n) % 23]
  );
const cif = fc
  .tuple(fc.constantFrom(...CIF_KEYS), fc.integer({ min: 0, max: 9_999_999 }))
  .map(([key, n]) => {
    const digits = pad(n, 7);
    const control = cifControl(digits);
    return (
      key +
      digits +
      (CIF_LETTER_KEYS.includes(key) ? CIF_LETTERS[control] : control)
    );
  });

/** A valid document in canonical form (official CIF control). */
const validDocument = fc.oneof(dni, klm, nie, cif);

/** A valid document as a person might type it. */
const typedDocument = fc
  .tuple(
    validDocument,
    fc.array(fc.tuple(fc.nat(), fc.constantFrom(" ", ".", "-", "/", "\t")), {
      maxLength: 4,
    }),
    fc.boolean(),
    fc.boolean()
  )
  .map(([doc, separators, lower, oldForm]) => {
    let value = oldForm && doc.startsWith("X") ? `X0${doc.slice(1)}` : doc;
    if (lower) value = value.toLowerCase();
    for (const [at, separator] of separators) {
      const i = at % (value.length + 1);
      value = value.slice(0, i) + separator + value.slice(i);
    }
    return value;
  });

/** Strings around document length, from a document-like alphabet. */
const documentLike = fc.string({
  unit: fc.constantFrom(...`${ALPHANUMERIC}abc xyz.-/_ñÑıſ`.split("")),
  maxLength: 14,
});

/** Anything: typed documents, near-documents, any string, any value. */
const anyInput = fc.oneof(
  typedDocument,
  documentLike,
  fc.string({ unit: "binary", maxLength: 20 }),
  fc.anything()
);

const anyOptions = fc.oneof(
  fc.record(
    {
      normalize: fc.boolean(),
      cifControl: fc.constantFrom("official" as const, "lenient" as const),
      rejectPlaceholders: fc.boolean(),
      allowVatPrefix: fc.boolean(),
      locale: fc.constantFrom("en" as const, "es" as const),
      types: fc.subarray(["DNI", "NIE", "CIF", "NIF_KLM"] as const),
    },
    { requiredKeys: [] }
  ),
  fc.anything()
);

describe("properties: never throw (#40)", () => {
  const functions = Object.entries(lib).filter(
    ([name, value]) =>
      typeof value === "function" && name !== "replaceNieLetter"
  ) as [string, (value: unknown, opts?: unknown) => unknown][];

  it("INPUT-1: covers every exported function but the deprecated one", () =>
    expect(functions.length).toBe(16));

  it.each(functions)(
    "INPUT-1: %s never throws, whatever the value and options",
    (_name, fn) => {
      fc.assert(
        fc.property(anyInput, anyOptions, (value, opts) => {
          fn(value, opts);
          fn(value);
        }),
        params
      );
    }
  );

  it("INPUT-1: the booleans always return a boolean", () => {
    const booleans = functions.filter(([name]) => name.startsWith("isValid"));
    fc.assert(
      fc.property(anyInput, anyOptions, (value, opts) => {
        for (const [, fn] of booleans)
          expect(typeof fn(value, opts)).toBe("boolean");
      }),
      params
    );
  });
});

describe("properties: generated documents", () => {
  it("DNI-2 / KLM-2 / NIE-2 / CIF-4: every generated document validates", () => {
    fc.assert(
      fc.property(validDocument, (doc) => {
        expect(isValidNif(doc)).toBe(true);
        expect(validate(doc)).toMatchObject({ valid: true, normalized: doc });
      }),
      params
    );
  });

  it("NORM-2..4: every typed document validates, and normalizes to itself", () => {
    fc.assert(
      fc.property(typedDocument, (typed) => {
        const result = validate(typed);
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe(normalize(typed));
        expect(isValidNif(typed)).toBe(true);
      }),
      params
    );
  });

  it("CIF-4: computeControlCharacter(body) appended to the body validates", () => {
    const body = fc.oneof(
      validDocument.map((doc) => doc.slice(0, -1)),
      typedDocument.map((doc) => doc.replace(/.[^0-9]*$/, "")),
      documentLike
    );
    fc.assert(
      fc.property(body, (partial) => {
        const control = computeControlCharacter(partial);
        if (control !== null) expect(isValidNif(partial + control)).toBe(true);
      }),
      params
    );
    fc.assert(
      fc.property(validDocument, (doc) => {
        expect(computeControlCharacter(doc.slice(0, -1))).toBe(doc.slice(-1));
      }),
      params
    );
  });
});

describe("properties: single-character substitutions", () => {
  // Replaces the character at `at` with a different one from [0-9A-Z].
  const mutation = fc.tuple(
    validDocument,
    fc.integer({ min: 0, max: 8 }),
    fc.constantFrom(...ALPHANUMERIC.split(""))
  );

  // Checked: a substitution in positions 2 to 9 never gives a valid
  // document. DNI-2 changes with any digit (10^k mod 23 is never 0), CIF-4
  // too (doubling and adding digits is a permutation), a letter in the
  // number part breaks the format, and another control character is
  // wrong.
  it("DNI-2 / CIF-4: a substitution after the first character is never valid", () => {
    fc.assert(
      fc.property(mutation, ([doc, at, char]) => {
        const i = Math.max(1, at);
        fc.pre(doc[i] !== char);
        const mutated = doc.slice(0, i) + char + doc.slice(i + 1);
        expect(isValidNif(mutated)).toBe(false);
      }),
      { ...params, numRuns: 20_000 }
    );
  });

  // Documented exceptions: a substitution of the FIRST character can give
  // another valid document, because the prefix counts for little or
  // nothing in the control:
  // - K, L and M are interchangeable (KLM-2: the prefix doesn't count);
  // - CIF keys with the same control class are interchangeable (CIF-4
  //   ignores the key);
  // - across types: a DNI starting with 0, 1 or 2 equals the NIE X, Y, Z or
  //   the K/L/M NIF with the same digits, and any prefix swap can hit a
  //   letter that happens to match (for example a CIF letter control that
  //   is also the DNI-2 letter of the digits).
  // Same-type swaps of DNI digits or NIE prefixes are never valid.
  it("KLM-2 / CIF-4: a valid first-character substitution is one of the documented exceptions", () => {
    fc.assert(
      fc.property(mutation, ([doc, , char]) => {
        fc.pre(doc[0] !== char);
        const mutated = char + doc.slice(1);
        if (!isValidNif(mutated)) return;
        const before = getNifType(doc);
        const after = getNifType(mutated);
        expect(
          before !== after || before === "CIF" || before === "NIF_KLM"
        ).toBe(true);
      }),
      { ...params, numRuns: 20_000 }
    );
  });

  // Documented exception in lenient mode: for C D F G J U V, the digit and
  // the letter of the same control value are both valid.
  it("CIF-3: in lenient mode, only the other form of the control of C D F G J U V stays valid", () => {
    fc.assert(
      fc.property(mutation, ([doc, , char]) => {
        fc.pre(doc[8] !== char);
        const mutated = doc.slice(0, 8) + char;
        if (!isValidNif(mutated, { cifControl: "lenient" })) return;
        expect(LENIENT_KEYS).toContain(doc[0]);
        expect(CIF_LETTERS[Number(doc[8])]).toBe(char);
      }),
      { ...params, numRuns: 20_000 }
    );
  });
});

describe("properties: normalize and validate", () => {
  it("NORM-1: normalize is idempotent", () => {
    fc.assert(
      fc.property(
        fc.oneof(typedDocument, documentLike, fc.string()),
        (value) => {
          const once = normalize(value);
          expect(normalize(once)).toBe(once);
        }
      ),
      params
    );
  });

  it("NORM-1: validate(x).normalized validates with the default options", () => {
    fc.assert(
      fc.property(anyInput, anyOptions, (value, opts) => {
        const result = validate(value, opts as ValidateOptions);
        if (result.valid) {
          const again = validate(result.normalized);
          expect(again.valid).toBe(true);
          expect(again.normalized).toBe(result.normalized);
        }
      }),
      params
    );
  });

  it("POLICY-2: validate() and the booleans always agree", () => {
    const booleanOptions = fc.record(
      {
        normalize: fc.boolean(),
        cifControl: fc.constantFrom("official" as const, "lenient" as const),
        rejectPlaceholders: fc.boolean(),
      },
      { requiredKeys: [] }
    );
    fc.assert(
      fc.property(anyInput, booleanOptions, (value, opts: IsValidOptions) => {
        const valid = (types?: ValidateOptions["types"]) =>
          validate(value, types ? { ...opts, types } : opts).valid;
        expect(isValidNif(value, opts)).toBe(valid());
        expect(isValidDni(value, opts)).toBe(valid(["DNI", "NIF_KLM"]));
        expect(isValidNie(value, opts)).toBe(valid(["NIE"]));
        expect(isValidCif(value, opts)).toBe(valid(["CIF"]));
        expect(isValidNaturalPersonNif(value, opts)).toBe(
          valid(["DNI", "NIF_KLM", "NIE"])
        );
      }),
      { ...params, numRuns: 10_000 }
    );
  });

  it("INPUT-2: every error cites a rule defined in SPEC.md", () => {
    fc.assert(
      fc.property(anyInput, anyOptions, (value, opts) => {
        const { error } = validate(value, opts as ValidateOptions);
        if (error) expect(SPEC_RULES).toContain(error.rule);
      }),
      { ...params, numRuns: 10_000 }
    );
  });
});
