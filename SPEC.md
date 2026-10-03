# Validation rules specification

This document is the official specification of what `nif-dni-nie-cif-validation` accepts and rejects, and why. Every rule has an ID, a source tier and a citation, so any behaviour of the library can be traced back to the text that justifies it (or be labelled as convention when no official text exists).

Last verified: 2026-09-30

## Contents

- [How to use rule IDs](#how-to-use-rule-ids)
- [How to propose a change](#how-to-propose-a-change)
- [Source tiers](#source-tiers)
- [Rules](#rules)
  - [Every NIF](#every-nif)
  - [Natural persons: DNI](#natural-persons-dni)
  - [Natural persons: K / L / M NIF](#natural-persons-k--l--m-nif)
  - [Natural persons: NIE](#natural-persons-nie)
  - [Legal persons and entities: NIF (formerly CIF)](#legal-persons-and-entities-nif-formerly-cif)
  - [VAT (intra-EU)](#vat-intra-eu)
  - [Input cleanup](#input-cleanup-never-changes-validity-only-parsing)
  - [Input contract](#input-contract-library-behaviour-no-official-content)
  - [Opt-in policies](#opt-in-policies-off-by-default)
- [Explicitly NOT implemented](#explicitly-not-implemented-no-official-basis)
- [Decisions](#decisions)
  - [How input cleanup works](#how-input-cleanup-works-settled-by-the-v2-api-2026-09-30)
  - [Type detection is format-based](#type-detection-is-format-based-getniftype-settled-2026-09-30)
  - [Display format](#display-format-format-settled-2026-09-30)
  - [Single-character substitutions](#single-character-substitutions-checked-by-the-property-tests)
- [Known conflicts between sources](#known-conflicts-between-sources)
- [Open questions](#open-questions)
- [Differences from other libraries](#differences-from-other-libraries)
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
| **T4: Convention** | Industry practice with no official text | Documented. Never on by default unless it only affects input cleanup, with one documented exception: no official text publishes the CIF control arithmetic, so the universal algorithm applies by default ([CIF-4](#cif-4)). |

## Rules

### Every NIF

| ID | Rule | Tier | Source |
|---|---|---|---|
| <a id="nif-1"></a>NIF-1 | The first character selects exactly one format: a digit (DNI-1), K L M (KLM-1), X Y Z (NIE-1) or an organisation key (CIF-2). These sets never overlap. Any other first character (for example `T`, see [Explicitly NOT implemented](#explicitly-not-implemented-no-official-basis)) is not a NIF | follows from DNI-1, KLM-1, NIE-1 and CIF-2 | RD 1065/2007 arts. 19–22 |

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

### Legal persons and entities: NIF (formerly CIF)

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

### Input contract (library behaviour, no official content)

These rules don't decide which documents are valid. They say how the library treats input that is not a document at all, so that every error can cite a rule.

| ID | Rule | Tier | Source |
|---|---|---|---|
| <a id="input-1"></a>INPUT-1 | Only strings are validated. Any other value (`null`, numbers, objects) is rejected without being converted to a string, and no validator throws | Library contract | #40 |
| <a id="input-2"></a>INPUT-2 | A value that is empty, or only separators (NORM-2, NORM-3), is reported as empty | Library contract | #56 |

### Opt-in policies (off by default)

These rules are not in any official source. They never apply unless the caller asks for them, so they never change the default result, which follows only the rules above (official rules and the documented T4 conventions: input cleanup, and the CIF control arithmetic of [CIF-4](#cif-4)).

| ID | Rule | Tier | Source |
|---|---|---|---|
| <a id="policy-1"></a>POLICY-1 | Placeholder numbers `00000000T`, `00000001R`, `99999999R` and `X0000000T` are valid documents by default. With `rejectPlaceholders: true` they are rejected (error `PLACEHOLDER`), in any accepted form (lower case, old NIE form `X00000000T`, with separators) | T4 | ESNIC (.es registry) filters them as obviously fake; no law forbids them. See [Explicitly NOT implemented](#explicitly-not-implemented-no-official-basis) |
| <a id="policy-2"></a>POLICY-2 | The caller may accept only some document types (option `types`). A document of another type is rejected (error `UNSUPPORTED_TYPE`), even when it is valid | Library option | #56 |

## Explicitly NOT implemented (no official basis)

| Folklore rule | Finding | Decision |
|---|---|---|
| "A CIF number starting with `00` must have a letter control" | No official list has ever had province code 00. It traces back to an uncited Wikipedia table | **Do not implement.** Remove the dead code; don't turn it on |
| "C D F G J U V accept either letter or digit" | Contradicts CIF-3 (T3) | Off by default. Opt-in `cifControl: "lenient"` for legacy data (**decision approved 2026-09-30**; breaking change in v2) |
| NIE / NIF with a `T` prefix | No official source | **Not supported** (rejected as [NIF-1](#nif-1)) |
| Province-code validation for CIFs | Repealed; random since 2008 | **Not implemented** |
| Rejecting 00000000T, 00000001R, 99999999R, X0000000T | No law forbids them; ESNIC (.es registry) filters them as obviously fake | Valid by default. Opt-in `rejectPlaceholders: true` ([POLICY-1](#policy-1)) |

## Decisions

### CIF keys C, D, F, G, J, U and V: digit-only by default from v2 (approved 2026-09-30)

- From v2, organisation keys C, D, F, G, J, U and V require a **digit** control, as CIF-3 states. This is a breaking change.
- An opt-in option `cifControl: "lenient"` keeps the legacy behaviour (either a letter or a digit) for these keys, for old data.
- v1.x kept accepting either a letter or a digit for C, D, F, G, J, U and V, so existing users were not broken. 2.0.0 implements the decision: `cifControl` defaults to `"official"`, and `{ cifControl: "lenient" }` restores the v1 behaviour (see MIGRATION.md).
- The keys A, B, E and H (digit) and N, P, Q, R, S and W (letter) already follow CIF-3 in v1.

### How input cleanup works (settled by the v2 API, 2026-09-30)

NORM-1 to NORM-4 say what is ignored; the implementation (`normalize()`) settles the details:

- **White space** is exactly JavaScript's `\s` (spaces, tabs, line breaks, no-break spaces, the BOM…), removed anywhere, which also trims. Dots, hyphen-minus (`-`) and slashes are removed anywhere. Other punctuation (`_`, `,`, the en dash `–`) is kept, so the value stays invalid.
- **Case**: only ASCII letters and `ñ` are upper-cased. Non-ASCII look-alikes that `toUpperCase()` maps to ASCII letters (`ı` → `I`, `ſ` → `S`) are kept, so they never become valid.
- **Order**: separators and case, then NIE-3 (`X0nnnnnnnL` → `XnnnnnnnL`), then NORM-4 (1 to 7 digits and a letter are left-padded to 8 digits).
- **`normalize: false`** turns off NORM-2 to NORM-4. Lower case (NORM-1) and the old NIE form (NIE-3) are still accepted, as in v1.
- **`ES` is not cleanup**: an `ES` prefix makes a VAT number (VAT-1), accepted only with `allowVatPrefix` or by `isValidSpanishVat`.

### Type detection is format-based (`getNifType()`, settled 2026-09-30)

`getNifType()` returns the type that `validate()` reports: the one selected by the first character (NIF-1), once the length, the digits and the class of the control character (a letter for DNI, K/L/M and NIE; a letter or a digit for CIF) match that type's format. It does **not** check the control character: `12345678A` is a `"DNI"` and `B1234567D` is a `"CIF"`, although both are invalid. So a non-null type never means "valid".

### Display format (`format()`, settled 2026-09-30)

No official source defines a display grouping. `format()` splits the canonical form into the parts the rules define, joined by a separator (`-` by default, a space, or nothing):

| Type | Parts | Rules | Example |
|---|---|---|---|
| DNI | 8 digits · letter | DNI-1 | `12345678-Z` |
| NIE | prefix · 7 digits · letter | NIE-1 | `X-1234567-L` |
| K/L/M NIF | prefix · 7 digits · letter | KLM-1 | `K-1234567-L` |
| NIF of a legal person or entity | key · 7 digits · control | CIF-1 | `B-1234567-4` |

Only valid documents are formatted (default options); `format()` returns `null` otherwise and never adds an `ES` prefix.

### Single-character substitutions (checked by the property tests)

Replacing one character of a valid document (positions 2 to 9) always gives an invalid one: DNI-2 changes with every digit (10^k mod 23 is never 0), CIF-4 too (doubling a digit and adding the digits of the result is a permutation), a letter in the number breaks the format, and another control character is wrong. Replacing the **first** character can give another valid document, because the prefix counts for little or nothing in the control:

- K, L and M are interchangeable (KLM-2 ignores the prefix);
- organisation keys with the same control class are interchangeable (CIF-4 ignores the key);
- across types: a DNI starting with 0, 1 or 2 has the same letter as the NIE X, Y or Z (NIE-2) and, for 0, the K/L/M NIF with the same digits; other swaps can hit a control that happens to match.

With `cifControl: "lenient"`, the digit and the letter of the same control value are both valid for C D F G J U V.

## Known conflicts between sources

### KLM-3: "alfanuméricos" (BOE) vs "dígitos" (AEAT)

- RD 1065/2007 arts. 19.2 and 20.2 (T1) describe the K/L/M NIF as a letter, "siete caracteres alfanuméricos" and a check character.
- The AEAT D.I.T. note (T3) says "siete dígitos numéricos".
- Decision: we follow the AEAT D.I.T. note, because the check algorithm (KLM-2) is computed over the 7 digits and is undefined for arbitrary characters. If an official source ever publishes a check algorithm for non-digit characters, KLM-3 must be revisited.

### CIF-4: the control arithmetic is not published anywhere official

- No official text defines the control arithmetic for legal-entity NIFs (see the list of texts checked in CIF-4). It is a T4 convention.
- It is the only T4 rule that decides validity by default: without it, the control character of a legal-entity NIF could not be checked at all.
- It is the universal industry algorithm, and it was checked against the real public-body NIFs P2807900B (Ayuntamiento de Madrid) and Q2826000H (AEAT).
- Because it is a T4 convention, an official publication of the algorithm would take precedence over this entry.

## Open questions

- **A 1975 circular we could not find.** A circular of the Subsecretaría de Hacienda from 1975 might mention a historical use of "00". We could not find it. Until it is found, the "CIF starting with `00` needs a letter" rule stays in [Explicitly NOT implemented](#explicitly-not-implemented-no-official-basis): no official list we checked has ever had province code 00.
- **A written question to AEAT.** Option: ask the AEAT in writing to confirm (a) the control type per organisation key (CIF-3) and (b) the control arithmetic (CIF-4), since both come only from an internal technical note and from convention. Not done yet.

## Differences from other libraries

`src/__tests__/stdnum.test.ts` compares `validate()` (default options) with [stdnum](https://www.npmjs.com/package/stdnum) (the JavaScript port of python-stdnum, `stdnum.ES.nif`) on about 50,000 generated inputs. Every difference must be one of these decisions; any other difference fails the test.

| Difference | stdnum | This library | Rule |
|---|---|---|---|
| Control of C D F G J U V (and every other key) | Accepts a letter or a digit for every organisation key | Digit for A B C D E F G H J U V, letter for N P Q R S W; `cifControl: "lenient"` accepts either for C D F G J U V only | [CIF-3](#cif-3) |
| Old NIE form `X0nnnnnnnL` | Rejected | Valid, canonical `XnnnnnnnL` | [NIE-3](#nie-3) |
| DNI with fewer than 8 digits (`1234567L`) | Rejected | Left-padded to `01234567L` | [NORM-4](#norm-4) |
| White space other than a space (tab, no-break space, …) | Kept, so the value is invalid | Removed, like spaces | [NORM-2](#norm-2) |
| Non-ASCII look-alikes (`０`, `ſ`, `ı`, …) | Folded to ASCII | Kept, so the value is invalid: the canonical form is ASCII upper case | [NORM-1](#norm-1) |
| `ES` prefix | Always stripped | Only with `allowVatPrefix`, or `isValidSpanishVat` | [VAT-1](#vat-1) |
| K/L/M NIF with non-digits after the prefix | Not checked (the number is read with `parseInt`) | Invalid | [KLM-3](#klm-3) |
| Placeholders (`00000000T`, …) | Valid | Valid by default; rejected with `rejectPlaceholders` | [POLICY-1](#policy-1) |

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

Live status checked on 2026-09-30 with `curl -sI -L`. Every source also has an archived copy in the Wayback Machine, so the sources survive URL changes. The archived link is the closest snapshot to 2026-10-02 (the number after `/web/` in each link is its date and time, UTC), found through `https://archive.org/wayback/available?url=<url>`, and each one answered HTTP 200 on 2026-10-02. No capture had to be requested, except for the VIES help text (added on 2026-10-03, when it had no snapshot). The oldest is the CAIB copy of the AEAT D.I.T. note (2020-10-11), which is the only snapshot there is. To check another date, look a page up at `https://web.archive.org/web/*/<url>`.

The T1 and T2 sources are watched for changes. `spec-sources.json`, in the repository, records for each BOE text the date of its last update (and of the articles cited here) and whether it was repealed, and for each T2 page a hash of the text of its relevant section. A monthly workflow compares them with the sources and opens an issue labelled `spec-change` when one changes (CONTRIBUTING.md, "Official sources").

- RD 1065/2007: <https://www.boe.es/buscar/act.php?id=BOE-A-2007-15984> ([archived](https://web.archive.org/web/20260930063029/https://www.boe.es/buscar/act.php?id=BOE-A-2007-15984))
- Orden EHA/451/2008 (consolidated): <https://www.boe.es/buscar/act.php?id=BOE-A-2008-3580> ([archived](https://web.archive.org/web/20260307034313/https://www.boe.es/buscar/act.php?id=BOE-A-2008-3580))
- Orden HAP/5/2016: <https://www.boe.es/buscar/doc.php?id=BOE-A-2016-358> ([archived](https://web.archive.org/web/20241111020505/https://www.boe.es/buscar/doc.php?id=BOE-A-2016-358))
- Orden INT/2058/2008: <https://www.boe.es/buscar/doc.php?id=BOE-A-2008-12050> ([archived](https://web.archive.org/web/20250427044404/https://www.boe.es/buscar/doc.php?id=BOE-A-2008-12050))
- Orden 7/2/1997 (consolidated): <https://www.boe.es/buscar/act.php?id=BOE-A-1997-3364> ([archived](https://web.archive.org/web/20260518072554/https://www.boe.es/buscar/act.php?id=BOE-A-1997-3364))
- RD 255/2025 (DNI): <https://www.boe.es/buscar/act.php?id=BOE-A-2025-6601> ([archived](https://web.archive.org/web/20260716095158/https://www.boe.es/buscar/act.php?id=BOE-A-2025-6601))
- RD 1155/2024 (extranjería): <https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099> ([archived](https://web.archive.org/web/20260921102515/https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099))
- Decreto 2423/1975 (repealed): <https://www.boe.es/buscar/doc.php?id=BOE-A-1975-21698> ([archived](https://web.archive.org/web/20260711114508/https://www.boe.es/buscar/doc.php?id=BOE-A-1975-21698))
- Interior, check-letter calculation: <https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/calculo-del-digito-de-control-del-nif-nie/> (live: HTTP 403 to automated requests, probably bot blocking; [archived](https://web.archive.org/web/20260228172549/https://interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/calculo-del-digito-de-control-del-nif-nie/))
- AEAT, NIF of natural persons: <https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/anexos/anexo-01-solicitud-nif-documentacion-aportar/informacion-sobre-numero-identificacion-fiscal/composicion-nif/personas-fisicas.html> ([archived](https://web.archive.org/web/20251126010123/https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/anexos/anexo-01-solicitud-nif-documentacion-aportar/informacion-sobre-numero-identificacion-fiscal/composicion-nif/personas-fisicas.html))
- AEAT, NIF of legal persons and entities: <https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/anexos/anexo-01-solicitud-nif-documentacion-aportar/informacion-sobre-numero-identificacion-fiscal/composicion-nif/personas-juridicas-entidades.html> ([archived](https://web.archive.org/web/20260423071917/https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/guia-practica-cumplimentacion-modelo-censal-036/anexos/anexo-01-solicitud-nif-documentacion-aportar/informacion-sobre-numero-identificacion-fiscal/composicion-nif/personas-juridicas-entidades.html))
- AEAT D.I.T. note (CAIB copy): <https://www.caib.es/sites/civitasmanualsisuport/f/41519> ([archived](https://web.archive.org/web/20201011095754/http://www.caib.es/sites/civitasmanualsisuport/f/41519))
- AEAT, checking the NIF of third parties (census check, not format): <https://sede.agenciatributaria.gob.es/Sede/ayuda/consultas-informaticas/presentacion-declaraciones-ayuda-tecnica/modelo-030/comprobacion-nif-terceros-efectos-censales.html> ([archived](https://web.archive.org/web/20260518130212/https://sede.agenciatributaria.gob.es/Sede/ayuda/consultas-informaticas/presentacion-declaraciones-ayuda-tecnica/modelo-030/comprobacion-nif-terceros-efectos-censales.html))
- EU Commission, VIES help (NORM-2; live and archived copy checked on 2026-10-03): <https://ec.europa.eu/taxation_customs/vies/#/help>. The page loads the quoted text from <https://ec.europa.eu/taxation_customs/vies/assets/i18n/en.json> (key `help_txt_para00`), which is what the archived link captures ([archived](https://web.archive.org/web/20261003150619/https://ec.europa.eu/taxation_customs/vies/assets/i18n/en.json))
- ESNIC placeholder examples (secondary): <https://www.openprovider.com/es/blog/comunicado-esnic> ([archived](https://web.archive.org/web/20260314051503/https://www.openprovider.com/es/blog/comunicado-esnic))
