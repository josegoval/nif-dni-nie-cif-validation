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
import { isValidNineCharDni } from "./dni";
import { isValidNineCharNie, isValidOldNie } from "./nie";
import { normalizedForRetry } from "./normalize";
import { NO_OPTIONS } from "./shared";
import type { IsValidOptions } from "./types";

/** DNI, K/L/M, NIE and CIF all have 9 characters. */
const NIF_LENGTH = 9;
/** NIE-3: old NIEs, `X0` + 7 digits + letter. */
const OLD_NIE_LENGTH = 10;

/** DNI, K/L/M or NIE, on the raw string. */
function checkNaturalPersonNif(value: string): boolean {
  const length = value.length;
  if (length === NIF_LENGTH) {
    const first = value.charCodeAt(0);
    // DNI-1 / KLM-1 or NIE-1: the first character decides the format.
    return isValidNineCharDni(value, first) || isValidNineCharNie(value, first);
  }
  // NIE-3: old 10-character NIE.
  return length === OLD_NIE_LENGTH && isValidOldNie(value);
}

/** Any NIF, on the raw string. */
function checkNif(value: string, opts: IsValidOptions | null): boolean {
  const length = value.length;
  if (length === NIF_LENGTH) {
    const first = value.charCodeAt(0);
    // CIF-2: the organisation keys never overlap with the natural person
    // prefixes (digits, K L M, X Y Z), so the first character picks one
    // format and only that one is checked.
    const kind = cifKeyKind(first);
    if (kind !== NOT_A_KEY)
      return hasValidCifDigitsAndControl(value, kind, opts);
    return isValidNineCharDni(value, first) || isValidNineCharNie(value, first);
  }
  // NIE-3: old 10-character NIE.
  return length === OLD_NIE_LENGTH && isValidOldNie(value);
}

/**
 * Checks if the given naturalPersonNif is either a valid DNI (including DNI K, L and M) or a valid NIE.
 *
 * The input is normalized first (NORM-1 to NORM-4, NIE-3), so
 * `" 12.345.678-z "` is valid. Pass `{ normalize: false }` for v1's strict
 * parsing.
 *
 * Never throws: any value that is not a string (e.g. `null`) returns `false`.
 * @param naturalPersonNif The value to check.
 * @param opts `normalize` (default `true`).
 * @returns true for valid input and false for invalid input.
 * @see SPEC.md#norm-2
 */
export function isValidNaturalPersonNif(
  naturalPersonNif: unknown,
  opts: IsValidOptions = NO_OPTIONS
): boolean {
  if (typeof naturalPersonNif !== "string") return false;
  if (checkNaturalPersonNif(naturalPersonNif)) return true;
  // NORM-2..4: only when the raw check failed and cleanup could help.
  const normalized = normalizedForRetry(naturalPersonNif, opts);
  return normalized !== null && checkNaturalPersonNif(normalized);
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
 * Never throws: any value that is not a string (e.g. `null`) returns `false`.
 * @param nif The value to check.
 * @param opts `normalize` (default `true`), `cifControl` (default
 * `"official"`).
 * @returns true for valid input and false for invalid input.
 * @see SPEC.md#cif-3
 * @see SPEC.md#norm-2
 */
export function isValidNif(
  nif: unknown,
  opts: IsValidOptions = NO_OPTIONS
): boolean {
  if (typeof nif !== "string") return false;
  if (checkNif(nif, opts)) return true;
  // NORM-2..4: only when the raw check failed and cleanup could help.
  const normalized = normalizedForRetry(nif, opts);
  return normalized !== null && checkNif(normalized, opts);
}
