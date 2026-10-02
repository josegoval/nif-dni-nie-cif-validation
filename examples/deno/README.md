# deno

Validate Spanish NIF, DNI, NIE and CIF numbers with [Deno](https://deno.com/).

```sh
pnpm start   # or `deno task start`: prints the Deno version and exits with an error if any result is not the expected one
```

It needs Deno 2 on your `PATH`. The script imports the package by name and Deno resolves it from `node_modules` (`"nodeModulesDir": "manual"` in [deno.json](deno.json)), so it runs against the packed package. In your own project, use the `npm:` specifier (`deno add npm:nif-dni-nie-cif-validation`, or `import { validate } from "npm:nif-dni-nie-cif-validation@^2"`).

From the root of the repository, install first with `pnpm examples:install` (see [../README.md](../README.md)).
