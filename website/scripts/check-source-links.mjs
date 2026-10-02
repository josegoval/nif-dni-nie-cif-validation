#!/usr/bin/env node
// Fails if a built page links into node_modules, or if a link to a file of
// this repository on GitHub (the API reference's "Defined in" source links,
// the links to SPEC.md, docs/ and bench/) points at a path that does not
// exist in the repository checkout, or at a line past the end of the file.
// Checked on the filesystem, with no network. check-links.mjs covers the
// links inside the site.
//
//   node scripts/check-source-links.mjs        after `pnpm build`
//
// A "Defined in" link to a dependency's declaration (Valibot's `BaseIssue`,
// inherited by our types) once pointed into node_modules, which is not in the
// repository: GitHub answered 404. typedoc/plugin.mjs drops those links.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const repo = fileURLToPath(new URL("../../", import.meta.url));
const REPO_URL = "https://github.com/josegoval/nif-dni-nie-cif-validation/";
const BLOB = `${REPO_URL}blob/master/`;

/** Every HTML file under a folder, recursively. */
const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      // The search index and the coverage report are not the site's pages.
      return ["pagefind", "coverage"].includes(relative(dist, path))
        ? []
        : htmlFiles(path);
    }
    return path.endsWith(".html") ? [path] : [];
  });

const lineCounts = new Map();
/** The number of lines of a file of the repository (cached). */
const linesOf = (file) => {
  if (!lineCounts.has(file)) {
    lineCounts.set(file, readFileSync(file, "utf8").split("\n").length);
  }
  return lineCounts.get(file);
};

const problems = [];
let nodeModules = 0;
let sourceLinks = 0;
const pages = htmlFiles(dist);
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  for (const [, , value] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    const raw = value.replaceAll("&amp;", "&");
    const where = relative(dist, page);
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      // not percent-encoded text: check it as it is
    }
    if (/node_modules/.test(raw) || /node_modules/.test(decoded)) {
      nodeModules++;
      problems.push(`${where}: links into node_modules: ${raw}`);
      continue;
    }
    if (!raw.startsWith(BLOB)) continue;
    sourceLinks++;
    const [path, hash = ""] = raw.slice(BLOB.length).split("#");
    const file = join(repo, decodeURIComponent(path));
    if (
      path.split("/").includes("..") ||
      !existsSync(file) ||
      !statSync(file).isFile()
    ) {
      problems.push(`${where}: ${raw} is not a file of the repository`);
      continue;
    }
    const line = /^L(\d+)(?:-L(\d+))?$/.exec(hash);
    const last = line ? Number(line[2] ?? line[1]) : 0;
    if (last > linesOf(file)) {
      problems.push(
        `${where}: ${raw} points past the end of the file (${linesOf(file)} lines)`
      );
    }
  }
}

if (problems.length > 0) {
  console.error(
    `Bad source links (${problems.length}, ${nodeModules} into node_modules):\n${problems.map((p) => `  ${p}`).join("\n")}`
  );
  process.exit(1);
}
console.log(
  `Checked ${sourceLinks} GitHub source links on ${pages.length} pages: none into node_modules, all point at files of the repository.`
);
