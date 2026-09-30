/**
 * Spanish (español): `import { es } from "nif-dni-nie-cif-validation/locales/es"`.
 *
 * Terminology: "carácter de control", "NIF de persona jurídica o entidad
 * (CIF)" (Orden EHA/451/2008 covers "personas jurídicas y entidades sin
 * personalidad jurídica"), the AEAT's names for the documents.
 *
 * Organisation names (CIF-2): the wording of Orden EHA/451/2008 arts. 3 to 5
 * (art. 3 as amended by Orden HAP/5/2016), in the singular.
 * Source: https://www.boe.es/buscar/act.php?id=BOE-A-2008-3580
 * See docs/translations.md.
 */
import type { NifLocale, NifType } from "../types";

const TYPES: Record<NifType, string> = {
  DNI: "DNI",
  NIF_KLM: "NIF K/L/M",
  NIE: "NIE",
  CIF: "NIF de persona jurídica o entidad (CIF)",
};

/** Spanish (español). */
export const es: NifLocale = {
  code: "es",
  types: TYPES,
  messages: {
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
        "Un NIF de persona jurídica o entidad (CIF) tiene 9 caracteres: una letra, 7 dígitos y un carácter de control.",
      "VAT-1": "Un NIF-IVA español es ES seguido de un NIF de 9 caracteres.",
    },
    INVALID_FORMAT: {
      "NIF-1":
        "No es un NIF, NIE ni CIF: debe empezar por un dígito o por una letra válida.",
      "VAT-1": "Introduce el NIF sin el prefijo ES.",
      "DNI-1": "Un DNI son 8 dígitos seguidos de una letra.",
      "KLM-1":
        "Un NIF K/L/M empieza por K, L o M, seguido de 7 dígitos y una letra.",
      "KLM-3": "Los 7 caracteres que siguen a K, L o M deben ser dígitos.",
      "NIE-1": "Un NIE empieza por X, Y o Z, seguido de 7 dígitos y una letra.",
      "CIF-1":
        "Un NIF de persona jurídica o entidad (CIF) consta de una letra, 7 dígitos y un carácter de control (un dígito o una letra).",
    },
    INVALID_CONTROL_CHARACTER: (type, expected) =>
      `El carácter de control no es correcto: para este ${TYPES[type]} debería ser «${expected}».`,
    UNSUPPORTED_TYPE: (type) => `Aquí no se admite un ${TYPES[type]}.`,
    PLACEHOLDER:
      "Este número figura en la lista de valores de ejemplo que no se admiten aquí.",
  },
  // Official: Orden EHA/451/2008 arts. 3 to 5, in the singular.
  organisations: {
    A: "Sociedad anónima",
    B: "Sociedad de responsabilidad limitada",
    C: "Sociedad colectiva",
    D: "Sociedad comanditaria",
    E: "Comunidad de bienes, herencia yacente u otra entidad carente de personalidad jurídica no incluida expresamente en otras claves",
    F: "Sociedad cooperativa",
    G: "Asociación",
    H: "Comunidad de propietarios en régimen de propiedad horizontal",
    J: "Sociedad civil",
    N: "Entidad extranjera",
    P: "Corporación local",
    Q: "Organismo público",
    R: "Congregación o institución religiosa",
    S: "Órgano de la Administración del Estado o de una comunidad autónoma",
    U: "Unión temporal de empresas",
    V: "Otro tipo no definido en el resto de claves",
    W: "Establecimiento permanente de una entidad no residente en territorio español",
  },
};

export default es;
