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

## Catalan (`ca`, `locales/ca`), also for Valencian

The same locale serves Valencian: the AEAT's Valencian page gives the same organisation names as its Catalan page, and the messages use no form that differs between the two standards. An application for Valencian users can pass `ca` (its `code` stays `"ca"`).

All 17 names are **official**: the AEAT's Catalan page on the NIF of legal entities, which lists the keys of the Order (arts. 3 to 5, as amended by Orden HAP/5/2016), put in the singular.

- Source (Catalan): <https://sede.agenciatributaria.gob.es/Sede/ca_es/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/anexos/anexo-01-solicitud-nif-documentacion-aportar/informacion-sobre-numero-identificacion-fiscal/composicion-nif/personas-juridicas-entidades.html>
- Same names in Valencian: the same path under `/Sede/va_es/`.

| Key | Name (singular) | Source |
| --- | --- | --- |
| A | Societat anònima | official (AEAT ca) |
| B | Societat de responsabilitat limitada | official (AEAT ca) |
| C | Societat col·lectiva | official (AEAT ca) |
| D | Societat comanditària | official (AEAT ca) |
| E | Comunitat de béns, herència jacent o una altra entitat mancada de personalitat jurídica no inclosa expressament en altres claus | official (AEAT ca); the AEAT's "entitats mancats" has its agreement fixed ("mancada"), and "unes altres claus" becomes "altres claus" |
| F | Societat cooperativa | official (AEAT ca) |
| G | Associació | official (AEAT ca) |
| H | Comunitat de propietaris en règim de propietat horitzontal | official (AEAT ca) |
| J | Societat civil | official (AEAT ca) |
| N | Entitat estrangera | official (AEAT ca, summary table) |
| P | Corporació local | official (AEAT ca) |
| Q | Organisme públic | official (AEAT ca) |
| R | Congregació o institució religiosa | official (AEAT ca) |
| S | Òrgan de l'Administració de l'Estat o d'una comunitat autònoma | official (AEAT ca) |
| U | Unió temporal d'empreses | official (AEAT ca) |
| V | Un altre tipus no definit a la resta de claus | official (AEAT ca) |
| W | Establiment permanent d'una entitat no resident en territori espanyol | official (AEAT ca, art. 5 wording) |

Terminology: "caràcter de control"; "NIF", "NIE", "NIF K/L/M", "NIF de persona jurídica (CIF)", "NIF-IVA"; "xifra" for a digit (the AEAT page says "dígit"; both are standard, "xifra" is the usual word on Catalan forms). The user is addressed with *vós* ("Introduïu"), as Catalan software localisation usually does. "Aquí no s'admet cap DNI" uses *cap*, the natural negative, rather than a literal "un".

<!-- cspell:enable -->
