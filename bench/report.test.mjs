import { describe, expect, it } from "vitest";
import { describeSpeedup, renderMarkdown } from "./report.mjs";
import { sampleResults } from "./sample-results.mjs";

describe("describeSpeedup", () => {
  it.each([
    [5, "5.00×"],
    [1.04, "1.04× (about the same)"],
    [0.96, "0.96× (about the same)"],
    [0.5, "0.50× (slower)"],
  ])("%s is %s", (ratio, text) => expect(describeSpeedup(ratio)).toBe(text));
});

describe("renderMarkdown", () => {
  const markdown = renderMarkdown(sampleResults());

  it("states the machine, the versions and the units", () => {
    expect(markdown).toContain("Test CPU, 8 cores, 16 GiB, linux 6.0 (x64)");
    expect(markdown).toContain("Node.js v24.1.0, tinybench 6.2.0");
    expect(markdown).toContain("M ops/s, higher is faster");
    expect(markdown).toContain("min+gzip, lower is smaller");
  });

  it("shows the throughput, with unsupported types marked", () => {
    expect(markdown).toContain("60.00 ±0.1% (range 3.33%)");
    expect(markdown).toContain("3 rounds");
    expect(markdown).toContain("*unsupported*");
    expect(markdown).toContain("| lib-a 2.0.0 | 5.00× |");
  });

  it("shows where a competitor is faster", () => {
    expect(markdown).toContain("0.50× (slower)");
    expect(markdown).toContain("**NIE**: faster than this build: lib-a.");
  });

  it("names the exact calls", () => {
    expect(markdown).toContain("`isValidDni(x)`");
    expect(markdown).toContain("`isAny(x)`");
  });

  it("labels the accuracy as agreement with SPEC.md, not correctness", () => {
    expect(markdown).toContain("Agreement with SPEC.md (official sources)");
    expect(markdown).toContain("not correctness in the absolute");
    expect(markdown).toContain("Canonical input only");
  });

  it("lists the disagreements and flags the documented decisions", () => {
    expect(markdown).toContain('`"X01234567L"`: expected valid, got invalid');
    expect(markdown).toContain(
      "Documented SPEC decision: the old 10-character NIE form is valid."
    );
    expect(markdown).toContain("- **this package (this build)**: none.");
  });

  it("shows the sizes, with the alternatives", () => {
    expect(markdown).toContain("600 B (1,200 B)");
    expect(markdown).toContain("lib-a, an alternative: 150 B (300 B).");
  });

  it("escapes the pipes of a table cell", () => {
    const report = sampleResults();
    report.contenders[1].label = "a|b";
    expect(renderMarkdown(report)).toContain("a\\|b 2.0.0");
  });

  it("marks a build with uncommitted changes and a runner image", () => {
    const report = sampleResults();
    report.git.dirty = true;
    report.machine.runner = "ubuntu24 20260901.1";
    const text = renderMarkdown(report);
    expect(text).toContain("(with uncommitted changes)");
    expect(text).toContain("runner image ubuntu24 20260901.1");
  });
});
