# Migrating from v1 to v2

Version 2.0.0 makes the validators follow [SPEC.md](SPEC.md), the official Spanish sources, by default. This page lists every breaking change, with code before and after, and how to get the v1 behaviour back.

## Quick path: keep the v1 behaviour

Every boolean validator takes an options object as its second argument. These options give exactly the v1.0.11 results (a differential test checks it on about 490,000 inputs):

```ts
import { isValidNif } from "nif-dni-nie-cif-validation";

const V1_COMPATIBLE = { normalize: false, cifControl: "lenient" } as const;

isValidNif(value, V1_COMPATIBLE);
```

Use it as a stopgap for stored data, then move to the defaults.

## Summary

| # | Change | Who is affected | Restore v1 |
|---|---|---|---|
| 1 | CIF keys C D F G J U V need a digit control (CIF-3) | CIFs such as `G1234567D` stop validating | `{ cifControl: "lenient" }` |
| 2 | Input is normalized by default (NORM-2 to NORM-4) | Values with spaces, dots, hyphens or slashes, or a DNI without its leading zeros, start validating | `{ normalize: false }` |
| 3 | TypeScript: validators have a second parameter | `ids.filter(isValidNif)` no longer compiles | Wrap the call: `ids.filter((id) => isValidNif(id))` |
| 4 | Only the package entry points can be imported (`exports` map) | Code that imports files from `dist/`, such as `nif-dni-nie-cif-validation/dist/nif/nif` | Import from `nif-dni-nie-cif-validation` |

