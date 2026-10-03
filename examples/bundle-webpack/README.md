# bundle-webpack

A webpack production build whose only use of the package is `import { isValidDni } from "nif-dni-nie-cif-validation"`, and a check that the bundle holds no error message, organisation name or language (the validators don't need them).

```sh
pnpm check   # builds dist/main.js with webpack and scans it, which is what CI runs
```

The entry is [src/index.js](src/index.js) and the build is [webpack.config.mjs](webpack.config.mjs), with the default production optimizations. [check-bundle.mjs](check-bundle.mjs) fails unless the bundle has the DNI control letters (so an empty bundle can't pass) and has none of the 150-odd message fragments that [../shared/bundle-check.mjs](../shared/bundle-check.mjs) reads from the English, Spanish, Catalan, Basque and Galician locales of the packed package. It prints the size it found. Import `validate` instead of `isValidDni` and the check fails, because `validate` brings the English messages.

From the root of the repository, install first with `pnpm examples:install` (see [../README.md](../README.md)). In your own project: `npm install nif-dni-nie-cif-validation`.
