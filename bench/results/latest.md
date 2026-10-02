# Competitor benchmark

Generated from `latest.json` by `bench/report.mjs`: do not edit by hand. The method is in [bench/README.md](../README.md).

- Date: 2026-10-02T12:19:47.598Z
- Code: 11662416342ce5c6761c69a7a39e82028a7d0407
- Machine: AMD EPYC 9V74 80-Core Processor, 4 cores, 16 GiB, linux 6.17.0-1022-azure (x64), runner image ubuntu24 20260927.320.1
- Node.js v24.21.0, tinybench 6.2.0, 2000 ms per task after 500 ms of warmup, 3 rounds
- Absolute numbers depend on the machine and on what else it is doing. **The ratios of one run are what carries over**; see "Noise" in the README.

## Throughput

Millions of validations per second (**M ops/s, higher is faster**) of the median of the rounds. "±" is the relative margin of error within that round, and "range" is the difference between the fastest and the slowest round as a share of the median: how steady the figure was from one round to the next. One operation validates one string. Libraries that do not support a type are marked *unsupported*, which is neither fast nor slow.

- **DNI**: 225 DNI in canonical form (8 digits and a letter): 150 valid, plus 75 of them with a wrong control letter.
- **NIE**: 150 NIE in canonical form (X, Y or Z, 7 digits and a letter): 100 valid, plus 50 of them with a wrong control letter.
- **CIF**: 270 CIF in canonical form (organisation key, 7 digits and a control character), every organisation key: 180 valid, plus 90 of them with a wrong control character.
- **Mixed**: 1001 strings of every kind: 500 valid (DNI, K/L/M, NIE, old-form NIE and CIF), 100 of them again in lower case, 250 with a wrong control character, and 151 junk strings (wrong lengths, random characters, the empty string).

The libraries accept different numbers of the mixed inputs (some reject lower case, some reject K/L/M), so the mixed figures also reflect what each one accepts; the number accepted is `accepted` in latest.json. On the DNI, NIE and CIF sets every library accepts exactly the valid documents. The mixed set is timed only for libraries that cover DNI, NIE and CIF.

### M ops/s

| Library | DNI | NIE | CIF | Mixed |
| --- | ---: | ---: | ---: | ---: |
| **nif-dni-nie-cif-validation (this build) 2.0.0+1166241** | 60.12 ±0.02% (range 3.19%) | 57.60 ±0.01% (range 4.33%) | 55.06 ±0.02% (range 0.26%) | 42.02 ±0.03% (range 2.49%) |
| nif-dni-nie-cif-validation (previous major) 1.0.11 | 8.59 ±0.05% (range 0.69%) | 6.44 ±0.05% (range 6.69%) | 7.27 ±0.06% (range 1.61%) | 7.15 ±0.13% (range 2.33%) |
| spain-id 1.1.14 | 6.96 ±0.07% (range 7.53%) | 4.01 ±0.07% (range 0.63%) | 4.50 ±0.11% (range 3.12%) | 2.18 ±0.2% (range 1.96%) |
| better-dni 4.4.2 | 8.44 ±0.06% (range 5.85%) | 8.17 ±0.04% (range 0.6%) | *unsupported* | *unsupported* |
| dni-js 1.0.0 | 8.90 ±0.06% (range 4.72%) | 4.49 ±0.06% (range 10.8%) | *unsupported* | *unsupported* |
| stdnum 1.12.6 | 0.41 ±0.15% (range 0.8%) | 0.39 ±0.18% (range 0.78%) | 0.38 ±0.14% (range 1.25%) | 0.29 ±0.42% (range 3.5%) |
| validator.js isIdentityCard(x, "ES") 13.15.35 | 5.73 ±0.08% (range 2.64%) | 3.14 ±0.09% (range 8.79%) | *unsupported* | *unsupported* |
| validator.js isTaxID(x, "es-ES") 13.15.35 | 4.22 ±0.08% (range 5.52%) | 3.42 ±0.07% (range 1.02%) | *unsupported* | *unsupported* |
| @maistik/validate-nif 2.0.1 | 9.46 ±0.07% (range 7.06%) | 8.39 ±0.04% (range 7.21%) | 7.74 ±0.06% (range 8.9%) | 4.62 ±0.15% (range 4.74%) |
| @kreyo/nif-validator 0.1.0 | 2.78 ±0.14% (range 3.92%) | 2.65 ±0.12% (range 1.1%) | 2.50 ±0.15% (range 1.01%) | 2.73 ±0.21% (range 0.85%) |
| jsvat (Spain) 2.5.4 | 2.10 ±0.14% (range 5.42%) | 1.59 ±0.13% (range 0.68%) | 2.37 ±0.16% (range 4.67%) | 1.95 ±0.2% (range 3.92%) |

