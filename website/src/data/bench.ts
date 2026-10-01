// Every benchmark number on the site comes from bench/results/latest.json,
// read at build time (bench/README.md: "the single source of the numbers").
// Nothing here is typed by hand: this module only selects and derives.
import latest from "../../../bench/results/latest.json";

type SetId = "DNI" | "NIE" | "CIF";
const SETS: SetId[] = ["DNI", "NIE", "CIF"];

interface Throughput {
  status: "ok" | "unsupported";
  opsPerSecond?: number;
  subjectSpeedup?: number;
}

interface Size {
  gzipBytes: number;
}

interface Contender {
  id: string;
  label: string;
  kind: "subject" | "previous" | "competitor";
  package: string;
  version: string;
}

const throughput = latest.throughput as unknown as Record<
  SetId,
  Record<string, Throughput>
>;
const sizes = latest.sizes as unknown as Record<
  string,
  Partial<Record<SetId | "any" | "full", Size | null>>
>;
const contenders = latest.contenders as Contender[];
const subject = latest.subject;

function ops(id: string, set: SetId): number | null {
  const entry = throughput[set][id];
  return entry?.status === "ok" && entry.opsPerSecond
    ? entry.opsPerSecond
    : null;
}

/** The lowest speed-up over every competitor, on every set it supports. */
function minSpeedup(kind: Contender["kind"]): number {
  const values = contenders
    .filter((c) => c.kind === kind)
    .flatMap((c) =>
      SETS.map((set) => throughput[set][c.id]?.subjectSpeedup).filter(
        (v): v is number => typeof v === "number"
      )
    );
  return Math.min(...values);
}

function speedupRange(kind: Contender["kind"]): [number, number] {
  const values = contenders
    .filter((c) => c.kind === kind)
    .flatMap((c) =>
      SETS.map((set) => throughput[set][c.id]?.subjectSpeedup).filter(
        (v): v is number => typeof v === "number"
      )
    );
  return [Math.min(...values), Math.max(...values)];
}

const subjectSizes = sizes[subject];
if (!subjectSizes?.any || !subjectSizes.full) {
  throw new Error("latest.json has no sizes for this package");
}
const anyBytes = subjectSizes.any.gzipBytes;

export const bench = {
  /** When and where the numbers were measured. */
  measuredOn: latest.generatedAt.slice(0, 10),
  machine: latest.machine.cpu,
  node: latest.node,
  /** The lowest speed-up over any other library, on DNI, NIE and CIF. */
  minSpeedupOverCompetitors: minSpeedup("competitor"),
  /** The speed-ups over v1.0.11 of this package, lowest and highest. */
  speedupOverV1: speedupRange("previous"),
  /** Validations per second of this package, per document type. */
  opsPerSecond: Object.fromEntries(
    SETS.map((set) => [set, ops(subject, set) ?? 0])
  ) as Record<SetId, number>,
  /** min+gzip bytes of this package. */
  size: {
    any: anyBytes,
    full: subjectSizes.full.gzipBytes,
    DNI: subjectSizes.DNI?.gzipBytes ?? 0,
  },
  /** Fixtures of test/fixtures, and this package's agreement with SPEC.md. */
  fixtures: latest.accuracy.fixtures.total,
  /** The libraries smaller than this one for one validator of any type. */
  smallerLibraries: contenders
    .filter((c) => c.kind === "competitor")
    .map((c) => ({
      name: c.package,
      version: c.version,
      bytes: sizes[c.id]?.any?.gzipBytes,
    }))
    .filter(
      (c): c is { name: string; version: string; bytes: number } =>
        typeof c.bytes === "number" && c.bytes < anyBytes
    )
    .sort((a, b) => a.bytes - b.bytes),
  /**
   * One row per library for the comparison table, fastest first on the DNI
   * set: DNI throughput, and the size of one validator of any type.
   */
  rows: contenders
    .map((c) => ({
      id: c.id,
      label: c.kind === "competitor" ? c.label : c.package,
      version: c.version,
      kind: c.kind,
      dni: ops(c.id, "DNI"),
      cif: ops(c.id, "CIF"),
      anyBytes: sizes[c.id]?.any?.gzipBytes ?? null,
    }))
    .sort((a, b) => (b.dni ?? 0) - (a.dni ?? 0)),
};

export type BenchRow = (typeof bench.rows)[number];
