"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidNie = exports.replaceNieLetter = exports.NIE_REGEX = void 0;
const shared_1 = require("./shared");
/**
 * Pattern of a NIE. It does not check the control letter.
 *
 * - NIE-1: X, Y or Z + 7 digits + check letter (for example `X1234567L`).
 * - NIE-3 (Orden INT/2058/2008, transitional provision; AEAT): old
 *   10-character NIEs, `X` + `0` + 7 digits + check letter (for example
 *   `X01234567L`), are still valid. Only for X: Y and Z came later.
 */
exports.NIE_REGEX = /^(?:X0?|[YZ])[\d]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
const OLD_NIE_LENGTH = 10;
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
function replaceNieLetter(nie) {
    let nieLetter = nie.charAt(0).toUpperCase();
    if (nieLetter === "X")
        return 0 + nie.substring(1);
    if (nieLetter === "Y")
        return 1 + nie.substring(1);
    if (nieLetter === "Z")
        return 2 + nie.substring(1);
    throw new Error("Invalid NIE letter");
}
exports.replaceNieLetter = replaceNieLetter;
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
function isValidNie(nie) {
    if (typeof nie !== "string")
        return false;
    // NIE-1 / NIE-3. The /i regex runs on the raw input: without the `u` flag
    // it only folds ASCII letters, so look-alikes that toUpperCase() maps to
    // ASCII (U+0131 "ı" -> "I", U+017F "ſ" -> "S") stay invalid.
    if (!exports.NIE_REGEX.test(nie))
        return false;
    // NORM-1: accept lower-case input. Upper-case once, check that value.
    const upperNie = nie.toUpperCase();
    // NIE-3: the canonical form drops the zero right after the X.
    const canonicalNie = upperNie.length === OLD_NIE_LENGTH
        ? upperNie[0] + upperNie.slice(2)
        : upperNie;
    // NIE-2: X -> 0, Y -> 1, Z -> 2, then DNI-2.
    return (0, shared_1.hasValidDniLetter)(replaceNieLetter(canonicalNie));
}
exports.isValidNie = isValidNie;
