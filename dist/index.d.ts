export { isValidNif } from "./nif/nif";
export { isValidNaturalPersonNif } from "./nif/naturalPersonNif/naturalPersonNif";
export { isValidDniLetter, DNI_CONTROL_LETTERS, } from "./nif/naturalPersonNif/shared";
export { isValidDni, DNI_REGEX } from "./nif/naturalPersonNif/dni";
export { isValidNie, NIE_REGEX, replaceNieLetter, } from "./nif/naturalPersonNif/nie";
export { isValidLegalEntityNifControlCode, isValidLegalEntityNifControlCode as isValidCifControlCode, isValidLegalEntityNif, isValidLegalEntityNif as isValidCif, LEGAL_ENTITY_CONTROL_LETTERS, LEGAL_ENTITY_CONTROL_LETTERS as CIF_CONTROL_LETTERS, LEGAL_ENTITY_NIF_REGEX, LEGAL_ENTITY_NIF_REGEX as CIF_REGEX, } from "./nif/legalEntityNif/legalEntityNif";
