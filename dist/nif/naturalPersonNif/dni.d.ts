export declare const DNI_REGEX: RegExp;
/**
 * Checks if the given dni is valid.
 *
 * It does include checks for DNI K, L and M.
 * @param dni
 * @returns true for valid input and false for invalid input.
 */
export declare function isValidDni(dni: string): boolean;
