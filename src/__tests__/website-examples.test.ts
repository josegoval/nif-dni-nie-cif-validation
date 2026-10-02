/**
 * Runs every code sample of the website's pages (website/src/content/docs/),
 * as readme-examples.test.ts does for the READMEs (#65, #66):
 *
 * - The English pages are the reference. Every ```ts, ```tsx and ```js block
 *   is run, its imports of `nif-dni-nie-cif-validation` pointed at src/, and
 *   a top-level statement followed by a comment that starts with a value
 *   (`isValidNif("12345678Z"); // true`) must give that value. The
 *   TypeScript blocks are also type-checked with tsc.
 * - A block after `{/* docs-test: v1 *\/}` shows version 1: it runs against
 *   v1.0.11 (the `nif-v1` dev alias) instead, and is not type-checked (its
 *   types are v1's).
 * - A block after `{/* docs-test: skip (reason) *\/}` is skipped; only the
 *   blocks of SKIP_ALLOWED may be.
 * - The other languages (es, ca, eu, gl) have the same pages with the same
 *   code: the blocks must be identical once the prose of their comments is
 *   removed. The values in the comments stay, so a translated page can't
 *   show a result that the English page doesn't check.
 *
 * The competitors' "before" code on the migration pages runs against the
 * libraries themselves (they are dev dependencies for the benchmark). The
 * generated pages (the API reference and the official sources page, written
 * at build time) are not here: their samples are the JSDoc's and SPEC.md's.
 *
 * The generated files go in .cache/website-examples/ (in .gitignore).
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  addChecks,
  leadingValue,
  PACKAGE,
  ROOT,
  read,
  requireToImport,
  runSnippet,
  typeCheck,
  useSources,
} from "./snippets";

const OUT = join(ROOT, ".cache", "website-examples");
const DOCS = "website/src/content/docs";
const LOCALES = ["es", "ca", "eu", "gl"];
/** Pages written at build time, ignored by git. */
const GENERATED = ["reference/api/", "reference/official-sources.md"];

/**
 * The blocks that may be skipped, by their first line of code, with the
 * reason. Keep it short: a skipped block is a block nobody checks.
 */
const SKIP_ALLOWED = new Map([
  [
    'import { zodResolver } from "@hookform/resolvers/zod";',
    "React Hook Form component: React, react-hook-form and @hookform/resolvers are not dev dependencies (its schema is tested, and examples/zod-react-hook-form is type-checked in CI)",
  ],
]);

type Mode = "run" | "v1" | "skip";

interface Snippet {
  /** The page, relative to the docs folder of its language. */
  page: string;
  /** 1-based line of the opening fence. */
  line: number;
  lang: "ts" | "tsx" | "js";
  code: string;
  mode: Mode;
  reason: string | undefined;
}

/** Every page of a language folder, relative to it (not the generated ones). */
function pages(dir: string, prefix = ""): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const path = `${prefix}${name}`;
    if (prefix === "" && LOCALES.includes(name)) return [];
    if (GENERATED.some((g) => path === g || `${path}/`.startsWith(g)))
      return [];
    if (statSync(join(ROOT, dir, name)).isDirectory()) {
      return pages(join(dir, name), `${path}/`);
    }
    return /\.mdx?$/.test(name) ? [path] : [];
  });
}

function extractSnippets(file: string, page: string): Snippet[] {
  const lines = read(file).split("\n");
  const snippets: Snippet[] = [];
  for (let i = 0; i < lines.length; i++) {
    const open = /^```(ts|tsx|js)(?:\s.*)?$/.exec(lines[i] ?? "");
    if (!open) continue;
    const start = i;
    const body: string[] = [];
    for (i++; i < lines.length && lines[i] !== "```"; i++) {
      body.push(lines[i] as string);
    }
    const marker = /^\{\/\* docs-test: (v1|skip \((.+)\)) \*\/\}$/.exec(
      lines[start - 1] ?? ""
    );
    snippets.push({
      page,
      line: start + 1,
      lang: open[1] as Snippet["lang"],
      code: body.join("\n"),
      mode: marker ? (marker[1] === "v1" ? "v1" : "skip") : "run",
      reason: marker?.[2],
    });
  }
  return snippets;
}

const fileName = (snippet: Snippet, extension: string) =>
  `${snippet.page.replace(/\W/g, "_")}_${snippet.line}.${extension}`;

/** v1 samples import the package by its name: point them at v1.0.11. */
const useV1 = (code: string) =>
  code.replace(
    new RegExp(`(["'])${PACKAGE}\\1`, "g"),
    (_, quote: string) => `${quote}nif-v1${quote}`
  );

