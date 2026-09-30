#!/usr/bin/env node
// Writes the generated parts of README.md and README.es.md from
// bench/results/latest.json (#53), so no number in them is typed by hand:
//
// - `<!-- size-badge:start -->…<!-- size-badge:end -->`: the bundle size badge;
// - `<!-- bench:start -->…<!-- bench:end -->`: the Performance section
//   (throughput, the speed-up against v1.0.11, bundle sizes, agreement with
//   SPEC.md, the machine);
// - `<!-- compare:start -->…<!-- compare:end -->`: the comparison table,
//   with the features in COMPARISON below and the versions and sizes from the
//   JSON.
//
//   pnpm readme:bench           rewrite both READMEs
//   pnpm readme:bench --check   fail if either README is out of date
//
// No dependencies. The method behind the numbers is bench/README.md.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const RESULTS = "bench/results/latest.json";
const TARGETS = [
  { file: "README.md", lang: "en" },
  { file: "README.es.md", lang: "es" },
];

// The date the features, the release dates and the notes of COMPARISON were
// last checked against each library's README, package.json and npm page.
const CHECKED_ON = "2026-10-01";

const YES = { en: "yes", es: "sí" };
const NO = { en: "no", es: "no" };
const PARTIAL = { en: "partial", es: "parcial" };
const ESM_CJS = "ESM + CJS";

/**
 * The comparison table: one row per benchmarked library (`id` in
 * latest.json), in this order. Update CHECKED_ON when you check it again.
 * A cell is a string (the same in every language) or `{ en, es }`.
 */
const COMPARISON = [
  {
    id: "current",
    types: "DNI, NIE, CIF, K/L/M",
    klm: YES,
    normalizes: YES,
    result: {
      en: "yes: code, SPEC rule, message",
      es: "sí: código, regla de SPEC, mensaje",
    },
    messages: "EN, ES, CA, EU, GL",
    generators: YES,
    schemas: "Zod, Valibot, Yup",
    modules: ESM_CJS,
    released: { en: "this release", es: "esta versión" },
  },
  {
    id: "spain-id",
    types: "DNI, NIE, CIF",
    klm: NO,
    normalizes: PARTIAL,
    result: { en: "no (type only)", es: "no (solo el tipo)" },
    messages: NO,
    generators: NO,
    schemas: NO,
    modules: ESM_CJS,
    released: "2026-06-12",
  },
  {
    id: "better-dni",
    types: "DNI, NIE",
    klm: NO,
    normalizes: { en: "separate `normalize()`", es: "`normalize()` aparte" },
    result: NO,
    messages: NO,
    generators: YES,
    schemas: NO,
    modules: { en: "CJS / UMD only", es: "solo CJS / UMD" },
    released: "2021-05-30",
  },
  {
    id: "dni-js",
    types: "DNI, NIE",
    klm: NO,
    normalizes: PARTIAL,
    result: NO,
    messages: NO,
    generators: NO,
    schemas: NO,
    modules: { en: "CJS only", es: "solo CJS" },
    released: "2026-08-08",
  },
  {
    id: "stdnum",
    types: {
      en: "DNI, NIE, CIF, K/L/M, and about 90 countries",
      es: "DNI, NIE, CIF, K/L/M y unos 90 países",
    },
    klm: YES,
    normalizes: YES,
    result: { en: "yes: error class", es: "sí: clase de error" },
    messages: { en: "English only", es: "solo inglés" },
    generators: NO,
    schemas: NO,
    modules: ESM_CJS,
    released: "2026-08-01",
  },
  {
    id: "validator-identity-card",
    types: "DNI, NIE",
    klm: NO,
    normalizes: NO,
    result: NO,
    messages: NO,
    generators: NO,
    schemas: NO,
    modules: {
      en: "ESM (deep imports) + CJS",
      es: "ESM (rutas internas) + CJS",
    },
    released: "2026-04-02",
  },
  {
    id: "validator-tax-id",
    types: "DNI, NIE, K/L/M",
    klm: YES,
    normalizes: NO,
    result: NO,
    messages: NO,
    generators: NO,
    schemas: NO,
    modules: {
      en: "ESM (deep imports) + CJS",
      es: "ESM (rutas internas) + CJS",
    },
    released: "2026-04-02",
  },
  {
    id: "maistik",
    types: "DNI, NIE, CIF",
    klm: NO,
    normalizes: PARTIAL,
    result: {
      en: "partial: `parse()`, without the reason",
      es: "parcial: `parse()`, sin el motivo",
    },
    messages: NO,
    generators: NO,
    schemas: NO,
    modules: ESM_CJS,
    released: "2026-06-14",
  },
  {
    id: "kreyo",
    types: "DNI, NIE, CIF",
    klm: { en: "opt-in", es: "opcional" },
    normalizes: PARTIAL,
    result: NO,
    messages: NO,
    generators: NO,
    schemas: NO,
    modules: ESM_CJS,
    released: "2026-04-29",
  },
  {
    id: "jsvat",
    types: {
      en: "EU VAT numbers (ES + NIF)",
      es: "NIF-IVA de la UE (ES + NIF)",
    },
    klm: YES,
    normalizes: YES,
    result: { en: "yes: validity and country", es: "sí: validez y país" },
    messages: NO,
    generators: NO,
    schemas: NO,
    modules: ESM_CJS,
    released: { en: "2024-12-12, deprecated", es: "2024-12-12, obsoleto" },
  },
];

