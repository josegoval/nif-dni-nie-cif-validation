// Renders bench/results/latest.md from bench/results/latest.json, so the
// markdown never holds a number that the JSON doesn't.
//
//   node bench/report.mjs [<latest.json> [<latest.md>]]
//
// The runner (bench/run-competitors.mjs) calls renderMarkdown() too.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SET_ORDER = ["DNI", "NIE", "CIF", "mixed"];
const SET_LABEL = { DNI: "DNI", NIE: "NIE", CIF: "CIF", mixed: "Mixed" };
const BUCKET_LABEL = {
  DNI: "DNI",
  NIE: "NIE",
  CIF: "CIF",
  KLM: "K/L/M",
  general: "Other",
};

const millions = (opsPerSecond) => (opsPerSecond / 1e6).toFixed(2);
const bytes = (value) => `${value.toLocaleString("en-US")} B`;
const percent = (value) => `${value.toFixed(1)}%`;
const code = (text) => `\`${text}\``;
/** Escapes the pipes of a markdown table cell. */
const cell = (text) => String(text).replaceAll("|", "\\|");

/** "3.20×", with "(slower)" or "(about the same)" when it is not faster. */
export function describeSpeedup(ratio) {
  const text = `${ratio.toFixed(2)}×`;
  if (ratio >= 0.95 && ratio <= 1.05) return `${text} (about the same)`;
  return ratio < 1 ? `${text} (slower)` : text;
}

/** A markdown table; the columns after the first are right-aligned. */
function table(header, rows, align = "right") {
  const rule = align === "right" ? "---:" : "---";
  return [
    `| ${header.join(" | ")} |`,
    `| ${header.map((_, i) => (i === 0 ? "---" : rule)).join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ];
}

function throughputSection(report) {
  const { contenders, throughput, subject } = report;
  const subjectLabel = contenders.find((c) => c.id === subject)?.label;
  const sets = SET_ORDER.filter((set) => set in throughput);
  const out = [
    "## Throughput",
    "",
    "Millions of validations per second (**M ops/s, higher is faster**), with the relative margin of error of the run. One operation validates one string. Libraries that do not support a type are marked *unsupported*, which is neither fast nor slow.",
    "",
    ...sets.map(
      (set) => `- **${SET_LABEL[set]}**: ${report.inputSets[set].description}`
    ),
    "",
    "The libraries accept different numbers of the mixed inputs (some reject lower case, some reject K/L/M), so the mixed figures also reflect what each one accepts; the number accepted is `accepted` in latest.json. On the DNI, NIE and CIF sets every library accepts exactly the valid documents. The mixed set is timed only for libraries that cover DNI, NIE and CIF.",
    "",
  ];

  const entryOf = (set, id) => throughput[set][id];
  const ranked = (set) =>
    [...contenders].sort(
      (a, b) =>
        (entryOf(set, b.id).opsPerSecond ?? -1) -
        (entryOf(set, a.id).opsPerSecond ?? -1)
    );

  out.push("### M ops/s", "");
  out.push(
    ...table(
      ["Library", ...sets.map((set) => SET_LABEL[set])],
      contenders.map((c) => [
        `${c.id === subject ? "**" : ""}${cell(c.label)} ${c.version}${c.id === subject ? "**" : ""}`,
        ...sets.map((set) => {
          const entry = entryOf(set, c.id);
          return entry.status === "ok"
            ? `${millions(entry.opsPerSecond)} ±${entry.rmePercent}%`
            : "*unsupported*";
        }),
      ])
    ),
    ""
  );

  out.push(
    `### ${subjectLabel} against each library`,
    "",
    "How many times as fast as the library this build is, measured in the same run. Above 1× this build is faster; below 1× the library is faster.",
    ""
  );
  out.push(
    ...table(
      ["Library", ...sets.map((set) => SET_LABEL[set])],
      contenders
        .filter((c) => c.id !== subject)
        .map((c) => [
          `${cell(c.label)} ${c.version}`,
          ...sets.map((set) => {
            const entry = entryOf(set, c.id);
            return entry.subjectSpeedup === undefined
              ? "*unsupported*"
              : describeSpeedup(entry.subjectSpeedup);
          }),
        ])
    ),
    ""
  );

  for (const set of sets) {
    const faster = ranked(set)
      .filter(
        (c) =>
          c.id !== subject &&
          entryOf(set, c.id).status === "ok" &&
          (entryOf(set, c.id).subjectSpeedup ?? 1) < 1
      )
      .map((c) => c.label);
    if (faster.length > 0) {
      out.push(
        `- **${SET_LABEL[set]}**: faster than this build: ${faster.join(", ")}.`
      );
    }
  }
  out.push("");

  out.push(
    "### What was called",
    "",
    "The loop of every task is compiled from these calls (`x` is the input string), each with its library's default options. `any` is the call for the mixed set and for the accuracy check.",
    ""
  );
  out.push(
    ...table(
      ["Library", "DNI", "NIE", "CIF", "any"],
      contenders.map((c) => [
        `${cell(c.label)} ${c.version}`,
        ...["DNI", "NIE", "CIF", "any"].map((key) =>
          c.calls[key] === null ? "*unsupported*" : code(cell(c.calls[key]))
        ),
      ]),
      "left"
    ),
    ""
  );
  return out;
}

