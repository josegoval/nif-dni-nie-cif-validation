// The competitor benchmark (#49): throughput, agreement with SPEC.md and
// bundle size of this package against the libraries in bench/competitors.mjs.
//
// Run it with `pnpm bench:competitors` (it builds dist/ first). It writes
// bench/results/latest.json (the single data source, schema in
// bench/README.md) and bench/results/latest.md (rendered from the JSON by
// bench/report.mjs), and prints the markdown.
//
//   node bench/run-competitors.mjs [--out <dir>]
//
// Environment: BENCH_TIME_MS (default 2000) and BENCH_WARMUP_MS (default 500)
// set the time per task.
//
// Throughput method:
// - One task call validates a whole input set; the figure is validations per
//   second (task calls per second x inputs).
// - The loop of each task is compiled from the call text in
//   bench/competitors.mjs with `new Function`, so every call site is its own
//   monomorphic site, the call is exactly the listed one, and no wrapper
//   function sits between the loop and the library.
// - Everything runs in this one process. Within a set the libraries run back
//   to back, and the order is rotated from set to set, so no library always
//   runs first or last.
// - Before timing, every call runs once over its set, to check it doesn't
//   throw; the number of inputs it accepts is recorded next to the timing.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import { join } from "node:path";
import { Bench } from "tinybench";
import { BUCKETS, bucketOf, evaluate, loadFixtures } from "./accuracy.mjs";
import {
  CONTENDERS,
  callFor,
  compileCall,
  ROOT,
  SUBJECT_ID,
  supportsMixed,
  versionOf,
} from "./competitors.mjs";
import { INPUT_MIX, INPUTS, TYPE_INPUT_MIX, TYPE_INPUTS } from "./inputs.mjs";
import { renderMarkdown } from "./report.mjs";
import { measureContenders } from "./sizes.mjs";

const require = createRequire(import.meta.url);

const TIME_MS = Number(process.env.BENCH_TIME_MS ?? 2000);
const WARMUP_MS = Number(process.env.BENCH_WARMUP_MS ?? 500);
const outIndex = process.argv.indexOf("--out");
const OUT_DIR =
  outIndex === -1 ? join(ROOT, "bench", "results") : process.argv[outIndex + 1];

/** The input sets of the throughput run, with their description. */
const SETS = {
  DNI: {
    inputs: TYPE_INPUTS.DNI,
    description: `${TYPE_INPUTS.DNI.length} DNI in canonical form (8 digits and a letter): ${TYPE_INPUT_MIX.DNI.valid} valid, plus ${TYPE_INPUT_MIX.DNI.wrongControl} of them with a wrong control letter.`,
  },
  NIE: {
    inputs: TYPE_INPUTS.NIE,
    description: `${TYPE_INPUTS.NIE.length} NIE in canonical form (X, Y or Z, 7 digits and a letter): ${TYPE_INPUT_MIX.NIE.valid} valid, plus ${TYPE_INPUT_MIX.NIE.wrongControl} of them with a wrong control letter.`,
  },
  CIF: {
    inputs: TYPE_INPUTS.CIF,
    description: `${TYPE_INPUTS.CIF.length} CIF in canonical form (organisation key, 7 digits and a control character), every organisation key: ${TYPE_INPUT_MIX.CIF.valid} valid, plus ${TYPE_INPUT_MIX.CIF.wrongControl} of them with a wrong control character.`,
  },
  mixed: {
    inputs: INPUTS,
    description: `${INPUTS.length} strings of every kind: ${INPUT_MIX.valid} valid (DNI, K/L/M, NIE, old-form NIE and CIF), ${INPUT_MIX.validLowerCase} of them again in lower case, ${INPUT_MIX.wrongControl} with a wrong control character, and ${INPUT_MIX.junk} junk strings (wrong lengths, random characters, the empty string).`,
  },
};

const sink = { count: 0 };

/** The source of the loop over an input set, with the listed call in it. */
function loopSource(contender, call, body) {
  return `${contender.setup}
    return function task() {
      let valid = 0;
      for (let i = 0; i < inputs.length; i++) {
        const x = inputs[i];
        if (${call}) valid++;
      }
      ${body}
    };`;
}

function compileLoop(contender, call, inputs, body) {
  return new Function(
    "lib",
    "inputs",
    "sink",
    loopSource(contender, call, body)
  )(contender.load(), inputs, sink);
}

const rotate = (list, by) => [...list.slice(by), ...list.slice(0, by)];