const TEXT = {
  en: {
    library: "Library",
    thisBuild: "this build",
    unsupported: "*unsupported*",
    measured: (r, commit) =>
      `Measured with \`pnpm bench:competitors\` on ${r.machine.cpu} (${r.machine.cores} cores, ${r.machine.memoryGiB} GiB, ${r.machine.os}, ${r.machine.arch}), Node.js ${r.node}, on ${r.generatedAt.slice(0, 10)}, at commit ${commit}. Every number in this section comes from [\`bench/results/latest.json\`](bench/results/latest.json) and is written by \`pnpm readme:bench\`. How they are measured, and the caveats: [bench/README.md](bench/README.md). Full results: [bench/results/latest.md](bench/results/latest.md).`,
    throughputTitle: "#### Throughput",
    throughputIntro: (r) =>
      `Millions of validations per second (**M ops/s, higher is faster**): the median of ${r.config.rounds} rounds, each library with its default options, on valid and invalid documents in canonical form (${r.inputSets.DNI.count} DNI, ${r.inputSets.NIE.count} NIE, ${r.inputSets.CIF.count} CIF). *unsupported*: the library has no validator for that type. Absolute numbers depend on the machine; the ratios are what carries over.`,
    speedup: (parts) => `Against v1.0.11, this build is ${parts} as fast.`,
    and: "and",
    faster: (list) => `Faster than this build on a set: ${list}.`,
    noneFaster: "No other library was faster on any of these sets.",
    sizeTitle: "#### Bundle size",
    sizeIntro:
      "Minified and gzipped (**min+gzip, lower is smaller**): one validator of each type, bundled with esbuild as `pnpm size` does, and the whole library.",
    sizeHeader: ["DNI", "NIE", "CIF", "Any type", "Whole library"],
    smaller: (list) =>
      `Smaller than this build for one validator of any type: ${list}.`,
    noneSmaller: "No other library is smaller for one validator of any type.",
    alternative: (label, size) => `Also measured, ${label}: ${size}.`,
    sizeWhy:
      "Some of the smaller libraries validate fewer types. This package spends bytes on input normalization (NORM-1 to NORM-4), the CIF-3 control types and K/L/M support. Libraries published only as CommonJS can't be tree-shaken, so one function costs the whole library. Multi-country and multi-purpose libraries (stdnum, validator.js) are larger by design.",
    accuracyTitle: "#### Agreement with SPEC.md",
    accuracyIntro: (r) =>
      `The share of the ${r.accuracy.fixtures.total} fixtures of \`test/fixtures\` (default options) that each library judges as SPEC.md does, valid or invalid. **This is agreement with SPEC.md, not correctness in the absolute**: the maintainers of this package wrote the rules and the fixtures, so it agrees with them by construction. Many disagreements are decisions that SPEC.md documents (for example CIF-3, or accepting the old NIE form); latest.md lists them per library. "Canonical input" leaves out the fixtures that need normalization.`,
    accuracyHeader: ["DNI", "NIE", "CIF", "K/L/M", "All", "Canonical input"],
    compareIntro: (date) =>
      `Checked on ${date}, from each library's README, its package.json and npm page, and the benchmark above (versions and sizes come from latest.json).`,
    compareHeader: [
      "Types",
      "K/L/M",
      "Normalizes input",
      "Result object",
      "Localized messages",
      "Test-data generators",
      "Schemas",
      "Modules",
      "Size, any type (min+gzip)",
      "Last release",
    ],
    badgeAlt: (bytes) => `isValidNif: ${bytes} min+gzip`,
    anchor: "#performance",
  },
  es: {
    library: "Biblioteca",
    thisBuild: "esta versión",
    unsupported: "*no admitido*",
    measured: (r, commit) =>
      `Medido con \`pnpm bench:competitors\` en un ${r.machine.cpu} (${r.machine.cores} núcleos, ${r.machine.memoryGiB} GiB, ${r.machine.os}, ${r.machine.arch}), con Node.js ${r.node}, el ${r.generatedAt.slice(0, 10)}, en el commit ${commit}. Todos los números de esta sección salen de [\`bench/results/latest.json\`](bench/results/latest.json) y los escribe \`pnpm readme:bench\`. Cómo se miden y sus limitaciones: [bench/README.md](bench/README.md) (en inglés). Resultados completos: [bench/results/latest.md](bench/results/latest.md).`,
    throughputTitle: "#### Velocidad",
    throughputIntro: (r) =>
      `Millones de validaciones por segundo (**M ops/s, más es más rápido**): la mediana de ${r.config.rounds} rondas, cada biblioteca con sus opciones por defecto, con documentos válidos y no válidos en forma canónica (${r.inputSets.DNI.count} DNI, ${r.inputSets.NIE.count} NIE, ${r.inputSets.CIF.count} CIF). *no admitido*: la biblioteca no valida ese tipo. Los números absolutos dependen de la máquina; lo que se mantiene son las proporciones.`,
    speedup: (parts) =>
      `Frente a la v1.0.11, esta versión es ${parts} más rápida.`,
    and: "y",
    faster: (list) =>
      `Más rápidas que esta versión en algún conjunto: ${list}.`,
    noneFaster:
      "Ninguna otra biblioteca fue más rápida en ninguno de estos conjuntos.",
    sizeTitle: "#### Tamaño",
    sizeIntro:
      "Minificado y comprimido con gzip (**min+gzip, menos es más pequeño**): un validador de cada tipo, empaquetado con esbuild como hace `pnpm size`, y la biblioteca completa.",
    sizeHeader: ["DNI", "NIE", "CIF", "Cualquier tipo", "Biblioteca completa"],
    smaller: (list) =>
      `Más pequeñas que esta versión para un validador de cualquier tipo: ${list}.`,
    noneSmaller:
      "Ninguna otra biblioteca es más pequeña para un validador de cualquier tipo.",
    alternative: (label, size) => `También medido, ${label}: ${size}.`,
    sizeWhy:
      "Algunas de las bibliotecas más pequeñas validan menos tipos. Este paquete dedica bytes a normalizar la entrada (NORM-1 a NORM-4), a los tipos de control de CIF-3 y a los NIF K/L/M. Las bibliotecas publicadas solo como CommonJS no admiten *tree-shaking*, así que una función cuesta la biblioteca entera. Las bibliotecas de muchos países o de propósito general (stdnum, validator.js) son más grandes por diseño.",
    accuracyTitle: "#### Coincidencia con SPEC.md",
    accuracyIntro: (r) =>
      `El porcentaje de los ${r.accuracy.fixtures.total} casos de \`test/fixtures\` (opciones por defecto) que cada biblioteca juzga igual que SPEC.md, válidos o no válidos. **Es coincidencia con SPEC.md, no corrección absoluta**: los mantenedores de este paquete escribieron las reglas y los casos, así que el paquete coincide con ellos por construcción. Muchas discrepancias son decisiones que SPEC.md documenta (por ejemplo CIF-3, o aceptar la forma antigua del NIE); latest.md las enumera por biblioteca. «Entrada canónica» excluye los casos que necesitan normalización.`,
    accuracyHeader: ["DNI", "NIE", "CIF", "K/L/M", "Todos", "Entrada canónica"],
    compareIntro: (date) =>
      `Revisado el ${date}, a partir del README, el package.json y la página de npm de cada biblioteca, y del benchmark de arriba (las versiones y los tamaños salen de latest.json).`,
    compareHeader: [
      "Tipos",
      "K/L/M",
      "Normaliza la entrada",
      "Objeto de resultado",
      "Mensajes traducidos",
      "Generadores de datos de prueba",
      "Esquemas",
      "Módulos",
      "Tamaño, cualquier tipo (min+gzip)",
      "Última versión",
    ],
    badgeAlt: (bytes) => `isValidNif: ${bytes} min+gzip`,
    anchor: "#rendimiento",
  },
};

