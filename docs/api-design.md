# v2 API design

Status: proposed for 2.0.0, to be approved in PR review (#56).

This document describes the public API of `nif-dni-nie-cif-validation` 2.0.0 and the reasons behind each decision. Every behaviour follows [SPEC.md](../SPEC.md), and every error the API reports names the SPEC rule that failed. [MIGRATION.md](../MIGRATION.md) lists what changes for v1 users.

## Goals

- Tell the caller **why** a value failed (an error code, a SPEC rule ID and a message in the caller's language), **which** document it is, its **normalized** form to store, and the **expected** control character for "did you mean…?" hints (#56).
- Follow SPEC.md exactly. Only official rules (tiers T1 to T3) decide validity by default. Conventions (T4) are either input cleanup or opt-in.
- Never throw on untrusted input (#40).
- Keep the boolean validators as fast as in 1.x on canonical input, with no allocations (#47).
- Stay zero-dependency and tree-shakable: the booleans don't pull the messages or the organisation names, and `validate()` only pulls the languages the application imports.

## API at a glance

```ts
type NifType = "DNI" | "NIE" | "CIF" | "NIF_KLM";
type NifErrorCode =
  | "NOT_A_STRING" | "EMPTY" | "INVALID_LENGTH" | "INVALID_FORMAT"
  | "INVALID_CONTROL_CHARACTER" | "UNSUPPORTED_TYPE" | "PLACEHOLDER";
type CifControlMode = "official" | "lenient";

interface NifLocale {                        // a language, see D5
  code: string;                              // "en", "es", ...
  types: Record<NifType, string>;            // document type names used in messages
  messages: NifMessages;                     // per error code (and per rule for length/format)
  organisations: Record<CifOrganisationKey, string>;  // CIF-2, 17 keys
}
// English is built in; the other languages are separate entry points:
import { es } from "nif-dni-nie-cif-validation/locales/es";

interface ValidateOptions {
  types?: NifType[];             // accept only these types; others -> UNSUPPORTED_TYPE
  normalize?: boolean;           // default true: NORM-1..4 and NIE-3 canonicalization
  cifControl?: CifControlMode;   // default "official" (CIF-3)
  rejectPlaceholders?: boolean;  // default false (POLICY-1)
  allowVatPrefix?: boolean;      // default false (VAT-1)
  locale?: NifLocale;            // default: English (anything else -> English)
}

interface ValidationResult {
  valid: boolean;
  type: NifType | null;
  normalized: string | null;
  error?: { code: NifErrorCode; message: string; rule: string; expected?: string };
  meta?: { orgKey: string; orgDescription: string };   // CIF only
}

validate(value: unknown, opts?: ValidateOptions): ValidationResult
getNifType(value: unknown, opts?: Pick<ValidateOptions, "normalize" | "allowVatPrefix">): NifType | null
normalize(value: string): string
format(value: unknown, opts?: { separator?: "-" | " " | "" }): string | null
computeControlCharacter(partial: unknown): string | null
describeCifOrganisation(key: unknown, locale?: NifLocale): string | null   // default: English
isValidSpanishVat(value: unknown, opts?: IsValidOptions): boolean

// The v1 booleans, same names and aliases, new optional second argument:
type IsValidOptions = Pick<ValidateOptions, "normalize" | "cifControl" | "rejectPlaceholders">;
isValidNif(value: unknown, opts?: IsValidOptions): boolean
// isValidNaturalPersonNif, isValidDni, isValidNie, isValidLegalEntityNif (isValidCif),
// isValidDniLetter, isValidLegalEntityNifControlCode (isValidCifControlCode): same signature
```

Every v1 export stays: the regex constants, `DNI_CONTROL_LETTERS`, `LEGAL_ENTITY_CONTROL_LETTERS` and the CIF aliases. `replaceNieLetter` stays deprecated and keeps throwing exactly as in v1.

## Decisions

### D1. Defaults follow SPEC.md: `normalize: true`, `cifControl: "official"` (breaking)

- **CIF-3** (AEAT D.I.T. note, T3) says the control of keys A B C D E F G H J U V is a digit and the control of N P Q R S W is a letter. v1 accepted either for C D F G J U V, a convention with no official basis. The maintainer approved following AEAT exactly on 2026-09-30 (#38). `cifControl: "lenient"` brings back "letter or digit" for C D F G J U V, for legacy data. It doesn't change the other keys: A B E H stay digit-only and N P Q R S W letter-only in both modes, as in v1.
- **Normalization** (NORM-1 to NORM-4, NIE-3) is input cleanup: it never makes an invalid document valid, it only lets users type or paste the same document in common ways (`" b-1234567-4 "`, `12.345.678-z`). SPEC's tier rules allow cleanup conventions to be on by default. Making it the default for the booleans too means `isValidNif(x)` and `validate(x).valid` always agree.
- **v1-compatible mode:** `{ normalize: false, cifControl: "lenient" }`. The differential test proves that every boolean gives exactly the v1.0.11 result in that mode, on about 490,000 inputs.

### D2. What `normalize` does, and what `normalize: false` means

`normalize(value)` returns the canonical official form. Steps, in order:

1. Remove every white-space character (as JavaScript's `\s`: spaces, tabs, line breaks, no-break spaces, the BOM, …) and every `.` (NORM-2), `-` and `/` (NORM-3), anywhere in the string. This also trims.
2. Upper-case ASCII letters and `ñ` (NORM-1). Other non-ASCII characters are left alone on purpose, so look-alikes such as `ı` (dotless i) or `ſ` (long s), which `toUpperCase()` maps to `I` and `S`, never turn into valid documents.
3. NIE-3: the old 10-character NIE `X0nnnnnnnL` becomes `XnnnnnnnL`.
4. NORM-4: 1 to 7 digits followed by a letter (a DNI typed without its leading zeros) are left-padded with zeros to 8 digits: `1234567L` becomes `01234567L`.

It returns the input string itself (no copy) when nothing changes. It never throws. Its parameter is typed `string`; any other value returns `""`.

`normalize` does not strip an `ES` VAT prefix: that is `validate`'s `allowVatPrefix` and `isValidSpanishVat`, because `ES…` is a different identifier (VAT-1), not a way of writing a NIF.

`normalize: false` turns off NORM-2, NORM-3 and NORM-4: no trimming, no separators, no padding. Case-insensitivity (NORM-1) and the old NIE form (NIE-3) are still accepted, because the v1 validators already accepted both and the v1-compatible mode must stay identical to v1. `validate(…, { normalize: false })` still returns `normalized` in canonical form (upper case, old NIE collapsed).

### D3. Boolean validators: signature, fast path, never throw

- Signature: `(value: unknown, opts?: IsValidOptions) => boolean` (#40). The options default to `{}`, so `.length` stays 1 as in v1.
- **Fast path:** the raw input is checked first, in one allocation-free pass. A valid canonical input returns `true` right there. When that fails, the validator returns `false` without scanning or copying whenever normalizing provably can't change the verdict: cleanup only removes separators (all below `0` or non-ASCII) and only NORM-4 lengthens a value (a DNI, from a digit), so a failed value of 9 characters or fewer can't be fixed for NIE and CIF, nor a 9-character value starting with a letter, nor a DNI whose 8 digits are all there. Otherwise the separators are removed and the value is checked again, where 1 to 7 digits and their DNI-2 letter count as the padded DNI (NORM-4). This is equivalent to "normalize, then check", because the raw check is already case-insensitive and accepts the old NIE form, and leading zeros don't change a DNI's number; so the booleans never call `normalize()`, which keeps their bundles small (CONTRIBUTING.md, "Size budgets"). With `rejectPlaceholders`, POLICY-1 reads the number of the document that passed. The benchmark checks the budget: on canonical input, at most 10% slower than PR #76.
- They never throw, whatever the arguments: a non-string returns `false`, and `opts` may be missing, `null` or even a number (as when a validator is passed straight to `array.filter`).
- `isValidNaturalPersonNif`, `isValidDni` (DNI and K/L/M), `isValidNie` and `isValidCif` keep their v1 scope.
- `isValidDniLetter` and `isValidCifControlCode` keep their v1 "control only, no format check" semantics. With `normalize` on they check `normalize(value)`. With `cifControl: "official"`, `isValidCifControlCode` uses CIF-3 for the key, and returns `false` when the first character is not an organisation key (there is no official control type without a key); v1 accepted a letter or a digit there, which `"lenient"` keeps.
- `rejectPlaceholders` (POLICY-1) applies to every boolean. Placeholders are DNIs and NIEs, so it never affects `isValidCif`.

### D4. `validate()`: result, error codes and the rule of each error

`validate` normalizes (unless `normalize: false`), then checks the steps below in order and stops at the first failure. `type` and `normalized` are set as soon as the format is recognisable (right first character, right length, digits in the body, a control character of the right class), even if the control character is wrong, so the UI can say "this DNI's letter should be Z". `meta` is set whenever `type` is `"CIF"`.

| Step | Code | `error.rule` | `type` / `normalized` |
|---|---|---|---|
| Not a string | `NOT_A_STRING` | INPUT-1 | null |
| Empty (or only separators) | `EMPTY` | INPUT-2 | null |
| Starts with `ES` and `allowVatPrefix` is off | `INVALID_FORMAT` | VAT-1 | null |
| `ES` with nothing after it | `INVALID_LENGTH` | VAT-1 | null |
| First character is not a digit, K L M, X Y Z or an organisation key (for example `T`) | `INVALID_FORMAT` | NIF-1 | null |
| Not 9 characters | `INVALID_LENGTH` | DNI-1, KLM-1, NIE-1 (NIE-3 for 10 characters), CIF-1 | null |
| Non-digits in the body | `INVALID_FORMAT` | DNI-1, KLM-3, NIE-1, CIF-1 | null |
| Control position: not a letter (DNI, K/L/M, NIE), not a letter or digit (CIF) | `INVALID_FORMAT` | DNI-1, KLM-1, NIE-1, CIF-1 | null |
| `types` given and the type is not in it | `UNSUPPORTED_TYPE` | POLICY-2 | set |
| Wrong check letter | `INVALID_CONTROL_CHARACTER` + `expected` | DNI-3 for I, Ñ, O, U; else DNI-2, KLM-2, NIE-2 | set |
| CIF control of the wrong class for the key (letter for a digit key or vice versa) | `INVALID_CONTROL_CHARACTER` + `expected` | CIF-3 | set |
| CIF control of the right class but wrong value | `INVALID_CONTROL_CHARACTER` + `expected` | CIF-4 | set |
| Placeholder and `rejectPlaceholders` | `PLACEHOLDER` | POLICY-1 | set |

- `UNSUPPORTED_TYPE` wins over a wrong control character: if a form only accepts DNIs, "we don't accept CIFs here" is the useful message.
- `expected` is the correct control character. For a lenient-mode key (C D F G J U V) it is in the class the user typed (letter or digit).
- `normalized` never keeps the `ES` prefix: it is always the NIF, so `validate(result.normalized)` with default options gives the same verdict (a property test checks this).
- `error.rule` is always a rule ID defined in SPEC.md (tested).

**New SPEC rule IDs.** Some outcomes had no rule ID to cite, so SPEC.md gains five IDs, none of which changes which documents are valid:

- **NIF-1**: the first character selects exactly one format (a digit, K L M, X Y Z or an organisation key); anything else, such as `T`, is not a NIF. It follows from DNI-1, KLM-1, NIE-1 and CIF-2.
- **INPUT-1** and **INPUT-2**: only strings are validated, never converted, and an empty input is reported as empty. Library contract (#40), no source.
- **POLICY-1**: the placeholder list, valid by default, rejected with `rejectPlaceholders`. Convention (ESNIC), already listed in SPEC's "Explicitly NOT implemented" table.
- **POLICY-2**: the caller's `types` restriction.

### D5. Messages, organisation names and languages

- Messages exist for every error code and include the expected character when there is one: `The control character is not correct: for this DNI it should be "Z".` / `El carácter de control no es correcto: para este DNI debería ser «Z».` `INVALID_LENGTH` and `INVALID_FORMAT` messages depend on the rule, so they describe the right document.
- `describeCifOrganisation(key, locale)` takes one organisation key, in either case, and returns its description from Orden EHA/451/2008 arts. 3 to 5 (art. 3 as amended by Orden HAP/5/2016), in the singular: `"B"` → `"Limited liability company"`, or `"Sociedad de responsabilidad limitada"` with `es`. Anything else returns `null`.
- **Languages are objects, imported one by one** (the pattern of date-fns, Zod 4 and Valibot). A locale (`NifLocale`) carries every user-facing text: the messages, the document type names they use, and the 17 organisation descriptions. English (`src/locales/en.ts`) is built in and is the default. Every other language is its own module and its own `exports` entry point, `nif-dni-nie-cif-validation/locales/<code>`, with a named export (`es`) and a default export. `validate(x, { locale: es })` and `describeCifOrganisation(key, es)` use it. The package never selects a language from a runtime string, so a bundler drops every language the application doesn't import: `validate` alone bundles English only, and each language adds only itself (`pnpm size`, `scripts/check-tree-shaking.mjs`).
- The texts live in `src/locales/` and are read through `src/localize.ts`; only `validate()` and `describeCifOrganisation()` import them. An app that only uses the booleans bundles no text at all: the package ships ES modules with `sideEffects: false`, and CI checks it.
- **Anything that is not a locale object gives English, and nothing throws.** That includes a language code string such as `"es"`, which pre-release versions of these docs showed (MIGRATION.md, "Languages"). TypeScript rejects it; plain JavaScript gets English rather than an exception, because `validate()` must stay total (#40). A locale object that lacks a text, or whose message function throws or returns anything but a non-empty string, gives English for that text.
- [translations.md](translations.md) gives the source of every organisation name per language (official translation or our own) and the terminology choices.

### D6. `getNifType`: format-based detection

`getNifType(value, opts)` returns the type `validate` would report, without checking the control character or the `types` restriction: `getNifType("12345678A")` is `"DNI"` although the letter is wrong, and `getNifType("B1234567D")` is `"CIF"`. It returns `null` when the format isn't recognisable (`"T1234567A"`, `"123456789"`, the wrong length). A non-null result therefore does **not** mean the document is valid; use `validate` or a boolean for that. It accepts `normalize` and `allowVatPrefix` because both change what is parsed.

### D7. `format`: grouping

`format(value, { separator })` validates with the default options and returns `null` if the value is invalid. Otherwise it returns the canonical form split into its parts, joined by the separator (default `"-"`):

| Type | Parts | Example |
|---|---|---|
| DNI | 8 digits, check letter | `12345678-Z` |
| NIE | prefix, 7 digits, check letter | `X-1234567-L` |
| K/L/M | prefix, 7 digits, check letter | `K-1234567-L` |
| CIF | organisation key, 7 digits, control | `B-1234567-4` |

The parts follow the definitions in SPEC (DNI-1, KLM-1, NIE-1, CIF-1). No official grouping exists; this one matches how AEAT and Interior describe the parts, and is what most forms display. `separator: ""` returns the canonical form. Any other separator value falls back to `"-"`. `format` never adds an `ES` prefix.

### D8. `computeControlCharacter`

`computeControlCharacter(partial)` returns the control character that completes a document without its last character, or `null`:

- 1 to 8 digits: DNI letter (DNI-2), after padding to 8 digits (NORM-4). `"12345678"` → `"Z"`.
- K, L or M + 7 digits: KLM-2. `"K1234567"` → `"L"`.
- X, Y or Z + 7 digits, or the old `X0` + 7 digits: NIE-2. `"X1234567"` → `"L"`.
- Organisation key + 7 digits: the official control (CIF-3 kind, CIF-4 value). `"B1234567"` → `"4"`, `"P2807900"` → `"B"`. C D F G J U V get the digit, as CIF-3 says.

The input goes through NORM-1 to NORM-3 cleanup first. By construction, `partial + computeControlCharacter(partial)` always validates (a property test checks it).

### D9. VAT numbers

`isValidSpanishVat(value, opts)` returns `true` for `ES` followed by a valid NIF (VAT-1), and `false` without the prefix. It takes the same options as the booleans. It checks the format only: **a valid format doesn't mean the number is registered in VIES**. `validate(value, { allowVatPrefix: true })` accepts a NIF with or without the prefix.

### D10. Out of scope

No official basis, see SPEC.md "Explicitly NOT implemented": the `T` prefix (reported as NIF-1), the CIF "00 needs a letter" rule, and province codes (CIF-5; a test proves no province check happens).

## Alternatives considered

- **Languages selected by a string (`locale: "es"`)** from a table of all languages, as in the first v2 drafts. Rejected (#56): a bundler can't know which entries of the table are used, so every `validate()` user paid for every language (about 0.6 kB min+gz for Spanish alone), and each new language would have grown every bundle.
- **One package per language** (`nif-dni-nie-cif-validation-es`). Rejected: more packages to publish and version together, for no gain over entry points of the same package.
- **Throwing on a string `locale`.** Rejected: `validate()` never throws (#40), and plain JavaScript that follows the pre-release docs should degrade to English, not break a form.

- **Throwing on non-strings in `normalize`.** Rejected: #40 asks for a total API on untrusted input, and `""` makes `validate` report `EMPTY`/`NOT_A_STRING` consistently.
- **Keeping `normalize: false` as the boolean default.** Rejected: `isValidNif(x)` and `validate(x).valid` would disagree on the same input, which is a trap for users of both.
- **`normalized` keeping the `ES` prefix.** Rejected: `type` is a NIF type, and a normalized value that fails `validate` with default options is surprising. Callers who store VAT numbers prepend `ES`.
- **A `types` restriction on the booleans.** Not needed: each boolean already has a fixed scope.
- **Validation options on `format`.** Left out to keep the agreed signature; a lenient-mode CIF with a letter control for C D F G J U V is therefore not formatted. It can be added later without a breaking change.
