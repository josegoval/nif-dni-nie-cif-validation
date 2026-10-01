// The data of the benchmarks and comparison pages, from
// bench/results/latest.json (the single source of every number) and
// bench/comparison.mjs (the features, shared with the READMEs). Nothing here
// is typed by hand: this module only selects, sorts and derives, so updating
// the JSON and rebuilding updates the pages.
import {
  type Cell,
  CHECKED_ON,
  COMPARISON,
  FEATURES,
  type Phrase,
} from "../../../bench/comparison.mjs";
import latest from "../../../bench/results/latest.json";

export type SetId = "DNI" | "NIE" | "CIF";
export const SETS: SetId[] = ["DNI", "NIE", "CIF"];
export type SizeKey = SetId | "any" | "full";
export const SIZE_KEYS: SizeKey[] = ["DNI", "NIE", "CIF", "any", "full"];
export type Bucket = "DNI" | "NIE" | "CIF" | "KLM";
export const BUCKETS: Bucket[] = ["DNI", "NIE", "CIF", "KLM"];

type Kind = "subject" | "previous" | "competitor";

interface Contender {
  id: string;
  label: string;
  kind: Kind;
  package: string;
  version: string;
  homepage: string;
  calls: Record<SetId | "any", string | null>;
  inputTransform: string | null;
}

interface ThroughputEntry {
  status: "ok" | "unsupported";
  opsPerSecond?: number;
  subjectSpeedup?: number;
  rmePercent?: number;
  rangePercent?: number;
}

interface SizeEntry {
  import: string;
  gzipBytes: number;
  minBytes: number;
  label?: string;
}

interface Stats {
  supported: boolean;
  total?: number;
  agree?: number;
  falseAccepts?: number;
  falseRejects?: number;
  onDocumentedDecisions?: number;
  agreementPercent?: number | null;
}

interface AccuracyResult {
  all: Record<"overall" | Bucket | "general", Stats>;
  canonical: Record<"overall" | Bucket | "general", Stats>;
  disagreementCount: number;
}

const contenders = latest.contenders as Contender[];
const throughput = latest.throughput as unknown as Record<
  SetId,
  Record<string, ThroughputEntry>
>;
const sizes = latest.sizes as unknown as Record<
  string,
  Partial<Record<SizeKey, SizeEntry | null>> & { alternatives?: SizeEntry[] }
>;
const accuracy = latest.accuracy.results as unknown as Record<
  string,
  AccuracyResult
>;

export const SUBJECT = latest.subject;

/** A library as the tables name it: its package or label, and its version. */
export interface Library {
  id: string;
  kind: Kind;
  /** "nif-dni-nie-cif-validation", "validator.js isTaxID(x, "es-ES")"… */
  name: string;
  /** The version, or null for this build. */
  version: string | null;
  npm: string;
  homepage: string;
}

const libraryOf = (c: Contender): Library => ({
  id: c.id,
  kind: c.kind,
  name: c.kind === "competitor" ? c.label.replace(/ \(.*\)$/, "") : c.package,
  version: c.kind === "subject" ? null : c.version,
  npm: `https://www.npmjs.com/package/${c.package}`,
  homepage: c.homepage,
});

export const libraries: Library[] = contenders.map(libraryOf);

const byId = (id: string) => {
  const library = libraries.find((l) => l.id === id);
  if (!library) throw new Error(`latest.json has no contender "${id}"`);
  return library;
};

/** When, where and how the numbers were measured. */
export const run = {
  date: latest.generatedAt.slice(0, 10),
  commit: latest.git.sha,
  machine: latest.machine,
  node: latest.node,
  tinybench: latest.tinybench,
  config: latest.config,
  inputSets: latest.inputSets,
  fixtures: latest.accuracy.fixtures,
};

export interface ThroughputRow {
  library: Library;
  /** Validations per second, or null when the library has no validator. */
  ops: number | null;
  /** This build's ops/s over the library's (1 for this build). */
  speedup: number | null;
  rmePercent: number | null;
}