### nif-dni-nie-cif-validation (this build) against each library

How many times as fast as the library this build is, measured in the same run. Above 1× this build is faster; below 1× the library is faster.

| Library | DNI | NIE | CIF | Mixed |
| --- | ---: | ---: | ---: | ---: |
| nif-dni-nie-cif-validation (previous major) 1.0.11 | 7.00× | 8.95× | 7.58× | 5.87× |
| spain-id 1.1.14 | 8.63× | 14.37× | 12.23× | 19.24× |
| better-dni 4.4.2 | 7.12× | 7.05× | *unsupported* | *unsupported* |
| dni-js 1.0.0 | 6.76× | 12.82× | *unsupported* | *unsupported* |
| stdnum 1.12.6 | 146.31× | 145.98× | 146.72× | 144.07× |
| validator.js isIdentityCard(x, "ES") 13.15.35 | 10.49× | 18.37× | *unsupported* | *unsupported* |
| validator.js isTaxID(x, "es-ES") 13.15.35 | 14.25× | 16.82× | *unsupported* | *unsupported* |
| @maistik/validate-nif 2.0.1 | 6.35× | 6.87× | 7.12× | 9.09× |
| @kreyo/nif-validator 0.1.0 | 21.60× | 21.74× | 22.04× | 15.40× |
| jsvat (Spain) 2.5.4 | 28.56× | 36.17× | 23.23× | 21.59× |


### What was called

The loop of every task is compiled from these calls (`x` is the input string), each with its library's default options. `any` is the call for the mixed set and for the accuracy check.

| Library | DNI | NIE | CIF | any |
| --- | --- | --- | --- | --- |
| nif-dni-nie-cif-validation (this build) 2.0.0+1166241 | `isValidDni(x)` | `isValidNie(x)` | `isValidCif(x)` | `isValidNif(x)` |
| nif-dni-nie-cif-validation (previous major) 1.0.11 | `isValidDni(x)` | `isValidNie(x)` | `isValidCif(x)` | `isValidNif(x)` |
| spain-id 1.1.14 | `validDNI(x)` | `validNIE(x)` | `validCIF(x)` | `validateSpanishId(x)` |
| better-dni 4.4.2 | `isNIF(x)` | `isNIE(x)` | *unsupported* | `isValid(x)` |
| dni-js 1.0.0 | `dni.isDNI(x)` | `dni.isNIE(x)` | *unsupported* | `dni.isValid(x)` |
| stdnum 1.12.6 | `stdnum.ES.dni.validate(x).isValid` | `stdnum.ES.nie.validate(x).isValid` | `stdnum.ES.cif.validate(x).isValid` | `stdnum.ES.nif.validate(x).isValid` |
| validator.js isIdentityCard(x, "ES") 13.15.35 | `validator.isIdentityCard(x, "ES")` | `validator.isIdentityCard(x, "ES")` | *unsupported* | `validator.isIdentityCard(x, "ES")` |
| validator.js isTaxID(x, "es-ES") 13.15.35 | `validator.isTaxID(x, "es-ES")` | `validator.isTaxID(x, "es-ES")` | *unsupported* | `validator.isTaxID(x, "es-ES")` |
| @maistik/validate-nif 2.0.1 | `isValidDNI(x)` | `isValidNIE(x)` | `isValidCIF(x)` | `isValid(x)` |
| @kreyo/nif-validator 0.1.0 | `isValid(x)` | `isValid(x)` | `isValid(x)` | `isValid(x)` |
| jsvat (Spain) 2.5.4 | `checkVAT(x, countries).isValid` | `checkVAT(x, countries).isValid` | `checkVAT(x, countries).isValid` | `checkVAT(x, countries).isValid` |

