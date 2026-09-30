/**
 * Basque (euskara):
 * `import { eu } from "nif-dni-nie-cif-validation/locales/eu"`.
 *
 * Terminology: the Basque names of the documents, as the AEAT's Basque
 * pages and the Basque administrations use them: "IFZ" for NIF
 * ("identifikazio fiskaleko zenbakia"); "NAN" for DNI; "AIZ" for NIE;
 * "IFK" for the old CIF; "IFZ-BEZ" for the VAT number.
 * Also "kontrol-karakterea" and "digitu". Instructions use the bare
 * imperative ("Sartu"), as Basque software does.
 *
 * Organisation names (CIF-2): official. Bizkaia's Decreto Foral 205/2008,
 * art. 32, repeats the organisation keys of Orden EHA/451/2008 arts. 3 to 5
 * (as amended by Orden HAP/5/2016) in its official Basque text; the names
 * below are its wording in the singular. No Basque version of the Order
 * itself was found.
 * Source: https://www.bizkaia.eus/documents/880307/15187815/eu_205_2008_2024.pdf
 * See docs/translations.md.
 */
import type { NifLocale, NifType } from "../types";

const TYPES: Record<NifType, string> = {
  DNI: "NAN",
  NIF_KLM: "K/L/M IFZ",
  NIE: "AIZ",
  CIF: "pertsona juridikoaren IFZ (IFK)",
};

/** Basque (euskara). */
export const eu: NifLocale = {
  code: "eu",
  types: TYPES,
  messages: {
    NOT_A_STRING: "Balioak testua izan behar du.",
    EMPTY: "Sartu IFZ, AIZ edo IFK bat.",
    INVALID_LENGTH: {
      "DNI-1": "NAN batek 9 karaktere ditu: 8 digitu eta letra bat.",
      "KLM-1":
        "K/L/M IFZ batek 9 karaktere ditu: K, L edo M, 7 digitu eta letra bat.",
      "NIE-1":
        "AIZ batek 9 karaktere ditu: X, Y edo Z, 7 digitu eta letra bat.",
      "NIE-3":
        "AIZ zaharrek bakarrik dituzte 10 karaktere: X, 0 bat, 7 digitu eta letra bat.",
      "CIF-1":
        "Pertsona juridikoaren IFZ (IFK) batek 9 karaktere ditu: letra bat, 7 digitu eta kontrol-karaktere bat.",
      "VAT-1":
        "Espainiako IFZ-BEZ bat ES da, eta ondoren 9 karaktereko IFZ bat.",
    },
    INVALID_FORMAT: {
      "NIF-1":
        "Hau ez da IFZ, AIZ edo IFK bat: digitu batekin edo letra baliodun batekin hasi behar du.",
      "VAT-1": "Sartu IFZa ES aurrizkirik gabe.",
      "DNI-1": "NAN bat 8 digitu eta ondoren letra bat da.",
      "KLM-1": "K/L/M IFZ bat K, L edo M, 7 digitu eta letra bat da.",
      "KLM-3":
        "K, L edo M letraren ondorengo 7 karaktereek digituak izan behar dute.",
      "NIE-1": "AIZ bat X, Y edo Z, 7 digitu eta letra bat da.",
      "CIF-1":
        "Pertsona juridikoaren IFZ (IFK) bat letra bat, 7 digitu eta kontrol-karaktere bat (digitu bat edo letra bat) da.",
    },
    INVALID_CONTROL_CHARACTER: (type, expected) =>
      `Kontrol-karakterea ez da zuzena: ${TYPES[type]} honetan «${expected}» izan beharko luke.`,
    UNSUPPORTED_TYPE: (type) =>
      `Hemen ez da onartzen dokumentu mota hau: ${TYPES[type]}.`,
    PLACEHOLDER:
      "Zenbaki hau adibide-balio ezagun bat da, ez benetako dokumentu bat.",
  },
  // Official: Bizkaia's Decreto Foral 205/2008, art. 32 (source above), in
  // the singular.
  organisations: {
    A: "Sozietate anonimoa",
    B: "Erantzukizun mugatuko sozietatea",
    C: "Sozietate kolektiboa",
    D: "Sozietate komanditarioa",
    E: "Ondasun-erkidegoa, jaraunspen jasogabea edo bestelako gakoetan berariaz jasota ez dagoen nortasun juridikorik gabeko beste erakunde bat",
    F: "Sozietate kooperatiboa",
    G: "Elkartea",
    H: "Jabetza horizontalaren araubideko jabeen erkidegoa",
    J: "Sozietate zibila",
    // Art. 32.2 says the letter N marks the entity as foreign.
    N: "Atzerriko erakundea",
    P: "Toki korporazioa",
    Q: "Erakunde publikoa",
    R: "Kongregazio edo erakunde erlijiosoa",
    S: "Estatuaren Administrazioko edo autonomia-erkidego bateko organoa",
    U: "Aldi baterako enpresa-elkartea",
    V: "Beste gakoetan definitu ez den mota",
    // Art. 32.3.
    W: "Espainiako lurraldeko egoiliar ez den erakunde baten establezimendu iraunkorra",
  },
};

export default eu;
