// Checks the badges of README.md and README.es.md, which `pnpm readme:bench`
// writes (scripts/readme-bench.mjs), the way GitHub and npm will show them:
//
// - no Markdown badge (`[![`) inside an HTML block or on a line next to one:
//   GitHub doesn't parse Markdown there and shows it as raw text;
// - every badge is a shields.io image with `style=flat`, alt text and a link,
//   and an in-page link goes to a heading of the same README;
// - the badges form one paragraph, a single row;
// - both READMEs show the same images, with the same alt text, in the same
//   order; their links may differ only where both are heading anchors (the
//   headings are translated);
// - the alt text of the coverage and license badges, which can't show the
//   live value, matches vitest.config.mts and package.json.
//
// The rules are checked on the Markdown itself, not on the generator, so a
// README edited by hand is caught too.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import vitestConfig from "../vitest.config.mts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (file) => readFileSync(join(ROOT, file), "utf8");

/** An image that is a badge: shields.io, a `badge.svg` or a `badges/` file. */
const isBadge = (src) =>
  /^https:\/\/img\.shields\.io\/|badge\.svg|\/badges?\//.test(src);

const decode = (value) =>
  value
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");

const attribute = (tag, name) => {
  const match = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return match ? decode(match[1]) : undefined;
};

/**
 * The lines outside fenced code blocks, with the line number (1-based) and
 * whether each one is in an HTML block (CommonMark, simplified: a line that
 * starts with a tag or a comment opens one; a comment's ends with `-->`,
 * the others' at a blank line).
 */
