/**
 * Runs every `@example` of the JSDoc in src/ (#55), so the examples an IDE or
 * an agent shows on hover can't go stale.
 *
 * - Every `@example` block of every JSDoc comment in src/ (not the tests) is
 *   extracted and run against src/, as a module of its own. Nothing is
 *   skipped: an example that can't run is a wrong example.
 * - The comments are the assertions, exactly as in the README samples (see
 *   snippets.ts): `isValidNif("12345678Z"); // true` must evaluate to `true`,
 *   and `// throws RangeError` must throw one. Every example must make at
 *   least one assertion.
 * - An example may use the names the package exports without importing
 *   them, as the JSDoc of a function is read next to its own import. It must
 *   import the locales (`import { es } from ".../locales/es"`) and anything
 *   that isn't this package (`import { z } from "zod"`) itself.
 * - Every example is also type-checked with tsc, with the strict options of
 *   this repository.
 *
 * The generated files go in .cache/jsdoc-examples/ (in .gitignore).
 */
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  addChecks,
  ENTRY_POINTS,
  PACKAGE,
  ROOT,
  runSnippet,
  typeCheck,
  useSources,
} from "./snippets";

const OUT = join(ROOT, ".cache", "jsdoc-examples");

interface Example {
  /** The src/ file, for example `src/nif.ts`. */
  file: string;
  /** 1-based line of the `@example` tag. */
  line: number;
  code: string;
}

/** Every file under `dir`, in subdirectories too, except the tests. */
function sourceFiles(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap(
    (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory())
        return entry.name === "__tests__" ? [] : sourceFiles(path);
      return entry.name.endsWith(".ts") ? [path] : [];
    }
  );
}

/** The `@example` blocks of the JSDoc comments of one file. */
function extractExamples(file: string): Example[] {
  const text = readFileSync(join(ROOT, file), "utf8");
  const examples: Example[] = [];
  for (const comment of text.matchAll(/\/\*\*[\s\S]*?\*\//g)) {
    const first = text.slice(0, comment.index).split("\n").length;
    const lines = comment[0]
      .slice(3, -2)
      .split("\n")
      .map((line) => line.replace(/^\s*\* ?/, ""));
    for (let i = 0; i < lines.length; i++) {
      if (!/^@example\b/.test(lines[i] as string)) continue;
      const body: string[] = [];
      for (i++; i < lines.length && !/^@\w+/.test(lines[i] as string); i++) {
        body.push(lines[i] as string);
      }
      i--; // the next tag belongs to the outer loop
      examples.push({
        file,
        line: first + i - body.length,
        code: body.join("\n").trim(),
      });
    }
  }
  return examples;
}

/** The names that an entry point of src/ exports, from its source. */
function exportedNames(source: string): string[] {
  const text = readFileSync(join(ROOT, source), "utf8");
  const names = new Set<string>();
  for (const match of text.matchAll(
    /^export (?:declare )?(?:async )?(?:function|const|let|class|interface|type|enum) (\w+)/gm
  )) {
    names.add(match[1] as string);
  }
  for (const match of text.matchAll(/^export (?:type )?\{([^}]*)\}/gm)) {
    for (const item of (match[1] as string).split(",")) {
      const name = item
        .trim()
        .split(/\s+as\s+/)
        .pop();
      if (name) names.add(name);
    }
  }
  names.delete("default");
  return [...names];
}

interface Import {
  specifier: string;
  isValue: boolean;
}

/**
 * Every name of every entry point that an example may use without importing
 * it: not the locales (`es`, `en`, ...), which every example imports itself.
 */
async function importable(): Promise<Map<string, Import>> {
  const map = new Map<string, Import>();
  for (const [specifier, source] of ENTRY_POINTS) {
    if (specifier.includes("/locales/")) continue;
    const module = (await import(join(ROOT, source))) as object;
    const values = new Set(Object.keys(module));
    for (const name of exportedNames(source)) {
      const known = map.get(name);
      // `NifSchema` and the like are types of every adapter: an example of
      // one of them imports the one it means.
      if (known && !known.isValue) continue;
      map.set(name, { specifier, isValue: values.has(name) });
    }
  }
  return map;
}