Nothing else changes: every v1 export keeps its name, aliases (`isValidCif`, `isValidCifControlCode`, `CIF_REGEX`, `CIF_CONTROL_LETTERS`) and constants; `replaceNieLetter` is still deprecated and still throws exactly as in v1. The package now also ships ES modules (see [4](#4-only-the-package-entry-points-can-be-imported-48)); `require()` keeps working.

## Breaking changes

### 1. CIF keys C, D, F, G, J, U and V need a digit control (#38)

The AEAT D.I.T. note ([SPEC.md CIF-3](SPEC.md#cif-3)) says the control character of a legal entity NIF (CIF) is a digit for A B C D E F G H J U V and a letter for N P Q R S W. v1 accepted a letter or a digit for C D F G J U V, which has no official basis.

Affects `isValidNif`, `isValidLegalEntityNif` / `isValidCif` and `isValidLegalEntityNifControlCode` / `isValidCifControlCode`.

```ts
// v1
isValidCif("G1234567D"); // true
isValidCif("G12345674"); // true

// v2
isValidCif("G1234567D"); // false: G needs a digit
isValidCif("G12345674"); // true
isValidCif("G1234567D", { cifControl: "lenient" }); // true, as in v1
```

`isValidCifControlCode` doesn't check the format, so v1 also accepted a letter or a digit when the first character was not an organisation key at all (`"X1234567D"`). In v2 such a value has no official control type and returns `false`; `cifControl: "lenient"` keeps the v1 result.

**Restore v1:** `{ cifControl: "lenient" }`. Only C D F G J U V are affected: A B E H always need a digit and N P Q R S W a letter, in both modes, as in v1.

### 2. The input is normalized by default

The boolean validators now clean the input before checking it, as [SPEC.md NORM-2 to NORM-4](SPEC.md#input-cleanup-never-changes-validity-only-parsing) describe:

- white space (spaces, tabs, no-break spaces, line breaks…) and dots are removed anywhere, which also trims (NORM-2);
- hyphens and slashes are removed (NORM-3);
- a DNI with fewer than 8 digits is left-padded with zeros (NORM-4): `1234567L` is checked as `01234567L`.

Cleanup never makes an invalid document valid: it accepts more ways of writing a valid one. So `true` results don't change; some `false` results become `true`.

```ts
// v1
isValidNif(" 12.345.678-Z "); // false
isValidDni("1234567L");       // false
isValidCif("B-1234567-4");    // false

// v2
isValidNif(" 12.345.678-Z "); // true
isValidDni("1234567L");       // true
isValidCif("B-1234567-4");    // true
isValidNif(" 12.345.678-Z ", { normalize: false }); // false, as in v1
```

Lower case and the old 10-character NIE form (`X01234567L`) were already accepted in v1 and still are, with or without `normalize`.

`isValidDniLetter` and `isValidCifControlCode` don't check the format, and v1 read some separators in odd ways: for example `isValidCifControlCode("A 7727886")` was `true` because a space in a digit position counted as `0`. With normalization, white space is removed instead, so such values can change in either direction.

If you store the value, store the canonical form: `normalize(value)` (new in v2) returns it, for example `"12345678Z"` for `" 12.345.678-z "`.

**Restore v1:** `{ normalize: false }`.

### 3. TypeScript: the validators have a second parameter

Every boolean validator now takes `(value: unknown, opts?: IsValidOptions)`. The first parameter was `string` and is now `unknown`, which accepts more and breaks no call. The new second parameter means TypeScript no longer accepts a validator passed straight to an array method, because the array index is not an options object:

```ts
// v1: compiles
ids.filter(isValidNif);

// v2: TypeScript error ("number" is not assignable to "IsValidOptions")
ids.filter(isValidNif);
// v2: write the callback, and pass options if you need them
ids.filter((id) => isValidNif(id));
```

At runtime nothing changes: a number (or `null`) as options is ignored, so plain JavaScript code keeps working.

**Restore v1:** not needed at runtime; in TypeScript, wrap the call as above.

### 4. Only the package entry points can be imported (#48)

v2 ships ES modules and CommonJS, each with its own type declarations, and declares them in an `exports` map. The map allows the package itself (`nif-dni-nie-cif-validation`), its languages (`nif-dni-nie-cif-validation/locales/<code>`, see [Languages](#languages)) and `nif-dni-nie-cif-validation/package.json`. Any other path is blocked, so code that reached into the v1 build output stops working:

```ts
// v1: worked, because the files of dist/ were importable
const { isValidNif } = require("nif-dni-nie-cif-validation/dist/nif/nif");
import { isValidNif } from "nif-dni-nie-cif-validation/dist/index";

// v2: Node throws ERR_PACKAGE_PATH_NOT_EXPORTED, bundlers report the path as
// not exported, and TypeScript (node16, nodenext and bundler resolution)
// reports "Cannot find module"
const { isValidNif } = require("nif-dni-nie-cif-validation");
import { isValidNif } from "nif-dni-nie-cif-validation";
```

Everything the package exports is available from the package itself, so the fix is to import from there. The file layout of `dist/` is an implementation detail and changes between versions (v2 has `dist/esm/*.mjs` and `dist/cjs/*.cjs`).

What else changes for consumers, none of it breaking:

- `import` and `require()` both work on Node 20 and newer and in every bundler. TypeScript finds the right declarations for each (`.d.mts` for `import`, `.d.cts` for `require`). Old tools that ignore `exports` still resolve `main`, `module` and `types`.
- The package declares `"sideEffects": false`, so bundlers drop what you don't import. `import { isValidDni }` adds about 0.6 kB minified and gzipped and does not bundle the error messages or the organisation names.
- The emitted code is ES2016, as in v1, so it runs in every current browser without transpiling.

**Restore v1:** not possible for deep imports; import from the package root.

## New in v2 (not breaking)

All of these are additions; see the JSDoc of each function and [docs/api-design.md](docs/api-design.md).

- `validate(value, opts)` returns `{ valid, type, normalized, error?, meta? }`: the document type, its canonical form, and for invalid values an error code, the [SPEC.md](SPEC.md) rule that failed, a message in the language you pass as `locale` (English by default, see [Languages](#languages)), and the expected control character.

  ```ts
  validate("12345678A");
  // { valid: false, type: "DNI", normalized: "12345678A",
  //   error: { code: "INVALID_CONTROL_CHARACTER", rule: "DNI-2", expected: "Z",
  //            message: 'The control character is not correct: for this DNI it should be "Z".' } }
  ```

- `getNifType(value)`: the document type from its format, without checking the control character.
- `normalize(value)`: the canonical form to store, for example `"12345678Z"` for `" 12.345.678-z "`.
- `format(value, { separator })`: `"12345678-Z"`, `"X-1234567-L"`, `"B-1234567-4"`, or `null` if invalid.
- `computeControlCharacter(partial)`: `"Z"` for `"12345678"`, `"4"` for `"B1234567"`.
- `describeCifOrganisation(key, locale)`: `"Limited liability company"` for `"B"`, `"Sociedad de responsabilidad limitada"` with `es`.
- `isValidSpanishVat(value)`: `ES` + a valid NIF. It checks the format only, not whether the number is registered in VIES.
- Options: `rejectPlaceholders` (reject `00000000T`, `00000001R`, `99999999R`, `X0000000T`), and for `validate` also `types`, `allowVatPrefix` and `locale`.
- Locales: `nif-dni-nie-cif-validation/locales/es` (and `/locales/en`), see [Languages](#languages).
- Types: `NifType`, `NifErrorCode`, `NifLocale`, `NifMessages`, `NifLengthRule`, `NifFormatRule`, `CifOrganisationKey`, `CifControlMode`, `ValidateOptions`, `IsValidOptions`, `GetNifTypeOptions`, `ValidationResult`, `NifValidationError`, `CifOrganisationMeta`, `FormatOptions`.

## Languages

`validate()` and `describeCifOrganisation()` answer in English unless you pass a locale object. Each language is a separate entry point of the package, so a bundle only contains the languages it imports (English is built in):

```ts
import { validate, describeCifOrganisation } from "nif-dni-nie-cif-validation";
import { es } from "nif-dni-nie-cif-validation/locales/es";

validate("12345678A", { locale: es }).error?.message;
// "El carácter de control no es correcto: para este DNI debería ser «Z»."
describeCifOrganisation("B", es); // "Sociedad de responsabilidad limitada"
```

| Language | Entry point | Object |
| --- | --- | --- |
| English (default) | `nif-dni-nie-cif-validation/locales/en` | `en` |
| Spanish | `nif-dni-nie-cif-validation/locales/es` | `es` |
| Catalan, also for Valencian | `nif-dni-nie-cif-validation/locales/ca` | `ca` |
| Basque | `nif-dni-nie-cif-validation/locales/eu` | `eu` |

Each entry point also has a default export, and works with `require()`: `const { es } = require("nif-dni-nie-cif-validation/locales/es")`.

**Changed during the v2 pre-release.** Earlier drafts of the v2 docs showed `locale: "es"` (a language code) and `describeCifOrganisation(key, "es")`. That was never released. Pass the imported object instead:

```ts
// v2 pre-release docs
validate(value, { locale: "es" });
describeCifOrganisation("B", "es");

// v2
import { es } from "nif-dni-nie-cif-validation/locales/es";
validate(value, { locale: es });
describeCifOrganisation("B", es);
```

A string is still accepted at runtime, so plain JavaScript that follows the old docs doesn't break, but it is ignored: the messages are in English. TypeScript reports it as an error. Nothing throws: anything that is not a locale object gives English, and a locale object that lacks a text gives English for that text.

## Checklist

1. Upgrade, and run your tests.
2. If stored CIFs with a letter control for C D F G J U V must stay valid, pass `{ cifControl: "lenient" }` where you validate them, and plan to fix the data (the AEAT assigns a digit to those keys).
3. If some code relied on `false` for values with separators (for example to force users to type the canonical form), pass `{ normalize: false }`, or better, store `normalize(value)`.
4. In TypeScript, replace `array.filter(isValidX)` with an arrow function.
5. If you import files from `nif-dni-nie-cif-validation/dist/...`, import from `nif-dni-nie-cif-validation` instead.
6. If you want messages in Spanish, import the locale object (`nif-dni-nie-cif-validation/locales/es`) and pass it as `locale`.
