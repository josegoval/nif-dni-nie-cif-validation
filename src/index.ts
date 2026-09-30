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
export type { NifType } from "./types";
