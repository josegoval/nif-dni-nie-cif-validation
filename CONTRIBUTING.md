# Contributing

Thanks for helping improve `nif-dni-nie-cif-validation`.

## Development setup

The package manager is [pnpm](https://pnpm.io/). The exact version is pinned in `packageManager` in `package.json`; with [Corepack](https://nodejs.org/api/corepack.html) enabled (`corepack enable`) or a recent pnpm, the right version is used automatically. Development needs Node 22.12 or newer (Vitest 5 requires it) and the release pipeline runs on Node 24, which `.nvmrc` pins (`nvm use`). The published package itself supports Node 20 and newer. `.editorconfig` sets the basic editor settings; Biome enforces the formatting.

```sh
pnpm install --frozen-lockfile   # also installs the Husky commit-msg hook
pnpm lint                        # Biome: lint rules, formatting and import order
pnpm format                      # Biome: fix what it can (formatting, import order, safe lint fixes)
pnpm typecheck                   # tsc --noEmit
pnpm test                        # Vitest, with coverage (100% enforced)
pnpm build                       # compiles to dist/esm (ES modules) and dist/cjs (CommonJS)
pnpm size                        # builds, then checks the bundle size budgets (size-limit)
pnpm check:es                    # builds, then checks that dist/ uses no syntax newer than ES2016
pnpm spell                       # cspell: spelling of code, tests, docs and CI files
pnpm spec:check                  # rule IDs in src/ and tests match SPEC.md; every rule has a valid and an invalid fixture
pnpm spec:sources                # reads the official sources and reports what changed (see Official sources)
pnpm spec:sources:update         # the same, then records the values read in spec-sources.json
pnpm bench                       # builds, then benchmarks against v1.0.11
pnpm bench:competitors           # builds, then benchmarks against other libraries (bench/README.md)
pnpm readme:bench                # writes the generated parts of README.md and README.es.md from bench/results/latest.json
pnpm docs:llms                   # writes llms-full.txt from README.md, docs/api-design.md, MIGRATION.md and SPEC.md
pnpm docs:jsdoc                  # builds, then checks the JSDoc of every export (see JSDoc)
pnpm examples:install            # packs the package and installs the dependencies of examples/ (see Examples)
pnpm examples:check              # runs every example's check, except Deno and Bun (see Examples)
node scripts/check-tree-shaking.mjs <tarball>   # bundles the packed tarball, see Build and package layout
node scripts/check-adapters.mjs <tarball>       # runs the /zod, /valibot and /yup adapters from import and require
```

`tsconfig.json` type-checks the library, the tests and the Vitest config without emitting anything. `tsconfig.build.json` extends it and emits the ES modules and type declarations of `src/` (without tests) into `dist/esm`; `tsconfig.build.cjs.json` extends that one and emits CommonJS into `dist/cjs`. All use `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `verbatimModuleSyntax` (the CommonJS build turns the last one off, because TypeScript refuses ES module syntax in CommonJS output with it; the type check and the ES module build have already enforced it).

`pnpm install` runs `husky` through the `prepare` script, which installs the git hooks. If you installed with `HUSKY=0` or cloned without running install, run `pnpm prepare` once.

## Project structure

```
src/
  index.ts      entry point: the public exports (keep the names stable)
  nif.ts        isValidNif, isValidNaturalPersonNif: pick the format from the first character
  dni.ts        DNI and K/L/M NIF (DNI-*, KLM-*)
  nie.ts        NIE (NIE-*)
  cif.ts        NIF of a legal person or entity, formerly CIF (CIF-*)
  normalize.ts  normalize() and the boolean validators' retry path (NORM-*, NIE-3)
  policy.ts     opt-in policies: placeholders (POLICY-1)
  validate.ts   validate() and getNifType(): error codes and rules
  organisations.ts  describeCifOrganisation(): CIF organisation keys
  localize.ts   picks a text from the caller's locale, or English (validate() and describeCifOrganisation() only)
  locales/      one locale object per language: en.ts (built in, the default), es.ts, ...
  vat.ts        isValidSpanishVat() (VAT-1)
  format.ts     format() and computeControlCharacter()
  generate/     opt-in test-data generators, the `/generate` entry point: index.ts (public API), core.ts (valid values), invalid.ts (generateInvalid), random.ts (mulberry32)
  adapter.ts    the core of the schema adapters: validate() mapped to a normalized value or an error
  zod/ valibot/ yup/  the opt-in schema adapters (`/zod`, `/valibot`, `/yup`), one index.ts each
  shared.ts     internal helpers
  types.ts      public types
  __tests__/    Vitest tests, one file per module plus cross-cutting suites
test/fixtures/  SPEC test values as JSON, run by src/__tests__/fixtures.test.ts
test/smoke/     smoke tests of the packed tarball, CommonJS and ES module (plain Node, see Pull requests)
bench/          benchmarks: against v1.0.11 and another build, and against other libraries (see Performance)
examples/       runnable projects that use the package, their own pnpm workspace (see Examples)
website/        the website (Astro + Starlight, GitHub Pages), its own pnpm workspace (see Website)
scripts/        build script, CI helpers: coverage summary, SPEC rule and JSDoc checks, tree-shaking check, README and llms-full.txt generators, official sources check
spec-sources.json  the official sources SPEC.md cites and their recorded values (see Official sources)
.size-limit.json  bundle size budgets (see Build and package layout)
```

Each module starts with a header comment: what the document is, its format and its control algorithm, with the [SPEC.md](SPEC.md) rule IDs. The `isValid*` functions validate in a single pass with `charCodeAt`: no regex, no `split`/`replace`/template strings and no allocations on the hot path. With normalization on (the default), a value that fails the raw check is normalized and checked again only when normalizing could change the verdict (see `normalizedForRetry` in normalize.ts); keep that retry out of the hot function. `validate()` may allocate. The messages and organisation names live in the locale objects (`src/locales/`), which the booleans must not import, so they stay out of bundles that only use the booleans. Only English is imported by the library itself (`localize.ts`); every other language is imported by the application, so it only reaches the bundles that use it. The exported regexes (`DNI_REGEX` and so on) are public constants kept for compatibility; the validators don't use them.

### Build and package layout

`pnpm build` runs `scripts/build.mjs`, which has no dependency besides TypeScript. It compiles twice and gives the output its final file names:

```
dist/esm/   index.mjs, nif.mjs, ..., locales/es.mjs, ...    ES modules, with index.d.mts, ...
dist/cjs/   index.cjs, nif.cjs, ..., locales/es.cjs, ...    CommonJS, with index.d.cts, ...
```

The sources import each other without file extensions (`from "./nif"`) and the type check uses bundler module resolution. Node resolves ES module imports by exact file name, so after each compile the script renames `.js`/`.d.ts` to `.mjs`/`.d.mts` or `.cjs`/`.d.cts`, rewrites the relative imports to match and checks that each one points to a file that exists. Each `.d.mts` or `.d.cts` points to its own format, so TypeScript users get the right types with `import` and with `require`. The output is deliberately not one bundled file: modules stay separate so bundlers can drop what an application doesn't import.

`package.json` is what makes this work, so change it with care:

- `"type": "module"`: `.js` files in the repository are ES modules. The published files all have explicit `.mjs` or `.cjs` extensions.
- `exports`: `"."` and one `"./locales/<code>"` per language, `"./generate"` and one entry point per schema adapter (`"./zod"`, `"./valibot"`, `"./yup"`), each with an `import` and a `require` condition with its own `types`, plus `"./package.json"`. Nothing else is importable, so a file moved inside `dist/` is not a breaking change. `main`, `module` and `types` are fallbacks for tools that ignore `exports`; `typesVersions` does the same for the locale, generate and adapter entry points, so TypeScript's old `node10` resolution finds their types.
- `"sideEffects": false`: every module only declares things, so a bundler may drop a module whose exports are unused. Don't add top-level code that does work when the module loads, not even filling a lookup table (see Size budgets).
- `files`: `dist` plus the standard files (README, LICENSE, CHANGELOG) and the files for AI assistants (`llms.txt`, `llms-full.txt`, `AGENTS.md`), so an agent that only sees `node_modules` finds them.

The emitted code targets ES2016 (`target` in `tsconfig.json`), as v1 did, so it runs in every current browser without transpiling. ES2018 would emit the same code, because the sources use nothing that TypeScript rewrites between the two. `pnpm check:es` runs `es-check` on both builds: no syntax and no built-in newer than ES2016 (ES2016 is a real floor: `Array.prototype.includes` is in `policy.ts`). Raise the `target` and that check together, and never to something your browser support doesn't cover.

**Size budgets.** `pnpm size` builds and runs [size-limit](https://github.com/ai/size-limit) with its esbuild plugin and `.size-limit.json`: it bundles `import { x } from "dist/esm/index.mjs"` for each entry, minifies, gzips and fails if the result is over the `limit`. The entries are the four boolean validators, `isValidSpanishVat`, `validate` (with the English messages and organisation names, built in), `validate` with one more language (`locales/es`) and the whole ES module build (English only: the other languages are not in the root entry point), plus three entries for the opt-in `/generate` entry point (`generateDni`, `generateInvalid` and everything), bundled from `dist/esm/generate/index.mjs`, and one per schema adapter (`zNif`, `vNif`, `yNif`) that leaves the schema library out with the entry's `"ignore"`, so the number is what the adapter adds. The budgets sit a few percent above the measured sizes, so they catch a real regression (for example a boolean that starts importing a locale, or `validate` pulling in a second language) and not noise. When a change is meant to grow the library, say why in the PR and raise the limit in the same commit. For reference, v1.0.11 measures 1308 B with the same tool (all its functions, CommonJS). The sizes are measured with esbuild; other bundlers differ by a few percent.

| Entry (`.size-limit.json`) | Size | Limit |
| --- | ---: | ---: |
| `import { isValidNif }` | 929 B | 960 B |
| `import { isValidDni }` | 623 B | 645 B |
| `import { isValidNie }` | 586 B | 605 B |
| `import { isValidCif }` | 568 B | 580 B |
| `import { isValidSpanishVat }` | 965 B | 995 B |
| `import { validate }` (English built in) | 2719 B | 2795 B |
| `import { validate }` + `locales/es` | 3534 B | 3635 B |
| `import *` (the whole ES module build) | 4678 B | 4790 B |
| `import { generateDni }` from `/generate` | 1895 B | 1955 B |
| `import { generateInvalid }` from `/generate` | 2041 B | 2100 B |
| `import *` from `/generate` (every generator) | 3130 B | 3225 B |
| `import { zNif }` from `/zod` (without Zod) | 3066 B | 3160 B |
| `import { vNif }` from `/valibot` (without Valibot) | 3160 B | 3255 B |
| `import { yNif }` from `/yup` (without Yup) | 3108 B | 3205 B |

**The accepted size targets.** The first plan for the package (#48) asked for a single validator of at most 600 B and the whole core of at most 1.2 kB, minified and gzipped. Those numbers were set before the v2 API, and the revised budgets above are the accepted targets: `isValidNif` 960 B, `isValidDni` 645 B, `isValidNie` 605 B, `isValidCif` 580 B, and the whole ES module build 4.79 kB. Each validator is smaller than in v1, where any single import costs 1,517 B minified and gzipped (`bench/results/latest.json`, which is also where the README and the site take their numbers). The whole library is bigger than v1 (1,514 B) because v2 adds much more: `validate()` with its English messages and organisation names, `normalize()`, `format()` and `isValidSpanishVat()` in the root entry point, and, as separate entry points that the 4.79 kB does not include, the other languages, the generators and the schema adapters. A consumer pays only for what it imports, so the budget of each validator is the one that matters. Keep the limits where they are, and raise one only with the reason in the same commit.

The booleans stay this small because they never reach `normalize()` or `validate()`: their slow path only removes separators (`removeSeparators`) and checks again, and POLICY-1 reads the number of the document (`isPlaceholderDocument`). Keep module-level code to declarations: a table filled by a loop when the module loads can't be dropped by a bundler, so prefer a string or arithmetic.

**Tree shaking check.** `node scripts/check-tree-shaking.mjs <tarball>` unpacks the tarball into a temporary project, bundles one import at a time with esbuild (resolving the package and its locale entry points through `exports`, as a consumer does), and looks for each locale's marker strings and module in the output. It fails if the bundle of any boolean validator, `normalize`, `format`, `computeControlCharacter` or `getNifType` contains any locale or the `localize` or `organisations` module; if `validate` or `describeCifOrganisation` bundle anything but English; or if a locale entry point bundles another language (alone, only itself; with `validate`, only itself and English). The checks that expect a locale also prove its markers can be found, so the script can't pass by looking for strings it can't see. It also covers the opt-in entry points (`/generate`, `/zod`, `/valibot`, `/yup`): no core import may bundle any of their modules, their code (an error message only they contain) or an import of a schema library, and each of them must bundle itself when imported, which proves the check can see it. The schema libraries are external in the check, as in an application; an adapter must bundle English only (and with `locales/es`, English and Spanish only), like `validate`. CI runs it on the tarball that `Check` packs.

### How to add a language

1. Copy `src/locales/es.ts` to `src/locales/<code>.ts` (`<code>` is the BCP 47 language code) and translate every text. Rename the object to `<code>`, set `code`, and keep `export default`. The `NifLocale` type makes TypeScript fail if a text is missing.
2. Organisation names: look for an official text in that language that lists the keys of Orden EHA/451/2008 (the AEAT's pages in that language, a regional official bulletin), put the names in the singular and cite the URL in a comment. Mark every name without an official source `// translated (no official version found)`.
3. Add the language to `LOCALES` in `src/__tests__/locales.test.ts`, the smoke tests (`test/smoke/`) and `scripts/check-tree-shaking.mjs` (two marker strings only that language has).
4. Add `"./locales/<code>"` to `exports` in `package.json`, with the same four paths as the other languages.
5. Document it: a section in [docs/translations.md](docs/translations.md) (source of each organisation name, terminology), the language tables in README.md and MIGRATION.md, and the `NifLocale` JSDoc in `src/types.ts`.
6. Ask for a language review in the PR: a native speaker, or at least a second model, reads every message and organisation name.

### Rule IDs and SPEC.md

Every validation branch in `src/` cites the rule it implements in a comment (`// CIF-3`), and every rule has a test whose name starts with its ID (`it("CIF-3: ...")`, or a case table with `rule: "CIF-3"`). `pnpm spec:check` (`scripts/check-spec-rules.mjs`, also run in CI) fails if an ID in `src/` or in a test is not defined in SPEC.md, or if a SPEC rule has no test. JSON fixtures under `test/` count as tests. Rules that can't have a test yet would be listed, with a reason, in `NOT_TESTED_YET` inside the script; it is empty since v2.

It also fails unless every SPEC rule has at least one **valid** fixture (`"expected": "valid"`, the rule passing) and one **invalid** fixture (an error code, the rule that the error cites) in `test/fixtures/*.json`. A rule where one polarity can't exist is listed in `POLARITY_EXEMPTIONS` in the script, with the missing polarity and a one-line reason: input cleanup (NORM-*) never rejects, INPUT-1 and INPUT-2 only reject, and so on. The list must stay honest: the check fails if an exempted rule is no longer in SPEC.md, or if the exempted polarity now has a fixture. `scripts/check-spec-rules.test.mjs` tests this logic.

### Official sources

The law and the official pages change: RD 1553/2005 (DNI) was repealed in 2025, and Orden EHA/451/2008 was amended in 2016. The workflow `.github/workflows/spec-sources.yml` ("Official sources") checks them on the 1st of every month and opens an issue labelled `spec-change` when one has changed. It runs `scripts/spec-sources.mjs` (no dependencies), which compares each source with the values recorded in `spec-sources.json`:

| Source | Read from | Recorded values |
|---|---|---|
| T1, consolidated BOE texts (`act.php`): RD 1065/2007, Orden EHA/451/2008, Orden 7/2/1997, RD 255/2025, RD 1155/2024 | The [BOE open data API](https://www.boe.es/datosabiertos/): `/legislacion-consolidada/id/<BOE id>/metadatos` and `/texto/indice` | The last update of the text (the newest date of its blocks, which is the "Última actualización" of `act.php`), the date of each article SPEC.md cites (`articles`), and the repeal, annulment and expiry flags (`N` = no) |
| T1, texts the BOE does not consolidate (`doc.php`): Orden HAP/5/2016, Orden INT/2058/2008 | The document's XML, `https://www.boe.es/diario_boe/xml.php?id=<BOE id>` | The flags, and the later references: another text that amends, corrects or repeals it |
| T2, the Ministerio del Interior and AEAT pages | The live page or, when it can't be read, its latest [Wayback Machine](https://web.archive.org/) snapshot | A SHA-256 and the length of the text of the section that matters, between the `from` and `to` markers of the source: no tags, scripts, comments or menus, so a new page design or "page updated" date doesn't change it |

The Interior page answers HTTP 403 to automated requests, so it is read from the Wayback Machine, and only changes there once the archive has a newer snapshot (the report gives the snapshot's date). A source that can't be read at all (network error, timeout, no snapshot) is reported as **unverifiable**: the job summary lists it and the run shows a warning, but it is not a change, so the job stays green and its recorded values are kept. If a source stays unverifiable for several months, check it by hand.

**When a `spec-change` issue opens:**

1. Read the changed source (the issue links it and shows the old and new values). A new date of the whole text with the same dates for the cited articles usually means another article changed; check that nothing new (an article "bis", a new provision) affects the rules. A changed page hash means the text of the section changed: compare the page with its previous [Wayback Machine](https://web.archive.org/) snapshot. A section hash of `not found` means the page was restructured: fix the `from` and `to` markers in `spec-sources.json`.
2. If a rule is affected, change SPEC.md (and its "Last verified" date), the code, the tests and the fixtures in a pull request, as in [How to propose a change](SPEC.md#how-to-propose-a-change). A change of what is accepted by default is a breaking change.
3. Run `pnpm spec:sources:update`, which records the current values and the date in `spec-sources.json` (an unverifiable source keeps its values), review the diff, commit it (`chore(spec): record the official sources of <date>`, or in the pull request of step 2), and close the issue.

The issue is not opened twice for the same changes: its body ends with a fingerprint of them, and the workflow skips the issue when an open `spec-change` issue has the same one. To check the whole path, run the workflow from the Actions tab with **simulate_change** on: it replaces one recorded value in memory and opens an issue titled `[simulated] Official source changed: …`, which you then close.

To check locally, `pnpm spec:sources` prints the same report (it needs network access and writes nothing; `--report <file>` writes it to a file). `node scripts/spec-sources.mjs --simulate-change` shows a simulated change. To watch a new source, add it to `spec-sources.json` (`kind` is `boe-consolidated`, `boe-document` or `page`, with `articles` or `section` as above) and run `pnpm spec:sources:update`. `scripts/spec-sources.test.mjs` tests the script with saved answers in `scripts/fixtures/spec-sources/`, without network.

### JSDoc

What an IDE or an AI agent reads is `dist/*.d.mts`, so the JSDoc of every public export is part of the API. `pnpm docs:jsdoc` (`scripts/check-jsdoc.mjs`, run in the `Check` job) reads the declarations of every entry point in `package.json`'s `exports`, from both the ES module and the CommonJS types, and fails when an export lacks:

- a **summary**: one sentence that says what the function accepts ("a DNI, a K/L/M NIF or a NIE");
- **`@since`**: `1.0.0` for what v1.0.0 exported (the list is in the script), `2.0.0` for the rest;
- for a **function**: a `@param` with a description for every parameter, a `@returns` that says when it returns what, **two `@example` blocks** (a valid value, and an invalid or edge case; lower case or formatted input where it applies) and a `@see` that links the SPEC.md rule. Write it as `@see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-3 SPEC.md#cif-3}`: a plain `@see SPEC.md#cif-3` is not a link in an editor (it shows "SPEC.md.cif-3"), and the script checks that the file and the anchor exist;
- a **reason and the replacement** after `@deprecated`, when it has one.

Constants and types need a summary and `@since`; give them examples too when they do something (`DNI_REGEX.test(...)`).

**An alias is a declaration of its own.** `export { isValidLegalEntityNif as isValidCif }` would show the docs of the other name on hover, so the script fails on a re-export under another name. `src/cif.ts` declares `export const isValidCif: typeof isValidLegalEntityNif = isValidLegalEntityNif;` with its own full JSDoc instead. It is the same function (`isValidCif === isValidLegalEntityNif`), so the behaviour and the bundle size don't change.

**Every `@example` runs.** `src/__tests__/jsdoc-examples.test.ts` extracts the `@example` blocks from `src/`, runs each one against `src/` and type-checks it, with the same runner as the README samples (`src/__tests__/snippets.ts`): a top-level statement followed by a `// value` comment must evaluate to that value, and `// throws RangeError` asserts the class of the error. Every example must assert at least one value. It may use the names that the package exports without importing them; it imports the locales (`import { es } from "nif-dni-nie-cif-validation/locales/es"`) and other libraries (`import { z } from "zod"`) itself. There is no skip list: an example that can't run is a wrong example.

### Tests

- `fixtures.test.ts` runs every entry of `test/fixtures/*.json` (`{ input, expected, type, rule, note }`) against `validate()` and the booleans, with the options of its file (`FILE_OPTIONS`; `types-dni-nie.json` runs with `types`, and `not-a-string.json` holds JSON values that are not strings, for INPUT-1). Add SPEC test values there, a valid and an invalid one per rule (`pnpm spec:check`). A new file must also be classified in `bench/accuracy.test.mjs` (compared with other libraries or not).
- `zod.test.ts`, `valibot.test.ts`, `yup.test.ts`: the adapters, run against the real libraries. Valid values normalize, every error code gives the localized message and the code and rule in the library's own place, every option is respected, a property test compares each schema with `validate()` on arbitrary strings, and `expectTypeOf` and `@ts-expect-error` check the types.
- `generate.test.ts`: the generators. 100,000 values of each type validate (with `validate()`, stdnum and a separate copy of the algorithms), every CIF key and NIE prefix is generated, no value is a placeholder, `generateInvalid` fails with exactly the requested code (100,000 values per type and code), seeded values are golden (the same on every platform), and the mulberry32 output is compared with the published reference implementation.
- `properties.test.ts` (fast-check, seeded): nothing throws, generated documents validate, `computeControlCharacter` completes them, single-character substitutions (documented exceptions in SPEC.md), `normalize` is idempotent, and the booleans always agree with `validate()`.
- `stdnum.test.ts` compares `validate()` with stdnum on about 50,000 inputs; every difference must be in its allow-list and in SPEC.md, "Differences from other libraries".
- Every error's `rule` must be defined in SPEC.md (tested).
- `jsdoc-examples.test.ts` runs every `@example` of the JSDoc in `src/` (see JSDoc). `scripts/check-jsdoc.test.mjs` tests the script that checks the JSDoc.
- `readme-examples.test.ts` runs every ```` ```ts ````, ```` ```tsx ```` and ```` ```js ```` block of README.md, README.es.md and llms.txt against `src/`, and type-checks the TypeScript ones with tsc. A top-level statement followed by a comment that starts with a value (`isValidNif("12345678Z"); // true`, or an object over several `//` lines) must evaluate to that value; prose comments are not checked. A block that can't run here (it needs a library that is not a dev dependency) gets `<!-- readme-test: skip (reason) -->` on the line before it and an entry in `SKIP_ALLOWED`. The test also checks that both READMEs have the same blocks, that they name every export of every entry point, and that llms.txt stays under about 2,000 tokens.

### Behaviour guarantee: the differential test

`src/__tests__/differential.test.ts` compares every v1 export with the published v1.0.11, installed as the `nif-v1` dev dependency alias. It checks export names, aliases and constants, and runs every function, with the v1-compatible options `{ normalize: false, cifControl: "lenient" }`, on about 490,000 seeded inputs (valid IDs, mutations, case variants, look-alikes, every BMP code unit at the first and last position, long strings, non-strings), expecting identical results and identical errors. With the v2 defaults, it checks that every difference is one of the documented breaking changes (MIGRATION.md). A refactor or performance change must keep it green. An intended behaviour change must update the test and say so in the PR, and is a breaking change if it changes what is accepted by default (see SPEC.md).

### Performance

`pnpm bench` builds `dist/` (the CommonJS build) and runs `bench/run.mjs` with [tinybench](https://github.com/tinylibs/tinybench), on the fixed, seeded input sets in `bench/inputs.mjs`. It prints three tables and writes `bench/results/baseline.json` (with machine, Node and tinybench versions) and `bench/results/baseline.md`:

1. Every boolean validator on the mixed set: v1.0.11, the current build with the v1-compatible options (checked to give the v1.0.11 results first), and with the v2 defaults.
2. Every boolean validator on canonical input (the fast path), each in its own child process, against another build given in `BENCH_BASE` (a `dist/` directory; name it with `BENCH_BASE_LABEL`). The budget: at most 10% slower than the base. On canonical input the booleans must not allocate.
3. `validate()` on the mixed, canonical and typed (normalized) sets.

`BENCH_BASE` is a `dist/` directory with `cjs/index.cjs` (the layout of this repository) or `index.js` (branches from before the dual build). To compare with another branch, build it into a temporary directory, for example `git archive <branch> src tsconfig.json tsconfig.build.json | tar -x -C /tmp/base && pnpm exec tsc -p /tmp/base/tsconfig.build.json`, then `BENCH_BASE=/tmp/base/dist BENCH_BASE_LABEL=<branch> pnpm bench`. Commit the new results when a change affects performance, and run it on an otherwise idle machine. `BENCH_TIME_MS` and `BENCH_WARMUP_MS` change the time per task (defaults: 2000 and 500).

`pnpm bench:competitors` compares the current build with v1.0.11 and with the other Spanish ID libraries on npm: throughput per document type, agreement with the SPEC fixtures and bundle size. It writes `bench/results/latest.json`, the single source of the numbers that the README and the site show (none is typed by hand), and `latest.md`, rendered from it. `pnpm readme:bench` (`scripts/readme-bench.mjs`) writes the parts of README.md and README.es.md that come from it, between `<!-- name:start -->` and `<!-- name:end -->` markers: the size badge (`size-badge`), the Performance section (`bench`) and the comparison table (`compare`, whose features and release dates are in the script, with the date they were checked). CI runs `pnpm readme:bench --check`, which fails if either README is out of date, so commit a new `latest.json` together with the READMEs it produces. Don't edit between the markers by hand. [bench/README.md](bench/README.md) is the methodology (inputs, fairness rules, noise, the schema of the JSON); `bench/competitors.mjs` lists each library and the exact call used. The manual workflow `.github/workflows/bench.yml` runs it on `ubuntu-latest` and uploads the results as an artifact; a maintainer commits the files of a run they choose.

### Docs for AI assistants

`llms.txt` (written by hand, under about 2,000 tokens, every snippet run by `readme-examples.test.ts`) and `llms-full.txt` (generated) follow the [llms.txt](https://llmstxt.org/) convention and ship in the npm package, with `AGENTS.md`. `pnpm docs:llms` (`scripts/llms-full.mjs`) assembles `llms-full.txt` from README.md, docs/api-design.md, MIGRATION.md and SPEC.md, without the README's HTML and comments and with absolute links; CI runs `pnpm docs:llms --check`. So after changing any of those files, or running `pnpm readme:bench`, run `pnpm docs:llms` and commit `llms-full.txt` with them. Keep both files factual: no instructions aimed at agents that a human reader wouldn't see.

### Examples

`examples/` has runnable projects (Node with CommonJS and ES modules, React Hook Form with Zod, Express, Valibot, Yup, a Vitest fixture factory, a CSV bulk validation, Deno and Bun), each with its own `package.json` and a README with its run command. See [examples/README.md](examples/README.md).

- **They use the packed package.** `pnpm examples:install` runs `pnpm pack` and unpacks the tarball into `examples/.pack/package` (`scripts/pack-for-examples.mjs`; ignored by Git). Every example depends on it with `"file:../.pack/package"`, so it runs against the `exports`, the `files` and the types that npm would ship, not against `src/`. Run `pnpm examples:pack` again after changing the library.
- **They don't touch the library's install.** `examples/` is its own pnpm workspace (`examples/pnpm-workspace.yaml`, its own `pnpm-lock.yaml`), and the root `pnpm-workspace.yaml` has no `packages`, so the root `pnpm install --frozen-lockfile` never installs React, Vite or Express. The examples' workspace repeats the root's supply-chain policy: `minimumReleaseAge: 4320` and `allowBuilds` (esbuild's install script stays denied, as in the root). Dependabot is not set up for `examples/`: it would have to resolve the `file:../.pack/package` dependency, a folder that exists only after packing. Update the examples by hand with `pnpm examples:pack && pnpm --dir examples update`; GitHub's dependency alerts still read `examples/pnpm-lock.yaml`. Excluding the folder from the root workspace, rather than making the examples workspace packages of it with install filters, keeps the root install and its lockfile exactly as they were, and a change to an example can't alter the library's dependencies.
- **`pnpm check` is the check.** Every example has a `check` script that builds, type-checks or runs it with assertions, and exits with an error when the output is wrong (the CSV example takes `--expect-invalid`, the Express example posts to the app it starts).
- **CI** is `.github/workflows/examples.yml`, not a job of `release.yml`, because the examples install packages from the registry, so a failure there can come from outside this repository and must not block a release. It runs on every pull request (any change to the library can break an example) and on the release branches. A `Pack` job audits the examples' dependencies (`pnpm --dir examples audit --audit-level high`, the same threshold as the library's) and packs the library once, and a matrix runs each example in its own job: it unpacks the tarball, installs only that example (`pnpm install --filter ./<name>`), checks that `examples/pnpm-lock.yaml` didn't change (`--frozen-lockfile` can't be used, see the comment in the workflow), and runs `pnpm check`. When you add an example, add it to the matrix.
- **Deno and Bun run in CI**, with `denoland/setup-deno` and `oven-sh/setup-bun`, the official actions of the two projects, pinned to an exact release (Dependabot updates them) and only used by their own job. The package says it works there, so CI proves it: the cost is two more third-party actions, each limited to one matrix job that has no secrets (the workflow only has `contents: read`). Run them locally with `deno run main.ts` and `bun run index.ts`.

### Website

`website/` is the site published at <https://josegoval.github.io/nif-dni-nie-cif-validation/>: a landing page with a live validator, in English, Spanish, Catalan, Basque and Galician. How to run it, how it is built and how to move it to a custom domain: [website/README.md](website/README.md).

- **Its own pnpm workspace**, like `examples/`: `website/pnpm-workspace.yaml` and its own `pnpm-lock.yaml`, with the same `minimumReleaseAge` and no install script allowed, so the root install never installs Astro. The root Biome configuration ignores `website/` (it has its own `biome.json`); `pnpm spell` checks its English files.
- **It uses the library of the repository**, through `"nif-dni-nie-cif-validation": "link:.."`, resolved by the root `exports` into `dist/`: run `pnpm build` at the root before building the site. Every benchmark number on it comes from `bench/results/latest.json` at build time.
- **CI** is `.github/workflows/pages.yml`: on pull requests that touch the site or what it reads, it lints, type-checks and builds the site, checks its internal links and the live validator's JavaScript budget, and runs the Playwright tests; on a push to `master` it also runs `pnpm test` and deploys, with the coverage report at `/coverage/`.
- **Texts in other languages** are in `website/src/content/docs/<code>/`, `website/src/i18n/<code>.ts` and `website/src/content/i18n/<code>.json`; use the terms of `docs/translations.md`, and have a change reviewed in that language.

### Spelling

`pnpm spell` runs [cspell](https://cspell.org/) with `cspell.config.yaml` (English, British spelling). Real words it doesn't know, such as the Spanish legal terms quoted from the sources, go in `.cspell/project-words.txt`. `README.es.md` and `scripts/readme-bench.mjs` (which writes its Spanish parts) are checked with the Spanish (Spain) dictionary too (`@cspell/dict-es-es`, a dev dependency). The string literals of the Catalan, Basque and Galician locales (and the tree-shaking markers) are not spell-checked, by an override in `cspell.config.yaml`, and docs/translations.md turns cspell off around its tables: the project has no dictionary for those languages, and the language review covers them.

### Subpaths and peer dependencies

The main entry point (`.`) is the library; everything else is opt-in and must not reach it:

- **Opt-in subpaths**: `/generate` (test data), `/zod`, `/valibot` and `/yup` (schemas), and the `/locales/*` languages. Each is a folder of `src/` with an `index.ts`, its own `exports` and `typesVersions` entries (the four paths of the locales) and its own size budget(s). The main `src/index.ts` never imports them, and nothing in the core imports a subpath. `scripts/check-tree-shaking.mjs` fails if a core import bundles any of them.
- **Schema libraries are optional peer dependencies**, never dependencies: `peerDependencies` with a caret range from the oldest version that works, `peerDependenciesMeta.<name>.optional: true`, and a dev dependency (for the tests, pinned by the lockfile and at least 3 days old). The core has 0 runtime dependencies, and that stays true. A new adapter imports its library by name only (no deep imports, no default import), so it works from `import` and `require`; `scripts/check-adapters.mjs` must run it in both formats against the tarball, and the oldest supported version must pass it (`PEERS_NODE_MODULES` points it at another node_modules folder).
- **An adapter is a mapping, not a second implementation.** It calls `checkNif` in `src/adapter.ts` (which calls `validate()`), so every library accepts the same values, outputs the same normalized value and gives the same localized messages. Keep the names consistent (`zNif`, `vNif`, `yNif`, and `Dni`, `Nie`, `Cif`, `SpanishVat`), expose the error code and the SPEC rule where the library allows it, and add a property test that compares the schema with `validate()`.
- **Do not add a schema library to `test/smoke`**: the smoke tests install only the tarball and stay dependency-free. The Vitest tests and `check-adapters.mjs` cover the adapters.

### Supply-chain settings

Run `pnpm audit` to see known vulnerabilities in the dependency tree; CI runs `pnpm audit --audit-level high` and fails on high or critical advisories. If a transitive dependency has a fix upstream has not picked up yet, pin the patched version with `overrides` in `pnpm-workspace.yaml` and explain why in a comment next to it.

`pnpm-workspace.yaml` holds the pnpm settings:

- `minimumReleaseAge: 4320` only installs versions that are at least 3 days old, so a compromised release is usually pulled before we can install it. Dependabot has a matching 3-day `cooldown`. `minimumReleaseAgeExclude` lists exact versions exempted from it, each with a reason; today only our own `nif-dni-nie-cif-validation@1.0.11` (the `nif-v1` alias of the differential test and the benchmark), which can go once it is 3 days old.
- `allowBuilds` is an allow-list of dependencies that may run install scripts. Everything else is blocked, and the install fails if a new dependency ships an unreviewed script. Add a package there only after reviewing its script.

## Commit convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). The release tooling reads them to decide the next version and to write the changelog, so a wrong message can skip a release or publish the wrong version.

```
<type>(<optional scope>): <description>

<optional body>

<optional footer>
```

| Type                                                     | Effect on the next release   |
| -------------------------------------------------------- | ---------------------------- |
| `fix`, `perf`                                            | patch (`1.0.11` to `1.0.12`) |
| `feat`                                                   | minor (`1.0.11` to `1.1.0`)  |
| `feat!`, `fix!`, or a `BREAKING CHANGE:` footer          | major (`1.0.11` to `2.0.0`)  |
| `docs`, `chore`, `ci`, `build`, `test`, `refactor`, `style` | no release                |

`perf` releases a patch (semantic-release's default rules), so use it only for a change that ships in `dist/` and keeps behaviour identical.

Examples:

```
fix: accept NIE numbers that start with Z
feat: export a validateIban helper
ci: run tests on Node 24
feat!: drop support for Node 16

BREAKING CHANGE: Node 16 is no longer supported.
```

Enforcement:

- Locally, a Husky `commit-msg` hook runs commitlint and rejects a message such as `bad message`.
- On pull requests, the **CI** workflow lints every commit in the `Check` job, and the **PR title** workflow checks the title. Fix a failing commit with `git rebase -i` and a force-push, or reword the PR title in the GitHub UI.

Keep commits atomic: one logical change per commit, with a message that explains why.

## Pull requests

- Open PRs against `master`. The **CI** workflow (`.github/workflows/release.yml`) must pass before merging:
  - `Check (Node 24)`: dependency audit (fails on high or critical advisories), commit lint, Biome lint, spell check (`pnpm spell`), SPEC rule ID check (`pnpm spec:check`), the README sections generated from the benchmark (`pnpm readme:bench --check`) and `llms-full.txt` (`pnpm docs:llms --check`), type check, tests with 100% coverage enforced (including the differential test against v1.0.11), coverage summary and report, the size budgets (`pnpm size`), the JSDoc of every export (`node scripts/check-jsdoc.mjs`), the ES2016 syntax check (`pnpm check:es`), then packs the tarball, checks that it tree-shakes (`scripts/check-tree-shaking.mjs`), checks it with `publint --strict` and `@arethetypeswrong/cli` (green in every resolution mode) and uploads it as the `package-tarball` artifact.
  - `Compat (Node 20)`: runs after `Check`. It installs that tarball into an empty folder on Node 20 (the minimum supported version, `engines.node` in `package.json`) and runs the smoke tests in `test/smoke/` with Node's built-in test runner: `smoke.test.cjs` loads the package with `require()` and `smoke.test.mjs` with `import`. It installs no dev dependencies, so it proves what a consumer gets. Run it locally with `pnpm pack`, then install the tarball in a temporary folder and `node --test` copies of both files from there.
  - `PR title`: checks that the pull request title is a valid Conventional Commit (see `.github/workflows/pr-title.yml`).
  - `Pages` (`.github/workflows/pages.yml`), when the site or what it reads changes: builds and tests the site (see Website). Also a separate workflow.
  - `Examples` (`.github/workflows/examples.yml`): packs the library and runs each project of `examples/` in its own job against it (see Examples). It is a separate workflow and not part of the release gate, so a registry outage can't block a release.
- Stacked PRs (a PR whose base is another PR's branch) are fine. Merge them bottom-up and retarget each PR to `master` after its parent merges.

### How to merge

Use **merge commits or rebase-merge** so the atomic commits from the branch reach `master` and semantic-release can see each `fix`, `feat` and breaking change separately.

Use **squash merge only if the PR title is a valid Conventional Commit**, because the title becomes the single commit message. A squashed PR that mixes a `feat` and a `fix` hides one of them from the changelog, so prefer merge or rebase in that case. The PR title is linted for this reason.

## How releases are cut

Releases are fully automated with [semantic-release](https://semantic-release.gitbook.io/) and need no manual step or version bump.

1. A PR is merged into `master`. Other release branches are `next`, `next-major`, `beta` (prerelease), `alpha` (prerelease) and maintenance branches such as `1.x`. See `.releaserc`.
2. The same **CI** workflow runs `Check` and `Compat` on the pushed commit. Only if both pass does its `Release` job build and run `semantic-release`, so tests run once per push.
3. semantic-release reads the commits since the last tag and works out the next version. If no commit is releasable (`fix`, `feat` or breaking), nothing is published.
4. When a release is due, it updates `CHANGELOG.md` and `package.json`, publishes to npm, creates the GitHub release and tag, and pushes a `chore(release): x.y.z [skip ci]` commit.

### Protected `master`

The "Protect master" ruleset (Settings, Rules) blocks force pushes and deleting `master`, and requires `Check (Node 24)`, `Compat (Node 20)` and `PR title` to pass before anything lands on it. Repository admins can bypass it.

The release commit can't carry those checks, so semantic-release pushes it with a write **deploy key** (Settings, Deploy keys, "semantic-release (release commit)"), which the ruleset lets bypass. Its private key is the `RELEASE_DEPLOY_KEY` Actions secret, used by the checkout step of the `Release` job; `.releaserc` sets an SSH `repositoryUrl` so the push goes through it. To rotate it, create a new key pair, replace the deploy key and the secret, and delete the old key. GitHub releases, tags and comments keep using `GITHUB_TOKEN`.

Publishing uses [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC) with provenance. There is no npm token to create or rotate. The trusted publisher is configured on npmjs.com (package Settings, Trusted publishing, GitHub Actions) for the repository `josegoval/nif-dni-nie-cif-validation` and the workflow filename `release.yml`. If you rename the workflow, update that setting too.

Do not run `npm publish` by hand. The `prepack` script builds `dist/` so a tarball is never empty, but only the workflow publishes with provenance.

### Coverage

Coverage never leaves GitHub; there is no third-party service:

- Every CI run on Node 24 writes a coverage table to the run's **job summary** (`scripts/coverage-summary.mjs`) and uploads the HTML report as the `coverage-report` artifact.
- The website publishes the HTML report of `master` at <https://josegoval.github.io/nif-dni-nie-cif-validation/coverage/>, and a badge made from `coverage/coverage-summary.json` (`scripts/coverage-badge.mjs`, called by `website/integrations/repo-files.mjs`): `/coverage/badge.json` in the [shields.io endpoint](https://shields.io/badges/endpoint-badge) schema, from which shields.io draws the README's badge (it only reads that file), and `/coverage/badge.svg` for embedding directly.
- `.github/badges/coverage.svg`, a static badge, is no longer used by the docs, but the README of 2.0.0 on npmjs.com still shows it (from `master`). Delete it once a release has published the current README.
- Run `pnpm test` and then `node scripts/coverage-summary.mjs` to see the same table locally. The HTML report is in `coverage/html/index.html`.
