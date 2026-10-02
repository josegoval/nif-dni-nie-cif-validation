// Tests of scripts/spec-sources.mjs: reading the BOE answers and the T2 pages,
// the comparison, the report, the update, and the fetching with retries and
// the Wayback Machine fallback. No network: the answers are saved samples in
// scripts/fixtures/spec-sources/ (real answers of 2026-10-02, the Interior
// snapshot trimmed of its menus) and a fake `fetch`.
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  boeDate,
  compareAll,
  compareSource,
  consolidatedValues,
  decodeEntities,
  documentValues,
  extractSection,
  FINGERPRINT_PREFIX,
  fetchText,
  fingerprintOf,
  issueTitle,
  normaliseText,
  pageValues,
  parseArgs,
  readSource,
  renderReport,
  run,
  SIMULATED_VALUE,
  sha256,
  simulateChange,
  USER_AGENT,
  updatedFile,
} from "./spec-sources.mjs";

const fixture = (name) =>
  readFileSync(
    new URL(`fixtures/spec-sources/${name}`, import.meta.url),
    "utf8"
  );
const json = (name) => JSON.parse(fixture(name));

const METADATA = json("boe-metadatos-BOE-A-2008-3580.json");
const INDEX = json("boe-indice-BOE-A-2008-3580.json");
const INTERIOR = fixture("interior-wayback.html");
const AEAT = fixture("aeat-personas-juridicas.html");
const INTERIOR_SECTION = {
  from: 'class="piece-heading"',
  to: 'class="col-lg-3 order-lg-first',
};
const AEAT_SECTION = { from: 'id="acc-main"', to: "<!--MODAL IMPRESI" };
const INTERIOR_URL =
  "https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/calculo-del-digito-de-control-del-nif-nie/";

/** A source of each kind, as in spec-sources.json. */
const CONSOLIDATED = {
  id: "orden-eha-451-2008",
  name: "Orden EHA/451/2008",
  short: "Orden EHA/451/2008",
  tier: "T1",
  kind: "boe-consolidated",
  boeId: "BOE-A-2008-3580",
  url: "https://www.boe.es/buscar/act.php?id=BOE-A-2008-3580",
  articles: ["Artículo 3"],
  citedBy: "CIF-2",
  recorded: {
    "last update": "2016-01-15",
    repealed: "N",
    annulled: "N",
    expired: "N",
    "Artículo 3": "2016-01-15",
  },
  checked: "2026-10-02",
};
const DOCUMENT = {
  id: "orden-hap-5-2016",
  name: "Orden HAP/5/2016",
  tier: "T1",
  kind: "boe-document",
  boeId: "BOE-A-2016-358",
  url: "https://www.boe.es/buscar/doc.php?id=BOE-A-2016-358",
  citedBy: "CIF-2",
};
const PAGE = {
  id: "interior-nif-nie",
  name: "Interior | check letter",
  short: "Interior",
  tier: "T2",
  kind: "page",
  url: INTERIOR_URL,
  section: INTERIOR_SECTION,
  citedBy: "DNI-2, NIE-2",
};

/** A Response-like object. */
function answer(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => body };
}

/**
 * A fake `fetch` that answers from a table of URL → body or status (a
 * function of the call number is allowed), and records the calls.
 */
function fakeFetch(routes) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    for (const [prefix, route] of Object.entries(routes)) {
      if (url.startsWith(prefix)) {
        const value =
          typeof route === "function"
            ? route(calls.filter((c) => c.url.startsWith(prefix)).length)
            : route;
        if (value instanceof Error) throw value;
        return typeof value === "number" ? answer("", value) : answer(value);
      }
    }
    throw new Error(`no route for ${url}`);
  };
  return { fetch, calls };
}

const noSleep = { sleep: async () => {} };

const BOE_API = "https://www.boe.es/datosabiertos/api/legislacion-consolidada";
const ROUTES = {
  [`${BOE_API}/id/BOE-A-2008-3580/metadatos`]: JSON.stringify(METADATA),
  [`${BOE_API}/id/BOE-A-2008-3580/texto/indice`]: JSON.stringify(INDEX),
  "https://www.boe.es/diario_boe/xml.php?id=BOE-A-2016-358": fixture(
    "boe-diario-BOE-A-2016-358.xml"
  ),
  [INTERIOR_URL]: 403,
  "https://archive.org/wayback/available": fixture("wayback-available.json"),
  "https://web.archive.org/web/20260228172549id_/": INTERIOR,
};

