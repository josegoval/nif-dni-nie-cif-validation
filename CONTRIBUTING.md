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
pnpm spec:check                  # rule IDs in src/ and tests match SPEC.md
pnpm bench                       # builds, then benchmarks against v1.0.11
node scripts/check-tree-shaking.mjs <tarball>   # bundles the packed tarball, see Build and package layout
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
  shared.ts     internal helpers
  types.ts      public types
  __tests__/    Vitest tests, one file per module plus cross-cutting suites
test/fixtures/  SPEC test values as JSON, run by src/__tests__/fixtures.test.ts
test/smoke/     smoke tests of the packed tarball, CommonJS and ES module (plain Node, see Pull requests)
bench/          benchmark against v1.0.11 and another build (see Performance)
scripts/        build script, CI helpers: coverage summary, SPEC rule check, tree-shaking check
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
- `exports`: `"."` and one `"./locales/<code>"` per language and `"./generate"`, each with an `import` and a `require` condition with its own `types`, plus `"./package.json"`. Nothing else is importable, so a file moved inside `dist/` is not a breaking change. `main`, `module` and `types` are fallbacks for tools that ignore `exports`; `typesVersions` does the same for the locale and generate entry points, so TypeScript's old `node10` resolution finds their types.
- `"sideEffects": false`: every module only declares things, so a bundler may drop a module whose exports are unused. Don't add top-level code that does work when the module loads, not even filling a lookup table (see Size budgets).
- `files`: `dist` plus the standard files (README, LICENSE, CHANGELOG).

The emitted code targets ES2016 (`target` in `tsconfig.json`), as v1 did, so it runs in every current browser without transpiling. ES2018 would emit the same code, because the sources use nothing that TypeScript rewrites between the two. `pnpm check:es` runs `es-check` on both builds: no syntax and no built-in newer than ES2016 (ES2016 is a real floor: `Array.prototype.includes` is in `policy.ts`). Raise the `target` and that check together, and never to something your browser support doesn't cover.

