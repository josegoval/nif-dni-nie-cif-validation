#!/usr/bin/env node
// Checks that every public export has the JSDoc an IDE or an agent needs to
// use it (#55). No dependencies, so it runs with plain Node:
// `pnpm docs:jsdoc` (after `pnpm build`).
//
// What people and agents read is the `.d.mts` / `.d.cts` of the package, so
// that is what is checked: every export of every entry point in the
// `exports` map of package.json, in the ES module and the CommonJS types.
// (TypeScript 7 has no JavaScript compiler API to ask, and Biome has no JSDoc
// rules, so this script reads the declarations itself: see `parseModule`.)
//
// Every export needs:
// - a summary: the text before the first tag;
// - `@since` with a version: 1.0.0 for what v1.0.0 exported, 2.0.0 for the
//   rest.
//
// A function, and a constant typed `typeof` a function (an alias of it, see
// below), also needs:
// - `@param` with a description, for every parameter;
// - `@returns` with a description of when it returns what;
// - two `@example` blocks, different from each other
//   (src/__tests__/jsdoc-examples.test.ts runs them);
// - at least one `@see`, and every `@see` of a file of this repository is a
//   `{@link <URL on GitHub> label}` (a plain `SPEC.md#cif-3` is not a link in
//   an editor) whose file and anchor exist;
// - a description after `@deprecated`, when it has one.
//
// The `@see` rule applies to every export: the anchor of a SPEC.md link
// must exist.
//
// A re-export under another name (`export { isValidLegalEntityNif as
// isValidCif }`) is an error: it would show the docs of the original, whose
// examples call the other name and never say that the alias exists. Declare
// the alias as a constant with its own JSDoc. (`export default es` is fine:
// an editor shows the docs of `es` for it, and it is the same name.)
//
// Finally every export found at run time must be one the script found in the
// declarations, so the reader can't silently skip an export.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** What v1.0.0 exported (src/index.ts of the v1.0.0 tag): `@since 1.0.0`. */
export const V1_EXPORTS = new Set([
  "isValidNif",
  "isValidNaturalPersonNif",
  "isValidDniLetter",
  "DNI_CONTROL_LETTERS",
  "isValidDni",
  "DNI_REGEX",
  "isValidNie",
  "NIE_REGEX",
  "replaceNieLetter",
  "isValidLegalEntityNifControlCode",
  "isValidCifControlCode",
  "isValidLegalEntityNif",
  "isValidCif",
  "LEGAL_ENTITY_CONTROL_LETTERS",
  "CIF_CONTROL_LETTERS",
  "LEGAL_ENTITY_NIF_REGEX",
  "CIF_REGEX",
]);

// --- Tokenizer -------------------------------------------------------------

/**
 * Splits a declaration file into tokens, dropping white space and comments
 * except JSDoc. Strings and template literals are one token each, so braces
 * inside them can't confuse the reader. `=>` is one token, so it is never
 * mistaken for the `>` that closes a type argument list.
 *
 * @returns {{ type: "doc" | "word" | "string" | "symbol", text: string }[]}
 */
export function tokenize(source) {
  const tokens = [];
  const n = source.length;
  let i = 0;
  while (i < n) {
    const c = source[i];
    if (/\s/.test(c)) {
      i++;
    } else if (source.startsWith("/*", i)) {
      const end = source.indexOf("*/", i + 2);
      const stop = end < 0 ? n : end + 2;
      if (source.startsWith("/**", i) && !source.startsWith("/**/", i))
        tokens.push({ type: "doc", text: source.slice(i, stop) });
      i = stop;
    } else if (source.startsWith("//", i)) {
      while (i < n && source[i] !== "\n") i++;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < n && source[j] !== c) j += source[j] === "\\" ? 2 : 1;
      tokens.push({ type: "string", text: source.slice(i, j + 1) });
      i = j + 1;
    } else if (/[\w$]/.test(c)) {
      let j = i + 1;
      while (j < n && /[\w$]/.test(source[j])) j++;
      tokens.push({ type: "word", text: source.slice(i, j) });
      i = j;
    } else if (source.startsWith("=>", i)) {
      tokens.push({ type: "symbol", text: "=>" });
      i += 2;
    } else {
      tokens.push({ type: "symbol", text: c });
      i++;
    }
  }
  return tokens;
}

// --- JSDoc -----------------------------------------------------------------

/**
 * The parts of a JSDoc comment.
 *
 * @returns {{ summary: string, tags: { name: string, text: string }[] }}
 */
