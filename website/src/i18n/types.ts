// The texts of the site's own components, one file per language
// (src/i18n/<code>.ts). Page titles, descriptions and the hero are in the
// pages' frontmatter (src/content/docs/), Starlight's UI strings in
// src/content/i18n/. The messages of the live validator are not here: they
// come from the package's own locale objects.
//
// Every number is passed in already formatted for the language, and comes
// from bench/results/latest.json or SPEC.md (src/data/).
import type { Phrase } from "../../../bench/comparison.mjs";

export interface ValidatorStrings {
  /** Status line before anything is typed. */
  empty: string;
  /** Status line of a valid number, followed by its type. */
  valid: string;
  /** Status line of an invalid number, followed by the message. */
  invalid: string;
  type: string;
  normalized: string;
  control: string;
  /** Shown after the control character of a valid number. */
  controlOk: string;
  /** Shown before the expected control character of an invalid number. */
  expected: string;
  rule: string;
  /** Shown after the rule of a valid number. */
  rulePassed: string;
  /** Shown after the rule of an invalid number. */
  ruleFailed: string;
  organisation: string;
  /** Shown instead of a value that `validate()` didn't return. */
  none: string;
}

export interface SiteStrings {
  hero: {
    /** The alt text of the logo: starts with the exact package name. */
    logoAlt: string;
    installLabel: string;
    copy: string;
    copied: string;
  };
  validator: {
    heading: string;
    intro: string;
    label: string;
    hint: string;
    generateLabel: string;
    generate: { DNI: string; NIE: string; CIF: string };
    generatedNote: string;
    privacy: string;
    noscript: string;
    ui: ValidatorStrings;
  };
  why: {
    heading: string;
    correct: { title: string; body: (rules: string) => string };
    fast: {
      title: string;
      /** The headline: the lowest speed-up over every other library. */
      headline: (speedup: string) => string;
      body: (mops: string, v1Low: string, v1High: string) => string;
    };
    small: {
      title: string;
      body: (anyBytes: string, fullKb: string) => string;
      /** The honest footnote: smaller single-purpose libraries. */
      note: (libraries: string) => string;
    };
    deps: { title: string; body: string };
    typed: { title: string; body: string };
    safe: { title: string; body: string };
    languages: { title: string; body: string };
    tools: { title: string; body: string };
    measured: (machine: string, node: string, date: string) => string;
  };
  code: {
    heading: string;
    intro: string;
    tabsLabel: string;
    tabs: { basic: string; validate: string; zod: string; generators: string };
    /** Comments in the code samples (the code itself stays in English). */
    comments: {
      normalized: string;
      wrongControl: string;
      neverThrows: string;
      storeThis: string;
      cifRejected: string;
      sameEverywhere: string;
      stream: string;
    };
  };
  compare: {
    heading: string;
    intro: string;
    caption: string;
    library: string;
    dni: string;
    size: string;
    thisBuild: string;
    unsupported: string;
    more: string;
    caveat: string;
  };
  footer: {
    label: string;
    github: string;
    npm: string;
    license: string;
    spec: string;
    coverage: string;
    llms: string;
    sponsor: string;
    madeBy: string;
  };
  docs: DocsStrings;
}

/**
 * The texts of the components of the documentation pages (guides,
 * reference, benchmarks, comparison). Their prose is in the pages
 * themselves; these are the labels of the tables and charts that the pages
 * build from the package, SPEC.md and bench/results/latest.json.
 */
export interface DocsStrings {
  /** Shared labels. */
  library: string;
  thisBuild: string;
  unsupported: string;
  /** "12,345 B": a size in bytes, already formatted. */
  bytes: (formatted: string) => string;
  /** The CIF organisation keys (CifKeysTable). */
  cifKeys: {
    caption: string;
    key: string;
    organisation: string;
    control: string;
    digit: string;
    letter: string;
  };
  /** Every error code and rule (ErrorCodesTable). */
  errors: {
    caption: string;
    code: string;
    rule: string;
    example: string;
    message: string;
  };
  /** The entry points of the package (EntryPointsTable). */
  entryPoints: {
    caption: string;
    entryPoint: string;
    contents: string;
    main: string;
    /** A locale entry point; `language` is its name in this language. */
    locale: (language: string) => string;
    generate: string;
    /** A schema entry point; `library` is "Zod 4", "Valibot 1" or "Yup 1". */
    schemas: (library: string) => string;
    /** The names of the package's languages, in this language. */
    languages: Record<"en" | "es" | "ca" | "eu" | "gl", string>;
  };
  /** The pages of the API reference, shown in English (src/routeData.ts). */
  apiFallback: {
    /** The title of a reference page; `module` is its import specifier. */
    title: (module: string) => string;
    description: (module: string) => string;
  };
  /** The benchmarks page. */
  bench: {
    run: {
      caption: string;
      machine: string;
      cores: string;
      memory: string;
      os: string;
      node: string;
      date: string;
      commit: string;
      method: string;
      /** "3 rounds of 2,000 ms per task, after 500 ms of warmup" */
      methodValue: (rounds: string, time: string, warmup: string) => string;
    };
    throughput: {
      /** The caption of a set's chart: "DNI: 225 valid and invalid…". */
      caption: (set: string, inputs: string) => string;
      ops: string;
      speedup: string;
      /** "7.5×" */
      times: (value: string) => string;
      /** No other library was faster than this build on this set. */
      noneFaster: (set: string) => string;
      /** Some were: `libraries` is a formatted list. */
      faster: (set: string, libraries: string) => string;
    };
    size: {
      chartCaption: string;
      tableCaption: string;
      columns: Record<"DNI" | "NIE" | "CIF" | "any" | "full", string>;
      /** The libraries smaller than this build: a formatted list. */
      smaller: (libraries: string) => string;
      noneSmaller: string;
      /** An extra measurement, such as stdnum's deep import. */
      alternative: (library: string, bytes: string) => string;
    };
    agreement: {
      chartCaption: string;
      tableCaption: string;
      all: string;
      canonical: string;
      buckets: Record<"DNI" | "NIE" | "CIF" | "KLM", string>;
      disagreements: string;
      documented: string;
    };
  };
  /** The comparison page (FeatureMatrix). */
  features: {
    caption: string;
    checkedOn: (date: string) => string;
    columns: Record<
      | "types"
      | "klm"
      | "normalizes"
      | "result"
      | "messages"
      | "generators"
      | "schemas"
      | "modules"
      | "size"
      | "released"
      | "sources",
      string
    >;
    /** The texts of bench/comparison.mjs's phrases; `{date}` is a date. */
    phrases: Record<Phrase, string>;
    readme: string;
    npm: string;
  };
  /** JSON-LD of the guides (src/routeData.ts). */
  jsonLd: {
    /** The name of the site's guides, for `isPartOf`. */
    docsName: string;
  };
}
