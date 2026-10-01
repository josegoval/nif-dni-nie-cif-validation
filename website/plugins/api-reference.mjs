// The API reference, generated from the JSDoc of the library's sources by
// TypeDoc (starlight-typedoc and typedoc-plugin-markdown), at build time and
// when the dev server starts. One page per entry point of the package's
// `exports` map, written to src/content/docs/reference/api/ (ignored by git).
//
// The reference is in English only: its text is the JSDoc. The other
// languages show the same pages through Starlight's fallback, under their
// own sidebar and with Starlight's "not translated yet" notice; their
// introduction (src/content/docs/<lang>/reference/api.mdx) is translated,
// and src/routeData.ts gives each fallback page a title and a description in
// its language.
//
// TypeDoc needs the TypeScript JavaScript API: this workspace has
// TypeScript 6 for it (the library's TypeScript 7 has none).
import {
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const site = fileURLToPath(new URL("../", import.meta.url));

const PACKAGE = "nif-dni-nie-cif-validation";
export const API_OUTPUT = "reference/api";
const SPEC_ON_GITHUB = `https://github.com/josegoval/${PACKAGE}/blob/master/SPEC.md`;

export { typeDocSidebarGroup };

/** The source file of every entry point of the package, from `exports`. */
export function entryPoints() {
  const pkg = JSON.parse(readFileSync(join(repo, "package.json"), "utf8"));
  return Object.entries(pkg.exports)
    .filter(([, value]) => typeof value === "object")
    .map(([key, value]) => ({
      specifier: key === "." ? PACKAGE : `${PACKAGE}${key.slice(1)}`,
      source: value.import.default
        .replace("./dist/esm/", "../src/")
        .replace(/\.mjs$/, ".ts"),
    }));
}

const LANGUAGES = {
  en: "English",
  es: "Spanish",
  ca: "Catalan (also for Valencian)",
  eu: "Basque",
  gl: "Galician",
};

/** The description of an entry point's page (English, like the reference). */
export function describeEntryPoint(specifier) {
  const sub = specifier.slice(PACKAGE.length + 1);
  if (sub === "")
    return `API reference of ${PACKAGE}: isValidNif, validate, normalize, format, getNifType and every other export of the main entry point, with signatures, options and tested examples.`;
  if (sub.startsWith("locales/")) {
    const code = sub.slice("locales/".length);
    return `API reference of ${specifier}: the ${LANGUAGES[code] ?? code} locale object for validate() and describeCifOrganisation(), with the error messages and the CIF organisation names.`;
  }
  if (sub === "generate")
    return `API reference of ${specifier}: seeded generators of valid and invalid DNI, K/L/M, NIE, CIF and NIF numbers for tests, with their options and examples.`;
  const library = { zod: "Zod 4", valibot: "Valibot 1", yup: "Yup 1" }[sub];
  if (library)
    return `API reference of ${specifier}: ${library} schemas for Spanish NIF, DNI, NIE, CIF and VAT numbers that output the normalized value and the localized message.`;
  throw new Error(`No description for the entry point ${specifier}`);
}

/** Every Markdown file under a folder. */
const markdownFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return markdownFiles(path);
    return path.endsWith(".md") ? [path] : [];
  });

/**
 * After TypeDoc: drops its index page (each language has its own
 * introduction at /reference/api/ instead), gives every page a description,
 * and points the links to SPEC.md at the site's official sources page.
 */
function postProcess(outputDir, officialSourcesPath) {
  rmSync(join(outputDir, "README.md"), { force: true });
  for (const file of markdownFiles(outputDir)) {
    const markdown = readFileSync(file, "utf8");
    const title = /^title: "(.*)"$/m.exec(markdown)?.[1];
    if (!title) throw new Error(`${file}: no title`);
    const out = markdown
      .replace(
        /^title: .*$/m,
        (line) =>
          `${line}\ndescription: ${JSON.stringify(describeEntryPoint(title))}`
      )
      .replaceAll(`${SPEC_ON_GITHUB}#`, `${officialSourcesPath}#`)
      .replaceAll(SPEC_ON_GITHUB, officialSourcesPath);
    writeFileSync(file, out);
  }
}

/**
 * @param {{ label: string, translations: Record<string, string> }} group
 *   The label of the reference's sidebar group, and its translations.
 * @returns {import("@astrojs/starlight/types").StarlightPlugin[]}
 */
export function apiReference(group) {
  return [
    starlightTypeDoc({
      entryPoints: entryPoints().map((entry) => entry.source),
      tsconfig: "./typedoc/tsconfig.json",
      output: API_OUTPUT,
      sidebar: { label: group.label, collapsed: false },
      typeDoc: {
        plugin: ["./typedoc/plugin.mjs"],
        // One page per entry point, with every export on it.
        outputFileStrategy: "modules",
        // "Defined in" links to the source on GitHub.
        disableGit: true,
        sourceLinkTemplate: `https://github.com/josegoval/${PACKAGE}/blob/master/src/{path}#L{line}`,
        basePath: "../src",
        sort: ["kind", "alphabetical"],
        // The functions first: they are what most readers look for.
        groupOrder: [
          "Functions",
          "Variables",
          "Interfaces",
          "Type Aliases",
          "*",
        ],
      },
    }),
    {
      name: "api-reference-post-process",
      hooks: {
        "config:setup"({ astroConfig, config, updateConfig }) {
          const base = astroConfig.base.replace(/\/?$/, "/");
          postProcess(
            join(site, "src/content/docs", API_OUTPUT),
            `${base}reference/official-sources/`
          );
          // starlight-typedoc's sidebar group, with one page per entry
          // point, has empty sub-groups and an untranslated label: replace
          // it with one link per entry point (`slug` links follow the
          // reader's language) and the translated label.
          const entries = entryPoints().map(({ specifier }) => ({
            slug: `${API_OUTPUT}/${specifier}`,
            label:
              specifier === PACKAGE ? PACKAGE : specifier.slice(PACKAGE.length),
          }));
          const replace = (items) =>
            items.map((item) => {
              if (typeof item !== "object" || !("items" in item)) return item;
              if (item.label === group.label) {
                return { ...group, collapsed: false, items: entries };
              }
              return { ...item, items: replace(item.items) };
            });
          updateConfig({ sidebar: replace(config.sidebar ?? []) });
        },
      },
    },
  ];
}
