/**
 * `validate()` and `getNifType()`: the detailed API. Where the boolean
 * validators answer "valid or not" as fast as possible, `validate()` says
 * which document it is, its canonical form, and, when it is invalid, why:
 * an error code, the SPEC.md rule that failed, a message in English or
 * Spanish, and the expected control character.
 *
 * The steps, in order (the first failure wins):
 *
 * 1. INPUT-1: only strings. INPUT-2: not empty after cleanup.
 * 2. NORM-1 to NORM-4 and NIE-3: the canonical form. VAT-1: an `ES`
 *    prefix only with `allowVatPrefix`.
 * 3. NIF-1: the first character selects one format: a digit (DNI-1), K L M
 *    (KLM-1), X Y Z (NIE-1) or an organisation key (CIF-2).
 * 4. That format's length, digits and control position (DNI-1, KLM-1,
 *    KLM-3, NIE-1, NIE-3, CIF-1). From here the type is known.
 * 5. POLICY-2: the caller's `types`.
 * 6. The control character: DNI-2, DNI-3, KLM-2, NIE-2, CIF-3, CIF-4.
 * 7. POLICY-1: placeholders, with `rejectPlaceholders`.
 *
 * Rule IDs refer to SPEC.md.
 */
import {
  cifControlValue,
  cifKeyKind,
  LEGAL_ENTITY_CONTROL_LETTERS,
  LENIENT_KEY_CONTROL,
  LETTER_CONTROL,
  NOT_A_KEY,
} from "./cif";
import { DNI_CONTROL_LETTERS } from "./dni";
import {
  type FormatRule,
  type LengthRule,
  MESSAGES,
  type Messages,
} from "./messages";
import {
  areDigits,
  canonicalize,
  cleanup,
  isUpperLetter,
  upperCase,
} from "./normalize";
import { describeCifOrganisation } from "./organisations";
import { PLACEHOLDERS } from "./policy";
import type {
  GetNifTypeOptions,
  NifLocale,
  NifType,
  NifValidationError,
  ValidateOptions,
  ValidationResult,
} from "./types";

/** Every NIF has 9 characters in canonical form. */
const NIF_LENGTH = 9;

/** SPEC.md rules that `INVALID_CONTROL_CHARACTER` can cite. */
type ControlRule = "DNI-2" | "DNI-3" | "KLM-2" | "NIE-2" | "CIF-3" | "CIF-4";

/** A problem found before the type is known. */
type FormatProblem =
  | { code: "EMPTY"; rule: "INPUT-2" }
  | { code: "INVALID_LENGTH"; rule: LengthRule }
  | { code: "INVALID_FORMAT"; rule: FormatRule };

/** A recognised document, valid or with a wrong control character. */
interface Document {
  type: NifType;
  /** Canonical form. */
  normalized: string;
  /** The control problem, or `null` when the control character is right. */
  control: { rule: ControlRule; expected: string } | null;
}

/** What `inspect` found: a document, or why there is none. */
type Inspection = Document | FormatProblem;

const EMPTY: FormatProblem = { code: "EMPTY", rule: "INPUT-2" };

function lengthProblem(rule: LengthRule): FormatProblem {
  return { code: "INVALID_LENGTH", rule };
}

function formatProblem(rule: FormatRule): FormatProblem {
  return { code: "INVALID_FORMAT", rule };
}

/** NORM-1..3, or NORM-1 only with `normalize: false`. Internal helper. */
export function cleanNif(value: string, normalize: boolean): string {
  return normalize ? cleanup(value) : upperCase(value);
}

/** VAT-1: does the cleaned value start with the `ES` prefix? */
export function hasVatPrefix(clean: string): boolean {
  return clean.charCodeAt(0) === 69 && clean.charCodeAt(1) === 83;
}

