// A small, consistent results object for the tests of the schema and of the
// report (bench/schema.test.mjs, bench/report.test.mjs): two libraries, one of
// which has no CIF. It has the shape of bench/results/latest.json.

const stats = (
  total,
  falseAccepts,
  falseRejects,
  onDocumentedDecisions = 0
) => {
  const agree = total - falseAccepts - falseRejects;
  return {
    supported: true,
    total,
    agree,
    falseAccepts,
    falseRejects,
    onDocumentedDecisions,
    threw: 0,
    agreementPercent:
      total === 0 ? null : Number(((agree / total) * 100).toFixed(2)),
  };
};

const UNSUPPORTED = { supported: false };

export function sampleResults() {
  const size = (gzipBytes) => ({
    import: 'import { isValid } from "lib";',
    minBytes: gzipBytes * 2,
    gzipBytes,
  });
  return {
    schemaVersion: 1,
    generatedAt: "2026-10-01T10:00:00.000Z",
    git: { sha: "0123456789abcdef0123456789abcdef01234567", dirty: false },
    machine: {
      cpu: "Test CPU",
      cores: 8,
      memoryGiB: 16,
      os: "linux 6.0",
      arch: "x64",
      runner: null,
    },
    node: "v24.1.0",
    tinybench: "6.2.0",
    config: {
      timePerTaskMs: 2000,
      warmupPerTaskMs: 500,
      order: "one process",
    },
    subject: "current",
    inputSets: {
      DNI: { count: 10, description: "10 DNI." },
      NIE: { count: 10, description: "10 NIE." },
      CIF: { count: 10, description: "10 CIF." },
      mixed: { count: 20, description: "20 strings." },
    },
    contenders: [
      {
        id: "current",
        label: "this package (this build)",
        kind: "subject",
        package: "this-package",
        version: "1.0.0+abc1234",
        homepage: "https://example.com/this",
        calls: {
          DNI: "isValidDni(x)",
          NIE: "isValidNie(x)",
          CIF: "isValidCif(x)",
          any: "isValidNif(x)",
        },
        supports: { DNI: true, NIE: true, CIF: true },
        inputTransform: null,
        notes: ["A note."],
      },
      {
        id: "lib-a",
        label: "lib-a",
        kind: "competitor",
        package: "lib-a",
        version: "2.0.0",
        homepage: "https://example.com/a",
        calls: { DNI: "isDni(x)", NIE: "isNie(x)", CIF: null, any: "isAny(x)" },
        supports: { DNI: true, NIE: true, CIF: false },
        inputTransform: null,
        notes: [],
      },
    ],
    throughput: {
      DNI: {
        current: {
          status: "ok",
          opsPerSecond: 60_000_000,
          rmePercent: 0.1,
          samples: 100,
          accepted: 7,
          inputs: 10,
          subjectSpeedup: 1,
        },
        "lib-a": {
          status: "ok",
          opsPerSecond: 12_000_000,
          rmePercent: 0.2,
          samples: 100,
          accepted: 7,
          inputs: 10,
          subjectSpeedup: 5,
        },
      },
      NIE: {
        current: {
          status: "ok",
          opsPerSecond: 50_000_000,
          rmePercent: 0.1,
          samples: 100,
          accepted: 7,
          inputs: 10,
          subjectSpeedup: 1,
        },
        "lib-a": {
          status: "ok",
          opsPerSecond: 100_000_000,
          rmePercent: 0.3,
          samples: 100,
          accepted: 7,
          inputs: 10,
          subjectSpeedup: 0.5,
        },
      },
      CIF: {
        current: {
          status: "ok",
          opsPerSecond: 40_000_000,
          rmePercent: 0.1,
          samples: 100,
          accepted: 7,
          inputs: 10,
          subjectSpeedup: 1,
        },
        "lib-a": { status: "unsupported", reason: "does not validate a CIF" },
      },
      mixed: {
        current: {
          status: "ok",
          opsPerSecond: 30_000_000,
          rmePercent: 0.1,
          samples: 100,
          accepted: 15,
          inputs: 20,
          subjectSpeedup: 1,
        },
        "lib-a": {
          status: "unsupported",
          reason:
            "does not cover DNI, NIE and CIF, so it cannot validate every input of the set",
        },
      },
    },
    accuracy: {
      fixtures: {
        files: ["dni.json"],
        total: 20,
        byBucket: { DNI: 6, NIE: 4, CIF: 6, KLM: 2, general: 2 },
      },
      results: {
        current: {
          all: {
            overall: stats(20, 0, 0),
            DNI: stats(6, 0, 0),
            NIE: stats(4, 0, 0),
            CIF: stats(6, 0, 0),
            KLM: stats(2, 0, 0),
            general: stats(2, 0, 0),
          },
          canonical: {
            overall: stats(12, 0, 0),
            DNI: stats(4, 0, 0),
            NIE: stats(2, 0, 0),
            CIF: stats(4, 0, 0),
            KLM: stats(1, 0, 0),
            general: stats(1, 0, 0),
          },
          disagreements: [],
          disagreementCount: 0,
        },
        "lib-a": {
          all: {
            overall: stats(14, 0, 4, 1),
            DNI: stats(6, 0, 2, 1),
            NIE: stats(4, 0, 1),
            CIF: UNSUPPORTED,
            KLM: stats(2, 0, 1),
            general: stats(2, 0, 0),
          },
          canonical: {
            overall: stats(8, 0, 1),
            DNI: stats(4, 0, 0),
            NIE: stats(2, 0, 0),
            CIF: UNSUPPORTED,
            KLM: stats(1, 0, 1),
            general: stats(1, 0, 0),
          },
          disagreements: [
            {
              input: "X01234567L",
              expected: "valid",
              got: "invalid",
              kind: "falseReject",
              rule: "NIE-3",
              note: "old form",
              documentedDecision: "the old 10-character NIE form is valid",
            },
            {
              input: "K1234567L",
              expected: "valid",
              got: "invalid",
              kind: "falseReject",
              rule: "KLM-2",
              note: "K",
              documentedDecision: null,
            },
          ],
          disagreementCount: 4,
        },
      },
    },
    sizes: {
      current: {
        DNI: size(600),
        NIE: size(580),
        CIF: size(560),
        any: size(900),
        full: size(4600),
        alternatives: [],
      },
      "lib-a": {
        DNI: size(200),
        NIE: size(210),
        CIF: null,
        any: size(300),
        full: size(400),
        alternatives: [{ label: "an alternative", ...size(150) }],
      },
    },
  };
}
