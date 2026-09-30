"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidDniLetter = exports.hasValidDniLetter = exports.DNI_CONTROL_LETTERS = void 0;
exports.DNI_CONTROL_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
/**
 * Checks the control letter of a value that is already upper case.
 * Internal helper, not exported from the package entry point.
 */
function hasValidDniLetter(dni) {
    // DNI-2: letter = DNI_CONTROL_LETTERS[number mod 23].
    // KLM-2: for K/L/M only the 7 digits count (the prefix is stripped here).
    const letterIndex = +dni.replace(/[^\d]/g, "") % 23;
    const letter = dni.slice(-1);
    return exports.DNI_CONTROL_LETTERS.charAt(letterIndex) === letter;
}
exports.hasValidDniLetter = hasValidDniLetter;
/**
 * Checks if the dni control code (letter) provided is valid.
 *
 * It does include checks for DNI K, L and M.
 * @WARNING It does not check the `DNI_REGEX`.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param dni The value to check.
 * @returns true for valid input and false for invalid input.
 */
function isValidDniLetter(dni) {
    if (typeof dni !== "string")
        return false;
    // NORM-1: accept lower-case input. Upper-case once, check that value.
    return hasValidDniLetter(dni.toUpperCase());
}
exports.isValidDniLetter = isValidDniLetter;
