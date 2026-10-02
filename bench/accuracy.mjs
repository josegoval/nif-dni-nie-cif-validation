// Agreement of each library with SPEC.md, measured on the fixtures of
// test/fixtures (the same table that the unit tests of this package run).
//
// This measures agreement with the rules in SPEC.md, which come from the
// official sources, NOT correctness in the absolute. The fixtures were
// written by the maintainers of this package, so this package agrees with
// them by construction: the figure that matters is the other libraries'.
// bench/README.md, "Accuracy", explains the method and its limits.

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The fixture files that hold the expectations for the default options. The
 * other files test an option (lenient CIF control, no normalization,
 * rejected placeholders, VAT prefix, accepted types), which no other library
 * has, or hold values that are not strings (INPUT-1).
 */
export const DEFAULT_FIXTURE_FILES = [
  "dni.json",
  "klm.json",
  "nie.json",
  "cif.json",
  "normalization.json",
  "placeholders-default.json",
  "vat-default.json",
];

/** The buckets of the report: the document types, then everything else. */
export const BUCKETS = ["DNI", "NIE", "CIF", "KLM", "general"];

const TYPE_BUCKET = { DNI: "DNI", NIE: "NIE", CIF: "CIF", NIF_KLM: "KLM" };
const RULE_BUCKET = { DNI: "DNI", NIE: "NIE", CIF: "CIF", KLM: "KLM" };

/**
 * The SPEC.md decisions that make other libraries disagree, from its section
 * "Differences from other libraries". A disagreement is on a documented
 * decision when it has the rule and the direction listed here (and, when
 * there is a `matches`, the kind of input that SPEC.md names).
 */
export const DOCUMENTED_DECISIONS = [
  {
    rule: "CIF-3",
    kind: "falseAccept",
    summary:
      "control of C D F G J U V: a digit only by default (a letter only with cifControl: lenient)",
  },
  {
    rule: "NIE-3",
    kind: "falseReject",
    summary: "the old 10-character NIE form X0nnnnnnnL is valid",
  },
  {
    rule: "NORM-4",
    kind: "falseReject",
    summary: "a DNI with fewer than 8 digits is left-padded with zeros",
  },
  {
    rule: "NORM-2",
    kind: "falseReject",
    summary:
      "white space other than a space (a tab, a no-break space) is ignored too",
    // Only the input that has such a character.
    matches: (fixture) => /[^\S ]/.test(fixture.input),
  },
  {
    rule: "NORM-1",
    kind: "falseAccept",
    summary: "non-ASCII look-alikes are not folded to ASCII",
    // Only the input that has such a character.
    matches: (fixture) => /[^\p{ASCII}]/u.test(fixture.input),
  },
  {
    rule: "VAT-1",
    kind: "falseAccept",
    summary: "an ES prefix is not a NIF (it needs allowVatPrefix)",
  },
  {
    rule: "KLM-3",
    kind: "falseAccept",
    summary: "the 7 characters after K, L or M must be digits",
  },
];

/** Reads the fixtures of the default options, with the file each one is in. */
export function loadFixtures(dir, files = DEFAULT_FIXTURE_FILES) {
  return files.flatMap((file) =>
    JSON.parse(readFileSync(join(dir, file), "utf8")).map((fixture) => ({
      ...fixture,
      file,
    }))
  );
}

/** The bucket of a fixture: its document type, or the family of its rule. */
export function bucketOf(fixture) {
  if (fixture.type) return TYPE_BUCKET[fixture.type] ?? "general";
  return RULE_BUCKET[fixture.rule.split("-")[0]] ?? "general";
}

/**
 * Whether a fixture is canonical input: upper-case ASCII letters and digits
 * that the normalization of this package leaves as they are. A library that
 * doesn't normalize is not wrong on these for lack of it.
 */
export function isCanonical(fixture, normalize) {
  return (
    /^[A-Z0-9]*$/.test(fixture.input) &&
    normalize(fixture.input) === fixture.input
  );
}

/** The documented decision behind a disagreement, or null. */
export function decisionOf(fixture, kind) {
  return (
    DOCUMENTED_DECISIONS.find(
      (decision) =>
        decision.rule === fixture.rule &&
        decision.kind === kind &&
        (decision.matches?.(fixture) ?? true)
    ) ?? null
  );
}

/** What a library says about an input: a throw counts as a rejection. */
function verdict(fn, input) {
  try {
    return { valid: Boolean(fn(input)), threw: false };
  } catch {
    return { valid: false, threw: true };
  }
}

const emptyStats = () => ({
  total: 0,
  agree: 0,
  falseAccepts: 0,
  falseRejects: 0,
  onDocumentedDecisions: 0,
  threw: 0,
});

function finish(stats) {
  return {
    supported: true,
    ...stats,
    agreementPercent:
      stats.total === 0
        ? null
        : Number(((stats.agree / stats.total) * 100).toFixed(2)),
  };
}

/** Up to `limit` disagreements, the first one of each rule first. */
function representative(disagreements, limit) {
  const seen = new Set();
  const chosen = [];
  for (const item of disagreements) {
    if (!seen.has(item.rule) && chosen.length < limit) {
      seen.add(item.rule);
      chosen.push(item);
    }
  }
  return chosen;
}

/**
 * Runs one library over the fixtures.
 *
 * @param {(input: string) => unknown} fn the library's "any type" call
 * @param {{DNI: boolean, NIE: boolean, CIF: boolean}} supports
 * @param {object[]} fixtures
 * @param {(input: string) => string} normalize the normalization of this
 *   package, to tell canonical fixtures apart
 * @param {number} [limit] how many representative disagreements to keep
 */
export function evaluate(fn, supports, fixtures, normalize, limit = 6) {
  const all = Object.fromEntries(BUCKETS.map((b) => [b, emptyStats()]));
  const canonical = Object.fromEntries(BUCKETS.map((b) => [b, emptyStats()]));
  const overall = { all: emptyStats(), canonical: emptyStats() };
  const disagreements = [];

  for (const fixture of fixtures) {
    const bucket = bucketOf(fixture);
    // A type the library doesn't cover is left out, not counted as wrong.
    if (bucket in supports && !supports[bucket]) continue;

    const expected = fixture.expected === "valid";
    const { valid, threw } = verdict(fn, fixture.input);
    const agrees = valid === expected;
    const kind = agrees ? null : valid ? "falseAccept" : "falseReject";
    const decision = kind ? decisionOf(fixture, kind) : null;
    const targets = [all[bucket], overall.all];
    if (isCanonical(fixture, normalize)) {
      targets.push(canonical[bucket], overall.canonical);
    }
    for (const stats of targets) {
      stats.total++;
      if (threw) stats.threw++;
      if (agrees) stats.agree++;
      else if (kind === "falseAccept") stats.falseAccepts++;
      else stats.falseRejects++;
      if (decision) stats.onDocumentedDecisions++;
    }
    if (!agrees) {
      disagreements.push({
        input: fixture.input,
        expected: fixture.expected,
        got: valid ? "valid" : "invalid",
        kind,
        rule: fixture.rule,
        note: fixture.note,
        documentedDecision: decision?.summary ?? null,
      });
    }
  }

  const result = (byBucket, total) => ({
    overall: finish(total),
    ...Object.fromEntries(
      BUCKETS.map((bucket) => [
        bucket,
        bucket in supports && !supports[bucket]
          ? { supported: false }
          : finish(byBucket[bucket]),
      ])
    ),
  });
  return {
    all: result(all, overall.all),
    canonical: result(canonical, overall.canonical),
    disagreements: representative(disagreements, limit),
    disagreementCount: disagreements.length,
  };
}
