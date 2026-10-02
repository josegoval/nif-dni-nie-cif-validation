/**
 * Internal helpers shared by the validators. Nothing here is exported from
 * the package entry point.
 *
 * The validators read the input with `charCodeAt`, one UTF-16 code unit at a
 * time, and never build new strings on their hot path.
 */
import type { IsValidOptions } from "./types";

/**
 * Upper-cases the UTF-16 code of an ASCII letter (`a`-`z`, `A`-`Z`) and
 * returns -1 for anything else. Internal helper.
 *
 * `code & ~32` clears the lower-case bit, but only after the range check:
 * non-ASCII look-alikes that `toUpperCase()` maps to ASCII (U+0131 "ı" -> "I",
 * U+017F "ſ" -> "S") must stay invalid (NORM-1 accepts lower-case ASCII only).
 */
export function toUpperAsciiLetter(code: number): number {
  return ((code | 32) - 97) >>> 0 < 26 ? code & ~32 : -1;
}

/**
 * Default options of the boolean validators, shared so that a call without
 * options allocates nothing.
 */
export const NO_OPTIONS: IsValidOptions = {};

/**
 * CIF-3: does the caller accept either a letter or a digit for C D F G J U V
 * (`cifControl: "lenient"`)? `opts` comes from the caller and may be `null`
 * or even a number (`array.filter(isValidNif)` passes the index), so it is
 * read defensively.
 */
export function isLenientCif(opts: IsValidOptions | null): boolean {
  return opts?.cifControl === "lenient";
}