let loaded: Promise<Map<string, Import>> | undefined;
/** Computed on first use, because it imports the entry points. */
const imports = () => {
  loaded ??= importable();
  return loaded;
};

/**
 * The imports an example needs and doesn't have: the exports of the package
 * it uses, unless it imports or declares the name itself. `resolve` turns
 * the specifier of the package into what the importer can load.
 */
function implicitImports(
  code: string,
  known: Map<string, Import>,
  resolve: (specifier: string) => string
): string {
  const own = new Set<string>();
  for (const match of code.matchAll(
    /^import\s+(?:type\s+)?([^;]*?)\s+from\b/gm
  )) {
    for (const name of (match[1] as string).matchAll(/\w+/g)) own.add(name[0]);
  }
  for (const match of code.matchAll(
    /\b(?:const|let|var|function|class|type|interface|enum)\s+(\w+)/g
  )) {
    own.add(match[1] as string);
  }
  const values = new Map<string, string[]>();
  const types = new Map<string, string[]>();
  for (const [name, { specifier, isValue }] of known) {
    if (own.has(name) || !new RegExp(`\\b${name}\\b`).test(code)) continue;
    const group = isValue ? values : types;
    group.set(specifier, [...(group.get(specifier) ?? []), name]);
  }
  const lines: string[] = [];
  for (const [specifier, names] of values)
    lines.push(`import { ${names.join(", ")} } from "${resolve(specifier)}";`);
  for (const [specifier, names] of types)
    lines.push(
      `import type { ${names.join(", ")} } from "${resolve(specifier)}";`
    );
  return lines.join("\n");
}

const EXAMPLES = sourceFiles("src").flatMap(extractExamples);

const name = (example: Example, index: number) =>
  `${example.file.replace(/\W/g, "_")}_${example.line}_${index}.ts`;
const where = (example: Example) => `${example.file}:${example.line}`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "run"), { recursive: true });
mkdirSync(join(OUT, "types"), { recursive: true });

/** The specifier of the package or a subpath, as a path to its src/ file. */
const toSource = (specifier: string) => {
  const source = ENTRY_POINTS.get(specifier);
  return source ? join(ROOT, source) : specifier;
};

describe("@example blocks of the JSDoc", () => {
  it("finds the examples", () => {
    expect(EXAMPLES.length).toBeGreaterThan(100);
  });

  it.each(
    EXAMPLES.map((example, index) => [where(example), example, index] as const)
  )(
    "%s runs, and gives the values in its comments",
    async (_, example, index) => {
      const code = useSources(example.code, where(example));
      const transformed = addChecks(code, where(example));
      const prelude = implicitImports(code, await imports(), toSource);
      const checks = await runSnippet(
        join(OUT, "run", name(example, index)),
        {
          code: `${prelude}\nexport {};\n${transformed.code}`,
          checks: transformed.checks,
        },
        where(example)
      );
      expect(
        checks,
        `${where(example)}: an example asserts something`
      ).toBeGreaterThan(0);
    }
  );

  it("type-checks every example", async () => {
    const known = await imports();
    const dir = join(OUT, "types");
    const files = EXAMPLES.map((example, index) => {
      const file = join(dir, name(example, index));
      const prelude = implicitImports(example.code, known, (s) => s);
      writeFileSync(file, `${prelude}\nexport {};\n${example.code}\n`);
      return file;
    });
    expect(typeCheck(dir, files)).toBe("");
  }, 60_000);

  it("imports only the package and other libraries, never a path", () => {
    for (const example of EXAMPLES) {
      for (const match of example.code.matchAll(/from "([^"]+)"/g)) {
        const specifier = match[1] as string;
        expect(
          specifier.startsWith("."),
          `${where(example)}: ${specifier}`
        ).toBe(false);
        if (specifier.startsWith(PACKAGE))
          expect(
            ENTRY_POINTS.has(specifier),
            `${where(example)}: ${specifier}`
          ).toBe(true);
      }
    }
  });
});