describe("reading the BOE answers", () => {
  it("turns BOE dates into ISO dates", () => {
    expect(boeDate("20070905")).toBe("2007-09-05");
    expect(boeDate("20260930T113513Z")).toBe("2026-09-30");
    expect(() => boeDate("yesterday")).toThrow("not a BOE date");
  });

  it("takes the last update of a consolidated text from its blocks, not from its metadata", () => {
    // `fecha_actualizacion` of the metadata is 2025-12-19 (a reprocessing);
    // act.php says "Última actualización, publicada el 15/01/2016".
    expect(consolidatedValues(METADATA, INDEX)).toEqual({
      "last update": "2016-01-15",
      repealed: "N",
      annulled: "N",
      expired: "N",
    });
  });

  it("records the date of every cited article, and 'not found' for a missing one", () => {
    const values = consolidatedValues(METADATA, INDEX, [
      "Artículo 3",
      "Artículo 1",
      "Artículo 9",
    ]);
    expect(values["Artículo 3"]).toBe("2016-01-15");
    expect(values["Artículo 1"]).toBe("2008-02-26");
    expect(values["Artículo 9"]).toBe("not found");
  });

  it("matches a title written with a no-break space, and joins repeated titles", () => {
    const index = {
      data: [
        {
          bloque: [
            { titulo: "Artículo 205", fecha_actualizacion: "20241120" },
            { titulo: "Anexo", fecha_actualizacion: "20200101" },
            { titulo: "Anexo", fecha_actualizacion: "20210101" },
          ],
        },
      ],
    };
    expect(
      consolidatedValues(METADATA, index, ["Artículo 205", "Anexo"])
    ).toMatchObject({
      "last update": "2024-11-20",
      "Artículo 205": "2024-11-20",
      Anexo: "2020-01-01, 2021-01-01",
    });
  });

  it("accepts a single block instead of a list (the API does that)", () => {
    const index = {
      data: { bloque: { titulo: "Primero", fecha_actualizacion: "19970215" } },
    };
    expect(consolidatedValues({ data: METADATA.data[0] }, index)).toMatchObject(
      { "last update": "1997-02-15" }
    );
  });

  it("rejects an answer that is not the API's", () => {
    expect(() => consolidatedValues({}, INDEX)).toThrow("unexpected answer");
    expect(() => consolidatedValues(METADATA, { data: [{}] })).toThrow(
      "unexpected answer"
    );
    expect(() => consolidatedValues(null, null)).toThrow("unexpected answer");
  });

  it("reads the flags and the later references of a document the BOE does not consolidate", () => {
    expect(documentValues(fixture("boe-diario-BOE-A-2016-358.xml"))).toEqual({
      repealed: "N",
      annulled: "N",
      expired: "N",
      "later references": "none",
    });
    expect(
      documentValues(fixture("boe-diario-BOE-A-2008-3580.xml"))[
        "later references"
      ]
    ).toBe(
      "SE MODIFICA el art. 3, por Orden HAP/5/2016, de 12 de enero (BOE-A-2016-358)"
    );
  });

  it("lists every later reference, and decodes their entities", () => {
    const xml = `<documento><estatus_derogacion>S</estatus_derogacion>
      <judicialmente_anulada>N</judicialmente_anulada><vigencia_agotada/>
      <posteriores>
        <posterior referencia="BOE-A-2030-1" orden=""><palabra codigo="210">SE DEROGA</palabra><texto>por R&amp;D 1/2030</texto></posterior>
        <posterior><palabra>CORRECCIÓN de errores</palabra><texto/></posterior>
      </posteriores></documento>`;
    expect(documentValues(xml)).toEqual({
      repealed: "S",
      annulled: "N",
      expired: "",
      "later references":
        "SE DEROGA por R&D 1/2030 (BOE-A-2030-1); CORRECCIÓN de errores  (?)",
    });
  });

  it("rejects a document without its flags", () => {
    expect(() => documentValues("<documento/>")).toThrow(
      "no <estatus_derogacion>"
    );
  });
});

