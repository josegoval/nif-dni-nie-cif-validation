import { isValidLegalEntityNif } from "./legalEntityNif/legalEntityNif";
import { isValidNaturalPersonNif } from "./naturalPersonNif/naturalPersonNif";

/**
 * Checks if the given nif (legal entity NIF or natural person NIF
 * (DNI, DNI K, DNI L, DNI M, or NIE)) is valid.
 *
 * @param nif
 * @returns true for valid input and false for invalid input.
 */
export function isValidNif(nif: string): boolean {
  return isValidNaturalPersonNif(nif) || isValidLegalEntityNif(nif);
}
