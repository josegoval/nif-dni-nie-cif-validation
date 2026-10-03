# Website

The website of `nif-dni-nie-cif-validation`, in English, Spanish, Catalan, Basque and Galician, built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build) and published on GitHub Pages at <https://josegoval.github.io/nif-dni-nie-cif-validation/>: a landing page with a live validator, the guides, the migration pages, the API reference, SPEC.md as the official sources page, and the benchmarks and comparison pages.

## Run it

```sh
# from the repository root: the library first (the site imports its build)
HUSKY=0 pnpm install --frozen-lockfile
pnpm build
pnpm test                       # optional: publishes the coverage report at /coverage/

# then the site, which is its own pnpm workspace
cd website
HUSKY=0 pnpm install --frozen-lockfile
pnpm dev                        # http://localhost:4321/nif-dni-nie-cif-validation/
```

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | Builds the site into `dist/`; fails on a broken link in a page's Markdown (starlight-links-validator) |
| `pnpm preview` | Serves `dist/` |
| `pnpm lint` | Biome (its own configuration, `biome.json`) |
| `pnpm typecheck` | `astro check`: the `.astro`, TypeScript and content files |
| `pnpm check:links` | After a build: every `href` and `src` of every built page resolves, anchors included |
| `pnpm check:source-links` | After a build: no link into `node_modules`, and every GitHub source link ("Defined in", SPEC.md, docs/) points at a file of the repository, at a line the file has |
| `pnpm check:size` | After a build: the JavaScript of the landing page, and the live validator's budget (5 kB gzipped) |
| `pnpm test:e2e` | After a build: Playwright, in Chromium (`pnpm exec playwright install chromium` once) |
| `pnpm check` | All of the above, in order |

The site uses TypeScript 6, not the library's TypeScript 7: `astro check` and TypeDoc (the API reference) need the TypeScript JavaScript API, which TypeScript 7 doesn't have.

The code samples of the pages are tested by the library's own suite, not here: `pnpm test` at the root runs `src/__tests__/website-examples.test.ts` (see [Pages and code samples](#pages-and-code-samples)).

## How it is put together

