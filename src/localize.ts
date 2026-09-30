/**
 * Picks a text from the caller's locale, or from English.
 *
 * Languages are locale objects (src/locales/), passed to `validate()` and
 * `describeCifOrganisation()` by the caller. English is the only one this
 * module imports, so a bundle contains only the languages the application
 * imports itself (scripts/check-tree-shaking.mjs checks it).
 *
 * Only `validate()` and `describeCifOrganisation()` import this module, so
 * the boolean validators don't bundle any text.
 */
import { en } from "./locales/en";
import type { NifLocale } from "./types";

/**
 * Returns `pick(locale)` when `locale` is an object that gives a non-empty
 * string for it, and `pick(en)` otherwise. So the default (`undefined`), a
 * language code string such as `"es"` (pre-release docs) and a locale
 * object that lacks the text or whose message function throws (plain
 * JavaScript) all give English. Never throws.
 */
export function localize(
  locale: unknown,
  pick: (locale: NifLocale) => string
): string {
  if (typeof locale === "object" && locale !== null && locale !== en) {
    try {
      const text = pick(locale as NifLocale);
      if (typeof text === "string" && text !== "") return text;
    } catch {
      // A malformed locale object: English below.
    }
  }
  return pick(en);
}
