// The live validator gives the package's own results, in the page's language.
// The expected values come from the package itself (validate() and its
// locale objects) and from the fixture suite of the repository
// (test/fixtures), never from strings copied into this test.
import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";
import { type NifLocale, validate } from "nif-dni-nie-cif-validation";
import { ca } from "nif-dni-nie-cif-validation/locales/ca";
import { en } from "nif-dni-nie-cif-validation/locales/en";
import { es } from "nif-dni-nie-cif-validation/locales/es";
import { eu } from "nif-dni-nie-cif-validation/locales/eu";
import { gl } from "nif-dni-nie-cif-validation/locales/gl";
import { ca as caText } from "../src/i18n/ca";
import { en as enText } from "../src/i18n/en";
import { es as esText } from "../src/i18n/es";
import { eu as euText } from "../src/i18n/eu";
import { gl as glText } from "../src/i18n/gl";
import type { SiteStrings } from "../src/i18n/types";

const LANGS: {
  lang: string;
  path: string;
  locale: NifLocale;
  text: SiteStrings;
}[] = [
  { lang: "en", path: "", locale: en, text: enText },
  { lang: "es", path: "es/", locale: es, text: esText },
  { lang: "ca", path: "ca/", locale: ca, text: caText },
  { lang: "eu", path: "eu/", locale: eu, text: euText },
  { lang: "gl", path: "gl/", locale: gl, text: glText },
];

/** A valid and an invalid example of each type, and two malformed inputs. */
const EXAMPLES = [
  "12345678Z", // DNI
  "12345678A", // DNI, wrong letter
  "K1234567L", // K/L/M NIF
  "K1234567A", // K/L/M NIF, wrong letter
  "X1234567L", // NIE
  "X1234567A", // NIE, wrong letter
  "B12345674", // CIF
  "B12345675", // CIF, wrong digit
  "P2807900B", // CIF with a letter control (Ayuntamiento de Madrid)
  "1234", // too short
  "T1234567A", // not a NIF
];

/** What the status line must say, built from the package's own result. */
function expectedStatus(value: string, locale: NifLocale, text: SiteStrings) {
  const r = validate(value, { locale });
  const ui = text.validator.ui;
  return r.valid
    ? `${ui.valid}: ${r.type ? locale.types[r.type] : ""}`
    : `${ui.invalid}: ${r.error?.message}`;
}

async function check(page: Page, value: string) {
  await page.locator("#nif-input").fill(value);
}

for (const { lang, path, locale, text } of LANGS) {
  test(`${lang}: the validator answers in the page's language`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.getByText(text.validator.noscript)).toHaveCount(0);
    const status = page.locator("[data-status]");
    const result = page.locator("[data-result]");
    for (const value of EXAMPLES) {
      await check(page, value);
      const r = validate(value, { locale });
      await expect(status).toHaveText(expectedStatus(value, locale, text));
      await expect(result).toHaveAttribute("data-valid", String(r.valid));
      if (r.normalized) {
        await expect(page.locator("[data-details]")).toContainText(
          r.normalized
        );
      }
      if (r.error?.expected) {
        await expect(page.locator("[data-details]")).toContainText(
          `${text.validator.ui.expected} ${r.error.expected}`
        );
      }
      if (r.meta) {
        await expect(page.locator("[data-details]")).toContainText(
          r.meta.orgDescription
        );
      }
    }
    // The message really changes with the language: English differs.
    if (lang !== "en") {
      await check(page, "12345678A");
      await expect(status).not.toHaveText(
        expectedStatus("12345678A", en, enText)
      );
    }
  });

  test(`${lang}: the Random buttons generate valid numbers`, async ({
    page,
  }) => {
    await page.goto(path);
    for (const type of ["DNI", "NIE", "CIF"] as const) {
      await page
        .getByRole("button", { name: text.validator.generate[type] })
        .click();
      // The number comes back from a worker, asynchronously.
      await expect
        .poll(
          async () =>
            validate(await page.locator("#nif-input").inputValue()).type
        )
        .toBe(type);
      await expect(page.locator("[data-result]")).toHaveAttribute(
        "data-valid",
        "true"
      );
      await expect(page.locator("[data-generated-note]")).toBeVisible();
    }
  });
}

test("the validator agrees with the fixture suite (default options)", async ({
  page,
}) => {
  const files = [
    "dni.json",
    "klm.json",
    "nie.json",
    "cif.json",
    "normalization.json",
    "placeholders-default.json",
    "vat-default.json",
  ];
  const fixtures = files.flatMap(
    (file) =>
      JSON.parse(
        readFileSync(
          new URL(`../../test/fixtures/${file}`, import.meta.url),
          "utf8"
        )
      ) as {
        input: unknown;
        expected: string;
      }[]
  );
  expect(fixtures.length).toBeGreaterThan(100);
  await page.goto("");
  const result = page.locator("[data-result]");
  let checked = 0;
  for (const { input, expected } of fixtures) {
    // A text field can only hold strings; empty strings show the empty state.
    if (typeof input !== "string" || input.trim() === "") continue;
    await check(page, input);
    await expect(result, `fixture ${JSON.stringify(input)}`).toHaveAttribute(
      "data-valid",
      String(expected === "valid")
    );
    await expect(result, `fixture ${JSON.stringify(input)}`).toHaveAttribute(
      "data-code",
      expected === "valid" ? "" : expected
    );
    checked++;
  }
  expect(checked).toBeGreaterThan(100);
});

test("an emptied field goes back to the empty state", async ({ page }) => {
  await page.goto("");
  await check(page, "12345678Z");
  await check(page, "");
  await expect(page.locator("[data-status]")).toHaveText(
    enText.validator.ui.empty
  );
  await expect(page.locator("[data-details]")).toBeHidden();
});