## Agreement with SPEC.md (official sources)

Every library judges the 125 fixtures of `test/fixtures` that test the default options (dni.json, klm.json, nie.json, cif.json, normalization.json, placeholders-default.json, vat-default.json), with its default options. The figure is the share of fixtures where the library says what SPEC.md says (valid or invalid), which comes from the official sources. **It is agreement with SPEC.md, not correctness in the absolute**: the rules, and these fixtures, were written by the maintainers of this package, so this package agrees with them by construction. A type a library does not support is left out of its figures (*unsupported*). A *false accept* is a fixture that SPEC.md says is invalid and the library accepts; a *false reject* is one that SPEC.md says is valid and the library rejects. A throw counts as a rejection.

Fixtures per column: DNI 30, NIE 18, CIF 61, K/L/M 11, Other 5. "Other" holds input handling that has no type of its own (an `ES` prefix, separators only). "All" covers only the types a library supports, so compare the columns, not "All", between libraries of a different scope.

"On a documented decision" counts the disagreements that follow from a decision that SPEC.md documents in "Differences from other libraries" (for example, a digit-only control for some CIF keys), out of the false accepts and rejects.

### Every fixture

| Library | DNI | NIE | CIF | K/L/M | Other | All | False accepts | False rejects | On a documented decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **nif-dni-nie-cif-validation (this build) 2.0.0+1166241** | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 0 | 0 | 0 |
| nif-dni-nie-cif-validation (previous major) 1.0.11 | 73.3% | 88.9% | 83.6% | 100.0% | 100.0% | 84.0% | 8 | 12 | 13 |
| spain-id 1.1.14 | 90.0% | 77.8% | 86.9% | 36.4% | 100.0% | 82.4% | 9 | 13 | 13 |
| better-dni 4.4.2 | 73.3% | 77.8% | *unsupported* | 45.5% | 100.0% | 71.9% | 0 | 18 | 7 |
| dni-js 1.0.0 | 76.7% | 77.8% | *unsupported* | 45.5% | 100.0% | 73.4% | 0 | 17 | 7 |
| stdnum 1.12.6 | 90.0% | 83.3% | 63.9% | 100.0% | 80.0% | 76.8% | 23 | 6 | 29 |
| validator.js isIdentityCard(x, "ES") 13.15.35 | 80.0% | 77.8% | *unsupported* | 45.5% | 100.0% | 75.0% | 0 | 16 | 6 |
| validator.js isTaxID(x, "es-ES") 13.15.35 | 80.0% | 77.8% | *unsupported* | 100.0% | 100.0% | 84.4% | 0 | 10 | 5 |
| @maistik/validate-nif 2.0.1 | 86.7% | 77.8% | 86.9% | 45.5% | 100.0% | 82.4% | 9 | 13 | 14 |
| @kreyo/nif-validator 0.1.0 | 86.7% | 77.8% | 86.9% | 45.5% | 100.0% | 82.4% | 8 | 14 | 14 |
| jsvat (Spain) 2.5.4 | 90.0% | 83.3% | 82.0% | 100.0% | 100.0% | 86.4% | 11 | 6 | 17 |

### Canonical input only (agreement ignoring input normalization)

The same, on the fixtures whose input is already in canonical form (upper-case letters and digits that normalization leaves as they are; at most 103 of them), so a library that does not normalize (lower case, spaces, separators, a missing leading zero) is not penalized for it.

