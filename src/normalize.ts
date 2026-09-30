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

/** NORM-2 / NORM-3: the ASCII separators (white space, `.`, `-`, `/`). */
const ASCII_SEPARATORS = new Uint8Array(128);
for (const char of "\t\n\v\f\r ./-") ASCII_SEPARATORS[char.charCodeAt(0)] = 1;

/**
 * NORM-2 / NORM-3: is the UTF-16 code unit a separator that cleanup
 * removes? White space is exactly JavaScript's `\s` (WhiteSpace and
 * LineTerminator), plus `.`, `-` and `/`. Internal helper.
 */
export function isSeparator(code: number): boolean {
  if (code < 128) return ASCII_SEPARATORS[code] === 1;
  return (
    code === 0xa0 ||
    code === 0x1680 ||
    (code >= 0x2000 && code <= 0x200a) ||
    code === 0x2028 ||
    code === 0x2029 ||
    code === 0x202f ||
    code === 0x205f ||
    code === 0x3000 ||
    code === 0xfeff
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
 * The normalized form of `value` when a boolean validator should check it
 * again after the raw check failed, or `null`. Internal helper.
 *
 * The raw check is already case-insensitive (NORM-1) and accepts the old
 * NIE form (NIE-3), so normalizing only helps when the value is shorter
 * than 9 characters (NORM-4) or contains a separator (NORM-2, NORM-3). A
 * 9-character value without separators is never copied.
 */
export function normalizedForRetry(
  value: string,
  opts: IsValidOptions | null
): string | null {
  if (opts?.normalize === false) return null;
  if (value.length >= MIN_CLEAN_LENGTH) {
    let i = 0;
    while (i < value.length && !isSeparator(value.charCodeAt(i))) i++;
    if (i === value.length) return null;
  }
  const normalized = normalize(value);
  return normalized === value ? null : normalized;
}
