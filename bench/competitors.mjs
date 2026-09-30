// The libraries of the competitor benchmark (#49), and the exact function
// each one is called with, per document type.
//
// This file is the single place that says what is measured. The throughput,
// accuracy and size runs all read it, and bench/README.md and the results
// quote it, so nothing is described twice.
//
// Rules (bench/README.md, "Fairness"):
// - Every library is called the way its own documentation shows, with its
//   default options, on the raw string. Nothing is wrapped, cached or
//   pre-processed, with one exception that is listed in `transformInput`.
// - A `calls` entry is the source of the call. The throughput loop is
//   compiled from that very text (see `compileCall`), so what the results
//   list is what ran.
// - A type the library does not cover is `null`: it is reported as
//   "unsupported", never as fast or slow.

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
/** Absolute path of the repository root (with a trailing slash). */
export const ROOT = fileURLToPath(new URL("../", import.meta.url));

/** The document types that have their own throughput set. */
export const TYPES = ["DNI", "NIE", "CIF"];

/**
 * How a contender is imported, to measure its bundle size with the same
 * method as size-limit (bench/sizes.mjs). `from` is a module specifier or,
 * for this package, a path relative to the repository root.
 */
const named = (from, name) => ({ from, named: name });
const whole = (from) => ({ from, namespace: true });

/**
 * One contender per entry.
 *
 * - `kind`: "subject" (this build), "previous" (our own v1.0.11) or
 *   "competitor".
 * - `package`: the npm name and the folder in node_modules (they differ for
 *   the `nif-v1` alias); `null` for this build.
 * - `setup`: the statement(s) that bind what `calls` uses, written as the
 *   library's documentation imports it.
 * - `calls`: the call that answers "is this string a valid <type>?", where
 *   `x` is the input and the expression is truthy when it is valid. `any` is
 *   the call for "a valid Spanish NIF of any type", used for the mixed set
 *   and for the accuracy check.
 * - `supports`: which of DNI, NIE and CIF `calls.any` covers, according to
 *   the library's documentation.
 * - `transformInput`: only for jsvat, which validates VAT numbers.
 * - `bundles`: the equivalent import, per call, and the whole library.
 */
