/**
 * NIF of a legal person or entity, formerly CIF (Código de Identificación Fiscal): the tax
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
  isFrom0x30To0x7F,
  isNineCharsFrom0x30,
  isWhiteSpace,
  normalize,
  removeSeparators,
} from "./normalize";
import { isLenientCif, NO_OPTIONS, toUpperAsciiLetter } from "./shared";
import type { IsValidOptions } from "./types";

/**
 * The control letters of a NIF of a legal person or entity (CIF): the control
 * digit 0 is `J`, 1 is `A`, 2 is `B`, and so on up to 9, which is `I`
 * (CIF-3). Only the keys N P Q R S W take the letter; the others take the
 * digit.
 * @example
 * LEGAL_ENTITY_CONTROL_LETTERS[4];       // "D" (the letter that stands for the control digit 4)
 * LEGAL_ENTITY_CONTROL_LETTERS.length;   // 10
 * @example
 * LEGAL_ENTITY_CONTROL_LETTERS.indexOf("B"); // 2: a control letter B stands for the digit 2
 * LEGAL_ENTITY_CONTROL_LETTERS.includes("Z"); // false: Z is never a control letter
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-3 SPEC.md#cif-3}
 * @since 1.0.0
 */
export const LEGAL_ENTITY_CONTROL_LETTERS = "JABCDEFGHI";

/**
 * Pattern of the NIF of a legal person or entity (CIF): an organisation key, 7
 * digits and a digit or a letter from A to J. It does not check the control
 * code.
 *
 * Kept as a public constant for v1 compatibility; the validators below don't
 * use it. Use `isValidLegalEntityNif` to validate a NIF: it also checks the
 * control character, and CIF-3 says which keys take a letter.
 * @example
 * LEGAL_ENTITY_NIF_REGEX.test("B12345674"); // true
 * LEGAL_ENTITY_NIF_REGEX.test("b1234567d"); // true: the pattern takes a letter for any key
 * @example
 * LEGAL_ENTITY_NIF_REGEX.test("K12345674"); // false: K is not an organisation key (CIF-2)
 * LEGAL_ENTITY_NIF_REGEX.test("B1234567");  // false: the control character is missing (CIF-1)
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-1 SPEC.md#cif-1}
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-2 SPEC.md#cif-2}
 * @since 1.0.0
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
 * control character (CIF-3, CIF-4) of a 9-character NIF of a legal person or entity whose
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
 * Checks the control character (letter or digit) of a NIF of a legal person
 * or entity, formerly CIF, without checking its format.
 *
 * **It does not check the format** (`LEGAL_ENTITY_NIF_REGEX`): it only reads
 * the organisation key, the 7 digits and the last character.
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
 * @param value The value to check: an organisation key, 7 digits and a
 * control character, for example `B12345674`.
 * @param opts `normalize` (default `true`), `cifControl` (default
 * `"official"`). See {@link IsValidOptions}.
 * @returns `true` if the last character is the control character (CIF-4) of
 * the right class for the organisation key (CIF-3), or a letter or a digit
 * for C D F G J U V with `cifControl: "lenient"`. `false` otherwise, and for
 * any value that is not a string.
 * @example
 * isValidLegalEntityNifControlCode("B12345674"); // true (B takes the digit 4)
 * isValidLegalEntityNifControlCode("P2807900B"); // true (P takes the letter B)
 * isValidLegalEntityNifControlCode("G1234567D", { cifControl: "lenient" }); // true, as in v1
 * @example
 * isValidLegalEntityNifControlCode("B12345670"); // false: the control digit should be 4 (CIF-4)
 * isValidLegalEntityNifControlCode("P28079004"); // false: P takes a letter (CIF-3)
 * isValidLegalEntityNifControlCode("G1234567D"); // false: G takes a digit (CIF-3), unless lenient
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-3 SPEC.md#cif-3}
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-4 SPEC.md#cif-4}
 * @since 1.0.0
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
 * Checks that a value is a valid NIF of a legal person or entity, formerly
 * CIF: an organisation key, 7 digits and a control character.
 *
 * The control character follows CIF-3 by default: a digit for A B C D E F G
 * H J U V and a letter for N P Q R S W. Pass `{ cifControl: "lenient" }` to
 * also accept a letter for C D F G J U V, as v1 did.
 *
 * The input is normalized first (NORM-1 to NORM-3), so `" b-1234567-4 "`
 * is valid. Pass `{ normalize: false }` for v1's strict parsing.
 *
 * It does not include the old K, L and M formats: those are natural persons.
 * Never throws: any value that is not a string (e.g. `null`) returns `false`.
 * @param legalEntityNif The value to check: an organisation key (A B C D E F G
 * H J N P Q R S U V W), 7 digits and a control character, in either case, with
 * or without separators.
 * @param opts `normalize` (default `true`), `cifControl` (default
 * `"official"`). See {@link IsValidOptions}.
 * @returns `true` if the value is a NIF of a legal person or entity with a
 * valid organisation key and the right control character, after normalizing
 * it unless `normalize` is `false`. `false` for anything else: a DNI or a
 * NIE, the wrong control character or class, and any value that is not a
 * string.
 * @example
 * isValidLegalEntityNif("B12345674");     // true
 * isValidLegalEntityNif(" b-1234567-4 "); // true (lower case with separators)
 * isValidLegalEntityNif("G1234567D", { cifControl: "lenient" }); // true, as in v1
 * @example
 * isValidLegalEntityNif("B12345670"); // false: the control digit should be 4 (CIF-4)
 * isValidLegalEntityNif("G1234567D"); // false: G takes a digit, not a letter (CIF-3)
 * isValidLegalEntityNif("12345678Z"); // false: a DNI is not a NIF of a legal person
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-3 SPEC.md#cif-3}
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#norm-2 SPEC.md#norm-2}
 * @since 1.0.0
 */
