/**
 * Runs every code sample of the README (English and Spanish) and llms.txt
 * (#53, #59), so the docs can't show code that doesn't work.
 *
 * - Every ```ts, ```tsx and ```js block is extracted, its imports of
 *   `nif-dni-nie-cif-validation` (and its subpaths) are pointed at src/, and
 *   the block is run. A block is skipped only when the line before it is
 *   `<!-- readme-test: skip (reason) -->`; SKIP_ALLOWED lists the ones that
 *   may be.
 * - A top-level statement followed by a comment that starts with a value
 *   (`isValidNif("12345678Z"); // true`, `// "X1234567L": ...`, or an object
 *   over several `//` lines) is an assertion: the statement must evaluate to
 *   that value. Prose comments (`// a random DNI`) are not checked.
 * - The TypeScript blocks are also type-checked with tsc, with the strict
 *   options of this repository.
 *
 * It also checks that both READMEs name every export of every entry point
 * (the "Which function do I need?" table), and that llms.txt stays short.
 *
 * The generated files go in .cache/readme-examples/ (in .gitignore).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const OUT = join(ROOT, ".cache", "readme-examples");
const PACKAGE = "nif-dni-nie-cif-validation";
const DOCS = ["README.md", "README.es.md"];

/**
 * The blocks that may be skipped, by their first line of code, with the
 * reason. Keep it short: a skipped block is a block nobody checks.
 */
const SKIP_ALLOWED = new Map([
  [
    'import { zodResolver } from "@hookform/resolvers/zod";',
    "React Hook Form component: React, react-hook-form and @hookform/resolvers are not dev dependencies (its schema is tested)",
  ],
]);

interface Snippet {
  doc: string;
  /** 1-based line of the opening fence. */
  line: number;
  lang: "ts" | "tsx" | "js";
  code: string;
  /** The reason in the skip marker, when there is one. */
  skip: string | undefined;
}

const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

function extractSnippets(doc: string): Snippet[] {
  const lines = read(doc).split("\n");
  const snippets: Snippet[] = [];
  for (let i = 0; i < lines.length; i++) {
    const open = /^```(ts|tsx|js)\s*$/.exec(lines[i] ?? "");
    if (!open) continue;
    const start = i;
    const body: string[] = [];
    for (i++; i < lines.length && lines[i] !== "```"; i++) {
      body.push(lines[i] as string);
    }
    const marker = /^<!-- readme-test: skip \((.+)\) -->$/.exec(
      lines[start - 1] ?? ""
    );
    snippets.push({
      doc,
      line: start + 1,
      lang: open[1] as Snippet["lang"],
      code: body.join("\n"),
      skip: marker?.[1],
    });
  }
  return snippets;
}

