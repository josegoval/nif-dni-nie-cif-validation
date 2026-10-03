# nextjs-server-action

A Next.js (App Router) form whose server action validates a NIF with `validate()` and returns the error in the language the user picks, in TypeScript.

```sh
pnpm dev     # the form, at http://localhost:3000
pnpm check   # builds with Next.js, type-checks and runs the tests, which is what CI runs
```

The flow:

1. [app/nif-form.tsx](app/nif-form.tsx) is a client component that passes the server action to `useActionState`. React submits the form to it, with no API route and no `fetch` in your code.
2. [app/actions.ts](app/actions.ts) is the server action (`"use server"`). It gets the state of the previous submission and the `FormData`, and returns the new state, which the form renders.
3. [lib/check-nif.ts](lib/check-nif.ts) has the validation, `checkNif(formData)`: it calls `validate()` with the locale of the `language` field (`en` or `es`; a locale is an object that the app picks) and returns the normalized document, or the error code, the SPEC rule and the library's message. The example writes no message itself, and the package runs on the server only.

`pnpm check` runs three steps. `next build` type-checks the app with the TypeScript of the project (TypeScript 7 works with it). `pnpm typecheck` (`tsc --noEmit`) also covers the test and the Next.js configuration. [lib/check-nif.test.ts](lib/check-nif.test.ts) (`node --test`, which strips the types) calls `checkNif` with submitted forms, without Next.js, and compares its answers with what `validate()` returns for the same value and locale, so it follows the library's messages. It doesn't render the form or call the action through Next.js. A server action is a function that React calls over HTTP, and `checkNif` is its whole logic.

[next.config.mjs](next.config.mjs) sets the Turbopack root to `examples/`, because the package is installed from `examples/.pack`, outside this folder. Telemetry is off in the scripts (`NEXT_TELEMETRY_DISABLED=1`).

From the root of the repository, install first with `pnpm examples:install` (see [../README.md](../README.md)). In your own project: `npm install nif-dni-nie-cif-validation next react react-dom`, and you don't need the root setting.
