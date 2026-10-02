/**
 * English: the default language of `validate()` and
 * `describeCifOrganisation()`, built in. Also importable as
 * `nif-dni-nie-cif-validation/locales/en`, to switch languages at runtime.
 *
 * Organisation names (CIF-2): English translations of Orden EHA/451/2008
 * arts. 3 to 5 (art. 3 as amended by Orden HAP/5/2016), in the singular.
 * There is no official English version. See docs/translations.md.
 */
import type { NifLocale, NifType } from "../types";

const TYPES: Record<NifType, string> = {
  DNI: "DNI",
  NIF_KLM: "K/L/M NIF",
  NIE: "NIE",
  CIF: "NIF of a legal person or entity (CIF)",
};

/**
 * English (the default language, built in):
 * a locale for `validate()` and `describeCifOrganisation()`, with the error
 * messages, the names of the document types and the names of the CIF
 * organisation keys. Import it from `nif-dni-nie-cif-validation/locales/en` and
 * pass it as `locale`.
 * @example
 * import { validate } from "nif-dni-nie-cif-validation";
 * import { en } from "nif-dni-nie-cif-validation/locales/en";
 *
 * validate("12345678A", { locale: en }).error?.message;
 * // 'The control character is not correct: for this DNI it should be "Z".'
 * @example
 * import { describeCifOrganisation } from "nif-dni-nie-cif-validation";
 * import { en } from "nif-dni-nie-cif-validation/locales/en";
 *
 * describeCifOrganisation("B", en); // "Limited liability company"
 * en.code; // "en"
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/docs/translations.md docs/translations.md}
 * @since 2.0.0
 */
export const en: NifLocale = {
  code: "en",
  types: TYPES,
  messages: {
    NOT_A_STRING: "The value must be text.",
    EMPTY: "Enter a NIF, NIE or CIF.",
    INVALID_LENGTH: {
      "DNI-1": "A DNI has 9 characters: 8 digits and a letter.",
      "KLM-1":
        "A K/L/M NIF has 9 characters: K, L or M, 7 digits and a letter.",
      "NIE-1": "An NIE has 9 characters: X, Y or Z, 7 digits and a letter.",
      "NIE-3":
        "Only old NIEs have 10 characters: X, a 0, 7 digits and a letter.",
      "CIF-1":
        "A NIF of a legal person or entity (CIF) has 9 characters: a letter, 7 digits and a control character.",
      "VAT-1": "A Spanish VAT number is ES followed by a 9-character NIF.",
    },
    INVALID_FORMAT: {
      "NIF-1":
        "This is not a NIF, NIE or CIF: it must start with a digit or a valid letter.",
      "VAT-1": "Enter the NIF without the ES prefix.",
      "DNI-1": "A DNI is 8 digits followed by a letter.",
      "KLM-1":
        "A K/L/M NIF starts with K, L or M, followed by 7 digits and a letter.",
      "KLM-3": "The 7 characters after K, L or M must be digits.",
      "NIE-1":
        "An NIE starts with X, Y or Z, followed by 7 digits and a letter.",
      "CIF-1":
        "A NIF of a legal person or entity (CIF) consists of a letter, 7 digits and a control character (a digit or a letter).",
    },
    INVALID_CONTROL_CHARACTER: (type, expected) =>
      `The control character is not correct: for this ${TYPES[type]} it should be "${expected}".`,
    UNSUPPORTED_TYPE: (type) => `This ${TYPES[type]} is not accepted here.`,
    PLACEHOLDER:
      "This number is on the list of known placeholder values, which are not accepted here.",
  },
  organisations: {
    A: "Public limited company",
    B: "Limited liability company",
    C: "General partnership",
    D: "Limited partnership",
    E: "Community of property, estate in abeyance or other entity without legal personality not covered by another key",
    F: "Cooperative society",
    G: "Association",
    H: "Community of owners under a horizontal property regime",
    J: "Civil partnership",
    N: "Foreign entity",
    P: "Local authority",
    Q: "Public body",
    R: "Religious congregation or institution",
    S: "Body of the State administration or of an autonomous community",
    U: "Temporary joint venture",
    V: "Other type not covered by another key",
    W: "Permanent establishment of an entity not resident in Spain",
  },
};

export default en;
