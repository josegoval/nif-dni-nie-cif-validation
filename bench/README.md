# Benchmarks

This folder holds the public, reproducible benchmarks of `nif-dni-nie-cif-validation` (#49). There are two:

| Benchmark | Run it with | Compares | Writes |
| --- | --- | --- | --- |
| Competitors | `pnpm bench:competitors` | this build against v1.0.11 and the other Spanish ID libraries on npm: throughput, agreement with SPEC.md, bundle size | `results/latest.json` and `results/latest.md` |
| Against v1 and another build | `pnpm bench` | every boolean validator against v1.0.11, and against another build (see CONTRIBUTING.md, "Performance") | `results/baseline.json` and `results/baseline.md` |

This document is the methodology of the first one. **`results/latest.json` is the single source of the numbers** on the README, the landing page and the benchmarks page: none of them is typed by hand, each one links here, and `results/latest.md` is rendered from the JSON (`pnpm bench:report`), so it cannot disagree with it.

If a competitor is faster or smaller at something, the results show it. Read them with the caveats below.

## Run it yourself

```sh
pnpm install --frozen-lockfile
pnpm bench:competitors              # builds dist/, runs everything (a few minutes), writes bench/results/latest.*
pnpm bench:competitors --out /tmp/x # write somewhere else instead
pnpm bench:report                   # render latest.md again from latest.json
```

`BENCH_TIME_MS` (default 2000) and `BENCH_WARMUP_MS` (default 500) set the time of each task. Shorter times only widen the margin of error, which is useful for a quick check of a change to the benchmark itself (for example `BENCH_TIME_MS=50 BENCH_WARMUP_MS=10`). Close other programs first, and compare ratios, not absolute numbers: see [Noise](#noise-on-shared-machines).

The libraries are dev dependencies with exact versions (`package.json`, `pnpm-lock.yaml`), so a run installs exactly what `latest.json` says. `latest.json` also records the commit it measured.

## What is compared

Every library is called the way its own documentation shows, with its default options, on the raw input string. **`competitors.mjs` is the single list of libraries and of the exact call for each document type.** The throughput loop and the accuracy check are compiled from those very call texts, and `latest.md` prints them ("What was called"), so what is listed is what ran.

| Library | DNI | NIE | CIF | any type |
| --- | --- | --- | --- | --- |
| this build | `isValidDni(x)` | `isValidNie(x)` | `isValidCif(x)` | `isValidNif(x)` |
| this package, v1.0.11 (`nif-v1`) | `isValidDni(x)` | `isValidNie(x)` | `isValidCif(x)` | `isValidNif(x)` |
| [spain-id](https://www.npmjs.com/package/spain-id) | `validDNI(x)` | `validNIE(x)` | `validCIF(x)` | `validateSpanishId(x)` |
| [better-dni](https://www.npmjs.com/package/better-dni) | `isNIF(x)` | `isNIE(x)` | unsupported | `isValid(x)` |
| [dni-js](https://www.npmjs.com/package/dni-js) | `dni.isDNI(x)` | `dni.isNIE(x)` | unsupported | `dni.isValid(x)` |
| [stdnum](https://www.npmjs.com/package/stdnum) | `stdnum.ES.dni.validate(x).isValid` | `stdnum.ES.nie.validate(x).isValid` | `stdnum.ES.cif.validate(x).isValid` | `stdnum.ES.nif.validate(x).isValid` |
| [validator](https://www.npmjs.com/package/validator), identity card | `validator.isIdentityCard(x, "ES")` | the same call | unsupported | the same call |
| [validator](https://www.npmjs.com/package/validator), tax ID | `validator.isTaxID(x, "es-ES")` | the same call | unsupported | the same call |
| [@maistik/validate-nif](https://www.npmjs.com/package/@maistik/validate-nif) | `isValidDNI(x)` | `isValidNIE(x)` | `isValidCIF(x)` | `isValid(x)` |
| [@kreyo/nif-validator](https://www.npmjs.com/package/@kreyo/nif-validator) | `isValid(x)` | `isValid(x)` | `isValid(x)` | `isValid(x)` |
| [jsvat](https://www.npmjs.com/package/jsvat), Spain | `checkVAT(x, countries).isValid` | the same call | the same call | the same call |

The versions of each run are in `latest.json` (`contenders[].version`) and `latest.md`. Notes on particular libraries:

- **Included**: every library on the list of #49 that exists on npm, is at least 3 days old (`minimumReleaseAge`), has no install script and validates Spanish IDs, plus `@kreyo/nif-validator` and `jsvat`. Libraries not on the list were not evaluated; add one by adding an entry to `competitors.mjs` (the registry test, `competitors.test.mjs`, checks that every call runs and answers correctly on a valid and an invalid document).
- **validator.js** has two Spanish functions and no CIF check at all, so its rows are DNI and NIE only. One call covers both types, so the DNI and NIE rows use the same function. It is a multi-purpose library: its bundle includes the rules of every country.
- **better-dni** and **dni-js** have no CIF validator: CIF is *unsupported*. better-dni accepts lower case but rejects spaces and separators; dni-js accepts lower case and one space or hyphen before the letter (its `normalize()` is a separate function that `isValid` does not call).
- **stdnum** is the JavaScript port of python-stdnum for about 90 countries. `ES.nif` validates every type (DNI, NIE, K/L/M and CIF).
- **@kreyo/nif-validator** has one function for every type, so all its rows use `isValid`. It accepts K/L/M NIFs only with the option `includeDeprecated: true`; the benchmark uses the default, like its documentation, so its K/L/M figures are false rejects with respect to SPEC.md.
- **jsvat** validates VAT numbers (the repository is archived and the package is deprecated on npm). For Spain a VAT number is `ES` plus a NIF, so **its inputs get an `ES` prefix**, added before timing (the inputs are transformed once, outside the timed loop), and the same in the agreement check. `countries` is `[spain]`, built once outside the call. This is the one exception to "the raw input string". It is included because it is easy, and with this caveat.
- **Our own v1.0.11** is installed as the `nif-v1` dev alias. It is published as CommonJS only, so a bundler cannot drop what an import does not use.

## Throughput

Millions of validations per second (**M ops/s, higher is faster**), per document type and on a mixed set, on the same fixed inputs, in one process.

### Inputs

All inputs are in `inputs.mjs`, generated from a seeded pseudo-random generator (mulberry32, seed 49), so every run and every machine measures exactly the same strings. The sets never change once published: new sets are generated after the existing ones.

| Set | Strings | What |
| --- | ---: | --- |
| DNI | 225 | 150 valid DNI in canonical form (8 digits and the control letter), plus 75 of them with a wrong control letter |
| NIE | 150 | 100 valid NIE (X, Y or Z, 7 digits and a letter), plus 50 with a wrong control letter |
| CIF | 270 | 180 valid CIF with every organisation key, plus 90 with a wrong control character |
| Mixed | 1001 | 500 valid documents (DNI, K/L/M, NIE, old-form NIE, CIF), 100 of them again in lower case, 250 with a wrong control character, 151 junk strings (wrong lengths, random characters, the empty string). The same set as the v1 comparison |

The per-type sets are canonical (9 upper-case characters, no separators) on purpose: every library can read them without normalizing, so the figure compares the validation itself and not which library does extra work on input that others reject. Lower case and junk are in the mixed set.

### Method

- One task call validates the whole set; the figure is validations per second (task calls per second times the number of inputs).
- The loop of each task is compiled from the call text in `competitors.mjs` with `new Function`. Each call site is its own monomorphic site, the call is exactly the listed one, and no wrapper function sits between the loop and the library. Library calls that read a property (`dni.isDNI(x)`, `stdnum.ES.nif.validate(x).isValid`) read it on every call, as a program written from the documentation does.
- [tinybench](https://github.com/tinylibs/tinybench) runs each task for `BENCH_WARMUP_MS` of warmup and then `BENCH_TIME_MS` (defaults: 500 ms and 2000 ms) in a single process. The libraries of a set run back to back, and **the order rotates from set to set**, so no library always runs first or last.
- The margin is tinybench's relative margin of error (`rmePercent`, ± percent of ops/s) over the samples of the run.
- Before timing, every call runs once over its set. A call that throws fails the run. The number of inputs it accepts is recorded (`accepted`): on the DNI, NIE and CIF sets every library accepts exactly the valid documents; on the mixed set the libraries accept different numbers (some reject lower case, some reject K/L/M), which also changes the work they do, so read the mixed figures with that in mind.
- **Relative speed-ups** (`subjectSpeedup`) are this build's ops/s divided by the library's, from the same run. Above 1 this build is faster; below 1 the library is faster, and the report lists those libraries per type. Ratios hold across machines better than absolute numbers.
- **Unsupported types**: a library without a call for a type is marked *unsupported* in that type's set and gets no figure: it is neither fast nor slow there. The mixed set contains every type, so it is timed only for libraries that cover DNI, NIE and CIF.

### What this does not measure

Memory, cold start (the first call, before the JIT has warmed up), the cost of `validate()` (this package's detailed result), input that needs normalization, or throughput under concurrency. A library that rejects a string early is fast on it. That is why the agreement is reported separately.

## Agreement with SPEC.md

The share of the fixtures of `test/fixtures` that each library judges as SPEC.md says, per document type. **This is agreement with SPEC.md (whose rules come from the official sources, each rule with its tier), not correctness in the absolute.**

- **Fixtures**: the files that test the default options: `dni`, `klm`, `nie`, `cif`, `normalization`, `placeholders-default` and `vat-default`. The files that test an option that no other library has (lenient CIF control, no normalization, rejected placeholders, VAT prefix allowed) are left out; a test guards that every fixture file is classified.
- **Judging**: every library is called with its "any type" call and default options on the fixture input. A fixture is *valid* or *invalid* in SPEC.md (the error code does not matter). A *false accept* is an invalid fixture that the library accepts; a *false reject* is a valid one that it rejects. A throw counts as a rejection.
- **Buckets**: a fixture belongs to its document type (DNI, NIE, CIF, K/L/M); a fixture without a type (an invalid format) belongs to the type of its rule (for example `CIF-1`); the rest is "Other" (an `ES` prefix, separators only). K/L/M NIFs are official natural-person NIFs, so the K/L/M column is measured for every library, even those that do not document them.
- **Unsupported**: a type the library has no validator for (CIF for better-dni, dni-js and validator.js) is left out of its figures. "All" therefore covers only the supported types: compare the columns, not "All", across libraries of a different scope.
- **Canonical input only** ("agreement ignoring input normalization"): the same on the fixtures whose input is upper-case letters and digits that this package's normalization leaves unchanged. A library that does not normalize (lower case, spaces, separators, a missing leading zero) is not penalized there.
- **Documented SPEC decisions**: a disagreement is marked when it is one of the decisions that SPEC.md lists in "Differences from other libraries": the control of the CIF keys C, D, F, G, J, U and V is a digit only by default (`cifControl: "lenient"` is opt-in, the decision approved on 2026-09-30), the old 10-character NIE form is valid, a DNI with fewer than 8 digits is left-padded, white space other than a space is ignored, non-ASCII look-alikes are not folded to ASCII, the `ES` prefix is not a NIF, and the 7 characters after K, L or M must be digits. The "On a documented decision" column counts them; the rest of the disagreements are differences that SPEC.md does not document.
- **Representative disagreements**: up to six per library (the first of each SPEC rule), with the input, what SPEC.md says and what the library said.

**Limits, in the open.** The rules and the fixtures were written by the maintainers of this package, so this package agrees with them by construction (and v1.0.11 is shown to see how much changed in v2). The figure that says something is each *other* library's. A library can disagree with SPEC.md and still be right for its users (accepting a letter control for every CIF key is a legitimate choice for legacy data); the documented-decision column and the canonical view exist so the reader can tell those apart. Several decisions of SPEC.md come from sources with a lower tier than the law (T3 and T4 in SPEC.md): see there, "Known conflicts between sources".

## Bundle size

The minified and gzipped size (**min+gzip, lower is smaller**) of the equivalent single-function import of each call, and of the whole library. The method is the one of `pnpm size` (`@size-limit/esbuild` and `@size-limit/file`): an entry file imports the function and uses it (`console.log`), esbuild bundles it (bundle, minify identifiers, syntax and whitespace, tree shaking), gzip runs at level 9, and the cost of an empty import (34 B minified, 46 B gzipped) is subtracted, as size-limit does. So the figures for this package equal the ones of `pnpm size`.

- Imports are the ones each library documents: `import { fn } from "pkg"`, `validator/es/lib/<fn>` for validator.js, `import { stdnum } from "stdnum"` for stdnum. `latest.md` lists the exact import measured for each cell.
- Libraries published as CommonJS (v1.0.11, better-dni, dni-js) cannot be tree-shaken, so a single function costs the whole library.
- Multi-country and multi-purpose libraries (stdnum, validator.js) are larger by design; stdnum is also measured with a deep import of its Spanish module (not documented), for reference.
- A smaller library costs less to ship. This package is larger than a few of the others for one function because it normalizes input (NORM-1 to NORM-4), follows CIF-3, and supports K/L/M; that is shown, not hidden.

## Noise on shared machines

The margin in each figure is the sampling noise **within** a run. It says nothing about what else the machine was doing, which can shift all the figures of a run together, or some of them. On a shared machine (a GitHub runner, a laptop with other programs open, thermal throttling) absolute numbers vary between runs by more than the margin; the ratios between libraries of one run vary far less, because every library runs in the same minutes. So:

- compare ratios (speed-ups) across machines and runs, not M ops/s;
- run it more than once before drawing a conclusion from a small difference (below about 1.2x, treat the libraries as equal);
- a figure measured on a GitHub runner (`ubuntu-latest`, a shared virtual machine whose CPU model can change between runs) is reproducible in kind, not to the digit. `latest.json` records the machine, and on GitHub the runner image.

## The workflow

`.github/workflows/bench.yml` runs the benchmark on `ubuntu-latest`, on demand (**Actions, Benchmark, Run workflow**), and uploads `latest.json` and `latest.md` as the `benchmark-results` artifact (and the markdown as the run's summary). It does not commit anything. A maintainer downloads the artifact of a run they choose and commits the files to `bench/results/`. It has no `release` trigger: a release published by `GITHUB_TOKEN` does not start other workflows.

## The schema of `latest.json`

`schema.mjs` checks this schema (`validateResults`), and `results.test.mjs` runs it on the committed file, so `pnpm test` fails if the file and this document drift apart. It also checks what can be recomputed: the speed-ups, the totals and the agreement percentages. `latest.md` must be exactly what `bench/report.mjs` renders from the JSON.

| Field | Type | Meaning |
| --- | --- | --- |
| `schemaVersion` | `1` | Version of this schema |
| `generatedAt` | ISO date | When the run started to write its results |
| `git.sha`, `git.dirty` | 40-character hash or `null`, boolean | The commit that was measured, and whether there were uncommitted changes outside `bench/results` |
| `machine.cpu`, `cores`, `memoryGiB`, `os`, `arch` | text, number, number, text, text | The machine |
| `machine.runner` | text or `null` | The GitHub runner image when run on GitHub |
| `node`, `tinybench` | text | Versions |
| `config.timePerTaskMs`, `warmupPerTaskMs` | number | Time per task and warmup per task |
| `config.order` | text | How tasks are ordered |
| `subject` | text | The `id` of the library that the speed-ups are for: `current` |
| `inputSets.<set>` | object | For `DNI`, `NIE`, `CIF` and `mixed`: `count` (strings) and `description` |
| `contenders[]` | objects | One per library: `id`, `label`, `kind` (`subject`, `previous` or `competitor`), `package` (npm name), `version`, `homepage`, `calls` (`DNI`, `NIE`, `CIF`, `any`: the call text or `null`), `supports` (`DNI`, `NIE`, `CIF`: booleans), `inputTransform` (text or `null`), `notes` (texts) |
| `throughput.<set>.<id>` | object | `status` is `ok` or `unsupported`. `ok` has `opsPerSecond` (validations per second), `rmePercent` (± percent), `samples`, `inputs`, `accepted` and `subjectSpeedup` (subject ops/s over this library's, same run). `unsupported` has `reason` |
| `accuracy.fixtures` | object | `files`, `total` and `byBucket` (`DNI`, `NIE`, `CIF`, `KLM`, `general`: fixture counts) |
| `accuracy.results.<id>.all`, `.canonical` | objects | For `overall` and each bucket: `supported`, then (when `true`) `total`, `agree`, `falseAccepts`, `falseRejects`, `onDocumentedDecisions`, `threw` and `agreementPercent` (`null` with no fixtures). An unsupported bucket is only `{ "supported": false }` |
| `accuracy.results.<id>.disagreements[]` | objects | `input`, `expected`, `got` (`valid` or `invalid`), `kind` (`falseAccept` or `falseReject`), `rule` (SPEC.md), `note`, `documentedDecision` (text or `null`); at most six |
| `accuracy.results.<id>.disagreementCount` | number | All the disagreements on the fixtures |
| `sizes.<id>.<key>` | object or `null` | For `DNI`, `NIE`, `CIF`, `any` and `full`: `import` (what was bundled), `minBytes`, `gzipBytes`; `null` when unsupported. `alternatives[]` has the same plus a `label` |

## Changing the benchmark

Change `competitors.mjs` to add or change a library or a call, and run `pnpm test`: the registry test runs every call. Regenerate the results when the benchmark, a library version or the code changes, and say in the commit on which machine. Keep the honesty rules: each library as its documentation recommends, default options, no extra work around a competitor that this package does not do too, and every caveat stated.
