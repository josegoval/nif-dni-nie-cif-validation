export declare const DNI_CONTROL_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
/**
 * Checks the control letter of a value that is already upper case.
 * Internal helper, not exported from the package entry point.
 */
export declare function hasValidDniLetter(dni: string): boolean;
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
export declare function isValidDniLetter(dni: string): boolean;
