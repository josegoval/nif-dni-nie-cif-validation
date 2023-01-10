export declare const DNI_CONTROL_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
/**
 * Checks if the dni control code (letter) provided is valid.
 *
 * It does include checks for DNI K, L and M.
 * @WARNING It does not check the `DNI_REGEX`.
 * @param dni
 * @returns true for valid input and false for invalid input.
 */
export declare function isValidDniLetter(dni: string): boolean;
