"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NIE_REGEX = void 0;
exports.isValidNineCharNie = isValidNineCharNie;
exports.isValidOldNie = isValidOldNie;
exports.replaceNieLetter = replaceNieLetter;
exports.isValidNie = isValidNie;
/**
 * NIE: Número de Identidad de Extranjero, the ID number of foreigners, which
 * is also their NIF.
 *
 * Format:
 * - NIE-1: X, Y or Z + 7 digits + a check letter: `X1234567L` (Orden
 *   INT/2058/2008). After the X series ran out, Y came next, then Z.
 * - NIE-3: old 10-character NIEs, X + 8 digits + letter, stay valid. Their
 *   canonical form drops the zero right after the X: `X01234567L` is
 *   `X1234567L`.
 *
 * Check letter:
 * - NIE-2: X -> 0, Y -> 1, Z -> 2, then the DNI-2 letter of the resulting
 *   8-digit number (Ministerio del Interior; AEAT D.I.T. note).
 * - NORM-1: a lower-case ASCII letter is accepted too (convention).
 *
 * Rule IDs refer to SPEC.md.
 */
const dni_1 = require("./dni");
const shared_1 = require("./shared");
/**
 * Pattern of a NIE. It does not check the control letter.
 *
 * - NIE-1: X, Y or Z + 7 digits + check letter (for example `X1234567L`).
 * - NIE-3 (Orden INT/2058/2008, transitional provision; AEAT): old
 *   10-character NIEs, `X` + `0` + 7 digits + check letter (for example
 *   `X01234567L`), are still valid. Only for X: Y and Z came later.
 *
 * Kept as a public constant for v1 compatibility; `isValidNie` doesn't use it.
 */
exports.NIE_REGEX = /^(?:X0?|[YZ])[\d]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
const NIE_LENGTH = 9;
const OLD_NIE_LENGTH = 10;
/**
 * NIE-2 value of a NIE prefix (X -> 0, Y -> 1, Z -> 2, either case), or a
 * number outside 0-2 for anything else.
 */
function niePrefixValue(code) {
    return (0, shared_1.toUpperAsciiLetter)(code) - 88;
}
/**
 * Checks a 9-character NIE. Internal helper: the caller has checked that
 * `nie` is a 9-character string, and passes the UTF-16 code of its first
 * character.
 */
function isValidNineCharNie(nie, first) {
    // NIE-1: X, Y or Z + 7 digits + letter. NIE-2: the prefix counts as its
    // digit (X -> 0, Y -> 1, Z -> 2), then DNI-2.
    const prefix = niePrefixValue(first);
    return prefix >>> 0 < 3 && (0, dni_1.hasDniDigitsAndLetter)(nie, 1, prefix);
}
/**
 * NIE-3: checks an old 10-character NIE, `X` + `0` + 7 digits + letter. The
 * canonical form drops the zero right after the X, and X counts as 0 (NIE-2),
 * so only the 7 digits count. Internal helper; the caller checks the length.
 */
function isValidOldNie(nie) {
    return (niePrefixValue(nie.charCodeAt(0)) === 0 &&
        nie.charCodeAt(1) === 48 &&
        (0, dni_1.hasDniDigitsAndLetter)(nie, 2, 0));
}
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
    const nieLetter = nie.charAt(0).toUpperCase();
    if (nieLetter === "X")
        return 0 + nie.substring(1);
    if (nieLetter === "Y")
        return 1 + nie.substring(1);
    if (nieLetter === "Z")
        return 2 + nie.substring(1);
    throw new Error("Invalid NIE letter");
}
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
    const length = nie.length;
    // NIE-1 / NIE-2.
    if (length === NIE_LENGTH)
        return isValidNineCharNie(nie, nie.charCodeAt(0));
    // NIE-3: old 10-character form.
    return length === OLD_NIE_LENGTH && isValidOldNie(nie);
}
