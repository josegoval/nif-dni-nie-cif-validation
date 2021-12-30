export const DNI_CONTROL_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

/**
 * Checks if the dni control code (letter) provided is valid.
 *
 * It does include checks for DNI K, L and M.
 * @WARNING It does not check the `DNI_REGEX`.
 * @param dni
 * @returns true for valid input and false for invalid input.
 */
export function isValidDniLetter(dni: string): boolean {
  const letterIndex = +dni.replace(/[^\d]/g, "") % 23;

  const letter = dni.slice(-1);
  return DNI_CONTROL_LETTERS.charAt(letterIndex) === letter;
}
