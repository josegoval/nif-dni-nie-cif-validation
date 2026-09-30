# Contributing

Thanks for helping improve `nif-dni-nie-cif-validation`.

## Development setup

The package manager is Yarn classic (v1) and the release pipeline needs Node 24 (any Node 20, 22 or 24 works for development).

```sh
yarn install --frozen-lockfile   # also installs the Husky commit-msg hook
yarn typecheck                   # tsc --noEmit
yarn test                        # Jest, with coverage
yarn build                       # compiles to dist/
```

`yarn install` runs `husky` through the `prepare` script, which installs the git hooks. If you installed with `HUSKY=0` or cloned without running install, run `yarn prepare` once.

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
- On pull requests, the **Commitlint** workflow lints every commit and the PR title. Fix a failing commit with `git rebase -i` and a force-push, or reword the PR title in the GitHub UI.

Keep commits atomic: one logical change per commit, with a message that explains why.

## Pull requests

- Open PRs against `master`. The test workflow runs on Node 20, 22 and 24, runs the type check, tests with coverage and the build, and checks the packed tarball with `publint` and `@arethetypeswrong/cli`. It must pass before merging.
- Stacked PRs (a PR whose base is another PR's branch) are fine. Merge them bottom-up and retarget each PR to `master` after its parent merges.

### How to merge

Use **merge commits or rebase-merge** so the atomic commits from the branch reach `master` and semantic-release can see each `fix`, `feat` and breaking change separately.

Use **squash merge only if the PR title is a valid Conventional Commit**, because the title becomes the single commit message. A squashed PR that mixes a `feat` and a `fix` hides one of them from the changelog, so prefer merge or rebase in that case. The PR title is linted for this reason.

## How releases are cut

Releases are fully automated with [semantic-release](https://semantic-release.gitbook.io/) and need no manual step or version bump.

1. A PR is merged into `master`. Other release branches are `next`, `next-major`, `beta` (prerelease), `alpha` (prerelease) and maintenance branches such as `1.x`. See `.releaserc`.
2. The **Release** workflow (`.github/workflows/release.yml`) installs, type checks, tests and builds, then runs `semantic-release`.
3. semantic-release reads the commits since the last tag and works out the next version. If no commit is releasable (`fix`, `feat` or breaking), nothing is published.
4. When a release is due, it updates `CHANGELOG.md` and `package.json`, publishes to npm, creates the GitHub release and tag, and pushes a `chore(release): x.y.z [skip ci]` commit.

Publishing uses [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC) with provenance. There is no npm token to create or rotate. The trusted publisher is configured on npmjs.com (package Settings, Trusted publishing, GitHub Actions) for the repository `josegoval/nif-dni-nie-cif-validation` and the workflow filename `release.yml`. If you rename the workflow, update that setting too.

Do not run `npm publish` by hand. The `prepack` script builds `dist/` so a tarball is never empty, but only the workflow publishes with provenance.

### Coverage

Coverage never leaves GitHub; there is no third-party service:

- Every CI run on Node 24 writes a coverage table to the run's **job summary** (`scripts/coverage-summary.mjs`) and uploads the HTML report as the `coverage-report` artifact.
- Run `yarn test` and then `node scripts/coverage-summary.mjs` to see the same table locally. The HTML report is in `coverage/lcov-report/index.html`.
