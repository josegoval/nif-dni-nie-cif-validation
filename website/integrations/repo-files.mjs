// An Astro integration for the files the site takes from the rest of the
// repository at build time:
//
// - It checks that the library is built (`../dist`), because the site imports
//   the real package through `link:..` and its `exports` point to `dist/`.
// - After the build, it publishes the test coverage report: the HTML report
//   that `pnpm test` writes to `../coverage/html` goes to `/coverage/`, and
//   the badge, `/coverage/badge.json` (for shields.io, which draws the
//   README's badge) and `/coverage/badge.svg`, is made from
//   `../coverage/coverage-summary.json` by `../scripts/coverage-badge.mjs`.
//   No third-party service is involved. With `SITE_REQUIRE_COVERAGE=1` (the
//   deploy job of pages.yml) a missing report fails the build; otherwise it
//   is skipped with a notice.
//
// The brand files and llms.txt are served by src/pages/[file].ts instead.
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  coverageBadge,
  coverageBadgeJson,
  coveragePercent,
} from "../../scripts/coverage-badge.mjs";

const repo = new URL("../../", import.meta.url);

/** @returns {import("astro").AstroIntegration} */
export function repoFiles() {
  return {
    name: "repo-files",
    hooks: {
      "astro:config:setup": ({ updateConfig }) => {
        if (!existsSync(new URL("dist/esm/index.mjs", repo))) {
          throw new Error(
            "The library is not built: run `pnpm build` at the repository root first (see website/README.md)."
          );
        }
        // Where the repository is, for the pages that read its files. Pages
        // are bundled before they run, so they can't use import.meta.url.
        updateConfig({
          vite: {
            define: {
              "import.meta.env.REPO_ROOT": JSON.stringify(fileURLToPath(repo)),
            },
          },
        });
      },
      "astro:build:done": ({ dir, logger }) => {
        const report = new URL("coverage/html/", repo);
        const summary = new URL("coverage/coverage-summary.json", repo);
        if (!existsSync(report) || !existsSync(summary)) {
          const message =
            "No coverage report in ../coverage: run `pnpm test` at the repository root to publish it at /coverage/.";
          if (process.env.SITE_REQUIRE_COVERAGE === "1")
            throw new Error(message);
          logger.warn(message);
          return;
        }
        const target = new URL("coverage/", dir);
        cpSync(fileURLToPath(report), fileURLToPath(target), {
          recursive: true,
        });
        const totals = JSON.parse(readFileSync(summary, "utf8")).total;
        const percent = coveragePercent(totals);
        writeFileSync(new URL("badge.svg", target), coverageBadge(percent));
        writeFileSync(
          new URL("badge.json", target),
          coverageBadgeJson(percent)
        );
        logger.info(
          `Published the coverage report (${percent}%) at /coverage/`
        );
      },
    },
  };
}