export function parseDoc(comment) {
  const lines = comment
    .slice(3, -2)
    .split("\n")
    .map((line) => line.replace(/^\s*\* ?/, ""));
  const summary = [];
  const tags = [];
  for (const line of lines) {
    const tag = /^@(\w+)\b ?(.*)$/.exec(line);
    if (tag) tags.push({ name: tag[1], text: tag[2] });
    else if (tags.length > 0) tags[tags.length - 1].text += `\n${line}`;
    else summary.push(line);
  }
  for (const tag of tags) tag.text = tag.text.trim();
  return { summary: summary.join("\n").trim(), tags };
}

// --- Declarations ----------------------------------------------------------

const BLOCK_KEYWORDS = new Set(["interface", "class", "enum", "namespace"]);
const MODIFIERS = new Set(["export", "declare", "abstract", "default"]);

/** Does the statement declare something with a `{ ... }` body and no `;`? */
function endsWithBlock(tokens) {
  const keyword = tokens.find((t) => !MODIFIERS.has(t.text));
  return keyword !== undefined && BLOCK_KEYWORDS.has(keyword.text);
}

/** Splits the tokens into statements, each with the JSDoc right before it. */
function statements(tokens) {
  const result = [];
  let doc = null;
  let current = null;
  let depth = 0;
  for (const token of tokens) {
    if (token.type === "doc") {
      if (current === null) doc = token.text;
      continue;
    }
    if (current === null) {
      current = { doc, tokens: [] };
      doc = null;
    }
    current.tokens.push(token);
    if (token.type !== "symbol") continue;
    if ("{([".includes(token.text)) depth++;
    else if ("})]".includes(token.text)) {
      depth--;
      if (depth === 0 && token.text === "}" && endsWithBlock(current.tokens)) {
        result.push(current);
        current = null;
      }
    } else if (token.text === ";" && depth === 0) {
      result.push(current);
      current = null;
    }
  }
  if (current) result.push(current);
  return result;
}

/** Skips a `<...>` type parameter list starting at `i`; returns the index after it. */
function skipAngles(tokens, i) {
  if (tokens[i]?.text !== "<") return i;
  let depth = 0;
  for (; i < tokens.length; i++) {
    if (tokens[i].text === "<") depth++;
    else if (tokens[i].text === ">" && --depth === 0) return i + 1;
  }
  return i;
}

/** The parameter names of the function whose name is at `tokens[i]`. */
function parameters(tokens, i) {
  i = skipAngles(tokens, i + 1);
  if (tokens[i]?.text !== "(") return [];
  const params = [];
  let segment = [];
  let depth = 0;
  for (i++; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "symbol") {
      if ("([{<".includes(t.text)) depth++;
      else if (")]}>".includes(t.text)) {
        if (depth === 0) break;
        depth--;
      } else if (t.text === "," && depth === 0) {
        params.push(segment);
        segment = [];
        continue;
      }
    }
    segment.push(t);
  }
  if (segment.length > 0) params.push(segment);
  return params.map((tokensOfParam) => {
    const first = tokensOfParam.find((t) => t.text !== ".");
    return first?.type === "word" ? first.text : null;
  });
}

/**
 * Reads one declaration file: its declarations (exported or not), with their
 * JSDoc and, for functions, their parameters, and what it exports.
 *
 * @returns {{
 *   declarations: Map<string, { kind: string, name: string, doc: string | null, params: (string | null)[] }[]>,
 *   exports: Map<string, { from?: string, local?: string, declared?: boolean, doc?: string | null }>,
 *   imports: Map<string, { from: string, original: string }>,
 *   stars: string[],
 * }}
 */
