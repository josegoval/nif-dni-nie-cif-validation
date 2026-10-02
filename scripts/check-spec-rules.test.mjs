// Tests of the fixture polarity check of scripts/check-spec-rules.mjs: every
// SPEC.md rule needs a valid and an invalid fixture, or an exemption that is
// still needed.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkPolarity,
  POLARITY_EXEMPTIONS,
  polarityCounts,
} from "./check-spec-rules.mjs";

/** Rules as the script reads them from SPEC.md: ID to line number. */
const rules = (...ids) => new Map(ids.map((id, i) => [id, i + 1]));
const valid = (rule) => ({ rule, expected: "valid" });
const invalid = (rule, expected = "INVALID_FORMAT") => ({ rule, expected });

describe("polarityCounts", () => {
  it("counts every error code as invalid", () =>
    expect(
      polarityCounts([
        valid("A-1"),
        invalid("A-1"),
        invalid("A-1", "EMPTY"),
        invalid("B-1"),
      ])
    ).toEqual(
      new Map([
        ["A-1", { valid: 1, invalid: 2 }],
        ["B-1", { valid: 0, invalid: 1 }],
      ])
    ));
});

describe("checkPolarity", () => {
  const none = new Map();

  it("passes when every rule has a valid and an invalid fixture", () =>
    expect(
      checkPolarity(
        rules("A-1", "B-1"),
        [valid("A-1"), invalid("A-1"), invalid("B-1"), valid("B-1")],
        none
      )
    ).toEqual([]));

  it("reports a missing valid, a missing invalid, and both", () => {
    const errors = checkPolarity(
      rules("A-1", "B-1", "C-1"),
      [valid("A-1"), invalid("B-1")],
      none
    );
    expect(errors).toEqual([
      expect.stringMatching(/^SPEC\.md:1: rule A-1 has no invalid fixture/),
      expect.stringMatching(/^SPEC\.md:2: rule B-1 has no valid fixture/),
      expect.stringMatching(/^SPEC\.md:3: rule C-1 has no valid fixture/),
      expect.stringMatching(/^SPEC\.md:3: rule C-1 has no invalid fixture/),
    ]);
  });

  it("an exemption covers its polarity only", () => {
    const exempt = new Map([["A-1", "invalid"]]);
    expect(checkPolarity(rules("A-1"), [valid("A-1")], exempt)).toEqual([]);
    expect(checkPolarity(rules("A-1"), [], exempt)).toEqual([
      expect.stringMatching(/rule A-1 has no valid fixture/),
    ]);
  });

  it("fails on an exemption for a rule that SPEC.md doesn't define", () =>
    expect(
      checkPolarity(
        rules("A-1"),
        [valid("A-1"), invalid("A-1")],
        new Map([["Z-9", "valid"]])
      )
    ).toEqual(["POLARITY_EXEMPTIONS: Z-9 is not defined in SPEC.md"]));

  it("fails on an exemption that is no longer needed", () =>
    expect(
      checkPolarity(
        rules("A-1"),
        [valid("A-1"), invalid("A-1")],
        new Map([["A-1", "invalid"]])
      )
    ).toEqual([
      "POLARITY_EXEMPTIONS: A-1 now has invalid fixtures; remove the exemption",
    ]));

  it("fails on an exemption that names no polarity", () =>
    expect(
      checkPolarity(
        rules("A-1"),
        [valid("A-1"), invalid("A-1")],
        new Map([["A-1", "both"]])
      )
    ).toEqual([
      'POLARITY_EXEMPTIONS: A-1 must exempt "valid" or "invalid", not "both"',
    ]));
});

describe("the repository", () => {
  const spec = readFileSync(join(process.cwd(), "SPEC.md"), "utf8");
  const defined = new Map(
    Array.from(
      spec.matchAll(/^\|\s*<a id="[a-z]+-\d+"><\/a>([A-Z]+-\d+)\s*\|/gm),
      (match, i) => [match[1], i]
    )
  );
  const dir = join(process.cwd(), "test", "fixtures");
  const fixtures = readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .flatMap((name) => JSON.parse(readFileSync(join(dir, name), "utf8")));

  it("every exemption names a SPEC.md rule and one polarity", () => {
    for (const [id, missing] of POLARITY_EXEMPTIONS) {
      expect(defined.has(id)).toBe(true);
      expect(["valid", "invalid"]).toContain(missing);
    }
  });

  it("every rule has both polarities or a needed exemption", () =>
    expect(checkPolarity(defined, fixtures)).toEqual([]));
});
