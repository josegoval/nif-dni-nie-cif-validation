/**
 * Legal entity NIF, formerly CIF (Código de Identificación Fiscal): the tax
 * ID of companies, associations, public bodies and other entities.
 *
 * Format:
 * - CIF-1: organisation key + 7 digits + a control character: `A58818501`
 *   (Orden EHA/451/2008 art. 2; RD 1065/2007 art. 22.1).
 * - CIF-2: the keys are A B C D E F G H J N P Q R S U V W (Orden
 *   EHA/451/2008 arts. 3-5). K L M X Y Z are natural persons, never entities.
 * - CIF-5: the 7 digits are random since 2008, so no province code check.
 *
 * Control character:
 * - CIF-4 (convention, no official text): add the digits in even positions
 *   (2, 4, 6); double each digit in odd positions (1, 3, 5, 7) and add the
 *   digits of the result; control = (10 - total mod 10) mod 10.
 * - CIF-3 (AEAT D.I.T. 2008): the key decides the type. A B C D E F G H J
 *   U V take the digit; N P Q R S W take the letter `JABCDEFGHI`[control].
 *   The opt-in `cifControl: "lenient"` lets C D F G J U V take either, as
 *   v1 did (legacy data, no official basis; #38).
 * - NORM-1: lower-case ASCII letters are accepted too (convention).
 *
 * Rule IDs refer to SPEC.md.
 */
import {
  isNineCharsFrom0x30,
  isWhiteSpace,
  normalize,
  removeSeparators,
} from "./normalize";
import { isLenientCif, NO_OPTIONS, toUpperAsciiLetter } from "./shared";
import type { IsValidOptions } from "./types";

/** CIF-3: the control letter for control digit `n` is the one at index `n`. */
export const LEGAL_ENTITY_CONTROL_LETTERS = "JABCDEFGHI";

/**
 * Pattern of a legal entity NIF (CIF). It does not check the control code.
 * Kept as a public constant for v1 compatibility; the validators below don't
 * use it.
 */
export const LEGAL_ENTITY_NIF_REGEX = /^[ABCDEFGHJNPQRSUVW][\d]{7}[\dA-J]$/i;

const CIF_LENGTH = 9;

// CIF-3 (AEAT D.I.T. 2008): the control type depends only on the
// organisation key. There is no "number starts with 00" rule.
export const NOT_A_KEY = 0;
/** A B E H: digit control, in both modes. */
const DIGIT_CONTROL = 1;
/** N P Q R S W: letter control, in both modes. */
export const LETTER_CONTROL = 2;
/**
 * C D F G J U V: digit control (CIF-3), or either a letter or a digit with
 * `cifControl: "lenient"`.
 */
export const LENIENT_KEY_CONTROL = 3;

/**
 * Control type of each letter from A to Z as a digit: `NOT_A_KEY` (0) for
 * I K L M O T X Y Z, else DIGIT_CONTROL (1), LETTER_CONTROL (2) or
 * LENIENT_KEY_CONTROL (3). A string, unlike a typed array, needs no code to
 * fill it when the module loads.
 */
//                 ABCDEFGHIJKLMNOPQRSTUVWXYZ
const KEY_KINDS = "11331331030002022220332000";

/**
 * CIF-2: control type of the organisation key with this UTF-16 code, or
 * `NOT_A_KEY`. Internal helper.
 */
export function cifKeyKind(code: number): number {
  // NORM-1: either case. `code | 32` maps A-Z to a-z, and only letters
  // land in a-z.
  const index = (code | 32) - 97;
  return index >>> 0 < 26 ? KEY_KINDS.charCodeAt(index) - 48 : NOT_A_KEY;
}

/** CIF-4: sum of the digits of `2 * digit`, by digit. */
const DOUBLED_DIGIT_SUM = [0, 2, 4, 6, 8, 1, 3, 5, 7, 9];

/**
 * CIF-4: the control value (0-9) of the 7 digits of `nif` at indexes 1 to 7,
 * or -1 if one of them is not an ASCII digit (CIF-1). Internal helper.
 */
