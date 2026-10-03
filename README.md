<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/josegoval/nif-dni-nie-cif-validation/master/brand/readme-header-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/josegoval/nif-dni-nie-cif-validation/master/brand/readme-header-light.svg">
    <img alt="nif-dni-nie-cif-validation: Spanish NIF, DNI, NIE & CIF validation. Tiny. Typed. Correct." src="https://raw.githubusercontent.com/josegoval/nif-dni-nie-cif-validation/master/brand/readme-header-light.svg" width="720">
  </picture>
</p>

<p align="center"><strong>English</strong> · <a href="README.es.md">Español</a></p>

`nif-dni-nie-cif-validation` checks Spanish tax IDs (NIF, DNI, K/L/M NIF, NIE and CIF) against the official rules, and tells you why a number is wrong. Every rule it applies has a source documented in [SPEC.md](SPEC.md): the law, official guidance, an AEAT technical note, or a convention labelled as such.

The website has the guides, the API reference, a live validator and the benchmarks, in English, Spanish, Catalan, Basque and Galician: <https://josegoval.github.io/nif-dni-nie-cif-validation/>.

<!-- badges:start -->
<p>
  <a href="https://www.npmjs.com/package/nif-dni-nie-cif-validation"><img alt="npm version" src="https://img.shields.io/npm/v/nif-dni-nie-cif-validation?style=flat"></a>
  <a href="https://npm-stat.com/charts.html?package=nif-dni-nie-cif-validation"><img alt="npm downloads per month" src="https://img.shields.io/npm/dm/nif-dni-nie-cif-validation?style=flat"></a>
  <a href="#performance"><img alt="isValidNif: 929 B min+gzip" src="https://img.shields.io/badge/min%2Bgzip-isValidNif%20929%20B-blue?style=flat"></a>
  <a href="https://www.npmjs.com/package/nif-dni-nie-cif-validation#provenance"><img alt="npm provenance" src="https://img.shields.io/badge/npm-provenance-blue?style=flat"></a>
  <a href="https://github.com/josegoval/nif-dni-nie-cif-validation/actions/workflows/release.yml"><img alt="CI status" src="https://img.shields.io/github/actions/workflow/status/josegoval/nif-dni-nie-cif-validation/release.yml?branch=master&amp;label=CI&amp;style=flat"></a>
  <a href="https://josegoval.github.io/nif-dni-nie-cif-validation/coverage/"><img alt="coverage: 100% required by CI" src="https://img.shields.io/endpoint?url=https://josegoval.github.io/nif-dni-nie-cif-validation/coverage/badge.json&amp;style=flat"></a>
  <a href="LICENSE"><img alt="license: MIT" src="https://img.shields.io/npm/l/nif-dni-nie-cif-validation?style=flat"></a>
</p>
<!-- badges:end -->

## Quick start

```sh
npm install nif-dni-nie-cif-validation
```

<details>
<summary>pnpm, yarn, bun, deno</summary>

```sh
pnpm add nif-dni-nie-cif-validation
```

```sh
yarn add nif-dni-nie-cif-validation
```

```sh
bun add nif-dni-nie-cif-validation
```

```sh
deno add npm:nif-dni-nie-cif-validation
```

</details>

```ts
import { isValidNif, validate } from "nif-dni-nie-cif-validation";

isValidNif("12345678Z");      // true
isValidNif(" 12.345.678-z "); // true: spaces, dots and hyphens are removed, and lower case becomes upper case
isValidNif("B12345675");      // false: wrong control digit
validate("12345678A").error?.message; // 'The control character is not correct: for this DNI it should be "Z".'
```

## Contents

