"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidNaturalPersonNif = void 0;
const dni_1 = require("./dni");
const nie_1 = require("./nie");
/**
 * Checks if the given naturalPersonNif is whether a valid DNI (including DNI K, L and M) or a valid NIE.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param naturalPersonNif The value to check.
 * @returns true for valid input and false for invalid input.
 */
function isValidNaturalPersonNif(naturalPersonNif) {
    if (typeof naturalPersonNif !== "string")
        return false;
    // NORM-1: each validator upper-cases the input itself. Pass the raw value so
    // their format regexes see it unchanged.
    return (0, dni_1.isValidDni)(naturalPersonNif) || (0, nie_1.isValidNie)(naturalPersonNif);
}
exports.isValidNaturalPersonNif = isValidNaturalPersonNif;
