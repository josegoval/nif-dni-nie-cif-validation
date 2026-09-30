export const DNI_CONTROL_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

/**
 * Checks the control letter of a value that is already upper case.
 * Internal helper, not exported from the package entry point.
 */
export function hasValidDniLetter(dni: string): boolean {
  // DNI-2: letter = DNI_CONTROL_LETTERS[number mod 23].
  // KLM-2: for K/L/M only the 7 digits count (the prefix is stripped here).
  const letterIndex = +dni.replace(/[^\d]/g, "") % 23;

  const letter = dni.slice(-1);
  return DNI_CONTROL_LETTERS.charAt(letterIndex) === letter;
}

/**
 * Checks if the dni control code (letter) provided is valid.
 *
 * It does include checks for DNI K, L and M.
 * @WARNING It does not check the `DNI_REGEX`.
 * @param dni
 * @returns true for valid input and false for invalid input.
 */
export function isValidDniLetter(dni: string): boolean {
  // NORM-1: accept lower-case input. Upper-case once, check that value.
  return hasValidDniLetter(dni.toUpperCase());
}
