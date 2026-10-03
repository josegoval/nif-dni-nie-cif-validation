// The project's stars on GitHub and its downloads on npm in the last week,
// fetched once per build (never in the browser, and no badge service) for
// the landing page of every language.
//
// Either request may fail: no network, a status other than 200, GitHub's
// rate limit, a timeout or a body that isn't what it should be. The build
// goes on, and that number is `null`, so the page shows a link to its source
// without a number. SITE_OFFLINE_STATS=1 skips both requests (offline and
// reproducible builds). GITHUB_TOKEN, when set (the Pages workflow passes its
// read-only token), lifts GitHub's limit of 60 unauthenticated requests per
// hour, which runners share.
//
// This module reads `process.env` rather than `import.meta.env`, so the
// Playwright tests can import it outside Astro (tests/stats.spec.ts).

export const PACKAGE = "nif-dni-nie-cif-validation";
export const REPOSITORY = "josegoval/nif-dni-nie-cif-validation";

const NPM_API = `https://api.npmjs.org/downloads/point/last-week/${PACKAGE}`;
const GITHUB_API = `https://api.github.com/repos/${REPOSITORY}`;

/** Where a visitor can check each number. */
export const STARS_URL = `https://github.com/${REPOSITORY}/stargazers`;
export const DOWNLOADS_URL = `https://www.npmjs.com/package/${PACKAGE}`;

const TIMEOUT_MS = 5000;

export interface ProjectStats {
  /** The repository's stars, or `null` when GitHub didn't say. */
  stars: number | null;
  /** The package's downloads in the last week, or `null` when npm didn't say. */
  downloads: number | null;
  /** The day the numbers were fetched (YYYY-MM-DD, UTC): the build's date. */
  date: string;
}

type Fetch = typeof fetch;
type Env = Record<string, string | undefined>;

/** A count worth showing: a positive whole number. Zero is never shown. */
const count = (value: unknown): number | null =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;

/** The JSON body of a request, or `null` on any failure. */
async function getJson(
  fetchFn: Fetch,
  url: string,
  headers: Record<string, string>
): Promise<unknown> {
  try {
    const response = await fetchFn(url, {
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status !== 200) {
      console.warn(`[stats] ${url}: HTTP ${response.status}, not shown`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`[stats] ${url}: ${(error as Error).message}, not shown`);
    return null;
  }
}

/** The npm downloads API's answer: `{ downloads, start, end, package }`. */
export function parseDownloads(body: unknown): number | null {
  if (typeof body !== "object" || body === null) return null;
  const { downloads, package: name } = body as Record<string, unknown>;
  return name === PACKAGE ? count(downloads) : null;
}

/** The GitHub repository API's answer: `stargazers_count`. */
export function parseStars(body: unknown): number | null {
  if (typeof body !== "object" || body === null) return null;
  const { stargazers_count: stars, full_name: name } = body as Record<
    string,
    unknown
  >;
  return name === REPOSITORY ? count(stars) : null;
}

/** Fetches both numbers, in parallel. Never rejects. */
export async function fetchProjectStats(
  env: Env = process.env,
  fetchFn: Fetch = fetch,
  now: Date = new Date()
): Promise<ProjectStats> {
  const date = now.toISOString().slice(0, 10);
  if (env.SITE_OFFLINE_STATS === "1") {
    return { stars: null, downloads: null, date };
  }
  const github: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": `${PACKAGE}-website`,
    "x-github-api-version": "2022-11-28",
  };
  if (env.GITHUB_TOKEN) github.authorization = `Bearer ${env.GITHUB_TOKEN}`;
  const [repo, npm] = await Promise.all([
    getJson(fetchFn, GITHUB_API, github),
    getJson(fetchFn, NPM_API, { accept: "application/json" }),
  ]);
  return { stars: parseStars(repo), downloads: parseDownloads(npm), date };
}

let cached: Promise<ProjectStats> | undefined;

/** The numbers of this build: fetched on the first call, then reused. */
export function projectStats(): Promise<ProjectStats> {
  cached ??= fetchProjectStats().then((stats) => {
    const show = (value: number | null) => value ?? "not shown";
    console.info(
      `[stats] ${stats.date}: stars ${show(stats.stars)}, downloads last week ${show(stats.downloads)}`
    );
    return stats;
  });
  return cached;
}
