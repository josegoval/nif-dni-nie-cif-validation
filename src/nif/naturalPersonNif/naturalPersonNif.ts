import { isValidDni } from "./dni";
import { isValidNie } from "./nie";

/**
 * Checks if the given naturalPersonNif is whether a valid DNI (including DNI K, L and M) or a valid NIE.
 * @param naturalPersonNif
 * @returns true for valid input and false for invalid input.
 */
export function isValidNaturalPersonNif(naturalPersonNif: string): boolean {
  // NORM-1: each validator upper-cases the input itself. Pass the raw value so
  // their format regexes see it unchanged.
  return isValidDni(naturalPersonNif) || isValidNie(naturalPersonNif);
}
