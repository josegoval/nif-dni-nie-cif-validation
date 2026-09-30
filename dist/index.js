"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CIF_REGEX = exports.LEGAL_ENTITY_NIF_REGEX = exports.CIF_CONTROL_LETTERS = exports.LEGAL_ENTITY_CONTROL_LETTERS = exports.isValidCif = exports.isValidLegalEntityNif = exports.isValidCifControlCode = exports.isValidLegalEntityNifControlCode = exports.replaceNieLetter = exports.NIE_REGEX = exports.isValidNie = exports.DNI_REGEX = exports.isValidDni = exports.DNI_CONTROL_LETTERS = exports.isValidDniLetter = exports.isValidNaturalPersonNif = exports.isValidNif = void 0;
/**
 * Entry point of `nif-dni-nie-cif-validation`: validators for Spanish NIF,
 * DNI, K/L/M, NIE and legal entity NIF (CIF) numbers.
 *
 * The export names are the public API: keep them stable. Every rule the
 * validators apply has an ID in SPEC.md, cited in the modules below:
 *
 * - nif.ts: any NIF (isValidNif) and natural persons (isValidNaturalPersonNif).
 * - dni.ts: DNI and K/L/M NIF.
 * - nie.ts: NIE.
 * - cif.ts: legal entity NIF (formerly CIF).
 */
var nif_1 = require("./nif");
Object.defineProperty(exports, "isValidNif", { enumerable: true, get: function () { return nif_1.isValidNif; } });
Object.defineProperty(exports, "isValidNaturalPersonNif", { enumerable: true, get: function () { return nif_1.isValidNaturalPersonNif; } });
var dni_1 = require("./dni");
Object.defineProperty(exports, "isValidDniLetter", { enumerable: true, get: function () { return dni_1.isValidDniLetter; } });
Object.defineProperty(exports, "DNI_CONTROL_LETTERS", { enumerable: true, get: function () { return dni_1.DNI_CONTROL_LETTERS; } });
Object.defineProperty(exports, "isValidDni", { enumerable: true, get: function () { return dni_1.isValidDni; } });
Object.defineProperty(exports, "DNI_REGEX", { enumerable: true, get: function () { return dni_1.DNI_REGEX; } });
var nie_1 = require("./nie");
Object.defineProperty(exports, "isValidNie", { enumerable: true, get: function () { return nie_1.isValidNie; } });
Object.defineProperty(exports, "NIE_REGEX", { enumerable: true, get: function () { return nie_1.NIE_REGEX; } });
Object.defineProperty(exports, "replaceNieLetter", { enumerable: true, get: function () { return nie_1.replaceNieLetter; } });
var cif_1 = require("./cif");
Object.defineProperty(exports, "isValidLegalEntityNifControlCode", { enumerable: true, get: function () { return cif_1.isValidLegalEntityNifControlCode; } });
Object.defineProperty(exports, "isValidCifControlCode", { enumerable: true, get: function () { return cif_1.isValidLegalEntityNifControlCode; } });
Object.defineProperty(exports, "isValidLegalEntityNif", { enumerable: true, get: function () { return cif_1.isValidLegalEntityNif; } });
Object.defineProperty(exports, "isValidCif", { enumerable: true, get: function () { return cif_1.isValidLegalEntityNif; } });
Object.defineProperty(exports, "LEGAL_ENTITY_CONTROL_LETTERS", { enumerable: true, get: function () { return cif_1.LEGAL_ENTITY_CONTROL_LETTERS; } });
Object.defineProperty(exports, "CIF_CONTROL_LETTERS", { enumerable: true, get: function () { return cif_1.LEGAL_ENTITY_CONTROL_LETTERS; } });
Object.defineProperty(exports, "LEGAL_ENTITY_NIF_REGEX", { enumerable: true, get: function () { return cif_1.LEGAL_ENTITY_NIF_REGEX; } });
Object.defineProperty(exports, "CIF_REGEX", { enumerable: true, get: function () { return cif_1.LEGAL_ENTITY_NIF_REGEX; } });
