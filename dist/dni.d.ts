/** DNI-2: the check letter of `number` is the one at index `number mod 23`. */
export declare const DNI_CONTROL_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
/**
 * Pattern of a DNI or a K/L/M NIF. It does not check the control letter.
 * Kept as a public constant for v1 compatibility; the validators below don't
 * use it.
 */
export declare const DNI_REGEX: RegExp;
/**
 * Checks, in one pass and without allocating, that `value` has only digits
 * from `from` up to its last character, and that its last character is the
 * DNI-2 control letter of `prefix` followed by those digits. Internal helper
 * for the formats that end in a DNI-2 letter (DNI, K/L/M and NIE).
 */
export declare function hasDniDigitsAndLetter(value: string, from: number, prefix: number): boolean;
/**
 * Checks a DNI or K/L/M NIF. Internal helper: the caller has checked that
 * `dni` is a 9-character string, and passes the UTF-16 code of its first
 * character.
 */
export declare function isValidNineCharDni(dni: string, first: number): boolean;
/**
 * Checks if the given dni is valid.
 *
 * It does include checks for DNI K, L and M.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param dni The value to check.
 * @returns true for valid input and false for invalid input.
 */
export declare function isValidDni(dni: string): boolean;
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
