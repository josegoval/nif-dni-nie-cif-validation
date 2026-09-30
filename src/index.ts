export { isValidNif, isValidNaturalPersonNif } from "./nif";
export {
  isValidDniLetter,
  DNI_CONTROL_LETTERS,
  isValidDni,
  DNI_REGEX,
} from "./dni";
export { isValidNie, NIE_REGEX, replaceNieLetter } from "./nie";
export {
  isValidLegalEntityNifControlCode,
  isValidLegalEntityNifControlCode as isValidCifControlCode,
  isValidLegalEntityNif,
  isValidLegalEntityNif as isValidCif,
  LEGAL_ENTITY_CONTROL_LETTERS,
  LEGAL_ENTITY_CONTROL_LETTERS as CIF_CONTROL_LETTERS,
  LEGAL_ENTITY_NIF_REGEX,
  LEGAL_ENTITY_NIF_REGEX as CIF_REGEX,
} from "./cif";
