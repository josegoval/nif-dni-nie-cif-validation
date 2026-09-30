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
 * @example
 * validate("X1234567L").type; // "NIE"
 * getNifType("K1234567L");    // "NIF_KLM"
 * @example
 * const accepted: NifType[] = ["DNI", "NIE"];
 * validate("B12345674", { types: accepted }).error?.code; // "UNSUPPORTED_TYPE"
 * @see SPEC.md#nif-1
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
 * @example
 * validate("").error?.code;          // "EMPTY"
 * validate("12345678A").error?.code; // "INVALID_CONTROL_CHARACTER"
 * @example
 * const code: NifErrorCode | undefined = validate(input).error?.code;
 * if (code === "INVALID_CONTROL_CHARACTER") suggestFix();
 * @see SPEC.md
 */
export type NifErrorCode =
  | "NOT_A_STRING"
  | "EMPTY"
  | "INVALID_LENGTH"
  | "INVALID_FORMAT"
  | "INVALID_CONTROL_CHARACTER"
  | "UNSUPPORTED_TYPE"
  | "PLACEHOLDER";

/** SPEC.md rules that an `INVALID_LENGTH` error can cite. */
export type NifLengthRule =
  | "DNI-1"
  | "KLM-1"
  | "NIE-1"
  | "NIE-3"
  | "CIF-1"
  | "VAT-1";

/** SPEC.md rules that an `INVALID_FORMAT` error can cite. */
export type NifFormatRule =
  | "NIF-1"
  | "VAT-1"
  | "DNI-1"
  | "KLM-1"
  | "KLM-3"
  | "NIE-1"
  | "CIF-1";

/**
 * The organisation keys of a legal entity NIF (CIF): its first letter
 * (Orden EHA/451/2008 arts. 3 to 5, as amended by Orden HAP/5/2016).
 * @see SPEC.md#cif-2
 */
export type CifOrganisationKey =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "J"
  | "N"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "U"
  | "V"
  | "W";

/**
 * The error messages of one locale, keyed by error code and, for the length
 * and format errors, by the SPEC.md rule that failed, so they describe the
 * right document. Every message is a full sentence.
 * @see SPEC.md
 */
export interface NifMessages {
  NOT_A_STRING: string;
  EMPTY: string;
  INVALID_LENGTH: Record<NifLengthRule, string>;
  INVALID_FORMAT: Record<NifFormatRule, string>;
  /** Must include `expected`, the right control character. */
  INVALID_CONTROL_CHARACTER: (type: NifType, expected: string) => string;
  UNSUPPORTED_TYPE: (type: NifType) => string;
  PLACEHOLDER: string;
}

/**
 * A language: every text that `validate()` and `describeCifOrganisation()`
 * return. English is built in and is the default. The other languages are
 * separate imports, so a bundle only contains the languages it imports:
 *
 * - `nif-dni-nie-cif-validation/locales/es`: Spanish (`es`)
 * - `nif-dni-nie-cif-validation/locales/ca`: Catalan, also for Valencian (`ca`)
 * - `nif-dni-nie-cif-validation/locales/eu`: Basque (`eu`)
 * - `nif-dni-nie-cif-validation/locales/gl`: Galician (`gl`)
 * - `nif-dni-nie-cif-validation/locales/en`: English (`en`), the default
 *
 * @example
 * import { validate } from "nif-dni-nie-cif-validation";
 * import { es } from "nif-dni-nie-cif-validation/locales/es";
 *
 * validate("12345678A", { locale: es }).error?.message;
 * // 'El carácter de control no es correcto: para este DNI debería ser «Z».'
 * @example
 * import { describeCifOrganisation } from "nif-dni-nie-cif-validation";
 * import { es } from "nif-dni-nie-cif-validation/locales/es";
 *
 * describeCifOrganisation("B", es); // "Sociedad de responsabilidad limitada"
 * @see SPEC.md#cif-2
 */
export interface NifLocale {
  /** The BCP 47 language code, for example `"es"`. */
  code: string;
  /** The name of each document type, as the messages use it. */
  types: Record<NifType, string>;
  /** The error messages. */
  messages: NifMessages;
  /**
   * What each CIF organisation key stands for, in the singular (CIF-2).
   * @see SPEC.md#cif-2
   */
  organisations: Record<CifOrganisationKey, string>;
}

