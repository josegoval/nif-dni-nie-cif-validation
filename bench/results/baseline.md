# Benchmark: current code vs v1.0.11

- Date: 2026-09-30T12:53:00.181Z
- Machine: Apple M1, 8 cores, 16 GiB, darwin 25.3.0 (arm64)
- Node.js v22.22.3, tinybench 6.2.0, 2000 ms per task after 500 ms of warmup
- Input set: 1001 fixed strings (500 valid, 100 valid in lower case, 250 with a wrong control character, 151 junk), see bench/inputs.mjs

Millions of validations per second (higher is better), ± relative margin of error.

| Function | v1.0.11 (before) | current (after) | Speed-up | Target |
| --- | ---: | ---: | ---: | --- |
| `isValidNif` | 2.03 ±1.81% | 17.29 ±0.22% | 8.52× | ≥ 5× (met) |
| `isValidNaturalPersonNif` | 3.54 ±0.97% | 24.39 ±0.24% | 6.88× | — |
| `isValidDni` | 6.76 ±0.61% | 32.75 ±0.15% | 4.84× | ≥ 2.5× (met) |
| `isValidNie` | 7.61 ±0.44% | 39.51 ±0.13% | 5.19× | ≥ 2.5× (met) |
| `isValidCif` | 4.86 ±0.64% | 28.53 ±0.18% | 5.87× | ≥ 2.5× (met) |
| `isValidDniLetter` | 2.94 ±1.07% | 13.76 ±0.33% | 4.68× | — |
| `isValidCifControlCode` | 1.61 ±1.5% | 9.28 ±0.35% | 5.75× | — |

Reproduce with `pnpm bench`. Numbers depend on the machine; compare the speed-ups, not the absolute values.
