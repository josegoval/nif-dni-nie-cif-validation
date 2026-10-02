// Bundle size of each library's equivalent import, measured like size-limit
// does (the @size-limit/esbuild and @size-limit/file plugins of this
// repository): one entry file that imports the function and uses it, bundled
// with esbuild (bundle, minify identifiers, syntax and whitespace, tree
// shaking), then gzipped at level 9. No dependency is left external.
//
// size-limit subtracts what an empty import costs (the wrapper that esbuild
// writes around the entry and the `console.log`): 34 B minified and 46 B
// gzipped (ESBUILD_EMPTY_PROJECT_IMPORT and ..._GZIP in @size-limit/esbuild).
// So do these figures, which makes the ones of this package equal to
// `pnpm size`.

import { gzipSync } from "node:zlib";
import { build } from "esbuild";
import { ROOT } from "./competitors.mjs";

const EMPTY_IMPORT_MIN_BYTES = 34;
const EMPTY_IMPORT_GZIP_BYTES = 46;

/** The import statement of a spec, as the report shows it. */
function statementOf(spec, from) {
  if (spec.named) return `import { ${spec.named} } from ${from};`;
  if (spec.default) return `import ${spec.default} from ${from};`;
  return `import * as lib from ${from};`;
}

/** The entry source that imports a bundle spec and uses it. */
export function entryOf(spec) {
  if (spec.code) return spec.code;
  const from = JSON.stringify(
    spec.from.startsWith("dist/") ? `${ROOT}${spec.from}` : spec.from
  );
  const name = spec.named ?? spec.default ?? "lib";
  return `${statementOf(spec, from)} console.log(${name});`;
}

/** What the report shows as the import. */
export function importOf(spec) {
  return spec.code ?? statementOf(spec, JSON.stringify(spec.from));
}

/** Minified and gzipped size in bytes of one bundle spec. */
export async function measureBundle(spec) {
  const result = await build({
    stdin: {
      contents: entryOf(spec),
      resolveDir: ROOT,
      loader: "js",
    },
    bundle: true,
    write: false,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    treeShaking: true,
    logLevel: "silent",
  });
  const code = result.outputFiles[0].contents;
  return {
    import: importOf(spec),
    minBytes: code.length - EMPTY_IMPORT_MIN_BYTES,
    gzipBytes: gzipSync(code, { level: 9 }).length - EMPTY_IMPORT_GZIP_BYTES,
  };
}

/**
 * Sizes of a list of contenders: one entry per call (DNI, NIE, CIF, any) and
 * the whole library (`full`). Equal specs are measured once.
 */
export async function measureContenders(contenders) {
  const cache = new Map();
  const measure = async (spec) => {
    const key = entryOf(spec);
    if (!cache.has(key)) cache.set(key, await measureBundle(spec));
    return cache.get(key);
  };
  const sizes = {};
  for (const contender of contenders) {
    const entry = {};
    for (const [key, spec] of Object.entries(contender.bundles)) {
      entry[key] = spec === null ? null : await measure(spec);
    }
    entry.alternatives = [];
    for (const { label, bundle } of contender.sizeAlternatives ?? []) {
      entry.alternatives.push({ label, ...(await measure(bundle)) });
    }
    sizes[contender.id] = entry;
  }
  return sizes;
}
