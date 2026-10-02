/**
 * NIE: Número de Identidad de Extranjero, the ID number of foreigners, which
 * is also their NIF.
 *
 * Format:
 * - NIE-1: X, Y or Z + 7 digits + a check letter: `X1234567L` (Orden
 *   INT/2058/2008). After the X series ran out, Y came next, then Z.
 * - NIE-3: old 10-character NIEs, X + 8 digits + letter, stay valid. Their
 *   canonical form drops the zero right after the X: `X01234567L` is
 *   `X1234567L`.
 *
 * Check letter:
 * - NIE-2: X -> 0, Y -> 1, Z -> 2, then the DNI-2 letter of the resulting
 *   8-digit number (Ministerio del Interior; AEAT D.I.T. note).
 * - NORM-1: a lower-case ASCII letter is accepted too (convention).
 *
 * Rule IDs refer to SPEC.md.
 */
import { hasDniDigitsAndLetter } from "./dni";
import { isFrom0x30To0x7F, removeSeparators } from "./normalize";
import { acceptsDocument, isPlaceholderDocument } from "./policy";
import { NO_OPTIONS, toUpperAsciiLetter } from "./shared";
import type { IsValidOptions } from "./types";

/**
 * Pattern of a NIE: X, Y or Z and 7 digits, or X, a 0 and 7 digits (the old
 * 10-character form), and a check letter. It does not check that the letter
 * is the right one.
 *
 * - NIE-1: X, Y or Z + 7 digits + check letter (for example `X1234567L`).
 * - NIE-3 (Orden INT/2058/2008, transitional provision; AEAT): old
 *   10-character NIEs, `X` + `0` + 7 digits + check letter (for example
 *   `X01234567L`), are still valid. Only for X: Y and Z came later.
 *
 * Kept as a public constant for v1 compatibility; `isValidNie` doesn't use it.
 * Use `isValidNie` to validate a NIE: it also checks the letter (NIE-2).
 * @example
 * NIE_REGEX.test("X1234567L");  // true
 * NIE_REGEX.test("x01234567l"); // true (the old 10-character form, NIE-3)
 * @example
 * NIE_REGEX.test("X1234567A"); // true: the pattern doesn't check the letter, `isValidNie` does
 * NIE_REGEX.test("12345678Z"); // false: a DNI is not a NIE (NIE-1)
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#nie-1 SPEC.md#nie-1}
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#nie-3 SPEC.md#nie-3}
 * @since 1.0.0
 */
export const NIE_REGEX = /^(?:X0?|[YZ])[\d]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;

const NIE_LENGTH = 9;
const OLD_NIE_LENGTH = 10;

/**
 * NIE-2 value of a NIE prefix (X -> 0, Y -> 1, Z -> 2, either case), or a
 * number outside 0-2 for anything else.
 */
function niePrefixValue(code: number): number {
  return toUpperAsciiLetter(code) - 88;
}

/**
 * Checks a 9-character NIE. Internal helper: the caller has checked that
 * `nie` is a 9-character string, and passes the UTF-16 code of its first
 * character.
 */
export function isValidNineCharNie(nie: string, first: number): boolean {
  // NIE-1: X, Y or Z + 7 digits + letter. NIE-2: the prefix counts as its
  // digit (X -> 0, Y -> 1, Z -> 2), then DNI-2.
  const prefix = niePrefixValue(first);
  return prefix >>> 0 < 3 && hasDniDigitsAndLetter(nie, 1, prefix);
}

/**
 * NIE-3: checks an old 10-character NIE, `X` + `0` + 7 digits + letter. The
 * canonical form drops the zero right after the X, and X counts as 0 (NIE-2),
 * so only the 7 digits count. Internal helper; the caller checks the length.
 */
export function isValidOldNie(nie: string): boolean {
  return (
    niePrefixValue(nie.charCodeAt(0)) === 0 &&
    nie.charCodeAt(1) === 48 &&
    hasDniDigitsAndLetter(nie, 2, 0)
  );
}

