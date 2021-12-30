import { isValidDniLetter } from "./shared";

export const NIE_REGEX = /^[XYZ][\d]{7}[TRWAGMYFPDXBNJZSQVHLCKET]$/i;

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
  return NIE_REGEX.test(nie) && isValidDniLetter(replaceNieLetter(nie));
}
