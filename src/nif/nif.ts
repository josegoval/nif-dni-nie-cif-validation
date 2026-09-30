import { isValidLegalEntityNif } from "./legalEntityNif/legalEntityNif";
import { isValidNaturalPersonNif } from "./naturalPersonNif/naturalPersonNif";

/**
 * Checks if the given nif (legal entity NIF or natural person NIF
 * (DNI, DNI K, DNI L, DNI M, or NIE)) is valid.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param nif The value to check.
 * @returns true for valid input and false for invalid input.
 */
export function isValidNif(nif: string): boolean {
  if (typeof nif !== "string") return false;
  // NORM-1: each validator upper-cases the input itself. Pass the raw value so
  // their format regexes see it unchanged.
  return isValidNaturalPersonNif(nif) || isValidLegalEntityNif(nif);
}
