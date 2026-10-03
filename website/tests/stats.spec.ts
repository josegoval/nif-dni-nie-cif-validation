// The project's stars and downloads under the hero (src/data/stats.ts and
// ProjectStats.astro). The first tests run the fetch and its fallbacks
// against stubbed responses, without a browser. The others check the built
// pages, which have the live numbers when the build could reach GitHub and
// npm, and the links without numbers when it couldn't (SITE_OFFLINE_STATS=1,
// or no network): either way, never a zero or a broken number.
import { expect, test } from "@playwright/test";
import {
  DOWNLOADS_URL,
  fetchProjectStats,
  PACKAGE,
  parseDownloads,
  parseStars,
  REPOSITORY,
  STARS_URL,
} from "../src/data/stats";
import { formatDate, formatNumber, LANGS, stringsFor } from "../src/i18n";

const NOW = new Date("2026-10-02T12:00:00Z");
const npmBody = {
  downloads: 3851,
  start: "2026-09-24",
  end: "2026-09-30",
  package: PACKAGE,
};
const repoBody = { full_name: REPOSITORY, stargazers_count: 8 };

interface Call {
  url: string;
  headers: Record<string, string>;
  signal?: AbortSignal;
}

/** A fetch that answers per host, and records each request. */
function stubFetch(
  answers: Record<"github" | "npm", () => Response | Promise<Response>>
) {
  const calls: Call[] = [];
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({
      url,
      headers: init?.headers as Record<string, string>,
      signal: init?.signal ?? undefined,
    });
    return new URL(url).hostname === "api.github.com"
      ? answers.github()
      : answers.npm();
  }) as typeof fetch;
  return { fetchFn, calls };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

test.describe("fetching the numbers", () => {
  // Expected failures log a warning each; keep the test output clean.
  const warn = console.warn;
  test.beforeEach(() => {
    console.warn = () => {};
  });
  test.afterEach(() => {
    console.warn = warn;
  });

  test("reads both numbers, with the date of the build", async () => {
    const { fetchFn, calls } = stubFetch({
      github: () => json(repoBody),
      npm: () => json(npmBody),
    });
    expect(await fetchProjectStats({}, fetchFn, NOW)).toEqual({
      stars: 8,
      downloads: 3851,
      date: "2026-10-02",
    });
    expect(calls.map((call) => call.url).sort()).toEqual([
      `https://api.github.com/repos/${REPOSITORY}`,
      `https://api.npmjs.org/downloads/point/last-week/${PACKAGE}`,
    ]);
    for (const call of calls) expect(call.signal).toBeInstanceOf(AbortSignal);
  });

  test("sends GITHUB_TOKEN to GitHub only, when it is set", async () => {
    const { fetchFn, calls } = stubFetch({
      github: () => json(repoBody),
      npm: () => json(npmBody),
    });
    await fetchProjectStats({ GITHUB_TOKEN: "t0ken" }, fetchFn, NOW);
    const github = calls.find((call) => call.url.includes("github"));
    const npm = calls.find((call) => call.url.includes("npmjs"));
    expect(github?.headers.authorization).toBe("Bearer t0ken");
    expect(npm?.headers.authorization).toBeUndefined();

    const anonymous = stubFetch({
      github: () => json(repoBody),
      npm: () => json(npmBody),
    });
    await fetchProjectStats({}, anonymous.fetchFn, NOW);
    for (const call of anonymous.calls) {
      expect(call.headers.authorization).toBeUndefined();
    }
  });

  test("SITE_OFFLINE_STATS=1 makes no request", async () => {
    const { fetchFn, calls } = stubFetch({
      github: () => json(repoBody),
      npm: () => json(npmBody),
    });
    expect(
      await fetchProjectStats({ SITE_OFFLINE_STATS: "1" }, fetchFn, NOW)
    ).toEqual({ stars: null, downloads: null, date: "2026-10-02" });
    expect(calls).toEqual([]);
  });

  const failures: Record<string, () => Response | Promise<Response>> = {
    "a network error": () => Promise.reject(new TypeError("fetch failed")),
    "a timeout": () =>
      Promise.reject(
        new DOMException("The operation timed out.", "TimeoutError")
      ),
    "GitHub's rate limit (403)": () =>
      json({ message: "API rate limit exceeded" }, 403),
    "a server error (503)": () => new Response("unavailable", { status: 503 }),
    "a body that isn't JSON": () => new Response("<html>"),
    "JSON without the number": () => json({}),
  };
  for (const [name, failure] of Object.entries(failures)) {
    test(`after ${name}, that number is null and the other stays`, async () => {
      const githubDown = stubFetch({
        github: failure,
        npm: () => json(npmBody),
      });
      expect(await fetchProjectStats({}, githubDown.fetchFn, NOW)).toEqual({
        stars: null,
        downloads: 3851,
        date: "2026-10-02",
      });
      const npmDown = stubFetch({ github: () => json(repoBody), npm: failure });
      expect(await fetchProjectStats({}, npmDown.fetchFn, NOW)).toEqual({
        stars: 8,
        downloads: null,
        date: "2026-10-02",
      });
    });
  }

  test("only a positive whole number, for this package, counts", () => {
    expect(parseDownloads(npmBody)).toBe(3851);
    expect(parseStars(repoBody)).toBe(8);
    for (const downloads of [0, -1, 1.5, "3851", null, Number.NaN]) {
      expect(parseDownloads({ ...npmBody, downloads })).toBeNull();
    }
    for (const stargazers_count of [0, -1, 1.5, "8", null]) {
      expect(parseStars({ ...repoBody, stargazers_count })).toBeNull();
    }
    expect(parseDownloads({ ...npmBody, package: "other" })).toBeNull();
    expect(parseDownloads({ error: "package not found" })).toBeNull();
    expect(parseStars({ ...repoBody, full_name: "someone/else" })).toBeNull();
    for (const body of [null, undefined, "8", 8, []]) {
      expect(parseDownloads(body)).toBeNull();
      expect(parseStars(body)).toBeNull();
    }
  });
});