/** Translations of the `label` of the alternative imports in latest.json. */
const ALTERNATIVE_LABEL = {
  "deep import of the Spanish NIF module (not documented)": {
    en: "with a deep import of its Spanish NIF module (not documented)",
    es: "con una importación directa de su módulo del NIF español (no documentada)",
  },
};

const text = (value, lang) => (typeof value === "string" ? value : value[lang]);

/** "1,234 B" in English, "1234 B" and "12 345 B" in Spanish (RAE). */
function bytes(value, lang) {
  if (lang === "en") return `${value.toLocaleString("en-US")} B`;
  const digits = String(value);
  if (digits.length <= 4) return `${digits} B`;
  return `${digits.replace(/\B(?=(\d{3})+$)/g, " ")} B`;
}

/** A decimal with a point in English and a comma in Spanish. */
function decimal(value, places, lang) {
  const fixed = value.toFixed(places);
  return lang === "es" ? fixed.replace(".", ",") : fixed;
}

const millions = (ops, lang) => decimal(ops / 1e6, 2, lang);
const ratio = (value, lang) => `${decimal(value, 1, lang)}×`;
/** "82.9%" in English, "82,9 %" in Spanish (RAE: a space before the sign). */
const percent = (value, lang) => {
  if (value === null) return "—";
  return `${decimal(value, 1, lang)}${lang === "es" ? "\u00a0" : ""}%`;
};

