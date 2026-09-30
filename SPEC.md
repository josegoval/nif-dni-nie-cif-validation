# Validation rules specification

This document is the official specification of what `nif-dni-nie-cif-validation` accepts and rejects, and why. Every rule has an ID, a source tier and a citation, so any behaviour of the library can be traced back to the text that justifies it (or be labelled as convention when no official text exists).

Last verified: 2026-09-30

## Contents

- [How to use rule IDs](#how-to-use-rule-ids)
- [How to propose a change](#how-to-propose-a-change)
- [Source tiers](#source-tiers)
- [Rules](#rules)
  - [Natural persons: DNI](#natural-persons-dni)
  - [Natural persons: K / L / M NIF](#natural-persons-k--l--m-nif)
  - [Natural persons: NIE](#natural-persons-nie)
  - [Legal entities: NIF (formerly CIF)](#legal-entities-nif-formerly-cif)
  - [VAT (intra-EU)](#vat-intra-eu)
  - [Input cleanup](#input-cleanup-never-changes-validity-only-parsing)
  - [Opt-in policies](#opt-in-policies-off-by-default)
- [Explicitly NOT implemented](#explicitly-not-implemented-no-official-basis)
- [Decisions](#decisions)
- [Known conflicts between sources](#known-conflicts-between-sources)
- [Open questions](#open-questions)
- [Test values](#test-values-all-computed-and-checked)
- [Source URLs](#source-urls)

## How to use rule IDs

- Each rule below has an ID made of a family and a number: `DNI-1`, `KLM-2`, `NIE-3`, `CIF-3`, `VAT-1`, `NORM-1`.
- Code comments and test names reference these IDs, for example `// CIF-3 (AEAT D.I.T. 2008)`. Every validation branch in `src/` should cite the rule it implements, and every ID used in the code must exist in this file with the same meaning.
- Each ID has an anchor, so it can be linked directly: `SPEC.md#cif-3`, `SPEC.md#nie-3`.
- IDs are stable. If a rule changes, update its text and keep the ID. If a rule is dropped, keep the ID retired in this file rather than reusing the number.

## How to propose a change

1. Open an issue that names the rule ID (or proposes a new one) and cites the source: the law (article), the official page, or the document. Conventions with no official text are accepted only as documented T4 rules (see the tiers below).
2. Update this file in the same pull request as the code change, bump the "Last verified" date, and keep the code comments and test names in sync with the IDs.
3. A change that makes the library accept fewer or more inputs by default is a breaking change (major version).

## Source tiers

| Tier | Meaning | Sources |
|---|---|---|
| **T1: Law (BOE)** | Published legal text in force | RD 1065/2007 (RGAT) arts. 19–22, 24, 25 · Orden EHA/451/2008 (as amended by Orden HAP/5/2016) · Orden INT/2058/2008 (in Orden 7/2/1997, apartado sexto.a) · RD 255/2025 (DNI; replaced RD 1553/2005 on 2025-04-02) · RD 1155/2024 art. 205 (NIE; replaced RD 557/2011 on 2025-05-20) |
| **T2: Official government page** | Published by the responsible administration | Ministerio del Interior, "Cálculo del dígito de control del NIF/NIE" · AEAT Sede, "Composición del NIF" (personas físicas / personas jurídicas) |
| **T3: Semi-official** | Internal AEAT technical document | AEAT D.I.T. note "Número de Identificación Fiscal (N.I.F.)", updated 2008-04-15, hosted by CAIB (see [Source URLs](#source-urls)) |
| **T4: Convention** | Industry practice with no official text | Documented. Never on by default unless it only affects input cleanup. |

## Rules

### Natural persons: DNI

| ID | Rule | Tier | Source |
|---|---|---|---|
| <a id="dni-1"></a>DNI-1 | 8 digits (leading zeros allowed) followed by one upper-case check letter | T1 + T2 | RD 1065/2007 art. 19.1 ("una letra mayúscula"); AEAT Sede: "ocho dígitos (teniendo en cuenta que los primeros pueden ser ceros) más una letra de control" |
| <a id="dni-2"></a>DNI-2 | Check letter = `TRWAGMYFPDXBNJZSQVHLCKE`[number mod 23] | T2 + T3 | Interior: "Se divide el número entre 23 y el resto se sustituye por una letra…"; AEAT D.I.T. note |
| <a id="dni-3"></a>DNI-3 | I, Ñ, O and U are never valid check letters (they aren't in the table) | follows from DNI-2 | — |

The mod-23 algorithm is **not** in any BOE text. T2 (Interior) is its most authoritative source.

### Natural persons: K / L / M NIF

| ID | Rule | Tier | Source |
|---|---|---|---|
| <a id="klm-1"></a>KLM-1 | K (Spaniards under 14 living in Spain, without DNI), L (Spaniards resident abroad, without DNI), M (foreigners without NIE) + 7 characters + an alphabetic check character | T1 | RD 1065/2007 arts. 19.2 and 20.2 |
| <a id="klm-2"></a>KLM-2 | The check letter uses DNI-2 over **the 7 digits only** (the prefix is not converted to a digit) | T3 | AEAT D.I.T.: "…los siete dígitos siguientes a la letra inicial en el resto de los casos" |
| <a id="klm-3"></a>KLM-3 | The 7 characters are digits | T3 | The AEAT D.I.T. note says "siete dígitos numéricos". **Conflict:** the BOE says "siete caracteres alfanuméricos". We follow T3 because the check algorithm needs digits. See [Known conflicts between sources](#known-conflicts-between-sources). |

An M NIF can be temporary (AEAT: "válido por tres meses" while the NIE is pending). That is a registry state, not a format rule.

### Natural persons: NIE

| ID | Rule | Tier | Source |
|---|---|---|---|
| <a id="nie-1"></a>NIE-1 | X, Y or Z + 7 digits + alphabetic check character. After the X series runs out, the next letter in alphabetical order is used | T1 + T2 | Orden INT/2058/2008; AEAT: NIEs "que comiencen por X, Y o por Z" |
| <a id="nie-2"></a>NIE-2 | For the check, X→0, Y→1, Z→2, then apply DNI-2 | T2 + T3 | Interior: "se sustituye: X → 0 Y → 1 Z → 2 y se aplica el mismo algoritmo que para el NIF"; AEAT D.I.T. note |
| <a id="nie-3"></a>NIE-3 | **Old 10-character NIEs** (X + 8 digits + letter) stay valid. The canonical form drops the zero right after the X: `X0nnnnnnnL` → `XnnnnnnnL` | T1 + T2 | Orden INT/2058/2008, transitional provision ("seguirán teniendo validez"); AEAT Sede ("omitiendo el primer cero que figuraba después de la X") |

### Legal entities: NIF (formerly CIF)

| ID | Rule | Tier | Source |
|---|---|---|---|
| <a id="cif-1"></a>CIF-1 | 9 characters: organisation key + 7 digits + a control character | T1 | Orden EHA/451/2008 art. 2; RD 1065/2007 art. 22.1 |
| <a id="cif-2"></a>CIF-2 | Valid keys: A B C D E F G H J N P Q R S U V W. No key has ever been removed; K, L, M, X, Y and Z are natural-person prefixes, never entities | T1 | Orden EHA/451/2008 arts. 3–5 (art. 3 as amended by Orden HAP/5/2016, in force 2016-01-16) |
| <a id="cif-3"></a>CIF-3 | Control type: **digit** for A B C D E F G H J U V (Spanish entities); **letter** for N P Q R S W | T3 | AEAT D.I.T.: "numérico (0 a 9) para ent. jurídicas nacionales. Alfabético (A…J) para entidades jurídicas extranjeras, corporaciones locales, organismos públicos y congregaciones religiosas y órganos de la Administración" |
| <a id="cif-4"></a>CIF-4 | Control arithmetic: add the digits in even positions (2, 4, 6); for the digits in odd positions (1, 3, 5, 7), double each one and add the digits of each result; control = (10 − total mod 10) mod 10; letter = `JABCDEFGHI`[control] | **T4** | No official text defines it (checked: Decreto 2423/1975, the Orders of 1980/85/89/98, RD 338/1990, RD 1065/2007, Orden EHA/451/2008). Universal industry consensus, checked against public-body NIFs P2807900B (Ayuntamiento de Madrid) and Q2826000H (AEAT). See [Known conflicts between sources](#known-conflicts-between-sources). |
| <a id="cif-5"></a>CIF-5 | The 7 digits are random. **Do not** validate province codes | T1 | Orden EHA/451/2008 art. 2.b "número aleatorio"; preamble: "desaparece… la información relativa a la provincia" |

### VAT (intra-EU)

| ID | Rule | Tier | Source |
|---|---|---|---|
| <a id="vat-1"></a>VAT-1 | Spanish VAT number format = `ES` + NIF. A valid format does **not** mean the number is registered in VIES | T1 | RD 1065/2007 art. 25.1 |

### Input cleanup (never changes validity, only parsing)

| ID | Rule | Tier | Source |
|---|---|---|---|
| <a id="norm-1"></a>NORM-1 | The canonical form is upper case. Accepting lower-case input is convention | T1 (canonical) / T4 (accepting) | RD 1065/2007 art. 19.1 |
| <a id="norm-2"></a>NORM-2 | Spaces and dots are ignored | T2 (EU Commission VIES page, not a Spanish source) | VIES help: "Spaces and dots between blocks of digits should be ignored" |
| <a id="norm-3"></a>NORM-3 | Hyphens and slashes are ignored | T4 | — |
| <a id="norm-4"></a>NORM-4 | A DNI entered with fewer than 8 digits is left-padded with zeros to its canonical form | T2 (canonical) / T4 (padding input) | AEAT Sede: "los primeros pueden ser ceros" |

### Opt-in policies (off by default)

These rules are not in any official source. They never apply unless the caller asks for them, so the default result always follows the official rules above.

| ID | Rule | Tier | Source |
|---|---|---|---|
| <a id="policy-1"></a>POLICY-1 | Placeholder numbers `00000000T`, `00000001R`, `99999999R` and `X0000000T` are valid documents by default. With `rejectPlaceholders: true` they are rejected (error `PLACEHOLDER`), in any accepted form (lower case, old NIE form `X00000000T`, with separators) | T4 | ESNIC (.es registry) filters them as obviously fake; no law forbids them. See [Explicitly NOT implemented](#explicitly-not-implemented-no-official-basis) |

## Explicitly NOT implemented (no official basis)

| Folklore rule | Finding | Decision |
|---|---|---|
| "A CIF number starting with `00` must have a letter control" | No official list has ever had province code 00. It traces back to an uncited Wikipedia table | **Do not implement.** Remove the dead code; don't turn it on |
| "C D F G J U V accept either letter or digit" | Contradicts CIF-3 (T3) | Off by default. Opt-in `cifControl: "lenient"` for legacy data (**decision approved 2026-09-30**; breaking change in v2) |
| NIE / NIF with a `T` prefix | No official source | **Not supported** |
| Province-code validation for CIFs | Repealed; random since 2008 | **Not implemented** |
| Rejecting 00000000T, 00000001R, 99999999R, X0000000T | No law forbids them; ESNIC (.es registry) filters them as obviously fake | Valid by default. Opt-in `rejectPlaceholders: true` ([POLICY-1](#policy-1)) |

## Decisions

### CIF keys C, D, F, G, J, U and V: digit-only by default from v2 (approved 2026-09-30)

- From v2, organisation keys C, D, F, G, J, U and V require a **digit** control, as CIF-3 states. This is a breaking change.
- An opt-in option `cifControl: "lenient"` keeps the legacy behaviour (either a letter or a digit) for these keys, for old data.
- v1.x kept accepting either a letter or a digit for C, D, F, G, J, U and V, so existing users were not broken. 2.0.0 implements the decision: `cifControl` defaults to `"official"`, and `{ cifControl: "lenient" }` restores the v1 behaviour (see MIGRATION.md).
- The keys A, B, E and H (digit) and N, P, Q, R, S and W (letter) already follow CIF-3 in v1.

## Known conflicts between sources

### KLM-3: "alfanuméricos" (BOE) vs "dígitos" (AEAT)

- RD 1065/2007 arts. 19.2 and 20.2 (T1) describe the K/L/M NIF as a letter, "siete caracteres alfanuméricos" and a check character.
- The AEAT D.I.T. note (T3) says "siete dígitos numéricos".
- Decision: we follow the AEAT D.I.T. note, because the check algorithm (KLM-2) is computed over the 7 digits and is undefined for arbitrary characters. If an official source ever publishes a check algorithm for non-digit characters, KLM-3 must be revisited.

### CIF-4: the control arithmetic is not published anywhere official

- No official text defines the control arithmetic for legal-entity NIFs (see the list of texts checked in CIF-4). It is a T4 convention.
- It is the universal industry algorithm, and it was checked against the real public-body NIFs P2807900B (Ayuntamiento de Madrid) and Q2826000H (AEAT).
- Because it is a T4 convention, an official publication of the algorithm would take precedence over this entry.

## Open questions

- **A 1975 circular we could not find.** A circular of the Subsecretaría de Hacienda from 1975 might mention a historical use of "00". We could not find it. Until it is found, the "CIF starting with `00` needs a letter" rule stays in [Explicitly NOT implemented](#explicitly-not-implemented-no-official-basis): no official list we checked has ever had province code 00.
- **A written question to AEAT.** Option: ask the AEAT in writing to confirm (a) the control type per organisation key (CIF-3) and (b) the control arithmetic (CIF-4), since both come only from an internal technical note and from convention. Not done yet.

## Test values (all computed and checked)

Valid: `12345678Z` · `01234567L` · `00000008P` · `X1234567L` · `Y1234567X` · `Z1234567R` · `X01234567L` (old form → `X1234567L`) · `K1234567L` · `L1234567L` · `M1234567L` · `A58818501` · `B12345674` · `B00123455` · `P2807900B` · `Q2826000H` · `N1234567D` · `W1234567D` · `ES12345678Z` (VAT format)

Invalid:

- `12345678A` (wrong letter)
- `12345678I` / `O` / `U` (letter not in the table)
- `Y1234567L` (the prefix changes the letter)
- `X11234567L` (only a leading 0 may be dropped)
- `K1234567A` (wrong letter)
- `T12345678` (no official prefix)
- `123456789` (the check character must be a letter)
- `B1234567D` (B needs a digit, CIF-3; valid only with `cifControl: "lenient"`)
- `G1234567D` (G needs a digit, CIF-3; valid only in lenient mode)
- `Q12345674` / `N12345674` (these keys need a letter)
- `I1234567D` / `K1234567D` / `X1234567D` (not entity keys; K and X are natural persons with their own rules)
- `B1234567`, `B123456745` (wrong length)
- `B12345675` (wrong control)
- `B0012345E` (CIF-3: B needs a digit, and the `00` rule is folklore)

Policy (valid by default, rejected with `rejectPlaceholders`): `00000000T` · `00000001R` · `99999999R` · `X0000000T`

## Source URLs

Live status checked on 2026-09-30 with `curl -sI -L`. Archive links should point to the closest Wayback Machine snapshot (queried through `https://archive.org/wayback/available?url=<url>`, without requesting new captures). On 2026-09-30 that API answered HTTP 429 (Too Many Requests) to every query, including after several retries with back-off, so no snapshot could be resolved yet. Until the links are filled in, each entry says "archive: check manually", and you can look a page up at `https://web.archive.org/web/*/<url>`.

- RD 1065/2007: <https://www.boe.es/buscar/act.php?id=BOE-A-2007-15984> (archive: check manually)
- Orden EHA/451/2008 (consolidated): <https://www.boe.es/buscar/act.php?id=BOE-A-2008-3580> (archive: check manually)
- Orden HAP/5/2016: <https://www.boe.es/buscar/doc.php?id=BOE-A-2016-358> (archive: check manually)
- Orden INT/2058/2008: <https://www.boe.es/buscar/doc.php?id=BOE-A-2008-12050> (archive: check manually)
- Orden 7/2/1997 (consolidated): <https://www.boe.es/buscar/act.php?id=BOE-A-1997-3364> (archive: check manually)
- RD 255/2025 (DNI): <https://www.boe.es/buscar/act.php?id=BOE-A-2025-6601> (archive: check manually)
- RD 1155/2024 (extranjería): <https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099> (archive: check manually)
- Decreto 2423/1975 (repealed): <https://www.boe.es/buscar/doc.php?id=BOE-A-1975-21698> (archive: check manually)
- Interior, check-letter calculation: <https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/calculo-del-digito-de-control-del-nif-nie/> (live: HTTP 403 to automated requests, probably bot blocking; archive: check manually)
- AEAT, NIF of natural persons: <https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/anexos/anexo-01-solicitud-nif-documentacion-aportar/informacion-sobre-numero-identificacion-fiscal/composicion-nif/personas-fisicas.html> (archive: check manually)
- AEAT, NIF of legal entities: <https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/anexos/anexo-01-solicitud-nif-documentacion-aportar/informacion-sobre-numero-identificacion-fiscal/composicion-nif/personas-juridicas-entidades.html> (archive: check manually)
- AEAT D.I.T. note (CAIB copy): <https://www.caib.es/sites/civitasmanualsisuport/f/41519> (archive: check manually)
- AEAT, checking the NIF of third parties (census check, not format): <https://sede.agenciatributaria.gob.es/Sede/ayuda/consultas-informaticas/presentacion-declaraciones-ayuda-tecnica/modelo-030/comprobacion-nif-terceros-efectos-censales.html> (archive: check manually)
- ESNIC placeholder examples (secondary): <https://www.openprovider.com/es/blog/comunicado-esnic> (archive: check manually)