describe("the section of a T2 page", () => {
  it("decodes numeric and Spanish named entities, and keeps unknown ones", () => {
    expect(
      decodeEntities(
        "&Aacute;&aacute;&ntilde;&Ntilde;&uuml;&ccedil;&nbsp;&#8594;&#x2192;&raquo;&bogus;"
      )
    ).toBe("ÁáñÑüç\u00a0→→»&bogus;");
  });

  it("cuts the section from the tag of the first marker to the tag of the second", () => {
    const html =
      '<nav>menu</nav><main id="acc-main"><p>text</p><!--MODAL IMPRESIÓN--><footer>';
    expect(extractSection(html, AEAT_SECTION)).toBe(
      '<main id="acc-main"><p>text</p>'
    );
    // Markers outside a tag work too.
    expect(
      extractSection("abc START def END ghi", { from: "START", to: "END" })
    ).toBe("START def ");
  });

  it("returns null when a marker is missing", () => {
    expect(extractSection("<main>", AEAT_SECTION)).toBeNull();
    expect(extractSection('<main id="acc-main">', AEAT_SECTION)).toBeNull();
    // The second marker only counts after the first.
    expect(
      extractSection('<!--MODAL IMPRESI--><main id="acc-main">', AEAT_SECTION)
    ).toBeNull();
  });

  it("normalises to the visible text", () => {
    expect(
      normaliseText(`<div class="a">
        <script>var date = "2026-10-02";</script><style>p{}</style>
        <!-- a comment --><p>Se&nbsp;divide   el
        n&uacute;mero</p><td>23</td></div>`)
    ).toBe("Se divide el número 23");
  });

  it("gives the Interior section's text (the check-letter table)", () => {
    const text = normaliseText(extractSection(INTERIOR, INTERIOR_SECTION));
    expect(text).toMatch(/^Cálculo del dígito de control del NIF\/NIE /);
    expect(text).toContain(
      "LETRA T R W A G M Y F P D X B RESTO 12 13 14 15 16 17 18 19 20 21 22 LETRA N J Z S Q V H L C K E"
    );
    expect(text).toMatch(/y se aplica el mismo algoritmo que para el NIF\.$/);
    // Nothing of the menus or the scripts around it.
    expect(text).not.toContain("Trámites y Gestiones");
  });

  it("hashes the section, so the page chrome doesn't change the hash", () => {
    const values = pageValues(AEAT, AEAT_SECTION);
    expect(values["section hash"]).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(values["section length"]).toMatch(/^\d+ characters$/);
    // The "page updated" date of the footer, a menu, a script and the
    // markup of the section are not the content.
    const chrome = AEAT.replace(
      /<time datetime="[^"]*">[^<]*<\/time>/,
      '<time datetime="2030-01-01">1/enero/2030</time>'
    )
      .replace("Migas navegación", "Otra navegación")
      .replace("</head>", "<script>window.x = 1;</script></head>")
      .replace("<h1 ", '<h1 data-x="1" ');
    expect(chrome).not.toBe(AEAT);
    expect(pageValues(chrome, AEAT_SECTION)).toEqual(values);
  });

  it("changes the hash when the text of the section changes", () => {
    const values = pageValues(INTERIOR, INTERIOR_SECTION);
    const edited = INTERIOR.replace("<td>T</td>", "<td>I</td>");
    expect(edited).not.toBe(INTERIOR);
    expect(pageValues(edited, INTERIOR_SECTION)["section hash"]).not.toBe(
      values["section hash"]
    );
  });

  it("keeps the hash when an accent is written as an entity", () => {
    const html = '<main id="acc-main"><p>número</p><!--MODAL IMPRESIÓN-->';
    expect(pageValues(html.replace("ú", "&uacute;"), AEAT_SECTION)).toEqual(
      pageValues(html, AEAT_SECTION)
    );
    expect(pageValues(html, AEAT_SECTION)["section hash"]).toBe(
      sha256("número")
    );
  });

  it("records 'not found' when the markers are not in the page", () => {
    expect(pageValues("<html>Just a moment...</html>", AEAT_SECTION)).toEqual({
      "section hash": "not found",
      "section length": "not found",
    });
  });
});

const read = (values, via = "BOE open data API") => ({ ok: true, values, via });