| Library | DNI | NIE | CIF | K/L/M | Other | All | False accepts | False rejects | On a documented decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **nif-dni-nie-cif-validation (this build) 2.0.0+1166241** | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 0 | 0 | 0 |
| nif-dni-nie-cif-validation (previous major) 1.0.11 | 100.0% | 100.0% | 86.2% | 100.0% | 100.0% | 92.2% | 8 | 0 | 8 |
| spain-id 1.1.14 | 100.0% | 100.0% | 86.2% | 36.4% | 100.0% | 85.4% | 9 | 6 | 8 |
| better-dni 4.4.2 | 100.0% | 100.0% | *unsupported* | 45.5% | 100.0% | 86.7% | 0 | 6 | 0 |
| dni-js 1.0.0 | 100.0% | 100.0% | *unsupported* | 45.5% | 100.0% | 86.7% | 0 | 6 | 0 |
| stdnum 1.12.6 | 100.0% | 100.0% | 62.1% | 100.0% | 75.0% | 77.7% | 23 | 0 | 23 |
| validator.js isIdentityCard(x, "ES") 13.15.35 | 100.0% | 100.0% | *unsupported* | 45.5% | 100.0% | 86.7% | 0 | 6 | 0 |
| validator.js isTaxID(x, "es-ES") 13.15.35 | 100.0% | 100.0% | *unsupported* | 100.0% | 100.0% | 100.0% | 0 | 0 | 0 |
| @maistik/validate-nif 2.0.1 | 100.0% | 100.0% | 86.2% | 45.5% | 100.0% | 86.4% | 8 | 6 | 8 |
| @kreyo/nif-validator 0.1.0 | 100.0% | 100.0% | 86.2% | 45.5% | 100.0% | 86.4% | 8 | 6 | 8 |
| jsvat (Spain) 2.5.4 | 100.0% | 100.0% | 81.0% | 100.0% | 100.0% | 89.3% | 11 | 0 | 11 |

### Representative disagreements

Up to six per library, the first of each SPEC rule ("expected" is what SPEC.md says).

- **nif-dni-nie-cif-validation (this build)**: none.
- **nif-dni-nie-cif-validation (previous major)** (20 disagreements):
  - `"G1234567D"`: expected invalid (INVALID_CONTROL_CHARACTER), got valid (CIF-3, G needs a digit (valid only in lenient mode)). *Documented SPEC decision: control of C D F G J U V: a digit only by default (a letter only with cifControl: lenient).*
  - `" 12345678Z "`: expected valid, got invalid (NORM-2, surrounding spaces).
  - `"12345678-Z"`: expected valid, got invalid (NORM-3, hyphen).
  - `"1234567L"`: expected valid, got invalid (NORM-4, 7-digit DNI, canonical 01234567L). *Documented SPEC decision: a DNI with fewer than 8 digits is left-padded with zeros.*
  - `"x-0123456-7l"`: expected valid, got invalid (NIE-3, old NIE form with separators). *Documented SPEC decision: the old 10-character NIE form X0nnnnnnnL is valid.*
- **spain-id** (22 disagreements):
  - `"K1234567L"`: expected valid, got invalid (KLM-2, K: Spaniard under 14 without DNI).
  - `"K0867756N"`: expected valid, got invalid (KLM-1, v1 test value).
  - `"L2222222P"`: expected valid, got invalid (NIF-1, K, L or M first selects the K/L/M format).
  - `"M7654321J"`: expected valid, got invalid (KLM-3, the 7 characters after the prefix are digits).
  - `"X01234567L"`: expected valid, got invalid (NIE-3, old 10-character form, canonical X1234567L). *Documented SPEC decision: the old 10-character NIE form X0nnnnnnnL is valid.*
  - `"G1234567D"`: expected invalid (INVALID_CONTROL_CHARACTER), got valid (CIF-3, G needs a digit (valid only in lenient mode)). *Documented SPEC decision: control of C D F G J U V: a digit only by default (a letter only with cifControl: lenient).*