- **Its own workspace.** Like `examples/`, `website/` has its own `pnpm-workspace.yaml` and `pnpm-lock.yaml`, and the root workspace has no `packages`, so the root `pnpm install` never installs Astro. The same supply-chain policy as the root: `minimumReleaseAge: 4320` (3 days), and install scripts blocked (`allowBuilds`; esbuild's stays denied, and sharp needs none). The root Biome configuration ignores `website/` (this folder has its own), and the root `pnpm spell` checks the English files of the site.
- **The real library.** The site depends on the package with `"nif-dni-nie-cif-validation": "link:.."`: a symbolic link to the repository root, resolved through the root `package.json` `exports`, exactly as an application resolves the published package, into the `dist/` that `pnpm build` writes (the files npm publishes). Nothing is copied, so the live validator, the code samples and their results always match the current source; the build stops with a message when `dist/` is missing. The examples install the packed tarball instead, because they check the published files; here a `link:` keeps the lockfile stable and needs no packing step.
- **Languages.** English is the root locale (`/`), and Spanish, Catalan, Basque and Galician have the same files under `/es/`, `/ca/`, `/eu/` and `/gl/`. Each language has:
  - `src/content/docs/<code>/` (English: `src/content/docs/`): the pages, with their title, description and hero;
  - `src/i18n/<code>.ts`: the texts of the site's components, typed by `src/i18n/types.ts`, so a missing text is a type error;
  - `src/content/i18n/<code>.json`: Starlight's interface texts, where Starlight lacks them (Basque) or needs a fix (Catalan and Galician).

  The validator's messages, type names and organisation names are not translated here: they come from the package's own locale objects. Starlight emits the `hreflang` alternates (`x-default` is English) and the canonical URLs; `src/routeData.ts` adds the icons, the Open Graph image and the JSON-LD.
- **Numbers.** Every benchmark figure is read at build time from `bench/results/latest.json` (`src/data/bench.ts`), the rule count from `SPEC.md` (`src/data/spec.ts`), and the results in the code samples are computed by the package during the build (`src/data/snippets.ts`).
- **Brand.** `brand/` stays the single source: the theme imports `brand/tokens.css`, the logos are imported from `brand/`, and `src/pages/[file].ts` serves the favicons, the web manifest and `og-default.png` at the root of the site, with `llms.txt` and `llms-full.txt` from the repository root. The fonts are self-hosted from the `@fontsource` packages (SIL Open Font License), latin subset only.
- **Live validator.** `src/components/landing/validator.ts` is vanilla TypeScript. Each language has a small entry point that imports its own locale, and the generators run in a worker that starts on the first press of a "Random" button, so a page downloads only `validate()`, its own locale and the validator's code: about 3.6 kB gzipped in English and 4.7 kB in the other languages (`pnpm check:size`). Without JavaScript, the page shows a notice instead, and everything else works, the code tabs included (they are CSS only).
- **Coverage.** `integrations/repo-files.mjs` copies the HTML report that `pnpm test` writes to `coverage/html/` into `/coverage/`, and writes the badge from `coverage/coverage-summary.json` with `../scripts/coverage-badge.mjs`: `/coverage/badge.json`, in the shields.io endpoint schema, which the README's coverage badge reads, and `/coverage/badge.svg`, in the flat shields.io style. No coverage service is involved. With `SITE_REQUIRE_COVERAGE=1` (the deploy job) a missing report fails the build.

## Pages and code samples

- **Pages.** `src/content/docs/` has the guides (`guides/`), the migration pages (`migration/`), the API reference's introduction (`reference/api.mdx`), the benchmarks and the comparison, and each language folder has the same files. The sidebar (Guides, with Migrating; Reference; Project) is in `astro.config.mjs`; its pages are labelled with their titles, and its group labels are translated there.
- **Links.** Internal links in the pages include the base (`/nif-dni-nie-cif-validation/es/guides/faq/`), so both link checkers validate them, anchors included. A link to a rule goes to the official sources page of the page's language (`…/reference/official-sources/#cif-3`).
- **Tested code.** Every ```` ```ts ````, ```` ```tsx ```` and ```` ```js ```` block of the English pages runs in the root `pnpm test` (`src/__tests__/website-examples.test.ts`, with the helpers of the README tests): a statement followed by `// value` must give that value, and the TypeScript blocks are type-checked. A block after `{/* docs-test: v1 */}` runs against v1.0.11; one after `{/* docs-test: skip (reason) */}` is skipped, and only the React Hook Form component may be. The competitors' "before" code on the migration pages runs against the real libraries (dev dependencies of the benchmark). The other languages must have the same pages with the same code: only the prose of the comments may differ, and the values in them may not.
- **Data, not typed numbers.** The CIF keys table, the error codes table and the entry points table are built at build time from the package (its locale objects, `validate()`, `package.json`), and the build fails if an example stops giving its code and rule. The benchmark charts and tables come from `bench/results/latest.json` (`src/data/bench-details.ts`), and the comparison matrix from `bench/comparison.mjs`, which also writes the README's comparison table (`pnpm readme:bench`).
- **Charts.** A chart is a `<table>` with a bar drawn in CSS next to each value (`src/components/docs/BarChart.astro`): the table is its text alternative, the bars are `aria-hidden`, and there is no chart library and no JavaScript. Wide tables scroll inside a focusable region (`TableScroll.astro`); Markdown tables and code blocks wrap on a phone instead of scrolling.

## Generated pages

Two kinds of page are written at build time (and when the dev server starts) into `src/content/docs/`, and ignored by git (`.gitignore`); restart `pnpm dev` after changing their sources.

- **Official sources** (`plugins/official-sources.mjs`): `SPEC.md` itself, without its title and table of contents, after the translated introduction of `src/intros/official-sources/<code>.md`. The rules stay in English (marked `lang="en"`), the anchors are SPEC.md's own (`#cif-3`, and GitHub's heading slugs), the edit link opens SPEC.md, and "Last updated" is its "Last verified" date.
- **API reference** (`plugins/api-reference.mjs`): [starlight-typedoc](https://github.com/HiDeoo/starlight-typedoc) runs TypeDoc and typedoc-plugin-markdown on `../src`, with the library's compiler options (`typedoc/tsconfig.json`), one page per entry point of the `exports` map, each named after its import specifier (`typedoc/plugin.mjs`, which also drops the "Defined in" link of a member inherited from a dependency: its source is in `node_modules`, not in the repository). The post-processing step gives each page a description, points the SPEC.md links of the JSDoc at the official sources page, and replaces the generated sidebar group with one link per entry point.
  - **English only.** The reference's text is the JSDoc, so it is not translated. The other languages show the same pages under their own folder through Starlight's fallback: the sidebar and the page chrome are in the reader's language, the content is marked `lang="en"`, Starlight shows its "not translated yet" notice, and `src/routeData.ts` gives each fallback page a title and a description in its language. The introduction, `reference/api.mdx`, is translated.

## SEO

Every page has its own title and description per language (the Playwright tests check every page of the sitemap), Starlight writes the canonical URL and the `hreflang` alternates, and `@astrojs/sitemap` lists every page. `src/routeData.ts` adds JSON-LD (`src/jsonLd.ts`): `SoftwareSourceCode` on the landing pages, `TechArticle` on the guides and migration pages, and `FAQPage` on the FAQ, whose questions and answers are read from the page itself.

## Deploy

`.github/workflows/pages.yml` builds the site on every pull request that touches it or the library (lint, type check, build, link and size checks, end-to-end tests), and on a push to `master` (or by hand, **Actions → Pages → Run workflow**) it also runs the library's tests with coverage and deploys to GitHub Pages.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Moving to a custom domain

1. Add `website/public/CNAME` with the domain alone on its line (for example `nif.example.org`); Astro copies `public/` to the root of the site.
2. In `astro.config.mjs`, set `site` to `https://nif.example.org` and `base` to `"/"`.
3. In `scripts/check-links.mjs`, `scripts/js-size.mjs`, `playwright.config.ts`, the tests and the internal links of the pages (`src/content/docs/`, `src/intros/`), replace `/nif-dni-nie-cif-validation/` and the `josegoval.github.io` URLs.
4. Set the domain under **Settings → Pages → Custom domain**, add the DNS records GitHub shows, and turn on **Enforce HTTPS**.
5. Update `homepage` in the root `package.json`, and the links in the README and `llms.txt`.

At the root of a domain, `robots.txt` takes effect: crawlers read it only at the root of a host, so under `josegoval.github.io/nif-dni-nie-cif-validation/` it is published but not read.
