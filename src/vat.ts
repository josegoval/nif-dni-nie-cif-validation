/**
 * Spanish VAT numbers for intra-EU operations (VAT-1): `ES` + NIF
 * (RD 1065/2007 art. 25.1).
 *
 * Format only. A valid format does not mean the number is registered in
 * VIES, the EU's VAT Information Exchange System.
 *
 * Rule IDs refer to SPEC.md.
 */
import { isValidNif } from "./nif";
import { removeSeparators } from "./normalize";
import { NO_OPTIONS, toUpperAsciiLetter } from "./shared";
import type { IsValidOptions } from "./types";

/**
 * Checks the format of a Spanish VAT number: `ES` followed by a valid NIF
 * (DNI, K/L/M NIF, NIE or NIF of a legal person or entity), as RD 1065/2007 art. 25.1
 * defines it (VAT-1). The `ES` prefix is required.
 *
 * **A valid format is not the same as a registered number**: this does not
 * query VIES. Use the European Commission's VIES service to check that a
 * number is registered.
 *
 * Takes the same options as the boolean validators. The input is
 * normalized first (NORM-1 to NORM-4), so `"es b-1234567-4"` is valid.
 * Never throws: any value that is not a string returns `false`.
 *
 * @param value The value to check.
 * @param opts `normalize` (default `true`), `cifControl` (default
 * `"official"`), `rejectPlaceholders` (default `false`).
 * @returns true if the value is `ES` + a valid NIF.
 * @example
 * isValidSpanishVat("ES12345678Z");    // true
 * isValidSpanishVat("es b-1234567-4"); // true
 * @example
 * isValidSpanishVat("12345678Z");   // false: no ES prefix
 * isValidSpanishVat("ES12345678A"); // false: the NIF is invalid (DNI-2)
 * @see SPEC.md#vat-1
 * @since 2.0.0
 */
export function isValidSpanishVat(
  value: unknown,
  opts: IsValidOptions = NO_OPTIONS
): boolean {
  if (typeof value !== "string") return false;
  // NORM-2 / NORM-3 come first, so a separator inside the prefix goes too
  // ("E-S..."), as in validate().
  const clean = opts?.normalize === false ? value : removeSeparators(value);
  // VAT-1: the prefix is required here (NORM-1: either case), then the rest
  // is a NIF with the same options.
  return (
    toUpperAsciiLetter(clean.charCodeAt(0)) === 69 &&
    toUpperAsciiLetter(clean.charCodeAt(1)) === 83 &&
    isValidNif(clean.slice(2), opts)
  );
}
