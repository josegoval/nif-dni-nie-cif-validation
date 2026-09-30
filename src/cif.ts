import { toUpperAsciiLetter } from "./shared";

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
/** A B E H: digit control. */
const DIGIT_CONTROL = 1;
/** N P Q R S W: letter control. */
const LETTER_CONTROL = 2;
/**
 * C D F G J U V: v1 still accepts either a letter or a digit.
 * TODO(v2, #38): C D F G J U V are digit-only per CIF-3
 */
const EITHER_CONTROL = 3;

/** Control type of each organisation key (CIF-2), by UTF-16 code, both cases. */
const KEY_KINDS = new Uint8Array(128);
for (const [keys, kind] of [
  ["ABEH", DIGIT_CONTROL],
  ["NPQRSW", LETTER_CONTROL],
  ["CDFGJUV", EITHER_CONTROL],
] as const) {
  for (const key of keys) {
    KEY_KINDS[key.charCodeAt(0)] = kind;
    KEY_KINDS[key.toLowerCase().charCodeAt(0)] = kind;
  }
}

/**
 * CIF-2: control type of the organisation key with this UTF-16 code, or
 * `NOT_A_KEY`. Internal helper.
 */
export function cifKeyKind(code: number): number {
  return code < 128 ? (KEY_KINDS[code] as number) : NOT_A_KEY;
}

/** CIF-4: sum of the digits of `2 * digit`, by digit. */
const DOUBLED_DIGIT_SUM = [0, 2, 4, 6, 8, 1, 3, 5, 7, 9];

/**
 * CIF-3: does the control character with UTF-16 code `code` match the
 * computed `control` (0-9) for this key kind?
 */
function matchesControl(kind: number, code: number, control: number): boolean {
  // CIF-3: N P Q R S W take the letter JABCDEFGHI[control] (NORM-1: either
  // case).
  if (kind === LETTER_CONTROL)
    return (
      toUpperAsciiLetter(code) ===
      LEGAL_ENTITY_CONTROL_LETTERS.charCodeAt(control)
    );
  // CIF-3: A B E H take the digit. So do C D F G J U V...
  if (code - 48 === control) return true;
  // ...which v1 also lets take the letter. TODO(v2, #38): digit-only.
  return (
    kind === EITHER_CONTROL &&
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
  kind: number
): boolean {
  let sum = 0;
  for (let i = 1; i < 8; i++) {
    const digit = nif.charCodeAt(i) - 48;
    // CIF-1: 7 ASCII digits.
    if (digit >>> 0 > 9) return false;
    // CIF-4: the digits in odd positions of the number (1, 3, 5, 7, which
    // are also the odd string indexes) are doubled and the digits of the
    // result added; the digits in even positions (2, 4, 6) are added as is.
    sum += i & 1 ? (DOUBLED_DIGIT_SUM[digit] as number) : digit;
  }
  // CIF-4: control = (10 - sum mod 10) mod 10.
  return matchesControl(kind, nif.charCodeAt(8), (10 - (sum % 10)) % 10);
}

/**
 * v1 semantics of `+char` for one UTF-16 code unit: the digit's value, 0 for
 * the white space and line terminators that `Number()` trims, and -1 (v1's
 * `NaN`) for anything else.
 */
function looseDigitValue(code: number): number {
  const digit = code - 48;
  if (digit >>> 0 < 10) return digit;
  return code === 0x20 ||
    (code >= 0x09 && code <= 0x0d) ||
    code === 0xa0 ||
    code === 0x1680 ||
    (code >= 0x2000 && code <= 0x200a) ||
    code === 0x2028 ||
    code === 0x2029 ||
    code === 0x202f ||
    code === 0x205f ||
    code === 0x3000 ||
    code === 0xfeff
    ? 0
    : -1;
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
function hasLooseControlCode(value: string): boolean {
  const last = value.length - 1;
  // v1 read the 7 digits from `value.slice(1, -1)`. A missing or non-numeric
  // one made the sum NaN, and no control matches NaN.
  let sum = 0;
  for (let i = 1; i < 8; i++) {
    const digit = i < last ? looseDigitValue(value.charCodeAt(i)) : -1;
    if (digit < 0) return false;
    // CIF-4, as in hasValidCifDigitsAndControl.
    sum += i & 1 ? (DOUBLED_DIGIT_SUM[digit] as number) : digit;
  }
  const control = (10 - (sum % 10)) % 10;
  const kind = cifKeyKind(value.charCodeAt(0));
  const code = value.charCodeAt(last);
  const letter = LEGAL_ENTITY_CONTROL_LETTERS.charCodeAt(control);
  // CIF-3: letter control.
  if (kind === LETTER_CONTROL) return toUpperAsciiLetter(code) === letter;
  const controlDigit = looseDigitValue(code);
  // CIF-3: digit control.
  if (kind === DIGIT_CONTROL) return controlDigit === control;
  // Any other first character, a key or not: v1 took a letter or a digit.
  // TODO(v2, #38): C D F G J U V are digit-only per CIF-3
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
 * Never throws, whatever the length of the string. Typed `string`, but any
 * other value (e.g. `null`) returns `false`.
 * @param legalEntityNif The value to check.
 * @returns true for a valid control code and false otherwise.
 */
export function isValidLegalEntityNifControlCode(
  legalEntityNif: string
): boolean {
  if (typeof legalEntityNif !== "string") return false;
  // NORM-1: v1 upper-cased the whole string first. For ASCII that only
  // changes a-z, which the checks fold one character at a time. Other
  // characters can change length ("ß" -> "SS", "ﬃ" -> "FFI") and move the
  // positions, so only then is the upper-cased copy built.
  return hasLooseControlCode(
    isAscii(legalEntityNif) ? legalEntityNif : legalEntityNif.toUpperCase()
  );
}

/**
 * Checks if the legalEntityNif provided is valid.
 *
 * It does not include old K, L and M formats.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param legalEntityNif The value to check.
 * @returns true for valid input and false for invalid input.
 */
export function isValidLegalEntityNif(legalEntityNif: string): boolean {
  // CIF-1: 9 characters.
  if (
    typeof legalEntityNif !== "string" ||
    legalEntityNif.length !== CIF_LENGTH
  )
    return false;
  // CIF-2: a valid organisation key (NORM-1: either case).
  const kind = cifKeyKind(legalEntityNif.charCodeAt(0));
  return (
    kind !== NOT_A_KEY && hasValidCifDigitsAndControl(legalEntityNif, kind)
  );
}
