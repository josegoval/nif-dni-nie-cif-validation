"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidNaturalPersonNif = isValidNaturalPersonNif;
exports.isValidNif = isValidNif;
/**
 * NIF: Número de Identificación Fiscal, the Spanish tax ID (RD 1065/2007
 * arts. 18-22). Every person or entity has one:
 *
 * - natural persons: a DNI, a K/L/M NIF (see dni.ts) or a NIE (see nie.ts);
 * - legal entities: a legal entity NIF, formerly CIF (see cif.ts).
 *
 * All of them have 9 characters, except old 10-character NIEs (NIE-3). The
 * first character tells them apart: a digit (DNI-1), K L M (KLM-1), X Y Z
 * (NIE-1) or an organisation key (CIF-2). These never overlap, so only one
 * format is ever checked.
 *
 * Rule IDs refer to SPEC.md.
 */
const cif_1 = require("./cif");
const dni_1 = require("./dni");
const nie_1 = require("./nie");
/** DNI, K/L/M, NIE and CIF all have 9 characters. */
const NIF_LENGTH = 9;
/** NIE-3: old NIEs, `X0` + 7 digits + letter. */
const OLD_NIE_LENGTH = 10;
/**
 * Checks if the given naturalPersonNif is either a valid DNI (including DNI K, L and M) or a valid NIE.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param naturalPersonNif The value to check.
 * @returns true for valid input and false for invalid input.
 */
function isValidNaturalPersonNif(naturalPersonNif) {
    if (typeof naturalPersonNif !== "string")
        return false;
    const length = naturalPersonNif.length;
    if (length === NIF_LENGTH) {
        const first = naturalPersonNif.charCodeAt(0);
        // DNI-1 / KLM-1 or NIE-1: the first character decides the format.
        return ((0, dni_1.isValidNineCharDni)(naturalPersonNif, first) ||
            (0, nie_1.isValidNineCharNie)(naturalPersonNif, first));
    }
    // NIE-3: old 10-character NIE.
    return length === OLD_NIE_LENGTH && (0, nie_1.isValidOldNie)(naturalPersonNif);
}
/**
 * Checks if the given nif (legal entity NIF or natural person NIF
 * (DNI, DNI K, DNI L, DNI M, or NIE)) is valid.
 *
 * Never throws. Typed `string`, but any other value (e.g. `null`) returns `false`.
 * @param nif The value to check.
 * @returns true for valid input and false for invalid input.
 */
function isValidNif(nif) {
    if (typeof nif !== "string")
        return false;
    const length = nif.length;
    if (length === NIF_LENGTH) {
        const first = nif.charCodeAt(0);
        // CIF-2: the organisation keys never overlap with the natural person
        // prefixes (digits, K L M, X Y Z), so the first character picks one
        // format and only that one is checked.
        const kind = (0, cif_1.cifKeyKind)(first);
        if (kind !== cif_1.NOT_A_KEY)
            return (0, cif_1.hasValidCifDigitsAndControl)(nif, kind);
        return (0, dni_1.isValidNineCharDni)(nif, first) || (0, nie_1.isValidNineCharNie)(nif, first);
    }
    // NIE-3: old 10-character NIE.
    return length === OLD_NIE_LENGTH && (0, nie_1.isValidOldNie)(nif);
}
