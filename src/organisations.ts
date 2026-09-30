/**
 * What the organisation key (the first letter) of a legal entity NIF (CIF)
 * says about the entity.
 *
 * Source: Orden EHA/451/2008 arts. 3 to 5 (CIF-2), art. 3 as amended by
 * Orden HAP/5/2016 (in force 2016-01-16). The texts, in the singular, are in
 * each locale (src/locales/); docs/translations.md gives the source of each
 * language.
 *
 * Only `validate()` (for `meta`) and `describeCifOrganisation()` import
 * this module, so the boolean validators don't bundle the descriptions.
 */
import { localize } from "./localize";
import { toUpperAsciiLetter } from "./shared";
import type { CifOrganisationKey, NifLocale } from "./types";

/** CIF-2: the organisation keys. */
const KEYS = "ABCDEFGHJNPQRSUVW";

/**
 * Describes the kind of entity that a legal entity NIF (CIF) organisation
 * key stands for, from Orden EHA/451/2008 arts. 3 to 5 (as amended by Orden
 * HAP/5/2016).
 *
 * `key` is one organisation key, in either case (`"B"` or `"b"`). Anything
 * else, including a whole NIF and the natural-person prefixes K L M X Y Z,
 * returns `null`. `locale` is a locale object from
 * `nif-dni-nie-cif-validation/locales/<code>`; without one, or with
 * anything else (a language code string such as `"es"` included), the
 * description is in English. Never throws.
 *
 * @param key One organisation key: A B C D E F G H J N P Q R S U V W.
 * @param locale A locale object (default: English). See {@link NifLocale}.
 * @returns The description, or `null`.
 * @example
 * describeCifOrganisation("B"); // "Limited liability company"
 * describeCifOrganisation("K"); // null (a natural-person prefix)
 * @example
 * import { es } from "nif-dni-nie-cif-validation/locales/es";
 *
 * describeCifOrganisation("b", es); // "Sociedad de responsabilidad limitada"
 * describeCifOrganisation("P", es); // "Corporación local"
 * @see SPEC.md#cif-2
 */
export function describeCifOrganisation(
  key: unknown,
  locale?: NifLocale
): string | null {
  if (typeof key !== "string" || key.length !== 1) return null;
  // CIF-2 (NORM-1: either case, ASCII only).
  const upper = String.fromCharCode(toUpperAsciiLetter(key.charCodeAt(0)));
  if (KEYS.indexOf(upper) < 0) return null;
  return localize(locale, (l) => l.organisations[upper as CifOrganisationKey]);
}