for (const lang of LANGS) {
  test(`${lang}: the stars and downloads link to their sources`, async ({
    page,
  }) => {
    const t = stringsFor(lang).stats;
    await page.goto(lang === "en" ? "" : `${lang}/`);
    const block = page.locator("[data-stats]");
    const list = block.getByRole("list", { name: t.label });
    await expect(list).toBeVisible();

    const stats = [
      {
        link: list.locator('a[data-stat="star"]'),
        href: STARS_URL,
        fallback: t.starsLink,
        live: (n: number) => t.stars(formatNumber(lang, n), n),
      },
      {
        link: list.locator('a[data-stat="npm"]'),
        href: DOWNLOADS_URL,
        fallback: t.downloadsLink,
        live: (n: number) => t.downloads(formatNumber(lang, n), n),
      },
    ];
    let anyLive = false;
    for (const { link, href, fallback, live } of stats) {
      await expect(link).toHaveAttribute("href", href);
      const text = (await link.textContent())?.trim() ?? "";
      if ((await link.getAttribute("data-live")) === null) {
        expect(text).toBe(fallback);
        continue;
      }
      anyLive = true;
      const shown = (await link.locator("strong").textContent()) ?? "";
      const value = Number(shown.replace(/\D/g, ""));
      expect(value).toBeGreaterThan(0);
      expect(shown).toBe(formatNumber(lang, value));
      expect(text).toBe(live(value));
    }

    const date = block.locator("[data-stats-date]");
    if (!anyLive) {
      await expect(date).toHaveCount(0);
      return;
    }
    const iso = (await date.getAttribute("data-stats-date")) ?? "";
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await expect(date).toHaveText(t.asOf(formatDate(lang, iso)));
  });
}

test("the numbers need no request from the browser", async ({ page }) => {
  const hosts = new Set<string>();
  page.on("request", (request) => hosts.add(new URL(request.url()).host));
  await page.goto("");
  await page.waitForLoadState("load");
  expect([...hosts]).toEqual(["localhost:4321"]);
});