/**
 * Which control characters a legal entity NIF (CIF) may have (CIF-3):
 *
 * - `"official"` (the default): what the AEAT D.I.T. note says. A digit for
 *   A B C D E F G H J U V, a letter for N P Q R S W.
 * - `"lenient"`: C D F G J U V accept a letter or a digit, as v1 did. For
 *   legacy data only: it has no official basis (SPEC.md, "Explicitly NOT
 *   implemented"). The other keys are unchanged.
 *
 * @example
 * isValidCif("G1234567D");                           // false
 * isValidCif("G1234567D", { cifControl: "lenient" }); // true
 * @example
 * isValidCif("B1234567D", { cifControl: "lenient" }); // false: B always takes a digit
 * @see SPEC.md#cif-3
 */
export type CifControlMode = "official" | "lenient";

/**
 * Options of `validate()`. Every option is optional and defaults to the
 * official behaviour.
 * @example
 * import { es } from "nif-dni-nie-cif-validation/locales/es";
 * validate(value, { types: ["DNI", "NIE"], locale: es });
 * @example
 * // v1-compatible parsing, and VAT numbers accepted:
 * validate(value, { normalize: false, cifControl: "lenient", allowVatPrefix: true });
 * @see SPEC.md
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
  /**
   * Language of `error.message` and `meta.orgDescription`: a locale object
   * imported from `nif-dni-nie-cif-validation/locales/<code>` (default:
   * English). See {@link NifLocale}.
   *
   * Anything else is ignored and gives English, without throwing. That
   * includes a language code such as `"es"`, which pre-release versions of
   * the v2 docs showed: import the locale object instead. A locale object
   * that lacks a text (plain JavaScript) gives English for that text.
   */
  locale?: NifLocale;
}

/**
 * Options of the boolean validators (`isValidNif` and the others): the
 * options of `validate()` that change the verdict.
 * @example
 * isValidNif(" 12.345.678-Z ");                      // true (normalized)
 * isValidNif(" 12.345.678-Z ", { normalize: false }); // false, as in v1
 * @example
 * const v1Compatible: IsValidOptions = { normalize: false, cifControl: "lenient" };
 * isValidCif("G1234567D", v1Compatible); // true, as in v1
 * @see SPEC.md#norm-2
 */
export type IsValidOptions = Pick<
  ValidateOptions,
  "normalize" | "cifControl" | "rejectPlaceholders"
>;

/**
 * Options of `getNifType()`: the options that change what is parsed.
 * @example
 * getNifType("ES12345678Z");                           // null
 * getNifType("ES12345678Z", { allowVatPrefix: true }); // "DNI"
 * @example
 * getNifType(" 12345678Z", { normalize: false }); // null: the space is kept
 * @see SPEC.md#nif-1
 */
export type GetNifTypeOptions = Pick<
  ValidateOptions,
  "normalize" | "allowVatPrefix"
>;

/**
 * Why a value is invalid: `validate(value).error`.
 * @example
 * validate("12345678A").error;
 * // { code: "INVALID_CONTROL_CHARACTER", rule: "DNI-2", expected: "Z",
 * //   message: 'The control character is not correct: for this DNI it should be "Z".' }
 * @example
 * validate("T12345678").error;
 * // { code: "INVALID_FORMAT", rule: "NIF-1", message: "This is not a NIF, NIE or CIF: ..." }
 * @see SPEC.md
 */
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
 * @example
 * validate("B12345674").meta;
 * // { orgKey: "B", orgDescription: "Limited liability company" }
 * @example
 * validate("P2807900B", { locale: es }).meta?.orgDescription; // "Corporación local"
 * @see SPEC.md#cif-2
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

/**
 * The result of `validate()`.
 * @example
 * validate(" x-0123456-7l ");
 * // { valid: true, type: "NIE", normalized: "X1234567L" }
 * @example
 * const { valid, normalized, error } = validate(input, { locale: es });
 * if (valid) save(normalized);
 * else showError(error?.message);
 * @see SPEC.md
 */
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
