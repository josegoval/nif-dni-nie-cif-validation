#!/usr/bin/env node
// Checks whether the official sources that SPEC.md cites have changed (#42).
// No dependencies, so it runs with plain Node 22+:
//
//   pnpm spec:sources            print a report of changed / unchanged /
//                                unverifiable sources (nothing is written)
//   pnpm spec:sources:update     also record the current values in
//                                spec-sources.json, after a maintainer has
//                                reviewed a change (see CONTRIBUTING.md)
//
// Options: `--report <file>` writes the markdown report to a file instead of
// stdout, `--result <file>` writes a JSON summary for the workflow
// (.github/workflows/spec-sources.yml), `--simulate-change` changes one
// recorded value in memory to prove the issue-opening path, and `--file
// <path>` reads another spec-sources.json.
//
// What is read, per kind of source in spec-sources.json:
// - `boe-consolidated` (T1, a consolidated text, `act.php`): the BOE open data
//   API. The date of the last update of the text is the newest date of its
//   blocks (`/texto/indice`): it is the "Última actualización publicada" of
//   act.php. (`fecha_actualizacion` of `/metadatos` is not: it moves whenever
//   the BOE reprocesses its records.) Also the dates of the articles SPEC.md
//   cites, and the repeal, annulment and expiry flags (`/metadatos`).
// - `boe-document` (T1, a text the BOE does not consolidate, `doc.php`): the
//   document's XML (`/diario_boe/xml.php`). Its text never changes after
//   publication, so what can change is the flags and the later references
//   (an order that amends, corrects or repeals it).
// - `page` (T2): a SHA-256 of the text of the section that matters, between
//   the `from` and `to` markers of the source, without tags, scripts,
//   comments and white space (`normaliseText`). The page chrome (menus, the
//   "page updated" date) is outside the section, so it doesn't change the
//   hash. When the live page can't be read (the Ministerio del Interior
//   answers 403 to automated requests), the latest Wayback Machine snapshot
//   is read instead.
//
// A source that can't be read (network error, timeout, an answer that is not
// what the BOE API returns) is "unverifiable": it is reported, never an
// error, and its recorded values are kept by `--update`.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_FILE = resolve(ROOT, "spec-sources.json");

const REPOSITORY = "https://github.com/josegoval/nif-dni-nie-cif-validation";

export const USER_AGENT = `nif-dni-nie-cif-validation-spec-sources/1.0 (+${REPOSITORY}; monthly check of the official sources)`;

const BOE_API = "https://www.boe.es/datosabiertos/api/legislacion-consolidada";
const BOE_DOCUMENT_XML = "https://www.boe.es/diario_boe/xml.php";
const WAYBACK_AVAILABLE = "https://archive.org/wayback/available";

/** The value recorded for the simulated change (`--simulate-change`). */
export const SIMULATED_VALUE = "simulated change";

/** Marks the issue that a set of changes opened, so it is opened only once. */
export const FINGERPRINT_PREFIX = "spec-sources-fingerprint:";

// --- Reading the answers (pure) --------------------------------------------

