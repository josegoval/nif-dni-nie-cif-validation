/**
 * Checks if the given naturalPersonNif is whether a valid DNI (including DNI K, L and M) or a valid NIE.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param naturalPersonNif The value to check.
 * @returns true for valid input and false for invalid input.
 */
export declare function isValidNaturalPersonNif(naturalPersonNif: string): boolean;
