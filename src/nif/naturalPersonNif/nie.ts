import { hasValidDniLetter } from "./shared";

// NIE-1: X, Y or Z + 7 digits + check letter.
export const NIE_REGEX = /^[XYZ][\d]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;

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
 * @param nie
 * @returns true for valid input and false for invalid input.
 */
export function isValidNie(nie: string): boolean {
  // NIE-1. The /i regex runs on the raw input: without the `u` flag it only
  // folds ASCII letters, so look-alikes that toUpperCase() maps to ASCII
  // (U+0131 "ı" -> "I", U+017F "ſ" -> "S") stay invalid.
  if (!NIE_REGEX.test(nie)) return false;
  // NORM-1: accept lower-case input. Upper-case once, check that value.
  // NIE-2: X -> 0, Y -> 1, Z -> 2, then DNI-2.
  return hasValidDniLetter(replaceNieLetter(nie.toUpperCase()));
}
