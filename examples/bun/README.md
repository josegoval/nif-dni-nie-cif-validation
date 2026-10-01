# bun

Validate Spanish NIF, DNI, NIE and CIF numbers with [Bun](https://bun.sh/), which runs the TypeScript file directly.

```sh
pnpm start   # or `bun run index.ts`: prints the Bun version and exits with an error if any result is not the expected one
```

It needs Bun on your `PATH`. From the root of the repository, install first with `pnpm examples:install` (see [../README.md](../README.md)). In your own project: `bun add nif-dni-nie-cif-validation`.
