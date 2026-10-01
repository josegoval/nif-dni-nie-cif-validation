// The code samples of the landing page. They follow the README's samples
// (README.md, which the library's tests run), with the comments in the
// page's language. The results in the comments are computed here, at build
// time, by the package itself, so they can't drift from what it returns.
import {
  isValidNif,
  type NifLocale,
  validate,
} from "nif-dni-nie-cif-validation";
import {
  createGenerator,
  generateCif,
  generateDni,
  generateNie,
} from "nif-dni-nie-cif-validation/generate";
import { ca } from "nif-dni-nie-cif-validation/locales/ca";
import { en } from "nif-dni-nie-cif-validation/locales/en";
import { es } from "nif-dni-nie-cif-validation/locales/es";
import { eu } from "nif-dni-nie-cif-validation/locales/eu";
import { gl } from "nif-dni-nie-cif-validation/locales/gl";
import type { Lang } from "../i18n";
import type { SiteStrings } from "../i18n/types";

const LOCALES: Record<Lang, NifLocale> = { en, es, ca, eu, gl };
const PACKAGE = "nif-dni-nie-cif-validation";

/** Lines of code with a trailing comment, the comments aligned. */
function aligned(lines: [code: string, comment: string][]): string {
  const width = Math.max(...lines.map(([code]) => code.length));
  return lines
    .map(([code, comment]) => `${code.padEnd(width)} // ${comment}`)
    .join("\n");
}

/** A value as it would be written in code: single quotes around `"`. */
const str = (value: unknown) =>
  typeof value === "string" && value.includes('"') && !value.includes("'")
    ? `'${value}'`
    : JSON.stringify(value);
const result = (value: boolean, comment?: string) =>
  comment ? `${value}: ${comment}` : String(value);

export interface Snippets {
  basic: string;
  validate: string;
  zod: string;
  generators: string;
}

export function snippetsFor(lang: Lang, t: SiteStrings["code"]): Snippets {
  const c = t.comments;
  const locale = LOCALES[lang];
  // English is the default: the other languages import and pass a locale.
  const localeImport =
    lang === "en"
      ? ""
      : `import { ${lang} } from "${PACKAGE}/locales/${lang}";\n`;
  const localeOption = lang === "en" ? "" : `, { locale: ${lang} }`;
  const zodLocale = lang === "en" ? "" : `, locale: ${lang}`;

  const basic = [
    `import { isValidNif } from "${PACKAGE}";`,
    "",
    aligned([
      [`isValidNif("12345678Z");`, result(isValidNif("12345678Z"))],
      [
        `isValidNif(" 12.345.678-z ");`,
        result(isValidNif(" 12.345.678-z "), c.normalized),
      ],
      [
        `isValidNif("B12345675");`,
        result(isValidNif("B12345675"), c.wrongControl),
      ],
      [`isValidNif(null);`, result(isValidNif(null), c.neverThrows)],
    ]),
  ].join("\n");

  const valid = validate(" b-1234567-4 ", { locale });
  const invalid = validate("12345678A", { locale });
  const validateSample = [
    `import { validate } from "${PACKAGE}";`,
    `${localeImport}`,
    `validate(" b-1234567-4 "${localeOption});`,
    `// { valid: ${valid.valid}, type: ${str(valid.type)}, normalized: ${str(valid.normalized)},`,
    `//   meta: { orgKey: ${str(valid.meta?.orgKey)}, orgDescription: ${str(valid.meta?.orgDescription)} } }`,
    "",
    `validate("12345678A"${localeOption}).error;`,
    `// { code: ${str(invalid.error?.code)}, rule: ${str(invalid.error?.rule)}, expected: ${str(invalid.error?.expected)},`,
    `//   message: ${str(invalid.error?.message)} }`,
    "",
    aligned([
      [
        `validate(" 12.345.678-z ").normalized;`,
        `${str(validate(" 12.345.678-z ").normalized)}: ${c.storeThis}`,
      ],
    ]),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  const zod = [
    `import { z } from "zod";`,
    `${localeImport}import { zNif } from "${PACKAGE}/zod";`,
    "",
    `const schema = z.object({ nif: zNif({ types: ["DNI", "NIE"]${zodLocale} }) });`,
    "",
    aligned([
      [
        `schema.parse({ nif: " 12.345.678-z " });`,
        `{ nif: ${str(validate(" 12.345.678-z ").normalized)} }`,
      ],
      [
        `schema.safeParse({ nif: "B12345674" }).success;`,
        `false: ${c.cifRejected}`,
      ],
    ]),
  ].join("\n");

  const generator = createGenerator(42);
  const generators = [
    `import { createGenerator, generateCif, generateDni, generateNie } from "${PACKAGE}/generate";`,
    "",
    aligned([
      [
        `generateDni({ seed: 1 });`,
        `${str(generateDni({ seed: 1 }))}: ${c.sameEverywhere}`,
      ],
      [
        `generateNie({ seed: 1, prefix: "Z" });`,
        str(generateNie({ seed: 1, prefix: "Z" })),
      ],
      [
        `generateCif({ seed: 1, orgKey: "B" });`,
        str(generateCif({ seed: 1, orgKey: "B" })),
      ],
      [
        `generateDni({ seed: 1, format: true });`,
        str(generateDni({ seed: 1, format: true })),
      ],
    ]),
    "",
    aligned([
      [`const gen = createGenerator(42);`, c.stream],
      [`gen.nif();`, str(generator.nif())],
      [`gen.nif();`, str(generator.nif())],
    ]),
  ].join("\n");

  return { basic, validate: validateSample, zod, generators };
}