/** `20070905` or `20260930T113513Z` → `2007-09-05`. */
export function boeDate(value) {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(String(value));
  if (!match) throw new Error(`not a BOE date: ${value}`);
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/** The BOE API turns a list of one element into the element itself. */
function toArray(value) {
  if (value === undefined || value === null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * The values of a consolidated text, from the answers of the BOE API to
 * `/metadatos` and `/texto/indice` (both JSON). `articles` are block titles
 * as the index writes them ("Artículo 19", white space aside); an article that is not found is
 * recorded as "not found", so a renumbering shows as a change.
 *
 * @returns {Record<string, string>}
 */
export function consolidatedValues(metadata, index, articles = []) {
  const meta = toArray(metadata?.data)[0];
  const blocks = toArray(toArray(index?.data)[0]?.bloque);
  if (!meta || blocks.length === 0) {
    throw new Error("unexpected answer from the BOE open data API");
  }
  const dates = blocks.map((block) => boeDate(block.fecha_actualizacion));
  const values = {
    "last update": dates.reduce((a, b) => (b > a ? b : a)),
    repealed: String(meta.estatus_derogacion),
    annulled: String(meta.estatus_anulacion),
    expired: String(meta.vigencia_agotada),
  };
  // The index writes some titles with a no-break space ("Artículo 205").
  const clean = (title) =>
    String(title)
      .replace(/[\s\u00a0]+/g, " ")
      .trim();
  for (const title of articles) {
    const found = blocks
      .filter((block) => clean(block.titulo) === clean(title))
      .map((block) => boeDate(block.fecha_actualizacion));
    values[title] = found.length > 0 ? found.join(", ") : "not found";
  }
  return values;
}

/** The text of the first `<name>…</name>` of an XML document ("" if empty). */
function xmlElement(xml, name) {
  const match = new RegExp(
    `<${name}(?:\\s[^>]*)?(?:/>|>([\\s\\S]*?)</${name}>)`
  ).exec(xml);
  if (!match) throw new Error(`no <${name}> in the BOE document XML`);
  return decodeEntities(match[1] ?? "").trim();
}

/**
 * The values of a document the BOE does not consolidate, from its XML
 * (`/diario_boe/xml.php?id=…`): the flags and the later references.
 *
 * @returns {Record<string, string>}
 */
export function documentValues(xml) {
  const later = /<posteriores>([\s\S]*?)<\/posteriores>/.exec(xml)?.[1] ?? "";
  const references = [
    ...later.matchAll(/<posterior\b([^>]*)>([\s\S]*?)<\/posterior>/g),
  ].map(([, attributes, body]) => {
    const id = /referencia="([^"]*)"/.exec(attributes)?.[1] ?? "?";
    return `${xmlElement(body, "palabra")} ${xmlElement(body, "texto")} (${id})`;
  });
  return {
    repealed: xmlElement(xml, "estatus_derogacion"),
    annulled: xmlElement(xml, "judicialmente_anulada"),
    expired: xmlElement(xml, "vigencia_agotada"),
    "later references": references.length > 0 ? references.join("; ") : "none",
  };
}

// cspell:disable -- the names of HTML entities
const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  laquo: "«",
  raquo: "»",
  iexcl: "¡",
  iquest: "¿",
  ordf: "ª",
  ordm: "º",
  middot: "·",
  euro: "€",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  rarr: "→",
};
for (const [letter, accents] of Object.entries({
  a: { acute: "á", grave: "à", uml: "ä", circ: "â" },
  e: { acute: "é", grave: "è", uml: "ë", circ: "ê" },
  i: { acute: "í", grave: "ì", uml: "ï", circ: "î" },
  o: { acute: "ó", grave: "ò", uml: "ö", circ: "ô" },
  u: { acute: "ú", grave: "ù", uml: "ü", circ: "û" },
  n: { tilde: "ñ" },
  c: { cedil: "ç" },
})) {
  for (const [accent, character] of Object.entries(accents)) {
    NAMED_ENTITIES[`${letter}${accent}`] = character;
    NAMED_ENTITIES[`${letter.toUpperCase()}${accent}`] =
      character.toUpperCase();
  }
}
// cspell:enable

/**
 * Decodes numeric character references and the named entities Spanish
 * government pages use (`&aacute;`, `&ntilde;`, `&nbsp;`…). Another named
 * entity is kept as written. So a page that switches between `&aacute;` and
 * `á` keeps its hash.
 */
export function decodeEntities(text) {
  return text.replace(
    /&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi,
    (entity, decimal, hex, name) => {
      if (decimal) return String.fromCodePoint(Number(decimal));
      if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
      return NAMED_ENTITIES[name] ?? entity;
    }
  );
}

/**
 * The HTML from the tag that contains the `from` marker up to the tag that
 * contains the `to` marker after it (excluded), or null when a marker is
 * missing (the page was restructured, or it is not the page).
 */
export function extractSection(html, { from, to }) {
  const fromAt = html.indexOf(from);
  if (fromAt === -1) return null;
  const toAt = html.indexOf(to, fromAt + from.length);
  if (toAt === -1) return null;
  const start = html.lastIndexOf("<", fromAt);
  const end = html.lastIndexOf("<", toAt);
  return html.slice(start === -1 ? fromAt : start, end > start ? end : toAt);
}

/**
 * The text of a piece of HTML, for hashing: without scripts, styles,
 * comments and tags, with the entities decoded, in Unicode NFC and with
 * every run of white space (including no-break spaces) turned into one
 * space. Changes of markup, attributes or indentation don't change it.
 */
export function normaliseText(html) {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]*>/g, " ")
  )
    .normalize("NFC")
    .replace(/[\s\u00a0]+/g, " ")
    .trim();
}