/**
 * Replaces the first letter of a NIE by its number (X -> 0, Y -> 1, Z -> 2,
 * see NIE-2). The first character is compared case-insensitively; the rest of
 * the string is returned unchanged.
 *
 * Unlike the `isValid*` functions, this function throws.
 * @deprecated Kept unchanged for v1 compatibility, and it still throws in v2.
 * It may be removed in a future major version. Use `isValidNie` to validate
 * a NIE, or `normalize` to get its canonical form.
 * @throws {Error} `Invalid NIE letter` if the first character is not X, Y
 * or Z (including the empty string).
 * @throws {TypeError} If `nie` is not a string (for example `null`,
 * `undefined` or a number).
 * @param nie The NIE, or any string that starts with X, Y or Z.
 * @returns A new string where the first letter is the digit 0, 1 or 2, and the
 * rest is unchanged: `"X1234567L"` gives `"01234567L"`.
 * @example
 * replaceNieLetter("X1234567L"); // "01234567L"
 * replaceNieLetter("y1234567x"); // "11234567x" (the first letter in either case)
 * @example
 * replaceNieLetter("12345678Z"); // throws Error
 * replaceNieLetter(null as never); // throws TypeError
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#nie-2 SPEC.md#nie-2}
 * @since 1.0.0
 */
export function replaceNieLetter(nie: string): string {
  const nieLetter = nie.charAt(0).toUpperCase();
  if (nieLetter === "X") return 0 + nie.substring(1);
  if (nieLetter === "Y") return 1 + nie.substring(1);
  if (nieLetter === "Z") return 2 + nie.substring(1);
  throw new Error("Invalid NIE letter");
}

/**
 * Checks that a value is a valid NIE: X, Y or Z, 7 digits and a check letter,
 * or the old 10-character form.
 *
 * Also accepts the old 10-character form `X0nnnnnnnL` (NIE-3), which is
 * validated as its canonical form `XnnnnnnnL` (for example `X01234567L`
 * validates as `X1234567L`).
 *
 * The input is normalized first (NORM-1 to NORM-3), so `"x-1234567-l"` is
 * valid. Pass `{ normalize: false }` for v1's strict parsing.
 *
 * `{ rejectPlaceholders: true }` rejects the placeholder `X0000000T`
 * (POLICY-1).
 *
 * Never throws: any value that is not a string (e.g. `null`) returns `false`.
 * @param nie The value to check: `X1234567L`, in either case, with or without
 * separators, or the old 10-character form `X01234567L`.
 * @param opts `normalize` (default `true`), `rejectPlaceholders` (default
 * `false`). See {@link IsValidOptions}.
 * @returns `true` if the value is a NIE with the right check letter, after
 * normalizing it unless `normalize` is `false`. `false` for anything else: a
 * DNI, a wrong letter, and any value that is not a string.
 * @example
 * isValidNie("X1234567L");   // true
 * isValidNie("x-1234567-l"); // true (lower case with hyphens)
 * isValidNie("X01234567L");  // true (old 10-character form, NIE-3)
 * @example
 * isValidNie("X1234567A"); // false: the letter should be L (NIE-2)
 * isValidNie("12345678Z"); // false: a DNI is not a NIE
 * isValidNie("X0000000T", { rejectPlaceholders: true }); // false: a placeholder (POLICY-1)
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#nie-1 SPEC.md#nie-1}
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#nie-3 SPEC.md#nie-3}
 * @since 1.0.0
 */
export function isValidNie(
  nie: unknown,
  opts: IsValidOptions = NO_OPTIONS
): boolean {
  if (typeof nie !== "string") return false;
  // The fast path: a valid raw value, and placeholders only when asked.
  if (checkNie(nie))
    return opts?.rejectPlaceholders !== true || !isPlaceholderDocument(nie);
  // Cleanup only shortens a value (NORM-4 pads DNIs only), so a failed
  // value of 9 characters or fewer stays invalid.
  if (nie.length <= NIE_LENGTH) return false;
  return retryNie(nie, opts);
}

/**
 * NORM-2 / NORM-3: the slow path of isValidNie, in its own function so the
 * fast path stays small.
 */
function retryNie(value: string, opts: IsValidOptions | null): boolean {
  if (opts?.normalize === false) return false;
  // A first character in 0x30-0x7F is no separator, so it stays first: if
  // it isn't X, Y or Z, there's nothing to scan (NIE-1).
  const first = value.charCodeAt(0);
  if (isFrom0x30To0x7F(first) && niePrefixValue(first) >>> 0 >= 3) return false;
  const clean = removeSeparators(value);
  return checkNie(clean) && acceptsDocument(clean, opts);
}

/** NIE, on the raw string. */
function checkNie(nie: string): boolean {
  const length = nie.length;
  // NIE-1 / NIE-2.
  if (length === NIE_LENGTH) return isValidNineCharNie(nie, nie.charCodeAt(0));
  // NIE-3: old 10-character form.
  return length === OLD_NIE_LENGTH && isValidOldNie(nie);
}
