/**
 * Entry point of `nif-dni-nie-cif-validation/generate`: test-data generators
 * for Spanish NIF, DNI, K/L/M, NIE and CIF numbers, and for invalid values
 * for negative tests. Opt-in: the main entry point never imports this
 * module, so `import { isValidNif }` adds no generator code
 * (scripts/check-tree-shaking.mjs checks it).
 *
 * The numbers are **synthetic**: they have a valid shape and a valid control
 * character, and nothing more. One may match a real person or company by
 * chance. Use them in tests, never as real identifiers.
 *
 * - Every valid value follows SPEC.md (see core.ts): DNI-1, KLM-2, NIE-1,
 *   NIE-2, CIF-3 and the control character from the library's own
 *   `computeControlCharacter`. No value is a placeholder (POLICY-1).
 * - With a `seed` the values come from mulberry32 (random.ts): the same seed
 *   gives the same value on every platform. Without one they come from
 *   `Math.random`.
 * - A bad option (an unknown kind, a letter control for a key that takes a
 *   digit) throws a `RangeError`: it is a programming error, unlike the
 *   validators' input, which is data and never throws.
 *
 * Rule IDs refer to SPEC.md.
 */
import { type FormatOptions, format } from "../format";
import type { CifOrganisationKey, NifErrorCode, NifType } from "../types";
import {
  buildCif,
  buildDni,
  buildNie,
  buildNif,
  type CifControl,
  type DniKind,
  type NiePrefix,
} from "./core";
import { buildInvalid } from "./invalid";
import { randomFor, seeded } from "./random";

export type { CifControl, DniKind, NiePrefix };

/**
 * Options that every generator takes.
 * @example
 * generateDni({ seed: 42 }); // "60110375J"
 * generateDni({ seed: 42 }); // "60110375J": the same seed gives the same value
 * @example
 * isValidNie(generateNie()); // true: without a seed, a different value every time
 * @see SPEC.md#dni-1
 * @since 2.0.0
 */
export interface GenerateOptions {
  /**
   * An integer that fixes the result: the same seed gives the same value on
   * every platform. It is reduced modulo 2^32. Without it, `Math.random` is
   * used. A call with a seed always starts from that seed, so it returns
   * the same value each time: use {@link createGenerator} for a stream of
   * different values from one seed.
   */
  seed?: number | undefined;
}

/**
 * Options of the generators that return a valid document: the output form.
 * @example
 * generateDni({ seed: 1 });                // "62707394X"
 * generateDni({ seed: 1, format: true });  // "62707394-X"
 * @example
 * generateCif({ seed: 1, orgKey: "B", format: { separator: " " } }); // "B 6270739 3"
 * @see SPEC.md#cif-1
 * @since 2.0.0
 */
export interface GenerateFormatOptions {
  /**
   * `false` (the default): the canonical form, upper case and without
   * separators. `true` or `{ separator }`: the display form of `format()`,
   * with `-` or the separator given (`""` gives the canonical form).
   */
  format?: boolean | FormatOptions | undefined;
}

/**
 * Options of {@link generateDni}.
 * @example
 * generateDni({ seed: 1, kind: "K" }); // "K6270739L": K + 7 digits + letter
 * @example
 * generateDni({ seed: 1, kind: "K", format: true }); // "K-6270739-L"
 * @see SPEC.md#klm-1
 * @since 2.0.0
 */
export interface GenerateDniOptions
  extends GenerateOptions,
    GenerateFormatOptions {
  /**
   * `"DNI"` (the default): 8 digits and a letter. `"K"`, `"L"` or `"M"`: that
   * NIF, a letter and 7 digits and a check letter (KLM-1).
   */
  kind?: DniKind | undefined;
}

/**
 * Options of {@link generateNie}.
 * @example
 * generateNie({ seed: 1, prefix: "Z" }); // "Z6270739R"
 * @example
 * generateNie({ seed: 1, prefix: "Y", format: { separator: " " } }); // "Y 6270739 X"
 * @see SPEC.md#nie-1
 * @since 2.0.0
 */
export interface GenerateNieOptions
  extends GenerateOptions,
    GenerateFormatOptions {
  /** The first letter. Default: one of X, Y and Z at random. */
  prefix?: NiePrefix | undefined;
}

