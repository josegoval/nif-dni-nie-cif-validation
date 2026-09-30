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

/**
 * Which control characters a legal entity NIF (CIF) may have (CIF-3):
 *
 * - `"official"` (the default): what the AEAT D.I.T. note says. A digit for
 *   A B C D E F G H J U V, a letter for N P Q R S W.
 * - `"lenient"`: C D F G J U V accept a letter or a digit, as v1 did. For
 *   legacy data only: it has no official basis (SPEC.md, "Explicitly NOT
 *   implemented"). The other keys are unchanged.
 *
 * @see SPEC.md#cif-3
 */
export type CifControlMode = "official" | "lenient";

/**
 * Options of the boolean validators (`isValidNif` and the others). Every
 * option is optional and defaults to the official behaviour.
 */
export interface IsValidOptions {
  /**
   * Normalize the input before validating it (default `true`): remove white
   * space and dots (NORM-2), hyphens and slashes (NORM-3), left-pad a DNI
   * with fewer than 8 digits (NORM-4). See `normalize()`.
   *
   * `false` turns NORM-2 to NORM-4 off, for v1's strict parsing. Lower case
   * (NORM-1) and the old 10-character NIE form (NIE-3) are accepted either
   * way, as in v1.
   * @see SPEC.md#norm-2
   */
  normalize?: boolean;
  /**
   * Control characters accepted for a legal entity NIF (CIF). Default
   * `"official"`. See {@link CifControlMode}.
   * @see SPEC.md#cif-3
   */
  cifControl?: CifControlMode;
  /**
   * Reject the placeholder numbers `00000000T`, `00000001R`, `99999999R`
   * and `X0000000T` (default `false`). They are valid documents, so they
   * are accepted by default; ESNIC filters them as obviously fake.
   * @see SPEC.md#policy-1
   */
  rejectPlaceholders?: boolean;
}