describe("comparing", () => {
  it("finds nothing when the values are the same", () => {
    const entry = compareSource(CONSOLIDATED, read(CONSOLIDATED.recorded));
    expect(entry.status).toBe("unchanged");
    expect(entry.changes).toEqual([]);
    expect(entry.note).toBeUndefined();
  });

  it("lists every changed, new and dropped value", () => {
    const { "Artículo 3": _, ...rest } = CONSOLIDATED.recorded;
    const entry = compareSource(
      CONSOLIDATED,
      read({ ...rest, repealed: "S", extra: "x" })
    );
    expect(entry.status).toBe("changed");
    expect(entry.changes).toEqual([
      { field: "repealed", old: "N", new: "S" },
      { field: "Artículo 3", old: "2016-01-15", new: null },
      { field: "extra", old: null, new: "x" },
    ]);
  });

  it("treats a source with nothing recorded as changed", () => {
    const entry = compareSource(DOCUMENT, read({ repealed: "N" }));
    expect(entry.changes).toEqual([{ field: "repealed", old: null, new: "N" }]);
  });

  it("notes when only the whole text changed, not the cited articles", () => {
    const later = { ...CONSOLIDATED.recorded, "last update": "2030-01-01" };
    expect(compareSource(CONSOLIDATED, read(later)).note).toMatch(
      /^Only the date of the whole consolidated text changed/
    );
    // Not when an article changed too, nor when no article is cited.
    expect(
      compareSource(
        CONSOLIDATED,
        read({ ...later, "Artículo 3": "2030-01-01" })
      ).note
    ).toBeUndefined();
    expect(
      compareSource({ ...CONSOLIDATED, articles: undefined }, read(later)).note
    ).toBeUndefined();
  });

  it("reports a source that couldn't be read as unverifiable", () => {
    expect(compareSource(PAGE, { ok: false, reason: "HTTP 403" })).toEqual({
      source: PAGE,
      status: "unverifiable",
      reason: "HTTP 403",
    });
  });

  it("counts the statuses", () => {
    const file = { sources: [CONSOLIDATED, DOCUMENT, PAGE] };
    const comparison = compareAll(file, [
      read(CONSOLIDATED.recorded),
      read({ repealed: "N" }),
      { ok: false, reason: "timeout" },
    ]);
    expect(comparison).toMatchObject({
      changed: 1,
      unchanged: 1,
      unverifiable: 1,
    });
    expect(comparison.entries.map((e) => e.status)).toEqual([
      "unchanged",
      "changed",
      "unverifiable",
    ]);
  });
});

describe("the fingerprint and the issue title", () => {
  const changedOn = (value) =>
    compareAll({ sources: [CONSOLIDATED] }, [
      read({ ...CONSOLIDATED.recorded, repealed: value }),
    ]);

  it("are null when nothing changed", () => {
    const comparison = compareAll({ sources: [CONSOLIDATED] }, [
      read(CONSOLIDATED.recorded),
    ]);
    expect(fingerprintOf(comparison)).toBeNull();
    expect(issueTitle(comparison)).toBeNull();
  });

  it("is the same for the same changes, and differs for others", () => {
    expect(fingerprintOf(changedOn("S"))).toMatch(/^[0-9a-f]{12}$/);
    expect(fingerprintOf(changedOn("S"))).toBe(fingerprintOf(changedOn("S")));
    expect(fingerprintOf(changedOn("P"))).not.toBe(
      fingerprintOf(changedOn("S"))
    );
  });

  it("names the changed sources, and says when the run is simulated", () => {
    const comparison = changedOn("S");
    const fingerprint = fingerprintOf(comparison);
    expect(issueTitle(comparison)).toBe(
      `Official source changed: Orden EHA/451/2008 (${fingerprint})`
    );
    expect(issueTitle(comparison, { simulated: true })).toBe(
      `[simulated] Official source changed: Orden EHA/451/2008 (${fingerprint})`
    );
  });

  it("names three sources at most, and uses the id without a short name", () => {
    const sources = ["a", "b", "c", "d", "e"].map((id) => ({ id }));
    const comparison = compareAll(
      { sources },
      sources.map(() => read({ x: "1" }))
    );
    expect(issueTitle(comparison)).toMatch(
      /^Official source changed: a, b, c and 2 more \([0-9a-f]{12}\)$/
    );
  });
});

