import { describe, expect, it } from "vitest";
import {
  CHECKED_ON,
  COMPARISON,
  cellText,
  FEATURES,
  PHRASES,
} from "./comparison.mjs";
import { CONTENDERS } from "./competitors.mjs";

// The feature comparison shared by the READMEs and the website.

const phrasesOf = (row) =>
  FEATURES.map((key) => row[key])
    .filter((cell) => typeof cell === "object")
    .map((cell) => cell.phrase);

describe("bench/comparison.mjs", () => {
  it("has a row for every competitor of the benchmark, except v1", () => {
    expect(COMPARISON.map((row) => row.id)).toEqual(
      CONTENDERS.filter((c) => c.kind !== "previous").map((c) => c.id)
    );
  });

  it("fills every feature of every row", () => {
    for (const row of COMPARISON) {
      expect(Object.keys(row).sort(), row.id).toEqual(
        ["id", ...FEATURES].sort()
      );
    }
  });

  it("uses only known phrases, and every phrase is used", () => {
    const used = new Set(COMPARISON.flatMap(phrasesOf));
    for (const phrase of used) expect(PHRASES).toContain(phrase);
    expect([...used].sort()).toEqual([...PHRASES].sort());
  });

  it("has a checked-on date", () => {
    expect(CHECKED_ON).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("renders a cell with its phrase, and the date of a dated phrase", () => {
    const phrases = Object.fromEntries(PHRASES.map((p) => [p, `<${p}>`]));
    phrases.deprecatedOn = "{date}, deprecated";
    expect(cellText("ESM + CJS", phrases)).toBe("ESM + CJS");
    expect(cellText({ phrase: "yes" }, phrases)).toBe("<yes>");
    expect(
      cellText({ phrase: "deprecatedOn", date: "2024-12-12" }, phrases)
    ).toBe("2024-12-12, deprecated");
    expect(() => cellText({ phrase: "yes" }, {})).toThrow(/"yes"/);
  });
});
