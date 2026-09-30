/**
 * Pattern of a NIE. It does not check the control letter.
 *
 * - NIE-1: X, Y or Z + 7 digits + check letter (for example `X1234567L`).
 * - NIE-3 (Orden INT/2058/2008, transitional provision; AEAT): old
 *   10-character NIEs, `X` + `0` + 7 digits + check letter (for example
 *   `X01234567L`), are still valid. Only for X: Y and Z came later.
 */
export declare const NIE_REGEX: RegExp;
/**
 * Returns a new string with the nie letter (XYZ) replaced by its digit
 * (X -> 0, Y -> 1, Z -> 2, see NIE-2). The first character is compared
 * case-insensitively; the rest of the string is returned unchanged.
 *
 * Unlike the `isValid*` functions, this function throws.
 * @deprecated Kept for v1 compatibility. It will be removed or made
 * non-throwing in v2. Use `isValidNie` to validate a NIE.
 * @throws {Error} `Invalid NIE letter` if the first character is not X, Y
 * or Z (including the empty string).
 * @throws {TypeError} If `nie` is not a string (for example `null`,
 * `undefined` or a number).
 * @param nie
 * @returns A new string with the nie letter (XYZ) replaced.
 */
export declare function replaceNieLetter(nie: string): string;
/**
 * Checks if the given nie is valid.
 *
 * Also accepts the old 10-character form `X0nnnnnnnL` (NIE-3), which is
 * validated as its canonical form `XnnnnnnnL` (for example `X01234567L`
 * validates as `X1234567L`).
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param nie The value to check.
 * @returns true for valid input and false for invalid input.
 */
export declare function isValidNie(nie: string): boolean;
