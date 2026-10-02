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
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  addChecks,
  ENTRY_POINTS,
  ROOT,
  read,
  requireToImport,
  runSnippet,
  typeCheck,
  useSources,
} from "./snippets";

const OUT = join(ROOT, ".cache", "readme-examples");
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

const fileName = (snippet: Snippet, extension: string) =>
  `${snippet.doc.replace(/\W/g, "_")}_${snippet.line}.${extension}`;

async function run(snippet: Snippet): Promise<number> {
  const where = `${snippet.doc}:${snippet.line}`;
  let code = useSources(snippet.code, where);
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
    expect(checkTypes(typed)).toBe("");
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
