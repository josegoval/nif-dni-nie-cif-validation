// The documentation pages: they render in every language, the language
// picker keeps the reader on the same page, every page is in the sitemap
// with a title and a description of its own, the JSON-LD of the guides and
// the FAQ, the generated pages (SPEC.md and the API reference), and the
// benchmark charts read from bench/results/latest.json.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

// cspell:ignore Validar formularios Revisado

const LANGS = ["en", "es", "ca", "eu", "gl"] as const;
const LABELS = {
  en: "English",
  es: "Español",
  ca: "Català",
  eu: "Euskara",
  gl: "Galego",
} as const;
const prefix = (lang: string) => (lang === "en" ? "" : `${lang}/`);
const SITE = "https://josegoval.github.io/nif-dni-nie-cif-validation/";
const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const latest = JSON.parse(
  readFileSync(
    new URL("../../bench/results/latest.json", import.meta.url),
    "utf8"
  )
) as { contenders: unknown[] };

/** A few pages of each section, as smoke tests in every language. */
const PAGES = [
  "guides/getting-started/",
  "guides/faq/",
  "migration/from-v1/",
  "reference/api/",
  "reference/official-sources/",
  "benchmarks/",
  "comparison/",
];

for (const lang of LANGS) {
  test(`${lang}: the documentation pages render in their language`, async ({
    page,
  }) => {
    for (const path of PAGES) {
      const response = await page.goto(`${prefix(lang)}${path}`);
      expect(response?.status(), path).toBe(200);
      await expect(page.locator("html"), path).toHaveAttribute("lang", lang);
      await expect(page.getByRole("heading", { level: 1 }), path).toBeVisible();
      // No page falls back to English, except the body of SPEC.md, which
      // is marked as English on the official sources page.
      const english = page.locator("main [lang='en']");
      if (path === "reference/official-sources/" && lang !== "en") {
        await expect(english.first(), path).toBeAttached();
      } else {
        await expect(english, path).toHaveCount(0);
      }
    }
  });

  test(`${lang}: the language picker keeps the page`, async ({ page }) => {
    const other = lang === "en" ? "es" : "en";
    await page.goto(`${prefix(lang)}guides/document-types/`);
    await page
      .locator("starlight-lang-select select")
      .first()
      .selectOption({ label: LABELS[other] });
    await expect(page).toHaveURL(
      new RegExp(
        `/nif-dni-nie-cif-validation/${prefix(other)}guides/document-types/$`
      )
    );
    await expect(page.locator("html")).toHaveAttribute("lang", other);
  });
}

test("the API reference is English under every language, with a translated title", async ({
  page,
}) => {
  const titles = new Set<string>();
  for (const lang of LANGS) {
    await page.goto(
      `${prefix(lang)}reference/api/nif-dni-nie-cif-validation/zod/`
    );
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.getByRole("heading", { name: "zNif()" })).toBeVisible();
    // The sidebar is the reader's language; the content is English.
    if (lang !== "en") {
      await expect(page.locator("main[lang='en']")).toBeAttached();
    }
    titles.add(await page.title());
  }
  expect(titles.size).toBe(LANGS.length);
});

test("the official sources page has SPEC.md's rule anchors", async ({
  page,
}) => {
  await page.goto("reference/official-sources/#cif-3");
  for (const id of ["nif-1", "dni-2", "nie-3", "cif-3", "cif-4", "policy-1"]) {
    await expect(page.locator(`[id="${id}"]`)).toBeAttached();
  }
  await expect(
    page.getByRole("heading", { name: "Source tiers" })
  ).toBeVisible();
});

test("the guides link their rules to the official sources page", async ({
  page,
}) => {
  await page.goto("es/guides/control-character/");
  const link = page.locator('a[href$="/es/reference/official-sources/#cif-3"]');
  await expect(link.first()).toBeVisible();
  await link.first().click();
  await expect(page).toHaveURL(/\/es\/reference\/official-sources\/#cif-3$/);
});

test("guides have TechArticle JSON-LD, and the FAQ a FAQPage", async ({
  page,
}) => {
  const jsonLd = async () =>
    JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "{}"
    );
  await page.goto("gl/guides/validating-forms/");
  const article = await jsonLd();
  expect(article["@type"]).toBe("TechArticle");
  expect(article.inLanguage).toBe("gl");
  expect(article.headline).toBe("Validar formularios");
  await page.goto("guides/faq/");
  const faq = await jsonLd();
  expect(faq["@type"]).toBe("FAQPage");
  expect(faq.mainEntity.length).toBeGreaterThanOrEqual(8);
  expect(faq.mainEntity[0].name).toBe("Is 00000000T a valid DNI?");
  expect(faq.mainEntity[0].acceptedAnswer.text).toMatch(/^Yes\./);
});

/** Every page of the built site, as its URL. */
const builtPages = (dir = dist): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return ["coverage", "pagefind", "_astro"].includes(name) && dir === dist
        ? []
        : builtPages(path);
    }
    if (name !== "index.html") return [];
    return [
      `${SITE}${relative(dist, dir).replaceAll("\\", "/")}/`.replace(
        /\/\/$/,
        "/"
      ),
    ];
  });

test("the sitemap lists every page, each with its own title and description", async ({
  request,
}) => {
  const sitemap = readFileSync(join(dist, "sitemap-0.xml"), "utf8");
  const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, url]) => url as string
  );
  expect([...listed].sort()).toEqual(builtPages().sort());

  // A title is unique within its language (Spanish and Galician share some
  // words, such as "Validar formularios"), a description across the site.
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  for (const url of listed) {
    const html = await (await request.get(url.slice(SITE.length))).text();
    const lang = /<html lang="([^"]+)"/.exec(html)?.[1] ?? "";
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "";
    const description =
      /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? "";
    expect(description.length, `${url}: description`).toBeGreaterThan(50);
    expect(
      titles.get(`${lang} ${title}`),
      `${url}: title "${title}"`
    ).toBeUndefined();
    expect(
      descriptions.get(description),
      `${url}: description "${description}"`
    ).toBeUndefined();
    titles.set(`${lang} ${title}`, url);
    descriptions.set(description, url);
  }
});

test("the benchmark charts show every library of latest.json", async ({
  page,
}) => {
  await page.goto("benchmarks/");
  const chart = page.locator("#throughput-dni");
  await expect(chart.locator("tbody tr")).toHaveCount(latest.contenders.length);
  // The fastest first: this build.
  await expect(chart.locator("tbody tr").first()).toHaveAttribute(
    "data-kind",
    "subject"
  );
  // Every chart has a caption, its text alternative names what is measured.
  for (const caption of await page.locator("table caption").all()) {
    expect((await caption.textContent())?.length).toBeGreaterThan(20);
  }
  await expect(page.locator("text=Apple M1").first()).toBeVisible();
});

test("the comparison matrix links each library's sources", async ({ page }) => {
  await page.goto("es/comparison/");
  const rows = page.locator(".features tbody tr");
  await expect(rows).toHaveCount(latest.contenders.length - 1);
  await expect(
    rows
      .first()
      .locator(
        'a[href="https://www.npmjs.com/package/nif-dni-nie-cif-validation"]'
      )
  ).toBeAttached();
  await expect(page.getByText(/Revisado el \d+ de \w+ de \d{4}/)).toBeVisible();
});