- **better-dni** (18 disagreements):
  - `"K1234567L"`: expected valid, got invalid (KLM-2, K: Spaniard under 14 without DNI).
  - `"K0867756N"`: expected valid, got invalid (KLM-1, v1 test value).
  - `"L2222222P"`: expected valid, got invalid (NIF-1, K, L or M first selects the K/L/M format).
  - `"M7654321J"`: expected valid, got invalid (KLM-3, the 7 characters after the prefix are digits).
  - `"X01234567L"`: expected valid, got invalid (NIE-3, old 10-character form, canonical X1234567L). *Documented SPEC decision: the old 10-character NIE form X0nnnnnnnL is valid.*
  - `" 12345678Z "`: expected valid, got invalid (NORM-2, surrounding spaces).
- **dni-js** (17 disagreements):
  - `"K1234567L"`: expected valid, got invalid (KLM-2, K: Spaniard under 14 without DNI).
  - `"K0867756N"`: expected valid, got invalid (KLM-1, v1 test value).
  - `"L2222222P"`: expected valid, got invalid (NIF-1, K, L or M first selects the K/L/M format).
  - `"M7654321J"`: expected valid, got invalid (KLM-3, the 7 characters after the prefix are digits).
  - `"X01234567L"`: expected valid, got invalid (NIE-3, old 10-character form, canonical X1234567L). *Documented SPEC decision: the old 10-character NIE form X0nnnnnnnL is valid.*
  - `" 12345678Z "`: expected valid, got invalid (NORM-2, surrounding spaces).
- **stdnum** (29 disagreements):
  - `"X01234567L"`: expected valid, got invalid (NIE-3, old 10-character form, canonical X1234567L). *Documented SPEC decision: the old 10-character NIE form X0nnnnnnnL is valid.*
  - `"B1234567D"`: expected invalid (INVALID_CONTROL_CHARACTER), got valid (CIF-3, B needs a digit). *Documented SPEC decision: control of C D F G J U V: a digit only by default (a letter only with cifControl: lenient).*
  - `"1234567L"`: expected valid, got invalid (NORM-4, 7-digit DNI, canonical 01234567L). *Documented SPEC decision: a DNI with fewer than 8 digits is left-padded with zeros.*
  - `"ES12345678Z"`: expected invalid (INVALID_FORMAT), got valid (VAT-1, the ES prefix needs allowVatPrefix). *Documented SPEC decision: an ES prefix is not a NIF (it needs allowVatPrefix).*
- **validator.js isIdentityCard(x, "ES")** (16 disagreements):
  - `"K1234567L"`: expected valid, got invalid (KLM-2, K: Spaniard under 14 without DNI).
  - `"K0867756N"`: expected valid, got invalid (KLM-1, v1 test value).
  - `"L2222222P"`: expected valid, got invalid (NIF-1, K, L or M first selects the K/L/M format).
  - `"M7654321J"`: expected valid, got invalid (KLM-3, the 7 characters after the prefix are digits).
  - `"X01234567L"`: expected valid, got invalid (NIE-3, old 10-character form, canonical X1234567L). *Documented SPEC decision: the old 10-character NIE form X0nnnnnnnL is valid.*
  - `"12 345 678 Z"`: expected valid, got invalid (NORM-2, inner spaces).
- **validator.js isTaxID(x, "es-ES")** (10 disagreements):
  - `"X01234567L"`: expected valid, got invalid (NIE-3, old 10-character form, canonical X1234567L). *Documented SPEC decision: the old 10-character NIE form X0nnnnnnnL is valid.*
  - `" 12345678Z "`: expected valid, got invalid (NORM-2, surrounding spaces).
  - `"12345678-Z"`: expected valid, got invalid (NORM-3, hyphen).
  - `"1.234.567-l"`: expected valid, got invalid (NORM-4, 7 digits with separators). *Documented SPEC decision: a DNI with fewer than 8 digits is left-padded with zeros.*
