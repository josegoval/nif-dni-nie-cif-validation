export declare const LEGAL_ENTITY_CONTROL_LETTERS = "JABCDEFGHI";
export declare const LEGAL_ENTITY_NIF_REGEX: RegExp;
/**
 * Checks if the legal entity nif control code (letter or number)
 * provided is valid.
 *
 * @WARNING It does not check the `LEGAL_ENITY_NIF_REGEX`.
 * @throws May throw an error if the string is not long enough (9 characters)
 * @param legalEntityNif
 * @returns
 */
export declare function isValidLegalEntityNifControlCode(legalEntityNif: string): boolean;
/**
 * Checks if the legalEntityNif provided is valid.
 *
 * It does not include old K, L and M formats.
 * @param legalEntityNif
 * @returns true for valid input and false for invalid input.
 */
export declare function isValidLegalEntityNif(legalEntityNif: string): boolean;
