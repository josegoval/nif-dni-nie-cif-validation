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
