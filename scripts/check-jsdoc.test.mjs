// Tests of scripts/check-jsdoc.mjs: what it reads from a declaration file and
// what it reports, on small declaration files written for each case.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  anchorsOf,
  checkBuild,
  parseDoc,
  parseModule,
  problemsOf,
  resolveExport,
} from "./check-jsdoc.mjs";

const COMPLETE = `/**
 * Checks a thing.
 * @param value The value to check.
 * @param opts The options.
 * @returns true when it is a thing, false otherwise.
 * @example
 * isThing("a"); // true
 * @example
 * isThing("b"); // false
 * @see SPEC.md#cif-3
 * @since 2.0.0
 */
export declare function isThing(value: unknown, opts?: Options): boolean;`;

const anchors = (file) =>
  file === "SPEC.md" ? new Set(["cif-3", "norm-1"]) : null;

/** The problems of the one declaration named `name` in `source`. */
function problems(source, name = "isThing") {
  const [declaration] = parseModule(source).declarations.get(name);
  return problemsOf(declaration, name, anchors);
}

describe("reading declaration files", () => {
  it("finds the parameters, through generics, optionals and rest", () => {
    const module = parseModule(`
      export declare function a<T extends Record<string, X>>(first: T, second?: Map<string, number>, ...rest: string[]): void;
      export declare function b(): void;
      export declare function c(options: { x: number; y: string }, cb: (n: number) => void): void;
    `);
    expect(module.declarations.get("a")?.[0]?.params).toEqual([
      "first",
      "second",
      "rest",
    ]);
    expect(module.declarations.get("b")?.[0]?.params).toEqual([]);
    expect(module.declarations.get("c")?.[0]?.params).toEqual([
      "options",
      "cb",
    ]);
  });

  it("ends an interface at its closing brace, and a type at its semicolon", () => {
    const module = parseModule(`
      /** An interface. */
      export interface A { a: string; b: { c: number }; }
      /** A type. */
      export type B = { a: string } | "x;y";
      export declare const C: number;
    `);
    expect([...module.declarations.keys()]).toEqual(["A", "B", "C"]);
    expect(module.declarations.get("A")?.[0]?.doc).toBe("/** An interface. */");
    expect(module.declarations.get("B")?.[0]?.doc).toBe("/** A type. */");
    expect(module.declarations.get("C")?.[0]?.doc).toBeNull();
  });

  it("ignores braces and keywords inside strings and comments", () => {
    const module = parseModule(`
      // export declare function hidden(): void;
      /* export declare function hidden2(): void; */
      export declare const s: "}" | '{' | \`export\`;
      export declare function shown(): void;
    `);
    expect([...module.declarations.keys()]).toEqual(["s", "shown"]);
  });

  it("reads the exports: declared, renamed, re-exported, default and star", () => {
    const module = parseModule(`
      import { type T, u as v } from "./other.mjs";
      export declare const a: number;
      declare const b: number;
      export { b, b as c };
      export { d as e, type F } from "./more.mjs";
      export type { T };
      export * from "./star.mjs";
      export default a;
    `);
    expect([...module.exports.keys()].sort()).toEqual(
      ["a", "b", "c", "default", "e", "F", "T"].sort()
    );
    expect(module.exports.get("e")).toMatchObject({
      from: "./more.mjs",
      local: "d",
    });
    expect(module.stars).toEqual(["./star.mjs"]);
    expect(module.imports.get("v")).toEqual({
      from: "./other.mjs",
      original: "u",
    });
  });

  it("reads the summary and the tags of a comment", () => {
    const { summary, tags } = parseDoc(`/**
 * The summary,
 * on two lines.
 * @param a The first,
 * on two lines.
 * @example
 * f(1); // 2
 * @example
 * f(2); // 3
 */`);
    expect(summary).toBe("The summary,\non two lines.");
    expect(tags.map((t) => t.name)).toEqual(["param", "example", "example"]);
    expect(tags[0]?.text).toBe("a The first,\non two lines.");
    expect(tags[1]?.text).toBe("f(1); // 2");
  });

  it("finds the anchors of a Markdown file", () => {
    expect(
      anchorsOf('## Rules\n| <a id="cif-3"></a>CIF-3 |\n### Input cleanup (x)')
    ).toEqual(new Set(["cif-3", "rules", "input-cleanup-x"]));
  });
});

