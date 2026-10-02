// English: the texts of the site's components. See types.ts.
import type { SiteStrings } from "./types";

export const en: SiteStrings = {
  hero: {
    logoAlt:
      "nif-dni-nie-cif-validation: Spanish NIF, DNI, NIE and CIF validation",
    installLabel: "Install with npm",
    copy: "Copy",
    copied: "Copied",
  },
  validator: {
    heading: "Try it",
    intro:
      "Type or paste a NIF, DNI, NIE or CIF. The library itself checks it as you type, and tells you why it is wrong.",
    label: "NIF, DNI, NIE or CIF",
    hint: "Spaces, dots, hyphens and lower case are fine, as in 12.345.678-z.",
    generateLabel: "Generate a random number",
    generate: { DNI: "Random DNI", NIE: "Random NIE", CIF: "Random CIF" },
    generatedNote:
      "Generated numbers are made up and only for tests: one may match a real person or company by chance.",
    privacy: "Runs entirely in your browser: no data leaves your browser.",
    noscript:
      "The live validator needs JavaScript. The rest of this page works without it.",
    ui: {
      empty: "The result appears here as you type.",
      valid: "Valid",
      invalid: "Not valid",
      type: "Type",
      normalized: "Normalized value",
      control: "Control character",
      controlOk: "correct",
      expected: "expected",
      rule: "SPEC rule",
      rulePassed: "passed",
      ruleFailed: "failed",
      organisation: "Organisation",
      none: "none",
    },
  },
  why: {
    heading: "Why this library",
    correct: {
      title: "Correct, with sources",
      body: (rules) =>
        `${rules} rules, each with an ID (DNI-2, NIE-3, CIF-3…) and its documented basis in SPEC.md: an official source (the BOE, the AEAT), a convention labelled as such, or the library's contract. Every error names the rule that failed.`,
    },
    fast: {
      title: "Fast",
      headline: (speedup) =>
        `At least ${speedup}× the throughput of every other library tested`,
      body: (mops, v1Low, v1High) =>
        `${mops} M ops/s on DNI (millions of validations per second, higher is faster), and ${v1Low}× to ${v1High}× the throughput of v1.`,
    },
    small: {
      title: "Small",
      body: (anyBytes, fullKb) =>
        `${anyBytes} B min+gzip for isValidNif, ${fullKb} kB for the whole library. Tree-shakable, and each language is its own import.`,
      note: (libraries) =>
        `Some single-purpose libraries are smaller for one validator (${libraries}). Some of them validate fewer types: this one spends bytes on input normalization, the CIF-3 control types and K/L/M support.`,
    },
    deps: {
      title: "0 dependencies",
      body: "No runtime dependencies. Zod, Valibot and Yup are optional peer dependencies, needed only by their adapters.",
    },
    typed: {
      title: "Typed",
      body: "Written in TypeScript, with declarations for import and require. ES modules and CommonJS, compiled to ES2016.",
    },
    safe: {
      title: "Never throws",
      body: "Validators take unknown: null, numbers and objects give false, or NOT_A_STRING from validate(). Never a crash on user input.",
    },
    languages: {
      title: "5 languages",
      body: "Error messages and organisation names in English, Spanish, Catalan, Basque and Galician. The validator above speaks the language of this page.",
    },
    tools: {
      title: "Generators and schemas",
      body: "Seeded test-data generators, and Zod, Valibot and Yup schemas that output the normalized value and the localized message.",
    },
    measured: (machine, node, date) =>
      `Measured on ${machine} with Node.js ${node} on ${date}, each library with its default options. Ratios carry over between machines better than absolute numbers.`,
  },
  code: {
    heading: "Use it",
    intro:
      "Boolean checks for a yes or no, validate() when you need to know why, and opt-in entry points for schemas and test data.",
    tabsLabel: "Code examples",
    tabs: {
      basic: "Basic",
      validate: "validate()",
      zod: "Zod",
      valibot: "Valibot",
      yup: "Yup",
      generators: "Generators",
    },
    comments: {
      normalized:
        "spaces, dots and hyphens are removed, and lower case becomes upper case",
      wrongControl: "wrong control digit",
      neverThrows: "never throws",
      storeThis: "store this",
      cifRejected: "a CIF is not accepted here",
      sameEverywhere: "the same on every run and platform",
      stream: "a seeded stream: different values, the same on every run",
    },
  },
  compare: {
    heading: "How it compares",
    intro:
      "Throughput on the DNI set, in millions of validations per second (M ops/s, higher is faster), and the size of one validator of any type (min+gzip, lower is smaller).",
    caption: "Throughput and size of the Spanish ID libraries on npm",
    library: "Library",
    dni: "DNI, M ops/s",
    size: "Size, any type",
    thisBuild: "this build",
    unsupported: "unsupported",
    more: "Full benchmarks and comparison",
    caveat:
      "Every number comes from bench/results/latest.json. Speed is not everything: the benchmarks page links to the full results, which also compare agreement with SPEC.md and features.",
  },
  footer: {
    label: "Project links",
    github: "GitHub",
    npm: "npm",
    license: "MIT license",
    spec: "Official sources",
    coverage: "Test coverage",
    llms: "llms.txt",
    sponsor: "Support the project",
    madeBy: "Made by josegoval.",
  },
  docs: {
    library: "Library",
    thisBuild: "this build",
    unsupported: "unsupported",
    bytes: (formatted) => `${formatted} B`,
    cifKeys: {
      caption:
        "The organisation keys of a CIF, the kind of organisation each one stands for, and the kind of control character it takes",
      key: "Key",
      organisation: "Organisation",
      control: "Control character",
      digit: "a digit",
      letter: "a letter",
    },
    errors: {
      caption:
        "Every error code of validate(), each SPEC rule it can cite, an input that gives it, and its message in English",
      code: "Code",
      rule: "Rule",
      example: "Example",
      message: "Message",
    },
    entryPoints: {
      caption: "The entry points of the package, and what each one exports",
      entryPoint: "Entry point",
      contents: "What it exports",
      main: "The validators, validate(), normalize(), format(), getNifType(), computeControlCharacter(), describeCifOrganisation(), the v1 constants and the types. English messages are built in.",
      locale: (language) =>
        `The ${language} locale object, to pass as locale to validate(), describeCifOrganisation() and the schemas.`,
      generate:
        "Seeded generators of valid and invalid numbers, for tests. Never imported by the main entry point.",
      schemas: (library) =>
        `${library} schemas for every type and for VAT numbers. ${library.split(" ")[0]} is an optional peer dependency.`,
      languages: {
        en: "English",
        es: "Spanish",
        ca: "Catalan (also for Valencian)",
        eu: "Basque",
        gl: "Galician",
      },
    },
    apiFallback: {
      title: (module) => `${module}: API reference`,
      description: (module) =>
        `API reference of ${module}: signatures, options and tested examples.`,
    },
    bench: {
      run: {
        caption: "Where and how the benchmark ran",
        machine: "Machine",
        cores: "Cores",
        memory: "Memory",
        os: "Operating system",
        node: "Node.js",
        date: "Date",
        commit: "Commit measured",
        method: "Method",
        methodValue: (rounds, time, warmup) =>
          `${rounds} rounds; each task ${time} ms after ${warmup} ms of warmup, in its own process; the figure is the median round`,
      },
      throughput: {
        caption: (set, inputs) =>
          `${set}: millions of validations per second (M ops/s, higher is faster) on ${inputs} valid and invalid documents in canonical form, and how many times as fast this build is`,
        ops: "M ops/s",
        speedup: "This build is",
        times: (value) => `${value}× as fast`,
        noneFaster: (set) => `No other library was faster on the ${set} set.`,
        faster: (set, libraries) =>
          `Faster than this build on the ${set} set: ${libraries}.`,
      },
      size: {
        chartCaption:
          "Size of one validator of any type (min+gzip, lower is smaller)",
        tableCaption:
          "Size of one validator of each type and of the whole library (min+gzip, lower is smaller)",
        columns: {
          DNI: "DNI",
          NIE: "NIE",
          CIF: "CIF",
          any: "Any type",
          full: "Whole library",
        },
        smaller: (libraries) =>
          `Smaller than this build for one validator of any type: ${libraries}.`,
        noneSmaller:
          "No other library is smaller for one validator of any type.",
        alternative: (library, bytes) =>
          `Also measured: ${library} with a deep import of its Spanish NIF module (not documented), ${bytes}.`,
      },
      agreement: {
        chartCaption:
          "Agreement with SPEC.md (not correctness in the absolute): the share of the fixtures each library judges as SPEC.md does, on all of them and on canonical input only",
        tableCaption:
          "Agreement with SPEC.md per document type, and the disagreements on decisions that SPEC.md documents",
        all: "All fixtures",
        canonical: "Canonical input only",
        buckets: { DNI: "DNI", NIE: "NIE", CIF: "CIF", KLM: "K/L/M" },
        disagreements: "Disagreements",
        documented: "On a documented decision",
      },
    },
    features: {
      caption:
        "Features of the Spanish ID libraries on npm, with the sources each row was checked against",
      checkedOn: (date) =>
        `Checked on ${date} against each library's README, package.json and npm page. Versions and sizes come from the benchmark results.`,
      columns: {
        types: "Types",
        klm: "K/L/M",
        normalizes: "Normalizes input",
        result: "Result object",
        messages: "Localized messages",
        generators: "Test-data generators",
        schemas: "Schemas",
        modules: "Modules",
        size: "Size, any type (min+gzip)",
        released: "Last release",
        sources: "Sources",
      },
      phrases: {
        yes: "yes",
        no: "no",
        partial: "partial",
        optIn: "opt-in",
        separateNormalize: "separate normalize()",
        resultCodeRuleMessage: "yes: code, SPEC rule, message",
        resultTypeOnly: "no (type only)",
        resultErrorClass: "yes: error class",
        resultParseWithoutReason: "partial: parse(), without the reason",
        resultValidityCountry: "yes: validity and country",
        englishOnly: "English only",
        typesStdnum: "DNI, NIE, CIF, K/L/M, and about 90 countries",
        typesJsvat: "EU VAT numbers (ES + NIF)",
        cjsUmdOnly: "CJS / UMD only",
        cjsOnly: "CJS only",
        esmDeepImportsCjs: "ESM (deep imports) + CJS",
        thisRelease: "this release",
        deprecatedOn: "{date}, deprecated",
      },
      readme: "README",
      npm: "npm",
    },
    jsonLd: { docsName: "nif-dni-nie-cif-validation documentation" },
  },
};