describe("the report", () => {
  const file = { sources: [CONSOLIDATED, DOCUMENT, PAGE] };

  it("shows the old and new values of a change, what to do, and the fingerprint", () => {
    const comparison = compareAll(file, [
      read({ ...CONSOLIDATED.recorded, "last update": "2030-01-01" }),
      read(
        { "later references": "SE MODIFICA | art. 3\nby X" },
        "BOE document XML"
      ),
      { ok: false, reason: "HTTP 403; Wayback Machine: HTTP 429" },
    ]);
    const report = renderReport(comparison, { date: "2030-02-01" });
    expect(report).toContain("## Official sources check, 2030-02-01");
    expect(report).toContain("**2 changed · 0 unchanged · 1 unverifiable**");
    expect(report).toContain(
      "#### [Orden EHA/451/2008](https://www.boe.es/buscar/act.php?id=BOE-A-2008-3580) (T1)"
    );
    expect(report).toContain(
      "Cited by: CIF-2. Read from: BOE open data API. Recorded on: 2026-10-02."
    );
    expect(report).toContain("| last update | 2016-01-15 | 2030-01-01 |");
    expect(report).toContain("Only the date of the whole consolidated text");
    // A source never recorded, and a value with a pipe and a new line.
    expect(report).toContain("Recorded on: never.");
    expect(report).toContain(
      "| later references | (none) | SE MODIFICA \\| art. 3 by X |"
    );
    expect(report).toContain("### What to do");
    expect(report).toContain("`pnpm spec:sources:update`");
    expect(report).toContain(
      "- [Interior | check letter](https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/calculo-del-digito-de-control-del-nif-nie/) (T2): HTTP 403; Wayback Machine: HTTP 429"
    );
    expect(report).not.toContain("### Unchanged");
    expect(report).not.toContain("Simulated run");
    expect(report).toContain(
      `<!-- ${FINGERPRINT_PREFIX} ${fingerprintOf(comparison)} -->`
    );
  });

  it("lists the unchanged sources, with no changes, issue text or fingerprint", () => {
    const comparison = compareAll(file, [
      read(CONSOLIDATED.recorded),
      read({}, "BOE document XML"),
      read({}, "Wayback Machine snapshot of 2026-02-28 (live page: HTTP 403)"),
    ]);
    const report = renderReport(comparison, { date: "2030-02-01" });
    expect(report).toContain("**0 changed · 3 unchanged · 0 unverifiable**");
    expect(report).toContain(
      "| [Orden HAP/5/2016](https://www.boe.es/buscar/doc.php?id=BOE-A-2016-358) | T1 | BOE document XML | (none) |"
    );
    expect(report).toContain(
      "| T2 | Wayback Machine snapshot of 2026-02-28 (live page: HTTP 403) | (none) |"
    );
    expect(report).not.toMatch(/### (Changed|Unverifiable|What to do)/);
    expect(report).not.toContain(FINGERPRINT_PREFIX);
  });

  it("warns that a simulated run is a test", () => {
    const comparison = compareAll(simulateChange({ sources: [CONSOLIDATED] }), [
      read(CONSOLIDATED.recorded),
    ]);
    const report = renderReport(comparison, {
      date: "2030-02-01",
      simulated: true,
    });
    expect(report).toContain("> [!WARNING]");
    expect(report).toContain(
      `| last update | ${SIMULATED_VALUE} | 2016-01-15 |`
    );
  });
});

describe("updating and simulating", () => {
  it("records what was read, and keeps an unverifiable source as it was", () => {
    const file = { $comment: "c", sources: [CONSOLIDATED, PAGE] };
    const values = { ...CONSOLIDATED.recorded, repealed: "S" };
    const updated = updatedFile(
      file,
      [read(values), { ok: false, reason: "timeout" }],
      "2030-02-01"
    );
    expect(updated.$comment).toBe("c");
    expect(updated.sources[0]).toEqual({
      ...CONSOLIDATED,
      recorded: values,
      checked: "2030-02-01",
      checkedVia: "BOE open data API",
    });
    expect(updated.sources[1]).toBe(PAGE);
  });

  it("changes the first recorded value of a copy", () => {
    const file = { sources: [DOCUMENT, CONSOLIDATED] };
    const simulated = simulateChange(file);
    expect(simulated.sources[1].recorded["last update"]).toBe(SIMULATED_VALUE);
    expect(CONSOLIDATED.recorded["last update"]).toBe("2016-01-15");
    expect(() => simulateChange({ sources: [DOCUMENT] })).toThrow(
      "no recorded value"
    );
  });
});

describe("fetching", () => {
  it("sends the project's User-Agent and returns the text", async () => {
    const { fetch, calls } = fakeFetch({ "https://x/": "body" });
    await expect(
      fetchText("https://x/", { fetch, accept: "a/b" })
    ).resolves.toBe("body");
    expect(calls[0].init.headers).toEqual({
      "User-Agent": USER_AGENT,
      Accept: "a/b",
    });
    expect(calls[0].init.signal).toBeInstanceOf(AbortSignal);
  });

  it("retries rate limits, server errors and network errors with a back-off", async () => {
    const sleep = vi.fn(async () => {});
    const { fetch, calls } = fakeFetch({
      "https://x/": (n) => [429, new Error("socket hang up"), "body"][n - 1],
    });
    await expect(fetchText("https://x/", { fetch, sleep })).resolves.toBe(
      "body"
    );
    expect(calls).toHaveLength(3);
    expect(sleep.mock.calls).toEqual([[2000], [5000]]);
  });

  it("gives up after the last try, with the last problem", async () => {
    const { fetch, calls } = fakeFetch({ "https://x/": 503 });
    await expect(
      fetchText("https://x/", { fetch, ...noSleep })
    ).rejects.toThrow("https://x/: HTTP 503");
    expect(calls).toHaveLength(3);
    const cause = new Error("fetch failed", {
      cause: new Error("getaddrinfo ENOTFOUND x"),
    });
    await expect(
      fetchText("https://x/", {
        fetch: async () => {
          throw cause;
        },
        ...noSleep,
      })
    ).rejects.toThrow("https://x/: getaddrinfo ENOTFOUND x");
    await expect(
      fetchText("https://x/", {
        fetch: async () => {
          throw "odd";
        },
        ...noSleep,
      })
    ).rejects.toThrow("https://x/: odd");
  });

  it("doesn't retry a 403 or a 404", async () => {
    const { fetch, calls } = fakeFetch({ "https://x/": 403 });
    await expect(
      fetchText("https://x/", { fetch, ...noSleep })
    ).rejects.toThrow("HTTP 403");
    expect(calls).toHaveLength(1);
  });
});

describe("reading a source", () => {
  it("reads a consolidated text from the BOE API", async () => {
    const { fetch, calls } = fakeFetch(ROUTES);
    await expect(readSource(CONSOLIDATED, { fetch })).resolves.toEqual({
      ok: true,
      values: CONSOLIDATED.recorded,
      via: "BOE open data API",
    });
    expect(calls.map((c) => c.init.headers.Accept)).toEqual([
      "application/json",
      "application/json",
    ]);
  });

  it("reads a document from its XML", async () => {
    const { fetch } = fakeFetch(ROUTES);
    await expect(readSource(DOCUMENT, { fetch })).resolves.toMatchObject({
      ok: true,
      values: { "later references": "none" },
      via: "BOE document XML",
    });
  });

  it("reads a page live when it answers", async () => {
    const { fetch } = fakeFetch({ ...ROUTES, [INTERIOR_URL]: INTERIOR });
    await expect(readSource(PAGE, { fetch })).resolves.toEqual({
      ok: true,
      values: pageValues(INTERIOR, INTERIOR_SECTION),
      via: "live page",
    });
  });

  it("falls back to the latest Wayback Machine snapshot when the page answers 403", async () => {
    const { fetch, calls } = fakeFetch(ROUTES);
    const result = await readSource(PAGE, { fetch, ...noSleep });
    expect(result).toEqual({
      ok: true,
      values: pageValues(INTERIOR, INTERIOR_SECTION),
      via: "Wayback Machine snapshot of 2026-02-28 (live page: HTTP 403)",
    });
    expect(calls.map((c) => c.url)).toEqual([
      INTERIOR_URL,
      `https://archive.org/wayback/available?url=${encodeURIComponent(INTERIOR_URL)}`,
      `https://web.archive.org/web/20260228172549id_/${INTERIOR_URL}`,
    ]);
  });

  it("is unverifiable, without throwing, when the archive can't help either", async () => {
    const cases = [
      [
        {
          "https://archive.org/wayback/available": fixture(
            "wayback-unavailable.json"
          ),
        },
        "HTTP 403; Wayback Machine: no snapshot of the page",
      ],
      [
        { "https://archive.org/wayback/available": 429 },
        "HTTP 403; Wayback Machine: https://archive.org/wayback/available?url=",
      ],
      [
        { "https://web.archive.org/web/20260228172549id_/": 404 },
        "HTTP 403; Wayback Machine: https://web.archive.org/web/20260228172549id_/",
      ],
    ];
    for (const [routes, reason] of cases) {
      const { fetch } = fakeFetch({ ...ROUTES, ...routes });
      const result = await readSource(PAGE, { fetch, ...noSleep });
      expect(result.ok).toBe(false);
      expect(result.reason).toContain(reason);
    }
  });

  it("is unverifiable when the BOE answers something else, or for an unknown kind", async () => {
    const { fetch } = fakeFetch({
      [`${BOE_API}/id/BOE-A-2008-3580/metadatos`]: "<html>maintenance</html>",
    });
    const result = await readSource(CONSOLIDATED, { fetch });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/JSON/);
    await expect(readSource({ kind: "rss" })).resolves.toEqual({
      ok: false,
      reason: "unknown kind of source: rss",
    });
  });
});

