import { hasValidDniLetter } from "./shared";

export const DNI_REGEX = /^([KLM][\d]{7}|[\d]{8})[TRWAGMYFPDXBNJZSQVHLCKE]$/i;

/**
 * Checks if the given dni is valid.
 *
 * It does include checks for DNI K, L and M.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param dni The value to check.
 * @returns true for valid input and false for invalid input.
 */
export function isValidDni(dni: string): boolean {
  if (typeof dni !== "string") return false;
  // DNI-1 / KLM-1 / KLM-3. The /i regex runs on the raw input: without the
  // `u` flag it only folds ASCII letters, so look-alikes that toUpperCase()
  // maps to ASCII (U+0131 "ı" -> "I", U+017F "ſ" -> "S") stay invalid.
  if (!DNI_REGEX.test(dni)) return false;
  // NORM-1: accept lower-case input. Upper-case once, check that value.
  return hasValidDniLetter(dni.toUpperCase());
}
