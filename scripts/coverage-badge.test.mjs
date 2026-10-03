// Tests of scripts/coverage-badge.mjs: the figure, the colour, the shields.io
// endpoint JSON and the flat SVG that the website publishes at /coverage/.
import { describe, expect, it } from "vitest";
import {
  coverageBadge,
  coverageBadgeJson,
  coverageColour,
  coveragePercent,
} from "./coverage-badge.mjs";

const totals = (statements, branches, functions, lines) => ({
  statements: { pct: statements },
  branches: { pct: branches },
  functions: { pct: functions },
  lines: { pct: lines },
});

describe("coveragePercent", () => {
  it("takes the lowest metric, rounded down to one decimal", () => {
    expect(coveragePercent(totals(100, 100, 100, 100))).toBe(100);
    expect(coveragePercent(totals(100, 99.96, 100, 100))).toBe(99.9);
    expect(coveragePercent(totals(98.5, 100, "97.25", 100))).toBe(97.2);
  });

  it("fails without the four percentages", () => {
    expect(() => coveragePercent({ lines: { pct: 100 } })).toThrow(
      /statements, branches, functions, lines/
    );
    expect(() => coveragePercent(totals(100, "Unknown", 100, 100))).toThrow();
  });
});

describe("coverageColour", () => {
  it.each([
    [100, "brightgreen", "#4b0"],
    [99.9, "green", "#67ac09"],
    [95, "green", "#67ac09"],
    [90, "yellowgreen", "#95991a"],
    [80, "yellow", "#d8b800"],
    [70, "orange", "#ea7233"],
    [69.9, "red", "#dd4343"],
    [0, "red", "#dd4343"],
  ])("%s%% is %s", (percent, name, hex) => {
    expect(coverageColour(percent)).toEqual({ name, hex });
  });
});

describe("coverageBadgeJson", () => {
  it("follows the shields.io endpoint schema", () => {
    expect(coverageBadgeJson(100)).toBe(
      '{"schemaVersion":1,"label":"coverage","message":"100%","color":"brightgreen"}\n'
    );
    expect(JSON.parse(coverageBadgeJson(97.2))).toEqual({
      schemaVersion: 1,
      label: "coverage",
      message: "97.2%",
      color: "green",
    });
  });
});

describe("coverageBadge", () => {
  it("draws the flat shields.io badge, at its size", () => {
    const svg = coverageBadge(100);
    // The geometry shields.io gives "coverage | 100%".
    expect(svg).toMatch(/^<svg [^>]*width="104" height="20"/);
    expect(svg).toContain('aria-label="coverage: 100%"');
    expect(svg).toContain("<title>coverage: 100%</title>");
    expect(svg).toContain('rx="3"');
    expect(svg).toContain('<rect width="61" height="20" fill="#555"/>');
    expect(svg).toContain('<rect x="61" width="43" height="20" fill="#4b0"/>');
    expect(svg).toContain(
      'font-family="Verdana,Geneva,DejaVu Sans,sans-serif"'
    );
    expect(svg).toContain('font-size="110"');
    expect(svg).toContain('x="315" y="140"');
    expect(svg).toContain('textLength="510">coverage</text>');
    expect(svg).toContain('x="815" y="140"');
    expect(svg).toContain('textLength="330">100%</text>');
    expect(svg.endsWith("</svg>\n")).toBe(true);
  });

  it("widens for a longer value and takes its colour", () => {
    const svg = coverageBadge(99.5);
    expect(svg).toMatch(/^<svg [^>]*width="108" height="20"/);
    expect(svg).toContain(
      '<rect x="61" width="47" height="20" fill="#67ac09"/>'
    );
    expect(svg).toContain('textLength="370">99.5%</text>');
  });
});
