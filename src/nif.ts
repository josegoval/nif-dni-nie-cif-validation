import { cifKeyKind, hasValidCifDigitsAndControl, NOT_A_KEY } from "./cif";
import { isValidNineCharDni } from "./dni";
import { isValidNineCharNie, isValidOldNie } from "./nie";

/** DNI, K/L/M, NIE and CIF all have 9 characters. */
const NIF_LENGTH = 9;
/** NIE-3: old NIEs, `X0` + 7 digits + letter. */
const OLD_NIE_LENGTH = 10;

/**
 * Checks if the given naturalPersonNif is either a valid DNI (including DNI K, L and M) or a valid NIE.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param naturalPersonNif The value to check.
 * @returns true for valid input and false for invalid input.
 */
export function isValidNaturalPersonNif(naturalPersonNif: string): boolean {
  if (typeof naturalPersonNif !== "string") return false;
  const length = naturalPersonNif.length;
  if (length === NIF_LENGTH) {
    const first = naturalPersonNif.charCodeAt(0);
    // DNI-1 / KLM-1 or NIE-1: the first character decides the format.
    return (
      isValidNineCharDni(naturalPersonNif, first) ||
      isValidNineCharNie(naturalPersonNif, first)
    );
  }
  // NIE-3: old 10-character NIE.
  return length === OLD_NIE_LENGTH && isValidOldNie(naturalPersonNif);
}

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
  const length = nif.length;
  if (length === NIF_LENGTH) {
    const first = nif.charCodeAt(0);
    // CIF-2: the organisation keys never overlap with the natural person
    // prefixes (digits, K L M, X Y Z), so the first character picks one
    // format and only that one is checked.
    const kind = cifKeyKind(first);
    if (kind !== NOT_A_KEY) return hasValidCifDigitsAndControl(nif, kind);
    return isValidNineCharDni(nif, first) || isValidNineCharNie(nif, first);
  }
  // NIE-3: old 10-character NIE.
  return length === OLD_NIE_LENGTH && isValidOldNie(nif);
}