function git(...args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function machine() {
  const cpus = os.cpus();
  return {
    cpu: cpus[0]?.model.trim() ?? "unknown",
    cores: cpus.length,
    memoryGiB: Math.round(os.totalmem() / 2 ** 30),
    os: `${os.platform()} ${os.release()}`,
    arch: os.arch(),
    // The GitHub runner image, when run there.
    runner: process.env.ImageOS
      ? `${process.env.ImageOS} ${process.env.ImageVersion ?? ""}`.trim()
      : null,
  };
}

// tinybench's `exports` don't include its package.json.
const tinybenchVersion = JSON.parse(
  readFileSync(join(ROOT, "node_modules/tinybench/package.json"), "utf8")
).version;

// 1. Plan the tasks and check that every call runs.
const plan = []; // { set, contender, call, inputs }
const throughput = Object.fromEntries(Object.keys(SETS).map((s) => [s, {}]));
for (const [setIndex, set] of Object.keys(SETS).entries()) {
  for (const contender of rotate(CONTENDERS, setIndex % CONTENDERS.length)) {
    const call =
      set === "mixed"
        ? supportsMixed(contender)
          ? contender.calls.any
          : null
        : callFor(contender, set);
    if (call === null) {
      throughput[set][contender.id] = {
        status: "unsupported",
        reason:
          set === "mixed"
            ? "does not cover DNI, NIE and CIF, so it cannot validate every input of the set"
            : `does not validate a ${set}`,
      };
      continue;
    }
    const inputs = contender.transformInput
      ? SETS[set].inputs.map(contender.transformInput)
      : SETS[set].inputs;
    const accepted = compileLoop(contender, call, inputs, "return valid;")();
    plan.push({ set, contender, call, inputs, accepted });
  }
}

// 2. Time them.
const bench = new Bench({ time: TIME_MS, warmupTime: WARMUP_MS });
for (const item of plan) {
  bench.add(
    `${item.set} ${item.contender.id}`,
    compileLoop(item.contender, item.call, item.inputs, "sink.count += valid;")
  );
}
console.log(
  `Benchmarking ${plan.length} tasks (${WARMUP_MS} ms warmup and ${TIME_MS} ms each)...`
);
await bench.run();

for (const item of plan) {
  const result = bench.getTask(`${item.set} ${item.contender.id}`)?.result;
  if (!result || !("throughput" in result)) {
    throw new Error(`${item.set} ${item.contender.id} did not complete`);
  }
  throughput[item.set][item.contender.id] = {
    status: "ok",
    opsPerSecond: Math.round(result.throughput.mean * item.inputs.length),
    rmePercent: Number(result.throughput.rme.toFixed(2)),
    samples: result.throughput.samplesCount,
    accepted: item.accepted,
    inputs: item.inputs.length,
  };
}
// Relative speed: how many times as fast the subject is as each library,
// from the same run.
for (const set of Object.keys(SETS)) {
  const subject = throughput[set][SUBJECT_ID];
  for (const entry of Object.values(throughput[set])) {
    if (entry.status === "ok" && subject?.status === "ok") {
      entry.subjectSpeedup = Number(
        (subject.opsPerSecond / entry.opsPerSecond).toFixed(2)
      );
    }
  }
}

// 3. Agreement with SPEC.md.
const { normalize } = require("../dist/cjs/index.cjs");
const fixtures = loadFixtures(join(ROOT, "test", "fixtures"));
const accuracy = { results: {} };
for (const contender of CONTENDERS) {
  accuracy.results[contender.id] = evaluate(
    compileCall(contender, contender.calls.any),
    contender.supports,
    fixtures,
    normalize
  );
}
accuracy.fixtures = {
  files: [...new Set(fixtures.map((fixture) => fixture.file))],
  total: fixtures.length,
  byBucket: Object.fromEntries(
    BUCKETS.map((bucket) => [
      bucket,
      fixtures.filter((fixture) => bucketOf(fixture) === bucket).length,
    ])
  ),
};

// 4. Bundle sizes.
console.log("Measuring bundle sizes...");
const sizes = await measureContenders(CONTENDERS);

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  git: {
    sha: git("rev-parse", "HEAD"),
    dirty: git("status", "--porcelain", "--", ".", ":!bench/results") !== "",
  },
  machine: machine(),
  node: process.version,
  tinybench: tinybenchVersion,
  config: {
    timePerTaskMs: TIME_MS,
    warmupPerTaskMs: WARMUP_MS,
    order:
      "one process; libraries run back to back within each input set; the order rotates from set to set",
  },
  subject: SUBJECT_ID,
  inputSets: Object.fromEntries(
    Object.entries(SETS).map(([set, { inputs, description }]) => [
      set,
      { count: inputs.length, description },
    ])
  ),
  contenders: CONTENDERS.map((contender) => ({
    id: contender.id,
    label: contender.label,
    kind: contender.kind,
    package: contender.package?.name ?? "nif-dni-nie-cif-validation",
    // package.json of this repository has the last release; the build is
    // named by its commit.
    version:
      contender.kind === "subject"
        ? `${versionOf(contender)}+${git("rev-parse", "--short=7", "HEAD")}`
        : versionOf(contender),
    homepage: contender.homepage,
    calls: Object.fromEntries(
      ["DNI", "NIE", "CIF", "any"].map((key) => [
        key,
        contender.calls[key] ?? null,
      ])
    ),
    supports: contender.supports,
    inputTransform:
      contender.transformInput === undefined
        ? null
        : 'prefix "ES" (outside the timed loop)',
    notes: contender.notes,
  })),
  throughput,
  accuracy,
  sizes,
};

mkdirSync(OUT_DIR, { recursive: true });
const markdown = renderMarkdown(report);
writeFileSync(
  join(OUT_DIR, "latest.json"),
  `${JSON.stringify(report, null, 2)}\n`
);
writeFileSync(join(OUT_DIR, "latest.md"), markdown);
console.log(`\n${markdown}`);
console.log(`Written to ${OUT_DIR}/latest.json and latest.md.`);
if (sink.count < 0) console.log(sink.count); // keep the results observable
