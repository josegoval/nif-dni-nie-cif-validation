/**
 * User-facing error messages of `validate()`, in English and Spanish.
 *
 * Only `validate()` imports this module, so an application that only uses
 * the boolean validators doesn't bundle the messages (the package ships ES
 * modules and CI checks it: scripts/check-tree-shaking.mjs). Messages are
 * keyed by error code and, for the length and format errors, by the SPEC.md
 * rule that failed, so they describe the right document.
 */
import type { NifLocale, NifType } from "./types";

/** SPEC.md rules that `INVALID_LENGTH` can cite. */
export type LengthRule =
  | "DNI-1"
  | "KLM-1"
  | "NIE-1"
  | "NIE-3"
  | "CIF-1"
  | "VAT-1";

/** SPEC.md rules that `INVALID_FORMAT` can cite. */
export type FormatRule =
  | "NIF-1"
  | "VAT-1"
  | "DNI-1"
  | "KLM-1"
  | "KLM-3"
  | "NIE-1"
  | "CIF-1";

/** The messages of one locale. */
export interface Messages {
  NOT_A_STRING: string;
  EMPTY: string;
  INVALID_LENGTH: Record<LengthRule, string>;
  INVALID_FORMAT: Record<FormatRule, string>;
  INVALID_CONTROL_CHARACTER: (type: NifType, expected: string) => string;
  UNSUPPORTED_TYPE: (type: NifType) => string;
  PLACEHOLDER: string;
}

const EN_TYPES: Record<NifType, string> = {
  DNI: "DNI",
  NIF_KLM: "K/L/M NIF",
  NIE: "NIE",
  CIF: "legal entity NIF (CIF)",
};

const ES_TYPES: Record<NifType, string> = {
  DNI: "DNI",
  NIF_KLM: "NIF K/L/M",
  NIE: "NIE",
  CIF: "NIF de persona jurídica (CIF)",
};

const EN: Messages = {
  NOT_A_STRING: "The value must be text.",
  EMPTY: "Enter a NIF, NIE or CIF.",
  INVALID_LENGTH: {
    "DNI-1": "A DNI has 9 characters: 8 digits and a letter.",
    "KLM-1": "A K/L/M NIF has 9 characters: K, L or M, 7 digits and a letter.",
    "NIE-1": "A NIE has 9 characters: X, Y or Z, 7 digits and a letter.",
    "NIE-3": "Only old NIEs have 10 characters: X, a 0, 7 digits and a letter.",
    "CIF-1":
      "A legal entity NIF (CIF) has 9 characters: a letter, 7 digits and a control character.",
    "VAT-1": "A Spanish VAT number is ES followed by a 9-character NIF.",
  },
  INVALID_FORMAT: {
    "NIF-1":
      "This is not a NIF, NIE or CIF: it must start with a digit or a valid letter.",
    "VAT-1": "Enter the NIF without the ES prefix.",
    "DNI-1": "A DNI is 8 digits followed by a letter.",
    "KLM-1": "A K/L/M NIF is K, L or M, 7 digits and a letter.",
    "KLM-3": "The 7 characters after K, L or M must be digits.",
    "NIE-1": "A NIE is X, Y or Z, 7 digits and a letter.",
    "CIF-1":
      "A legal entity NIF (CIF) is a letter, 7 digits and a control character (a digit or a letter).",
  },
  INVALID_CONTROL_CHARACTER: (type, expected) =>
    `The control character is not correct: for this ${EN_TYPES[type]} it should be "${expected}".`,
  UNSUPPORTED_TYPE: (type) => `A ${EN_TYPES[type]} is not accepted here.`,
  PLACEHOLDER: "This number is a known placeholder, not a real document.",
};

const ES: Messages = {
  NOT_A_STRING: "El valor debe ser un texto.",
  EMPTY: "Introduce un NIF, NIE o CIF.",
  INVALID_LENGTH: {
    "DNI-1": "Un DNI tiene 9 caracteres: 8 dígitos y una letra.",
    "KLM-1":
      "Un NIF K/L/M tiene 9 caracteres: K, L o M, 7 dígitos y una letra.",
    "NIE-1": "Un NIE tiene 9 caracteres: X, Y o Z, 7 dígitos y una letra.",
    "NIE-3":
      "Solo los NIE antiguos tienen 10 caracteres: X, un 0, 7 dígitos y una letra.",
    "CIF-1":
      "Un NIF de persona jurídica (CIF) tiene 9 caracteres: una letra, 7 dígitos y un carácter de control.",
    "VAT-1": "Un NIF-IVA español es ES seguido de un NIF de 9 caracteres.",
  },
  INVALID_FORMAT: {
    "NIF-1":
      "No es un NIF, NIE ni CIF: debe empezar por un dígito o por una letra válida.",
    "VAT-1": "Introduce el NIF sin el prefijo ES.",
    "DNI-1": "Un DNI son 8 dígitos seguidos de una letra.",
    "KLM-1": "Un NIF K/L/M es K, L o M, 7 dígitos y una letra.",
    "KLM-3": "Los 7 caracteres que siguen a K, L o M deben ser dígitos.",
    "NIE-1": "Un NIE es X, Y o Z, 7 dígitos y una letra.",
    "CIF-1":
      "Un NIF de persona jurídica (CIF) es una letra, 7 dígitos y un carácter de control (un dígito o una letra).",
  },
  INVALID_CONTROL_CHARACTER: (type, expected) =>
    `El carácter de control no es correcto: para este ${ES_TYPES[type]} debería ser «${expected}».`,
  UNSUPPORTED_TYPE: (type) => `Aquí no se admite un ${ES_TYPES[type]}.`,
  PLACEHOLDER:
    "Este número es un valor de ejemplo conocido, no un documento real.",
};

/** The messages of each locale. */
export const MESSAGES: Record<NifLocale, Messages> = { en: EN, es: ES };
