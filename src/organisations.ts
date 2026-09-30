/**
 * What the organisation key (the first letter) of a legal entity NIF (CIF)
 * says about the entity, in English and Spanish.
 *
 * Source: Orden EHA/451/2008 arts. 3 to 5 (CIF-2), art. 3 as amended by
 * Orden HAP/5/2016 (in force 2016-01-16). The Spanish texts are the Order's
 * wording in the singular; the English texts translate them.
 *
 * Only `validate()` (for `meta`) and `describeCifOrganisation()` import
 * this module, so the boolean validators don't bundle the descriptions.
 */
import { toUpperAsciiLetter } from "./shared";
import type { NifLocale } from "./types";

/** CIF-2: the organisation keys, in the order of the tables below. */
const KEYS = "ABCDEFGHJNPQRSUVW";

const ES: readonly string[] = [
  "Sociedad anónima",
  "Sociedad de responsabilidad limitada",
  "Sociedad colectiva",
  "Sociedad comanditaria",
  "Comunidad de bienes, herencia yacente u otra entidad carente de personalidad jurídica no incluida expresamente en otras claves",
  "Sociedad cooperativa",
  "Asociación",
  "Comunidad de propietarios en régimen de propiedad horizontal",
  "Sociedad civil",
  "Entidad extranjera",
  "Corporación local",
  "Organismo público",
  "Congregación o institución religiosa",
  "Órgano de la Administración del Estado o de una comunidad autónoma",
  "Unión temporal de empresas",
  "Otro tipo no definido en el resto de claves",
  "Establecimiento permanente de una entidad no residente en territorio español",
];

const EN: readonly string[] = [
  "Public limited company",
  "Limited liability company",
  "General partnership",
  "Limited partnership",
  "Community of property, estate in abeyance or other entity without legal personality not covered by another key",
  "Cooperative society",
  "Association",
  "Community of owners under horizontal property",
  "Civil partnership",
  "Foreign entity",
  "Local authority",
  "Public body",
  "Religious congregation or institution",
  "Body of the State administration or of an autonomous community",
  "Temporary joint venture",
  "Other type not covered by another key",
  "Permanent establishment of an entity not resident in Spain",
];

/**
 * Describes the kind of entity that a legal entity NIF (CIF) organisation
 * key stands for, from Orden EHA/451/2008 arts. 3 to 5 (as amended by Orden
 * HAP/5/2016).
 *
 * `key` is one organisation key, in either case (`"B"` or `"b"`). Anything
 * else, including a whole NIF and the natural-person prefixes K L M X Y Z,
 * returns `null`. An unknown `locale` falls back to English. Never throws.
 *
 * @param key One organisation key: A B C D E F G H J N P Q R S U V W.
 * @param locale `"en"` (default) or `"es"`.
 * @returns The description, or `null`.
 * @example
 * describeCifOrganisation("B");       // "Limited liability company"
 * describeCifOrganisation("b", "es"); // "Sociedad de responsabilidad limitada"
 * @example
 * describeCifOrganisation("P", "es"); // "Corporación local"
 * describeCifOrganisation("K");       // null (a natural-person prefix)
 * @see SPEC.md#cif-2
 */
export function describeCifOrganisation(
  key: unknown,
  locale: NifLocale = "en"
): string | null {
  if (typeof key !== "string" || key.length !== 1) return null;
  // CIF-2 (NORM-1: either case, ASCII only).
  const index = KEYS.indexOf(
    String.fromCharCode(toUpperAsciiLetter(key.charCodeAt(0)))
  );
  if (index < 0) return null;
  return (locale === "es" ? ES : EN)[index] as string;
}