export function isValidLegalEntityNif(
  legalEntityNif: unknown,
  opts: IsValidOptions = NO_OPTIONS
): boolean {
  if (typeof legalEntityNif !== "string") return false;
  if (checkCif(legalEntityNif, opts)) return true;
  // Cleanup only shortens a value (NORM-4 pads DNIs only), so a failed
  // value of 9 characters or fewer stays invalid.
  return legalEntityNif.length > CIF_LENGTH && retryCif(legalEntityNif, opts);
}

/**
 * NORM-2 / NORM-3: the slow path of isValidLegalEntityNif, in its own
 * function so the fast path stays small.
 */
function retryCif(value: string, opts: IsValidOptions | null): boolean {
  if (opts?.normalize === false) return false;
  // A first character in 0x30-0x7F is no separator, so it stays first: if
  // it isn't an organisation key, there's nothing to scan (CIF-2).
  const first = value.charCodeAt(0);
  if (isFrom0x30To0x7F(first) && cifKeyKind(first) === NOT_A_KEY) return false;
  return checkCif(removeSeparators(value), opts);
}

/** NIF of a legal person or entity (CIF), on the raw string. */
function checkCif(value: string, opts: IsValidOptions | null): boolean {
  // CIF-1: 9 characters.
  if (value.length !== CIF_LENGTH) return false;
  // CIF-2: a valid organisation key (NORM-1: either case).
  const kind = cifKeyKind(value.charCodeAt(0));
  return kind !== NOT_A_KEY && hasValidCifDigitsAndControl(value, kind, opts);
}

/**
 * Checks that a value is a valid NIF of a legal person or entity, formerly
 * CIF: an organisation key, 7 digits and a control character. Alias of
 * `isValidLegalEntityNif`: the same function, under the name v1 also
 * exported.
 *
 * The control character follows CIF-3 by default: a digit for A B C D E F G
 * H J U V and a letter for N P Q R S W. Pass `{ cifControl: "lenient" }` to
 * also accept a letter for C D F G J U V, as v1 did.
 *
 * The input is normalized first (NORM-1 to NORM-3), so `" b-1234567-4 "`
 * is valid. Pass `{ normalize: false }` for v1's strict parsing.
 *
 * It does not include the old K, L and M formats: those are natural persons.
 * Never throws: any value that is not a string (e.g. `null`) returns `false`.
 * @param legalEntityNif The value to check: an organisation key (A B C D E F G
 * H J N P Q R S U V W), 7 digits and a control character, in either case, with
 * or without separators.
 * @param opts `normalize` (default `true`), `cifControl` (default
 * `"official"`). See {@link IsValidOptions}.
 * @returns `true` if the value is a NIF of a legal person or entity with a
 * valid organisation key and the right control character, after normalizing
 * it unless `normalize` is `false`. `false` for anything else: a DNI or a
 * NIE, the wrong control character or class, and any value that is not a
 * string.
 * @example
 * isValidCif("B12345674");     // true
 * isValidCif(" b-1234567-4 "); // true (lower case with separators)
 * isValidCif("G1234567D", { cifControl: "lenient" }); // true, as in v1
 * @example
 * isValidCif("B12345670"); // false: the control digit should be 4 (CIF-4)
 * isValidCif("G1234567D"); // false: G takes a digit, not a letter (CIF-3)
 * isValidCif("12345678Z"); // false: a DNI is not a NIF of a legal person
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-3 SPEC.md#cif-3}
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#norm-2 SPEC.md#norm-2}
 * @since 1.0.0
 */