function table(header, rows) {
  return [
    `| ${header.join(" | ")} |`,
    `| ${header.map((_, i) => (i === 0 ? "---" : "---:")).join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ];
}

/** "a, b and c" / "a, b y c". */
function list(items, lang) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${TEXT[lang].and} ${items.at(-1)}`;
}

/** The name of a library in the tables: package and version, linked. */
function libraryName(contender, report, lang) {
  if (contender.id === report.subject) {
    return `**${contender.package}** (${TEXT[lang].thisBuild})`;
  }
  const name = contender.label.startsWith("validator.js")
    ? contender.label.replace(
        /^validator\.js (\w+)(.*)$/,
        "validator.js `$1$2`"
      )
    : contender.label.replace(/ \(.*\)$/, "");
  return `[${name}](https://www.npmjs.com/package/${contender.package}) ${contender.version}`;
}

function contenderById(report, id) {
  const contender = report.contenders.find((c) => c.id === id);
  if (!contender) throw new Error(`${RESULTS}: no contender "${id}"`);
  return contender;
}

const SETS = ["DNI", "NIE", "CIF"];

function benchSection(report, lang) {
  const t = TEXT[lang];
  const subject = report.subject;
  const bold = (id, value) => (id === subject ? `**${value}**` : value);
  const commit = `\`${(report.git.sha ?? "unknown").slice(0, 7)}\``;
  const out = [t.measured(report, commit), "", t.throughputTitle, ""];

  out.push(t.throughputIntro(report), "");
  out.push(
    ...table(
      [t.library, ...SETS],
      report.contenders.map((c) => [
        libraryName(c, report, lang),
        ...SETS.map((set) => {
          const entry = report.throughput[set][c.id];
          return entry.status === "ok"
            ? bold(c.id, millions(entry.opsPerSecond, lang))
            : t.unsupported;
        }),
      ])
    ),
    ""
  );

  const previous = report.contenders.find((c) => c.kind === "previous");
  if (previous) {
    const parts = SETS.map(
      (set) =>
        `${ratio(report.throughput[set][previous.id].subjectSpeedup, lang)} (${set})`
    );
    out.push(t.speedup(list(parts, lang)));
  }
  const faster = report.contenders.flatMap((c) =>
    SETS.filter((set) => {
      const entry = report.throughput[set][c.id];
      return (
        c.id !== subject && entry.status === "ok" && entry.subjectSpeedup < 1
      );
    }).map((set) => `${libraryName(c, report, lang)} (${set})`)
  );
  out.push(faster.length ? t.faster(list(faster, lang)) : t.noneFaster, "");

  out.push(t.sizeTitle, "", t.sizeIntro, "");
  const sizeKeys = ["DNI", "NIE", "CIF", "any", "full"];
  out.push(
    ...table(
      [t.library, ...t.sizeHeader],
      report.contenders.map((c) => [
        libraryName(c, report, lang),
        ...sizeKeys.map((key) => {
          const size = report.sizes[c.id][key];
          return size ? bold(c.id, bytes(size.gzipBytes, lang)) : t.unsupported;
        }),
      ])
    ),
    ""
  );
  const ours = report.sizes[subject].any.gzipBytes;
  const smaller = report.contenders
    .filter(
      (c) =>
        c.id !== subject &&
        (report.sizes[c.id].any?.gzipBytes ?? Infinity) < ours
    )
    .map(
      (c) =>
        `${libraryName(c, report, lang)} (${bytes(report.sizes[c.id].any.gzipBytes, lang)})`
    );
  const alternatives = report.contenders.flatMap((c) =>
    (report.sizes[c.id].alternatives ?? []).map((alt) =>
      t.alternative(
        `${libraryName(c, report, lang)}, ${ALTERNATIVE_LABEL[alt.label]?.[lang] ?? alt.label}`,
        bytes(alt.gzipBytes, lang)
      )
    )
  );
  out.push(
    [
      smaller.length ? t.smaller(list(smaller, lang)) : t.noneSmaller,
      t.sizeWhy,
      ...alternatives,
    ].join(" "),
    ""
  );

  out.push(t.accuracyTitle, "", t.accuracyIntro(report), "");
  const buckets = ["DNI", "NIE", "CIF", "KLM"];
  out.push(
    ...table(
      [t.library, ...t.accuracyHeader],
      report.contenders.map((c) => {
        const results = report.accuracy.results[c.id];
        const cell = (stats) =>
          stats.supported
            ? bold(c.id, percent(stats.agreementPercent, lang))
            : t.unsupported;
        return [
          libraryName(c, report, lang),
          ...buckets.map((bucket) => cell(results.all[bucket])),
          cell(results.all.overall),
          cell(results.canonical.overall),
        ];
      })
    )
  );
  return out.join("\n");
}

function compareSection(report, lang) {
  const t = TEXT[lang];
  const rows = COMPARISON.map((row) => {
    const contender = contenderById(report, row.id);
    const size = report.sizes[row.id].any;
    return [
      libraryName(contender, report, lang),
      text(row.types, lang),
      text(row.klm, lang),
      text(row.normalizes, lang),
      text(row.result, lang),
      text(row.messages, lang),
      text(row.generators, lang),
      text(row.schemas, lang),
      text(row.modules, lang),
      size ? bytes(size.gzipBytes, lang) : t.unsupported,
      text(row.released, lang),
    ];
  });
  const header = [t.library, ...t.compareHeader];
  return [
    t.compareIntro(CHECKED_ON),
    "",
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function sizeBadge(report, lang) {
  const size = bytes(report.sizes[report.subject].any.gzipBytes, lang);
  const message = encodeURIComponent(
    `isValidNif ${size.replace(" ", " ")}`
  ).replaceAll("-", "--");
  const t = TEXT[lang];
  return `[![${t.badgeAlt(size)}](https://img.shields.io/badge/min%2Bgzip-${message}-blue)](${t.anchor})`;
}

/** Replaces what is between `<!-- name:start -->` and `<!-- name:end -->`. */
function fill(markdown, name, content, file, { inline = false } = {}) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const from = markdown.indexOf(start);
  const to = markdown.indexOf(end);
  if (from < 0 || to < from) {
    throw new Error(`${file}: the markers ${start} and ${end} are missing`);
  }
  const body = inline ? content : `\n${content}\n`;
  return markdown.slice(0, from + start.length) + body + markdown.slice(to);
}

function render(markdown, report, lang, file) {
  let out = fill(markdown, "size-badge", sizeBadge(report, lang), file, {
    inline: true,
  });
  out = fill(out, "bench", benchSection(report, lang), file);
  return fill(out, "compare", compareSection(report, lang), file);
}

function main() {
  const check = process.argv.includes("--check");
  const report = JSON.parse(readFileSync(join(ROOT, RESULTS), "utf8"));
  const stale = [];
  for (const { file, lang } of TARGETS) {
    const path = join(ROOT, file);
    const current = readFileSync(path, "utf8");
    const next = render(current, report, lang, file);
    if (next === current) continue;
    if (check) stale.push(file);
    else {
      writeFileSync(path, next);
      console.log(`Updated ${file}`);
    }
  }
  if (stale.length) {
    console.error(
      `Out of date with ${RESULTS}: ${stale.join(", ")}. Run \`pnpm readme:bench\` and commit the result.`
    );
    process.exit(1);
  }
  if (check) console.log(`README.md and README.es.md match ${RESULTS}.`);
}

main();