export function sha256(text) {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

/**
 * The values of a T2 page: the hash and the length of the text of its
 * section. A section that isn't found is recorded as "not found", so it
 * shows as a change and someone checks the page and the markers.
 *
 * @returns {Record<string, string>}
 */
export function pageValues(html, section) {
  const extracted = extractSection(html, section);
  if (extracted === null) {
    return { "section hash": "not found", "section length": "not found" };
  }
  const text = normaliseText(extracted);
  return {
    "section hash": sha256(text),
    "section length": `${text.length} characters`,
  };
}

// --- Comparing (pure) -----------------------------------------------------

/**
 * Compares the values recorded for a source with what was read now.
 * `result` is `{ ok: true, values, via }` or `{ ok: false, reason }`.
 */
export function compareSource(source, result) {
  if (!result.ok) {
    return { source, status: "unverifiable", reason: result.reason };
  }
  const recorded = source.recorded ?? {};
  const fields = [
    ...new Set([...Object.keys(recorded), ...Object.keys(result.values)]),
  ];
  const changes = fields
    .filter((field) => recorded[field] !== result.values[field])
    .map((field) => ({
      field,
      old: recorded[field] ?? null,
      new: result.values[field] ?? null,
    }));
  const entry = {
    source,
    status: changes.length > 0 ? "changed" : "unchanged",
    via: result.via,
    values: result.values,
    changes,
  };
  // The whole text was updated, but not the articles SPEC.md cites: usually
  // nothing to do, but a new article (19 bis…) would only show here.
  if (
    source.articles?.length > 0 &&
    changes.length === 1 &&
    changes[0].field === "last update"
  ) {
    entry.note =
      "Only the date of the whole consolidated text changed: the articles SPEC.md cites did not. Check that no new article (for example a «bis») affects the rules.";
  }
  return entry;
}

/** Compares every source of a spec-sources.json with its result. */
export function compareAll(file, results) {
  const entries = file.sources.map((source, i) =>
    compareSource(source, results[i])
  );
  const count = (status) =>
    entries.filter((entry) => entry.status === status).length;
  return {
    entries,
    changed: count("changed"),
    unchanged: count("unchanged"),
    unverifiable: count("unverifiable"),
  };
}

/**
 * A short hash of the changes (source, field, old and new value), so the
 * same changes open one issue however many times the workflow runs.
 */
export function fingerprintOf(comparison) {
  const changes = comparison.entries
    .filter((entry) => entry.status === "changed")
    .flatMap((entry) =>
      entry.changes.map((c) => [entry.source.id, c.field, c.old, c.new])
    );
  if (changes.length === 0) return null;
  return createHash("sha256")
    .update(JSON.stringify(changes))
    .digest("hex")
    .slice(0, 12);
}

/** The title of the issue a comparison opens (null when nothing changed). */
export function issueTitle(comparison, { simulated = false } = {}) {
  const fingerprint = fingerprintOf(comparison);
  if (fingerprint === null) return null;
  const names = comparison.entries
    .filter((entry) => entry.status === "changed")
    .map((entry) => entry.source.short ?? entry.source.id);
  const listed =
    names.length > 3
      ? `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`
      : names.join(", ");
  return `${simulated ? "[simulated] " : ""}Official source changed: ${listed} (${fingerprint})`;
}

// --- The report (pure) ----------------------------------------------------

function cell(value) {
  if (value === null || value === undefined) return "(none)";
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function sourceLink(source) {
  return `[${source.name}](${source.url})`;
}

/**
 * The markdown report of a comparison: what changed (old and new value of
 * every field), what could not be read and why, and what didn't change.
 */
export function renderReport(comparison, { date, simulated = false }) {
  const lines = [`## Official sources check, ${date}`, ""];
  if (simulated) {
    lines.push(
      `> [!WARNING]`,
      `> Simulated run: one recorded value was replaced with "${SIMULATED_VALUE}" in memory to test this workflow. Nothing in the sources changed. Close this issue.`,
      ""
    );
  }
  lines.push(
    `**${comparison.changed} changed · ${comparison.unchanged} unchanged · ${comparison.unverifiable} unverifiable** (sources in [\`spec-sources.json\`](${REPOSITORY}/blob/master/spec-sources.json)).`,
    ""
  );

  const changed = comparison.entries.filter((e) => e.status === "changed");
  if (changed.length > 0) {
    lines.push("### Changed", "");
    for (const entry of changed) {
      const { source } = entry;
      lines.push(
        `#### ${sourceLink(source)} (${source.tier})`,
        "",
        `Cited by: ${source.citedBy}. Read from: ${entry.via}. Recorded on: ${source.checked ?? "never"}.`,
        "",
        "| Value | Recorded | Now |",
        "| --- | --- | --- |",
        ...entry.changes.map(
          (c) => `| ${cell(c.field)} | ${cell(c.old)} | ${cell(c.new)} |`
        ),
        ""
      );
      if (entry.note) lines.push(entry.note, "");
    }
    lines.push(
      "### What to do",
      "",
      "1. Read the changed source (the link above) and decide whether a rule of SPEC.md is affected.",
      '2. If it is, update SPEC.md (and its "Last verified" date), the code, the tests and the fixtures in a pull request.',
      "3. Run `pnpm spec:sources:update` and commit `spec-sources.json`, then close this issue.",
      "",
      `See [Official sources](${REPOSITORY}/blob/master/CONTRIBUTING.md#official-sources) in CONTRIBUTING.md.`,
      ""
    );
  }

  const unverifiable = comparison.entries.filter(
    (e) => e.status === "unverifiable"
  );
  if (unverifiable.length > 0) {
    lines.push(
      "### Unverifiable",
      "",
      "These sources could not be read this time. Their recorded values are kept; check them by hand if this repeats.",
      "",
      ...unverifiable.map(
        (entry) =>
          `- ${sourceLink(entry.source)} (${entry.source.tier}): ${entry.reason}`
      ),
      ""
    );
  }

  const unchanged = comparison.entries.filter((e) => e.status === "unchanged");
  if (unchanged.length > 0) {
    lines.push(
      "### Unchanged",
      "",
      "| Source | Tier | Read from | Recorded on |",
      "| --- | --- | --- | --- |",
      ...unchanged.map(
        (entry) =>
          `| ${sourceLink(entry.source)} | ${entry.source.tier} | ${cell(entry.via)} | ${cell(entry.source.checked)} |`
      ),
      ""
    );
  }

  const fingerprint = fingerprintOf(comparison);
  if (fingerprint !== null) {
    lines.push(`<!-- ${FINGERPRINT_PREFIX} ${fingerprint} -->`, "");
  }
  return lines.join("\n");
}

// --- Updating and simulating (pure) ----------------------------------------

/**
 * spec-sources.json with the values read now recorded for every source that
 * could be read. An unverifiable source keeps its values and its date.
 */
export function updatedFile(file, results, date) {
  return {
    ...file,
    sources: file.sources.map((source, i) => {
      const result = results[i];
      if (!result.ok) return source;
      return {
        ...source,
        recorded: result.values,
        checked: date,
        checkedVia: result.via,
      };
    }),
  };
}

/**
 * A copy of spec-sources.json where the first recorded value of the first
 * source with values is replaced with `SIMULATED_VALUE`, so the comparison
 * reports one change.
 */
export function simulateChange(file) {
  const copy = structuredClone(file);
  const source = copy.sources.find(
    (s) => s.recorded && Object.keys(s.recorded).length > 0
  );
  if (!source) throw new Error("no recorded value to change");
  const [field] = Object.keys(source.recorded);
  source.recorded[field] = SIMULATED_VALUE;
  return copy;
}

// --- Fetching (I/O, injectable for the tests) ------------------------------

/** HTTP statuses worth another try: timeouts, rate limits, server errors. */
function isRetryable(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

/**
 * GETs a URL as text, with the project's User-Agent, a timeout, and
 * retries with a short back-off on network errors, timeouts, 408, 425, 429
 * and 5xx. Another status (403, 404…) fails at once.
 */
export async function fetchText(url, options = {}) {
  const {
    fetch = globalThis.fetch,
    sleep = (ms) => new Promise((done) => setTimeout(done, ms)),
    accept = "*/*",
    timeoutMs = 30_000,
    backoffMs = [2_000, 5_000],
  } = options;
  let problem = "";
  for (let attempt = 0; attempt <= backoffMs.length; attempt++) {
    if (attempt > 0) await sleep(backoffMs[attempt - 1]);
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: accept },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok) return await response.text();
      problem = `HTTP ${response.status}`;
      if (!isRetryable(response.status)) break;
    } catch (error) {
      problem = error?.cause?.message ?? error?.message ?? String(error);
    }
  }
  throw new Error(`${url}: ${problem}`);
}

