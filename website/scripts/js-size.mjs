#!/usr/bin/env node
// Reports the JavaScript of the landing page in every language, gzipped
// (level 9), and fails if the live validator costs more than its budget.
//
//   node scripts/js-size.mjs        after `pnpm build`
//
// The validator's cost is what a visitor downloads for it on page load: the
// page's entry script and every chunk it imports (the package's validate(),
// the page's locale and the validator's own code). The generators run in a
// worker that loads only when a "Random" button is pressed, so they are
// listed apart. The rest is Starlight's own JavaScript (search, theme picker,
// code copy buttons) and the small inline scripts of the page.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET = 5 * 1024; // bytes, gzipped (#64: "≤ 5 kB of JS")
const dist = new URL("../dist/", import.meta.url);
const base = "/nif-dni-nie-cif-validation/";
const pages = {
  en: "index.html",
  es: "es/index.html",
  ca: "ca/index.html",
  eu: "eu/index.html",
  gl: "gl/index.html",
};

const read = (path) => readFileSync(new URL(path, dist), "utf8");
const gz = (text) => gzipSync(text, { level: 9 }).length;
const sizeOf = (files) => [...files].reduce((sum, f) => sum + gz(read(f)), 0);
const resolve = (spec, from) =>
  new URL(spec, new URL(from, dist)).href.slice(dist.href.length);

/** A chunk and every chunk it imports statically. */
function closure(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const code = read(file);
  const imports = code.matchAll(
    /(?:^|[;\s}])import\s*(?:[^"'`()]*?from\s*)?["'](\.\/[^"']+)["']/g
  );
  for (const [, spec] of imports) closure(resolve(spec, file), seen);
  return seen;
}

/** Chunks a chunk loads later: import() and new URL(…) (workers). */
const lazyImports = (file) =>
  [
    ...read(file).matchAll(
      /(?:import\(|new URL\()\s*["'`]((?:\.\/|\/)[^"'`]+\.js)["'`]/g
    ),
  ].map(([, spec]) =>
    spec.startsWith(base) ? spec.slice(base.length) : resolve(spec, file)
  );

let failed = false;
for (const [lang, page] of Object.entries(pages)) {
  const html = read(page);
  const scripts = [
    ...html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"/g),
  ].map(([, src]) => src.slice(base.length));
  const inline = [
    ...html.matchAll(
      /<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g
    ),
  ].map(([, code]) => code);
  const entry = scripts.find((s) => s.includes("Validator.astro"));
  if (!entry) throw new Error(`${page}: no live validator script`);

  const validator = closure(entry);
  const lazy = new Set(
    [...validator].flatMap(lazyImports).flatMap((f) => [...closure(f)])
  );
  for (const f of validator) lazy.delete(f);
  const others = new Set(
    scripts.filter((s) => s !== entry).flatMap((s) => [...closure(s)])
  );
  for (const f of validator) others.delete(f);

  const bytes = sizeOf(validator);
  console.log(
    `${lang}  live validator on load: ${bytes} B in ${validator.size} files` +
      ` · generators, on demand: ${sizeOf(lazy)} B` +
      ` · Starlight modules: ${sizeOf(others)} B` +
      ` · inline scripts: ${inline.reduce((sum, code) => sum + gz(code), 0)} B`
  );
  if (bytes > BUDGET) {
    console.error(`    over the budget of ${BUDGET} B`);
    failed = true;
  }
}
if (failed) process.exit(1);
