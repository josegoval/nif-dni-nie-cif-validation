// The texts of the site's own components, one file per language
// (src/i18n/<code>.ts). Page titles, descriptions and the hero are in the
// pages' frontmatter (src/content/docs/), Starlight's UI strings in
// src/content/i18n/. The messages of the live validator are not here: they
// come from the package's own locale objects.
//
// Every number is passed in already formatted for the language, and comes
// from bench/results/latest.json or SPEC.md (src/data/).

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
    tabs: {
      basic: string;
      validate: string;
      zod: string;
      valibot: string;
      yup: string;
      generators: string;
    };
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
}
