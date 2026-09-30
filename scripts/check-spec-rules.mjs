#!/usr/bin/env node
// Checks that the rule IDs in the code and the tests match SPEC.md (#36).
// No dependencies, so it runs with plain Node: `pnpm spec:check`.
//
// It fails when:
// 1. a rule ID (for example `// CIF-3`) in src/ is not defined in SPEC.md;
// 2. a rule ID in a test file is not defined in SPEC.md;
// 3. a rule defined in SPEC.md is not referenced by any test, unless it is
//    in NOT_TESTED_YET below;
// 4. a NOT_TESTED_YET entry is stale: undefined in SPEC.md, or tested now.
//
// A rule is defined by an anchored row in a SPEC.md table:
// `| <a id="cif-3"></a>CIF-3 | ...`. A test references a rule when its ID
// appears in the test file outside comments: in a test name, or in a case
// table that builds test names (for example `rule: "CIF-3"`). A range such
// as `NORM-2..4` counts as NORM-2, NORM-3 and NORM-4.

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Rules that no test references yet, on purpose. Keep this list short and
// explain every entry. The next PR (#56, the validate() API with input
// normalization and VAT numbers) removes VAT-1 and NORM-2..4.
const NOT_TESTED_YET = new Map([
  ["CIF-5", "nothing to implement: province codes are not validated"],
  ["VAT-1", "ES + NIF VAT numbers are not supported yet (#56)"],
  ["NORM-2", "spaces and dots are not ignored yet (#56)"],
  ["NORM-3", "hyphens and slashes are not ignored yet (#56)"],
  ["NORM-4", "short DNIs are not left-padded yet (#56)"],
]);

const SOURCE_EXTENSIONS = /\.(?:ts|mts|cts|js|mjs|cjs)$/;
const isTestFile = (path) =>
  /(?:^|\/)__tests__\//.test(path) ||
  /\.test\.[cm]?[jt]s$/.test(path) ||
  path.startsWith("test/");

function listFiles(dir) {
  const entries = readdirSync(join(ROOT, dir), { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    return SOURCE_EXTENSIONS.test(entry.name) ? [path] : [];
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

const tested = [...defined.keys()].filter((id) => referencedByTests.has(id));
console.log(
  `SPEC.md defines ${defined.size} rules. Tests reference ${tested.length} of them (${testIds} references); ${NOT_TESTED_YET.size} are not tested yet on purpose: ${[...NOT_TESTED_YET.keys()].join(", ")}. Sources cite rule IDs ${sourceIds} times.`
);
if (errors.length > 0) {
  console.error(`\n${errors.length} problem(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("OK: every rule ID in src/ and the tests is defined in SPEC.md.");