/** NIF-1: the type selected by the first character of a canonical value. */
export function typeOf(first: number): NifType | null {
  // DNI-1: a digit.
  if ((first - 48) >>> 0 < 10) return "DNI";
  // KLM-1: K, L or M.
  if ((first - 75) >>> 0 < 3) return "NIF_KLM";
  // NIE-1: X, Y or Z.
  if ((first - 88) >>> 0 < 3) return "NIE";
  // CIF-2: an organisation key.
  if (cifKeyKind(first) !== NOT_A_KEY) return "CIF";
  return null;
}

/** DNI-3: I, Ñ, O and U are never check letters. */
function isNeverACheckLetter(code: number): boolean {
  return code === 73 || code === 0xd1 || code === 79 || code === 85;
}

/**
 * DNI-2, KLM-2, NIE-2: checks the letter of a DNI, K/L/M NIF or NIE whose
 * format is already checked.
 */
function checkLetter(value: string, type: NifType): Document {
  // DNI-2: the 8 digits. KLM-2: the 7 digits only. NIE-2: X -> 0, Y -> 1,
  // Z -> 2, then the 7 digits.
  const first = value.charCodeAt(0);
  let number = type === "DNI" ? first - 48 : type === "NIE" ? first - 88 : 0;
  for (let i = 1; i < 8; i++) number = number * 10 + value.charCodeAt(i) - 48;
  const expected = DNI_CONTROL_LETTERS.charAt(number % 23);
  const code = value.charCodeAt(8);
  if (code === expected.charCodeAt(0))
    return { type, normalized: value, control: null };
  const rule: ControlRule = isNeverACheckLetter(code)
    ? "DNI-3"
    : type === "DNI"
      ? "DNI-2"
      : type === "NIE"
        ? "NIE-2"
        : "KLM-2";
  return { type, normalized: value, control: { rule, expected } };
}

/** CIF-3, CIF-4: checks the control of a legal entity NIF. */
function checkCifControl(value: string, lenient: boolean): Document {
  // CIF-4: the control value; CIF-3: the key decides digit or letter.
  const control = cifControlValue(value);
  const digit = String(control);
  const letter = LEGAL_ENTITY_CONTROL_LETTERS.charAt(control);
  const kind = cifKeyKind(value.charCodeAt(0));
  const either = kind === LENIENT_KEY_CONTROL && lenient;
  const code = value.charCodeAt(8);
  const isDigit = (code - 48) >>> 0 < 10;
  // CIF-3: which class the key accepts: A B E H (and C D F G J U V in
  // official mode) a digit, N P Q R S W a letter; lenient C D F G J U V
  // either.
  const classAccepted =
    either || (isDigit ? kind !== LETTER_CONTROL : kind === LETTER_CONTROL);
  if (classAccepted && code === (isDigit ? digit : letter).charCodeAt(0))
    return { type: "CIF", normalized: value, control: null };
  const expected =
    kind === LETTER_CONTROL || (either && !isDigit) ? letter : digit;
  return {
    type: "CIF",
    normalized: value,
    control: { rule: classAccepted ? "CIF-4" : "CIF-3", expected },
  };
}

/**
 * Parses and checks `value`: everything `validate` needs except the
 * options that only filter the verdict (`types`, `rejectPlaceholders`).
 */