async function run(snippet: Snippet): Promise<number> {
  const where = `${DOCS}/${snippet.page}:${snippet.line}`;
  let code =
    snippet.mode === "v1"
      ? useV1(snippet.code)
      : useSources(snippet.code, where);
  if (snippet.lang === "js") code = requireToImport(code, where);
  const file = join(OUT, "run", fileName(snippet, "ts"));
  return runSnippet(file, addChecks(code, where), where);
}

/** Type-checks the TypeScript blocks together, with tsc. */
function checkTypes(snippets: Snippet[]): string {
  const dir = join(OUT, "types");
  const files = snippets.map((snippet) => {
    const file = join(dir, fileName(snippet, snippet.lang));
    writeFileSync(file, `${snippet.code}\n`);
    return file;
  });
  return typeCheck(dir, files);
}

/** Where a `//` comment starts on a line of code, outside strings, or -1. */
function commentStart(line: string): number {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const char = line[i] as string;
    if (quote) {
      if (char === "\\") i++;
      else if (char === quote) quote = null;
    } else if (char === '"' || char === "'" || char === "`") quote = char;
    else if (char === "/" && line[i + 1] === "/") return i;
  }
  return -1;
}

/**
 * The code of a block without the prose of its comments: each line keeps its
 * code and the value its comment starts with (an assertion), and a value
 * spread over several comment lines is kept whole.
 */
function codeShape(code: string): string[] {
  const lines = code.split("\n");
  const shape: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    const at = commentStart(line);
    if (at < 0) {
      shape.push(line.trimEnd());
      continue;
    }
    const before = line.slice(0, at).trimEnd();
    let comment = line.slice(at + 2).trim();
    // `// throws RangeError` is an assertion too (see addChecks).
    let value = /^throws \w+/.exec(comment)?.[0] ?? leadingValue(comment);
    // A comment-only line that opens an object or an array: the value goes
    // on over the next comment lines.
    if (value === null && before === "" && /^[{[]/.test(comment)) {
      for (let j = i + 1; j < lines.length; j++) {
        const next = (lines[j] as string).trim();
        if (!next.startsWith("//")) break;
        comment += `\n${next.slice(2)}`;
        i = j;
        value = leadingValue(comment);
        if (value !== null) break;
      }
    }
    shape.push(`${before} //${value === null ? "" : ` ${value}`}`);
  }
  return shape;
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "run"), { recursive: true });
mkdirSync(join(OUT, "types"), { recursive: true });

const ENGLISH_PAGES = pages(DOCS);
const ALL = ENGLISH_PAGES.flatMap((page) =>
  extractSnippets(join(DOCS, page), page)
);

describe("code samples of the website", () => {
  it("finds the pages and their samples", () => {
    expect(ENGLISH_PAGES.length).toBeGreaterThan(15);
    expect(ALL.length).toBeGreaterThan(60);
    expect(ALL.filter((s) => s.mode === "v1").length).toBeGreaterThan(1);
  });

  it.each(
    ALL.filter((s) => s.mode !== "skip").map(
      (s) => [`${s.page}:${s.line}`, s] as const
    )
  )("%s runs, and gives the values in its comments", async (_, snippet) => {
    await run(snippet);
  });

  it("skips only the blocks in SKIP_ALLOWED", () => {
    for (const snippet of ALL.filter((s) => s.mode === "skip")) {
      const first = snippet.code.split("\n")[0] ?? "";
      expect(SKIP_ALLOWED.has(first), `${snippet.page}:${snippet.line}`).toBe(
        true
      );
    }
  });

  it("type-checks every TypeScript sample", () => {
    const typed = ALL.filter((s) => s.mode === "run" && s.lang === "ts");
    expect(typed.length).toBeGreaterThan(50);
    expect(checkTypes(typed)).toBe("");
  }, 120_000);

  describe.each(LOCALES)("%s", (locale) => {
    it("has every page of the English site, and no other", () => {
      expect(existsSync(join(ROOT, DOCS, locale))).toBe(true);
      expect(pages(join(DOCS, locale)).sort()).toEqual(
        [...ENGLISH_PAGES].sort()
      );
    });

    it.each(ENGLISH_PAGES)(
      "%s has the same code samples as the English page",
      (page) => {
        const shape = (dir: string) =>
          extractSnippets(join(dir, page), page).map((s) => ({
            lang: s.lang,
            mode: s.mode,
            code: codeShape(s.code),
          }));
        expect(shape(join(DOCS, locale)), relative(ROOT, page)).toEqual(
          shape(DOCS)
        );
      }
    );
  });
});
