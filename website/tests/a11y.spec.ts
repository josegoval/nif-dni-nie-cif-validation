// Accessibility (axe-core, WCAG 2.x A and AA, which includes colour
// contrast), in the dark and the light theme: the landing pages with the
// validator showing a valid and an invalid result, and documentation pages
// with tables and charts (a guide, the benchmarks, the comparison, the
// generated official sources and API reference pages), also on a phone,
// where the wide tables scroll.
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const LANDINGS = ["", "es/", "ca/", "eu/", "gl/"];
const DOCS = [
  "guides/document-types/",
  "eu/guides/errors-and-languages/",
  "benchmarks/",
  "es/benchmarks/",
  "comparison/",
  "reference/official-sources/",
  "gl/reference/api/nif-dni-nie-cif-validation/",
];

async function violations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return results.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`
  );
}

for (const theme of ["dark", "light"] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });

    for (const path of LANDINGS) {
      test(`/${path} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        for (const value of ["12345678Z", "B12345675"]) {
          await page.locator("#nif-input").fill(value);
          expect(await violations(page)).toEqual([]);
        }
      });
    }

    for (const path of DOCS) {
      test(`/${path} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(await violations(page)).toEqual([]);
      });
    }
  });
}

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  for (const path of ["guides/document-types/", "benchmarks/", "comparison/"]) {
    test(`/${path} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path);
      expect(await violations(page)).toEqual([]);
    });
  }
});
