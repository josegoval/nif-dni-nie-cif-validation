#!/usr/bin/env node
// Checks that the rule IDs in the code and the tests match SPEC.md (#36), and
// that the JSON fixtures show each rule both passing and failing (#41).
// No dependencies, so it runs with plain Node: `pnpm spec:check`.
//
// It fails when:
// 1. a rule ID (for example `// CIF-3`) in src/ is not defined in SPEC.md;
// 2. a rule ID in a test file is not defined in SPEC.md;
// 3. a rule defined in SPEC.md is not referenced by any test, unless it is
//    in NOT_TESTED_YET below;
// 4. a NOT_TESTED_YET entry is stale: undefined in SPEC.md, or tested now;
// 5. a rule defined in SPEC.md lacks a valid fixture or an invalid one, unless
//    that polarity is in POLARITY_EXEMPTIONS below;
// 6. a POLARITY_EXEMPTIONS entry is stale: undefined in SPEC.md, or the
//    exempted polarity has a fixture now.
//
// A rule is defined by an anchored row in a SPEC.md table:
// `| <a id="cif-3"></a>CIF-3 | ...`. A test references a rule when its ID
// appears in the test file outside comments: in a test name, or in a case
// table that builds test names (for example `rule: "CIF-3"`), or in a JSON
// fixture under test/ (`"rule": "CIF-3"`), which the table-driven test
// turns into test names. A range such as `NORM-2..4` counts as NORM-2,
// NORM-3 and NORM-4.
//
// A JSON fixture (`{ input, expected, type, rule, note }`) is *valid* when
// `expected` is "valid": it shows its rule passing. Any other `expected` is
// an error code, and `rule` is the rule that the error cites: it shows that
// rule failing.

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Rules that no test references yet, on purpose. Keep this list short and
// explain every entry. Empty since the v2 API (#56): every rule is tested,
// CIF-5 by a test proving that no province check happens.
const NOT_TESTED_YET = new Map();

/**
 * Rules whose fixtures can't show one polarity, mapped to the polarity that
 * is missing on purpose ("valid" or "invalid"), each with its reason. Every
 * other rule needs at least one valid and one invalid fixture. Keep it
 * honest: an entry for an undefined rule, or for a polarity that has a
 * fixture now, fails the check.
 */
export const POLARITY_EXEMPTIONS = new Map([
  // Only rejects letters; a DNI whose letter is in the table passes DNI-2.
  ["DNI-3", "valid"],
  // No error cites it: a first character that is not a key fails NIF-1.
  ["CIF-2", "invalid"],
  // It forbids a check (province codes), so no input can fail it.
  ["CIF-5", "invalid"],
  // NORM-1 to NORM-4: cleanup never rejects; what it can't clean fails a
  // format rule (12345678_Z fails DNI-1).
  ["NORM-1", "invalid"],
  ["NORM-2", "invalid"],
  ["NORM-3", "invalid"],
  ["NORM-4", "invalid"],
  // Only rejects non-strings; every string fixture is its passing side.
  ["INPUT-1", "valid"],
  // Only rejects empty input; every non-empty fixture is its passing side.
  ["INPUT-2", "valid"],
]);

const POLARITIES = ["valid", "invalid"];

/**
 * How many valid and invalid fixtures each rule has.
 *
 * @param {{ rule: string, expected: string }[]} fixtures
 * @returns {Map<string, { valid: number, invalid: number }>}
 */
export function polarityCounts(fixtures) {
  const counts = new Map();
  for (const { rule, expected } of fixtures) {
    const count = counts.get(rule) ?? { valid: 0, invalid: 0 };
    count[expected === "valid" ? "valid" : "invalid"]++;
    counts.set(rule, count);
  }
  return counts;
}

/**
 * The problems of the fixture polarity: a rule without a valid or an invalid
 * fixture that is not exempted, and every stale or malformed exemption.
 *
 * @param {Map<string, number>} defined the rules of SPEC.md and their line
 * @param {{ rule: string, expected: string }[]} fixtures
 * @param {Map<string, string>} exemptions rule ID to the missing polarity
 * @returns {string[]}
 */
