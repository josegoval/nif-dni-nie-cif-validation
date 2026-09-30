/**
 * The builders of the test-data generators: one canonical, valid document
 * from a random source. The public functions (src/generate/index.ts) add the
 * seed, the output format and the JSDoc.
 *
 * Every value follows SPEC.md:
 * - DNI-1: 8 digits, zero-padded, and a check letter; KLM-1, KLM-3: K, L or
 *   M, 7 digits and a check letter.
 * - NIE-1: X, Y or Z, 7 digits and a check letter: the canonical 9-character
 *   form, never the old 10-character one (NIE-3).
 * - CIF-1, CIF-2: an organisation key, 7 digits and a control character.
 *   CIF-3 decides a digit or a letter from the key, so `control` only picks
 *   among the keys that allow it.
 * - POLICY-1: never a placeholder (00000000T, 00000001R, 99999999R,
 *   X0000000T).
 *
 * The control character always comes from `computeControlCharacter`, the
 * library's own code for DNI-2, KLM-2, NIE-2, CIF-3 and CIF-4, so no
 * algorithm is written twice.
 *
 * Builders throw a `RangeError` on an impossible request (an unknown
 * organisation key, a letter control for a key that takes a digit): asking
 * for it is a programming error, unlike the validators' input, which is
 * data and never throws.
 */
import { cifKeyKind, LETTER_CONTROL } from "../cif";
import { computeControlCharacter } from "../format";
import type { CifOrganisationKey, NifType } from "../types";
import { describe, nextInt, pad, pick, pickChar, type Random } from "./random";

/**
 * What `generateDni` makes: a DNI, or a K, L or M NIF (KLM-1).
 * @example
 * generateDni({ seed: 1, kind: "K" }); // "K6270739L"
 * @example
 * const kinds: DniKind[] = ["DNI", "K", "L", "M"];
 * kinds.every((kind) => isValidDni(generateDni({ kind }))); // true
 * @see SPEC.md#klm-1
 * @since 2.0.0
 */
export type DniKind = "DNI" | "K" | "L" | "M";

/**
 * The first letter of an NIE (NIE-1): X, Y or Z.
 * @example
 * generateNie({ seed: 1, prefix: "Z" }); // "Z6270739R"
 * @example
 * const prefix: NiePrefix = "Y";
 * generateNie({ prefix }).startsWith("Y"); // true
 * @see SPEC.md#nie-1
 * @since 2.0.0
 */
export type NiePrefix = "X" | "Y" | "Z";

/**
 * The control character of a CIF: a digit or a letter (CIF-3).
 * @example
 * generateCif({ seed: 1, control: "letter" }); // "R0027357C"
 * @example
 * const control: CifControl = "digit";
 * validate(generateCif({ control })).valid; // true
 * @see SPEC.md#cif-3
 * @since 2.0.0
 */
export type CifControl = "letter" | "digit";

export const DNI_KINDS: readonly DniKind[] = ["DNI", "K", "L", "M"];
export const NIE_PREFIXES: readonly NiePrefix[] = ["X", "Y", "Z"];
export const CIF_CONTROLS: readonly CifControl[] = ["letter", "digit"];
export const NIF_TYPES: readonly NifType[] = ["DNI", "NIF_KLM", "NIE", "CIF"];
/** CIF-2: the organisation keys. */
export const CIF_KEYS: readonly CifOrganisationKey[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "J",
  "N",
  "P",
  "Q",
  "R",
  "S",
  "U",
  "V",
  "W",
];

/** Throws a `RangeError` unless `value` is one of `allowed`. */
export function assertOneOf(
  name: string,
  value: unknown,
  allowed: readonly string[]
): void {
  if (typeof value !== "string" || !allowed.includes(value))
    throw new RangeError(
      `${name} must be one of ${allowed.join(", ")}, got ${describe(value)}.`
    );
}