describe("the command line", () => {
  it("parses the options", () => {
    expect(parseArgs([])).toMatchObject({
      update: false,
      simulate: false,
      report: null,
      result: null,
    });
    expect(
      parseArgs([
        "--update",
        "--report",
        "r.md",
        "--result",
        "r.json",
        "--file",
        "f.json",
      ])
    ).toEqual({
      update: true,
      simulate: false,
      report: "r.md",
      result: "r.json",
      file: "f.json",
    });
    expect(parseArgs(["--simulate-change"]).simulate).toBe(true);
    expect(() => parseArgs(["--report"])).toThrow("--report needs a value");
    expect(() => parseArgs(["--force"])).toThrow("unknown option: --force");
    expect(() => parseArgs(["--update", "--simulate-change"])).toThrow(
      "can't be used together"
    );
  });

  /** Runs the command on an in-memory spec-sources.json. */
  async function runOn(file, argv) {
    const files = { "f.json": JSON.stringify(file) };
    const output = [];
    const log = [];
    const { fetch } = fakeFetch(ROUTES);
    const result = await run(["--file", "f.json", ...argv], {
      date: "2030-02-01",
      fetch,
      ...noSleep,
      read: (path) => files[path],
      write: (path, text) => {
        files[path] = text;
      },
      out: (text) => output.push(text),
      log: (line) => log.push(line),
    });
    return { result, files, output: output.join(""), log };
  }

  it("prints the report, and writes nothing, when nothing changed", async () => {
    const { result, files, output, log } = await runOn(
      { sources: [CONSOLIDATED] },
      []
    );
    expect(result).toEqual({
      changed: 0,
      unchanged: 1,
      unverifiable: 0,
      fingerprint: null,
      title: null,
    });
    expect(output).toContain("**0 changed · 1 unchanged · 0 unverifiable**");
    expect(Object.keys(files)).toEqual(["f.json"]);
    expect(log).toEqual([
      "orden-eha-451-2008: read (BOE open data API)",
      "0 changed, 1 unchanged, 0 unverifiable.",
    ]);
  });

  it("writes the report and the result for the workflow, for a simulated change", async () => {
    const { result, files, output } = await runOn(
      {
        sources: [
          CONSOLIDATED,
          { ...PAGE, recorded: pageValues(INTERIOR, INTERIOR_SECTION) },
        ],
      },
      ["--simulate-change", "--report", "r.md", "--result", "r.json"]
    );
    expect(output).toBe("");
    expect(result.changed).toBe(1);
    expect(result.title).toMatch(/^\[simulated\] Official source changed/);
    expect(JSON.parse(files["r.json"])).toEqual(result);
    expect(files["r.md"]).toContain(`| last update | ${SIMULATED_VALUE} |`);
    // The file itself is never changed by a simulation.
    expect(JSON.parse(files["f.json"]).sources[0]).toEqual(CONSOLIDATED);
  });

  it("records the values with --update, and logs an unverifiable source", async () => {
    const broken = { ...DOCUMENT, boeId: "BOE-A-0000-0" };
    const { files, log } = await runOn({ sources: [DOCUMENT, broken] }, [
      "--update",
    ]);
    const updated = JSON.parse(files["f.json"]);
    expect(updated.sources[0]).toMatchObject({
      recorded: { "later references": "none" },
      checked: "2030-02-01",
      checkedVia: "BOE document XML",
    });
    expect(updated.sources[1]).toEqual(broken);
    expect(files["f.json"].endsWith("}\n")).toBe(true);
    expect(log).toContain(
      "orden-hap-5-2016: unverifiable (https://www.boe.es/diario_boe/xml.php?id=BOE-A-0000-0: no route for https://www.boe.es/diario_boe/xml.php?id=BOE-A-0000-0)"
    );
    expect(log).toContain("Recorded the values read on 2030-02-01 in f.json.");
  });
});
