import { isValidDniLetter } from "./shared";

export const DNI_REGEX = /^([KLM][\d]{7}|[\d]{8})[TRWAGMYFPDXBNJZSQVHLCKE]$/i;

/**
 * Checks if the given dni is valid.
 *
 * It does include checks for DNI K, L and M.
 * @param dni
 * @returns true for valid input and false for invalid input.
 */
export function isValidDni(dni: string): boolean {
  return DNI_REGEX.test(dni) && isValidDniLetter(dni);
}