/** One set's throughput, fastest first, the unsupported libraries last. */
export function throughputRows(set: SetId): ThroughputRow[] {
  return libraries
    .map((library) => {
      const entry = throughput[set][library.id];
      const ok = entry?.status === "ok";
      return {
        library,
        ops: ok ? (entry.opsPerSecond ?? null) : null,
        speedup: ok ? (entry.subjectSpeedup ?? null) : null,
        rmePercent: ok ? (entry.rmePercent ?? null) : null,
      };
    })
    .sort((a, b) => (b.ops ?? -1) - (a.ops ?? -1));
}

/** The libraries faster than this build on a set (none, so far). */
export const fasterThanSubject = (set: SetId): Library[] =>
  throughputRows(set)
    .filter((row) => row.library.id !== SUBJECT && (row.speedup ?? 2) < 1)
    .map((row) => row.library);

export interface SizeRow {
  library: Library;
  /** min+gzip bytes per key, null when unsupported. */
  bytes: Record<SizeKey, number | null>;
}

/** Sizes, smallest first for one validator of any type. */
export const sizeRows: SizeRow[] = libraries
  .map((library) => ({
    library,
    bytes: Object.fromEntries(
      SIZE_KEYS.map((key) => [key, sizes[library.id]?.[key]?.gzipBytes ?? null])
    ) as Record<SizeKey, number | null>,
  }))
  .sort((a, b) => (a.bytes.any ?? Infinity) - (b.bytes.any ?? Infinity));

const subjectAny = sizeRows.find((r) => r.library.id === SUBJECT)?.bytes.any;
if (typeof subjectAny !== "number") {
  throw new Error("latest.json has no size for this package");
}

/** The libraries smaller than this build for one validator of any type. */
export const smallerThanSubject: SizeRow[] = sizeRows.filter(
  (row) =>
    row.library.id !== SUBJECT &&
    row.bytes.any !== null &&
    row.bytes.any < subjectAny
);

/** Extra measurements, such as stdnum's undocumented deep import. */
export const sizeAlternatives = libraries.flatMap((library) =>
  (sizes[library.id]?.alternatives ?? []).map((alt) => ({
    library,
    label: alt.label ?? "",
    bytes: alt.gzipBytes,
  }))
);

export interface AgreementRow {
  library: Library;
  /** Percent per bucket, null when the library doesn't support the type. */
  buckets: Record<Bucket, number | null>;
  all: number | null;
  canonical: number | null;
  disagreements: number;
  onDocumentedDecisions: number;
}

const percentOf = (stats: Stats | undefined) =>
  stats?.supported ? (stats.agreementPercent ?? null) : null;

/** Agreement with SPEC.md, in the order of latest.json. */
export const agreementRows: AgreementRow[] = libraries.map((library) => {
  const result = accuracy[library.id];
  if (!result) throw new Error(`latest.json has no accuracy for ${library.id}`);
  return {
    library,
    buckets: Object.fromEntries(
      BUCKETS.map((bucket) => [bucket, percentOf(result.all[bucket])])
    ) as Record<Bucket, number | null>,
    all: percentOf(result.all.overall),
    canonical: percentOf(result.canonical.overall),
    disagreements: result.disagreementCount,
    onDocumentedDecisions: result.all.overall.onDocumentedDecisions ?? 0,
  };
});

export type { Cell, Phrase };
export { CHECKED_ON, FEATURES };
export type Feature = (typeof FEATURES)[number];

export interface FeatureRow {
  library: Library;
  cells: Record<Feature, Cell>;
  /** min+gzip bytes of one validator of any type, from latest.json. */
  anyBytes: number | null;
}

/** The comparison matrix: bench/comparison.mjs, with latest.json's data. */
export const featureRows: FeatureRow[] = COMPARISON.map((row) => ({
  library: byId(row.id),
  cells: Object.fromEntries(
    FEATURES.map((feature) => [feature, row[feature]])
  ) as Record<Feature, Cell>,
  anyBytes: sizes[row.id]?.any?.gzipBytes ?? null,
}));
