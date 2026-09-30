/**
 * Checks if the given naturalPersonNif is either a valid DNI (including DNI K, L and M) or a valid NIE.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param naturalPersonNif The value to check.
 * @returns true for valid input and false for invalid input.
 */
export declare function isValidNaturalPersonNif(naturalPersonNif: string): boolean;
/**
 * Checks if the given nif (legal entity NIF or natural person NIF
 * (DNI, DNI K, DNI L, DNI M, or NIE)) is valid.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param nif The value to check.
 * @returns true for valid input and false for invalid input.
 */
export declare function isValidNif(nif: string): boolean;
