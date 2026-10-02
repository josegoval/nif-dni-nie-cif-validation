# generate-test-data

A Vitest fixture factory built on `createGenerator(seed)` from `nif-dni-nie-cif-validation/generate`: valid DNIs and NIEs that are different each time but the same on every run, and invalid ones that fail with exactly the error code you ask for.

```sh
pnpm start   # Vitest in watch mode
pnpm check   # type-checks and runs the tests once, which is what CI runs
```

The factory is in [src/factories.ts](src/factories.ts), the code under test in [src/customer.ts](src/customer.ts) and the tests in [src/customer.test.ts](src/customer.test.ts). The generated numbers are valid but made up (they may match a real person's by chance): use them in tests, never as real data.

From the root of the repository, install first with `pnpm examples:install` (see [../README.md](../README.md)). In your own project: `npm install -D nif-dni-nie-cif-validation vitest`.