- **@maistik/validate-nif** (22 disagreements):
  - `"K1234567L"`: expected valid, got invalid (KLM-2, K: Spaniard under 14 without DNI).
  - `"K0867756N"`: expected valid, got invalid (KLM-1, v1 test value).
  - `"L2222222P"`: expected valid, got invalid (NIF-1, K, L or M first selects the K/L/M format).
  - `"M7654321J"`: expected valid, got invalid (KLM-3, the 7 characters after the prefix are digits).
  - `"X01234567L"`: expected valid, got invalid (NIE-3, old 10-character form, canonical X1234567L). *Documented SPEC decision: the old 10-character NIE form X0nnnnnnnL is valid.*
  - `"G1234567D"`: expected invalid (INVALID_CONTROL_CHARACTER), got valid (CIF-3, G needs a digit (valid only in lenient mode)). *Documented SPEC decision: control of C D F G J U V: a digit only by default (a letter only with cifControl: lenient).*
- **@kreyo/nif-validator** (22 disagreements):
  - `"K1234567L"`: expected valid, got invalid (KLM-2, K: Spaniard under 14 without DNI).
  - `"K0867756N"`: expected valid, got invalid (KLM-1, v1 test value).
  - `"L2222222P"`: expected valid, got invalid (NIF-1, K, L or M first selects the K/L/M format).
  - `"M7654321J"`: expected valid, got invalid (KLM-3, the 7 characters after the prefix are digits).
  - `"X01234567L"`: expected valid, got invalid (NIE-3, old 10-character form, canonical X1234567L). *Documented SPEC decision: the old 10-character NIE form X0nnnnnnnL is valid.*
  - `"G1234567D"`: expected invalid (INVALID_CONTROL_CHARACTER), got valid (CIF-3, G needs a digit (valid only in lenient mode)). *Documented SPEC decision: control of C D F G J U V: a digit only by default (a letter only with cifControl: lenient).*
- **jsvat (Spain)** (17 disagreements):
  - `"X01234567L"`: expected valid, got invalid (NIE-3, old 10-character form, canonical X1234567L). *Documented SPEC decision: the old 10-character NIE form X0nnnnnnnL is valid.*
  - `"B1234567D"`: expected invalid (INVALID_CONTROL_CHARACTER), got valid (CIF-3, B needs a digit). *Documented SPEC decision: control of C D F G J U V: a digit only by default (a letter only with cifControl: lenient).*
  - `"1234567L"`: expected valid, got invalid (NORM-4, 7-digit DNI, canonical 01234567L). *Documented SPEC decision: a DNI with fewer than 8 digits is left-padded with zeros.*

## Bundle size

Minified and gzipped size (**min+gzip, lower is smaller**), with the minified size in parentheses, of the equivalent import of the call, bundled with esbuild like `pnpm size` does (bundle, minify, tree shaking, gzip level 9, the cost of an empty import subtracted). "Whole library" imports everything the package exports. Libraries published as CommonJS cannot be tree-shaken, so their single function costs the whole library. Multi-country and multi-purpose libraries (stdnum, validator.js) are larger by design.