export function parseModule(source) {
  const declarations = new Map();
  const exports = new Map();
  const imports = new Map();
  const stars = [];
  const declare = (declaration) => {
    const list = declarations.get(declaration.name) ?? [];
    list.push(declaration);
    declarations.set(declaration.name, list);
  };
  for (const { doc, tokens } of statements(tokenize(source))) {
    let i = 0;
    if (tokens[0].text === "import") {
      // import { a, type b as c } from "./x": `a` and `c` are declared there.
      const from = tokens.find((t) => t.type === "string");
      const open = tokens.findIndex((t) => t.text === "{");
      if (from && open >= 0) {
        for (let j = open + 1; tokens[j] && tokens[j].text !== "}"; j++) {
          if (tokens[j].type !== "word" || tokens[j].text === "type") continue;
          const renamed = tokens[j + 1]?.text === "as";
          imports.set(renamed ? tokens[j + 2].text : tokens[j].text, {
            from: from.text.slice(1, -1),
            original: tokens[j].text,
          });
          if (renamed) j += 2;
        }
      }
      continue;
    }
    const isExport = tokens[0].text === "export";
    if (isExport) i++;
    if (isExport && tokens[i]?.text === "default") {
      const target = tokens[i + 1];
      if (
        target?.type === "word" &&
        !["function", "class", "abstract", "interface"].includes(target.text)
      )
        exports.set("default", { local: target.text, doc });
      continue;
    }
    if (
      isExport &&
      (tokens[i]?.text === "{" ||
        (tokens[i]?.text === "type" && tokens[i + 1]?.text === "{"))
    ) {
      if (tokens[i].text === "type") i++;
      const names = [];
      for (i++; tokens[i] && tokens[i].text !== "}"; i++) {
        if (tokens[i].type !== "word") continue;
        // `export { type A }`: the modifier is not a name.
        if (
          tokens[i].text === "type" &&
          tokens[i + 1]?.type === "word" &&
          tokens[i + 1].text !== "as"
        )
          continue;
        if (tokens[i + 1]?.text === "as") {
          names.push([tokens[i].text, tokens[i + 2].text]);
          i += 2;
        } else names.push([tokens[i].text, tokens[i].text]);
      }
      const from =
        tokens[i + 1]?.text === "from"
          ? tokens[i + 2].text.slice(1, -1)
          : undefined;
      for (const [local, name] of names)
        exports.set(
          name,
          from === undefined ? { local, doc } : { from, local, doc }
        );
      continue;
    }
    if (isExport && tokens[i]?.text === "*") {
      if (tokens[i + 1]?.text === "from")
        stars.push(tokens[i + 2].text.slice(1, -1));
      continue;
    }
    while (["declare", "abstract", "async"].includes(tokens[i]?.text)) i++;
    const keyword = tokens[i]?.text;
    const name = tokens[i + 1];
    if (
      [
        "function",
        "const",
        "let",
        "var",
        "class",
        "interface",
        "type",
        "enum",
        "namespace",
      ].includes(keyword) &&
      name?.type === "word"
    ) {
      const kind =
        keyword === "function"
          ? "function"
          : ["const", "let", "var"].includes(keyword)
            ? "const"
            : keyword;
      // `const a: typeof b`: the declaration of an alias of `b`.
      const aliasOf =
        kind === "const" &&
        tokens[i + 2]?.text === ":" &&
        tokens[i + 3]?.text === "typeof"
          ? tokens[i + 4]?.text
          : undefined;
      declare({
        kind,
        name: name.text,
        doc,
        aliasOf,
        params: kind === "function" ? parameters(tokens, i + 1) : [],
      });
      if (isExport) exports.set(name.text, { declared: true });
    }
  }
  // An alias of a function is checked as the function it stands for.
  for (const list of declarations.values())
    for (const declaration of list) {
      const target = declarations
        .get(declaration.aliasOf)
        ?.find((d) => d.kind === "function");
      if (target) {
        declaration.kind = "function";
        declaration.params = target.params;
      }
    }
  return { declarations, exports, imports, stars };
}

// --- The checks ------------------------------------------------------------

/** GitHub's anchor of a Markdown heading. */
const slug = (heading) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");

