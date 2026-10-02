// The package's own locale object for each language of the site, for the
// pages that show the package's texts (messages, organisation names) at
// build time. The live validator imports only its page's locale instead.
import type { NifLocale } from "nif-dni-nie-cif-validation";
import { ca } from "nif-dni-nie-cif-validation/locales/ca";
import { en } from "nif-dni-nie-cif-validation/locales/en";
import { es } from "nif-dni-nie-cif-validation/locales/es";
import { eu } from "nif-dni-nie-cif-validation/locales/eu";
import { gl } from "nif-dni-nie-cif-validation/locales/gl";
import type { Lang } from "../i18n";

const LOCALES: Record<Lang, NifLocale> = { en, es, ca, eu, gl };

export const localeFor = (lang: Lang): NifLocale => LOCALES[lang];
