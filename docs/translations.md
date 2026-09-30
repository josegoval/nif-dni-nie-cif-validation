# Translations

Every text that `validate()` and `describeCifOrganisation()` return lives in a locale object under [`src/locales/`](../src/locales/), one file per language (see [api-design.md](api-design.md), D5). This page records, per language, where each CIF organisation name comes from and which terms the messages use, so a reviewer can check them.

The organisation names describe the organisation keys of Orden EHA/451/2008, arts. 3 to 5 (art. 3 as amended by Orden HAP/5/2016), [SPEC.md CIF-2](../SPEC.md#cif-2). The Order lists them in the plural; every locale gives them in the singular, because `meta.orgDescription` describes one entity.

- **Official**: the wording of an official text in that language, put in the singular. The source is cited in the locale file and below.
- **Translated**: no official version was found; our own translation, marked `// translated (no official version found)` in the locale file.

**Review.** Every language other than English and Spanish gets a second, independent language review (by another model, then ideally a native speaker) before release. Findings are fixed in the locale file and recorded here.

<!-- cspell:disable -->

## English (`en`, built in)

There is no official English version of the Order. All 17 names are **translated**, using the usual English terms for the Spanish legal forms (for example "Public limited company" for *sociedad anónima*, "Temporary joint venture" for *unión temporal de empresas*).

Terminology: "control character", "legal entity NIF (CIF)", "K/L/M NIF".

## Spanish (`es`, `locales/es`)

All 17 names are **official**: the Order's own wording, in the singular. Source: Orden EHA/451/2008, BOE-A-2008-3580, consolidated text: <https://www.boe.es/buscar/act.php?id=BOE-A-2008-3580>.

Terminology: "carácter de control" (the AEAT's term), "NIF de persona jurídica (CIF)", "NIF K/L/M", "NIF-IVA". Informal *tú* imperative ("Introduce"), as most Spanish web forms use.

<!-- cspell:enable -->
