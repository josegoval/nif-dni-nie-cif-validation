// An Astro integration for the files the site takes from the rest of the
// repository at build time:
//
// - It checks that the library is built (`../dist`), because the site imports
//   the real package through `link:..` and its `exports` point to `dist/`.
//
// The brand files and llms.txt are served by src/pages/[file].ts instead.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

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
    },
  };
}
