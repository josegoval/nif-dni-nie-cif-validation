// Facts about SPEC.md, read from the file at build time, and the links to
// its rules. The site renders SPEC.md as its official sources page
// (plugins/official-sources.mjs), so the site's own rule links point there,
// in the page's language, with SPEC.md's own anchors (`#cif-3`).
import spec from "../../../SPEC.md?raw";
import { type Lang, localePath } from "../i18n";

/** SPEC.md on GitHub. */
export const SPEC_URL =
  "https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md";

/** The number of rules in SPEC.md: each has an anchor such as `dni-1`. */
export const ruleCount = new Set(
  [...spec.matchAll(/<a id="([a-z]+-\d+)"><\/a>/g)].map((m) => m[1])
).size;

/** The official sources page of a language: SPEC.md, rendered. */
export const officialSourcesUrl = (lang: Lang) =>
  localePath(lang, "reference/official-sources/");

/** The link to one rule on the official sources page, for example `DNI-2`. */
export const ruleUrl = (lang: Lang, rule: string) =>
  `${officialSourcesUrl(lang)}#${rule.toLowerCase()}`;