| Library | DNI | NIE | CIF | any | Whole library |
| --- | ---: | ---: | ---: | ---: | ---: |
| **nif-dni-nie-cif-validation (this build) 2.0.0+1166241** | 623 B (1,362 B) | 586 B (1,231 B) | 568 B (1,124 B) | 929 B (2,130 B) | 4,679 B (13,004 B) |
| nif-dni-nie-cif-validation (previous major) 1.0.11 | 1,517 B (5,697 B) | 1,517 B (5,697 B) | 1,518 B (5,697 B) | 1,517 B (5,697 B) | 1,514 B (5,686 B) |
| spain-id 1.1.14 | 165 B (192 B) | 237 B (335 B) | 363 B (551 B) | 583 B (1,069 B) | 704 B (1,262 B) |
| better-dni 4.4.2 | 1,135 B (2,618 B) | 1,135 B (2,618 B) | *unsupported* | 1,134 B (2,620 B) | 1,132 B (2,612 B) |
| dni-js 1.0.0 | 883 B (1,542 B) | 882 B (1,542 B) | *unsupported* | 882 B (1,544 B) | 880 B (1,536 B) |
| stdnum 1.12.6 | 51,063 B (210,969 B) | 51,063 B (210,969 B) | 51,063 B (210,969 B) | 51,063 B (210,969 B) | 51,054 B (210,953 B) |
| validator.js isIdentityCard(x, "ES") 13.15.35 | 2,539 B (5,670 B) | 2,539 B (5,670 B) | *unsupported* | 2,539 B (5,670 B) | 44,449 B (133,464 B) |
| validator.js isTaxID(x, "es-ES") 13.15.35 | 6,537 B (18,796 B) | 6,537 B (18,796 B) | *unsupported* | 6,537 B (18,796 B) | 44,449 B (133,464 B) |
| @maistik/validate-nif 2.0.1 | 215 B (277 B) | 243 B (316 B) | 319 B (451 B) | 456 B (813 B) | 1,189 B (2,280 B) |
| @kreyo/nif-validator 0.1.0 | 533 B (935 B) | 533 B (935 B) | 533 B (935 B) | 533 B (935 B) | 746 B (1,403 B) |
| jsvat (Spain) 2.5.4 | 1,186 B (2,417 B) | 1,186 B (2,417 B) | 1,186 B (2,417 B) | 1,186 B (2,417 B) | 5,266 B (16,115 B) |

Other imports, for reference:

- stdnum, deep import of the Spanish NIF module (not documented): 2,468 B (7,694 B).

The imports measured:

| Library | DNI | NIE | CIF | any | Whole library |
| --- | --- | --- | --- | --- | --- |
| nif-dni-nie-cif-validation (this build) | `import { isValidDni } from "dist/esm/index.mjs";` | `import { isValidNie } from "dist/esm/index.mjs";` | `import { isValidCif } from "dist/esm/index.mjs";` | `import { isValidNif } from "dist/esm/index.mjs";` | `import * as lib from "dist/esm/index.mjs";` |
| nif-dni-nie-cif-validation (previous major) | `import { isValidDni } from "nif-v1";` | `import { isValidNie } from "nif-v1";` | `import { isValidCif } from "nif-v1";` | `import { isValidNif } from "nif-v1";` | `import * as lib from "nif-v1";` |
| spain-id | `import { validDNI } from "spain-id";` | `import { validNIE } from "spain-id";` | `import { validCIF } from "spain-id";` | `import { validateSpanishId } from "spain-id";` | `import * as lib from "spain-id";` |
| better-dni | `import { isNIF } from "better-dni";` | `import { isNIE } from "better-dni";` | *unsupported* | `import { isValid } from "better-dni";` | `import * as lib from "better-dni";` |
| dni-js | `import { isDNI } from "dni-js";` | `import { isNIE } from "dni-js";` | *unsupported* | `import { isValid } from "dni-js";` | `import * as lib from "dni-js";` |
| stdnum | `import { stdnum } from "stdnum"; console.log(stdnum.ES.dni.validate);` | `import { stdnum } from "stdnum"; console.log(stdnum.ES.nie.validate);` | `import { stdnum } from "stdnum"; console.log(stdnum.ES.cif.validate);` | `import { stdnum } from "stdnum"; console.log(stdnum.ES.nif.validate);` | `import { stdnum } from "stdnum";` |
| validator.js isIdentityCard(x, "ES") | `import isIdentityCard from "validator/es/lib/isIdentityCard";` | `import isIdentityCard from "validator/es/lib/isIdentityCard";` | *unsupported* | `import isIdentityCard from "validator/es/lib/isIdentityCard";` | `import validator from "validator";` |
| validator.js isTaxID(x, "es-ES") | `import isTaxID from "validator/es/lib/isTaxID";` | `import isTaxID from "validator/es/lib/isTaxID";` | *unsupported* | `import isTaxID from "validator/es/lib/isTaxID";` | `import validator from "validator";` |
| @maistik/validate-nif | `import { isValidDNI } from "@maistik/validate-nif";` | `import { isValidNIE } from "@maistik/validate-nif";` | `import { isValidCIF } from "@maistik/validate-nif";` | `import { isValid } from "@maistik/validate-nif";` | `import * as lib from "@maistik/validate-nif";` |
| @kreyo/nif-validator | `import { isValid } from "@kreyo/nif-validator";` | `import { isValid } from "@kreyo/nif-validator";` | `import { isValid } from "@kreyo/nif-validator";` | `import { isValid } from "@kreyo/nif-validator";` | `import * as lib from "@kreyo/nif-validator";` |
| jsvat (Spain) | `import { checkVAT, spain } from "jsvat"; console.log(checkVAT, spain);` | `import { checkVAT, spain } from "jsvat"; console.log(checkVAT, spain);` | `import { checkVAT, spain } from "jsvat"; console.log(checkVAT, spain);` | `import { checkVAT, spain } from "jsvat"; console.log(checkVAT, spain);` | `import * as lib from "jsvat";` |

