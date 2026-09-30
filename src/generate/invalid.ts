/**
 * The builder of `generateInvalid`: a value that `validate()` rejects with a
 * chosen error code. It starts from a valid document of the type (see
 * core.ts) and breaks one thing, so the value looks like the type it stands
 * for.
 *
 * The codes, and what `validate()` says about the value with the default
 * options:
 *
 * - `INVALID_CONTROL_CHARACTER` (the default): only the control character
 *   changes (DNI-2, KLM-2, NIE-2, CIF-3, CIF-4). For a CIF it is wrong with
 *   `cifControl: "lenient"` too: neither the digit nor the letter of the
 *   right control value.
 * - `INVALID_LENGTH`: digits added after the first character, or (not for a
 *   DNI, which NORM-4 pads) removed before the control character (DNI-1,
 *   KLM-1, NIE-1, NIE-3, CIF-1). It never looks like an old 10-character
 *   NIE (NIE-3), which is valid.
 * - `INVALID_FORMAT`: a letter instead of a digit in the number, or a
 *   control character of the wrong class (DNI-1, KLM-1, KLM-3, NIE-1,
 *   CIF-1).
 * - `EMPTY`: an empty string or only separators (INPUT-2). The same for
 *   every type.
 * - `UNSUPPORTED_TYPE` and `PLACEHOLDER` depend on options: the value is
 *   valid by default and `validate()` rejects it only with `types` (POLICY-2)
 *   that leave the type out, or with `rejectPlaceholders` (POLICY-1). A
 *   placeholder exists for DNI and NIE only.
 * - `NOT_A_STRING` is not possible: the result is a string.
 *
 * Rule IDs refer to SPEC.md.
 */
import { LEGAL_ENTITY_CONTROL_LETTERS } from "../cif";
import { PLACEHOLDERS } from "../policy";
import type { NifErrorCode, NifType } from "../types";
import { assertOneOf, buildOfType, NIF_TYPES } from "./core";
import { nextInt, pick, pickChar, type Random } from "./random";

/** Every code that `buildInvalid` supports. */
export const INVALID_REASONS: readonly NifErrorCode[] = [
  "EMPTY",
  "INVALID_LENGTH",
  "INVALID_FORMAT",
  "INVALID_CONTROL_CHARACTER",
  "UNSUPPORTED_TYPE",
  "PLACEHOLDER",
];

/** INPUT-2: empty, or only separators (NORM-2, NORM-3). */
const EMPTIES = ["", " ", "   ", "-", " . ", "\t - / "];

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const NON_ZERO_DIGITS = "123456789";

/** `text` with the character at `index` replaced by `char`. */
function replaceAt(text: string, index: number, char: string): string {
  return text.slice(0, index) + char + text.slice(index + 1);
}

/** INVALID_CONTROL_CHARACTER: the control character is another one. */
function wrongControl(random: Random, type: NifType, valid: string): string {
  const right = valid.charAt(8);
  if (type !== "CIF")
    // DNI-2, KLM-2, NIE-2: any other letter of A-Z (I, O and U too, DNI-3).
    return replaceAt(valid, 8, pickChar(random, LETTERS.replace(right, "")));
  // CIF-3, CIF-4: neither the digit nor the letter of the control value, so
  // the value is wrong with `cifControl: "lenient"` too.
  const twin =
    (right.charCodeAt(0) - 48) >>> 0 < 10
      ? LEGAL_ENTITY_CONTROL_LETTERS.charAt(Number(right))
      : String(LEGAL_ENTITY_CONTROL_LETTERS.indexOf(right));
  return replaceAt(
    valid,
    8,
    pickChar(random, (LETTERS + DIGITS).replace(right, "").replace(twin, ""))
  );
}

/** INVALID_LENGTH: 1 to 3 characters too many or too few. */
function wrongLength(random: Random, type: NifType, valid: string): string {
  // A DNI is never too short: NORM-4 pads it, so it would be valid.
  if (type === "DNI" || nextInt(random, 2) === 0) {
    // Non-zero digits, so that an X NIE never turns into the old form
    // X0nnnnnnnL (NIE-3), which is valid.
    let extra = "";
    for (let i = 1 + nextInt(random, 3); i > 0; i--)
      extra += pickChar(random, NON_ZERO_DIGITS);
    return valid.charAt(0) + extra + valid.slice(1);
  }
  return valid.slice(0, 8 - (1 + nextInt(random, 3))) + valid.charAt(8);
}

/** INVALID_FORMAT: a letter in the number, or a control of the wrong class. */
function wrongFormat(random: Random, type: NifType, valid: string): string {
  // A letter in place of one of the 7 digits after the first character (the
  // first one decides the type, so it stays).
  if (nextInt(random, 2) === 0)
    return replaceAt(valid, 1 + nextInt(random, 7), pickChar(random, LETTERS));
  // DNI-1, KLM-1, NIE-1: the control is a letter, so a digit is a format
  // error. CIF-1: a digit or a letter, so a symbol is.
  return replaceAt(valid, 8, type === "CIF" ? "*" : pickChar(random, DIGITS));
}

/** POLICY-1: a placeholder, which exists for DNI and NIE only. */
function placeholder(random: Random, type: NifType): string {
  if (type !== "DNI" && type !== "NIE")
    throw new RangeError(
      `There is no placeholder for ${type}: POLICY-1 lists DNI and NIE numbers only.`
    );
  // 88 is "X": X0000000T is the NIE, the others are DNIs.
  return pick(
    random,
    PLACEHOLDERS.filter((p) => (p.charCodeAt(0) === 88) === (type === "NIE"))
  );
}

/**
 * A value of `type` that `validate()` rejects with the error code `reason`
 * (default `INVALID_CONTROL_CHARACTER`). Throws a `RangeError` for an
 * unknown type or reason, for `NOT_A_STRING`, and for `PLACEHOLDER` with a
 * type that has no placeholder.
 */
export function buildInvalid(
  random: Random,
  type: NifType,
  reason: NifErrorCode = "INVALID_CONTROL_CHARACTER"
): string {
  assertOneOf("type", type, NIF_TYPES);
  if (reason === "NOT_A_STRING")
    throw new RangeError(
      "reason NOT_A_STRING cannot be generated: the result is always a string."
    );
  assertOneOf("reason", reason, INVALID_REASONS);
  if (reason === "EMPTY") return pick(random, EMPTIES);
  if (reason === "PLACEHOLDER") return placeholder(random, type);
  const valid = buildOfType(random, type);
  if (reason === "INVALID_LENGTH") return wrongLength(random, type, valid);
  if (reason === "INVALID_FORMAT") return wrongFormat(random, type, valid);
  if (reason === "INVALID_CONTROL_CHARACTER")
    return wrongControl(random, type, valid);
  // UNSUPPORTED_TYPE: a valid value, rejected by the caller's `types`.
  return valid;
}
