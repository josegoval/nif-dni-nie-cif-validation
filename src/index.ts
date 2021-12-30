export { isValidNif } from "./nif/nif";
export { isValidNaturalPersonNif } from "./nif/naturalPersonNif/naturalPersonNif";
export {
  isValidDniLetter,
  DNI_CONTROL_LETTERS,
} from "./nif/naturalPersonNif/shared";
export { isValidDni, DNI_REGEX } from "./nif/naturalPersonNif/dni";
export {
  isValidNie,
  NIE_REGEX,
  replaceNieLetter,
} from "./nif/naturalPersonNif/nie";
export {
  isValidLegalEntityNifControlCode,
  isValidLegalEntityNif,
  LEGAL_ENTITY_CONTROL_LETTERS,
  LEGAL_ENTITY_NIF_REGEX,
} from "./nif/legalEntityNif/legalEntityNif";