export function cifControlValue(nif: string): number {
  let sum = 0;
  for (let i = 1; i < 8; i++) {
    const digit = nif.charCodeAt(i) - 48;
    // CIF-1: 7 ASCII digits.
    if (digit >>> 0 > 9) return -1;
    // CIF-4: the digits in odd positions of the number (1, 3, 5, 7, which
    // are also the odd string indexes) are doubled and the digits of the
    // result added; the digits in even positions (2, 4, 6) are added as is.
    sum += i & 1 ? (DOUBLED_DIGIT_SUM[digit] as number) : digit;
  }
  // CIF-4: control = (10 - sum mod 10) mod 10.
  return (10 - (sum % 10)) % 10;
}

/**
 * CIF-3: does the control character with UTF-16 code `code` match the
 * computed `control` (0-9) for this key kind?
 */
function matchesControl(
  kind: number,
  code: number,
  control: number,
  opts: IsValidOptions | null
): boolean {
  // CIF-3: N P Q R S W take the letter JABCDEFGHI[control] (NORM-1: either
  // case).
  if (kind === LETTER_CONTROL)
    return (
      toUpperAsciiLetter(code) ===
      LEGAL_ENTITY_CONTROL_LETTERS.charCodeAt(control)
    );
  // CIF-3: A B C D E F G H J U V take the digit.
  if (code - 48 === control) return true;
  // cifControl: "lenient" (#38): C D F G J U V may take the letter too.
  return (
    kind === LENIENT_KEY_CONTROL &&
    isLenientCif(opts) &&
    toUpperAsciiLetter(code) ===
      LEGAL_ENTITY_CONTROL_LETTERS.charCodeAt(control)
  );
}

/**
 * Checks, in one pass and without allocating, the 7 digits (CIF-1) and the
 * control character (CIF-3, CIF-4) of a 9-character legal entity NIF whose
 * organisation key has the given kind. Internal helper; the caller checks
 * the length and the key.
 */
export function hasValidCifDigitsAndControl(
  nif: string,
  kind: number,
  opts: IsValidOptions | null
): boolean {
  const control = cifControlValue(nif);
  return control >= 0 && matchesControl(kind, nif.charCodeAt(8), control, opts);
}

/**
 * v1 semantics of `+char` for one UTF-16 code unit: the digit's value, 0 for
 * the white space and line terminators that `Number()` trims, and -1 (v1's
 * `NaN`) for anything else.
 */
function looseDigitValue(code: number): number {
  const digit = code - 48;
  if (digit >>> 0 < 10) return digit;
  // `Number()` trims exactly JavaScript's white space.
  return isWhiteSpace(code) ? 0 : -1;
}

function isAscii(value: string): boolean {
  for (let i = 0; i < value.length; i++)
    if (value.charCodeAt(i) > 0x7f) return false;
  return true;
}

/**
 * v1's control code check, which reads the characters of `value` wherever
 * they are and whatever they are. `value` is ASCII or already upper case.
 */
function hasLooseControlCode(
  value: string,
  opts: IsValidOptions | null
): boolean {
  const last = value.length - 1;
  // v1 read the 7 digits from `value.slice(1, -1)`. A missing or non-numeric
  // one made the sum NaN, and no control matches NaN.
  let sum = 0;
  for (let i = 1; i < 8; i++) {
    const digit = i < last ? looseDigitValue(value.charCodeAt(i)) : -1;
    if (digit < 0) return false;
    // CIF-4, as in cifControlValue.
    sum += i & 1 ? (DOUBLED_DIGIT_SUM[digit] as number) : digit;
  }
  const control = (10 - (sum % 10)) % 10;
  const kind = cifKeyKind(value.charCodeAt(0));
  const code = value.charCodeAt(last);
  const letter = LEGAL_ENTITY_CONTROL_LETTERS.charCodeAt(control);
  // CIF-3: letter control.
  if (kind === LETTER_CONTROL) return toUpperAsciiLetter(code) === letter;
  const controlDigit = looseDigitValue(code);
  // CIF-3: digit control. In "official" mode C D F G J U V too.
  const lenient = isLenientCif(opts);
  if (kind === DIGIT_CONTROL || (kind === LENIENT_KEY_CONTROL && !lenient))
    return controlDigit === control;
  // CIF-3: without an organisation key there is no official control type.
  if (!lenient) return false;
  // cifControl: "lenient" (#38): C D F G J U V, and, as in v1, any first
  // character that is not a key, take a letter or a digit.
  return controlDigit < 0
    ? toUpperAsciiLetter(code) === letter
    : controlDigit === control;
}

