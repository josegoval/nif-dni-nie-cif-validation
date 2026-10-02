/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type IsValidOptions,
  isValidCif,
  isValidDni,
  isValidNaturalPersonNif,
  isValidNie,
  isValidNif,
  isValidSpanishVat,
  type NifErrorCode,
  type NifType,
  normalize,
  type ValidateOptions,
  validate,
} from "..";
import { SPEC_RULES, SPEC_TEST_VALUES } from "./specRules";

// Table-driven test (#41): every fixture in test/fixtures/*.json runs against
// validate() and the boolean validators. Each file is run with the options
// below. Test names start with the fixture's SPEC.md rule ID.

interface Fixture {
  /** A string, or another JSON value for INPUT-1 (not-a-string.json). */
  input: unknown;
  /** "valid", or the expected error code. */
  expected: "valid" | NifErrorCode;
  /** The type validate() reports, or null. */
  type: NifType | null;
  /** The SPEC.md rule: the one that fails, or the one exercised. */
  rule: string;
  note: string;
}

const FILE_OPTIONS: Record<string, ValidateOptions> = {
  "dni.json": {},
  "klm.json": {},
  "nie.json": {},
  "cif.json": {},
  "cif-lenient.json": { cifControl: "lenient" },
  "placeholders-default.json": {},
  "placeholders-rejected.json": { rejectPlaceholders: true },
  "normalization.json": {},
  "normalization-off.json": { normalize: false },
  "vat-default.json": {},
  "vat-allowed.json": { allowVatPrefix: true },
  "not-a-string.json": {},
  "types-dni-nie.json": { types: ["DNI", "NIE"] },
};

// Vitest runs from the repository root.
const DIR = join(process.cwd(), "test", "fixtures");
const files = readdirSync(DIR).filter((name) => name.endsWith(".json"));
const fixtures = files.flatMap((file) =>
  (JSON.parse(readFileSync(join(DIR, file), "utf8")) as Fixture[]).map(
    (fixture) => ({ ...fixture, file })
  )
);

function booleanOptions(opts: ValidateOptions): IsValidOptions {
  const { types: _t, locale: _l, allowVatPrefix: _a, ...rest } = opts;
  return rest;
}

describe("fixtures", () => {
  it("every fixture file has its options", () =>
    expect(files.sort()).toEqual(Object.keys(FILE_OPTIONS).sort()));

  it("every fixture rule is defined in SPEC.md", () => {
    for (const { rule } of fixtures) expect(SPEC_RULES).toContain(rule);
  });

  it("every SPEC.md test value is a fixture input", () => {
    const inputs = new Set(fixtures.map(({ input }) => input));
    expect(SPEC_TEST_VALUES.length).toBeGreaterThan(30);
    for (const value of SPEC_TEST_VALUES) expect(inputs).toContain(value);
  });

  it("every SPEC.md rule has a fixture", () => {
    // Both polarities (valid and invalid) are checked by `pnpm spec:check`.
    const rules = new Set(fixtures.map(({ rule }) => rule));
    expect([...SPEC_RULES].filter((rule) => !rules.has(rule))).toEqual([]);
  });
});

describe("error.rule", () => {
  // Every fixture input, plus its variants, under every option set and a few
  // extra ones: every error must cite a rule defined in SPEC.md.
  const optionSets: ValidateOptions[] = [
    ...Object.values(FILE_OPTIONS),
    { types: ["DNI"] },
    { types: ["CIF"], normalize: false, allowVatPrefix: true },
  ];
  const inputs: unknown[] = [null, 42, {}, "", " ", "ES", "T", "ñ"];
  for (const { input } of fixtures)
    if (typeof input === "string")
      inputs.push(input, input.slice(1), input.slice(0, -1), `${input}0`);
    else inputs.push(input);

  it("INPUT-1 / POLICY-2: every error cites a rule defined in SPEC.md", () => {
    const rules = new Set<string>();
    for (const opts of optionSets)
      for (const input of inputs) {
        const { error } = validate(input, opts);
        if (error) rules.add(error.rule);
      }
    for (const rule of rules) expect(SPEC_RULES).toContain(rule);
    // Every rule an error can cite shows up (CIF-5 and NORM-* never fail).
    expect([...rules].sort()).toEqual(
      [...SPEC_RULES]
        .filter((rule) => rule !== "CIF-5" && !rule.startsWith("NORM-"))
        .filter((rule) => rule !== "CIF-2")
        .sort()
    );
  });
});

describe.each(files)("fixtures: %s", (file) => {
  const opts = FILE_OPTIONS[file] as ValidateOptions;
  const cases = fixtures.filter((fixture) => fixture.file === file);

  it.each(cases)(
    "$rule: $input is $expected ($note)",
    ({ input, expected, type, rule }) => {
      const result = validate(input, opts);
      expect(result.valid).toBe(expected === "valid");
      expect(result.type).toBe(type);
      if (expected === "valid") {
        expect(result.error).toBeUndefined();
      } else {
        expect(result.error?.code).toBe(expected);
        expect(result.error?.rule).toBe(rule);
      }
      // `normalized` is set exactly when the type is.
      expect(result.normalized === null).toBe(type === null);
    }
  );

  it.each(cases)(
    "$rule: the booleans agree with validate() on $input",
    ({ input, expected, type }) => {
      const valid = expected === "valid";
      if (opts.allowVatPrefix) {
        // The booleans don't take ES; isValidSpanishVat requires it.
        const hasPrefix =
          typeof input === "string" && normalize(input).startsWith("ES");
        expect(isValidSpanishVat(input, booleanOptions(opts))).toBe(
          valid && hasPrefix
        );
        return;
      }
      const o = booleanOptions(opts);
      if (opts.types) {
        // The booleans have no `types` option, and POLICY-2 rejects valid
        // documents only (types-dni-nie.json has no other kind).
        expect(isValidNif(input, o)).toBe(
          valid || expected === "UNSUPPORTED_TYPE"
        );
        return;
      }
      expect(isValidNif(input, o)).toBe(valid);
      expect(isValidDni(input, o)).toBe(
        valid && (type === "DNI" || type === "NIF_KLM")
      );
      expect(isValidNie(input, o)).toBe(valid && type === "NIE");
      expect(isValidCif(input, o)).toBe(valid && type === "CIF");
      expect(isValidNaturalPersonNif(input, o)).toBe(valid && type !== "CIF");
    }
  );
});