export function inspect(
  value: string,
  normalize: boolean,
  lenient: boolean,
  allowVatPrefix: boolean
): Inspection {
  // NORM-1..3 (or NORM-1 only, as v1 did, with normalize: false).
  let clean = cleanNif(value, normalize);
  // INPUT-2: nothing left.
  if (clean.length === 0) return EMPTY;
  // VAT-1: "ES" + NIF. No NIF starts with "ES" (an E key is followed by a
  // digit), so the prefix is unambiguous.
  if (hasVatPrefix(clean)) {
    if (!allowVatPrefix) return formatProblem("VAT-1");
    clean = clean.slice(2);
    if (clean.length === 0) return lengthProblem("VAT-1");
  }
  // NIE-3 always; NORM-4 only when normalizing.
  const canonical = canonicalize(clean, normalize);
  // NIF-1: the first character selects the format.
  const type = typeOf(canonical.charCodeAt(0));
  if (type === null) return formatProblem("NIF-1");
  if (canonical.length !== NIF_LENGTH) {
    if (type === "DNI") return lengthProblem("DNI-1");
    if (type === "NIF_KLM") return lengthProblem("KLM-1");
    if (type === "CIF") return lengthProblem("CIF-1");
    // NIE-3: only old X0 NIEs have 10 characters.
    return lengthProblem(canonical.length === 10 ? "NIE-3" : "NIE-1");
  }
  const last = canonical.charCodeAt(8);
  if (type === "CIF") {
    // CIF-1: key + 7 digits + a control character (a digit or a letter).
    if (
      !areDigits(canonical, 1, 8) ||
      !((last - 65) >>> 0 < 26 || (last - 48) >>> 0 < 10)
    )
      return formatProblem("CIF-1");
    return checkCifControl(canonical, lenient);
  }
  // DNI-1: 8 digits. KLM-3: 7 digits after K, L or M. NIE-1: 7 digits
  // after X, Y or Z.
  if (!areDigits(canonical, type === "DNI" ? 0 : 1, 8))
    return formatProblem(
      type === "DNI" ? "DNI-1" : type === "NIE" ? "NIE-1" : "KLM-3"
    );
  // DNI-1, KLM-1, NIE-1: the control character is a letter.
  if (!isUpperLetter(last))
    return formatProblem(
      type === "DNI" ? "DNI-1" : type === "NIE" ? "NIE-1" : "KLM-1"
    );
  return checkLetter(canonical, type);
}

const NO_VALIDATE_OPTIONS: ValidateOptions = {};

function invalid(
  type: NifType | null,
  normalized: string | null,
  error: NifValidationError
): ValidationResult {
  return { valid: false, type, normalized, error };
}

/** CIF-2: adds the organisation key and its description to a CIF result. */
function withMeta(
  result: ValidationResult,
  locale: NifLocale
): ValidationResult {
  if (result.type === "CIF") {
    const orgKey = (result.normalized as string).charAt(0);
    result.meta = {
      orgKey,
      orgDescription: describeCifOrganisation(orgKey, locale) as string,
    };
  }
  return result;
}

/**
 * Validates a Spanish NIF (DNI, K/L/M NIF, NIE or legal entity NIF, formerly
 * CIF) and explains the result.
 *
 * - `valid`: whether it is a valid document with these options.
 * - `type`: `"DNI"`, `"NIF_KLM"`, `"NIE"` or `"CIF"`, as soon as the format
 *   is recognisable, even if the control character is wrong.
 * - `normalized`: the canonical form to store (upper case, no separators).
 * - `error`: `code`, the SPEC.md `rule` that failed, a `message` for the
 *   user (English or Spanish), and `expected` (the right control
 *   character) when the control character is wrong.
 * - `meta`: for a CIF, its organisation key and what it means (Orden
 *   EHA/451/2008 arts. 3 to 5), in the requested locale.
 *
 * Defaults follow SPEC.md: the input is normalized (NORM-1 to NORM-4, NIE-3)
 * and CIFs follow CIF-3. Never throws.
 *
 * @param value The value to validate, typically untrusted form input.
 * @param opts `types`, `normalize`, `cifControl`, `rejectPlaceholders`,
 * `allowVatPrefix`, `locale`. See {@link ValidateOptions}.
 * @returns The result; allocated on every call.
 * @example
 * validate("12345678A");
 * // { valid: false, type: "DNI", normalized: "12345678A",
 * //   error: { code: "INVALID_CONTROL_CHARACTER", rule: "DNI-2",
 * //            expected: "Z", message: "The control character is not ..." } }
 * @example
 * validate(" b-1234567-4 ", { locale: "es" });
 * // { valid: true, type: "CIF", normalized: "B12345674",
 * //   meta: { orgKey: "B", orgDescription: "Sociedad de responsabilidad limitada" } }
 * @example
 * validate("G1234567D").error?.rule;                    // "CIF-3"
 * validate("G1234567D", { cifControl: "lenient" }).valid; // true
 * validate("12345678Z", { types: ["CIF"] }).error?.code;  // "UNSUPPORTED_TYPE"
 * @see SPEC.md
 */
