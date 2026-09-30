/// <reference types="node" />
/**
 * Test helper: runs code samples taken from the docs, for
 * `readme-examples.test.ts` (the READMEs and llms.txt) and
 * `jsdoc-examples.test.ts` (the `@example` blocks of the JSDoc).
 *
 * A sample is ordinary TypeScript. Its imports of the package are pointed at
 * `src/`, and a top-level statement followed by a comment that starts with a
 * value is an assertion:
 *
 * - `isValidNif("12345678Z"); // true`, `// "X1234567L": ...` or an object
 *   over several `//` lines: the statement must evaluate to that value.
 * - `generateCif({ orgKey: "B", control: "letter" }); // throws RangeError`:
 *   the statement must throw an error of that class.
 *
 * Prose comments (`// a random DNI`) are not checked.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect } from "vitest";

export const ROOT = fileURLToPath(new URL("../..", import.meta.url));
export const PACKAGE = "nif-dni-nie-cif-validation";

export const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

/** The src/ file of each entry point, from the `exports` map. */
export function entryPoints(): Map<string, string> {
  const pkg = JSON.parse(read("package.json")) as {
    exports: Record<string, string | { import: { default: string } }>;
  };
  const entries = new Map<string, string>();
  for (const [key, value] of Object.entries(pkg.exports)) {
    if (typeof value === "string") continue; // ./package.json
    const source = value.import.default
      .replace("./dist/esm/", "src/")
      .replace(/\.mjs$/, ".ts");
    entries.set(key === "." ? PACKAGE : `${PACKAGE}${key.slice(1)}`, source);
  }
  return entries;
}

export const ENTRY_POINTS = entryPoints();

/** Points the imports of the package at src/, and fails on unknown subpaths. */
export function useSources(code: string, where: string): string {
  return code.replace(
    new RegExp(`(["'])(${PACKAGE}(?:/[^"']*)?)\\1`, "g"),
    (_, _quote, specifier: string) => {
      const source = ENTRY_POINTS.get(specifier);
      if (!source)
        throw new Error(`${where}: unknown entry point ${specifier}`);
      return JSON.stringify(join(ROOT, source));
    }
  );
}

/**
 * `const { a, b } = require("x");` becomes `import { a, b } from "x";`, so a
 * CommonJS sample runs in the ES module test. (The CommonJS build itself is
 * covered by test/smoke.)
 */
export function requireToImport(code: string, where: string): string {
  return code.replace(/^.*\brequire\(.*$/gm, (line) => {
    const match = /^const (\{[\w\s,]+\}) = require\(("[^"]+")\);$/.exec(line);
    if (!match) throw new Error(`${where}: unsupported require: ${line}`);
    return `import ${match[1]} from ${match[2]};`;
  });
}

/**
 * The JavaScript value at the start of a comment, as source text: an object
 * or array (balanced, strings skipped), a string, a number, `true`, `false`,
 * `null` or `undefined`. `null` when the comment starts with prose.
 */
export function leadingValue(text: string): string | null {
  const first = text[0];
  if (first === "{" || first === "[") {
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i] as string;
      if (char === '"' || char === "'") {
        const end = closingQuote(text, i);
        if (end < 0) return null;
        i = end;
      } else if (char === "{" || char === "[") depth++;
      else if (char === "}" || char === "]") {
        depth--;
        if (depth === 0) return text.slice(0, i + 1);
      }
    }
    return null;
  }
  if (first === '"' || first === "'") {
    const end = closingQuote(text, 0);
    return end < 0 ? null : text.slice(0, end + 1);
  }
  const word = /^(?:true|false|null|undefined|-?\d+(?:\.\d+)?)(?![\w.])/.exec(
    text
  );
  return word ? word[0] : null;
}

function closingQuote(text: string, start: number): number {
  const quote = text[start];
  for (let i = start + 1; i < text.length; i++) {
    if (text[i] === "\\") i++;
    else if (text[i] === quote) return i;
  }
  return -1;
}

/** Top-level lines that are not an expression whose value can be checked. */
const NOT_AN_EXPRESSION =
  /^(?:(?:import|export|const|let|var|function|type|interface|return|if|for|while)\b|\/\/|[})\]])/;

export interface Transformed {
  code: string;
  /** How many assertions the code now makes. */
  checks: number;
}

