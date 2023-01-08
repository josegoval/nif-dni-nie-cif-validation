# nif-dni-nie-cif-validation

[![codecov](https://img.shields.io/codecov/c/github/josegoval/nif-dni-nie-cif-validation?style=for-the-badge)](https://codecov.io/gh/josegoval/nif-dni-nie-cif-validation)
![npm bundle size](https://img.shields.io/bundlephobia/min/nif-dni-nie-cif-validation?style=for-the-badge)
[![https://nodei.co/npm/nif-dni-nie-cif-validation.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/nif-dni-nie-cif-validation.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/nif-dni-nie-cif-validation)

`nif-dni-nie-cif-validation` is a JS and TS library that makes everything related
with NIF (spanish identifiers) easier.

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

## Example usage

Import and use as follow with ES6 syntax:

```ts
import { isValidNif } from "nif-dni-nie-cif-validation";

console.log(isValidNif("36698729K")) // true
console.log(isValidNif("9332057M")) // false
```

For previous versions use `require` as follows:

```ts
const { isValidNif } = require("nif-dni-nie-cif-validation")

console.log(isValidNif("36698729K")) // true
console.log(isValidNif("9332057M")) // false
```

The following sections cover all the features and utilities of this package.

## Main functions

| Function                  | Description                                                                                                    | Expects inputs                                                                                         | Valid examples                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `isValidNif`              | Checks if the given nif (legal entity NIF or natural person NIF (DNI, DNI K, DNI L, DNI M, or NIE)) is valid.  | `/^([KLMXYZ][\d]{7}\|[\d]{8})[TRWAGMYFPDXBNJZSQVHLCKE]$/i` or `/^[ABCDEFGHJNPQRSUVW][\d]{7}[\dA-J]$/i` | `57655929N` `K0867756N` `Z9332057L` `A07727886` |
| `isValidNaturalPersonNif` | Checks if the given naturalPersonNif is whether a valid DNI (including DNI K, L and M) or a valid NIE.         | `/^([KLMXYZ][\d]{7}\|[\d]{8})[TRWAGMYFPDXBNJZSQVHLCKE]$/i`                                             | `57655929N` `K0867756N` `Z9332057L`             |
| `isValidDni`              | Checks if the given dni is valid. It does include checks for DNI K, L and M.                                   | `/^([KLM][\d]{7}\|[\d]{8})[TRWAGMYFPDXBNJZSQVHLCKE]$/i`                                                | `57655929N` `K0867756N`                         |
| `isValidNie`              | Checks if the given nie is valid.                                                                              | `/^[XYZ][\d]{7}[TRWAGMYFPDXBNJZSQVHLCKET]$/i`                                                          | `Z9332057L` `X9864761S` `Y2541026T`             |
| `isValidLegalEntityNif`   | Checks if the legalEntityNif (old known as CIF) provided is valid. It does not include old K, L and M formats. | `/^[ABCDEFGHJNPQRSUVW][\d]{7}[\dA-J]$/i`                                                               | `A07727886` `E05070164` `J34790493`             |
| `isValidCif`              | Same as `isValidLegalEntityNif`                                                                                | Same as `isValidLegalEntityNif`                                                                        | Same as `isValidLegalEntityNif`                 |

## Utility functions

| Function                           | Description                                                                                                                                                       | Expected inputs                                         | Valid examples                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| `isValidDniLetter`                 | Checks if the dni control code (letter) provided is valid. It does include checks for DNI K, L and M. _(WARNING!: It does not check the `DNI_REGEX`.)_            | `/^([KLM][\d]{7}\|[\d]{8})[TRWAGMYFPDXBNJZSQVHLCKE]$/i` | `57655929N` `K0867756N`                    |
| `replaceNieLetter`                 | Returns a new string with the nie letter (XYZ) replaced. However it will throw an error if the first character is not X, Y or Z.                                  | `/^[XYZ][\d]{7}[TRWAGMYFPDXBNJZSQVHLCKET]$/i`           | `Z9332057L` `X9864761S` `Y2541026T`        |
| `isValidLegalEntityNifControlCode` | Checks if the legal entity nif (old known as CIF) control code (letter or number) provided is valid. _(WARNING!: It does not check the `LEGAL_ENITY_NIF_REGEX`.)_ | `/^[ABCDEFGHJNPQRSUVW][\d]{7}[\dA-J]$/i`                | `A07727886` `E05070164` `J34790493`        |
| `isValidCifControlCode`            | Same as `isValidLegalEntityNifControlCode`                                                                                                                        | Same as `isValidLegalEntityNifControlCode`              | Same as `isValidLegalEntityNifControlCode` |

## Other utilities

| Name                           | Type     | Description                                                                                                                                                                                        |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DNI_CONTROL_LETTERS`          | `string` | Contains all the control letters available for a valid DNI.                                                                                                                                        |
| `DNI_REGEX`                    | `RegExp` | Pattern that must match a valid DNI, however it does not includes control letter validation. [Use `isValidDni` instead for full validation.](#main-functions)                                      |
| `NIE_REGEX`                    | `RegExp` | Pattern that must match a valid NIE, however it does not includes control letter validation. [Use `isValidNie` instead for full validation.](#main-functions)                                      |
| `LEGAL_ENTITY_CONTROL_LETTERS` | `string` | Contains all the control letters available for a valid legal entity NIF (old known as CIF). Remember that may include numbers for the control characters, so this does not cover all posibilities. |
| `CIF_CONTROL_LETTERS`          | `string` | Same as `LEGAL_ENTITY_CONTROL_LETTERS`.                                                                                                                                                            |
| `LEGAL_ENTITY_NIF_REGEX`       | `RegExp` | Pattern that must match a valid legal entity NIF, however it does not includes control character validation. [Use `isValidLegalEntityNif` instead for full validation.](#main-functions)           |
| `CIF_REGEX`                    | `RegExp` | Same as `LEGAL_ENTITY_NIF_REGEX`.                                                                                                                                                                  |

## What about the CIF?

CIF was a legal entity id used in Spain up to 2008. However, nowadays it's renamed to legal entity NIF, and some old formats like those who starts with L, K and M letters are
not described by legal authorities (at least what I found, if you find more information about it, please feel free to comment, make a pull or open an issue).

Nevertheless, this library also exports `isValidLegalEntityNif` renamed to `isValidCif`, and all related terms with it to make easier to those who need it.