async function fetchJson(url, options) {
  return JSON.parse(
    await fetchText(url, { ...options, accept: "application/json" })
  );
}

/** `20260228172549` → `2026-02-28`. */
function waybackDate(timestamp) {
  return boeDate(String(timestamp).slice(0, 8));
}

/** Reads a T2 page live, or else from its latest Wayback Machine snapshot. */
async function readPage(source, options) {
  try {
    const html = await fetchText(source.url, options);
    return {
      ok: true,
      values: pageValues(html, source.section),
      via: "live page",
    };
  } catch (liveError) {
    const available = await fetchJson(
      `${WAYBACK_AVAILABLE}?url=${encodeURIComponent(source.url)}`,
      options
    ).catch((error) => {
      throw new Error(
        `${liveError.message}; Wayback Machine: ${error.message}`
      );
    });
    const snapshot = available?.archived_snapshots?.closest;
    if (!snapshot?.available || !snapshot.timestamp) {
      throw new Error(
        `${liveError.message}; Wayback Machine: no snapshot of the page`
      );
    }
    const html = await fetchText(
      `https://web.archive.org/web/${snapshot.timestamp}id_/${source.url}`,
      options
    ).catch((error) => {
      throw new Error(
        `${liveError.message}; Wayback Machine: ${error.message}`
      );
    });
    return {
      ok: true,
      values: pageValues(html, source.section),
      via: `Wayback Machine snapshot of ${waybackDate(snapshot.timestamp)} (live page: ${liveError.message.replace(`${source.url}: `, "")})`,
    };
  }
}

