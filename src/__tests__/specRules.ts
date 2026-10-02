/// <reference types="node" />
// Test helper: the rule IDs defined in SPEC.md and its test values, read the
// same way scripts/check-spec-rules.mjs reads them.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const SPEC = readFileSync(join(process.cwd(), "SPEC.md"), "utf8");

/** Every rule ID defined by an anchored row of a SPEC.md table. */
export const SPEC_RULES: ReadonlySet<string> = new Set(
  Array.from(
    SPEC.matchAll(/^\|\s*<a id="[a-z]+-\d+"><\/a>([A-Z]+-\d+)\s*\|/gm),
    (match) => match[1] as string
  )
);

/** The values listed in SPEC.md's "Test values" section. */
export const SPEC_TEST_VALUES: readonly string[] = (() => {
  const start = SPEC.indexOf("## Test values");
  const end = SPEC.indexOf("\n## ", start + 1);
  const section = SPEC.slice(start, end);
  const values = new Set<string>();
  for (const [, token] of section.matchAll(/`([^`]+)`/g)) {
    const value = token as string;
    // Skip option names such as `rejectPlaceholders` and prose like `00`.
    if (/^[0-9A-Z]{8,}$/.test(value)) values.add(value);
  }
  // "12345678I / O / U": the letters after the slashes.
  if (section.includes("`12345678I` / `O` / `U`"))
    values.add("12345678O").add("12345678U");
  return [...values];
})();