function accuracyCell(stats) {
  if (!stats.supported) return "*unsupported*";
  if (stats.total === 0) return "—";
  return percent(stats.agreementPercent);
}

function accuracyTable(report, view) {
  const header = [
    "Library",
    ...Object.keys(BUCKET_LABEL).map((b) => BUCKET_LABEL[b]),
    "All",
    "False accepts",
    "False rejects",
    "On a documented decision",
  ];
  const rows = report.contenders.map((c) => {
    const result = report.accuracy.results[c.id][view];
    return [
      `${c.id === report.subject ? "**" : ""}${cell(c.label)} ${c.version}${c.id === report.subject ? "**" : ""}`,
      ...Object.keys(BUCKET_LABEL).map((b) => accuracyCell(result[b])),
      accuracyCell(result.overall),
      String(result.overall.falseAccepts),
      String(result.overall.falseRejects),
      String(result.overall.onDocumentedDecisions),
    ];
  });
  return table(header, rows);
}

function accuracySection(report) {
  const { fixtures, results } = report.accuracy;
  const canonicalTotal = report.contenders
    .map((c) => results[c.id].canonical.overall.total)
    .reduce((a, b) => Math.max(a, b), 0);
  const out = [
    "## Agreement with SPEC.md (official sources)",
    "",
    `Every library judges the ${fixtures.total} fixtures of \`test/fixtures\` that test the default options (${fixtures.files.join(", ")}), with its default options. The figure is the share of fixtures where the library says what SPEC.md says (valid or invalid), which comes from the official sources. **It is agreement with SPEC.md, not correctness in the absolute**: the rules, and these fixtures, were written by the maintainers of this package, so this package agrees with them by construction. A type a library does not support is left out of its figures (*unsupported*). A *false accept* is a fixture that SPEC.md says is invalid and the library accepts; a *false reject* is one that SPEC.md says is valid and the library rejects. A throw counts as a rejection.`,
    "",
    `Fixtures per column: ${Object.entries(BUCKET_LABEL)
      .map(([bucket, label]) => `${label} ${fixtures.byBucket[bucket]}`)
      .join(
        ", "
      )}. "Other" holds input handling that has no type of its own (an \`ES\` prefix, separators only). "All" covers only the types a library supports, so compare the columns, not "All", between libraries of a different scope.`,
    "",
    '"On a documented decision" counts the disagreements that follow from a decision that SPEC.md documents in "Differences from other libraries" (for example, a digit-only control for some CIF keys), out of the false accepts and rejects.',
    "",
    "### Every fixture",
    "",
    ...accuracyTable(report, "all"),
    "",
    "### Canonical input only (agreement ignoring input normalization)",
    "",
    `The same, on the fixtures whose input is already in canonical form (upper-case letters and digits that normalization leaves as they are; at most ${canonicalTotal} of them), so a library that does not normalize (lower case, spaces, separators, a missing leading zero) is not penalized for it.`,
    "",
    ...accuracyTable(report, "canonical"),
    "",
    "### Representative disagreements",
    "",
    'Up to six per library, the first of each SPEC rule ("expected" is what SPEC.md says).',
    "",
  ];
  for (const c of report.contenders) {
    const { disagreements, disagreementCount } = results[c.id];
    if (disagreementCount === 0) {
      out.push(`- **${c.label}**: none.`);
      continue;
    }
    out.push(`- **${c.label}** (${disagreementCount} disagreements):`);
    for (const item of disagreements) {
      const decision = item.documentedDecision
        ? ` *Documented SPEC decision: ${item.documentedDecision}.*`
        : "";
      out.push(
        `  - ${code(JSON.stringify(item.input))}: expected ${item.expected}, got ${item.got} (${item.rule}, ${item.note}).${decision}`
      );
    }
  }
  out.push("");
  return out;
}