describe("what it reports", () => {
  it("accepts a function with all its documentation", () => {
    expect(problems(COMPLETE)).toEqual([]);
  });

  it("asks for a summary", () => {
    expect(problems("export declare function isThing(): boolean;")).toContain(
      "no summary"
    );
  });

  it.each([
    ["@param", / \* @param value The value to check.\n/, "no @param value"],
    ["@returns", / \* @returns .*\n/, "no @returns"],
    ["@see", / \* @see SPEC.md#cif-3\n/, "no @see"],
    ["@since", / \* @since 2.0.0\n/, "no @since (2.0.0)"],
  ])("asks for %s", (_, tag, message) => {
    expect(problems(COMPLETE.replace(tag, ""))).toContain(message);
  });

  it("asks for a description of the parameter and of the return value", () => {
    expect(
      problems(
        COMPLETE.replace("@param value The value to check.", "@param value")
      )
    ).toContain("@param value has no description");
    expect(
      problems(
        COMPLETE.replace("true when it is a thing, false otherwise.", "yes")
      )
    ).toContain("@returns should say when it returns what");
  });

  it("asks for a parameter that does not exist to be removed", () => {
    expect(
      problems(
        COMPLETE.replace(" * @returns", " * @param gone Nothing.\n * @returns")
      )
    ).toContain("@param gone: no such parameter");
  });

  it("asks for two different examples", () => {
    const one = COMPLETE.replace(
      / \* @example\n \* isThing\("b"\); \/\/ false\n/,
      ""
    );
    expect(problems(one)).toContain("1 @example, 2 needed");
    const same = COMPLETE.replace(
      'isThing("b"); // false',
      'isThing("a"); // true'
    );
    expect(problems(same)).toContain("two @example blocks are the same");
  });

  it("checks the @since against what v1 exported", () => {
    const source = COMPLETE.replace(/isThing/g, "isValidNif");
    expect(problems(source, "isValidNif")).toEqual([
      "@since 2.0.0, expected 1.0.0",
    ]);
  });

  it("checks that the SPEC.md anchor of a @see exists", () => {
    expect(
      problems(COMPLETE.replace("SPEC.md#cif-3", "SPEC.md#cif-9"))
    ).toContain("@see SPEC.md#cif-9: no such anchor");
    expect(problems(COMPLETE.replace("SPEC.md#cif-3", "NOPE.md"))).toContain(
      "@see NOPE.md: no such file"
    );
  });

  it("asks for the reason and the replacement of @deprecated", () => {
    expect(
      problems(COMPLETE.replace(" * @since", " * @deprecated\n * @since"))
    ).toContain("@deprecated without a reason and the replacement");
  });

  it("asks only for a summary and @since on a constant or a type", () => {
    expect(
      problems(
        `/**
 * A constant.
 * @since 2.0.0
 */
export declare const C: number;`,
        "C"
      )
    ).toEqual([]);
    expect(problems("export declare const C: number;", "C")).toEqual([
      "no summary",
      "no @since (2.0.0)",
    ]);
  });

  it("checks a constant typed typeof a function as the function", () => {
    const module = parseModule(`${COMPLETE}
/**
 * Alias.
 * @since 2.0.0
 */
export declare const isOther: typeof isThing;`);
    const [alias] = module.declarations.get("isOther");
    expect(problemsOf(alias, "isOther", anchors)).toEqual([
      "no @param value",
      "no @param opts",
      "no @returns",
      "0 @example, 2 needed",
      "no @see",
    ]);
  });
});

describe("re-exports under another name", () => {
  const modules = {
    "/m/index.d.mts": `export { isThing as isOther, isThing } from "./thing.d.mts";
export default isThing2;
import { isThing2 } from "./thing.d.mts";`,
    "/m/thing.d.mts": `${COMPLETE}
export declare function isThing2(): void;`,
  };
  const read = (file) => parseModule(modules[file]);
  const resolveFile = (_from, specifier) => `/m/${specifier.slice(2)}`;

  it("reports the alias, and accepts the name itself and a default export", () => {
    const aliased = resolveExport(
      "/m/index.d.mts",
      "isOther",
      read,
      resolveFile
    );
    expect(aliased.alias).toBe("isThing");
    const plain = resolveExport("/m/index.d.mts", "isThing", read, resolveFile);
    expect(plain.alias).toBeUndefined();
    expect(plain.declarations?.[0]?.name).toBe("isThing");
    const byDefault = resolveExport(
      "/m/index.d.mts",
      "default",
      read,
      resolveFile
    );
    expect(byDefault.alias).toBeUndefined();
    expect(byDefault.declarations?.[0]?.name).toBe("isThing2");
  });

  it("reports a name that does not exist", () => {
    expect(
      resolveExport("/m/index.d.mts", "nope", read, resolveFile).error
    ).toBe("not found");
  });
});

describe("a package on disk", () => {
  const root = mkdtempSync(join(tmpdir(), "check-jsdoc-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  function build(index, exported) {
    mkdirSync(join(root, "dist"), { recursive: true });
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({
        name: "pkg",
        exports: {
          ".": {
            import: {
              types: "./dist/index.d.mts",
              default: "./dist/index.mjs",
            },
            require: {
              types: "./dist/index.d.cts",
              default: "./dist/index.cjs",
            },
          },
        },
      })
    );
    writeFileSync(join(root, "dist", "index.d.mts"), index);
    return checkBuild(root, "import", anchors, () => exported);
  }

  it("counts the exports it checked", () => {
    const result = build(COMPLETE, ["isThing"]);
    expect(result).toEqual({ checked: 1, declarations: 1, problems: [] });
  });

  it("reports what lacks JSDoc, with its entry point and file", () => {
    const { problems: found } = build("export declare function bare(): void;", [
      "bare",
    ]);
    expect(found).toContain("pkg: bare: no summary  (dist/index.d.mts)");
    expect(found).toContain(
      "pkg: bare: 0 @example, 2 needed  (dist/index.d.mts)"
    );
  });

  it("reports an export that exists at run time but that it did not find", () => {
    const { problems: found } = build(COMPLETE, ["isThing", "hidden"]);
    expect(found).toEqual([
      "pkg: hidden: exported at run time, but not declared in the types  (dist/index.d.mts)",
    ]);
  });
});
