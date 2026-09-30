/**
 * Input cleanup: how a NIF typed or pasted by a person becomes its canonical
 * official form. Cleanup never makes an invalid document valid; it only
 * accepts other ways of writing the same document.
 *
 * - NORM-1: the canonical form is upper case. ASCII letters (and ñ) are
 *   upper-cased; other non-ASCII characters are kept, so look-alikes that
 *   `toUpperCase()` maps to ASCII (U+0131 "ı" -> "I", U+017F "ſ" -> "S")
 *   never become valid.
 * - NORM-2: white space (as JavaScript's `\s`) and dots are removed.
 * - NORM-3: hyphens and slashes are removed.
 * - NORM-4: a DNI typed with fewer than 8 digits is left-padded with zeros.
 * - NIE-3: the old 10-character NIE `X0nnnnnnnL` becomes `XnnnnnnnL`.
 *
 * Rule IDs refer to SPEC.md.
 */
import type { IsValidOptions } from "./types";

/**
 * NORM-2: white space is exactly JavaScript's `\s` (WhiteSpace and
 * LineTerminator). With NORM-3's `.`, `-` and `/`, every separator is below
 * "0" (0x30) or non-ASCII.
 */
const WHITE_SPACE = /\s/;

/**
 * Is the UTF-16 code unit in 0x30-0x7F? Then it is not a separator (see
 * `isSeparator`). Internal helper.
 */
export function isFrom0x30To0x7F(code: number): boolean {
  return (code - 0x30) >>> 0 < 0x50;
}

/**
 * Is the UTF-16 code unit white space, as JavaScript's `\s` (which is also
 * what `Number()` trims)? Internal helper.
 */
export function isWhiteSpace(code: number): boolean {
  // ASCII white space is 0x09-0x0D and the space. Other code units ask the
  // regular expression; `NaN` (read past the end) becomes U+0000, which is
  // not white space.
  return code < 0x80
    ? code === 0x20 || (code - 0x09) >>> 0 < 5
    : WHITE_SPACE.test(String.fromCharCode(code));
}

/**
 * NORM-2 / NORM-3: is the UTF-16 code unit a separator that cleanup
 * removes? Internal helper.
 */
export function isSeparator(code: number): boolean {
  // Most characters are in 0x30-0x7F, which has no separator: one test.
  // NORM-3: `-`, `.` and `/` are 0x2D to 0x2F. NORM-2: white space.
  return (
    !isFrom0x30To0x7F(code) && ((code - 0x2d) >>> 0 < 3 || isWhiteSpace(code))
  );
}

/** Ñ and ñ: a letter of the Spanish alphabet, never a check letter (DNI-3). */
const UPPER_N_TILDE = 0xd1;
const LOWER_N_TILDE = 0xf1;

/** Is the code an upper-case letter (A-Z or Ñ)? Internal helper. */
export function isUpperLetter(code: number): boolean {
  return (code - 65) >>> 0 < 26 || code === UPPER_N_TILDE;
}

/** Are the code units of `value` from `from` to `to` (excluded) ASCII digits? */
export function areDigits(value: string, from: number, to: number): boolean {
  for (let i = from; i < to; i++)
    if ((value.charCodeAt(i) - 48) >>> 0 > 9) return false;
  return true;
}

/** Does NORM-1 upper-case this code unit (a-z or ñ)? */
function isLowerCaseLetter(code: number): boolean {
  return (code - 97) >>> 0 < 26 || code === LOWER_N_TILDE;
}

/**
 * NORM-1 to NORM-3: removes the separators and upper-cases ASCII letters
 * and ñ. Returns `value` itself when nothing changes. Internal helper.
 */
export function cleanup(value: string): string {
  const length = value.length;
  let i = 0;
  while (i < length) {
    const code = value.charCodeAt(i);
    if (isSeparator(code) || isLowerCaseLetter(code)) break;
    i++;
  }
  if (i === length) return value;
  let clean = value.slice(0, i);
  for (; i < length; i++) {
    const code = value.charCodeAt(i);
    if (isSeparator(code)) continue;
    clean += isLowerCaseLetter(code)
      ? String.fromCharCode(code - 32)
      : value.charAt(i);
  }
  return clean;
}

/**
 * NORM-1 only: upper-cases ASCII letters and ñ, without removing anything.
 * What `normalize: false` still accepts, as v1 did. Returns `value` itself
 * when nothing changes. Internal helper.
 */
export function upperCase(value: string): string {
  const length = value.length;
  let i = 0;
  while (i < length && !isLowerCaseLetter(value.charCodeAt(i))) i++;
  if (i === length) return value;
  let upper = value.slice(0, i);
  for (; i < length; i++) {
    const code = value.charCodeAt(i);
    upper += isLowerCaseLetter(code)
      ? String.fromCharCode(code - 32)
      : value.charAt(i);
  }
  return upper;
}

/** NIE-3: `X` + `0` + 7 digits + letter. */
const OLD_NIE_LENGTH = 10;
/** DNI-1: 8 digits + letter. */
const DNI_LENGTH = 9;
const ZEROS = "00000000";

/**
 * NIE-3 and, when `pad` is set, NORM-4, on an upper-case string without
 * separators. Returns `value` itself when nothing changes. Internal helper.
 */
