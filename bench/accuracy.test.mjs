import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BUCKETS,
  bucketOf,
  DEFAULT_FIXTURE_FILES,
  decisionOf,
  evaluate,
  isCanonical,
  loadFixtures,
} from "./accuracy.mjs";

const FIXTURES = join(process.cwd(), "test", "fixtures");

// Fixture files that test an option, so they don't hold the default-options
// expectations that other libraries are compared with.
const OPTION_FILES = [
  "cif-lenient.json",
  "normalization-off.json",
  "placeholders-rejected.json",
  "vat-allowed.json",
];

const ALL = { DNI: true, NIE: true, CIF: true };
// A stand-in for normalize(): it upper-cases and drops spaces and hyphens.
const normalize = (input) => input.toUpperCase().replace(/[ -]/g, "");
const fixture = (input, expected, rule = "DNI-2", type = "DNI") => ({
  input,
  expected,
  type,
  rule,
  note: "note",
});

describe("fixture files", () => {
  it("every fixture file is either default-options or an option test", () =>
    expect(
      readdirSync(FIXTURES)
        .filter((name) => name.endsWith(".json"))
        .sort()
    ).toEqual([...DEFAULT_FIXTURE_FILES, ...OPTION_FILES].sort()));

  it("loads the default-options fixtures with their file", () => {
    const fixtures = loadFixtures(FIXTURES);
    expect(fixtures.length).toBeGreaterThan(100);
    expect(new Set(fixtures.map(({ file }) => file))).toEqual(
      new Set(DEFAULT_FIXTURE_FILES)
    );
  });

  it("puts every fixture in a bucket, and every bucket has fixtures", () => {
    const fixtures = loadFixtures(FIXTURES);
    for (const bucket of BUCKETS) {
      expect(fixtures.some((f) => bucketOf(f) === bucket)).toBe(true);
    }
  });
});

describe("bucketOf", () => {
  it.each([
    [{ type: "DNI", rule: "NORM-1" }, "DNI"],
    [{ type: "NIF_KLM", rule: "KLM-2" }, "KLM"],
    [{ type: null, rule: "NIE-3" }, "NIE"],
    [{ type: null, rule: "CIF-1" }, "CIF"],
    [{ type: null, rule: "KLM-3" }, "KLM"],
    [{ type: null, rule: "DNI-1" }, "DNI"],
    [{ type: null, rule: "VAT-1" }, "general"],
    [{ type: "SOMETHING", rule: "NIF-1" }, "general"],
  ])("%j is in %s", (item, bucket) => expect(bucketOf(item)).toBe(bucket));
});

describe("isCanonical", () => {
  it.each([
    ["12345678Z", true],
    ["", true],
    ["12345678z", false],
    ["12345678-Z", false],
    [" 12345678Z", false],
    ["１２３４５６７８Z", false],
  ])("%j is %s", (input, expected) =>
    expect(isCanonical({ input }, normalize)).toBe(expected)
  );

  it("is not canonical when normalization changes the input", () =>
    expect(isCanonical({ input: "1234567L" }, (x) => `0${x}`)).toBe(false));
});

describe("decisionOf", () => {
  it("needs the rule and the direction", () => {
    expect(decisionOf({ rule: "CIF-3", input: "" }, "falseAccept")).not.toBe(
      null
    );
    expect(decisionOf({ rule: "CIF-3", input: "" }, "falseReject")).toBe(null);
    expect(decisionOf({ rule: "DNI-2", input: "" }, "falseAccept")).toBe(null);
  });

  it("limits NORM-2 to white space other than a space", () => {
    expect(
      decisionOf({ rule: "NORM-2", input: "\t12345678Z" }, "falseReject")
    ).not.toBe(null);
    expect(
      decisionOf({ rule: "NORM-2", input: " 12345678Z" }, "falseReject")
    ).toBe(null);
  });

  it("limits NORM-1 to non-ASCII input", () => {
    expect(
      decisionOf({ rule: "NORM-1", input: "ıſßñ" }, "falseAccept")
    ).not.toBe(null);
    expect(
      decisionOf({ rule: "NORM-1", input: "12345678z" }, "falseAccept")
    ).toBe(null);
  });
});

describe("evaluate", () => {
  const fixtures = [
    fixture("12345678Z", "valid"),
    fixture("12345678A", "INVALID_CONTROL_CHARACTER"),
    fixture("12345678z", "valid", "NORM-1"),
    fixture("B1234567D", "INVALID_CONTROL_CHARACTER", "CIF-3", "CIF"),
    fixture("A58818501", "valid", "CIF-3", "CIF"),
  ];
  // Accepts any 9-character string whose last letter is Z, or a CIF with a
  // D: too lenient for CIFs, strict about case.
  const lib = (input) => input.length === 9 && /[ZD1]$/.test(input);

  const result = evaluate(lib, ALL, fixtures, normalize);

  it("counts the agreement per bucket and overall", () => {
    expect(result.all.DNI).toMatchObject({
      supported: true,
      total: 3,
      agree: 2,
      falseAccepts: 0,
      falseRejects: 1,
      agreementPercent: 66.67,
    });
    expect(result.all.CIF).toMatchObject({
      total: 2,
      agree: 1,
      falseAccepts: 1,
      falseRejects: 0,
      agreementPercent: 50,
    });
    expect(result.all.overall).toMatchObject({
      total: 5,
      agree: 3,
      falseAccepts: 1,
      falseRejects: 1,
    });
  });

  it("counts the disagreements on a documented decision", () =>
    expect(result.all.overall.onDocumentedDecisions).toBe(1));

  it("measures the canonical fixtures separately", () => {
    expect(result.canonical.DNI.total).toBe(2);
    expect(result.canonical.DNI.falseRejects).toBe(0);
    expect(result.canonical.overall.total).toBe(4);
  });

  it("reports an empty bucket without a percentage", () =>
    expect(result.all.KLM).toMatchObject({ total: 0, agreementPercent: null }));

  it("lists the disagreements, the first of each rule", () => {
    expect(result.disagreementCount).toBe(2);
    expect(result.disagreements.map(({ rule }) => rule)).toEqual([
      "NORM-1",
      "CIF-3",
    ]);
    expect(result.disagreements[1]).toMatchObject({
      input: "B1234567D",
      expected: "INVALID_CONTROL_CHARACTER",
      got: "valid",
      kind: "falseAccept",
    });
    expect(result.disagreements[1].documentedDecision).toContain("digit");
    expect(result.disagreements[0].documentedDecision).toBe(null);
  });

  it("keeps at most `limit` disagreements", () =>
    expect(
      evaluate(lib, ALL, fixtures, normalize, 1).disagreements
    ).toHaveLength(1));

  it("leaves out a type the library does not support", () => {
    const partial = evaluate(
      lib,
      { DNI: true, NIE: true, CIF: false },
      fixtures,
      normalize
    );
    expect(partial.all.CIF).toEqual({ supported: false });
    expect(partial.all.overall.total).toBe(3);
    expect(partial.canonical.CIF).toEqual({ supported: false });
  });

  it("counts a throw as a rejection", () => {
    const thrower = () => {
      throw new Error("no");
    };
    const { all } = evaluate(thrower, ALL, fixtures, normalize);
    expect(all.overall).toMatchObject({
      threw: 5,
      falseRejects: 3,
      falseAccepts: 0,
    });
  });
});
