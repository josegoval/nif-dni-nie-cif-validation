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
 * - normalize.ts: input cleanup (NORM-1 to NORM-4, NIE-3).
 * - policy.ts: opt-in policies (POLICY-1, placeholders).
 * - validate.ts: validate() and getNifType(), the detailed API.
 * - messages.ts: error messages in English and Spanish (validate() only).
 * - organisations.ts: describeCifOrganisation(), the CIF organisation keys.
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
export { normalize } from "./normalize";
export { describeCifOrganisation } from "./organisations";
export { getNifType, validate } from "./validate";
export type {
  CifControlMode,
  CifOrganisationMeta,
  GetNifTypeOptions,
  IsValidOptions,
  NifErrorCode,
  NifLocale,
  NifType,
  NifValidationError,
  ValidateOptions,
  ValidationResult,
} from "./types";
