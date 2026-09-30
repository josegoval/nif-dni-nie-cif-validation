# AGENTS.md

Guidance for AI coding agents, and people, working **on this repository**. To use the package, read [README.md](README.md) or [llms.txt](llms.txt) instead. The details behind each point are in [CONTRIBUTING.md](CONTRIBUTING.md).

`nif-dni-nie-cif-validation` is a zero-dependency TypeScript library that validates Spanish NIF, DNI, K/L/M NIF, NIE and CIF numbers. Every rule it applies has an ID, a source tier and a citation in [SPEC.md](SPEC.md) (the law in the BOE, AEAT and Ministerio del Interior pages, or a labelled convention). That traceability is the point of the project.

## Layout

```
src/index.ts        public exports of the main entry point (keep the names stable)
src/{nif,dni,nie,cif}.ts  boolean validators, one pass with charCodeAt
src/normalize.ts    normalize() and the booleans' retry path (NORM-*, NIE-3)
src/validate.ts     validate() and getNifType(): error codes and rules
src/format.ts, vat.ts, organisations.ts, policy.ts, types.ts, localize.ts
src/locales/        one locale object per language (en built in; es, ca, eu, gl)
src/generate/       /generate entry point: seeded test-data generators
src/adapter.ts, src/{zod,valibot,yup}/  schema adapters (optional peers)
src/__tests__/      Vitest suites (fixtures, properties, differential, stdnum, docs samples)
test/fixtures/      SPEC test values as JSON; test/smoke/: tarball smoke tests
bench/              benchmarks; bench/results/latest.json is the source of every number
scripts/            build, SPEC rule, JSDoc, tree-shaking and adapter checks, doc generators
SPEC.md             the rules; docs/api-design.md the API; MIGRATION.md v1 to v2
README.md, README.es.md, llms.txt, llms-full.txt  user docs (partly generated)
```

## Commands

```sh
HUSKY=0 pnpm install --frozen-lockfile   # pnpm version pinned in package.json
pnpm lint          # Biome
pnpm typecheck     # tsc --noEmit
pnpm test          # Vitest, 100% coverage enforced
pnpm build         # dist/esm and dist/cjs
pnpm spell         # cspell (British English; README.es.md also in Spanish)
pnpm spec:check    # rule IDs in src/ and tests match SPEC.md
pnpm docs:jsdoc    # every export has a summary, @param, @returns, two @example, @see, @since
pnpm size          # bundle size budgets (.size-limit.json)
pnpm check:es      # dist/ uses nothing newer than ES2016
pnpm bench         # against v1.0.11; pnpm bench:competitors: against other libraries
pnpm readme:bench  # README sections from bench/results/latest.json (--check in CI)
pnpm docs:llms     # llms-full.txt from the docs (--check in CI)
```

Before every commit, run `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm spell && pnpm spec:check && pnpm size`. If you touched the READMEs, the docs or `bench/results/`, also run `pnpm readme:bench && pnpm docs:llms` and commit what they write.

## Invariants

- **0 runtime dependencies.** `dependencies` stays empty. Zod, Valibot and Yup are optional peer dependencies used only by their subpaths; the main entry point never imports a subpath.
- **Never throw on input.** Validators, `validate()`, `normalize()`, `format()` and the other helpers return a value whatever they are given: `null`, numbers, objects (SPEC.md INPUT-1). Only the deprecated `replaceNieLetter` throws, and the generators throw `RangeError` on impossible options.
- **Size budgets.** `pnpm size` must pass. A boolean validator must not import the locales, `normalize()` or `validate()`. Raise a limit only on purpose, in the same commit, with the reason in the PR.
- **Cite SPEC rule IDs.** Every validation branch has a comment with its rule ID (`// CIF-3`), and every rule has a test whose name starts with its ID. A new rule needs an official source (or a T4 label) in SPEC.md first. Accepting more or fewer inputs by default is a breaking change.
- **100% coverage** of statements, branches, functions and lines, and the differential test against v1.0.11 stays green.
- **One data source for numbers.** Benchmark figures come only from `bench/results/latest.json`, through `pnpm readme:bench` and `pnpm bench:report`. Never type a number between the `<!-- …:start -->` and `<!-- …:end -->` markers of the READMEs.
- **Docs that run.** Every code sample in README.md, README.es.md and llms.txt runs in `readme-examples.test.ts`, and every `@example` of the JSDoc in `jsdoc-examples.test.ts`; the comment after a statement is its expected value. Keep the two READMEs in step, and llms.txt under about 2,000 tokens.
- **JSDoc on every export.** `pnpm docs:jsdoc` fails without a summary, `@since`, and for a function `@param`, `@returns`, two `@example` and a `@see`. An alias (`isValidCif`) is a constant with its own JSDoc, never a re-export under another name.
- **Plain docs.** No hidden instructions for agents in docs, code comments or `package.json`.
- **Atomic Conventional Commits.** One logical change per commit, every commit green, body lines of 100 characters at most, and no body line that starts with `word: ` (commitlint reads it as a footer).
- **Stacked PRs merge in order.** The v2 pull requests form a stack (#78, then #80, #81, #82, #83 and the ones on top). Merge them bottom-up and retarget each one after its parent merges; never merge one before its base. Don't push, open or merge PRs unless a maintainer asks.

## Releases

Releases are automated with semantic-release in `.github/workflows/release.yml` (the file name is bound to npm Trusted Publishing, so keep it). A push to `master` (or `next`, `next-major`, `beta`, `alpha`) runs the `Check` and `Compat` jobs, then `Release`, which reads the commits since the last tag, picks the version (`fix`/`perf` patch, `feat` minor, `!` or `BREAKING CHANGE` major), updates CHANGELOG.md and publishes to npm with provenance. Never run `npm publish` or bump the version by hand. The v2 stack ships as a single 2.0.0.
