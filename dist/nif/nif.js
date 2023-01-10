"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidNif = void 0;
const legalEntityNif_1 = require("./legalEntityNif/legalEntityNif");
const naturalPersonNif_1 = require("./naturalPersonNif/naturalPersonNif");
/**
 * Checks if the given nif (legal entity NIF or natural person NIF
 * (DNI, DNI K, DNI L, DNI M, or NIE)) is valid.
 *
 * @param nif
 * @returns true for valid input and false for invalid input.
 */
function isValidNif(nif) {
    return (0, naturalPersonNif_1.isValidNaturalPersonNif)(nif) || (0, legalEntityNif_1.isValidLegalEntityNif)(nif);
}
exports.isValidNif = isValidNif;