function scan(markdown) {
  const lines = [];
  let fence = null;
  let html = null;
  markdown.split("\n").forEach((text, index) => {
    const line = index + 1;
    const opener = /^ {0,3}(`{3,}|~{3,})/.exec(text);
    if (fence) {
      if (
        opener &&
        opener[1][0] === fence[0] &&
        opener[1].length >= fence.length
      ) {
        fence = null;
      }
      return;
    }
    if (opener) {
      fence = opener[1];
      html = null;
      return;
    }
    if (html === "block" && text.trim() === "") html = null;
    let inHtml = html !== null;
    if (!html && /^ {0,3}<[a-zA-Z/!]/.test(text)) {
      inHtml = true;
      html = /^ {0,3}<!--/.test(text) ? "comment" : "block";
    }
    lines.push({ line, text, html: inHtml });
    if (html === "comment" && text.includes("-->")) html = null;
  });
  return lines;
}

/** GitHub's anchor for a heading. */
const slug = (heading) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");

/** Every badge of a README, in order, with what is wrong with each. */
function readBadges(markdown) {
  const lines = scan(markdown);
  const problems = [];
  const badges = [];

  lines.forEach(({ line, text, html }, i) => {
    if (!text.includes("[![")) return;
    if (html) {
      problems.push(`line ${line}: Markdown badge inside an HTML block`);
      return;
    }
    const near = [lines[i - 1], lines[i + 1]].filter(
      (other) =>
        other &&
        Math.abs(other.line - line) === 1 &&
        other.text.trim() !== "" &&
        other.html
    );
    if (near.length) {
      problems.push(`line ${line}: Markdown badge next to an HTML block`);
    }
  });

  const anchors = new Set(
    lines
      .map(({ text }) => /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(text)?.[1])
      .filter(Boolean)
      .map(slug)
  );

  for (const { line, text } of lines) {
    const found = [];
    // HTML images, with the link around them if there is one.
    for (const match of text.matchAll(
      /(?:<a\s[^>]*>\s*)?<img\s[^>]*>(?:\s*<\/a>)?/g
    )) {
      const img = /<img\s[^>]*>/.exec(match[0])[0];
      const link = /^<a\s[^>]*>/.exec(match[0])?.[0];
      found.push({
        index: match.index,
        src: attribute(img, "src") ?? "",
        alt: attribute(img, "alt"),
        href: link ? attribute(link, "href") : undefined,
      });
    }
    // Markdown images, linked or not.
    for (const match of text.matchAll(
      /(\[)?!\[([^\]]*)\]\(([^)\s]+)\)(?:\]\(([^)\s]+)\))?/g
    )) {
      found.push({
        index: match.index,
        src: match[3],
        alt: match[2],
        href: match[1] ? match[4] : undefined,
      });
    }
    found.sort((a, b) => a.index - b.index);
    for (const { src, alt, href } of found) {
      if (!isBadge(src)) continue;
      const name = `line ${line}: badge ${src}`;
      if (!alt?.trim()) problems.push(`${name} has no alt text`);
      if (!href?.trim()) problems.push(`${name} has no link`);
      else if (href.startsWith("#") && !anchors.has(href.slice(1))) {
        problems.push(`${name} links to ${href}, which is not a heading`);
      }
      if (!src.startsWith("https://img.shields.io/")) {
        problems.push(`${name} is not drawn by shields.io`);
      } else if (new URL(src).searchParams.get("style") !== "flat") {
        problems.push(`${name} lacks style=flat`);
      }
      badges.push({ line, src, alt, href });
    }
  }

  if (badges.length) {
    const first = badges[0].line;
    const last = badges.at(-1).line;
    const between = lines.filter((l) => l.line >= first && l.line <= last);
    if (
      between.some(({ text }) => text.trim() === "") ||
      between.length !== last - first + 1
    ) {
      problems.push(
        `lines ${first}-${last}: the badges are not one paragraph (one row)`
      );
    }
  }
  return { badges, problems };
}

/** What differs between the badges of two READMEs. */
function compareBadges(a, b) {
  const problems = [];
  const count = Math.max(a.length, b.length);
  for (let i = 0; i < count; i++) {
    const [x, y] = [a[i], b[i]];
    if (!x || !y) {
      problems.push(`badge ${i + 1} is missing from one README`);
      continue;
    }
    if (x.src !== y.src) {
      problems.push(`badge ${i + 1}: different images, ${x.src} / ${y.src}`);
    }
    if (x.alt !== y.alt) {
      problems.push(`badge ${i + 1}: different alt text, ${x.alt} / ${y.alt}`);
    }
    const anchors = x.href?.startsWith("#") && y.href?.startsWith("#");
    if (x.href !== y.href && !anchors) {
      problems.push(`badge ${i + 1}: different links, ${x.href} / ${y.href}`);
    }
  }
  return problems;
}

describe("the README badges", () => {
  const en = readBadges(read("README.md"));
  const es = readBadges(read("README.es.md"));

  it.each([
    ["README.md", en],
    ["README.es.md", es],
  ])("%s: valid HTML badges, flat, with alt text and links", (_, readme) => {
    expect(readme.problems).toEqual([]);
    expect(readme.badges.length).toBeGreaterThanOrEqual(5);
  });

  it("are the same in README.md and README.es.md", () => {
    expect(compareBadges(en.badges, es.badges)).toEqual([]);
  });

  it("state the coverage threshold and the license that the repository has", () => {
    const pkg = JSON.parse(read("package.json"));
    const thresholds = Object.values(vitestConfig.test.coverage.thresholds);
    for (const { alt } of en.badges) {
      const coverage = /^coverage: (\d+(?:\.\d+)?)%/.exec(alt)?.[1];
      if (coverage) {
        expect(thresholds).toEqual(thresholds.map(() => Number(coverage)));
      }
      const license = /^license: (.+)$/.exec(alt)?.[1];
      if (license) expect(license).toBe(pkg.license);
    }
    expect(en.badges.some(({ alt }) => alt.startsWith("coverage: "))).toBe(
      true
    );
    expect(en.badges.some(({ alt }) => alt.startsWith("license: "))).toBe(true);
  });
});

describe("the badge check", () => {
  const flat = (path) => `https://img.shields.io/${path}?style=flat`;
  const html = (...badges) =>
    [
      "<p>",
      ...badges.map(
        ([alt, src, href]) =>
          `  <a href="${href}"><img alt="${alt}" src="${src}"></a>`
      ),
      "</p>",
    ].join("\n");
  const doc = (badges) => `# Title\n\n${badges}\n\n## Performance\n\nText.\n`;

  it("accepts a paragraph of HTML badges", () => {
    const { badges, problems } = readBadges(
      doc(
        html(
          ["npm version", flat("npm/v/x"), "https://www.npmjs.com/package/x"],
          ["size", flat("badge/a-b-blue"), "#performance"]
        )
      )
    );
    expect(problems).toEqual([]);
    expect(badges.map(({ alt }) => alt)).toEqual(["npm version", "size"]);
  });

  it("accepts Markdown badges on their own, away from HTML", () => {
    const markdown = doc(
      `[![npm version](${flat("npm/v/x")})](https://www.npmjs.com/package/x)\n[![size](${flat("badge/a-b-blue")})](#performance)`
    );
    expect(readBadges(markdown).problems).toEqual([]);
  });

  it("rejects the badges of 2.0.0: a Markdown badge after a comment marker", () => {
    const markdown = doc(
      [
        "[![npm version](https://img.shields.io/npm/v/x)](https://www.npmjs.com/package/x)",
        "<!-- size-badge:start -->[![isValidNif: 929 B min+gzip](https://img.shields.io/badge/min%2Bgzip-isValidNif%20929%20B-blue)](#performance)<!-- size-badge:end -->",
        "[![CI](https://github.com/o/r/actions/workflows/release.yml/badge.svg?branch=master)](https://github.com/o/r/actions)",
      ].join("\n")
    );
    expect(readBadges(markdown).problems).toEqual([
      "line 3: Markdown badge next to an HTML block",
      "line 4: Markdown badge inside an HTML block",
      "line 5: Markdown badge next to an HTML block",
      "line 3: badge https://img.shields.io/npm/v/x lacks style=flat",
      "line 4: badge https://img.shields.io/badge/min%2Bgzip-isValidNif%20929%20B-blue lacks style=flat",
      "line 5: badge https://github.com/o/r/actions/workflows/release.yml/badge.svg?branch=master is not drawn by shields.io",
    ]);
  });

  it("rejects a Markdown badge inside an HTML paragraph", () => {
    const markdown = doc(
      `<p>\n[![npm version](${flat("npm/v/x")})](https://www.npmjs.com/package/x)\n</p>`
    );
    expect(readBadges(markdown).problems).toContain(
      "line 4: Markdown badge inside an HTML block"
    );
  });

  it("rejects a badge without alt text, link or flat style", () => {
    const markdown = doc(
      [
        "<p>",
        `  <img alt="unlinked" src="${flat("npm/v/x")}">`,
        `  <a href="https://example.com"><img src="${flat("npm/l/x")}"></a>`,
        '  <a href="#nowhere"><img alt="size" src="https://img.shields.io/badge/a-b-blue?style=for-the-badge"></a>',
        "</p>",
      ].join("\n")
    );
    expect(readBadges(markdown).problems).toEqual([
      `line 4: badge ${flat("npm/v/x")} has no link`,
      `line 5: badge ${flat("npm/l/x")} has no alt text`,
      "line 6: badge https://img.shields.io/badge/a-b-blue?style=for-the-badge links to #nowhere, which is not a heading",
      "line 6: badge https://img.shields.io/badge/a-b-blue?style=for-the-badge lacks style=flat",
    ]);
  });

  it("rejects badges split into two rows", () => {
    const markdown = doc(
      `${html(["a", flat("npm/v/x"), "https://a"])}\n\n${html(["b", flat("npm/l/x"), "https://b"])}`
    );
    expect(readBadges(markdown).problems).toEqual([
      "lines 4-8: the badges are not one paragraph (one row)",
    ]);
  });

  it("ignores code blocks", () => {
    const markdown = doc(
      "```md\n<p>\n[![x](https://img.shields.io/x)](#y)\n```"
    );
    expect(readBadges(markdown)).toEqual({ badges: [], problems: [] });
  });

  it("compares two READMEs: images, alt text, order and links", () => {
    const a = { src: flat("npm/v/x"), alt: "npm version", href: "https://a" };
    const b = { src: flat("npm/l/x"), alt: "license: MIT", href: "LICENSE" };
    const size = { src: flat("badge/s"), alt: "size", href: "#performance" };
    expect(
      compareBadges(
        [a, size, b],
        [a, { ...size, href: "#translated-heading" }, b]
      )
    ).toEqual([]);
    expect(compareBadges([a, b], [b, a])).toHaveLength(6);
    expect(
      compareBadges([a, b], [a, { ...b, alt: "translated license: MIT" }])
    ).toEqual([
      "badge 2: different alt text, license: MIT / translated license: MIT",
    ]);
    expect(compareBadges([a, b], [a, { ...b, href: "https://b" }])).toEqual([
      "badge 2: different links, LICENSE / https://b",
    ]);
    expect(compareBadges([a, b], [a])).toEqual([
      "badge 2 is missing from one README",
    ]);
  });
});
