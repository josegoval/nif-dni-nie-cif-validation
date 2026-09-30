/**
 * Catalan (català), also for Valencian (valencià):
 * `import { ca } from "nif-dni-nie-cif-validation/locales/ca"`.
 *
 * Terminology: "caràcter de control"; "NIF", "NIE";
 * "NIF d'entitat (CIF)"; "xifra" for a digit. The user is
 * addressed with "vós" ("Introduïu"), as Catalan software usually does.
 *
 * Organisation names (CIF-2): official. The AEAT's Catalan page on the NIF
 * of legal persons and entities lists the keys of Orden EHA/451/2008 arts. 3 to 5 (as
 * amended by Orden HAP/5/2016); the names below are its wording in the
 * singular. Its Valencian page uses the same names.
 * Source: https://sede.agenciatributaria.gob.es/Sede/ca_es/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/anexos/anexo-01-solicitud-nif-documentacion-aportar/informacion-sobre-numero-identificacion-fiscal/composicion-nif/personas-juridicas-entidades.html
 * See docs/translations.md.
 */
import type { NifLocale, NifType } from "../types";

const TYPES: Record<NifType, string> = {
  DNI: "DNI",
  NIF_KLM: "NIF K/L/M",
  NIE: "NIE",
  CIF: "NIF d'entitat (CIF)",
};

/** Catalan (català), also for Valencian. */
export const ca: NifLocale = {
  code: "ca",
  types: TYPES,
  messages: {
    NOT_A_STRING: "El valor ha de ser un text.",
    EMPTY: "Introduïu un NIF, NIE o CIF.",
    INVALID_LENGTH: {
      "DNI-1": "Un DNI té 9 caràcters: 8 xifres i una lletra.",
      "KLM-1": "Un NIF K/L/M té 9 caràcters: K, L o M, 7 xifres i una lletra.",
      "NIE-1": "Un NIE té 9 caràcters: X, Y o Z, 7 xifres i una lletra.",
      "NIE-3":
        "Només els NIE antics tenen 10 caràcters: X, un 0, 7 xifres i una lletra.",
      "CIF-1":
        "Un NIF d'entitat (CIF) té 9 caràcters: una lletra, 7 xifres i un caràcter de control.",
      "VAT-1": "Un NIF-IVA espanyol és ES seguit d'un NIF de 9 caràcters.",
    },
    INVALID_FORMAT: {
      "NIF-1":
        "No és un NIF, NIE ni CIF: ha de començar per una xifra o per una lletra vàlida.",
      "VAT-1": "Introduïu el NIF sense el prefix ES.",
      "DNI-1": "Un DNI són 8 xifres seguides d'una lletra.",
      "KLM-1":
        "Un NIF K/L/M comença per K, L o M, seguida de 7 xifres i una lletra.",
      "KLM-3":
        "Els 7 caràcters que segueixen la K, la L o la M han de ser xifres.",
      "NIE-1": "Un NIE comença per X, Y o Z, seguida de 7 xifres i una lletra.",
      "CIF-1":
        "Un NIF d'entitat (CIF) consta d'una lletra, 7 xifres i un caràcter de control (una xifra o una lletra).",
    },
    INVALID_CONTROL_CHARACTER: (type, expected) =>
      `El caràcter de control no és correcte: per a aquest ${TYPES[type]} hauria de ser «${expected}».`,
    UNSUPPORTED_TYPE: (type) => `Aquí no s'admet cap ${TYPES[type]}.`,
    PLACEHOLDER:
      "Aquest número figura a la llista de valors d'exemple que no s'admeten aquí.",
  },
  // Official: the AEAT's Catalan page (source above), in the singular.
  organisations: {
    A: "Societat anònima",
    B: "Societat de responsabilitat limitada",
    C: "Societat col·lectiva",
    D: "Societat comanditària",
    // The AEAT writes "entitats mancats" (sic); the agreement is fixed here.
    E: "Comunitat de béns, herència jacent o una altra entitat mancada de personalitat jurídica no inclosa expressament en altres claus",
    F: "Societat cooperativa",
    G: "Associació",
    H: "Comunitat de propietaris en règim de propietat horitzontal",
    J: "Societat civil",
    N: "Entitat estrangera",
    P: "Corporació local",
    Q: "Organisme públic",
    R: "Congregació o institució religiosa",
    S: "Òrgan de l'Administració de l'Estat o d'una comunitat autònoma",
    U: "Unió temporal d'empreses",
    V: "Un altre tipus no definit a la resta de claus",
    W: "Establiment permanent d'una entitat no resident en territori espanyol",
  },
};

export default ca;
