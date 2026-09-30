/**
 * Public types. Type-only: this module emits no runtime code.
 */

/**
 * The kinds of Spanish NIF this package validates:
 *
 * - `"DNI"`: 8 digits + check letter (DNI-1, DNI-2).
 * - `"NIF_KLM"`: K, L or M + 7 digits + check letter (KLM-1, KLM-2).
 * - `"NIE"`: X, Y or Z + 7 digits + check letter (NIE-1, NIE-2), or the old
 *   10-character form (NIE-3).
 * - `"CIF"`: legal entity NIF, organisation key + 7 digits + control
 *   (CIF-1 to CIF-4).
 *
 * The v1 functions don't use it yet; the upcoming `validate()` API (#56)
 * reports it.
 */
export type NifType = "DNI" | "NIE" | "CIF" | "NIF_KLM";