## Notes on each library

- **nif-dni-nie-cif-validation (this build)** 2.0.0+1166241 (this build, https://github.com/josegoval/nif-dni-nie-cif-validation). Default options: the input is normalized (NORM-1 to NORM-4) and CIF control characters follow CIF-3.
- **nif-dni-nie-cif-validation (previous major)** 1.0.11 (our previous major version, https://github.com/josegoval/nif-dni-nie-cif-validation). The previous major version. It is published as CommonJS only, so a bundler cannot drop what an import doesn't use.
- **spain-id** 1.1.14 (competitor, https://github.com/coixinet/spain-id).
- **better-dni** 4.4.2 (competitor, https://github.com/singuerinc/better-dni). DNI and NIE only: no CIF. Its documentation says that it validates a DNI (NIE / NIF), and it doesn't normalize (spaces and separators are rejected).
- **dni-js** 1.0.0 (competitor, https://github.com/albertfdp/dni-js). DNI and NIE only: no CIF. It is published as CommonJS only.
- **stdnum** 1.12.6 (competitor, https://github.com/koblas/stdnum-js). A multi-country library (about 90 countries): its size is larger by design. `ES.nif` validates DNI, NIE, K/L/M and CIF.
- **validator.js isIdentityCard(x, "ES")** 13.15.35 (competitor, https://github.com/validatorjs/validator.js). Spanish DNI and NIE only: validator.js has no CIF check. The one call covers both, so the DNI and NIE rows use the same function. A multi-purpose library (emails, URLs, and more).
- **validator.js isTaxID(x, "es-ES")** 13.15.35 (competitor, https://github.com/validatorjs/validator.js). Its source (`src/lib/isTaxID.js`, which the README points to for the exact support) says persons only: DNI and NIE, no CIF. The one call covers both. Its size includes the tax ID rules of every country it supports.
- **@maistik/validate-nif** 2.0.1 (competitor, https://github.com/Maistik-Studio/validate-nif).
- **@kreyo/nif-validator** 0.1.0 (competitor, https://github.com/kreyo-io/nif-validator). One function for every type, so every row uses `isValid`. K/L/M NIFs are only accepted with the option `includeDeprecated: true`; the benchmark uses the default, as its documentation does.
- **jsvat (Spain)** 2.5.4 (competitor, https://github.com/se-panfilov/jsvat), input transform: prefix "ES" (outside the timed loop). A VAT number validator (deprecated on npm, repository archived): every input is prefixed with "ES" before it is validated, and the prefix is added outside the timed loop and outside the agreement check of the library. It does not accept a bare NIF.
