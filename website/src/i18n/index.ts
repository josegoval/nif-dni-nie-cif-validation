import { ca } from "./ca";
import { en } from "./en";
import { es } from "./es";
import { eu } from "./eu";
import { gl } from "./gl";
import type { SiteStrings } from "./types";

/** The site's languages, as in the `lang` of each Starlight locale. */
export const LANGS = ["en", "es", "ca", "eu", "gl"] as const;
export type Lang = (typeof LANGS)[number];

const STRINGS: Record<Lang, SiteStrings> = { en, es, ca, eu, gl };

export const isLang = (value: string): value is Lang =>
  (LANGS as readonly string[]).includes(value);

/** The language of a Starlight page (`Astro.locals.starlightRoute.lang`). */
export function langOf(lang: string): Lang {
  if (!isLang(lang)) throw new Error(`No texts for the language "${lang}"`);
  return lang;
}

export const stringsFor = (lang: Lang): SiteStrings => STRINGS[lang];

/** A path of the site in a language: `/`, `/es/`, `/es/benchmarks/`… */
export function localePath(lang: Lang, path = ""): string {
  const prefix = lang === "en" ? "" : `${lang}/`;
  return `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}${prefix}${path}`;
}

// The site's English uses British conventions, like the rest of the docs.
const intlLocale = (lang: Lang) => (lang === "en" ? "en-GB" : lang);

/**
 * A number in the language's format. `floor` never rounds up, for figures
 * such as a minimum speed-up that must not be overstated.
 */
export function formatNumber(
  lang: Lang,
  value: number,
  digits = 0,
  mode: "round" | "floor" = "round"
): string {
  const factor = 10 ** digits;
  const rounded =
    mode === "floor"
      ? Math.floor(value * factor) / factor
      : Math.round(value * factor) / factor;
  return new Intl.NumberFormat(intlLocale(lang), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(rounded);
}

/** A list in the language's format: "a, b and c". */
export function formatList(lang: Lang, items: string[]): string {
  return new Intl.ListFormat(intlLocale(lang), { type: "conjunction" }).format(
    items
  );
}
