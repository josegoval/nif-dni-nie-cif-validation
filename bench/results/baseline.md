# Benchmark

- Date: 2026-09-30T19:59:32.119Z
- Machine: Apple M1, 8 cores, 16 GiB, darwin 25.3.0 (arm64)
- Node.js v22.22.3, tinybench 6.2.0, 2000 ms per task after 500 ms of warmup
- Mixed input set: 1001 fixed strings (500 valid, 100 valid in lower case, 250 with a wrong control character, 151 junk); canonical set: 720 9-character upper-case documents, valid or with a wrong control; typed set: 500 valid documents with separators, spaces or lower case. See bench/inputs.mjs.

Millions of validations per second (higher is better), ± relative margin of error.

## Booleans on the mixed input set, against v1.0.11

"v1-compatible" is `{"normalize":false,"cifControl":"lenient"}`, checked to give the v1.0.11 results; "v2 defaults" normalizes the input and follows CIF-3.

| Function | v1.0.11 | v2, v1-compatible | v2 defaults | Speed-up (v1-compatible) | Target |
| --- | ---: | ---: | ---: | ---: | --- |
| `isValidNif` | 6.48 ±0.11% | 51.07 ±0.01% | 32.46 ±0.02% | 7.88× | ≥ 5× (met) |
| `isValidNaturalPersonNif` | 11.07 ±0.06% | 62.34 ±0.01% | 43.09 ±0.02% | 5.63× | — |
| `isValidDni` | 19.27 ±0.04% | 82.10 ±0.01% | 51.38 ±0.01% | 4.26× | ≥ 2.5× (met) |
| `isValidNie` | 21.64 ±0.04% | 94.01 ±0.01% | 68.24 ±0.01% | 4.35× | ≥ 2.5× (met) |
| `isValidCif` | 13.53 ±0.05% | 67.93 ±0.01% | 55.87 ±0.02% | 5.02× | ≥ 2.5× (met) |
| `isValidDniLetter` | 8.71 ±0.09% | 35.69 ±0.02% | 29.68 ±0.02% | 4.10× | — |
| `isValidCifControlCode` | 4.88 ±0.1% | 21.54 ±0.02% | 17.45 ±0.03% | 4.41× | — |

## Booleans on canonical input (the fast path)

Base: build/dual-esm-cjs (#79). Budget: the v2 defaults at most 10% slower than the base.

| Function | base | v2 defaults | v2 / base | Budget | v2 on typed input (normalized) |
| --- | ---: | ---: | ---: | --- | ---: |
| `isValidNif` | 47.47 ±0.01% | 47.30 ±0.01% | 1.00× | met | 10.44 ±0.06% |
| `isValidNaturalPersonNif` | 79.53 ±0.01% | 79.51 ±0.01% | 1.00× | met | 11.25 ±0.07% |
| `isValidDni` | 111.92 ±0.01% | 112.14 ±0.01% | 1.00× | met | 13.39 ±0.06% |
| `isValidNie` | 176.01 ±0.01% | 175.82 ±0.01% | 1.00× | met | 21.38 ±0.04% |
| `isValidCif` | 96.57 ±0.01% | 93.74 ±0.01% | 0.97× | met | 17.55 ±0.04% |
| `isValidDniLetter` | 45.08 ±0.01% | 44.99 ±0.01% | 1.00× | met | 13.68 ±0.05% |
| `isValidCifControlCode` | 22.84 ±0.02% | 24.72 ±0.02% | 1.08× | met | 7.05 ±0.09% |

## validate()

`validate()` allocates its result object (and a message when invalid).

| Input set | validate() |
| --- | ---: |
| mixed | 10.12 ±0.1% |
| canonical | 10.79 ±0.08% |
| typed | 5.67 ±0.08% |

Reproduce with `pnpm bench` (and `BENCH_BASE=<dist dir> BENCH_BASE_LABEL=<name> pnpm bench` for the canonical comparison). Numbers depend on the machine; compare the ratios, not the absolute values.