/**
 * Checks if the legal entity nif control code (letter or number)
 * provided is valid.
 *
 * @WARNING It does not check the `LEGAL_ENTITY_NIF_REGEX`.
 *
 * With the default `cifControl: "official"`, the organisation key decides
 * whether the control is a digit or a letter (CIF-3), and a first character
 * that is not an organisation key gives `false`. `cifControl: "lenient"`
 * keeps the v1 behaviour: C D F G J U V, and any first character that is
 * not a key, accept either.
 *
 * The input is normalized first (NORM-1 to NORM-3); pass
 * `{ normalize: false }` to read it as v1 did (where, for example, a space
 * in a digit position counted as 0).
 *
 * Never throws, whatever the length of the string. Any value that is not a
 * string (e.g. `null`) returns `false`.
 * @param value The value to check.
 * @param opts `normalize` (default `true`), `cifControl` (default
 * `"official"`).
 * @returns true for a valid control code and false otherwise.
 * @see SPEC.md#cif-3
 */
export function isValidLegalEntityNifControlCode(
  value: unknown,
  opts: IsValidOptions = NO_OPTIONS
): boolean {
  if (typeof value !== "string") return false;
  // NORM-1..4. A 9-character value in 0x30-0x7F is ASCII, has no
  // separator, and normalizing it only upper-cases, which the check does
  // anyway: the fast path.
  if (opts?.normalize !== false && isNineCharsFrom0x30(value))
    return hasLooseControlCode(value, opts);
  const legalEntityNif = opts?.normalize === false ? value : normalize(value);
  // NORM-1: v1 upper-cased the whole string first. For ASCII that only
  // changes a-z, which the checks fold one character at a time. Other
  // characters can change length ("ß" -> "SS", "ﬃ" -> "FFI") and move the
  // positions, so only then is the upper-cased copy built.
  return hasLooseControlCode(
    isAscii(legalEntityNif) ? legalEntityNif : legalEntityNif.toUpperCase(),
    opts
  );
}

/**
 * Checks if the legalEntityNif provided is valid.
 *
 * It does not include old K, L and M formats.
 *
 * The control character follows CIF-3 by default: a digit for A B C D E F G
 * H J U V and a letter for N P Q R S W. Pass `{ cifControl: "lenient" }` to
 * also accept a letter for C D F G J U V, as v1 did.
 *
 * The input is normalized first (NORM-1 to NORM-3), so `" b-1234567-4 "`
 * is valid. Pass `{ normalize: false }` for v1's strict parsing.
 *
 * Never throws: any value that is not a string (e.g. `null`) returns `false`.
 * @param legalEntityNif The value to check.
 * @param opts `normalize` (default `true`), `cifControl` (default
 * `"official"`).
 * @returns true for valid input and false for invalid input.
 * @see SPEC.md#cif-3
 * @see SPEC.md#norm-2
 */
export function isValidLegalEntityNif(
  legalEntityNif: unknown,
  opts: IsValidOptions = NO_OPTIONS
): boolean {
  if (typeof legalEntityNif !== "string") return false;
  if (checkCif(legalEntityNif, opts)) return true;
  // NORM-2 / NORM-3: the slow path. Removing separators only shortens a
  // value, so a failed value of 9 characters or fewer stays invalid.
  return (
    legalEntityNif.length > CIF_LENGTH &&
    opts?.normalize !== false &&
    checkCif(removeSeparators(legalEntityNif), opts)
  );
}

/** Legal entity NIF, on the raw string. */
function checkCif(value: string, opts: IsValidOptions | null): boolean {
  // CIF-1: 9 characters.
  if (value.length !== CIF_LENGTH) return false;
  // CIF-2: a valid organisation key (NORM-1: either case).
  const kind = cifKeyKind(value.charCodeAt(0));
  return kind !== NOT_A_KEY && hasValidCifDigitsAndControl(value, kind, opts);
}
