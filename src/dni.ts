/**
 * DNI and K/L/M NIF: the tax ID (NIF) of Spanish natural persons.
 *
 * The number of the DNI (Documento Nacional de Identidad, RD 255/2025) is
 * the NIF of Spaniards (RD 1065/2007 art. 19.1). Spaniards without a DNI get
 * a K NIF (under 14, living in Spain) or an L NIF (resident abroad), and
 * foreigners without a NIE an M NIF (RD 1065/2007 arts. 19.2 and 20.2).
 *
 * Format:
 * - DNI-1: 8 digits (leading zeros allowed) + a check letter: `12345678Z`.
 * - KLM-1, KLM-3: K, L or M + 7 digits + a check letter: `K1234567L`.
 *
 * Check letter:
 * - DNI-2: `TRWAGMYFPDXBNJZSQVHLCKE`[number mod 23] (Ministerio del Interior;
 *   AEAT D.I.T. note). DNI-3 follows: I, Ñ, O and U are never check letters.
 * - KLM-2: for K/L/M the number is the 7 digits; the prefix doesn't count.
 * - NORM-1: a lower-case ASCII letter is accepted too (convention).
 *
 * Rule IDs refer to SPEC.md.
 */
import { normalize, normalizedForRetry } from "./normalize";
import { acceptsValid } from "./policy";
import { NO_OPTIONS, toUpperAsciiLetter } from "./shared";
import type { IsValidOptions } from "./types";

/** DNI-2: the check letter of `number` is the one at index `number mod 23`. */
export const DNI_CONTROL_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

/**
 * Pattern of a DNI or a K/L/M NIF. It does not check the control letter.
 * Kept as a public constant for v1 compatibility; the validators below don't
 * use it.
 */
export const DNI_REGEX = /^([KLM][\d]{7}|[\d]{8})[TRWAGMYFPDXBNJZSQVHLCKE]$/i;

const DNI_LENGTH = 9;

/**
 * Checks, in one pass and without allocating, that `value` has only digits
 * from `from` up to its last character, and that its last character is the
 * DNI-2 control letter of `prefix` followed by those digits. Internal helper
 * for the formats that end in a DNI-2 letter (DNI, K/L/M and NIE).
 */
export function hasDniDigitsAndLetter(
  value: string,
  from: number,
  prefix: number
): boolean {
  const last = value.length - 1;
  let number = prefix;
  for (let i = from; i < last; i++) {
    const digit = value.charCodeAt(i) - 48;
    // DNI-1 / KLM-3 / NIE-1: only ASCII digits.
    if (digit >>> 0 > 9) return false;
    number = number * 10 + digit;
  }
  // DNI-2: letter = DNI_CONTROL_LETTERS[number mod 23]. DNI-3 (I, Ñ, O and U
  // never match) follows, since they aren't in the table.
  return (
    toUpperAsciiLetter(value.charCodeAt(last)) ===
    DNI_CONTROL_LETTERS.charCodeAt(number % 23)
  );
}

/** `number * 10 + digit` stays exact below 2^53, so for up to 15 digits. */
const MAX_EXACT_DIGITS = 15;

/**
 * Checks a DNI or K/L/M NIF. Internal helper: the caller has checked that
 * `dni` is a 9-character string, and passes the UTF-16 code of its first
 * character.
 */
export function isValidNineCharDni(dni: string, first: number): boolean {
  // DNI-1: 8 digits + DNI-2 letter.
  if ((first - 48) >>> 0 < 10) return hasDniDigitsAndLetter(dni, 1, first - 48);
  // KLM-1 / KLM-3: K, L or M + 7 digits + letter. KLM-2: the letter is
  // computed over the 7 digits only, so the prefix counts as nothing.
  if ((toUpperAsciiLetter(first) - 75) >>> 0 < 3)
    return hasDniDigitsAndLetter(dni, 1, 0);
  return false;
}