export function validate(
  value: unknown,
  opts: ValidateOptions = NO_VALIDATE_OPTIONS
): ValidationResult {
  const locale: NifLocale = opts?.locale === "es" ? "es" : "en";
  const messages = MESSAGES[locale];
  // INPUT-1: only strings, never converted.
  if (typeof value !== "string")
    return invalid(null, null, {
      code: "NOT_A_STRING",
      message: messages.NOT_A_STRING,
      rule: "INPUT-1",
    });
  const found = inspect(
    value,
    opts?.normalize !== false,
    opts?.cifControl === "lenient",
    opts?.allowVatPrefix === true
  );
  if (!("type" in found)) {
    const message =
      found.code === "EMPTY"
        ? messages.EMPTY
        : found.code === "INVALID_LENGTH"
          ? messages.INVALID_LENGTH[found.rule]
          : messages.INVALID_FORMAT[found.rule];
    return invalid(null, null, { code: found.code, message, rule: found.rule });
  }
  return withMeta(check(found, opts, messages), locale);
}

/** Steps 5 to 7 of `validate`, on a recognised document. */
function check(
  found: Document,
  opts: ValidateOptions,
  messages: Messages
): ValidationResult {
  const { type, normalized, control } = found;
  // POLICY-2: the caller accepts only some types.
  const types = opts?.types;
  if (Array.isArray(types) && !types.includes(type))
    return invalid(type, normalized, {
      code: "UNSUPPORTED_TYPE",
      message: messages.UNSUPPORTED_TYPE(type),
      rule: "POLICY-2",
    });
  if (control !== null)
    return invalid(type, normalized, {
      code: "INVALID_CONTROL_CHARACTER",
      message: messages.INVALID_CONTROL_CHARACTER(type, control.expected),
      rule: control.rule,
      expected: control.expected,
    });
  // POLICY-1: placeholders, only when asked.
  if (opts?.rejectPlaceholders === true && PLACEHOLDERS.includes(normalized))
    return invalid(type, normalized, {
      code: "PLACEHOLDER",
      message: messages.PLACEHOLDER,
      rule: "POLICY-1",
    });
  return { valid: true, type, normalized };
}

/**
 * Detects the document type from its format, **without checking the control
 * character**: the type `validate` would report. A non-null result does not
 * mean the document is valid; use `validate` or a boolean for that.
 *
 * Returns `null` when the format isn't recognisable: an unknown first
 * character (NIF-1), the wrong length, non-digits in the number, or a
 * control character of the wrong class. The input is normalized first
 * unless `{ normalize: false }`. An `ES` VAT prefix is accepted only with
 * `{ allowVatPrefix: true }`. Never throws.
 *
 * @param value The value to inspect.
 * @param opts `normalize` (default `true`), `allowVatPrefix` (default
 * `false`).
 * @returns `"DNI"`, `"NIF_KLM"`, `"NIE"`, `"CIF"` or `null`.
 * @example
 * getNifType("12345678Z"); // "DNI"
 * getNifType("12345678A"); // "DNI" (wrong letter, but a DNI's format)
 * getNifType("k1234567l"); // "NIF_KLM"
 * @example
 * getNifType("B1234567D"); // "CIF" (B needs a digit: invalid, but a CIF)
 * getNifType("T1234567A"); // null (no document starts with T, NIF-1)
 * getNifType("123456789"); // null (a DNI ends in a letter, DNI-1)
 * @see SPEC.md#nif-1
 */
export function getNifType(
  value: unknown,
  opts: GetNifTypeOptions = NO_VALIDATE_OPTIONS
): NifType | null {
  if (typeof value !== "string") return null;
  const found = inspect(
    value,
    opts?.normalize !== false,
    false,
    opts?.allowVatPrefix === true
  );
  return "type" in found ? found.type : null;
}
