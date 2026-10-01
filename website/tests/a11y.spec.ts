// Accessibility (axe-core, WCAG 2.x A and AA, which includes colour
// contrast) of every page, in the dark and the light theme, with the
// validator showing a valid and an invalid result.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["", "benchmarks/", "es/", "ca/", "eu/", "gl/", "es/benchmarks/"];

for (const theme of ["dark", "light"] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });

    for (const path of PAGES) {
      test(`/${path} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const inputs = path.includes("benchmarks")
          ? [null]
          : ["12345678Z", "B12345675"];
        for (const value of inputs) {
          if (value) await page.locator("#nif-input").fill(value);
          const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
            .analyze();
          expect(
            results.violations.map(
              (v) =>
                `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`
            )
          ).toEqual([]);
        }
      });
    }
  });
}
