import { describe, expect, it } from "vitest";
import { sampleResults } from "./sample-results.mjs";
import { validateResults } from "./schema.mjs";

// The schema check of bench/results/latest.json (#49), on a small sample:
// the committed file is checked by bench/results.test.mjs.

/** Sets the value at a path of keys (`undefined` removes it, as JSON would). */
function setAt(object, path, value) {
  const parent = path.slice(0, -1).reduce((node, key) => node[key], object);
  parent[path[path.length - 1]] = value;
}

describe("validateResults", () => {
  it("accepts a consistent report", () =>
    expect(validateResults(sampleResults())).toEqual([]));

  it("rejects what is not an object", () =>
    expect(validateResults(null)).toEqual(["the report is not an object"]));

  // [what is wrong, where, the wrong value, what the error says]
  const MUTATIONS = [
    ["a wrong schema version", ["schemaVersion"], 2, "schemaVersion"],
    ["a date that is not a date", ["generatedAt"], "soon", "generatedAt"],
    ["a short commit hash", ["git", "sha"], "abc", "git.sha"],
    ["no machine CPU", ["machine", "cpu"], "", "machine.cpu"],
    ["a Node version without a v", ["node"], "24.1.0", "node"],
    ["no warmup time", ["config", "warmupPerTaskMs"], undefined, "config"],
    [
      "a missing input set",
      ["inputSets", "mixed"],
      undefined,
      "inputSets.mixed",
    ],
    ["an unknown subject", ["subject"], "nope", "subject"],
    [
      "two libraries with the same id",
      ["contenders", 1, "id"],
      "current",
      "unique",
    ],
    [
      "a call that is not text or null",
      ["contenders", 1, "calls", "CIF"],
      3,
      "calls.CIF",
    ],
    [
      "a throughput result that is missing",
      ["throughput", "DNI", "lib-a"],
      undefined,
      "throughput.DNI.lib-a is missing",
    ],
    [
      "an unsupported type that has a result",
      ["throughput", "CIF", "lib-a"],
      { status: "ok" },
      "doesn't support it",
    ],
    [
      "a supported type marked unsupported",
      ["throughput", "DNI", "lib-a"],
      { status: "unsupported", reason: "no" },
      "unsupported but the library supports it",
    ],
    [
      "a speed-up that is not the ratio of the ops/s",
      ["throughput", "DNI", "lib-a", "subjectSpeedup"],
      9,
      "subjectSpeedup",
    ],
    [
      "more accepted inputs than inputs",
      ["throughput", "DNI", "current", "accepted"],
      11,
      "accepted",
    ],
    [
      "an accuracy count that does not add up",
      ["accuracy", "results", "lib-a", "all", "DNI", "agree"],
      6,
      "add up to total",
    ],
    [
      "an agreement percentage that is not agree over total",
      ["accuracy", "results", "current", "all", "DNI", "agreementPercent"],
      50,
      "agreementPercent",
    ],
    [
      "an unsupported type that has figures",
      ["accuracy", "results", "lib-a", "all", "CIF"],
      { supported: true },
      "must be unsupported",
    ],
    [
      "fixtures that do not add up",
      ["accuracy", "fixtures", "total"],
      99,
      "accuracy.fixtures",
    ],
    [
      "a disagreement count that is not the false accepts and rejects",
      ["accuracy", "results", "lib-a", "disagreementCount"],
      1,
      "disagreementCount",
    ],
    [
      "a malformed disagreement",
      ["accuracy", "results", "lib-a", "disagreements", 0, "got"],
      "maybe",
      "malformed",
    ],
    [
      "a size for an unsupported type",
      ["sizes", "lib-a", "CIF"],
      { import: "x", minBytes: 2, gzipBytes: 1 },
      "must be null",
    ],
    [
      "a size without bytes",
      ["sizes", "current", "DNI", "gzipBytes"],
      0,
      "sizes.current.DNI",
    ],
  ];

  it.each(MUTATIONS)("rejects %s", (_name, path, value, expected) => {
    const report = sampleResults();
    setAt(report, path, value);
    const errors = validateResults(report);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join("\n")).toContain(expected);
  });
});
