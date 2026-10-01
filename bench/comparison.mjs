// The feature comparison of the Spanish ID libraries of the benchmark: one
// row per library (`id` in results/latest.json), in display order. It is the
// single source of the comparison table of the READMEs
// (scripts/readme-bench.mjs) and of the comparison page of the website
// (website/src/components/docs/FeatureMatrix.astro); the versions, the sizes
// and the links come from latest.json.
//
// A cell is either text that reads the same in every language ("ESM + CJS",
// "DNI, NIE") or `{ phrase }`, a phrase that each consumer translates, from
// PHRASES below. `released` may also be `{ phrase, date }`.
//
// Update CHECKED_ON whenever you check the rows again against each library's
// README, package.json and npm page.

export const CHECKED_ON = "2026-10-01";

/** Every phrase a cell can use. Consumers translate each one. */
export const PHRASES = /** @type {const} */ ([
  "yes",
  "no",
  "partial",
  "optIn",
  "separateNormalize",
  "resultCodeRuleMessage",
  "resultTypeOnly",
  "resultErrorClass",
  "resultParseWithoutReason",
  "resultValidityCountry",
  "englishOnly",
  "typesStdnum",
  "typesJsvat",
  "cjsUmdOnly",
  "cjsOnly",
  "esmDeepImportsCjs",
  "thisRelease",
  "deprecatedOn",
]);

/** @typedef {(typeof PHRASES)[number]} Phrase */
/** @typedef {string | { phrase: Phrase, date?: string }} Cell */
/**
 * @typedef {object} ComparisonRow
 * @property {string} id
 * @property {Cell} types
 * @property {Cell} klm
 * @property {Cell} normalizes
 * @property {Cell} result
 * @property {Cell} messages
 * @property {Cell} generators
 * @property {Cell} schemas
 * @property {Cell} modules
 * @property {Cell} released
 */

const yes = { phrase: "yes" };
const no = { phrase: "no" };
const partial = { phrase: "partial" };
const ESM_CJS = "ESM + CJS";

/** @type {ComparisonRow[]} */
export const COMPARISON = [
  {
    id: "current",
    types: "DNI, NIE, CIF, K/L/M",
    klm: yes,
    normalizes: yes,
    result: { phrase: "resultCodeRuleMessage" },
    messages: "EN, ES, CA, EU, GL",
    generators: yes,
    schemas: "Zod, Valibot, Yup",
    modules: ESM_CJS,
    released: { phrase: "thisRelease" },
  },
  {
    id: "spain-id",
    types: "DNI, NIE, CIF",
    klm: no,
    normalizes: partial,
    result: { phrase: "resultTypeOnly" },
    messages: no,
    generators: no,
    schemas: no,
    modules: ESM_CJS,
    released: "2026-06-12",
  },
  {
    id: "better-dni",
    types: "DNI, NIE",
    klm: no,
    normalizes: { phrase: "separateNormalize" },
    result: no,
    messages: no,
    generators: yes,
    schemas: no,
    modules: { phrase: "cjsUmdOnly" },
    released: "2021-05-30",
  },
  {
    id: "dni-js",
    types: "DNI, NIE",
    klm: no,
    normalizes: partial,
    result: no,
    messages: no,
    generators: no,
    schemas: no,
    modules: { phrase: "cjsOnly" },
    released: "2026-08-08",
  },
  {
    id: "stdnum",
    types: { phrase: "typesStdnum" },
    klm: yes,
    normalizes: yes,
    result: { phrase: "resultErrorClass" },
    messages: { phrase: "englishOnly" },
    generators: no,
    schemas: no,
    modules: ESM_CJS,
    released: "2026-08-01",
  },
  {
    id: "validator-identity-card",
    types: "DNI, NIE",
    klm: no,
    normalizes: no,
    result: no,
    messages: no,
    generators: no,
    schemas: no,
    modules: { phrase: "esmDeepImportsCjs" },
    released: "2026-04-02",
  },
  {
    id: "validator-tax-id",
    types: "DNI, NIE, K/L/M",
    klm: yes,
    normalizes: no,
    result: no,
    messages: no,
    generators: no,
    schemas: no,
    modules: { phrase: "esmDeepImportsCjs" },
    released: "2026-04-02",
  },
  {
    id: "maistik",
    types: "DNI, NIE, CIF",
    klm: no,
    normalizes: partial,
    result: { phrase: "resultParseWithoutReason" },
    messages: no,
    generators: no,
    schemas: no,
    modules: ESM_CJS,
    released: "2026-06-14",
  },
  {
    id: "kreyo",
    types: "DNI, NIE, CIF",
    klm: { phrase: "optIn" },
    normalizes: partial,
    result: no,
    messages: no,
    generators: no,
    schemas: no,
    modules: ESM_CJS,
    released: "2026-04-29",
  },
  {
    id: "jsvat",
    types: { phrase: "typesJsvat" },
    klm: yes,
    normalizes: yes,
    result: { phrase: "resultValidityCountry" },
    messages: no,
    generators: no,
    schemas: no,
    modules: ESM_CJS,
    released: { phrase: "deprecatedOn", date: "2024-12-12" },
  },
];

/** The feature columns of a row, in display order (all but `id`). */
export const FEATURES = /** @type {const} */ ([
  "types",
  "klm",
  "normalizes",
  "result",
  "messages",
  "generators",
  "schemas",
  "modules",
  "released",
]);

/**
 * The text of a cell in one language. `phrases` maps every phrase to its
 * text; `{date}` in it stands for the cell's date.
 *
 * @param {Cell} cell
 * @param {Record<Phrase, string>} phrases
 * @returns {string}
 */
export function cellText(cell, phrases) {
  if (typeof cell === "string") return cell;
  const text = phrases[cell.phrase];
  if (typeof text !== "string") {
    throw new Error(`No text for the comparison phrase "${cell.phrase}"`);
  }
  return text.replace("{date}", cell.date ?? "");
}