export function checkPolarity(
  defined,
  fixtures,
  exemptions = POLARITY_EXEMPTIONS
) {
  const errors = [];
  const counts = polarityCounts(fixtures);
  for (const [id, line] of defined) {
    const count = counts.get(id) ?? { valid: 0, invalid: 0 };
    for (const polarity of POLARITIES) {
      if (count[polarity] > 0 || exemptions.get(id) === polarity) continue;
      errors.push(
        `SPEC.md:${line}: rule ${id} has no ${polarity} fixture under test/. Add one, or exempt it in POLARITY_EXEMPTIONS with a reason.`
      );
    }
  }
  for (const [id, missing] of exemptions) {
    if (!defined.has(id))
      errors.push(`POLARITY_EXEMPTIONS: ${id} is not defined in SPEC.md`);
    else if (!POLARITIES.includes(missing))
      errors.push(
        `POLARITY_EXEMPTIONS: ${id} must exempt "valid" or "invalid", not ${JSON.stringify(missing)}`
      );
    else if ((counts.get(id)?.[missing] ?? 0) > 0)
      errors.push(
        `POLARITY_EXEMPTIONS: ${id} now has ${missing} fixtures; remove the exemption`
      );
  }
  return errors;
}

const SOURCE_EXTENSIONS = /\.(?:ts|mts|cts|js|mjs|cjs)$/;
/** JSON fixtures count as tests; JSON elsewhere is not scanned. */
const FIXTURE_EXTENSION = /\.json$/;
const isTestFile = (path) =>
  /(?:^|\/)__tests__\//.test(path) ||
  /\.test\.[cm]?[jt]s$/.test(path) ||
  path.startsWith("test/");

function listFiles(dir) {
  const entries = readdirSync(join(ROOT, dir), { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    return SOURCE_EXTENSIONS.test(entry.name) ||
      (path.startsWith("test/") && FIXTURE_EXTENSION.test(entry.name))
      ? [path]
      : [];
  });
}

const read = (path) => readFileSync(join(ROOT, path), "utf8");

/**
 * Returns the code with comments blanked out (same length, so positions and
 * line numbers are kept). Handles strings and template literals; regex
 * literals are treated as code, which is fine for the test files here.
 */
function stripComments(code) {
  let out = "";
  let i = 0;
  while (i < code.length) {
    const char = code[i];
    const next = code[i + 1];
    if (char === "/" && next === "/") {
      while (i < code.length && code[i] !== "\n") {
        out += " ";
        i++;
      }
    } else if (char === "/" && next === "*") {
      const end = code.indexOf("*/", i + 2);
      const stop = end === -1 ? code.length : end + 2;
      out += code.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
    } else if (char === '"' || char === "'" || char === "`") {
      out += char;
      i++;
      while (i < code.length && code[i] !== char) {
        if (code[i] === "\\") {
          out += code[i] + (code[i + 1] ?? "");
          i += 2;
        } else if (char === "`" && code[i] === "$" && code[i + 1] === "{") {
          // `${ ... }`: code inside a template, up to the matching brace.
          out += "${";
          i += 2;
          let depth = 1;
          const start = i;
          while (i < code.length && depth > 0) {
            if (code[i] === "{") depth++;
            else if (code[i] === "}") depth--;
            if (depth > 0) i++;
          }
          out += stripComments(code.slice(start, i));
        } else {
          out += code[i];
          i++;
        }
      }
      if (i < code.length) {
        out += code[i];
        i++;
      }
    } else {
      out += char;
      i++;
    }
  }
  return out;
}

