# Examples

Runnable projects that use `nif-dni-nie-cif-validation`. Each one is small, has its own `package.json` and a README with its run command, and CI checks it against the packed package.

| Example | What it shows | Run it |
| --- | --- | --- |
| [node-cjs](node-cjs) | The booleans and `validate()` from CommonJS (`require`) | `pnpm start` |
| [node-esm](node-esm) | The same from an ES module, plus a language and the generators | `pnpm start` |
| [zod-react-hook-form](zod-react-hook-form) | A Vite + React form with React Hook Form and the `/zod` schemas, in Spanish | `pnpm start` (`pnpm check` type-checks and builds) |
| [express-middleware](express-middleware) | An Express middleware that answers `422` with localized errors, and a test that posts to it | `pnpm start` (`pnpm check` runs the test) |
| [valibot](valibot) | The `/valibot` schemas: normalized output, localized issue with code and rule | `pnpm start` |
| [yup](yup) | The `/yup` schemas: normalized output, localized error with code and rule | `pnpm start` |
| [generate-test-data](generate-test-data) | A Vitest fixture factory built on `createGenerator(seed)` | `pnpm start` (`pnpm check` runs the tests once) |
| [csv-bulk-validation](csv-bulk-validation) | Streams a CSV with Node streams, reports invalid rows with error codes and rules, and the throughput | `pnpm start` |
| [bundle-webpack](bundle-webpack) | A webpack production build that imports only `isValidDni`, and a check that the bundle holds no message or language | `pnpm check` |
| [deno](deno) | The package under Deno 2 | `pnpm start` (needs Deno) |
| [bun](bun) | The package under Bun | `pnpm start` (needs Bun) |

`pnpm check` is what CI runs in each example: it builds, type-checks, or runs the example with assertions, and exits with an error when the output is not the expected one.

## Run them from this repository

The examples install the package as it would be published: `pnpm pack` makes the tarball, and `scripts/pack-for-examples.mjs` unpacks it into `examples/.pack/package` (ignored by Git), where every example finds it with `"nif-dni-nie-cif-validation": "file:../.pack/package"`. So an example uses the `exports`, the `files` and the types that npm would ship, not `src/`.

```sh
pnpm examples:install   # from the root: packs the package and installs the examples' dependencies
pnpm examples:check     # runs `pnpm check` in every example except Deno and Bun, which need their runtimes
cd examples/node-esm && pnpm start
```

After you change the library, run `pnpm examples:pack` (or `pnpm examples:install`) again, so the examples see the new build.

## How they are isolated from the library

`examples/` is its own pnpm workspace ([pnpm-workspace.yaml](pnpm-workspace.yaml)), with its own lockfile ([pnpm-lock.yaml](pnpm-lock.yaml)). The root `pnpm install` doesn't see it (the root `pnpm-workspace.yaml` has no `packages`, so it only has the root package), so React, Vite, Express and the rest are never installed for the library, and the root `minimumReleaseAge` and `allowBuilds` settings stay as strict as before. The examples' workspace has the same supply-chain policy: only versions that are at least 3 days old, and no install scripts (`allowBuilds`), including esbuild's, as in the root.

The examples are copyable: in your own project, install the package from npm (`npm install nif-dni-nie-cif-validation`), as each README says.

## Add an example

1. Make `examples/<name>/` with a `package.json` (`"private": true`, the dependency above, and a `check` script that fails when the result is wrong) and a README with a one-line purpose and its run command.
2. Run `pnpm add <what it needs>` in the folder, which updates [pnpm-lock.yaml](pnpm-lock.yaml); commit it.
3. If it checks a bundle, reuse `shared/bundle-check.mjs` (see `bundle-webpack/check-bundle.mjs`).
4. Add the name to the `matrix` of [.github/workflows/examples.yml](../.github/workflows/examples.yml) and to the table above, and link it from the README.

See CONTRIBUTING.md ("Examples") for how CI runs them, and why Deno and Bun are in it.
