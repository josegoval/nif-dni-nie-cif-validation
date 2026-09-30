import { toUpperAsciiLetter } from "./shared";

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
 * Checks if the given dni is valid.
 *
 * It does include checks for DNI K, L and M.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param dni The value to check.
 * @returns true for valid input and false for invalid input.
 */
export function isValidDni(dni: string): boolean {
  if (typeof dni !== "string" || dni.length !== DNI_LENGTH) return false;
  const first = dni.charCodeAt(0);
  // DNI-1: 8 digits + DNI-2 letter.
  if ((first - 48) >>> 0 < 10) return hasDniDigitsAndLetter(dni, 1, first - 48);
  // KLM-1 / KLM-3: K, L or M + 7 digits + letter. KLM-2: the letter is
  // computed over the 7 digits only, so the prefix counts as nothing.
  if ((toUpperAsciiLetter(first) - 75) >>> 0 < 3)
    return hasDniDigitsAndLetter(dni, 1, 0);
  return false;
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
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param dni The value to check.
 * @returns true for valid input and false for invalid input.
 */
export function isValidDniLetter(dni: string): boolean {
  if (typeof dni !== "string") return false;
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
    lastCodeUnitUpperCased(dni) === DNI_CONTROL_LETTERS.charCodeAt(number % 23)
  );
}