/** The src/ file of each entry point, from the `exports` map. */
function entryPoints(): Map<string, string> {
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

const ENTRY_POINTS = entryPoints();

/** Points the imports of the package at src/, and fails on unknown subpaths. */
function useSources(code: string, where: string): string {
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
function requireToImport(code: string, where: string): string {
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
function leadingValue(text: string): string | null {
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

interface Transformed {
  code: string;
  checks: number;
}

/**
 * Turns `expr; // value` (and `expr;` followed by `// value` spread over
 * several comment lines) into a call that records both, for the test to
 * compare.
 */
function addChecks(code: string, where: string): Transformed {
  const lines = code.split("\n");
  let checks = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    if (/^\s/.test(line) || NOT_AN_EXPRESSION.test(line)) continue;
    const inline = /^(.+?;)\s*\/\/ ?(.*)$/.exec(line);
    let statement: string;
    let value: string | null;
    let end = i;
    if (inline) {
      statement = inline[1] as string;
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
    lines[i] =
      `__readmeCheck((${expression}), (${value}), ${JSON.stringify(`${where}, code line ${i + 1}`)});`;
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

const fileName = (snippet: Snippet, extension: string) =>
  `${snippet.doc.replace(/\W/g, "_")}_${snippet.line}.${extension}`;

async function run(snippet: Snippet): Promise<number> {
  const where = `${snippet.doc}:${snippet.line}`;
  let code = useSources(snippet.code, where);
  if (snippet.lang === "js") code = requireToImport(code, where);
  const transformed = addChecks(code, where);
  const file = join(OUT, "run", fileName(snippet, "ts"));
  writeFileSync(file, transformed.code);
  const checks: Check[] = [];
  // The generated modules call this global (see addChecks).
  (globalThis as Record<string, unknown>).__readmeCheck = (
    actual: unknown,
    expected: unknown,
    at: string
  ) => {
    checks.push({ actual, expected, where: at });
  };
  await import(pathToFileURL(file).href);
  for (const check of checks) {
    expect(check.actual, check.where).toEqual(check.expected);
  }
  expect(checks.length, `${where}: checks run`).toBe(transformed.checks);
  return checks.length;
}

/** Type-checks the TypeScript blocks together, with tsc. */
function typeCheck(snippets: Snippet[]): string {
  const dir = join(OUT, "types");
  const files = snippets.map((snippet) => {
    const file = join(dir, fileName(snippet, snippet.lang));
    writeFileSync(file, `${snippet.code}\n`);
    return file;
  });
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

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "run"), { recursive: true });
mkdirSync(join(OUT, "types"), { recursive: true });

const ALL = [...DOCS, "llms.txt"].flatMap(extractSnippets);

/**
 * llms.txt must stay under about 2,000 tokens (#59). Code and Markdown come
 * to roughly 3 characters per token, so 6,000 characters leaves a margin.
 */
const LLMS_MAX_CHARACTERS = 6000;

describe("code samples of the docs", () => {
  it("finds the samples of every document", () => {
    for (const doc of DOCS) {
      expect(ALL.filter((s) => s.doc === doc).length, doc).toBeGreaterThan(10);
    }
    expect(ALL.filter((s) => s.doc === "llms.txt").length).toBeGreaterThan(8);
  });

  it.each(
    ALL.filter((s) => s.skip === undefined).map(
      (s) => [`${s.doc}:${s.line}`, s] as const
    )
  )("%s runs, and gives the values in its comments", async (_, snippet) => {
    await run(snippet);
  });

  it("skips only the blocks in SKIP_ALLOWED", () => {
    for (const snippet of ALL.filter((s) => s.skip !== undefined)) {
      const first = snippet.code.split("\n")[0] ?? "";
      expect(SKIP_ALLOWED.has(first), `${snippet.doc}:${snippet.line}`).toBe(
        true
      );
    }
  });

  it("type-checks every TypeScript sample", () => {
    const typed = ALL.filter((s) => s.skip === undefined && s.lang === "ts");
    expect(typeCheck(typed)).toBe("");
  }, 60_000);

  it("keeps README.md and README.es.md in step: the same blocks, skipped alike", () => {
    const shape = (doc: string) =>
      ALL.filter((s) => s.doc === doc).map(
        (s) => `${s.lang}${s.skip === undefined ? "" : " skip"}`
      );
    expect(shape("README.es.md")).toEqual(shape("README.md"));
  });

  it.each(DOCS)("%s names every entry point and every export", async (doc) => {
    const markdown = read(doc);
    for (const [specifier, source] of ENTRY_POINTS) {
      expect(markdown, `${doc}: ${specifier}`).toContain(specifier);
      const module = (await import(join(ROOT, source))) as object;
      for (const name of Object.keys(module)) {
        if (name === "default") continue;
        expect(
          new RegExp(`\\b${name}\\b`).test(markdown),
          `${doc}: ${name} from ${specifier}`
        ).toBe(true);
      }
    }
  });

  it("keeps llms.txt short", () => {
    expect(read("llms.txt").length).toBeLessThanOrEqual(LLMS_MAX_CHARACTERS);
  });
});
