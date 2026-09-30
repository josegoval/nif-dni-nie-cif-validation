/**
 * `format()` and `computeControlCharacter()`: display a valid document in
 * its parts, and complete a document without its control character.
 *
 * Rule IDs refer to SPEC.md.
 */
import {
  cifControlValue,
  cifKeyKind,
  LEGAL_ENTITY_CONTROL_LETTERS,
  LETTER_CONTROL,
} from "./cif";
import { DNI_CONTROL_LETTERS } from "./dni";
import { areDigits, cleanup } from "./normalize";
import { inspect, typeOf } from "./validate";

/** Options of `format()`. */
export interface FormatOptions {
  /** What goes between the parts: `"-"` (default), `" "` or `""`. */
  separator?: "-" | " " | "";
}

const NO_FORMAT_OPTIONS: FormatOptions = {};

/**
 * Formats a valid document in its parts, joined by a separator (default
 * `"-"`), or returns `null` if it is not valid with the default options of
 * `validate` (normalized input, official CIF control):
 *
 * - DNI: 8 digits, check letter: `12345678-Z` (DNI-1).
 * - NIE and K/L/M NIF: prefix, 7 digits, check letter: `X-1234567-L`,
 *   `K-1234567-L` (NIE-1, KLM-1).
 * - CIF: organisation key, 7 digits, control: `B-1234567-4` (CIF-1).
 *
 * No official grouping exists; this one follows the parts the rules
 * define. `separator: ""` gives the canonical form; any other separator
 * value falls back to `"-"`. It never adds an `ES` VAT prefix, and never
 * throws.
 *
 * @param value The document to format.
 * @param opts `separator`.
 * @returns The formatted document, or `null`.
 * @example
 * format("12345678z");                   // "12345678-Z"
 * format(" x01234567l ");                // "X-1234567-L"
 * @example
 * format("b12345674", { separator: " " }); // "B 1234567 4"
 * format("12345678A");                   // null (wrong letter)
 * @see SPEC.md#dni-1
 * @see SPEC.md#cif-1
 */
export function format(
  value: unknown,
  opts: FormatOptions = NO_FORMAT_OPTIONS
): string | null {
  if (typeof value !== "string") return null;
  const found = inspect(value, true, false, false);
  if (!("control" in found) || found.control !== null) return null;
  const separator = opts?.separator;
  const sep = separator === " " || separator === "" ? separator : "-";
  const s = found.normalized;
  // DNI-1: 8 digits + letter.
  if (found.type === "DNI") return s.slice(0, 8) + sep + s.charAt(8);
  // KLM-1, NIE-1, CIF-1: prefix or key + 7 digits + control.
  return s.charAt(0) + sep + s.slice(1, 8) + sep + s.charAt(8);
}

/**
 * Returns the control character that completes a document written without
 * it, or `null` if the input is not such a partial document:
 *
 * - 1 to 8 digits: the DNI letter (DNI-2), after left-padding to 8 digits
 *   (NORM-4). `"12345678"` gives `"Z"`.
 * - K, L or M + 7 digits: the letter over the 7 digits (KLM-2).
 * - X, Y or Z + 7 digits, or the old `X0` + 7 digits: the NIE letter
 *   (NIE-2, NIE-3).
 * - An organisation key + 7 digits: the official control (CIF-3 decides a
 *   digit or a letter, CIF-4 its value). C D F G J U V get a digit.
 *
 * The input is cleaned first (NORM-1 to NORM-3). By construction, the
 * partial document followed by the result always validates. Never throws.
 *
 * @param partial A document without its control character.
 * @returns The control character, or `null`.
 * @example
 * computeControlCharacter("12345678"); // "Z"
 * computeControlCharacter("X1234567"); // "L"
 * computeControlCharacter("K1234567"); // "L"
 * @example
 * computeControlCharacter("B1234567"); // "4" (B takes a digit)
 * computeControlCharacter("P2807900"); // "B" (P takes a letter)
 * computeControlCharacter("T1234567"); // null (NIF-1)
 * @see SPEC.md#dni-2
 * @see SPEC.md#cif-3
 */
export function computeControlCharacter(partial: unknown): string | null {
  if (typeof partial !== "string") return null;
  let s = cleanup(partial);
  const length = s.length;
  // DNI-2 over 1 to 8 digits (NORM-4: a shorter number is zero-padded,
  // which doesn't change its value).
  if (length > 0 && areDigits(s, 0, length))
    return length > 8 ? null : DNI_CONTROL_LETTERS.charAt(Number(s) % 23);
  // NIE-3: X0 + 7 digits is X + 7 digits.
  if (length === 9 && s.charCodeAt(0) === 88 && s.charCodeAt(1) === 48)
    s = `X${s.slice(2)}`;
  if (s.length !== 8 || !areDigits(s, 1, 8)) return null;
  const first = s.charCodeAt(0);
  const type = typeOf(first);
  if (type === "CIF") {
    // CIF-4: the value; CIF-3: N P Q R S W a letter, the rest a digit.
    const control = cifControlValue(`${s}0`);
    return cifKeyKind(first) === LETTER_CONTROL
      ? LEGAL_ENTITY_CONTROL_LETTERS.charAt(control)
      : String(control);
  }
  // KLM-2: the 7 digits only. NIE-2: X -> 0, Y -> 1, Z -> 2.
  if (type === "NIF_KLM" || type === "NIE") {
    const prefix = type === "NIE" ? (first - 88) * 1e7 : 0;
    return DNI_CONTROL_LETTERS.charAt((prefix + Number(s.slice(1))) % 23);
  }
  return null;
}
