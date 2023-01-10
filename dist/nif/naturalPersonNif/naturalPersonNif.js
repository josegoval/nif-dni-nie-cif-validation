"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidNaturalPersonNif = void 0;
const dni_1 = require("./dni");
const nie_1 = require("./nie");
/**
 * Checks if the given naturalPersonNif is whether a valid DNI (including DNI K, L and M) or a valid NIE.
 * @param naturalPersonNif
 * @returns true for valid input and false for invalid input.
 */
function isValidNaturalPersonNif(naturalPersonNif) {
    return (0, dni_1.isValidDni)(naturalPersonNif) || (0, nie_1.isValidNie)(naturalPersonNif);
}
exports.isValidNaturalPersonNif = isValidNaturalPersonNif;