/**
 * Options of {@link generateCif}.
 * @example
 * generateCif({ seed: 1, orgKey: "B" }); // "B62707393": a digit control
 * @example
 * generateCif({ seed: 1, control: "letter" }); // "R0027357C": N P Q R S or W
 * @see SPEC.md#cif-3
 * @since 2.0.0
 */
export interface GenerateCifOptions
  extends GenerateOptions,
    GenerateFormatOptions {
  /** The organisation key. Default: one of the 17 keys at random. */
  orgKey?: CifOrganisationKey | undefined;
  /**
   * The type of the control character. CIF-3 gives every key exactly one
   * type, so it can never change what a key takes: without `orgKey` it
   * picks among the keys with that type (letter: N P Q R S W; digit: the
   * other eleven), and with an `orgKey` that takes the other type it throws
   * a `RangeError`.
   * @see SPEC.md#cif-3
   */
  control?: CifControl | undefined;
}

/**
 * Options of {@link generateNif}.
 * @example
 * generateNif({ seed: 1, types: ["DNI", "NIE"] }); // "X5274470H": a DNI or an NIE
 * @example
 * generateNif({ seed: 1, types: ["CIF"] }); // "A52744703"
 * @see SPEC.md#nif-1
 * @since 2.0.0
 */
export interface GenerateNifOptions
  extends GenerateOptions,
    GenerateFormatOptions {
  /**
   * The types to pick from, one of them at random. Default: all four. An
   * empty array throws a `RangeError`.
   */
  types?: NifType[] | undefined;
}

/**
 * Options of {@link generateInvalid}.
 * @example
 * generateInvalid("CIF", { seed: 1, reason: "INVALID_LENGTH" }); // "P0027C"
 * @example
 * generateInvalid("DNI", { seed: 1 }); // "62707394A": the default, a wrong control letter
 * @see SPEC.md#dni-2
 * @since 2.0.0
 */
export interface GenerateInvalidOptions extends GenerateOptions {
  /**
   * The error code `validate()` gives the value. Default:
   * `"INVALID_CONTROL_CHARACTER"`. See {@link generateInvalid} for the codes
   * and for what each needs.
   */
  reason?: NifErrorCode | undefined;
}

/** The output form: canonical, or the display form of `format()`. */
function output(
  value: string,
  opts: GenerateFormatOptions | null | undefined
): string {
  const form = opts?.format;
  if (!form) return value;
  // The value is valid with the default options, so `format` never returns
  // `null`.
  return format(value, form === true ? undefined : form) as string;
}

/**
 * Generates a valid DNI (8 digits and a check letter, DNI-1, DNI-2), or with
 * `kind` a K, L or M NIF (KLM-1, KLM-2). The number is zero-padded, so about
 * one in ten starts with `0`. It is never a placeholder such as `00000000T`
 * (POLICY-1).
 *
 * **Synthetic data, for tests only**: the number is valid but made up, and
 * it may match a real person's by chance. Never use it as a real identifier.
 * `validate()` and `isValidDni()` accept it.
 *
 * @param opts `seed`, `kind`, `format`.
 * @returns A DNI in canonical form, or formatted with `format`.
 * @throws {RangeError} For an unknown `kind` or a `seed` that isn't an integer.
 * @example
 * generateDni({ seed: 1 }); // always "62707394X"
 * isValidDni(generateDni()); // true
 * @example
 * generateDni({ seed: 1, kind: "K", format: true }); // "K-6270739-L"
 * @see SPEC.md#dni-1
 * @see SPEC.md#klm-2
 * @since 2.0.0
 */
export function generateDni(opts: GenerateDniOptions = {}): string {
  return output(buildDni(randomFor(opts?.seed), opts?.kind), opts);
}

/**
 * Generates a valid NIE in its canonical 9-character form: X, Y or Z, 7
 * digits and the check letter (NIE-1, NIE-2). It is never the old
 * 10-character form (NIE-3) and never the placeholder `X0000000T`
 * (POLICY-1).
 *
 * **Synthetic data, for tests only**: the number is valid but made up, and
 * it may match a real person's by chance. Never use it as a real identifier.
 *
 * @param opts `seed`, `prefix`, `format`.
 * @returns An NIE in canonical form, or formatted with `format`.
 * @throws {RangeError} For an unknown `prefix` or a `seed` that isn't an integer.
 * @example
 * generateNie({ seed: 1 }); // always "Y0027357R"
 * isValidNie(generateNie()); // true
 * @example
 * generateNie({ seed: 1, prefix: "Y", format: { separator: " " } }); // "Y 6270739 X"
 * @see SPEC.md#nie-1
 * @see SPEC.md#nie-2
 * @since 2.0.0
 */