function sizeCell(size) {
  return size === null
    ? "*unsupported*"
    : `${bytes(size.gzipBytes)} (${bytes(size.minBytes)})`;
}

function sizesSection(report) {
  const { contenders, sizes } = report;
  const out = [
    "## Bundle size",
    "",
    'Minified and gzipped size (**min+gzip, lower is smaller**), with the minified size in parentheses, of the equivalent import of the call, bundled with esbuild like `pnpm size` does (bundle, minify, tree shaking, gzip level 9, the cost of an empty import subtracted). "Whole library" imports everything the package exports. Libraries published as CommonJS cannot be tree-shaken, so their single function costs the whole library. Multi-country and multi-purpose libraries (stdnum, validator.js) are larger by design.',
    "",
  ];
  out.push(
    ...table(
      ["Library", "DNI", "NIE", "CIF", "any", "Whole library"],
      contenders.map((c) => [
        `${c.id === report.subject ? "**" : ""}${cell(c.label)} ${c.version}${c.id === report.subject ? "**" : ""}`,
        sizeCell(sizes[c.id].DNI),
        sizeCell(sizes[c.id].NIE),
        sizeCell(sizes[c.id].CIF),
        sizeCell(sizes[c.id].any),
        sizeCell(sizes[c.id].full),
      ])
    ),
    ""
  );
  const alternatives = contenders.flatMap((c) =>
    sizes[c.id].alternatives.map((alt) => ({ c, alt }))
  );
  if (alternatives.length > 0) {
    out.push("Other imports, for reference:", "");
    for (const { c, alt } of alternatives) {
      out.push(
        `- ${c.label}, ${alt.label}: ${bytes(alt.gzipBytes)} (${bytes(alt.minBytes)}).`
      );
    }
    out.push("");
  }
  out.push("The imports measured:", "");
  out.push(
    ...table(
      ["Library", "DNI", "NIE", "CIF", "any", "Whole library"],
      contenders.map((c) => [
        cell(c.label),
        ...["DNI", "NIE", "CIF", "any", "full"].map((key) =>
          sizes[c.id][key] === null
            ? "*unsupported*"
            : code(cell(sizes[c.id][key].import))
        ),
      ]),
      "left"
    ),
    ""
  );
  return out;
}

/** The markdown of a results object (the contents of latest.json). */
export function renderMarkdown(report) {
  const { machine, git } = report;
  const out = [
    "# Competitor benchmark",
    "",
    "Generated from `latest.json` by `bench/report.mjs`: do not edit by hand. The method is in [bench/README.md](../README.md).",
    "",
    `- Date: ${report.generatedAt}`,
    `- Code: ${git.sha ?? "unknown"}${git.dirty ? " (with uncommitted changes)" : ""}`,
    `- Machine: ${machine.cpu}, ${machine.cores} cores, ${machine.memoryGiB} GiB, ${machine.os} (${machine.arch})${machine.runner ? `, runner image ${machine.runner}` : ""}`,
    `- Node.js ${report.node}, tinybench ${report.tinybench}, ${report.config.timePerTaskMs} ms per task after ${report.config.warmupPerTaskMs} ms of warmup`,
    '- Absolute numbers depend on the machine and on what else it is doing. **The ratios of one run are what carries over**; see "Noise" in the README.',
    "",
    ...throughputSection(report),
    ...accuracySection(report),
    ...sizesSection(report),
    "## Notes on each library",
    "",
  ];
  for (const c of report.contenders) {
    out.push(
      `- **${c.label}** ${c.version} (${c.kind === "subject" ? "this build" : c.kind === "previous" ? "our previous major version" : "competitor"}, ${c.homepage})${c.inputTransform ? `, input transform: ${c.inputTransform}` : ""}.${c.notes.length > 0 ? ` ${c.notes.join(" ")}` : ""}`
    );
  }
  out.push("");
  return out.join("\n");
}

// `node bench/report.mjs`: regenerate latest.md from latest.json.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const jsonPath =
    process.argv[2] ??
    fileURLToPath(new URL("results/latest.json", import.meta.url));
  const mdPath =
    process.argv[3] ??
    fileURLToPath(new URL("results/latest.md", import.meta.url));
  writeFileSync(
    mdPath,
    renderMarkdown(JSON.parse(readFileSync(jsonPath, "utf8")))
  );
  console.log(`Written to ${mdPath}.`);
}
