"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidNie = exports.replaceNieLetter = exports.NIE_REGEX = void 0;
const shared_1 = require("./shared");
exports.NIE_REGEX = /^[XYZ][\d]{7}[TRWAGMYFPDXBNJZSQVHLCKET]$/i;
/**
 * Returns a new string with the nie letter (XYZ) replaced.
 * However it will throw an error if the first character is not X, Y or Z.
 * @throws Invalid NIE letter error
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
 * @param nie
 * @returns true for valid input and false for invalid input.
 */
function isValidNie(nie) {
    return exports.NIE_REGEX.test(nie) && (0, shared_1.isValidDniLetter)(replaceNieLetter(nie));
}
exports.isValidNie = isValidNie;