- [Which function do I need?](#which-function-do-i-need)
- [Features](#features)
- [API overview](#api-overview)
- [Command line](#command-line)
- [Recipes](#recipes): Zod and React Hook Form, Express, test data, messages in Catalan
- [DNI, NIE, NIF and CIF](#dni-nie-nif-and-cif)
- [Law, official guidance and convention](#law-official-guidance-and-convention)
- [Performance](#performance)
- [Comparison with other libraries](#comparison-with-other-libraries)
- [Using this package with AI coding agents](#using-this-package-with-ai-coding-agents)
- [Migrating](#migrating)
- [Contributing, security and license](#contributing-security-and-license)

## Which function do I need?

| I want to… | Use | Import from |
| --- | --- | --- |
| Accept any valid NIF: DNI, K/L/M, NIE or CIF | `isValidNif(value)` | `nif-dni-nie-cif-validation` |
| Accept people only: DNI, K/L/M or NIE | `isValidNaturalPersonNif(value)` | `nif-dni-nie-cif-validation` |
| Accept a DNI (or a K/L/M NIF) | `isValidDni(value)` | `nif-dni-nie-cif-validation` |
| Accept an NIE | `isValidNie(value)` | `nif-dni-nie-cif-validation` |
| Accept companies and other entities (CIF) | `isValidCif(value)`, alias `isValidLegalEntityNif` | `nif-dni-nie-cif-validation` |
| Accept a Spanish VAT number (`ES` + NIF, format only) | `isValidSpanishVat(value)` | `nif-dni-nie-cif-validation` |
| Know **why** a value is invalid, its type, and what to store | `validate(value, options)` | `nif-dni-nie-cif-validation` |
| Get the canonical form to store | `normalize(value)` | `nif-dni-nie-cif-validation` |
| Display it grouped, as `12345678-Z` | `format(value)` | `nif-dni-nie-cif-validation` |
| Detect the type without checking the control character | `getNifType(value)` | `nif-dni-nie-cif-validation` |
| Compute the control character of a number | `computeControlCharacter(partial)` | `nif-dni-nie-cif-validation` |
| Name the kind of organisation of a CIF | `describeCifOrganisation(key, locale)` | `nif-dni-nie-cif-validation` |
| Check only the control character, not the format | `isValidDniLetter(value)`, `isValidCifControlCode(value)` (alias `isValidLegalEntityNifControlCode`) | `nif-dni-nie-cif-validation` |
| Show messages in Spanish, Catalan, Basque or Galician | `es`, `ca`, `eu`, `gl` (and `en`), passed as `{ locale }` | `nif-dni-nie-cif-validation/locales/<code>` |
| Make valid fake numbers for tests | `generateDni`, `generateNie`, `generateCif`, `generateNif`, `createGenerator` | `nif-dni-nie-cif-validation/generate` |
| Make invalid values for negative tests | `generateInvalid(type, { reason })` | `nif-dni-nie-cif-validation/generate` |
| Validate from a terminal, a script or an agent's tool call, or check a CSV file | `npx nif-dni-nie-cif-validation validate <value...>`, `check --file <csv> --column <name>` | the command line ([below](#command-line)) |
| Validate a form field with Zod | `zNif`, `zDni`, `zNie`, `zCif`, `zSpanishVat` | `nif-dni-nie-cif-validation/zod` |
| … with Valibot | `vNif`, `vDni`, `vNie`, `vCif`, `vSpanishVat` | `nif-dni-nie-cif-validation/valibot` |
| … with Yup | `yNif`, `yDni`, `yNie`, `yCif`, `ySpanishVat` | `nif-dni-nie-cif-validation/yup` |
| Keep using the v1 regexes and letter tables | `DNI_REGEX`, `NIE_REGEX`, `LEGAL_ENTITY_NIF_REGEX` (alias `CIF_REGEX`), `DNI_CONTROL_LETTERS`, `LEGAL_ENTITY_CONTROL_LETTERS` (alias `CIF_CONTROL_LETTERS`). The regular expressions check the format only, and the tables hold the control letters: prefer the functions above | `nif-dni-nie-cif-validation` |
| Swap the NIE letter for its digit (v1) | `replaceNieLetter(value)`: deprecated, throws on bad input | `nif-dni-nie-cif-validation` |

## Features

- **Correct, with sources.** Every rule has an ID (`DNI-2`, `NIE-3`, `CIF-3`…) and a source in [SPEC.md](SPEC.md): the law, an official government page, the AEAT's technical note, or a convention labelled as such. Every error names the rule that failed. The tests cover every rule, compare the results with [stdnum](https://www.npmjs.com/package/stdnum) on about 100,000 inputs, and compare every v1 function with v1.0.11 on about 490,000 inputs.
- **0 runtime dependencies.** Zod, Valibot and Yup are optional peer dependencies, needed only by their adapters.
- **Small.** One boolean validator adds less than 1 kB minified and gzipped, and `validate()` with its English messages less than 3 kB. CI enforces these budgets (`pnpm size`); the size of each function is under [Performance](#performance).
- **Typed.** Written in TypeScript, with declarations for `import` and for `require`, and the types exported (`ValidationResult`, `NifType`, `NifErrorCode`…).
- **ES modules and CommonJS**, tree-shakable, compiled to ES2016: Node.js 20 or newer and every current browser.
- **Never throws on user input.** Validators take `unknown`: `null`, numbers and objects give `false` (or `NOT_A_STRING` from `validate()`). Only `replaceNieLetter`, which is deprecated, throws on bad input; the generators throw a `RangeError` when their options can't be met, because those are programming errors.
- **Normalization.** `" 12.345.678-z "`, `"x-0123456-7l"` and `"1234567L"` are valid; `normalize()` gives the form to store. `{ normalize: false }` turns off the removal of separators and the zero padding; lower case and the old NIE form are still accepted.
- **Error messages in 5 languages**: English (built in), Spanish, Catalan (also for Valencian), Basque and Galician. Each language is its own import, so your bundle only has the ones you use.
- **Test-data generators** (`/generate`): valid numbers with the library's own control characters, the same for a given seed on every platform, and invalid values for each error code.
- **Schema adapters** for Zod 4, Valibot 1 and Yup 1: they output the normalized value and give the localized message, the error code and the SPEC rule.
- **A command line interface**: `npx nif-dni-nie-cif-validation validate 12345678Z`, with `--json` output and exit codes for scripts and agents, test data and CSV checks. It is not part of the library's bundle.

## API overview

Every export has JSDoc, so your editor shows its documentation: a summary and, for functions, what each parameter and the return value mean, two examples that the tests run, and a link to the SPEC rule. CI checks it. The design and the reasons behind it are in [docs/api-design.md](docs/api-design.md); the changes from v1 in [MIGRATION.md](MIGRATION.md).

### `validate()`: the detailed result

```ts
import { validate } from "nif-dni-nie-cif-validation";

validate(" b-1234567-4 ");
// { valid: true, type: "CIF", normalized: "B12345674",
//   meta: { orgKey: "B", orgDescription: "Limited liability company" } }

validate("12345678A");
// { valid: false, type: "DNI", normalized: "12345678A",
//   error: { code: "INVALID_CONTROL_CHARACTER", rule: "DNI-2", expected: "Z",
//            message: 'The control character is not correct: for this DNI it should be "Z".' } }
```

| Field | Value |
| --- | --- |
| `valid` | `true` or `false`, with the options given |
| `type` | `"DNI"`, `"NIE"`, `"CIF"`, `"NIF_KLM"` or `null` when the format is not recognisable. Set even when the control character is wrong, so you can say "this DNI's letter should be Z" |
| `normalized` | The canonical form to store (upper case, no separators, old NIE form collapsed, short DNI padded), or `null` |
| `error` | Only when invalid: `code`, `message` (in the locale), `rule` (the SPEC.md rule ID) and, for a wrong control character, `expected` |
| `meta` | Only for a CIF: `orgKey` and `orgDescription` (the kind of organisation, in the locale) |

Error codes, and the rules that produce them:

| `error.code` | When | `error.rule` |
| --- | --- | --- |
| `NOT_A_STRING` | The value is not a string | `INPUT-1` |
| `EMPTY` | Empty or made only of spaces and separators | `INPUT-2` |
| `INVALID_LENGTH` | Not 9 characters (10 for an old NIE) | `DNI-1`, `KLM-1`, `NIE-1`, `NIE-3`, `CIF-1`, `VAT-1` |
| `INVALID_FORMAT` | Wrong first character, letters where digits go, or an `ES` prefix without `allowVatPrefix` | `NIF-1`, `DNI-1`, `KLM-1`, `KLM-3`, `NIE-1`, `CIF-1`, `VAT-1` |
| `INVALID_CONTROL_CHARACTER` | Wrong check letter or digit; `expected` has the right one | `DNI-2`, `DNI-3`, `KLM-2`, `NIE-2`, `CIF-3`, `CIF-4` |
| `UNSUPPORTED_TYPE` | A valid document of a type left out of `types` | `POLICY-2` |
| `PLACEHOLDER` | `00000000T`, `00000001R`, `99999999R` or `X0000000T` with `rejectPlaceholders` | `POLICY-1` |

### Options

| Option | Default | Effect | Accepted by |
| --- | --- | --- | --- |
| `normalize` | `true` | Ignore white space, dots, hyphens and slashes, and pad a short DNI (NORM-2 to NORM-4) | every function that validates, `getNifType()`, schemas |
| `cifControl` | `"official"` | `"lenient"` also accepts a letter control for the CIF keys C D F G J U V, as v1 did (CIF-3) | every function that validates, schemas |
| `rejectPlaceholders` | `false` | Reject the placeholder numbers (POLICY-1) | every function that validates, schemas |
| `types` | every type | Accept only these types (POLICY-2) | `validate()`, `zNif`, `vNif`, `yNif` |
| `allowVatPrefix` | `false` | Also accept `ES` + NIF; `normalized` drops the `ES` (VAT-1) | `validate()`, `getNifType()`, schemas other than `*SpanishVat` |
| `locale` | English | The language of `error.message` and `meta.orgDescription` | `validate()`, schemas |

```ts
import { isValidCif, validate } from "nif-dni-nie-cif-validation";

validate("B12345674", { types: ["DNI", "NIE"] }).error?.code;   // "UNSUPPORTED_TYPE"
validate("00000000T", { rejectPlaceholders: true }).error?.code; // "PLACEHOLDER"
validate("ES12345678Z", { allowVatPrefix: true }).normalized;    // "12345678Z"
isValidCif("G1234567D");                          // false: G takes a digit (CIF-3)
isValidCif("G1234567D", { cifControl: "lenient" }); // true, as in v1
```

### Boolean validators

```ts
import {
  isValidCif, isValidDni, isValidNaturalPersonNif, isValidNie, isValidNif, isValidSpanishVat,
} from "nif-dni-nie-cif-validation";

isValidNif("X1234567L");              // true: any type
isValidNaturalPersonNif("B12345674"); // false: a CIF is not a person
isValidDni("K1234567L");              // true: DNI and K/L/M NIF
isValidNie("X01234567L");             // true: the old 10-character form (NIE-3)
isValidCif("P2807900B");              // true: Ayuntamiento de Madrid
isValidSpanishVat("ES12345678Z");     // true: the format only, not a VIES lookup
isValidNif(null);                     // false: never throws
```

They are fast on canonical input and allocate nothing there. With CommonJS:

```js
const { isValidNif } = require("nif-dni-nie-cif-validation");

isValidNif("12345678Z"); // true
```

### Helpers

```ts
import {
  computeControlCharacter, describeCifOrganisation, format, getNifType, normalize,
} from "nif-dni-nie-cif-validation";

normalize(" x-0123456-7l ");             // "X1234567L"
format("12345678z");                     // "12345678-Z"
format("B12345674", { separator: " " }); // "B 1234567 4"
format("12345678A");                     // null: only valid documents are formatted
getNifType("12345678A");                 // "DNI": the format only, the letter is wrong
computeControlCharacter("B1234567");     // "4"
describeCifOrganisation("B");            // "Limited liability company"
```

### Languages

English is built in. Every other language is its own entry point: import the object and pass it.

```ts
import { describeCifOrganisation, validate } from "nif-dni-nie-cif-validation";
import { es } from "nif-dni-nie-cif-validation/locales/es";

validate("12345678A", { locale: es }).error?.message;
// "El carácter de control no es correcto: para este DNI debería ser «Z»."
describeCifOrganisation("B", es); // "Sociedad de responsabilidad limitada"
```

| Language | Import |
| --- | --- |
| English (the default) | `import { en } from "nif-dni-nie-cif-validation/locales/en"` |
| Spanish (español) | `import { es } from "nif-dni-nie-cif-validation/locales/es"` |
| Catalan (català), also for Valencian (valencià) | `import { ca } from "nif-dni-nie-cif-validation/locales/ca"` |
| Basque (euskara) | `import { eu } from "nif-dni-nie-cif-validation/locales/eu"` |
| Galician (galego) | `import { gl } from "nif-dni-nie-cif-validation/locales/gl"` |

Pass the object, not its code: a string such as `"es"` is ignored and gives English. The sources of the organisation names are in [docs/translations.md](docs/translations.md).

### Test-data generators

```ts
import {
  createGenerator, generateCif, generateDni, generateInvalid, generateNie, generateNif,
} from "nif-dni-nie-cif-validation/generate";

generateDni({ seed: 1 });                 // "62707394X": the same on every run and platform
generateDni({ seed: 1, kind: "K" });      // "K6270739L"
generateNie({ seed: 1, prefix: "Z" });    // "Z6270739R"
generateCif({ seed: 1, orgKey: "B" });    // "B62707393"
generateNif({ types: ["DNI", "NIE"] });   // a random DNI or NIE (Math.random without a seed)
generateInvalid("DNI", { seed: 1, reason: "INVALID_LENGTH" }); // "652707394X"

const gen = createGenerator(2024); // a stream: different values, the same on every run
gen.dni() === gen.dni();           // false
```

Every generator takes `format: true` for the display form. Valid generated numbers follow SPEC.md and are never on the POLICY-1 placeholder list, but they are made up: one may match a real person or company by chance, so use them in tests only. The main entry point never imports this module.

### Schema adapters: Zod, Valibot, Yup

```ts
import { z } from "zod";
import { zNif } from "nif-dni-nie-cif-validation/zod";

const schema = z.object({ nif: zNif({ types: ["DNI", "NIE"] }) });

schema.parse({ nif: " 12.345.678-z " });        // { nif: "12345678Z" }
schema.safeParse({ nif: "B12345674" }).success; // false: a CIF is not accepted here
```

```ts
import * as v from "valibot";
import { vNie } from "nif-dni-nie-cif-validation/valibot";

v.parse(vNie(), "x-0123456-7l"); // "X1234567L"
```

```ts
import { object } from "yup";
import { yCif } from "nif-dni-nie-cif-validation/yup";

await object({ cif: yCif() }).validate({ cif: "b-1234567-4" }); // { cif: "B12345674" }
```

| Library | Entry point | Schemas | Code and rule of an error |
| --- | --- | --- | --- |
| Zod 4 | `/zod` | `zNif`, `zDni`, `zNie`, `zCif`, `zSpanishVat` | the issue's `params`: `{ code, rule, expected? }` |
| Valibot 1 | `/valibot` | `vNif`, `vDni`, `vNie`, `vCif`, `vSpanishVat` | the issue: `issue.code`, `issue.rule`, `issue.expected` |
| Yup 1 | `/yup` | `yNif`, `yDni`, `yNie`, `yCif`, `ySpanishVat` | the `ValidationError`'s `params` |

Each schema takes the options of `validate()` and accepts exactly what `validate()` accepts. Install only the library you use; importing the core never loads an adapter. More in [docs/api-design.md](docs/api-design.md) (D12).

## Command line

The package also works from a terminal, a shell script or an AI agent's tool call, with no code to write. It needs Node.js 20 or newer:

```sh
npx nif-dni-nie-cif-validation validate 12345678Z " x-0123456-7l " 12345678A
# 12345678Z: valid DNI 12345678Z
# " x-0123456-7l ": valid NIE X1234567L
# 12345678A: invalid [DNI-2 INVALID_CONTROL_CHARACTER] The control character is not correct: for this DNI it should be "Z".
npx nif-dni-nie-cif-validation generate dni --count 3 --seed 42
# 60110375J
# 44829056D
# 85246578E
```

| Command | What it does |
| --- | --- |
| `validate <value...>` | Validates each value: its type and canonical form, or the SPEC rule, error code and message |
| `type <value>` | Detects the type from the format only, like `getNifType()` |
| `normalize <value>` | Prints the canonical form, like `normalize()` |
| `generate <type>` | Prints test values: `dni`, `nie`, `cif` or `nif`, with `--count`, `--seed` and `--format` |
| `check --file <csv> --column <name>` | Validates one column of a CSV file and reports the invalid rows by row number |

`validate` and `check` take the options of `validate()` as flags: `--types DNI,NIE`, `--cif-control lenient`, `--reject-placeholders`, `--allow-vat-prefix` and `--locale es` (or `ca`, `eu`, `gl`). The exit code is 0 when everything is valid, 1 when something is invalid and 2 for a usage error, and `--json` prints one JSON document for scripts and agents (for `validate`, an array with `validate()`'s result for each value). For a CSV file such as this `customers.csv`:

```csv
id,nif,name
1,12345678Z,Ana
2,"B-1234567-4","Acme, S.L."
3,12345678A,Luis
```

```sh
npx nif-dni-nie-cif-validation check --file customers.csv --column nif
# row 4: 12345678A: invalid [DNI-2 INVALID_CONTROL_CHARACTER] The control character is not correct: for this DNI it should be "Z".
# 3 rows checked in customers.csv, column "nif": 2 valid, 1 invalid
```

`npx nif-dni-nie-cif-validation --help` lists every command and option. The JSON shapes and the details of the CSV reader are in [docs/api-design.md](docs/api-design.md) (D13).

## Recipes

Each recipe, and more, is a runnable project in [examples/](examples/): [Node, CommonJS](examples/node-cjs) and [ES modules](examples/node-esm), [React Hook Form with Zod](examples/zod-react-hook-form) (Vite and React), [Express](examples/express-middleware), [a Next.js server action](examples/nextjs-server-action), [Valibot](examples/valibot), [Yup](examples/yup), [Vitest fixtures with the generators](examples/generate-test-data), [bulk validation of a CSV, with its throughput](examples/csv-bulk-validation), [Deno](examples/deno) and [Bun](examples/bun). CI builds, type-checks or runs each one against the packed package.

### Zod and React Hook Form

The schema takes the user's language and outputs the normalized value:

```ts
// nif-schema.ts
import { z } from "zod";
import { es } from "nif-dni-nie-cif-validation/locales/es";
import { zNif } from "nif-dni-nie-cif-validation/zod";

export const schema = z.object({ nif: zNif({ types: ["DNI", "NIE"], locale: es }) });

schema.safeParse({ nif: "12345678A" }).error?.issues[0]?.message;
// "El carácter de control no es correcto: para este DNI debería ser «Z»."
```

`@hookform/resolvers` works with it as it is, and `handleSubmit` receives `"12345678Z"` for `" 12.345.678-z "`:

<!-- readme-test: skip (needs react, react-hook-form and @hookform/resolvers, which are not dev dependencies; the schema above is tested) -->
```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { schema } from "./nif-schema";

export function NifForm({ save }: { save: (nif: string) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<
    z.input<typeof schema>, unknown, z.output<typeof schema>
  >({ resolver: zodResolver(schema) });
  return (
    <form onSubmit={handleSubmit(({ nif }) => save(nif))}>
      <input {...register("nif")} />
      {errors.nif && <p role="alert">{errors.nif.message}</p>}
    </form>
  );
}
```

### Express middleware

Reject a request with a useful message, and pass the normalized NIF on:

```ts
import { validate } from "nif-dni-nie-cif-validation";

export function requireNif(
  req: { body: { nif?: unknown } },
  res: { status(code: number): { json(body: unknown): unknown } },
  next: () => void,
): void {
  const result = validate(req.body.nif);
  if (!result.valid) {
    res.status(400).json({ error: result.error }); // { code, message, rule, expected? }
    return;
  }
  req.body.nif = result.normalized; // "12345678Z", ready to store
  next();
}

// app.post("/customers", express.json(), requireNif, createCustomer);
```

### Generating test data

Generate NIFs for your fixtures without copying real people's data or writing your own check-letter code:

```ts
import { validate } from "nif-dni-nie-cif-validation";
import { createGenerator, generateInvalid } from "nif-dni-nie-cif-validation/generate";

const gen = createGenerator(42); // the same fixtures on every run
const customers = Array.from({ length: 3 }, (_, id) => ({ id, nif: gen.nif() }));

customers.every((customer) => validate(customer.nif).valid); // true
validate(generateInvalid("NIE", { seed: 7 })).error?.code;   // "INVALID_CONTROL_CHARACTER"
validate(generateInvalid("CIF", { seed: 7, reason: "INVALID_FORMAT" })).error?.code; // "INVALID_FORMAT"
```

### Messages in Catalan

Pick the locale from the user's language, with a fallback:

```ts
import { type NifLocale, validate } from "nif-dni-nie-cif-validation";
import { ca } from "nif-dni-nie-cif-validation/locales/ca";
import { en } from "nif-dni-nie-cif-validation/locales/en";
import { es } from "nif-dni-nie-cif-validation/locales/es";

const LOCALES: Record<string, NifLocale> = { ca, en, es };
const localeFor = (language: string) => LOCALES[language.slice(0, 2)] ?? en;
const locale = localeFor("ca-ES"); // for example navigator.language

validate("12345678A", { locale }).error?.message;
// "El caràcter de control no és correcte: per a aquest DNI hauria de ser «Z»."
validate("B12345674", { locale }).meta?.orgDescription; // "Societat de responsabilitat limitada"
```

## DNI, NIE, NIF and CIF

- **NIF** (*número de identificación fiscal*) is the tax ID of every person and entity in Spain (RD 1065/2007). Everything this package validates is a NIF.
- **DNI**: for Spanish citizens, the NIF is the DNI number: 8 digits and a check letter, `12345678Z` ([DNI-1, DNI-2](SPEC.md#dni-1)).
- **NIE**: for foreigners, `X`, `Y` or `Z`, 7 digits and a check letter, `X1234567L`. The old 10-character form, `X0` followed by 7 digits and a check letter (`X01234567L`), is still valid ([NIE-1 to NIE-3](SPEC.md#nie-1)).
- **K/L/M NIF**: people without a DNI or NIE. K: Spaniards under 14 living in Spain; L: Spaniards living abroad; M: foreigners without an NIE. They are natural persons, not companies ([KLM-1 to KLM-3](SPEC.md#klm-1)).
- **CIF**: until 2008, the name of the NIF of legal persons and entities; officially it is now the "NIF of a legal person or entity". An organisation key, 7 digits and a control character, `B12345674` ([CIF-1 to CIF-5](SPEC.md#cif-1)). The package keeps the name `CIF` (`isValidCif`, `type: "CIF"`) because it is what people search for.
- **VAT number**: `ES` followed by a NIF (`ES12345678Z`, [VAT-1](SPEC.md#vat-1)). A valid format doesn't mean the number is registered in VIES.

## Law, official guidance and convention

Not every rule you find online has an official source. [SPEC.md](SPEC.md) gives each rule one of four tiers:

| Tier | Source | Example |
| --- | --- | --- |
| T1: law | Published in the BOE | The formats of DNI, NIE, K/L/M and CIF, and the CIF organisation keys |
| T2: official page | Ministerio del Interior, AEAT | The DNI check letter (mod 23), which no BOE text defines |
| T3: semi-official | The AEAT's internal technical note | Which CIF keys take a digit and which a letter (CIF-3) |
| T4: convention | Industry practice, no official text | Accepting lower case and separators; the CIF control arithmetic (CIF-4) |

By default only T1 to T3 decide what is valid. T4 conventions apply only to input cleanup (which never makes an invalid document valid), with one documented exception: no official text publishes the CIF control arithmetic, so the universal algorithm is used and was checked against real public-body NIFs ([CIF-4](SPEC.md#cif-4)). Everything else is opt-in: `cifControl: "lenient"` (v1's letter-or-digit CIF control), `rejectPlaceholders`, `types` and `allowVatPrefix`. `normalize: false` turns off the removal of separators and the zero padding (lower case and the old NIE form are still accepted). Folklore rules with no source, such as province codes in a CIF or a `T` prefix, are listed in SPEC.md as not implemented.

## Performance

<!-- bench:start -->
Measured with `pnpm bench:competitors` on AMD EPYC 9V74 80-Core Processor (4 cores, 16 GiB, linux 6.17.0-1022-azure, x64), Node.js v24.21.0, on 2026-10-02, at commit `1166241`. Every number in this section comes from [`bench/results/latest.json`](bench/results/latest.json) and is written by `pnpm readme:bench`. How they are measured, and the caveats: [bench/README.md](bench/README.md). Full results: [bench/results/latest.md](bench/results/latest.md).

#### Throughput

Millions of validations per second (**M ops/s, higher is faster**): the median of 3 rounds, each library with its default options, on valid and invalid documents in canonical form (225 DNI, 150 NIE, 270 CIF). *unsupported*: the library has no validator for that type. Absolute numbers depend on the machine; the ratios are what carries over.

| Library | DNI | NIE | CIF |
| --- | ---: | ---: | ---: |
| **nif-dni-nie-cif-validation** (this build) | **60.12** | **57.60** | **55.06** |
| [nif-dni-nie-cif-validation](https://www.npmjs.com/package/nif-dni-nie-cif-validation) 1.0.11 | 8.59 | 6.44 | 7.27 |
| [spain-id](https://www.npmjs.com/package/spain-id) 1.1.14 | 6.96 | 4.01 | 4.50 |
| [better-dni](https://www.npmjs.com/package/better-dni) 4.4.2 | 8.44 | 8.17 | *unsupported* |
| [dni-js](https://www.npmjs.com/package/dni-js) 1.0.0 | 8.90 | 4.49 | *unsupported* |
| [stdnum](https://www.npmjs.com/package/stdnum) 1.12.6 | 0.41 | 0.39 | 0.38 |
| [validator.js `isIdentityCard(x, "ES")`](https://www.npmjs.com/package/validator) 13.15.35 | 5.73 | 3.14 | *unsupported* |
| [validator.js `isTaxID(x, "es-ES")`](https://www.npmjs.com/package/validator) 13.15.35 | 4.22 | 3.42 | *unsupported* |
| [@maistik/validate-nif](https://www.npmjs.com/package/@maistik/validate-nif) 2.0.1 | 9.46 | 8.39 | 7.74 |
| [@kreyo/nif-validator](https://www.npmjs.com/package/@kreyo/nif-validator) 0.1.0 | 2.78 | 2.65 | 2.50 |
| [jsvat](https://www.npmjs.com/package/jsvat) 2.5.4 | 2.10 | 1.59 | 2.37 |

Against v1.0.11, this build is 7.0× (DNI), 8.9× (NIE) and 7.6× (CIF) as fast.
No other library was faster on any of these sets.

#### Bundle size

Minified and gzipped (**min+gzip, lower is smaller**): one validator of each type, bundled with esbuild as `pnpm size` does, and the whole library.

| Library | DNI | NIE | CIF | Any type | Whole library |
| --- | ---: | ---: | ---: | ---: | ---: |
| **nif-dni-nie-cif-validation** (this build) | **623 B** | **586 B** | **568 B** | **929 B** | **4,679 B** |
| [nif-dni-nie-cif-validation](https://www.npmjs.com/package/nif-dni-nie-cif-validation) 1.0.11 | 1,517 B | 1,517 B | 1,518 B | 1,517 B | 1,514 B |
| [spain-id](https://www.npmjs.com/package/spain-id) 1.1.14 | 165 B | 237 B | 363 B | 583 B | 704 B |
| [better-dni](https://www.npmjs.com/package/better-dni) 4.4.2 | 1,135 B | 1,135 B | *unsupported* | 1,134 B | 1,132 B |
| [dni-js](https://www.npmjs.com/package/dni-js) 1.0.0 | 883 B | 882 B | *unsupported* | 882 B | 880 B |
| [stdnum](https://www.npmjs.com/package/stdnum) 1.12.6 | 51,063 B | 51,063 B | 51,063 B | 51,063 B | 51,054 B |
| [validator.js `isIdentityCard(x, "ES")`](https://www.npmjs.com/package/validator) 13.15.35 | 2,539 B | 2,539 B | *unsupported* | 2,539 B | 44,449 B |
| [validator.js `isTaxID(x, "es-ES")`](https://www.npmjs.com/package/validator) 13.15.35 | 6,537 B | 6,537 B | *unsupported* | 6,537 B | 44,449 B |
| [@maistik/validate-nif](https://www.npmjs.com/package/@maistik/validate-nif) 2.0.1 | 215 B | 243 B | 319 B | 456 B | 1,189 B |
| [@kreyo/nif-validator](https://www.npmjs.com/package/@kreyo/nif-validator) 0.1.0 | 533 B | 533 B | 533 B | 533 B | 746 B |
| [jsvat](https://www.npmjs.com/package/jsvat) 2.5.4 | 1,186 B | 1,186 B | 1,186 B | 1,186 B | 5,266 B |

Smaller than this build for one validator of any type: [spain-id](https://www.npmjs.com/package/spain-id) 1.1.14 (583 B), [dni-js](https://www.npmjs.com/package/dni-js) 1.0.0 (882 B), [@maistik/validate-nif](https://www.npmjs.com/package/@maistik/validate-nif) 2.0.1 (456 B) and [@kreyo/nif-validator](https://www.npmjs.com/package/@kreyo/nif-validator) 0.1.0 (533 B). Some of the smaller libraries validate fewer types. This package spends bytes on input normalization (NORM-1 to NORM-4), the CIF-3 control types and K/L/M support. Libraries published only as CommonJS can't be tree-shaken, so one function costs the whole library. Multi-country and multi-purpose libraries (stdnum, validator.js) are larger by design. Also measured, [stdnum](https://www.npmjs.com/package/stdnum) 1.12.6, with a deep import of its Spanish NIF module (not documented): 2,468 B.

#### Agreement with SPEC.md

The share of the 125 fixtures of `test/fixtures` (default options) that each library judges as SPEC.md does, valid or invalid. **This is agreement with SPEC.md, not correctness in the absolute**: the maintainers of this package wrote the rules and the fixtures, so it agrees with them by construction. Many disagreements are decisions that SPEC.md documents (for example CIF-3, or accepting the old NIE form); latest.md lists them per library. "Canonical input" leaves out the fixtures that need normalization.

| Library | DNI | NIE | CIF | K/L/M | All | Canonical input |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **nif-dni-nie-cif-validation** (this build) | **100.0%** | **100.0%** | **100.0%** | **100.0%** | **100.0%** | **100.0%** |
| [nif-dni-nie-cif-validation](https://www.npmjs.com/package/nif-dni-nie-cif-validation) 1.0.11 | 73.3% | 88.9% | 83.6% | 100.0% | 84.0% | 92.2% |
| [spain-id](https://www.npmjs.com/package/spain-id) 1.1.14 | 90.0% | 77.8% | 86.9% | 36.4% | 82.4% | 85.4% |
| [better-dni](https://www.npmjs.com/package/better-dni) 4.4.2 | 73.3% | 77.8% | *unsupported* | 45.5% | 71.9% | 86.7% |
| [dni-js](https://www.npmjs.com/package/dni-js) 1.0.0 | 76.7% | 77.8% | *unsupported* | 45.5% | 73.4% | 86.7% |
| [stdnum](https://www.npmjs.com/package/stdnum) 1.12.6 | 90.0% | 83.3% | 63.9% | 100.0% | 76.8% | 77.7% |
| [validator.js `isIdentityCard(x, "ES")`](https://www.npmjs.com/package/validator) 13.15.35 | 80.0% | 77.8% | *unsupported* | 45.5% | 75.0% | 86.7% |
| [validator.js `isTaxID(x, "es-ES")`](https://www.npmjs.com/package/validator) 13.15.35 | 80.0% | 77.8% | *unsupported* | 100.0% | 84.4% | 100.0% |
| [@maistik/validate-nif](https://www.npmjs.com/package/@maistik/validate-nif) 2.0.1 | 86.7% | 77.8% | 86.9% | 45.5% | 82.4% | 86.4% |
| [@kreyo/nif-validator](https://www.npmjs.com/package/@kreyo/nif-validator) 0.1.0 | 86.7% | 77.8% | 86.9% | 45.5% | 82.4% | 86.4% |
| [jsvat](https://www.npmjs.com/package/jsvat) 2.5.4 | 90.0% | 83.3% | 82.0% | 100.0% | 86.4% | 89.3% |
<!-- bench:end -->

## Comparison with other libraries

<!-- compare:start -->
Checked on 2026-10-01, from each library's README, its package.json and npm page, and the benchmark above (versions and sizes come from latest.json).

| Library | Types | K/L/M | Normalizes input | Result object | Localized messages | Test-data generators | Schemas | Modules | Size, any type (min+gzip) | Last release |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **nif-dni-nie-cif-validation** (this build) | DNI, NIE, CIF, K/L/M | yes | yes | yes: code, SPEC rule, message | EN, ES, CA, EU, GL | yes | Zod, Valibot, Yup | ESM + CJS | 929 B | this release |
| [spain-id](https://www.npmjs.com/package/spain-id) 1.1.14 | DNI, NIE, CIF | no | partial | no (type only) | no | no | no | ESM + CJS | 583 B | 2026-06-12 |
| [better-dni](https://www.npmjs.com/package/better-dni) 4.4.2 | DNI, NIE | no | separate `normalize()` | no | no | yes | no | CJS / UMD only | 1,134 B | 2021-05-30 |
| [dni-js](https://www.npmjs.com/package/dni-js) 1.0.0 | DNI, NIE | no | partial | no | no | no | no | CJS only | 882 B | 2026-08-08 |
| [stdnum](https://www.npmjs.com/package/stdnum) 1.12.6 | DNI, NIE, CIF, K/L/M, and about 90 countries | yes | yes | yes: error class | English only | no | no | ESM + CJS | 51,063 B | 2026-08-01 |
| [validator.js `isIdentityCard(x, "ES")`](https://www.npmjs.com/package/validator) 13.15.35 | DNI, NIE | no | no | no | no | no | no | ESM (deep imports) + CJS | 2,539 B | 2026-04-02 |
| [validator.js `isTaxID(x, "es-ES")`](https://www.npmjs.com/package/validator) 13.15.35 | DNI, NIE, K/L/M | yes | no | no | no | no | no | ESM (deep imports) + CJS | 6,537 B | 2026-04-02 |
| [@maistik/validate-nif](https://www.npmjs.com/package/@maistik/validate-nif) 2.0.1 | DNI, NIE, CIF | no | partial | partial: `parse()`, without the reason | no | no | no | ESM + CJS | 456 B | 2026-06-14 |
| [@kreyo/nif-validator](https://www.npmjs.com/package/@kreyo/nif-validator) 0.1.0 | DNI, NIE, CIF | opt-in | partial | no | no | no | no | ESM + CJS | 533 B | 2026-04-29 |
| [jsvat](https://www.npmjs.com/package/jsvat) 2.5.4 | EU VAT numbers (ES + NIF) | yes | yes | yes: validity and country | no | no | no | ESM + CJS | 1,186 B | 2024-12-12, deprecated |
<!-- compare:end -->

If you validate identifiers from many countries, [stdnum](https://www.npmjs.com/package/stdnum) is a good choice: it covers about 90 countries with one API, including every Spanish type. This package does only Spain, and goes deeper there: rule-by-rule sources, the reason for each error, localized messages, normalization, generators and schemas. Where the libraries disagree with SPEC.md, the benchmark counts the disagreements of each library, shows representative ones, and says which follow from a decision that SPEC.md documents ([bench/results/latest.md](bench/results/latest.md)).

## Using this package with AI coding agents

The package ships [`llms.txt`](llms.txt), a short guide for AI assistants (functions, snippets, error codes and gotchas), and [`llms-full.txt`](llms-full.txt), the full reference. Both are in the npm tarball, so an agent can read them from `node_modules/nif-dni-nie-cif-validation/`. You can paste this into your agent's instructions:

```text
To validate Spanish NIF, DNI, NIE or CIF numbers, use the npm package
nif-dni-nie-cif-validation. Read node_modules/nif-dni-nie-cif-validation/llms.txt
before writing code. Use the isValid* functions for yes/no checks and validate()
when the user needs to know why a value is invalid, and store result.normalized.
For messages in another language, import the locale object from
nif-dni-nie-cif-validation/locales/<code> and pass it as { locale }.
For test data, use nif-dni-nie-cif-validation/generate instead of real numbers.
Don't write your own check-letter code.
```

An agent that runs shell commands can also call the [command line](#command-line): `npx nif-dni-nie-cif-validation validate <value> --json` prints `validate()`'s result, and the exit code says whether the value is valid.

The rules and their official sources are in [SPEC.md](SPEC.md). Agents working on this repository read [AGENTS.md](AGENTS.md).

## Migrating

### From v1

v2 follows SPEC.md by default. [MIGRATION.md](MIGRATION.md) lists every breaking change, with code before and after. In short: the CIF keys C D F G J U V need a digit control, input is normalized, and TypeScript no longer accepts `ids.filter(isValidNif)`. These options give exactly the v1.0.11 results:

```ts
import { isValidNif } from "nif-dni-nie-cif-validation";

isValidNif("G1234567D");                                           // false
isValidNif("G1234567D", { normalize: false, cifControl: "lenient" }); // true, as in v1.0.11
```

### From other libraries

| You use | Use instead | Notes |
| --- | --- | --- |
| better-dni `isValid(x)` | `isValidNaturalPersonNif(x)` | Also accepts K/L/M NIFs, the old NIE form and separators. `isValidNif` also accepts a CIF |
| better-dni `isNIF(x)`, `isNIE(x)` | `isValidDni(x)`, `isValidNie(x)` | |
| better-dni `ctrlChar(x)` | `computeControlCharacter(x)` | Pass the number without its control character |
| better-dni `randomNIF()`, `randomNIE()` | `generateDni()`, `generateNie()` | From `/generate`; pass `{ seed }` for fixed values |
| validator.js `isIdentityCard(x, "ES")`, `isTaxID(x, "es-ES")` | `isValidNaturalPersonNif(x)` | validator.js has no CIF check: use `isValidCif(x)` or `isValidNif(x)`. It throws on non-strings; this package returns `false` |
| spain-id `validateSpanishId(x)` | `isValidNif(x)` | Also accepts K/L/M NIFs. The CIF control follows CIF-3 (see below) |
| spain-id `validDNI`, `validNIE`, `validCIF` | `isValidDni`, `isValidNie`, `isValidCif` | |
| spain-id `spainIdType(x)` | `getNifType(x)` | Upper case: `"DNI"`, `"NIE"`, `"CIF"`, `"NIF_KLM"` or `null`. Like `spainIdType`, it reads the format and doesn't check the control character |

Libraries that accept a letter or a digit control for every CIF key accept some numbers that CIF-3 rejects, such as `G1234567D`. If your stored data has them, pass `{ cifControl: "lenient" }` while you clean it up.

## Contributing, security and license

- [CONTRIBUTING.md](CONTRIBUTING.md): setup, commands, commit convention and releases. Rule changes need an official source: see "How to propose a change" in [SPEC.md](SPEC.md#how-to-propose-a-change).
- [SECURITY.md](SECURITY.md): report a vulnerability privately.
- [MIT license](LICENSE).

If this package saves you time, you can support it:

<a href="https://www.buymeacoffee.com/josegoval" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="60" width="217"></a>