export const CONTENDERS = [
  {
    id: "current",
    label: "nif-dni-nie-cif-validation (this build)",
    short: "this build",
    kind: "subject",
    package: null,
    homepage: "https://github.com/josegoval/nif-dni-nie-cif-validation",
    load: () => require("../dist/cjs/index.cjs"),
    setup: "const { isValidDni, isValidNie, isValidCif, isValidNif } = lib;",
    calls: {
      DNI: "isValidDni(x)",
      NIE: "isValidNie(x)",
      CIF: "isValidCif(x)",
      any: "isValidNif(x)",
    },
    supports: { DNI: true, NIE: true, CIF: true },
    bundles: {
      DNI: named("dist/esm/index.mjs", "isValidDni"),
      NIE: named("dist/esm/index.mjs", "isValidNie"),
      CIF: named("dist/esm/index.mjs", "isValidCif"),
      any: named("dist/esm/index.mjs", "isValidNif"),
      full: whole("dist/esm/index.mjs"),
    },
    notes: [
      "Default options: the input is normalized (NORM-1 to NORM-4) and CIF control characters follow CIF-3.",
    ],
  },
  {
    id: "v1",
    label: "nif-dni-nie-cif-validation (previous major)",
    short: "v1.0.11",
    kind: "previous",
    package: { name: "nif-dni-nie-cif-validation", dir: "nif-v1" },
    homepage: "https://github.com/josegoval/nif-dni-nie-cif-validation",
    load: () => require("nif-v1"),
    setup: "const { isValidDni, isValidNie, isValidCif, isValidNif } = lib;",
    calls: {
      DNI: "isValidDni(x)",
      NIE: "isValidNie(x)",
      CIF: "isValidCif(x)",
      any: "isValidNif(x)",
    },
    supports: { DNI: true, NIE: true, CIF: true },
    bundles: {
      DNI: named("nif-v1", "isValidDni"),
      NIE: named("nif-v1", "isValidNie"),
      CIF: named("nif-v1", "isValidCif"),
      any: named("nif-v1", "isValidNif"),
      full: whole("nif-v1"),
    },
    notes: [
      "The previous major version. It is published as CommonJS only, so a bundler cannot drop what an import doesn't use.",
    ],
  },
  {
    id: "spain-id",
    label: "spain-id",
    short: "spain-id",
    kind: "competitor",
    package: { name: "spain-id", dir: "spain-id" },
    homepage: "https://github.com/coixinet/spain-id",
    load: () => require("spain-id"),
    setup: "const { validDNI, validNIE, validCIF, validateSpanishId } = lib;",
    calls: {
      DNI: "validDNI(x)",
      NIE: "validNIE(x)",
      CIF: "validCIF(x)",
      any: "validateSpanishId(x)",
    },
    supports: { DNI: true, NIE: true, CIF: true },
    bundles: {
      DNI: named("spain-id", "validDNI"),
      NIE: named("spain-id", "validNIE"),
      CIF: named("spain-id", "validCIF"),
      any: named("spain-id", "validateSpanishId"),
      full: whole("spain-id"),
    },
    notes: [],
  },
  {
    id: "better-dni",
    label: "better-dni",
    short: "better-dni",
    kind: "competitor",
    package: { name: "better-dni", dir: "better-dni" },
    homepage: "https://github.com/singuerinc/better-dni",
    load: () => require("better-dni"),
    setup: "const { isNIF, isNIE, isValid } = lib;",
    calls: {
      // `isNIF` is better-dni's name for a DNI ("NIF" of a Spaniard).
      DNI: "isNIF(x)",
      NIE: "isNIE(x)",
      CIF: null,
      any: "isValid(x)",
    },
    supports: { DNI: true, NIE: true, CIF: false },
    bundles: {
      DNI: named("better-dni", "isNIF"),
      NIE: named("better-dni", "isNIE"),
      CIF: null,
      any: named("better-dni", "isValid"),
      full: whole("better-dni"),
    },
    notes: [
      "DNI and NIE only: no CIF. Its documentation says that it validates a DNI (NIE / NIF), and it doesn't normalize (spaces and separators are rejected).",
    ],
  },
  {
    id: "dni-js",
    label: "dni-js",
    short: "dni-js",
    kind: "competitor",
    package: { name: "dni-js", dir: "dni-js" },
    homepage: "https://github.com/albertfdp/dni-js",
    load: () => require("dni-js"),
    setup: "const dni = lib;",
    calls: {
      DNI: "dni.isDNI(x)",
      NIE: "dni.isNIE(x)",
      CIF: null,
      any: "dni.isValid(x)",
    },
    supports: { DNI: true, NIE: true, CIF: false },
    bundles: {
      DNI: named("dni-js", "isDNI"),
      NIE: named("dni-js", "isNIE"),
      CIF: null,
      any: named("dni-js", "isValid"),
      full: whole("dni-js"),
    },
    notes: ["DNI and NIE only: no CIF. It is published as CommonJS only."],
  },
  {
    id: "stdnum",
    label: "stdnum",
    short: "stdnum",
    kind: "competitor",
    package: { name: "stdnum", dir: "stdnum" },
    homepage: "https://github.com/koblas/stdnum-js",
    load: () => require("stdnum"),
    setup: "const { stdnum } = lib;",
    calls: {
      DNI: "stdnum.ES.dni.validate(x).isValid",
      NIE: "stdnum.ES.nie.validate(x).isValid",
      CIF: "stdnum.ES.cif.validate(x).isValid",
      any: "stdnum.ES.nif.validate(x).isValid",
    },
    supports: { DNI: true, NIE: true, CIF: true },
    bundles: {
      DNI: {
        code: 'import { stdnum } from "stdnum"; console.log(stdnum.ES.dni.validate);',
      },
      NIE: {
        code: 'import { stdnum } from "stdnum"; console.log(stdnum.ES.nie.validate);',
      },
      CIF: {
        code: 'import { stdnum } from "stdnum"; console.log(stdnum.ES.cif.validate);',
      },
      any: {
        code: 'import { stdnum } from "stdnum"; console.log(stdnum.ES.nif.validate);',
      },
      full: named("stdnum", "stdnum"),
    },
    // Not the documented import: a deep import of the Spanish module, which
    // shows what a bundler can drop when the country registry isn't used.
    sizeAlternatives: [
      {
        label: "deep import of the Spanish NIF module (not documented)",
        bundle: {
          code: 'import { validate } from "stdnum/lib/esm/es/nif.js"; console.log(validate);',
        },
      },
    ],
    notes: [
      "A multi-country library (about 90 countries): its size is larger by design. `ES.nif` validates DNI, NIE, K/L/M and CIF.",
    ],
  },
  {
    id: "validator-identity-card",
    label: 'validator.js isIdentityCard(x, "ES")',
    short: "validator isIdentityCard",
    kind: "competitor",
    package: { name: "validator", dir: "validator" },
    homepage: "https://github.com/validatorjs/validator.js",
    load: () => require("validator"),
    setup: "const validator = lib;",
    calls: {
      DNI: 'validator.isIdentityCard(x, "ES")',
      NIE: 'validator.isIdentityCard(x, "ES")',
      CIF: null,
      any: 'validator.isIdentityCard(x, "ES")',
    },
    supports: { DNI: true, NIE: true, CIF: false },
    bundles: {
      DNI: {
        from: "validator/es/lib/isIdentityCard",
        default: "isIdentityCard",
      },
      NIE: {
        from: "validator/es/lib/isIdentityCard",
        default: "isIdentityCard",
      },
      CIF: null,
      any: {
        from: "validator/es/lib/isIdentityCard",
        default: "isIdentityCard",
      },
      full: { from: "validator", default: "validator" },
    },
    notes: [
      "Spanish DNI and NIE only: validator.js has no CIF check. The one call covers both, so the DNI and NIE rows use the same function. A multi-purpose library (emails, URLs, and more).",
    ],
  },
  {
    id: "validator-tax-id",
    label: 'validator.js isTaxID(x, "es-ES")',
    short: "validator isTaxID",
    kind: "competitor",
    package: { name: "validator", dir: "validator" },
    homepage: "https://github.com/validatorjs/validator.js",
    load: () => require("validator"),
    setup: "const validator = lib;",
    calls: {
      DNI: 'validator.isTaxID(x, "es-ES")',
      NIE: 'validator.isTaxID(x, "es-ES")',
      CIF: null,
      any: 'validator.isTaxID(x, "es-ES")',
    },
    supports: { DNI: true, NIE: true, CIF: false },
    bundles: {
      DNI: { from: "validator/es/lib/isTaxID", default: "isTaxID" },
      NIE: { from: "validator/es/lib/isTaxID", default: "isTaxID" },
      CIF: null,
      any: { from: "validator/es/lib/isTaxID", default: "isTaxID" },
      full: { from: "validator", default: "validator" },
    },
    notes: [
      "Its documentation says persons only: DNI and NIE, no CIF. The one call covers both. Its size includes the tax ID rules of every country it supports.",
    ],
  },
  {
    id: "maistik",
    label: "@maistik/validate-nif",
    short: "@maistik/validate-nif",
    kind: "competitor",
    package: { name: "@maistik/validate-nif", dir: "@maistik/validate-nif" },
    homepage: "https://github.com/Maistik-Studio/validate-nif",
    load: () => require("@maistik/validate-nif"),
    setup: "const { isValidDNI, isValidNIE, isValidCIF, isValid } = lib;",
    calls: {
      DNI: "isValidDNI(x)",
      NIE: "isValidNIE(x)",
      CIF: "isValidCIF(x)",
      any: "isValid(x)",
    },
    supports: { DNI: true, NIE: true, CIF: true },
    bundles: {
      DNI: named("@maistik/validate-nif", "isValidDNI"),
      NIE: named("@maistik/validate-nif", "isValidNIE"),
      CIF: named("@maistik/validate-nif", "isValidCIF"),
      any: named("@maistik/validate-nif", "isValid"),
      full: whole("@maistik/validate-nif"),
    },
    notes: [],
  },
  {
    id: "kreyo",
    label: "@kreyo/nif-validator",
    short: "@kreyo/nif-validator",
    kind: "competitor",
    package: { name: "@kreyo/nif-validator", dir: "@kreyo/nif-validator" },
    homepage: "https://github.com/kreyo-io/nif-validator",
    load: () => require("@kreyo/nif-validator"),
    setup: "const { isValid } = lib;",
    calls: {
      // One function for every type: the library has no per-type validator.
      DNI: "isValid(x)",
      NIE: "isValid(x)",
      CIF: "isValid(x)",
      any: "isValid(x)",
    },
    supports: { DNI: true, NIE: true, CIF: true },
    bundles: {
      DNI: named("@kreyo/nif-validator", "isValid"),
      NIE: named("@kreyo/nif-validator", "isValid"),
      CIF: named("@kreyo/nif-validator", "isValid"),
      any: named("@kreyo/nif-validator", "isValid"),
      full: whole("@kreyo/nif-validator"),
    },
    notes: [
      "One function for every type, so every row uses `isValid`. K/L/M NIFs are only accepted with the option `includeDeprecated: true`; the benchmark uses the default, as its documentation does.",
    ],
  },
  {
    id: "jsvat",
    label: "jsvat (Spain)",
    short: "jsvat",
    kind: "competitor",
    package: { name: "jsvat", dir: "jsvat" },
    homepage: "https://github.com/se-panfilov/jsvat",
    load: () => require("jsvat"),
    // The list of countries is built once, outside the call, as a program
    // would keep it.
    setup: "const { checkVAT, spain } = lib; const countries = [spain];",
    calls: {
      DNI: "checkVAT(x, countries).isValid",
      NIE: "checkVAT(x, countries).isValid",
      CIF: "checkVAT(x, countries).isValid",
      any: "checkVAT(x, countries).isValid",
    },
    supports: { DNI: true, NIE: true, CIF: true },
    // jsvat validates a VAT number, which for Spain is "ES" + NIF. The prefix
    // is added before timing (bench/inputs), so it isn't part of the loop.
    transformInput: (value) => `ES${value}`,
    bundles: {
      DNI: {
        code: 'import { checkVAT, spain } from "jsvat"; console.log(checkVAT, spain);',
      },
      NIE: {
        code: 'import { checkVAT, spain } from "jsvat"; console.log(checkVAT, spain);',
      },
      CIF: {
        code: 'import { checkVAT, spain } from "jsvat"; console.log(checkVAT, spain);',
      },
      any: {
        code: 'import { checkVAT, spain } from "jsvat"; console.log(checkVAT, spain);',
      },
      full: whole("jsvat"),
    },
    notes: [
      'A VAT number validator (deprecated on npm, repository archived): every input is prefixed with "ES" before it is validated, and the prefix is added outside the timed loop and outside the agreement check of the library. It does not accept a bare NIF.',
    ],
  },
];

/** The contender that the speed-ups are measured for. */
export const SUBJECT_ID = "current";

/**
 * Compiles a call of a contender into a function `(input) => truthy`.
 * It is the same text the throughput loop is built from, so the accuracy
 * check and the timing run the same call.
 */
export function compileCall(contender, call) {
  const fn = new Function("lib", `${contender.setup}\nreturn (x) => ${call};`)(
    contender.load()
  );
  return contender.transformInput
    ? (input) => fn(contender.transformInput(input))
    : fn;
}

/** The version of the package of a contender, read from node_modules. */
export function versionOf(contender) {
  if (contender.package === null) return require("../package.json").version;
  return require(`${ROOT}node_modules/${contender.package.dir}/package.json`)
    .version;
}

/** The call for a document type, or null when the library has none. */
export function callFor(contender, type) {
  return contender.calls[type] ?? null;
}

/**
 * Whether the mixed set is fair for a contender: its function covers DNI, NIE
 * and CIF. Otherwise it would be timed on inputs it cannot validate.
 */
export function supportsMixed(contender) {
  return TYPES.every((type) => contender.supports[type]);
}
