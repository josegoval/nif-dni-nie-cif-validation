# Benchmark

- Date: 2026-09-30T17:57:20.703Z
- Machine: Apple M1, 8 cores, 16 GiB, darwin 25.3.0 (arm64)
- Node.js v22.22.3, tinybench 6.2.0, 2000 ms per task after 500 ms of warmup
- Mixed input set: 1001 fixed strings (500 valid, 100 valid in lower case, 250 with a wrong control character, 151 junk); canonical set: 720 9-character upper-case documents, valid or with a wrong control; typed set: 500 valid documents with separators, spaces or lower case. See bench/inputs.mjs.

Millions of validations per second (higher is better), ± relative margin of error.

## Booleans on the mixed input set, against v1.0.11

"v1-compatible" is `{"normalize":false,"cifControl":"lenient"}`, checked to give the v1.0.11 results; "v2 defaults" normalizes the input and follows CIF-3.

| Function | v1.0.11 | v2, v1-compatible | v2 defaults | Speed-up (v1-compatible) | Target |
| --- | ---: | ---: | ---: | ---: | --- |
| `isValidNif` | 6.42 ±0.12% | 48.53 ±0.02% | 31.15 ±0.03% | 7.56× | ≥ 5× (met) |
| `isValidNaturalPersonNif` | 11.00 ±0.08% | 61.72 ±0.02% | 42.25 ±0.03% | 5.61× | — |
| `isValidDni` | 19.21 ±0.05% | 80.56 ±0.02% | 51.80 ±0.03% | 4.19× | ≥ 2.5× (met) |
| `isValidNie` | 21.58 ±0.05% | 93.36 ±0.02% | 70.33 ±0.02% | 4.33× | ≥ 2.5× (met) |
| `isValidCif` | 13.55 ±0.06% | 68.48 ±0.02% | 58.34 ±0.02% | 5.05× | ≥ 2.5× (met) |
| `isValidDniLetter` | 8.66 ±0.1% | 35.44 ±0.03% | 29.87 ±0.03% | 4.09× | — |
| `isValidCifControlCode` | 4.84 ±0.13% | 21.85 ±0.03% | 17.77 ±0.04% | 4.51× | — |

## Booleans on canonical input (the fast path)

Base: refactor/v2-core (PR #76). Budget: the v2 defaults at most 10% slower than the base.

| Function | base | v2 defaults | v2 / base | Budget | v2 on typed input (normalized) |
| --- | ---: | ---: | ---: | --- | ---: |
| `isValidNif` | 49.29 ±0.02% | 47.73 ±0.02% | 0.97× | met | 7.40 ±0.09% |
| `isValidNaturalPersonNif` | 86.12 ±0.02% | 79.30 ±0.02% | 0.92× | met | 9.49 ±0.08% |
| `isValidDni` | 120.89 ±0.01% | 111.87 ±0.01% | 0.93× | met | 12.97 ±0.07% |
| `isValidNie` | 174.75 ±0.01% | 175.66 ±0.01% | 1.01× | met | 14.14 ±0.07% |
| `isValidCif` | 103.12 ±0.01% | 96.29 ±0.01% | 0.93× | met | 12.74 ±0.07% |
| `isValidDniLetter` | 46.22 ±0.03% | 44.97 ±0.02% | 0.97× | met | 12.98 ±0.06% |
| `isValidCifControlCode` | 24.45 ±0.03% | 24.68 ±0.03% | 1.01× | met | 7.08 ±0.09% |

## validate()

`validate()` allocates its result object (and a message when invalid).

| Input set | validate() |
| --- | ---: |
| mixed | 10.44 ±0.11% |
| canonical | 11.44 ±0.09% |
| typed | 6.06 ±0.1% |

Reproduce with `pnpm bench` (and `BENCH_BASE=<dist dir> BENCH_BASE_LABEL=<name> pnpm bench` for the canonical comparison). Numbers depend on the machine; compare the ratios, not the absolute values.
