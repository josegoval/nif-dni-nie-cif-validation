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
pnpm build                       # compiles to dist/
pnpm spell                       # cspell: spelling of code, tests, docs and CI files
pnpm spec:check                  # rule IDs in src/ and tests match SPEC.md
pnpm bench                       # builds, then benchmarks against v1.0.11
```

`tsconfig.json` type-checks the library, the tests and the Vitest config without emitting anything. `tsconfig.build.json` extends it and emits the CommonJS build and type declarations of `src/` (without tests) into `dist/`. Both use `strict`, `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.

`pnpm install` runs `husky` through the `prepare` script, which installs the git hooks. If you installed with `HUSKY=0` or cloned without running install, run `pnpm prepare` once.

## Project structure

```
src/
  index.ts      entry point: the public exports (keep the names stable)
  nif.ts        isValidNif, isValidNaturalPersonNif: pick the format from the first character
  dni.ts        DNI and K/L/M NIF (DNI-*, KLM-*)
  nie.ts        NIE (NIE-*)
  cif.ts        legal entity NIF, formerly CIF (CIF-*)
  normalize.ts  normalize() and the boolean validators' retry path (NORM-*, NIE-3)
  policy.ts     opt-in policies: placeholders (POLICY-1)
  validate.ts   validate() and getNifType(): error codes and rules
  messages.ts   error messages in English and Spanish (validate() only)
  organisations.ts  describeCifOrganisation(): CIF organisation keys
  vat.ts        isValidSpanishVat() (VAT-1)
  format.ts     format() and computeControlCharacter()
  shared.ts     internal helpers
  types.ts      public types
  __tests__/    Vitest tests, one file per module plus cross-cutting suites
test/fixtures/  SPEC test values as JSON, run by src/__tests__/fixtures.test.ts
test/smoke/     smoke test of the packed tarball (plain Node, see Pull requests)
bench/          benchmark against v1.0.11 and another build (see Performance)
scripts/        CI helpers: coverage summary, SPEC rule check
```

Each module starts with a header comment: what the document is, its format and its control algorithm, with the [SPEC.md](SPEC.md) rule IDs. The `isValid*` functions validate in a single pass with `charCodeAt`: no regex, no `split`/`replace`/template strings and no allocations on the hot path. With normalization on (the default), a value that fails the raw check is normalized and checked again only when normalizing could change the verdict (see `normalizedForRetry` in normalize.ts); keep that retry out of the hot function. `validate()` may allocate. The messages and organisation names live in their own modules, which the booleans must not import, so they stay out of bundles that only use the booleans. The exported regexes (`DNI_REGEX` and so on) are public constants kept for compatibility; the validators don't use them.

### Rule IDs and SPEC.md

Every validation branch in `src/` cites the rule it implements in a comment (`// CIF-3`), and every rule has a test whose name starts with its ID (`it("CIF-3: ...")`, or a case table with `rule: "CIF-3"`). `pnpm spec:check` (`scripts/check-spec-rules.mjs`, also run in CI) fails if an ID in `src/` or in a test is not defined in SPEC.md, or if a SPEC rule has no test. JSON fixtures under `test/` count as tests. Rules that can't have a test yet would be listed, with a reason, in `NOT_TESTED_YET` inside the script; it is empty since v2.

### Tests

- `fixtures.test.ts` runs every entry of `test/fixtures/*.json` (`{ input, expected, type, rule, note }`) against `validate()` and the booleans, with the options of its file. Add SPEC test values there.
- `properties.test.ts` (fast-check, seeded): nothing throws, generated documents validate, `computeControlCharacter` completes them, single-character substitutions (documented exceptions in SPEC.md), `normalize` is idempotent, and the booleans always agree with `validate()`.
- `stdnum.test.ts` compares `validate()` with stdnum on about 50,000 inputs; every difference must be in its allow-list and in SPEC.md, "Differences from other libraries".
- Every error's `rule` must be defined in SPEC.md (tested).

### Behaviour guarantee: the differential test

`src/__tests__/differential.test.ts` compares every v1 export with the published v1.0.11, installed as the `nif-v1` dev dependency alias. It checks export names, aliases and constants, and runs every function, with the v1-compatible options `{ normalize: false, cifControl: "lenient" }`, on about 490,000 seeded inputs (valid IDs, mutations, case variants, look-alikes, every BMP code unit at the first and last position, long strings, non-strings), expecting identical results and identical errors. With the v2 defaults, it checks that every difference is one of the documented breaking changes (MIGRATION.md). A refactor or performance change must keep it green. An intended behaviour change must update the test and say so in the PR, and is a breaking change if it changes what is accepted by default (see SPEC.md).

### Performance

`pnpm bench` builds `dist/` and runs `bench/run.mjs` with [tinybench](https://github.com/tinylibs/tinybench), on the fixed, seeded input sets in `bench/inputs.mjs`. It prints three tables and writes `bench/results/baseline.json` (with machine, Node and tinybench versions) and `bench/results/baseline.md`:

1. Every boolean validator on the mixed set: v1.0.11, the current build with the v1-compatible options (checked to give the v1.0.11 results first), and with the v2 defaults.
2. Every boolean validator on canonical input (the fast path), each in its own child process, against another build given in `BENCH_BASE` (a `dist/` directory; name it with `BENCH_BASE_LABEL`). The budget: at most 10% slower than the base. On canonical input the booleans must not allocate.
3. `validate()` on the mixed, canonical and typed (normalized) sets.

To compare with another branch, build it into a temporary directory, for example `git archive <branch> src tsconfig.json tsconfig.build.json | tar -x -C /tmp/base && pnpm exec tsc -p /tmp/base/tsconfig.build.json`, then `BENCH_BASE=/tmp/base/dist BENCH_BASE_LABEL=<branch> pnpm bench`. Commit the new results when a change affects performance, and run it on an otherwise idle machine. `BENCH_TIME_MS` and `BENCH_WARMUP_MS` change the time per task (defaults: 2000 and 500).

### Spelling

`pnpm spell` runs [cspell](https://cspell.org/) with `cspell.config.yaml` (English, British spelling). Real words it doesn't know, such as the Spanish legal terms quoted from the sources, go in `.cspell/project-words.txt`.

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
  - `Check (Node 24)`: dependency audit (fails on high or critical advisories), commit lint, Biome lint, spell check (`pnpm spell`), SPEC rule ID check (`pnpm spec:check`), type check, tests with 100% coverage enforced (including the differential test against v1.0.11), coverage summary and report, then packs the tarball, checks it with `publint` and `@arethetypeswrong/cli` and uploads it as the `package-tarball` artifact.
  - `Compat (Node 20)`: runs after `Check`. It installs that tarball into an empty folder on Node 20 (the minimum supported version, `engines.node` in `package.json`) and runs the smoke test in `test/smoke/smoke.test.cjs` with Node's built-in test runner. It installs no dev dependencies, so it proves what a consumer gets. Run it locally with `pnpm pack`, then install the tarball in a temporary folder and `node --test` a copy of the file from there.
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