export function generateNie(opts: GenerateNieOptions = {}): string {
  return output(buildNie(randomFor(opts?.seed), opts?.prefix), opts);
}

/**
 * Generates a valid NIF of a legal person or entity (CIF): an organisation
 * key, 7 digits and the control character (CIF-1 to CIF-4). The control is a
 * digit or a letter as CIF-3 says for the key, never as the legacy
 * `cifControl: "lenient"` mode would allow. The 7 digits are random, with no
 * province code (CIF-5).
 *
 * `orgKey` picks the key. `control` only makes sense together with the key's
 * own type, since CIF-3 gives each key one: without `orgKey` it restricts
 * the keys to the ones that take a letter (N P Q R S W) or a digit (the
 * other eleven); with an `orgKey` that takes the other type it throws.
 *
 * **Synthetic data, for tests only**: the number is valid but made up, and
 * it may match a real company's by chance. Never use it as a real
 * identifier.
 *
 * @param opts `seed`, `orgKey`, `control`, `format`.
 * @returns A CIF in canonical form, or formatted with `format`.
 * @throws {RangeError} For an unknown `orgKey` or `control`, a `control` that
 * the `orgKey` can't take (CIF-3), or a `seed` that isn't an integer.
 * @example
 * generateCif({ seed: 1, orgKey: "B" }); // always "B62707393"
 * generateCif({ seed: 1, orgKey: "P" }); // "P6270739C": P takes a letter
 * @example
 * validate(generateCif({ control: "letter" })).valid; // true: N, P, Q, R, S or W
 * generateCif({ orgKey: "B", control: "letter" }); // throws RangeError
 * @see SPEC.md#cif-3
 * @see SPEC.md#cif-4
 * @since 2.0.0
 */
export function generateCif(opts: GenerateCifOptions = {}): string {
  return output(
    buildCif(randomFor(opts?.seed), opts?.orgKey, opts?.control),
    opts
  );
}

/**
 * Generates a valid NIF of any of the `types` (DNI, K/L/M NIF, NIE and CIF by
 * default), one of them chosen at random, with the rules of
 * {@link generateDni}, {@link generateNie} and {@link generateCif}.
 *
 * **Synthetic data, for tests only**: the number is valid but made up, and
 * it may match a real person or company by chance. Never use it as a real
 * identifier.
 *
 * @param opts `seed`, `types`, `format`.
 * @returns A NIF in canonical form, or formatted with `format`.
 * @throws {RangeError} For an empty or unknown `types`, or a `seed` that
 * isn't an integer.
 * @example
 * generateNif({ seed: 1 }); // always "X5274470H"
 * isValidNif(generateNif()); // true
 * @example
 * generateNif({ seed: 1, types: ["CIF"] }); // "A52744703"
 * validate(generateNif({ types: ["CIF"] })).type; // "CIF"
 * @see SPEC.md#nif-1
 * @since 2.0.0
 */
export function generateNif(opts: GenerateNifOptions = {}): string {
  return output(buildNif(randomFor(opts?.seed), opts?.types), opts);
}

