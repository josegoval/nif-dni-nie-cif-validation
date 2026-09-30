# Contributing

Thanks for helping improve `nif-dni-nie-cif-validation`.

## Development setup

The package manager is [pnpm](https://pnpm.io/). The exact version is pinned in `packageManager` in `package.json`; with [Corepack](https://nodejs.org/api/corepack.html) enabled (`corepack enable`) or a recent pnpm, the right version is used automatically. Development needs Node 22.12 or newer (Vitest 5 requires it) and the release pipeline runs on Node 24. The published package itself supports Node 20 and newer.

```sh
pnpm install --frozen-lockfile   # also installs the Husky commit-msg hook
pnpm typecheck                   # tsc --noEmit
pnpm test                        # Vitest, with coverage (100% enforced)
pnpm build                       # compiles to dist/
```

`pnpm install` runs `husky` through the `prepare` script, which installs the git hooks. If you installed with `HUSKY=0` or cloned without running install, run `pnpm prepare` once.

### Supply-chain settings

`pnpm-workspace.yaml` holds the pnpm settings:

- `minimumReleaseAge: 4320` only installs versions that are at least 3 days old, so a compromised release is usually pulled before we can install it. Dependabot has a matching 3-day `cooldown`.
- `allowBuilds` is an allow-list of dependencies that may run install scripts. Everything else is blocked, and the install fails if a new dependency ships an unreviewed script. Add a package there only after reviewing its script.

## Commit convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). The release tooling reads them to decide the next version and to write the changelog, so a wrong message can skip a release or publish the wrong version.

```
<type>(<optional scope>): <description>

<optional body>

<optional footer>
```

| Type                                                             | Effect on the next release |
| ---------------------------------------------------------------- | -------------------------- |
| `fix`                                                            | patch (`1.0.10` to `1.0.11`) |
| `feat`                                                           | minor (`1.0.10` to `1.1.0`)  |
| `feat!`, `fix!`, or a `BREAKING CHANGE:` footer                  | major (`1.0.10` to `2.0.0`)  |
| `docs`, `chore`, `ci`, `build`, `test`, `refactor`, `perf`, `style` | no release                 |

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
  - `Check (Node 24)`: commit lint, type check, tests with 100% coverage enforced, coverage summary and report, then packs the tarball, checks it with `publint` and `@arethetypeswrong/cli` and uploads it as the `package-tarball` artifact.
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
