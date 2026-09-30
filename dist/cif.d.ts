/** CIF-3: the control letter for control digit `n` is the one at index `n`. */
export declare const LEGAL_ENTITY_CONTROL_LETTERS = "JABCDEFGHI";
/**
 * Pattern of a legal entity NIF (CIF). It does not check the control code.
 * Kept as a public constant for v1 compatibility; the validators below don't
 * use it.
 */
export declare const LEGAL_ENTITY_NIF_REGEX: RegExp;
export declare const NOT_A_KEY = 0;
/**
 * CIF-2: control type of the organisation key with this UTF-16 code, or
 * `NOT_A_KEY`. Internal helper.
 */
export declare function cifKeyKind(code: number): number;
/**
 * Checks, in one pass and without allocating, the 7 digits (CIF-1) and the
 * control character (CIF-3, CIF-4) of a 9-character legal entity NIF whose
 * organisation key has the given kind. Internal helper; the caller checks
 * the length and the key.
 */
export declare function hasValidCifDigitsAndControl(nif: string, kind: number): boolean;
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