/**
 * Generates a value that `validate()` rejects, for negative tests: it starts
 * from a valid document of `type` and breaks one thing, so it looks like the
 * type it stands for. `reason` is the `error.code` that `validate()` gives
 * it, with the default options:
 *
 * - `"INVALID_CONTROL_CHARACTER"` (the default): only the control character
 *   changes (DNI-2, KLM-2, NIE-2, CIF-3, CIF-4). For a CIF it is wrong with
 *   `cifControl: "lenient"` too.
 * - `"INVALID_LENGTH"`: too long, or too short (never for a DNI, which
 *   NORM-4 pads). It is never an old 10-character NIE (NIE-3), which is
 *   valid.
 * - `"INVALID_FORMAT"`: a letter in the number, or a control character of
 *   the wrong class.
 * - `"EMPTY"`: an empty string or only separators (INPUT-2), for any type.
 * - `"UNSUPPORTED_TYPE"`: a valid value, rejected only when `types` of
 *   `validate()` leaves `type` out (POLICY-2).
 * - `"PLACEHOLDER"`: a placeholder number, rejected only with
 *   `rejectPlaceholders` (POLICY-1). It exists for `"DNI"` and `"NIE"`; any
 *   other type throws.
 * - `"NOT_A_STRING"` throws: the result is always a string.
 *
 * **Synthetic data, for tests only.** The value is made up.
 *
 * @param type The type of document the value stands for.
 * @param opts `seed`, `reason`.
 * @returns The value, not formatted.
 * @throws {RangeError} For an unknown `type` or `reason`, for `NOT_A_STRING`,
 * for `PLACEHOLDER` with a type that has no placeholder, or a `seed` that
 * isn't an integer.
 * @example
 * const value = generateInvalid("DNI", { seed: 1 }); // "62707394A"
 * validate(value).error?.code; // "INVALID_CONTROL_CHARACTER"
 * @example
 * const short = generateInvalid("CIF", { reason: "INVALID_LENGTH" });
 * validate(short).error?.code; // "INVALID_LENGTH"
 * const fake = generateInvalid("DNI", { reason: "PLACEHOLDER" });
 * validate(fake, { rejectPlaceholders: true }).error?.code; // "PLACEHOLDER"
 * @see SPEC.md#dni-2
 * @since 2.0.0
 */
export function generateInvalid(
  type: NifType,
  opts: GenerateInvalidOptions = {}
): string {
  return buildInvalid(randomFor(opts?.seed), type, opts?.reason);
}

/**
 * A stream of generated values: every call gives the next value, so the
 * values differ, and the same seed gives the same stream.
 * @example
 * const gen = createGenerator(1);
 * gen.dni(); // "62707394X", the first DNI of the stream
 * gen.dni(); // "00273574N", a different one
 * @example
 * const a = createGenerator(5).cif({ orgKey: "B" });
 * const b = createGenerator(5).cif({ orgKey: "B" });
 * a === b; // true
 * @see SPEC.md#cif-3
 * @since 2.0.0
 */
export interface Generator {
  /** The next DNI, or K/L/M NIF. See {@link generateDni}. */
  dni(opts?: Omit<GenerateDniOptions, "seed">): string;
  /** The next NIE. See {@link generateNie}. */
  nie(opts?: Omit<GenerateNieOptions, "seed">): string;
  /** The next CIF. See {@link generateCif}. */
  cif(opts?: Omit<GenerateCifOptions, "seed">): string;
  /** The next NIF of any of the types. See {@link generateNif}. */
  nif(opts?: Omit<GenerateNifOptions, "seed">): string;
  /** The next invalid value. See {@link generateInvalid}. */
  invalid(type: NifType, opts?: Omit<GenerateInvalidOptions, "seed">): string;
}

/**
 * Creates a generator whose values come one after the other from a single
 * seed: a stream of different values that is the same on every run and every
 * platform. Use it for test fixtures that need many distinct documents.
 * (`generateDni({ seed })` would return the same DNI at every call.)
 *
 * The values are the ones of the matching `generate*` functions, with the
 * same options except `seed`, and with the same limits: **synthetic, for
 * tests only**, and they may match a real person or company by chance.
 *
 * @param seed An integer, reduced modulo 2^32.
 * @returns An object with `dni`, `nie`, `cif`, `nif` and `invalid`.
 * @throws {RangeError} If `seed` isn't an integer.
 * @example
 * const gen = createGenerator(2024);
 * const users = Array.from({ length: 3 }, () => ({ dni: gen.dni() }));
 * users.map((user) => user.dni); // ["81176236J", "71082149M", "65052588D"]
 * @example
 * const gen = createGenerator(1);
 * gen.nie({ prefix: "Z", format: true }); // "Z-6270739-R"
 * validate(gen.invalid("CIF", { reason: "INVALID_FORMAT" })).valid; // false
 * @see SPEC.md#nif-1
 * @since 2.0.0
 */
export function createGenerator(seed: number): Generator {
  const random = seeded(seed);
  return {
    dni: (opts) => output(buildDni(random, opts?.kind), opts),
    nie: (opts) => output(buildNie(random, opts?.prefix), opts),
    cif: (opts) => output(buildCif(random, opts?.orgKey, opts?.control), opts),
    nif: (opts) => output(buildNif(random, opts?.types), opts),
    invalid: (type, opts) => buildInvalid(random, type, opts?.reason),
  };
}