function main() {
  // 1. Rules defined in SPEC.md.
  const spec = read("SPEC.md");
  const defined = new Map();
  const errors = [];
  for (const match of spec.matchAll(
    /^\|\s*<a id="([a-z]+-\d+)"><\/a>([A-Z]+-\d+)\s*\|/gm
  )) {
    const [, anchor, id] = match;
    if (anchor !== id.toLowerCase())
      errors.push(`SPEC.md: anchor "${anchor}" does not match rule ${id}`);
    if (defined.has(id)) errors.push(`SPEC.md: rule ${id} is defined twice`);
    defined.set(id, spec.slice(0, match.index).split("\n").length);
  }
  if (defined.size === 0) {
    console.error("No rules found in SPEC.md. Did the table format change?");
    process.exit(1);
  }
  const families = [
    ...new Set([...defined.keys()].map((id) => id.split("-")[0])),
  ];
  const ID_PATTERN = new RegExp(
    `\\b(${families.join("|")})-(\\d+)(?:\\.\\.(\\d+))?\\b`,
    "g"
  );

  /** Every rule ID in `text`, with its line number. Ranges are expanded. */
  function findIds(text) {
    const found = [];
    for (const match of text.matchAll(ID_PATTERN)) {
      const [, family, from, to] = match;
      const line = text.slice(0, match.index).split("\n").length;
      const last = to === undefined ? Number(from) : Number(to);
      for (let n = Number(from); n <= last; n++)
        found.push({ id: `${family}-${n}`, line });
    }
    return found;
  }

  // 2. Rule IDs in src/ and in the tests.
  const files = [...listFiles("src"), ...listFiles("test")].map((path) =>
    relative(ROOT, join(ROOT, path))
  );
  const referencedByTests = new Map();
  let sourceIds = 0;
  let testIds = 0;
  for (const path of files) {
    const text = read(path);
    const test = isTestFile(path);
    for (const { id, line } of findIds(text)) {
      if (!defined.has(id))
        errors.push(
          `${path}:${line}: rule ${id} is not defined in SPEC.md (${test ? "test" : "source"})`
        );
    }
    if (test) {
      for (const { id } of findIds(stripComments(text))) {
        testIds++;
        referencedByTests.set(id, (referencedByTests.get(id) ?? 0) + 1);
      }
    } else {
      sourceIds += findIds(text).length;
    }
  }

  // 3. Every rule is tested, or explicitly not tested yet.
  for (const [id, line] of defined) {
    if (referencedByTests.has(id) || NOT_TESTED_YET.has(id)) continue;
    errors.push(
      `SPEC.md:${line}: rule ${id} is not referenced by any test name. Add a test named after it, or list it in NOT_TESTED_YET with a reason.`
    );
  }

  // 4. The allow-list has no stale entries.
  for (const id of NOT_TESTED_YET.keys()) {
    if (!defined.has(id))
      errors.push(`NOT_TESTED_YET: ${id} is not defined in SPEC.md`);
    else if (referencedByTests.has(id))
      errors.push(
        `NOT_TESTED_YET: ${id} is referenced by a test now; remove it from the list`
      );
  }

  // 5 and 6. Every rule has a valid and an invalid fixture, or an exemption.
  const fixtures = [];
  for (const path of files.filter((file) => FIXTURE_EXTENSION.test(file))) {
    const entries = JSON.parse(read(path));
    const wellFormed =
      Array.isArray(entries) &&
      entries.every(
        (entry) =>
          typeof entry?.rule === "string" && typeof entry?.expected === "string"
      );
    if (wellFormed) fixtures.push(...entries);
    else
      errors.push(
        `${path}: a fixture file is an array of { input, expected, type, rule, note }`
      );
  }
  errors.push(...checkPolarity(defined, fixtures));
  const counts = polarityCounts(fixtures);

  const tested = [...defined.keys()].filter((id) => referencedByTests.has(id));
  console.log(
    `SPEC.md defines ${defined.size} rules. Tests reference ${tested.length} of them (${testIds} references). Not tested yet on purpose: ${NOT_TESTED_YET.size === 0 ? "none" : [...NOT_TESTED_YET.keys()].join(", ")}. Sources cite rule IDs ${sourceIds} times.`
  );
  const polarity = [...defined.keys()].map((id) => {
    const { valid, invalid } = counts.get(id) ?? { valid: 0, invalid: 0 };
    const exempt = POLARITY_EXEMPTIONS.get(id);
    return `${id} ${valid}/${invalid}${exempt ? ` (no ${exempt}: exempt)` : ""}`;
  });
  console.log(
    `Fixtures per rule (valid/invalid), from ${fixtures.length} fixtures: ${polarity.join(", ")}.`
  );
  if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(
    "OK: every rule ID in src/ and the tests is defined in SPEC.md, and every rule has a valid and an invalid fixture or an exemption."
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
