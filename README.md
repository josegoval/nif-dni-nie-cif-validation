# nif-dni-nie-cif-validation

[![coverage: 100%](https://raw.githubusercontent.com/josegoval/nif-dni-nie-cif-validation/master/.github/badges/coverage.svg)](https://github.com/josegoval/nif-dni-nie-cif-validation/actions/workflows/release.yml)
![npm bundle size](https://img.shields.io/bundlephobia/min/nif-dni-nie-cif-validation?style=for-the-badge)
[![https://nodei.co/npm/nif-dni-nie-cif-validation.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/nif-dni-nie-cif-validation.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/nif-dni-nie-cif-validation)

`nif-dni-nie-cif-validation` is a JS and TS library that makes everything related
with NIF (spanish identifiers) easier.

Validation rules and their official sources: [SPEC.md](SPEC.md)

## v2 API at a glance

Version 2 follows [SPEC.md](SPEC.md) by default and explains its answers. Upgrading from v1? Read [MIGRATION.md](MIGRATION.md): there are breaking changes, and `{ normalize: false, cifControl: "lenient" }` restores the v1 results.

```ts
import {
  validate, isValidNif, normalize, format, computeControlCharacter,
} from "nif-dni-nie-cif-validation";
import { es } from "nif-dni-nie-cif-validation/locales/es";

validate(" b-1234567-4 ");
// { valid: true, type: "CIF", normalized: "B12345674",
//   meta: { orgKey: "B", orgDescription: "Limited liability company" } }

validate("12345678A", { locale: es }).error;
// { code: "INVALID_CONTROL_CHARACTER", rule: "DNI-2", expected: "Z",
//   message: "El carácter de control no es correcto: para este DNI debería ser «Z»." }

isValidNif("12.345.678-Z");          // true: input is normalized by default
isValidNif("G1234567D");             // false: G takes a digit control (CIF-3)
normalize(" x-0123456-7l ");         // "X1234567L"
format("12345678z");                 // "12345678-Z"
computeControlCharacter("B1234567"); // "4"
```

Also new: `getNifType`, `describeCifOrganisation`, `isValidSpanishVat` (format only, not a VIES check), and the `rejectPlaceholders`, `types`, `allowVatPrefix` and `locale` options. Every function is fully typed and documented, and none throws on untrusted input (except the deprecated `replaceNieLetter`).

Messages and organisation names are in English by default. Each other language is its own import, so your bundle only has the languages you use:

| Language | Import |
| --- | --- |
| Spanish (español) | `import { es } from "nif-dni-nie-cif-validation/locales/es"` |
| Catalan (català), also for Valencian (valencià) | `import { ca } from "nif-dni-nie-cif-validation/locales/ca"` |
| Basque (euskara) | `import { eu } from "nif-dni-nie-cif-validation/locales/eu"` |
| Galician (galego) | `import { gl } from "nif-dni-nie-cif-validation/locales/gl"` |
| English (the default) | `import { en } from "nif-dni-nie-cif-validation/locales/en"` |

Pass the object, not its code: `validate(value, { locale: es })`, `describeCifOrganisation("B", es)`. A string such as `"es"` is ignored and gives English.

### Generating test data

Need valid fake numbers for your tests, instead of a real person's? `nif-dni-nie-cif-validation/generate` makes them, and they are the same on every run and platform when you give a seed. It is opt-in: the main entry point doesn't include it.

```ts
import {
  createGenerator, generateCif, generateInvalid,
} from "nif-dni-nie-cif-validation/generate";

generateCif({ seed: 1, orgKey: "B" });  // "B62707393": a valid CIF, the same every time
generateCif({ control: "letter" });     // a key that takes a letter (N P Q R S W), CIF-3
createGenerator(2024).dni();            // a stream of different values from one seed
generateInvalid("DNI", { reason: "INVALID_LENGTH" }); // for negative tests: validate() says INVALID_LENGTH
```

There are also `generateDni` (with `kind: "K" | "L" | "M"`), `generateNie` (with `prefix`) and `generateNif` (with `types`), and every one takes `format: true` for the `12345678-Z` form. The numbers follow [SPEC.md](SPEC.md) and are never a placeholder such as `00000000T`, but they are synthetic: one may match a real person or company by chance, so use them in tests only. See [docs/api-design.md](docs/api-design.md).

The package ships ES modules and CommonJS, each with its own type declarations, and tree-shakes: `import { isValidDni }` adds about 0.6 kB minified and gzipped, without the error messages; `import { validate }` about 2.7 kB, with the English messages.

**Feel like supporting this free plugin?**

<a href="https://www.buymeacoffee.com/josegoval" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

**Table of Contents**

- [Installation](#installation)
- [Example usage](#example-usage)
- [Main Functions](#main-functions)
- [Utility functions](#utility-functions)
- [Other utilities](#other-utilities)
- [What about the CIF?](#what-about-the-cif)

## Installation

```bash
npm install --save nif-dni-nie-cif-validation
```

or

```bash
yarn add nif-dni-nie-cif-validation
```

or

```bash
pnpm add nif-dni-nie-cif-validation
```

or

```bash
bun add nif-dni-nie-cif-validation
```

## Example usage

Import and use as follow with ES6 syntax:

```ts
import { isValidNif } from "nif-dni-nie-cif-validation";

console.log(isValidNif("36698729K")) // true
console.log(isValidNif("9332057M")) // false
```

CommonJS works too:

```ts
const { isValidNif } = require("nif-dni-nie-cif-validation")

console.log(isValidNif("36698729K")) // true
console.log(isValidNif("9332057M")) // false
```

The following sections cover all the features and utilities of this package.

Every `isValid*` function is safe to call with untrusted input: it never throws and always returns a boolean. Any value that is not a string (for example `null`, `undefined`, a number or an object) returns `false`. The only exported function that can throw is the deprecated `replaceNieLetter`.

## Main functions

| Function                  | Description                                                                                                                                    | Expects inputs                                                                                                    | Valid examples                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `isValidNif`              | Checks if the given nif (NIF of a legal person or entity, or natural person NIF (DNI, DNI K, DNI L, DNI M, or NIE)) is valid.                                  | `/^([KLMXYZ][\d]{7}\|X0[\d]{7}\|[\d]{8})[TRWAGMYFPDXBNJZSQVHLCKE]$/i` or `/^[ABCDEFGHJNPQRSUVW][\d]{7}[\dA-J]$/i` | `57655929N` `K0867756N` `Z9332057L` `A07727886`  |
| `isValidNaturalPersonNif` | Checks if the given naturalPersonNif is either a valid DNI (including DNI K, L and M) or a valid NIE.                                         | `/^([KLMXYZ][\d]{7}\|X0[\d]{7}\|[\d]{8})[TRWAGMYFPDXBNJZSQVHLCKE]$/i`                                             | `57655929N` `K0867756N` `Z9332057L`              |
| `isValidDni`              | Checks if the given dni is valid. It does include checks for DNI K, L and M.                                                                   | `/^([KLM][\d]{7}\|[\d]{8})[TRWAGMYFPDXBNJZSQVHLCKE]$/i`                                                           | `57655929N` `K0867756N`                          |
| `isValidNie`              | Checks if the given nie is valid. It also accepts old 10-character NIEs (`X` + `0` + 7 digits + letter), validated as `X` + 7 digits + letter. | `/^(?:X0?\|[YZ])[\d]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i`                                                              | `Z9332057L` `X9864761S` `Y2541026T` `X01234567L` |
| `isValidLegalEntityNif`   | Checks if the legalEntityNif (formerly known as CIF) provided is valid. It does not include old K, L and M formats.                                 | `/^[ABCDEFGHJNPQRSUVW][\d]{7}[\dA-J]$/i`                                                                          | `A07727886` `E05070164` `J34790493`              |
| `isValidCif`              | Same as `isValidLegalEntityNif`                                                                                                                | Same as `isValidLegalEntityNif`                                                                                   | Same as `isValidLegalEntityNif`                  |

## Utility functions

| Function                           | Description                                                                                                                                                       | Expected inputs                                         | Valid examples                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| `isValidDniLetter`                 | Checks if the dni control code (letter) provided is valid. It does include checks for DNI K, L and M. _(WARNING!: It does not check the `DNI_REGEX`.)_            | `/^([KLM][\d]{7}\|[\d]{8})[TRWAGMYFPDXBNJZSQVHLCKE]$/i` | `57655929N` `K0867756N`                    |
| `replaceNieLetter`                 | _(Deprecated.)_ Returns a new string with the nie letter (XYZ) replaced. Throws if the first character is not X, Y or Z, or if the input is not a string.         | `/^[XYZ][\d]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i`            | `Z9332057L` `X9864761S` `Y2541026T`        |
| `isValidLegalEntityNifControlCode` | Checks if the control code (letter or number) of the given NIF of a legal person or entity (formerly known as CIF) is valid. _(WARNING!: It does not check the `LEGAL_ENTITY_NIF_REGEX`.)_ | `/^[ABCDEFGHJNPQRSUVW][\d]{7}[\dA-J]$/i`                | `A07727886` `E05070164` `J34790493`        |
| `isValidCifControlCode`            | Same as `isValidLegalEntityNifControlCode`                                                                                                                        | Same as `isValidLegalEntityNifControlCode`              | Same as `isValidLegalEntityNifControlCode` |

## Other utilities

| Name                           | Type     | Description                                                                                                                                                                                        |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DNI_CONTROL_LETTERS`          | `string` | Contains all the control letters available for a valid DNI.                                                                                                                                        |
| `DNI_REGEX`                    | `RegExp` | Pattern that must match a valid DNI, however it does not includes control letter validation. [Use `isValidDni` instead for full validation.](#main-functions)                                      |
| `NIE_REGEX`                    | `RegExp` | Pattern that must match a valid NIE, however it does not includes control letter validation. [Use `isValidNie` instead for full validation.](#main-functions)                                      |
| `LEGAL_ENTITY_CONTROL_LETTERS` | `string` | Contains all the control letters available for a valid NIF of a legal person or entity (formerly known as CIF). Remember that may include numbers for the control characters, so this does not cover all possibilities. |
| `CIF_CONTROL_LETTERS`          | `string` | Same as `LEGAL_ENTITY_CONTROL_LETTERS`.                                                                                                                                                            |
| `LEGAL_ENTITY_NIF_REGEX`       | `RegExp` | Pattern that must match a valid NIF of a legal person or entity, however it does not includes control character validation. [Use `isValidLegalEntityNif` instead for full validation.](#main-functions)           |
| `CIF_REGEX`                    | `RegExp` | Same as `LEGAL_ENTITY_NIF_REGEX`.                                                                                                                                                                  |

## What about the CIF?

CIF was the tax id of legal persons and other entities in Spain up to 2008. However, nowadays it's renamed to NIF of a legal person or entity, and some old formats like those who starts with L, K and M letters are
not described by legal authorities (at least what I found, if you find more information about it, please feel free to comment, make a pull or open an issue).

Nevertheless, this library also exports `isValidLegalEntityNif` renamed to `isValidCif`, and all related terms with it to make easier to those who need it.
