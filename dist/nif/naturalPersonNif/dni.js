"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidDni = exports.DNI_REGEX = void 0;
const shared_1 = require("./shared");
exports.DNI_REGEX = /^([KLM][\d]{7}|[\d]{8})[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
/**
 * Checks if the given dni is valid.
 *
 * It does include checks for DNI K, L and M.
 * @param dni
 * @returns true for valid input and false for invalid input.
 */
function isValidDni(dni) {
    return exports.DNI_REGEX.test(dni) && (0, shared_1.isValidDniLetter)(dni);
}
exports.isValidDni = isValidDni;
