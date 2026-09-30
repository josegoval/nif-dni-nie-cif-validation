/**
 * Internal helpers shared by the validators. Nothing here is exported from
 * the package entry point.
 *
 * The validators read the input with `charCodeAt`, one UTF-16 code unit at a
 * time, and never build new strings on their hot path.
 */
/**
 * Upper-cases the UTF-16 code of an ASCII letter (`a`-`z`, `A`-`Z`) and
 * returns -1 for anything else. Internal helper.
 *
 * `code & ~32` clears the lower-case bit, but only after the range check:
 * non-ASCII look-alikes that `toUpperCase()` maps to ASCII (U+0131 "ı" -> "I",
 * U+017F "ſ" -> "S") must stay invalid (NORM-1 accepts lower-case ASCII only).
 */
export declare function toUpperAsciiLetter(code: number): number;
