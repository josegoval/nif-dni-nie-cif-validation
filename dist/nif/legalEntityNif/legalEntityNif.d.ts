export declare const LEGAL_ENTITY_CONTROL_LETTERS = "JABCDEFGHI";
export declare const LEGAL_ENTITY_NIF_REGEX: RegExp;
/**
 * Checks if the legal entity nif control code (letter or number)
 * provided is valid.
 *
 * @WARNING It does not check the `LEGAL_ENTITY_NIF_REGEX`.
 *
 * Never throws, whatever the length of the string. Typed `string`, but any
 * other value (e.g. `null`) returns `false`.
 * @param legalEntityNif The value to check.
 * @returns true for a valid control code and false otherwise.
 */
export declare function isValidLegalEntityNifControlCode(legalEntityNif: string): boolean;
/**
 * Checks if the legalEntityNif provided is valid.
 *
 * It does not include old K, L and M formats.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param legalEntityNif The value to check.
 * @returns true for valid input and false for invalid input.
 */
export declare function isValidLegalEntityNif(legalEntityNif: string): boolean;
