// The site around the validator: languages, rendering without JavaScript,
// the head of the pages and the files at the root of the site.
import { expect, test } from "@playwright/test";
import { en } from "../src/i18n/en";
import { es } from "../src/i18n/es";

const LANGS = ["en", "es", "ca", "eu", "gl"];
const pathOf = (lang: string) => (lang === "en" ? "" : `${lang}/`);

test("the language picker switches the page's language", async ({ page }) => {
  await page.goto("");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page
    .locator("starlight-lang-select select")
    .first()
    .selectOption({ label: "Español" });
  await expect(page).toHaveURL(/\/nif-dni-nie-cif-validation\/es\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(
    page.getByRole("heading", { level: 2, name: es.validator.heading })
  ).toBeVisible();
  await page
    .locator("starlight-lang-select select")
    .first()
    .selectOption({ label: "Euskara" });
  await expect(page).toHaveURL(/\/eu\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "eu");
});

for (const lang of LANGS) {
  test(`${lang}: hreflang alternates, canonical URL and JSON-LD`, async ({
    page,
  }) => {
    await page.goto(pathOf(lang));
    const site = "https://josegoval.github.io/nif-dni-nie-cif-validation/";
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${site}${pathOf(lang)}`
    );
    for (const other of LANGS) {
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${other}"]`)
      ).toHaveAttribute("href", `${site}${pathOf(other)}`);
    }
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]')
    ).toHaveAttribute("href", site);
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(description?.length).toBeGreaterThan(50);
    const jsonLd = JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "{}"
    );
    expect(jsonLd["@type"]).toBe("SoftwareSourceCode");
    expect(jsonLd.offers.price).toBe("0");
    expect(jsonLd.sameAs).toContain(
      "https://www.npmjs.com/package/nif-dni-nie-cif-validation"
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `${site}og-default.png`
    );
  });
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the page reads well and says the validator needs JavaScript", async ({
    page,
  }) => {
    await page.goto("");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByText("npm i nif-dni-nie-cif-validation")
    ).toBeVisible();
    await expect(page.getByText(en.validator.noscript)).toBeVisible();
    await expect(
      page.getByRole("button", { name: en.validator.generate.DNI })
    ).toBeHidden();
    await expect(
      page.getByRole("heading", { level: 2, name: en.why.heading })
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    // The code tabs are CSS only.
    await expect(page.locator('[data-panel="basic"]')).toBeVisible();
    await expect(page.locator('[data-panel="zod"]')).toBeHidden();
    await page.getByText(en.code.tabs.zod, { exact: true }).click();
    await expect(page.locator('[data-panel="zod"]')).toBeVisible();
    await expect(page.locator('[data-panel="basic"]')).toBeHidden();
  });
});

test("robots.txt allows the AI crawlers and lists the sitemap", async ({
  request,
}) => {
  const robots = await (await request.get("robots.txt")).text();
  for (const bot of [
    "GPTBot",
    "ClaudeBot",
    "PerplexityBot",
    "Google-Extended",
    "Googlebot",
    "Bingbot",
  ]) {
    expect(robots).toContain(`User-agent: ${bot}\nAllow: /`);
  }
  expect(robots).not.toMatch(/Disallow: \/\S/);
  expect(robots).toContain(
    "Sitemap: https://josegoval.github.io/nif-dni-nie-cif-validation/sitemap-index.xml"
  );
});

test("the root files are served", async ({ request }) => {
  for (const file of [
    "llms.txt",
    "llms-full.txt",
    "site.webmanifest",
    "favicon.svg",
    "og-default.png",
    "sitemap-index.xml",
  ]) {
    expect((await request.get(file)).status(), file).toBe(200);
  }
  expect(await (await request.get("llms.txt")).text()).toContain(
    "# nif-dni-nie-cif-validation"
  );
});