/**
 * Checks if the given dni is valid.
 *
 * It does include checks for DNI K, L and M.
 *
 * The input is normalized first (NORM-1 to NORM-4), so `"1234567-l"` is
 * valid (as `01234567L`). Pass `{ normalize: false }` for v1's strict
 * parsing.
 *
 * `{ rejectPlaceholders: true }` rejects the placeholder numbers (POLICY-1).
 *
 * Never throws: any value that is not a string (e.g. `null`) returns `false`.
 * @param dni The value to check.
 * @param opts `normalize` (default `true`), `rejectPlaceholders` (default
 * `false`).
 * @returns true for valid input and false for invalid input.
 * @see SPEC.md#norm-4
 */
export function isValidDni(
  dni: unknown,
  opts: IsValidOptions = NO_OPTIONS
): boolean {
  if (typeof dni !== "string") return false;
  if (dni.length === DNI_LENGTH && isValidNineCharDni(dni, dni.charCodeAt(0)))
    return acceptsValid(dni, opts);
  // NORM-2..4: only when the raw check failed and cleanup could help.
  const normalized = normalizedForRetry(dni, opts);
  return (
    normalized !== null &&
    normalized.length === DNI_LENGTH &&
    isValidNineCharDni(normalized, normalized.charCodeAt(0)) &&
    acceptsValid(normalized, opts)
  );
}

/**
 * v1 semantics of the last character: the last UTF-16 code unit of
 * `value.toUpperCase()`, or -1 for the empty string.
 */
function lastCodeUnitUpperCased(value: string): number {
  const code = value.charCodeAt(value.length - 1);
  if (Number.isNaN(code)) return -1;
  // ASCII: only a-z change.
  if (code < 128) return (code - 97) >>> 0 < 26 ? code & ~32 : code;
  // Other characters can upper-case to ASCII ("ſ" -> "S") or to several
  // characters ("ß" -> "SS", "ﬅ" -> "ST"). Upper-casing doesn't depend on the
  // context, so the last two code units (a possible surrogate pair) are enough.
  const upper = value.slice(-2).toUpperCase();
  return upper.charCodeAt(upper.length - 1);
}

/** v1 semantics for many digits: `+digits` gives the nearest double. */
function parseDigitsAsDouble(value: string): number {
  let digits = "";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if ((code - 48) >>> 0 < 10) digits += value[i];
  }
  return Number(digits);
}

/**
 * Checks if the dni control code (letter) provided is valid.
 *
 * It does include checks for DNI K, L and M.
 * @WARNING It does not check the `DNI_REGEX`.
 *
 * The input is normalized first (NORM-1 to NORM-4); pass
 * `{ normalize: false }` to read it as v1 did.
 *
 * `{ rejectPlaceholders: true }` rejects the placeholder numbers (POLICY-1).
 *
 * Never throws: any value that is not a string (e.g. `null`) returns `false`.
 * @param value The value to check.
 * @param opts `normalize` (default `true`), `rejectPlaceholders` (default
 * `false`).
 * @returns true for valid input and false for invalid input.
 */
export function isValidDniLetter(
  value: unknown,
  opts: IsValidOptions = NO_OPTIONS
): boolean {
  if (typeof value !== "string") return false;
  // NORM-1..4. `normalize` returns the input itself when nothing changes.
  const dni = opts?.normalize === false ? value : normalize(value);
  // v1 behaviour, kept exactly: take every ASCII digit anywhere in the
  // string as one number (KLM-2: a K/L/M prefix counts as nothing) and
  // compare DNI-2's letter with the last character, upper-cased (NORM-1).
  let number = 0;
  let digitCount = 0;
  for (let i = 0; i < dni.length; i++) {
    const digit = dni.charCodeAt(i) - 48;
    if (digit >>> 0 < 10) {
      number = number * 10 + digit;
      digitCount++;
    }
  }
  if (digitCount > MAX_EXACT_DIGITS) number = parseDigitsAsDouble(dni);
  // `Infinity % 23` is NaN, and v1's `charAt(NaN)` read index 0, like
  // `charCodeAt(NaN)` here.
  return (
    lastCodeUnitUpperCased(dni) ===
      DNI_CONTROL_LETTERS.charCodeAt(number % 23) && acceptsValid(dni, opts)
  );
}