**Size budgets.** `pnpm size` builds and runs [size-limit](https://github.com/ai/size-limit) with its esbuild plugin and `.size-limit.json`: it bundles `import { x } from "dist/esm/index.mjs"` for each entry, minifies, gzips and fails if the result is over the `limit`. The entries are the four boolean validators, `isValidSpanishVat`, `validate` (with the English messages and organisation names, built in), `validate` with one more language (`locales/es`) and the whole ES module build (English only: the other languages are not in the root entry point), plus three entries for the opt-in `/generate` entry point (`generateDni`, `generateInvalid` and everything), bundled from `dist/esm/generate/index.mjs`. The budgets sit a few percent above the measured sizes, so they catch a real regression (for example a boolean that starts importing a locale, or `validate` pulling in a second language) and not noise. When a change is meant to grow the library, say why in the PR and raise the limit in the same commit. For reference, v1.0.11 measures 1308 B with the same tool (all its functions, CommonJS). The sizes are measured with esbuild; other bundlers differ by a few percent.

| Entry (`.size-limit.json`) | Size | Limit |
| --- | ---: | ---: |
| `import { isValidNif }` | 929 B | 960 B |
| `import { isValidDni }` | 624 B | 645 B |
| `import { isValidNie }` | 586 B | 605 B |
| `import { isValidCif }` | 562 B | 580 B |
| `import { isValidSpanishVat }` | 965 B | 995 B |
| `import { validate }` (English built in) | 2713 B | 2795 B |
| `import { validate }` + `locales/es` | 3528 B | 3635 B |
| `import *` (the whole ES module build) | 4648 B | 4790 B |
| `import { generateDni }` from `/generate` | 1897 B | 1955 B |
| `import { generateInvalid }` from `/generate` | 2040 B | 2100 B |
| `import *` from `/generate` (every generator) | 3132 B | 3225 B |

The booleans stay this small because they never reach `normalize()` or `validate()`: their slow path only removes separators (`removeSeparators`) and checks again, and POLICY-1 reads the number of the document (`isPlaceholderDocument`). Keep module-level code to declarations: a table filled by a loop when the module loads can't be dropped by a bundler, so prefer a string or arithmetic.

**Tree shaking check.** `node scripts/check-tree-shaking.mjs <tarball>` unpacks the tarball into a temporary project, bundles one import at a time with esbuild (resolving the package and its locale entry points through `exports`, as a consumer does), and looks for each locale's marker strings and module in the output. It fails if the bundle of any boolean validator, `normalize`, `format`, `computeControlCharacter` or `getNifType` contains any locale or the `localize` or `organisations` module; if `validate` or `describeCifOrganisation` bundle anything but English; or if a locale entry point bundles another language (alone, only itself; with `validate`, only itself and English). The checks that expect a locale also prove its markers can be found, so the script can't pass by looking for strings it can't see. It also covers the opt-in entry points (`/generate`): no core import may bundle any of their modules or their code (an error message only they contain), and each of them must bundle itself when imported, which proves the check can see it. CI runs it on the tarball that `Check` packs.

### How to add a language

1. Copy `src/locales/es.ts` to `src/locales/<code>.ts` (`<code>` is the BCP 47 language code) and translate every text. Rename the object to `<code>`, set `code`, and keep `export default`. The `NifLocale` type makes TypeScript fail if a text is missing.
2. Organisation names: look for an official text in that language that lists the keys of Orden EHA/451/2008 (the AEAT's pages in that language, a regional official bulletin), put the names in the singular and cite the URL in a comment. Mark every name without an official source `// translated (no official version found)`.
3. Add the language to `LOCALES` in `src/__tests__/locales.test.ts`, the smoke tests (`test/smoke/`) and `scripts/check-tree-shaking.mjs` (two marker strings only that language has).
4. Add `"./locales/<code>"` to `exports` in `package.json`, with the same four paths as the other languages.
5. Document it: a section in [docs/translations.md](docs/translations.md) (source of each organisation name, terminology), the language tables in README.md and MIGRATION.md, and the `NifLocale` JSDoc in `src/types.ts`.
6. Ask for a language review in the PR: a native speaker, or at least a second model, reads every message and organisation name.

### Rule IDs and SPEC.md

Every validation branch in `src/` cites the rule it implements in a comment (`// CIF-3`), and every rule has a test whose name starts with its ID (`it("CIF-3: ...")`, or a case table with `rule: "CIF-3"`). `pnpm spec:check` (`scripts/check-spec-rules.mjs`, also run in CI) fails if an ID in `src/` or in a test is not defined in SPEC.md, or if a SPEC rule has no test. JSON fixtures under `test/` count as tests. Rules that can't have a test yet would be listed, with a reason, in `NOT_TESTED_YET` inside the script; it is empty since v2.

### Tests

- `fixtures.test.ts` runs every entry of `test/fixtures/*.json` (`{ input, expected, type, rule, note }`) against `validate()` and the booleans, with the options of its file. Add SPEC test values there.
- `generate.test.ts`: the generators. 100,000 values of each type validate (with `validate()`, stdnum and a separate copy of the algorithms), every CIF key and NIE prefix is generated, no value is a placeholder, `generateInvalid` fails with exactly the requested code (100,000 values per type and code), seeded values are golden (the same on every platform), and the mulberry32 output is compared with the published reference implementation.
- `properties.test.ts` (fast-check, seeded): nothing throws, generated documents validate, `computeControlCharacter` completes them, single-character substitutions (documented exceptions in SPEC.md), `normalize` is idempotent, and the booleans always agree with `validate()`.
- `stdnum.test.ts` compares `validate()` with stdnum on about 50,000 inputs; every difference must be in its allow-list and in SPEC.md, "Differences from other libraries".
- Every error's `rule` must be defined in SPEC.md (tested).

### Behaviour guarantee: the differential test

`src/__tests__/differential.test.ts` compares every v1 export with the published v1.0.11, installed as the `nif-v1` dev dependency alias. It checks export names, aliases and constants, and runs every function, with the v1-compatible options `{ normalize: false, cifControl: "lenient" }`, on about 490,000 seeded inputs (valid IDs, mutations, case variants, look-alikes, every BMP code unit at the first and last position, long strings, non-strings), expecting identical results and identical errors. With the v2 defaults, it checks that every difference is one of the documented breaking changes (MIGRATION.md). A refactor or performance change must keep it green. An intended behaviour change must update the test and say so in the PR, and is a breaking change if it changes what is accepted by default (see SPEC.md).

### Performance

`pnpm bench` builds `dist/` (the CommonJS build) and runs `bench/run.mjs` with [tinybench](https://github.com/tinylibs/tinybench), on the fixed, seeded input sets in `bench/inputs.mjs`. It prints three tables and writes `bench/results/baseline.json` (with machine, Node and tinybench versions) and `bench/results/baseline.md`:

1. Every boolean validator on the mixed set: v1.0.11, the current build with the v1-compatible options (checked to give the v1.0.11 results first), and with the v2 defaults.
2. Every boolean validator on canonical input (the fast path), each in its own child process, against another build given in `BENCH_BASE` (a `dist/` directory; name it with `BENCH_BASE_LABEL`). The budget: at most 10% slower than the base. On canonical input the booleans must not allocate.
3. `validate()` on the mixed, canonical and typed (normalized) sets.

`BENCH_BASE` is a `dist/` directory with `cjs/index.cjs` (the layout of this repository) or `index.js` (branches from before the dual build). To compare with another branch, build it into a temporary directory, for example `git archive <branch> src tsconfig.json tsconfig.build.json | tar -x -C /tmp/base && pnpm exec tsc -p /tmp/base/tsconfig.build.json`, then `BENCH_BASE=/tmp/base/dist BENCH_BASE_LABEL=<branch> pnpm bench`. Commit the new results when a change affects performance, and run it on an otherwise idle machine. `BENCH_TIME_MS` and `BENCH_WARMUP_MS` change the time per task (defaults: 2000 and 500).

### Spelling

`pnpm spell` runs [cspell](https://cspell.org/) with `cspell.config.yaml` (English, British spelling). Real words it doesn't know, such as the Spanish legal terms quoted from the sources, go in `.cspell/project-words.txt`. The string literals of the Catalan, Basque and Galician locales (and the tree-shaking markers) are not spell-checked, by an override in `cspell.config.yaml`, and docs/translations.md turns cspell off around its tables: the project has no dictionary for those languages, and the language review covers them.

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
  - `Check (Node 24)`: dependency audit (fails on high or critical advisories), commit lint, Biome lint, spell check (`pnpm spell`), SPEC rule ID check (`pnpm spec:check`), type check, tests with 100% coverage enforced (including the differential test against v1.0.11), coverage summary and report, the size budgets (`pnpm size`), the ES2016 syntax check (`pnpm check:es`), then packs the tarball, checks that it tree-shakes (`scripts/check-tree-shaking.mjs`), checks it with `publint --strict` and `@arethetypeswrong/cli` (green in every resolution mode) and uploads it as the `package-tarball` artifact.
  - `Compat (Node 20)`: runs after `Check`. It installs that tarball into an empty folder on Node 20 (the minimum supported version, `engines.node` in `package.json`) and runs the smoke tests in `test/smoke/` with Node's built-in test runner: `smoke.test.cjs` loads the package with `require()` and `smoke.test.mjs` with `import`. It installs no dev dependencies, so it proves what a consumer gets. Run it locally with `pnpm pack`, then install the tarball in a temporary folder and `node --test` copies of both files from there.
  - `PR title`: checks that the pull request title is a valid Conventional Commit (see `.github/workflows/pr-title.yml`).
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

Publishing uses [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC) with provenance. There is no npm token to create or rotate. The trusted publisher is configured on npmjs.com (package Settings, Trusted publishing, GitHub Actions) for the repository `josegoval/nif-dni-nie-cif-validation` and the workflow filename `release.yml`. If you rename the workflow, update that setting too.

Do not run `npm publish` by hand. The `prepack` script builds `dist/` so a tarball is never empty, but only the workflow publishes with provenance.

### Coverage

Coverage never leaves GitHub; there is no third-party service:

- Every CI run on Node 24 writes a coverage table to the run's **job summary** (`scripts/coverage-summary.mjs`) and uploads the HTML report as the `coverage-report` artifact.
- Run `pnpm test` and then `node scripts/coverage-summary.mjs` to see the same table locally. The HTML report is in `coverage/html/index.html`.