/** The control character that completes `partial` (DNI-2, KLM-2, NIE-2, CIF-3, CIF-4). */
function controlOf(partial: string): string {
  // By construction `partial` is a format that the library completes.
  return computeControlCharacter(partial) as string;
}

/** CIF-3: does this organisation key take a letter control? */
function takesLetter(key: string): boolean {
  return cifKeyKind(key.charCodeAt(0)) === LETTER_CONTROL;
}

/**
 * A DNI (DNI-1, DNI-2) or a K, L or M NIF (KLM-1 to KLM-3), canonical.
 * Default `kind`: `"DNI"`.
 */
export function buildDni(random: Random, kind: DniKind = "DNI"): string {
  assertOneOf("kind", kind, DNI_KINDS);
  if (kind === "DNI") {
    // DNI-1: 8 digits, leading zeros allowed. POLICY-1: from 2 up to
    // 99999998, so never 00000000T, 00000001R or 99999999R.
    const digits = pad(2 + nextInt(random, 99999997), 8);
    return digits + controlOf(digits);
  }
  // KLM-1, KLM-3: the prefix and 7 digits; KLM-2: the letter ignores the
  // prefix.
  const partial = kind + pad(nextInt(random, 1e7), 7);
  return partial + controlOf(partial);
}

/** An NIE (NIE-1, NIE-2) in its canonical 9-character form. */
export function buildNie(random: Random, prefix?: NiePrefix): string {
  if (prefix !== undefined) assertOneOf("prefix", prefix, NIE_PREFIXES);
  const chosen = prefix === undefined ? pickChar(random, "XYZ") : prefix;
  // NIE-1: 7 digits. POLICY-1: X0000000T is a placeholder, so an X NIE
  // starts at 1.
  const first = chosen === "X" ? 1 : 0;
  const partial = chosen + pad(first + nextInt(random, 1e7 - first), 7);
  return partial + controlOf(partial);
}

/**
 * A NIF of a legal person or entity (CIF-1, CIF-2). CIF-3 gives each key one
 * control type (a digit, or a letter for N P Q R S W), so `control` without
 * `orgKey` picks among the keys with that type, and with an `orgKey` that
 * takes the other type it is an error. `cifControl: "lenient"` is never
 * generated: it has no official basis.
 */
export function buildCif(
  random: Random,
  orgKey?: CifOrganisationKey,
  control?: CifControl
): string {
  if (control !== undefined) assertOneOf("control", control, CIF_CONTROLS);
  let key: string;
  if (orgKey !== undefined) {
    assertOneOf("orgKey", orgKey, CIF_KEYS);
    if (control !== undefined && takesLetter(orgKey) !== (control === "letter"))
      throw new RangeError(
        `Organisation key ${orgKey} takes a ${control === "letter" ? "digit" : "letter"} control (CIF-3), so control "${control}" is not possible.`
      );
    key = orgKey;
  } else {
    key = pick(
      random,
      control === undefined
        ? CIF_KEYS
        : CIF_KEYS.filter((k) => takesLetter(k) === (control === "letter"))
    );
  }
  // CIF-1, CIF-5: 7 random digits, no province code.
  const partial = key + pad(nextInt(random, 1e7), 7);
  return partial + controlOf(partial);
}

/** One document of `type`. */
export function buildOfType(random: Random, type: NifType): string {
  if (type === "DNI") return buildDni(random, "DNI");
  if (type === "NIF_KLM")
    return buildDni(random, pick(random, ["K", "L", "M"]));
  if (type === "NIE") return buildNie(random);
  return buildCif(random);
}

/** A document of one of `types` (all four by default), chosen at random. */
export function buildNif(
  random: Random,
  types: readonly NifType[] = NIF_TYPES
): string {
  if (!Array.isArray(types) || types.length === 0)
    throw new RangeError("types must be a non-empty array of NIF types.");
  for (const type of types) assertOneOf("types", type, NIF_TYPES);
  return buildOfType(random, pick(random, types));
}