/**
 * Turns `expr; // value` (and `expr;` followed by `// value` spread over
 * several comment lines) into a call that records both, for `runSnippet` to
 * compare. `expr; // throws RangeError` records the class of the error that
 * `expr` throws instead. The line numbers of `where` count from the first
 * line of `code`.
 */
export function addChecks(code: string, where: string): Transformed {
  const lines = code.split("\n");
  let checks = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    if (/^\s/.test(line) || NOT_AN_EXPRESSION.test(line)) continue;
    const at = JSON.stringify(`${where}, code line ${i + 1}`);
    const inline = /^(.+?;)\s*\/\/ ?(.*)$/.exec(line);
    let statement: string;
    let value: string | null;
    let end = i;
    if (inline) {
      statement = inline[1] as string;
      const thrown = /^throws (\w+)/.exec(inline[2] as string);
      if (thrown) {
        lines[i] =
          `__snippetCheck(__snippetThrown(() => (${statement.slice(0, -1)})), ${JSON.stringify(thrown[1])}, ${at});`;
        checks++;
        continue;
      }
      value = leadingValue(inline[2] as string);
    } else if (line.endsWith(";") && /^\/\/ /.test(lines[i + 1] ?? "")) {
      // A value on the next comment lines, maybe spread over several.
      statement = line;
      value = null;
      let comment = "";
      for (let j = i + 1; /^\/\/ /.test(lines[j] ?? ""); j++) {
        comment += `${comment ? "\n" : ""}${(lines[j] as string).slice(3)}`;
        value = leadingValue(comment);
        end = j;
        if (value !== null || !/^[{[]/.test(comment)) break;
      }
    } else continue;
    if (value === null) continue;
    const expression = statement.slice(0, -1);
    lines[i] = `__snippetCheck((${expression}), (${value}), ${at});`;
    for (let j = i + 1; j <= end; j++) lines[j] = "";
    checks++;
  }
  return { code: lines.join("\n"), checks };
}

interface Check {
  actual: unknown;
  expected: unknown;
  where: string;
}

/**
 * Writes `transformed` to `file` (a TypeScript module), runs it, and
 * compares what each assertion recorded. Returns the number of assertions.
 */
export async function runSnippet(
  file: string,
  transformed: Transformed,
  where: string
): Promise<number> {
  writeFileSync(file, transformed.code);
  const checks: Check[] = [];
  // The generated modules call these globals (see addChecks).
  const globals = globalThis as Record<string, unknown>;
  globals.__snippetCheck = (actual: unknown, expected: unknown, at: string) => {
    checks.push({ actual, expected, where: at });
  };
  globals.__snippetThrown = (run: () => unknown): string => {
    try {
      run();
    } catch (error) {
      return error instanceof Error ? error.constructor.name : typeof error;
    }
    return "nothing was thrown";
  };
  await import(pathToFileURL(file).href);
  for (const check of checks) {
    expect(check.actual, check.where).toEqual(check.expected);
  }
  expect(checks.length, `${where}: checks run`).toBe(transformed.checks);
  return checks.length;
}

/**
 * Type-checks `files` together with tsc and the strict options of this
 * repository, where the package and its subpaths resolve to src/. Returns
 * the compiler output, empty when everything type-checks.
 */
export function typeCheck(dir: string, files: string[]): string {
  const tsconfig = {
    compilerOptions: {
      target: "es2022",
      module: "esnext",
      moduleResolution: "bundler",
      strict: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      noEmit: true,
      skipLibCheck: true,
      types: ["node"],
      lib: ["es2022", "dom"],
      paths: {
        [PACKAGE]: [join(ROOT, "src/index.ts")],
        [`${PACKAGE}/*`]: [join(ROOT, "src/*")],
      },
    },
    files,
  };
  const config = join(dir, "tsconfig.json");
  writeFileSync(config, JSON.stringify(tsconfig, null, 2));
  try {
    execFileSync(
      process.execPath,
      [join(ROOT, "node_modules/typescript/bin/tsc"), "-p", config],
      { encoding: "utf8" }
    );
    return "";
  } catch (error) {
    const { stdout, stderr } = error as { stdout?: string; stderr?: string };
    return `${stdout ?? ""}${stderr ?? ""}`;
  }
}
