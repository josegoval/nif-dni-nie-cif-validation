/**
 * Galician (galego):
 * `import { gl } from "nif-dni-nie-cif-validation/locales/gl"`.
 *
 * Terminology: "carácter de control"; "NIF", "NIE";
 * "NIF de entidade (CIF)"; "díxito"; "NIF-IVE" for the VAT number
 * (the AEAT's Galician term). The user is addressed formally
 * ("Introduza"), as Galician software and the Xunta usually do.
 *
 * Organisation names (CIF-2): official. The AEAT's Galician page on the
 * NIF of legal persons and entities lists the keys of Orden EHA/451/2008 arts. 3 to 5
 * (as amended by Orden HAP/5/2016); the names below are its wording in the
 * singular.
 * Source: https://sede.agenciatributaria.gob.es/Sede/gl_es/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/anexos/anexo-01-solicitud-nif-documentacion-aportar/informacion-sobre-numero-identificacion-fiscal/composicion-nif/personas-juridicas-entidades.html
 * See docs/translations.md.
 */
import type { NifLocale, NifType } from "../types";

const TYPES: Record<NifType, string> = {
  DNI: "DNI",
  NIF_KLM: "NIF K/L/M",
  NIE: "NIE",
  CIF: "NIF de entidade (CIF)",
};

/** Galician (galego). */
export const gl: NifLocale = {
  code: "gl",
  types: TYPES,
  messages: {
    NOT_A_STRING: "O valor debe ser un texto.",
    EMPTY: "Introduza un NIF, NIE ou CIF.",
    INVALID_LENGTH: {
      "DNI-1": "Un DNI ten 9 caracteres: 8 díxitos e unha letra.",
      "KLM-1":
        "Un NIF K/L/M ten 9 caracteres: K, L ou M, 7 díxitos e unha letra.",
      "NIE-1": "Un NIE ten 9 caracteres: X, Y ou Z, 7 díxitos e unha letra.",
      "NIE-3":
        "Só os NIE antigos teñen 10 caracteres: X, un 0, 7 díxitos e unha letra.",
      "CIF-1":
        "Un NIF de entidade (CIF) ten 9 caracteres: unha letra, 7 díxitos e un carácter de control.",
      "VAT-1": "Un NIF-IVE español é ES seguido dun NIF de 9 caracteres.",
    },
    INVALID_FORMAT: {
      "NIF-1":
        "Non é un NIF, NIE nin CIF: debe comezar por un díxito ou por unha letra válida.",
      "VAT-1": "Introduza o NIF sen o prefixo ES.",
      "DNI-1": "Un DNI son 8 díxitos seguidos dunha letra.",
      "KLM-1":
        "Un NIF K/L/M comeza por K, L ou M, seguido de 7 díxitos e unha letra.",
      "KLM-3": "Os 7 caracteres que seguen a K, L ou M deben ser díxitos.",
      "NIE-1":
        "Un NIE comeza por X, Y ou Z, seguido de 7 díxitos e unha letra.",
      "CIF-1":
        "Un NIF de entidade (CIF) consta dunha letra, 7 díxitos e un carácter de control (un díxito ou unha letra).",
    },
    INVALID_CONTROL_CHARACTER: (type, expected) =>
      `O carácter de control non é correcto: para este ${TYPES[type]} debería ser «${expected}».`,
    UNSUPPORTED_TYPE: (type) => `Aquí non se admite ningún ${TYPES[type]}.`,
    PLACEHOLDER:
      "Este número figura na lista de valores de exemplo que non se admiten aquí.",
  },
  // Official: the AEAT's Galician page (source above), in the singular.
  organisations: {
    A: "Sociedade anónima",
    B: "Sociedade de responsabilidade limitada",
    C: "Sociedade colectiva",
    D: "Sociedade comanditaria",
    E: "Comunidade de bens, herdanza xacente ou outra entidade carente de personalidade xurídica non incluída expresamente noutras claves",
    F: "Sociedade cooperativa",
    G: "Asociación",
    H: "Comunidade de propietarios en réxime de propiedade horizontal",
    J: "Sociedade civil",
    N: "Entidade estranxeira",
    P: "Corporación local",
    Q: "Organismo público",
    R: "Congregación ou institución relixiosa",
    S: "Órgano da Administración do Estado ou dunha comunidade autónoma",
    U: "Unión temporal de empresas",
    V: "Outro tipo non definido no resto de claves",
    W: "Establecemento permanente dunha entidade non residente en territorio español",
  },
};

export default gl;
