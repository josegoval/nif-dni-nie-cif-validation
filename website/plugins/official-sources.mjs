// A Starlight plugin that renders SPEC.md, the rules and their official
// sources, as the "Official sources" page of every language, at build time
// (and when the dev server starts), so the page can never drift from the file.
//
// Each language's page is written to
// src/content/docs/[<lang>/]reference/official-sources.md (ignored by git):
// the frontmatter and the translated introduction of
// src/intros/official-sources/<lang>.md, then the body of SPEC.md, which
// stays in English (marked `lang="en"` on the other languages' pages).
//
// The rule anchors are SPEC.md's own (`<a id="cif-3"></a>`), and the heading
// anchors are made with the same slugger as GitHub's, so `#cif-3` and
// `#source-tiers` work on the site exactly as they do on SPEC.md.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const site = fileURLToPath(new URL("../", import.meta.url));

export const OFFICIAL_SOURCES_SLUG = "reference/official-sources";
const EDIT_URL =
  "https://github.com/josegoval/nif-dni-nie-cif-validation/edit/master/SPEC.md";

/** SPEC.md without its title and its table of contents (Starlight has one). */
export function specBody(spec) {
  const lines = spec.replace(/\r\n/g, "\n").split("\n");
  if (!lines[0]?.startsWith("# ")) {
    throw new Error("SPEC.md must start with its title (# …)");
  }
  const out = [];
  let skipping = false;
  for (const line of lines.slice(1)) {
    if (line.startsWith("## ")) skipping = line === "## Contents";
    if (!skipping) out.push(line);
  }
  return out.join("\n").trim();
}

/** The "Last verified: YYYY-MM-DD" date of SPEC.md. */
export function lastVerified(spec) {
  const match = /^Last verified: (\d{4}-\d{2}-\d{2})$/m.exec(spec);
  if (!match) throw new Error('SPEC.md has no "Last verified: YYYY-MM-DD"');
  return match[1];
}

/** Splits a Markdown file into its frontmatter (without fences) and body. */
function splitFrontmatter(markdown, file) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(
    markdown.replace(/\r\n/g, "\n")
  );
  if (!match) throw new Error(`${file}: no frontmatter`);
  return { frontmatter: match[1], body: match[2].trim() };
}

/** The page of one language. */
export function officialSourcesPage(spec, intro, lang, file) {
  const { frontmatter, body } = splitFrontmatter(intro, file);
  const rules = specBody(spec);
  return [
    "---",
    `# Generated from SPEC.md and ${file} by plugins/official-sources.mjs.`,
    "# Do not edit: edit those files.",
    frontmatter,
    `editUrl: ${EDIT_URL}`,
    `lastUpdated: ${lastVerified(spec)}`,
    "---",
    "",
    body,
    "",
    // The rules stay in English: say so to browsers and screen readers.
    lang === "en" ? rules : `<div lang="en">\n\n${rules}\n\n</div>`,
    "",
  ].join("\n");
}

/** @returns {import("@astrojs/starlight/types").StarlightPlugin} */
export function officialSources() {
  return {
    name: "official-sources",
    hooks: {
      "config:setup"({ config, logger }) {
        const spec = readFileSync(join(repo, "SPEC.md"), "utf8");
        const locales = config.locales ?? { root: { lang: "en" } };
        for (const [key, locale] of Object.entries(locales)) {
          const lang = locale.lang ?? key;
          const file = `src/intros/official-sources/${lang}.md`;
          const intro = readFileSync(join(site, file), "utf8");
          const folder = key === "root" ? "" : `${key}/`;
          const target = join(
            site,
            `src/content/docs/${folder}${OFFICIAL_SOURCES_SLUG}.md`
          );
          mkdirSync(dirname(target), { recursive: true });
          writeFileSync(target, officialSourcesPage(spec, intro, lang, file));
        }
        logger.info(
          `Rendered SPEC.md as /${OFFICIAL_SOURCES_SLUG}/ in ${Object.keys(locales).length} languages`
        );
      },
    },
  };
}
