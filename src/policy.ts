/**
 * Opt-in policies: rules with no official basis that only apply when the
 * caller asks for them (SPEC.md, "Opt-in policies").
 *
 * - POLICY-1: placeholder numbers, valid by default, rejected with
 *   `rejectPlaceholders: true`.
 *
 * Rule IDs refer to SPEC.md.
 */
import { normalize } from "./normalize";
import type { IsValidOptions } from "./types";

/**
 * POLICY-1: numbers that are valid documents but obviously fake. ESNIC (the
 * .es registry) filters them; no law forbids them. Canonical forms.
 */
export const PLACEHOLDERS: readonly string[] = [
  "00000000T",
  "00000001R",
  "99999999R",
  "X0000000T",
];

/**
 * POLICY-1: is `value`, a document that already passed validation (in any
 * accepted form: lower case, old NIE form, separators), a placeholder?
 */
export function isPlaceholder(value: string): boolean {
  return PLACEHOLDERS.includes(normalize(value));
}

/**
 * The final verdict of a boolean validator on a value that passed its
 * checks: `true`, unless the caller rejects placeholders (POLICY-1) and
 * this is one. Reads `opts` defensively, like the other options.
 */
export function acceptsValid(
  value: string,
  opts: IsValidOptions | null
): boolean {
  return opts?.rejectPlaceholders !== true || !isPlaceholder(value);
}

/** POLICY-1: the placeholder 99999999R, by its number. */
const LAST_DNI_NUMBER = 99999999;

/**
 * POLICY-1 for the boolean validators, without `normalize`: is `doc`, a
 * document that passed a raw check (so it has no separator, but it may be
 * in lower case, lack the leading zeros of a DNI, NORM-4, or be an old NIE,
 * NIE-3), a placeholder? A valid document's check letter follows from its
 * number, so the number decides.
 */
export function isPlaceholderDocument(doc: string): boolean {
  const first = doc.charCodeAt(0);
  // 00000000T, 00000001R and 99999999R. Before the letter a valid DNI has
  // only ASCII digits, which `Number()` reads exactly.
  if ((first - 48) >>> 0 < 10) {
    const number = Number(doc.slice(0, -1));
    return number < 2 || number === LAST_DNI_NUMBER;
  }
  // X0000000T, also in its old form X00000000T (x in lower case too).
  return (first | 32) === 120 && Number(doc.slice(1, -1)) === 0;
}

/**
 * The answer of a boolean validator for `doc`, a document that passed its
 * raw check: `true`, unless the caller rejects placeholders (POLICY-1) and
 * this is one. Only then is the number read.
 */
export function acceptsDocument(
  doc: string,
  opts: IsValidOptions | null
): boolean {
  return opts?.rejectPlaceholders !== true || !isPlaceholderDocument(doc);
}
