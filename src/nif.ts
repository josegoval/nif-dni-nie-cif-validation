/**
 * NIF: Número de Identificación Fiscal, the Spanish tax ID (RD 1065/2007
 * arts. 18-22). Every person or entity has one:
 *
 * - natural persons: a DNI, a K/L/M NIF (see dni.ts) or a NIE (see nie.ts);
 * - legal entities: a legal entity NIF, formerly CIF (see cif.ts).
 *
 * All of them have 9 characters, except old 10-character NIEs (NIE-3). The
 * first character tells them apart: a digit (DNI-1), K L M (KLM-1), X Y Z
 * (NIE-1) or an organisation key (CIF-2). These never overlap, so only one
 * format is ever checked.
 *
 * Rule IDs refer to SPEC.md.
 */
import { cifKeyKind, hasValidCifDigitsAndControl, NOT_A_KEY } from "./cif";
import { dniVerdict, isShortDni, isValidNineCharDni } from "./dni";
import { isValidNineCharNie, isValidOldNie } from "./nie";
import { removeSeparators } from "./normalize";
import { acceptsDocument, isPlaceholderDocument } from "./policy";
import { NO_OPTIONS } from "./shared";
import type { IsValidOptions } from "./types";

/** DNI, K/L/M, NIE and CIF all have 9 characters. */
const NIF_LENGTH = 9;
/** NIE-3: old NIEs, `X0` + 7 digits + letter. */
const OLD_NIE_LENGTH = 10;

/*
 * The raw checks below return a verdict: 1 valid; 0 invalid, and
 * normalizing can't change that; -1 invalid, but normalizing might help.
 *
 * A 9-character value that fails can only be fixed when it has a separator
 * (the raw check already folds case, NORM-1). Removing it leaves 8
 * characters or fewer, which only NORM-4 can make valid, and only from a
 * digit. So a value whose first character is ASCII and at least "0" (never
 * a separator) and not a digit gives 0; so does a DNI with all 8 digits and
 * a wrong letter (see dniVerdict).
 */

/** 0 for a failed 9-character value whose first character is `first`. */
function failedNineChars(first: number): number {
  return (first - 0x30) >>> 0 < 0x50 ? 0 : -1;
}

/** DNI, K/L/M or NIE, on the raw string. */
function checkNaturalPersonNif(value: string): number {
  const length = value.length;
  if (length === NIF_LENGTH) {
    const first = value.charCodeAt(0);
    // DNI-1: a digit.
    if ((first - 48) >>> 0 < 10) return dniVerdict(value);
    // KLM-1 or NIE-1: the first character decides the format.
    return isValidNineCharDni(value, first) || isValidNineCharNie(value, first)
      ? 1
      : failedNineChars(first);
  }
  // NIE-3: old 10-character NIE.
  return length === OLD_NIE_LENGTH && isValidOldNie(value) ? 1 : -1;
}

/** Any NIF, on the raw string. */
function checkNif(value: string, opts: IsValidOptions | null): number {
  const length = value.length;
  if (length === NIF_LENGTH) {
    const first = value.charCodeAt(0);
    // DNI-1: a digit.
    if ((first - 48) >>> 0 < 10) return dniVerdict(value);
    // CIF-2: the organisation keys never overlap with the natural person
    // prefixes (digits, K L M, X Y Z), so the first character picks one
    // format and only that one is checked.
    const kind = cifKeyKind(first);
    const valid =
      kind !== NOT_A_KEY
        ? hasValidCifDigitsAndControl(value, kind, opts)
        : isValidNineCharDni(value, first) || isValidNineCharNie(value, first);
    return valid ? 1 : failedNineChars(first);
  }
  // NIE-3: old 10-character NIE.
  return length === OLD_NIE_LENGTH && isValidOldNie(value) ? 1 : -1;
}

/**
 * Checks if the given naturalPersonNif is either a valid DNI (including DNI K, L and M) or a valid NIE.
 *
 * The input is normalized first (NORM-1 to NORM-4, NIE-3), so
 * `" 12.345.678-z "` is valid. Pass `{ normalize: false }` for v1's strict
 * parsing.
 *
 * `{ rejectPlaceholders: true }` rejects the placeholder numbers (POLICY-1).
 *
 * Never throws: any value that is not a string (e.g. `null`) returns `false`.
 * @param naturalPersonNif The value to check.
 * @param opts `normalize` (default `true`), `rejectPlaceholders` (default
 * `false`).
 * @returns true for valid input and false for invalid input.
 * @see SPEC.md#norm-2
 */
export function isValidNaturalPersonNif(
  naturalPersonNif: unknown,
  opts: IsValidOptions = NO_OPTIONS
): boolean {
  if (typeof naturalPersonNif !== "string") return false;
  // The fast path: a valid raw value, and placeholders only when asked.
  const verdict = checkNaturalPersonNif(naturalPersonNif);
  if (verdict === 1)
    return (
      opts?.rejectPlaceholders !== true ||
      !isPlaceholderDocument(naturalPersonNif)
    );
  if (verdict === 0) return false;
  return retryNaturalPersonNif(naturalPersonNif, opts);
}

/**
 * NORM-2..4: the slow path of isValidNaturalPersonNif, in its own function so the fast path
 * stays small.
 */
function retryNaturalPersonNif(
  value: string,
  opts: IsValidOptions | null
): boolean {
  if (opts?.normalize === false) return false;
  const clean = removeSeparators(value);
  return (
    (isShortDni(clean) || checkNaturalPersonNif(clean) === 1) &&
    acceptsDocument(clean, opts)
  );
}

/**
 * Checks if the given nif (legal entity NIF or natural person NIF
 * (DNI, DNI K, DNI L, DNI M, or NIE)) is valid.
 *
 * The input is normalized first (NORM-1 to NORM-4, NIE-3), so
 * `" b-1234567-4 "` is valid. Pass `{ normalize: false }` for v1's strict
 * parsing.
 *
 * A legal entity NIF (CIF) follows CIF-3 by default. Pass
 * `{ cifControl: "lenient" }` to also accept a letter control for
 * C D F G J U V, as v1 did.
 *
 * `{ rejectPlaceholders: true }` rejects the placeholder numbers (POLICY-1).
 *
 * Never throws: any value that is not a string (e.g. `null`) returns `false`.
 * @param nif The value to check.
 * @param opts `normalize` (default `true`), `cifControl` (default
 * `"official"`), `rejectPlaceholders` (default `false`).
 * @returns true for valid input and false for invalid input.
 * @see SPEC.md#cif-3
 * @see SPEC.md#norm-2
 */
export function isValidNif(
  nif: unknown,
  opts: IsValidOptions = NO_OPTIONS
): boolean {
  if (typeof nif !== "string") return false;
  // The fast path: a valid raw value, and placeholders only when asked.
  const verdict = checkNif(nif, opts);
  if (verdict === 1)
    return opts?.rejectPlaceholders !== true || !isPlaceholderDocument(nif);
  if (verdict === 0) return false;
  return retryNif(nif, opts);
}

/**
 * NORM-2..4: the slow path of isValidNif, in its own function so the fast path
 * stays small.
 */
function retryNif(value: string, opts: IsValidOptions | null): boolean {
  if (opts?.normalize === false) return false;
  const clean = removeSeparators(value);
  return (
    (isShortDni(clean) || checkNif(clean, opts) === 1) &&
    acceptsDocument(clean, opts)
  );
}
