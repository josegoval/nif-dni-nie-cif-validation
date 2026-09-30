import { hasValidDniLetter } from "./shared";

/**
 * Pattern of a NIE. It does not check the control letter.
 *
 * - NIE-1: X, Y or Z + 7 digits + check letter (for example `X1234567L`).
 * - NIE-3 (Orden INT/2058/2008, transitional provision; AEAT): old
 *   10-character NIEs, `X` + `0` + 7 digits + check letter (for example
 *   `X01234567L`), are still valid. Only for X: Y and Z came later.
 */
export const NIE_REGEX = /^(?:X0?|[YZ])[\d]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;

const OLD_NIE_LENGTH = 10;

/**
 * Returns a new string with the nie letter (XYZ) replaced.
 * However it will throw an error if the first character is not X, Y or Z.
 * @throws Invalid NIE letter error
 * @param nie
 * @returns A new string with the nie letter (XYZ) replaced.
 */
export function replaceNieLetter(nie: string): string {
  let nieLetter: string | number = nie.charAt(0).toUpperCase();
  if (nieLetter === "X") return 0 + nie.substring(1);
  if (nieLetter === "Y") return 1 + nie.substring(1);
  if (nieLetter === "Z") return 2 + nie.substring(1);
  throw new Error("Invalid NIE letter");
}

/**
 * Checks if the given nie is valid.
 *
 * Also accepts the old 10-character form `X0nnnnnnnL` (NIE-3), which is
 * validated as its canonical form `XnnnnnnnL` (for example `X01234567L`
 * validates as `X1234567L`).
 * @param nie
 * @returns true for valid input and false for invalid input.
 */
export function isValidNie(nie: string): boolean {
  // NIE-1 / NIE-3. The /i regex runs on the raw input: without the `u` flag
  // it only folds ASCII letters, so look-alikes that toUpperCase() maps to
  // ASCII (U+0131 "ı" -> "I", U+017F "ſ" -> "S") stay invalid.
  if (!NIE_REGEX.test(nie)) return false;
  // NORM-1: accept lower-case input. Upper-case once, check that value.
  const upperNie = nie.toUpperCase();
  // NIE-3: the canonical form drops the zero right after the X.
  const canonicalNie =
    upperNie.length === OLD_NIE_LENGTH
      ? upperNie[0] + upperNie.slice(2)
      : upperNie;
  // NIE-2: X -> 0, Y -> 1, Z -> 2, then DNI-2.
  return hasValidDniLetter(replaceNieLetter(canonicalNie));
}
