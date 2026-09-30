# Translations

Every text that `validate()` and `describeCifOrganisation()` return lives in a locale object under [`src/locales/`](../src/locales/), one file per language (see [api-design.md](api-design.md), D5). This page records, per language, where each CIF organisation name comes from and which terms the messages use, so a reviewer can check them.

The organisation names describe the organisation keys of Orden EHA/451/2008, arts. 3 to 5 (art. 3 as amended by Orden HAP/5/2016), [SPEC.md CIF-2](../SPEC.md#cif-2). The Order lists them in the plural; every locale gives them in the singular, because `meta.orgDescription` describes one entity.

- **Official**: the wording of an official text in that language, put in the singular. The source is cited in the locale file and below.
- **Translated**: no official version was found; our own translation, marked `// translated (no official version found)` in the locale file.

**Review.** Every language other than English and Spanish gets a second, independent language review (by another model, then ideally a native speaker) before release. Findings are fixed in the locale file and recorded here.

<!-- cspell:disable -->

## English (`en`, built in)

There is no official English version of the Order. All 17 names are **translated**, using the usual English terms for the Spanish legal forms (for example "Public limited company" for *sociedad anónima*, "Temporary joint venture" for *unión temporal de empresas*).

Terminology: "control character", "NIF of a legal person or entity (CIF)", "K/L/M NIF".

## Spanish (`es`, `locales/es`)

All 17 names are **official**: the Order's own wording, in the singular. Source: Orden EHA/451/2008, BOE-A-2008-3580, consolidated text: <https://www.boe.es/buscar/act.php?id=BOE-A-2008-3580>.

Terminology: "carácter de control" (the AEAT's term), "NIF de persona jurídica o entidad (CIF)", "NIF K/L/M", "NIF-IVA". Informal *tú* imperative ("Introduce"), as most Spanish web forms use.

## Catalan (`ca`, `locales/ca`), also for Valencian

The same locale serves Valencian: the AEAT's Valencian page gives the same organisation names as its Catalan page, and the messages use no form that differs between the two standards. An application for Valencian users can pass `ca` (its `code` stays `"ca"`).

All 17 names are **official**: the AEAT's Catalan page on the NIF of legal persons and entities, which lists the keys of the Order (arts. 3 to 5, as amended by Orden HAP/5/2016), put in the singular.

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

Terminology: "caràcter de control"; "NIF", "NIE", "NIF K/L/M", "NIF d'entitat (CIF)", "NIF-IVA"; "xifra" for a digit (the AEAT page says "dígit"; both are standard, "xifra" is the usual word on Catalan forms). The user is addressed with *vós* ("Introduïu"), as Catalan software localisation usually does. That register suits standard Catalan, but is less customary in Valencian administrative interfaces. "Aquí no s'admet cap DNI" uses *cap*, the natural negative, rather than a literal "un".

## Basque (`eu`, `locales/eu`)

All 17 names are **official**, from an official Basque text of the same key list: Bizkaia's Decreto Foral 205/2008, de 22 de diciembre (the Bizkaia tax obligations regulation), art. 32, which repeats the organisation keys of the Order (as amended by Orden HAP/5/2016) in its Basque version. The names below are its wording in the singular. No Basque version of Orden EHA/451/2008 itself was found: the BOE has none, and the AEAT's Basque page on the NIF of legal entities shows the Spanish text.

- Source: <https://www.bizkaia.eus/documents/880307/15187815/eu_205_2008_2024.pdf> (consolidated Basque text, art. 32 "Erakundeen forma juridikoaren gakoak").

| Key | Name (singular) | Source |
| --- | --- | --- |
| A | Sozietate anonimoa | official (DF 205/2008 art. 32.1) |
| B | Erantzukizun mugatuko sozietatea | official (art. 32.1) |
| C | Sozietate kolektiboa | official (art. 32.1) |
| D | Sozietate komanditarioa | official (art. 32.1) |
| E | Ondasun-erkidegoa, jaraunspen jasogabea edo bestelako gakoetan berariaz jasota ez dagoen nortasun juridikorik gabeko beste erakunde bat | official (art. 32.1), plural "gainerako erakundeak" made singular "beste erakunde bat" |
| F | Sozietate kooperatiboa | official (art. 32.1) |
| G | Elkartea | official (art. 32.1) |
| H | Jabetza horizontalaren araubideko jabeen erkidegoa | official (art. 32.1) |
| J | Sozietate zibila | official (art. 32.1) |
| N | Atzerriko erakundea | official (art. 32.2: "erakundea atzerrikoa dela adierazteko"), as a noun phrase |
| P | Toki korporazioa | official (art. 32.1) |
| Q | Erakunde publikoa | official (art. 32.1) |
| R | Kongregazio edo erakunde erlijiosoa | official (art. 32.1) |
| S | Estatuaren Administrazioko edo autonomia-erkidego bateko organoa | official (art. 32.1) |
| U | Aldi baterako enpresa-elkartea | official (art. 32.1) |
| V | Beste gakoetan definitu ez den mota | official (art. 32.1) |
| W | Espainiako lurraldeko egoiliar ez den erakunde baten establezimendu iraunkorra | official (art. 32.3) |

Terminology: the messages use the Basque names of the documents, as the AEAT's Basque pages and the Basque administrations do: "IFZ" (*identifikazio fiskaleko zenbakia*) for NIF, "NAN" for DNI, "AIZ" for NIE, "IFK" for the old CIF ("pertsona juridiko edo erakunde baten IFZ (IFK)"), "IFZ-BEZ" for the VAT number (the AEAT's term). Also "kontrol-karakterea" and "digitu". Instructions use the bare imperative ("Sartu"). The document type is interpolated in positions where it needs no case ending ("NAN honetan", "dokumentu mota hau: NAN"), so the names never have to be declined. **Decision for review:** Basque users also see the Spanish acronyms (DNI, NIF, NIE) on many forms; if the reviewers prefer them, only `TYPES` and the literal acronyms in the messages change.

## Galician (`gl`, `locales/gl`)

All 17 names are **official**: the AEAT's Galician page on the NIF of legal persons and entities, which lists the keys of the Order (arts. 3 to 5, as amended by Orden HAP/5/2016), put in the singular.

- Source: <https://sede.agenciatributaria.gob.es/Sede/gl_es/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/anexos/anexo-01-solicitud-nif-documentacion-aportar/informacion-sobre-numero-identificacion-fiscal/composicion-nif/personas-juridicas-entidades.html>

| Key | Name (singular) | Source |
| --- | --- | --- |
| A | Sociedade anónima | official (AEAT gl) |
| B | Sociedade de responsabilidade limitada | official (AEAT gl) |
| C | Sociedade colectiva | official (AEAT gl) |
| D | Sociedade comanditaria | official (AEAT gl) |
| E | Comunidade de bens, herdanza xacente ou outra entidade carente de personalidade xurídica non incluída expresamente noutras claves | official (AEAT gl) |
| F | Sociedade cooperativa | official (AEAT gl) |
| G | Asociación | official (AEAT gl) |
| H | Comunidade de propietarios en réxime de propiedade horizontal | official (AEAT gl) |
| J | Sociedade civil | official (AEAT gl) |
| N | Entidade estranxeira | official (AEAT gl, summary table) |
| P | Corporación local | official (AEAT gl) |
| Q | Organismo público | official (AEAT gl) |
| R | Congregación ou institución relixiosa | official (AEAT gl) |
| S | Órgano da Administración do Estado ou dunha comunidade autónoma | official (AEAT gl) |
| U | Unión temporal de empresas | official (AEAT gl; the page labels the key "Ou", a machine-translation slip for "U") |
| V | Outro tipo non definido no resto de claves | official (AEAT gl) |
| W | Establecemento permanente dunha entidade non residente en territorio español | official (AEAT gl, art. 5 wording) |

Some names are spelled the same as in Spanish ("Asociación", "Corporación local", "Organismo público", "Unión temporal de empresas"): that is correct Galician.

Terminology: "carácter de control"; "NIF", "NIE", "NIF K/L/M", "NIF de entidade (CIF)"; "díxito"; "NIF-IVE" for the VAT number (IVE, *imposto sobre o valor engadido*, the AEAT's Galician term). The user is addressed formally ("Introduza"), as Galician software localisation and the Xunta usually do. "Aquí non se admite ningún DNI" uses *ningún*, the natural negative.


## Language review

Each locale had an independent language review by a second model (Codex, 2026-09-30), one pass per language. Verdicts, before the fixes below:

| Locale | Verdict |
| --- | --- |
| `ca` | approve with minor fixes |
| `eu` | approve with minor fixes |
| `gl` | approve with minor fixes |
| `es` | needs changes: the CIF label and the placeholder message |

Changes applied (`fix(locales): apply the native-language review`):

1. **The CIF label names the whole category, in every locale.** "NIF de persona jurídica (CIF)" left out the entities without legal personality (key E and others), which Orden EHA/451/2008 also covers ("personas jurídicas y entidades sin personalidad jurídica"). The type name, and the `INVALID_LENGTH` and `INVALID_FORMAT` messages for CIF-1 that repeat it, now say: en "NIF of a legal person or entity (CIF)", es "NIF de persona jurídica o entidad (CIF)", ca "NIF d'entitat (CIF)", gl "NIF de entidade (CIF)", eu "pertsona juridiko edo erakunde baten IFZ (IFK)". The docs and code comments that named the CIF type "legal entity NIF" follow; API names such as `isValidLegalEntityNif` don't change.
2. **The format messages describe a sequence.** `INVALID_FORMAT` for KLM-1 and NIE-1 now say "starts with K, L or M, followed by 7 digits and a letter" (and the equivalent in each language); for CIF-1, "consists of" ("consta de", "consta d'", "consta dunha"; eu "osaera hau du: …, hurrenkera horretan").
3. **The placeholder message no longer says the number is fake.** Being on the POLICY-1 list doesn't prove a number is not real; the policy only rejects them on request. Every locale now says that the number is on the list of known placeholder values, which are not accepted here.
4. **Basque wording:** `INVALID_LENGTH` for VAT-1 ("Espainiako IFZ-BEZ batek ES aurrizkia eta, ondoren, 9 karaktereko IFZ bat ditu.") and `INVALID_FORMAT` for DNI-1 ("NAN baten formatua hau da: 8 digitu eta, ondoren, letra bat.").
5. **Catalan register:** noted above; `ca` keeps *vós* ("Introduïu").

A confirmation review of the changed strings follows; a native speaker's review is still welcome for every language.

<!-- cspell:enable -->
