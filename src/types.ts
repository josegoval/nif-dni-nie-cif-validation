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
 * `validate()` and `getNifType()` report it.
 */
export type NifType = "DNI" | "NIE" | "CIF" | "NIF_KLM";

/**
 * Why `validate()` rejected a value. See `docs/api-design.md` for the
 * SPEC.md rule that goes with each case.
 *
 * - `"NOT_A_STRING"`: the value is not a string (INPUT-1).
 * - `"EMPTY"`: the value is empty, or only separators (INPUT-2).
 * - `"INVALID_LENGTH"`: the wrong number of characters.
 * - `"INVALID_FORMAT"`: the wrong characters for the document (for
 *   example letters in the number part), or an unknown first character.
 * - `"INVALID_CONTROL_CHARACTER"`: the format is right, the control
 *   character is not; `error.expected` has the right one.
 * - `"UNSUPPORTED_TYPE"`: a document of a type not in `options.types`
 *   (POLICY-2).
 * - `"PLACEHOLDER"`: a placeholder number, with `rejectPlaceholders`
 *   (POLICY-1).
 */
export type NifErrorCode =
  | "NOT_A_STRING"
  | "EMPTY"
  | "INVALID_LENGTH"
  | "INVALID_FORMAT"
  | "INVALID_CONTROL_CHARACTER"
  | "UNSUPPORTED_TYPE"
  | "PLACEHOLDER";

/** Language of the messages: English (the default) or Spanish. */
export type NifLocale = "en" | "es";

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
 * Options of `validate()`. Every option is optional and defaults to the
 * official behaviour.
 */
export interface ValidateOptions {
  /**
   * Accept only these document types. A valid document of another type
   * gives `UNSUPPORTED_TYPE` (POLICY-2). Default: every type.
   * @see SPEC.md#policy-2
   */
  types?: NifType[];
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
  /**
   * Accept a Spanish VAT number, `ES` + NIF, as well as a bare NIF
   * (default `false`). `normalized` is always the NIF, without `ES`.
   * @see SPEC.md#vat-1
   */
  allowVatPrefix?: boolean;
  /** Language of `error.message` (default `"en"`). */
  locale?: NifLocale;
}

/**
 * Options of the boolean validators (`isValidNif` and the others): the
 * options of `validate()` that change the verdict.
 */
export type IsValidOptions = Pick<
  ValidateOptions,
  "normalize" | "cifControl" | "rejectPlaceholders"
>;

/** Options of `getNifType()`: the options that change what is parsed. */
export type GetNifTypeOptions = Pick<
  ValidateOptions,
  "normalize" | "allowVatPrefix"
>;

/** Why a value is invalid. */
export interface NifValidationError {
  /** What went wrong. */
  code: NifErrorCode;
  /** A message for the user, in the requested locale. */
  message: string;
  /** The SPEC.md rule ID that failed, for example `"DNI-2"`. */
  rule: string;
  /**
   * The correct control character, only with
   * `INVALID_CONTROL_CHARACTER`.
   */
  expected?: string;
}

/**
 * What the organisation key of a legal entity NIF (CIF) says about the
 * entity (Orden EHA/451/2008 arts. 3 to 5, as amended by Orden HAP/5/2016).
 */
export interface CifOrganisationMeta {
  /** The organisation key, for example `"B"`. */
  orgKey: string;
  /**
   * Its description in the requested locale, for example
   * `"Limited liability company"` / `"Sociedad de responsabilidad
   * limitada"`.
   */
  orgDescription: string;
}

/** The result of `validate()`. */
export interface ValidationResult {
  /** Whether the value is a valid document (with the given options). */
  valid: boolean;
  /**
   * The document type, as soon as the format is recognisable, even if the
   * control character is wrong. `null` otherwise.
   */
  type: NifType | null;
  /**
   * The canonical official form (upper case, no separators, old NIE form
   * collapsed, short DNI padded, no `ES` VAT prefix), when the format is
   * recognisable. `null` otherwise.
   */
  normalized: string | null;
  /** Why the value is invalid; absent when it is valid. */
  error?: NifValidationError;
  /**
   * For a legal entity NIF (CIF) only, whenever `type` is `"CIF"` (valid
   * or not): its organisation key and what it means.
   * @see SPEC.md#cif-2
   */
  meta?: CifOrganisationMeta;
}
