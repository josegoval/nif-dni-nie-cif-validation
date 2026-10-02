import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONTENDERS } from "./competitors.mjs";
import { renderMarkdown } from "./report.mjs";
import { validateResults } from "./schema.mjs";

// The committed results of the competitor benchmark (#49), the single source
// of the numbers that the README and the site show. The workflow
// .github/workflows/bench.yml runs this test on the files it has just made.

const DIR = join(process.cwd(), "bench", "results");
const json = JSON.parse(readFileSync(join(DIR, "latest.json"), "utf8"));

describe("bench/results/latest.json", () => {
  it("follows the schema of bench/README.md", () =>
    expect(validateResults(json)).toEqual([]));

  it("lists the libraries and the calls of bench/competitors.mjs", () => {
    expect(json.contenders.map(({ id }) => id)).toEqual(
      CONTENDERS.map(({ id }) => id)
    );
    for (const contender of CONTENDERS) {
      const listed = json.contenders.find(({ id }) => id === contender.id);
      for (const key of ["DNI", "NIE", "CIF", "any"]) {
        expect(listed.calls[key]).toBe(contender.calls[key] ?? null);
      }
      expect(listed.supports).toEqual(contender.supports);
    }
  });

  it("names the machine, the Node version and the commit", () => {
    expect(json.machine.cpu).not.toBe("unknown");
    expect(json.node).toMatch(/^v\d+\./);
    expect(json.git.sha).toMatch(/^[0-9a-f]{40}$/);
  });
});

describe("bench/results/latest.md", () => {
  it("is what bench/report.mjs renders from latest.json", () =>
    expect(readFileSync(join(DIR, "latest.md"), "utf8")).toBe(
      renderMarkdown(json)
    ));
});

describe("the comparison against v1 (`pnpm bench`)", () => {
  it("keeps its files", () => {
    for (const file of ["baseline.json", "baseline.md"]) {
      expect(existsSync(join(DIR, file))).toBe(true);
    }
  });
});
