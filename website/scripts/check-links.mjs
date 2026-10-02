#!/usr/bin/env node
// Fails if a page of the built site links to a page, file or anchor of the
// site that doesn't exist. starlight-links-validator checks the links that
// pages write in Markdown; this checks every href and src of every built
// HTML page, so it also covers the links of components (hero, footer,
// language picker, landing page sections) and the head (icons, manifest).
//
//   node scripts/check-links.mjs        after `pnpm build`
//
// Links into /coverage/ are only checked when the build published the
// coverage report (pages.yml's deploy job does; a PR build does not).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const base = "/nif-dni-nie-cif-validation/";
const site = "https://josegoval.github.io";
const hasCoverage = existsSync(join(dist, "coverage", "index.html"));

/** Every file under a folder, recursively. */
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const pages = walk(dist).filter(
  (file) =>
    file.endsWith(".html") &&
    !relative(dist, file).startsWith("coverage") &&
    !relative(dist, file).startsWith("pagefind")
);

const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) {
    const html = readFileSync(file, "utf8");
    ids.set(
      file,
      new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
    );
  }
  return ids.get(file);
};

/** The file a site path is served from, or null. */
function target(pathname) {
  const path = decodeURIComponent(pathname.slice(base.length));
  const candidates =
    path === "" || path.endsWith("/")
      ? [join(path, "index.html")]
      : [path, join(path, "index.html")];
  for (const candidate of candidates) {
    const file = join(dist, candidate);
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return null;
}

const problems = [];
let checked = 0;
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const pageUrl = new URL(
    `${base}${relative(dist, page).replace(/index\.html$/, "")}`,
    site
  );
  for (const [, attr, value] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    const raw = value.replaceAll("&amp;", "&");
    if (/^(mailto:|tel:|data:|javascript:)/.test(raw)) continue;
    const url = new URL(raw, pageUrl);
    if (url.origin !== site) continue;
    if (!url.pathname.startsWith(base)) {
      problems.push(
        `${relative(dist, page)}: ${attr}="${value}" is outside ${base}`
      );
      continue;
    }
    if (!hasCoverage && url.pathname.startsWith(`${base}coverage/`)) continue;
    // Starlight gives 404.html a canonical URL and hreflang alternates of
    // /404/, which GitHub Pages serves (as 404.html) for any missing path.
    if (/\/404\/$/.test(url.pathname)) continue;
    checked++;
    const file = target(url.pathname);
    if (!file) {
      problems.push(`${relative(dist, page)}: ${attr}="${value}" not found`);
    } else if (
      url.hash &&
      file.endsWith(".html") &&
      !idsOf(file).has(decodeURIComponent(url.hash.slice(1)))
    ) {
      problems.push(
        `${relative(dist, page)}: ${attr}="${value}" has no #${url.hash.slice(1)}`
      );
    }
  }
}

if (problems.length > 0) {
  console.error(
    `Broken internal links (${problems.length}):\n${problems.map((p) => `  ${p}`).join("\n")}`
  );
  process.exit(1);
}
console.log(
  `Checked ${checked} internal links on ${pages.length} pages: all resolve.` +
    (hasCoverage ? "" : " (/coverage/ not built: its links were skipped)")
);