export const isValidCif: typeof isValidLegalEntityNif = isValidLegalEntityNif;

/**
 * Checks the control character (letter or digit) of a NIF of a legal person
 * or entity, formerly CIF, without checking its format. Alias of
 * `isValidLegalEntityNifControlCode`: the same function, under the name v1
 * also exported.
 *
 * **It does not check the format** (`LEGAL_ENTITY_NIF_REGEX`): it only reads
 * the organisation key, the 7 digits and the last character.
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
 * @param value The value to check: an organisation key, 7 digits and a
 * control character, for example `B12345674`.
 * @param opts `normalize` (default `true`), `cifControl` (default
 * `"official"`). See {@link IsValidOptions}.
 * @returns `true` if the last character is the control character (CIF-4) of
 * the right class for the organisation key (CIF-3), or a letter or a digit
 * for C D F G J U V with `cifControl: "lenient"`. `false` otherwise, and for
 * any value that is not a string.
 * @example
 * isValidCifControlCode("B12345674"); // true (B takes the digit 4)
 * isValidCifControlCode("P2807900B"); // true (P takes the letter B)
 * isValidCifControlCode("G1234567D", { cifControl: "lenient" }); // true, as in v1
 * @example
 * isValidCifControlCode("B12345670"); // false: the control digit should be 4 (CIF-4)
 * isValidCifControlCode("P28079004"); // false: P takes a letter (CIF-3)
 * isValidCifControlCode("G1234567D"); // false: G takes a digit (CIF-3), unless lenient
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-3 SPEC.md#cif-3}
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-4 SPEC.md#cif-4}
 * @since 1.0.0
 */
export const isValidCifControlCode: typeof isValidLegalEntityNifControlCode =
  isValidLegalEntityNifControlCode;

/**
 * The control letters of a NIF of a legal person or entity (CIF): the control
 * digit 0 is `J`, 1 is `A`, 2 is `B`, and so on up to 9, which is `I`
 * (CIF-3). Only the keys N P Q R S W take the letter; the others take the
 * digit.
 *
 * Alias of `LEGAL_ENTITY_CONTROL_LETTERS`: the same value, under the name v1
 * also exported.
 * @example
 * CIF_CONTROL_LETTERS[4];       // "D" (the letter that stands for the control digit 4)
 * CIF_CONTROL_LETTERS.length;   // 10
 * @example
 * CIF_CONTROL_LETTERS.indexOf("B"); // 2: a control letter B stands for the digit 2
 * CIF_CONTROL_LETTERS.includes("Z"); // false: Z is never a control letter
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-3 SPEC.md#cif-3}
 * @since 1.0.0
 */
export const CIF_CONTROL_LETTERS: typeof LEGAL_ENTITY_CONTROL_LETTERS =
  LEGAL_ENTITY_CONTROL_LETTERS;

/**
 * Pattern of the NIF of a legal person or entity (CIF): an organisation key, 7
 * digits and a digit or a letter from A to J. It does not check the control
 * code.
 *
 * Alias of `LEGAL_ENTITY_NIF_REGEX`: the same pattern, under the name v1 also
 * exported.
 *
 * Kept as a public constant for v1 compatibility; the validators below don't
 * use it. Use `isValidLegalEntityNif` to validate a NIF: it also checks the
 * control character, and CIF-3 says which keys take a letter.
 * @example
 * CIF_REGEX.test("B12345674"); // true
 * CIF_REGEX.test("b1234567d"); // true: the pattern takes a letter for any key
 * @example
 * CIF_REGEX.test("K12345674"); // false: K is not an organisation key (CIF-2)
 * CIF_REGEX.test("B1234567");  // false: the control character is missing (CIF-1)
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-1 SPEC.md#cif-1}
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-2 SPEC.md#cif-2}
 * @since 1.0.0
 */
export const CIF_REGEX: typeof LEGAL_ENTITY_NIF_REGEX = LEGAL_ENTITY_NIF_REGEX;
