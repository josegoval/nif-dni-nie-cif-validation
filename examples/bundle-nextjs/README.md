# bundle-nextjs

A Next.js production build (`next build`) whose client component imports only `isValidDni` from the package, and a check that the client chunks hold no error message, organisation name or language (the validators don't need them).

```sh
pnpm check   # builds with Next.js and scans .next/static, which is what CI runs
pnpm dev     # the page, at http://localhost:3000
```

The client component is [app/checker.jsx](app/checker.jsx). [check-bundle.mjs](check-bundle.mjs) scans every JavaScript file in `.next/static` (what the browser downloads) and fails unless one of them has the DNI control letters (so an empty bundle can't pass) and none has any of the 150-odd message fragments that [../shared/bundle-check.mjs](../shared/bundle-check.mjs) reads from the English, Spanish, Catalan, Basque and Galician locales of the packed package. It prints the size of the chunk with the validator. Import `validate` instead of `isValidDni` and the check fails, because `validate` brings the English messages.

[next.config.mjs](next.config.mjs) sets the Turbopack root to `examples/`, because the package is installed from `examples/.pack`, outside this folder. Telemetry is off in the scripts (`NEXT_TELEMETRY_DISABLED=1`).

From the root of the repository, install first with `pnpm examples:install` (see [../README.md](../README.md)). In your own project: `npm install nif-dni-nie-cif-validation next react react-dom`, and you don't need the root setting.
