import { isValidDni } from "./dni";
import { isValidNie } from "./nie";

/**
 * Checks if the given naturalPersonNif is whether a valid DNI (including DNI K, L and M) or a valid NIE.
 * @param naturalPersonNif
 * @returns true for valid input and false for invalid input.
 */
export function isValidNaturalPersonNif(naturalPersonNif: string): boolean {
  return isValidDni(naturalPersonNif) || isValidNie(naturalPersonNif);
}