export function canonicalize(value: string, pad: boolean): string {
  const length = value.length;
  // NIE-3: X0nnnnnnnL -> XnnnnnnnL.
  if (
    length === OLD_NIE_LENGTH &&
    value.charCodeAt(0) === 88 &&
    value.charCodeAt(1) === 48 &&
    areDigits(value, 2, 9) &&
    isUpperLetter(value.charCodeAt(9))
  )
    return `X${value.slice(2)}`;
  // NORM-4: 1 to 7 digits + letter -> 8 digits + letter.
  if (
    pad &&
    length > 1 &&
    length < DNI_LENGTH &&
    areDigits(value, 0, length - 1) &&
    isUpperLetter(value.charCodeAt(length - 1))
  )
    return ZEROS.slice(length - 1) + value;
  return value;
}

/**
 * Returns the canonical official form of a NIF, DNI, K/L/M, NIE or CIF, as
 * typed or pasted by a person. It applies, in order:
 *
 * 1. NORM-2 / NORM-3: removes every white-space character (as JavaScript's
 *    `\s`, so it also trims), dot, hyphen and slash, anywhere.
 * 2. NORM-1: upper-cases ASCII letters and `ñ`. Other characters are kept,
 *    so look-alikes such as `ı` or `ſ` never turn into valid letters.
 * 3. NIE-3: the old NIE form `X0nnnnnnnL` becomes `XnnnnnnnL`.
 * 4. NORM-4: 1 to 7 digits followed by a letter (a DNI without its leading
 *    zeros) are left-padded with zeros to 8 digits.
 *
 * It does not validate: the result may still be invalid. It doesn't strip
 * an `ES` VAT prefix either (see `isValidSpanishVat`). It returns the input
 * itself, without copying it, when nothing changes, and never throws: a
 * value that is not a string returns `""`.
 *
 * @param value The text to normalize.
 * @returns The canonical form.
 * @example
 * normalize(" 12.345.678-z "); // "12345678Z"
 * normalize("b-1234567-4");    // "B12345674"
 * @example
 * normalize("X01234567L"); // "X1234567L" (old NIE form, NIE-3)
 * normalize("1234567L");   // "01234567L" (leading zero restored, NORM-4)
 * @see SPEC.md#norm-1
 * @see SPEC.md#norm-4
 * @see SPEC.md#nie-3
 */
export function normalize(value: string): string {
  if (typeof value !== "string") return "";
  return canonicalize(cleanup(value), true);
}

/** Validators on 9 characters or more only need cleanup for separators. */
const MIN_CLEAN_LENGTH = 9;

/**
 * Is `value` 9 characters long, all in 0x30-0x7F? Then it has no separator
 * (they are all below "0" or non-ASCII), and `normalize` would at most
 * upper-case it. Internal helper.
 */
export function isNineCharsFrom0x30(value: string): boolean {
  if (value.length !== MIN_CLEAN_LENGTH) return false;
  for (let i = 0; i < MIN_CLEAN_LENGTH; i++)
    if (!isFrom0x30To0x7F(value.charCodeAt(i))) return false;
  return true;
}

/** First characters a validator accepts, as bits (see normalizedForRetry). */
export const FIRST_DIGIT = 1;
export const FIRST_KLM = 2;
export const FIRST_XYZ = 4;
export const FIRST_KEY = 8;

/** Class of each ASCII character from "0" (0x30) to 0x7F, both cases. */
const FIRST_CLASS = new Uint8Array(0x50);
for (const [chars, bit] of [
  ["0123456789", FIRST_DIGIT],
  ["KLMklm", FIRST_KLM],
  ["XYZxyz", FIRST_XYZ],
  ["ABCDEFGHJNPQRSUVWabcdefghjnpqrsuvw", FIRST_KEY],
] as const)
  for (const char of chars) FIRST_CLASS[char.charCodeAt(0) - 0x30] = bit;

/**
 * The slow path of the boolean validators, after their raw check failed:
 * the normalized form of `value` to check again, or `null` when
 * normalizing can't change the verdict. `accepted` holds the first
 * characters the validator accepts (`FIRST_*` bits). Internal helper.
 *
 * The raw check already folds case (NORM-1) and reads the old NIE form
 * (NIE-3), so normalizing only helps with a separator (NORM-2, NORM-3) or
 * a short DNI (NORM-4). Cheap tests first, so most values are rejected
 * without being scanned or copied:
 *
 * - `normalize: false`: nothing to retry.
 * - (Cleanup never makes a value longer, except NORM-4 padding a DNI, so
 *   isValidNie and isValidCif reject a failed value of 9 characters or
 *   fewer themselves, before calling this.)
 * - Every separator is below "0" (0x30) or non-ASCII. A first character in
 *   0x30-0x7F is therefore not a separator: it stays first after cleanup,
 *   only upper-cased, so the validator must accept it.
 * - (9 characters with a separator clean to 8 or fewer, which only NORM-4
 *   can make valid, and only from a digit: the validators that accept a
 *   DNI reject a failed 9-character value starting with a letter
 *   themselves, before calling this.)
 * - A value without any character below "0" or above 0x7F has no
 *   separator.
 */
export function normalizedForRetry(
  value: string,
  opts: IsValidOptions | null,
  accepted: number
): string | null {
  if (opts?.normalize === false) return null;
  const length = value.length;
  if (length >= MIN_CLEAN_LENGTH) {
    const first = value.charCodeAt(0) - 0x30;
    if (first >>> 0 < 0x50) {
      const kind = FIRST_CLASS[first] as number;
      if ((kind & accepted) === 0) return null;
      let i = 1;
      while (i < length && (value.charCodeAt(i) - 0x30) >>> 0 < 0x50) i++;
      if (i === length) return null;
    }
  }
  const normalized = normalize(value);
  return normalized === value ? null : normalized;
}
