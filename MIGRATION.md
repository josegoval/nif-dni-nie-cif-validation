# Migrating from v1 to v2

Version 2.0.0 makes the validators follow [SPEC.md](SPEC.md), the official Spanish sources, by default. This page lists every breaking change, with code before and after, and how to get the v1 behaviour back.

## Quick path: keep the v1 behaviour

Every boolean validator takes an options object as its second argument. These options give exactly the v1.0.11 results (a differential test checks it on about 490,000 inputs):

```ts
import { isValidNif } from "nif-dni-nie-cif-validation";

const V1_COMPATIBLE = { cifControl: "lenient" } as const;

isValidNif(value, V1_COMPATIBLE);
```

Use it as a stopgap for stored data, then move to the defaults.

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