/** The anchors of a Markdown file: `<a id="...">` and its headings. */
export function anchorsOf(markdown) {
  const anchors = new Set();
  for (const m of markdown.matchAll(/<a id="([^"]+)">/g)) anchors.add(m[1]);
  for (const m of markdown.matchAll(/^#{1,6} +(.+)$/gm))
    anchors.add(slug(m[1]));
  return anchors;
}

const words = (text) => text.split(/\s+/).filter(Boolean).length;

/**
 * The problems of one export's JSDoc. `declaration` is what the name
 * resolves to; `exportName` is how it is exported; `anchors(file)` returns
 * the anchors of a Markdown file, or `null` when it doesn't exist;
 * `blobBase` is the URL that a file of the repository is linked with.
 */
export function problemsOf(declaration, exportName, anchors, blobBase) {
  const problems = [];
  const { summary, tags } = declaration.doc
    ? parseDoc(declaration.doc)
    : { summary: "", tags: [] };
  const all = (name) => tags.filter((t) => t.name === name);
  if (!declaration.doc || summary === "") problems.push("no summary");

  const since = all("since");
  const expected = V1_EXPORTS.has(exportName) ? "1.0.0" : "2.0.0";
  if (since.length === 0) problems.push(`no @since (${expected})`);
  else if (since[0].text.split(/\s/)[0] !== expected)
    problems.push(`@since ${since[0].text}, expected ${expected}`);

  for (const tag of all("deprecated"))
    if (words(tag.text) < 3)
      problems.push("@deprecated without a reason and the replacement");

  for (const tag of all("see")) {
    // `@see SPEC.md#cif-3` is not a link in an editor (it reads `#` as a
    // member separator and shows "SPEC.md.cif-3"): a file of this repository
    // is linked as `{@link <url of the file on GitHub> label}`.
    const link = /^\{@link\s+(\S+)/.exec(tag.text);
    if (!link) {
      if (/\.md\b/.test(tag.text))
        problems.push(
          `@see ${tag.text.split("\n")[0]}: link a Markdown file as {@link ${blobBase}<file>#<anchor> <label>}`
        );
      continue;
    }
    if (!link[1].startsWith(blobBase)) continue; // another site
    const [file, anchor] = link[1].slice(blobBase.length).split("#");
    const found = anchors(file);
    if (found === null) problems.push(`@see ${file}: no such file`);
    else if (anchor && !found.has(anchor))
      problems.push(`@see ${file}#${anchor}: no such anchor`);
  }

  if (declaration.kind !== "function") return problems;

  declaration.params.forEach((name, index) => {
    if (name === null) {
      problems.push(`parameter ${index + 1} has no name to document`);
      return;
    }
    if (name === "this") return;
    const tag = all("param").find(
      (t) => t.text.split(/\s+/)[0].replace(/^\[|\]$/g, "") === name
    );
    if (!tag) problems.push(`no @param ${name}`);
    else if (words(tag.text.replace(/^\S+\s*-?\s*/, "")) === 0)
      problems.push(`@param ${name} has no description`);
  });
  for (const tag of all("param")) {
    const name = tag.text.split(/\s+/)[0].replace(/^\[|\]$/g, "");
    if (!declaration.params.includes(name) && !name.includes("."))
      problems.push(`@param ${name}: no such parameter`);
  }

  const returns = [...all("returns"), ...all("return")];
  if (returns.length === 0) problems.push("no @returns");
  else if (words(returns[0].text) < 3)
    problems.push("@returns should say when it returns what");

  const examples = all("example")
    .map((t) => t.text)
    .filter((t) => t !== "");
  if (examples.length < 2)
    problems.push(`${examples.length} @example, 2 needed`);
  else if (new Set(examples).size < examples.length)
    problems.push("two @example blocks are the same");

  if (all("see").length === 0) problems.push("no @see");
  return problems;
}

/**
 * Resolves an export of a module to the declarations it stands for.
 * `read(file)` gives the parsed module of a file (by path), `resolveFile`
 * turns a relative specifier into a path.
 *
 * @returns {{ declarations?: object[], alias?: string, error?: string }}
 */
export function resolveExport(file, name, read, resolveFile, seen = new Set()) {
  const key = `${file}#${name}`;
  if (seen.has(key)) return { error: "circular re-export" };
  seen.add(key);
  const module = read(file);
  const entry = module.exports.get(name);
  if (entry?.declared) return { declarations: module.declarations.get(name) };
  if (entry) {
    // `export default es` is the same thing as `es`: editors show the docs
    // of `es` on hover, so it needs none of its own.
    const renamed =
      entry.local !== name && name !== "default" ? entry.local : undefined;
    if (entry.from === undefined) {
      const local = module.declarations.get(entry.local);
      if (local)
        return { declarations: local, alias: renamed, name: entry.local };
      // Declared in another module and imported here.
      const imported = module.imports.get(entry.local);
      if (!imported) return { error: `${entry.local} is not declared here` };
      const target = resolveExport(
        resolveFile(file, imported.from),
        imported.original,
        read,
        resolveFile,
        seen
      );
      return renamed && !target.error ? { ...target, alias: renamed } : target;
    }
    const target = resolveExport(
      resolveFile(file, entry.from),
      entry.local,
      read,
      resolveFile,
      seen
    );
    return renamed && !target.error ? { ...target, alias: renamed } : target;
  }
  for (const from of module.stars) {
    const target = resolveExport(
      resolveFile(file, from),
      name,
      read,
      resolveFile,
      seen
    );
    if (!target.error) return target;
  }
  return { error: "not found" };
}

/** Every name a module exports, following `export *`. */
export function exportNames(file, read, resolveFile) {
  const module = read(file);
  const names = new Set(module.exports.keys());
  for (const from of module.stars)
    for (const name of exportNames(resolveFile(file, from), read, resolveFile))
      if (name !== "default") names.add(name);
  return names;
}

// --- Running it on the package ---------------------------------------------

/** The URL prefix of a file of the repository on GitHub, from package.json. */
export function blobBaseOf(pkg) {
  const url = pkg.repository?.url ?? "https://github.com/owner/repo";
  return `${url.replace(/^git\+/, "").replace(/\.git$/, "")}/blob/master/`;
}

/**
 * Checks the entry points of one build (`types` is the condition of each
 * `exports` entry: `import` for ES modules, `require` for CommonJS).
 * @returns {{ checked: number, declarations: number, problems: string[] }}
 */
export function checkBuild(root, condition, anchorsFor, runtimeExports) {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const blobBase = blobBaseOf(pkg);
  const cache = new Map();
  const read = (file) => {
    if (!cache.has(file))
      cache.set(file, parseModule(readFileSync(file, "utf8")));
    return cache.get(file);
  };
  // `./x.mjs` points at `./x.d.mts`, `./x.cjs` at `./x.d.cts`.
  const resolveFile = (from, specifier) =>
    resolve(dirname(from), specifier.replace(/\.([cm])js$/, ".d.$1ts"));
  const problems = [];
  const seenDeclarations = new Set();
  let checked = 0;
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    if (typeof target === "string") continue;
    const entry = join(root, target[condition].types);
    const label = subpath === "." ? pkg.name : `${pkg.name}${subpath.slice(1)}`;
    const names = exportNames(entry, read, resolveFile);
    const fail = (name, message) =>
      problems.push(
        `${label}: ${name}: ${message}  (${relative(root, entry)})`
      );
    // Every export that exists at run time was found in the declarations.
    for (const name of runtimeExports(subpath, condition) ?? []) {
      if (!names.has(name))
        fail(name, "exported at run time, but not declared in the types");
    }
    for (const name of [...names].sort()) {
      checked++;
      const resolved = resolveExport(entry, name, read, resolveFile);
      if (resolved.error) {
        fail(name, resolved.error);
        continue;
      }
      if (resolved.alias) {
        fail(
          name,
          `re-exports ${resolved.alias} under another name; declare ${name} with its own JSDoc`
        );
        continue;
      }
      for (const declaration of resolved.declarations) {
        seenDeclarations.add(declaration);
        for (const problem of problemsOf(
          declaration,
          resolved.name ?? name,
          anchorsFor,
          blobBase
        ))
          fail(name, problem);
      }
    }
  }
  return { checked, declarations: seenDeclarations.size, problems };
}

async function main() {
  const specAnchors = new Map();
  const anchorsFor = (file) => {
    const path = join(ROOT, file);
    if (!existsSync(path)) return null;
    if (!specAnchors.has(file))
      specAnchors.set(file, anchorsOf(readFileSync(path, "utf8")));
    return specAnchors.get(file);
  };
  if (!existsSync(join(ROOT, "dist"))) {
    console.error("docs:jsdoc: dist/ is missing. Run `pnpm build` first.");
    process.exit(1);
  }
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  // What each entry point really exports, from the ES module build.
  const runtime = new Map();
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    if (typeof target === "string") continue;
    const module = await import(
      pathToFileURL(join(ROOT, target.import.default)).href
    );
    runtime.set(subpath, Object.keys(module));
  }
  const runtimeExports = (subpath) => runtime.get(subpath);
  let failed = false;
  for (const [condition, build] of [
    ["import", "ES module"],
    ["require", "CommonJS"],
  ]) {
    const { checked, declarations, problems } = checkBuild(
      ROOT,
      condition,
      anchorsFor,
      runtimeExports
    );
    for (const problem of problems) console.error(`  ${problem}`);
    console.log(
      `docs:jsdoc (${build} types): ${checked} exports checked, ${declarations} declarations, ${problems.length} problems`
    );
    if (problems.length > 0) failed = true;
  }
  if (failed) {
    console.error(
      '\nEvery export needs JSDoc with a summary, @since and, for a function, @param, @returns, two @example and a @see (CONTRIBUTING.md, "JSDoc").'
    );
    process.exit(1);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