/**
 * Reads the current values of one source. Never throws: a source that
 * can't be read is `{ ok: false, reason }`.
 */
export async function readSource(source, options = {}) {
  try {
    switch (source.kind) {
      case "boe-consolidated": {
        const base = `${BOE_API}/id/${source.boeId}`;
        const metadata = await fetchJson(`${base}/metadatos`, options);
        const index = await fetchJson(`${base}/texto/indice`, options);
        return {
          ok: true,
          values: consolidatedValues(metadata, index, source.articles),
          via: "BOE open data API",
        };
      }
      case "boe-document": {
        const xml = await fetchText(
          `${BOE_DOCUMENT_XML}?id=${source.boeId}`,
          options
        );
        return {
          ok: true,
          values: documentValues(xml),
          via: "BOE document XML",
        };
      }
      case "page":
        return await readPage(source, options);
      default:
        throw new Error(`unknown kind of source: ${source.kind}`);
    }
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

// --- Command line ------------------------------------------------------------

/** Parses the command line (see the top of this file). */
export function parseArgs(argv) {
  const args = {
    update: false,
    simulate: false,
    report: null,
    result: null,
    file: DEFAULT_FILE,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--update") args.update = true;
    else if (arg === "--simulate-change") args.simulate = true;
    else if (arg === "--report" || arg === "--result" || arg === "--file") {
      const value = argv[++i];
      if (!value) throw new Error(`${arg} needs a value`);
      args[arg.slice(2)] = value;
    } else throw new Error(`unknown option: ${arg}`);
  }
  if (args.update && args.simulate) {
    throw new Error("--update and --simulate-change can't be used together");
  }
  return args;
}

/** Runs a check: reads every source, then reports (and records). */
export async function run(argv, options = {}) {
  const {
    date = new Date().toISOString().slice(0, 10),
    log = (line) => console.error(line),
    out = (text) => process.stdout.write(text),
    read = (path) => readFileSync(path, "utf8"),
    write = (path, text) => writeFileSync(path, text),
  } = options;
  const args = parseArgs(argv);
  const recorded = JSON.parse(read(args.file));
  const file = args.simulate ? simulateChange(recorded) : recorded;

  const results = [];
  for (const source of file.sources) {
    const result = await readSource(source, options);
    log(
      `${source.id}: ${result.ok ? `read (${result.via})` : `unverifiable (${result.reason})`}`
    );
    results.push(result);
  }

  const comparison = compareAll(file, results);
  const report = renderReport(comparison, { date, simulated: args.simulate });
  if (args.report) write(args.report, report);
  else out(report);
  const result = {
    changed: comparison.changed,
    unchanged: comparison.unchanged,
    unverifiable: comparison.unverifiable,
    fingerprint: fingerprintOf(comparison),
    title: issueTitle(comparison, { simulated: args.simulate }),
  };
  if (args.result) write(args.result, `${JSON.stringify(result, null, 2)}\n`);
  if (args.update) {
    write(
      args.file,
      `${JSON.stringify(updatedFile(file, results, date), null, 2)}\n`
    );
    log(`Recorded the values read on ${date} in ${args.file}.`);
  }
  log(
    `${result.changed} changed, ${result.unchanged} unchanged, ${result.unverifiable} unverifiable.`
  );
  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await run(process.argv.slice(2));
}
