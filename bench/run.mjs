// Benchmark of the current build (dist/) against the published v1.0.11 (the
// `nif-v1` dev alias), on the fixed mixed input set in ./inputs.mjs.
//
// Run it with `pnpm bench`, which builds dist/ first. It prints a table and
// writes bench/results/baseline.json and bench/results/baseline.md.
//
// Method:
// - One task call validates the whole input set; the reported figure is
//   validations per second (task calls per second x inputs).
// - Each task loop is compiled on its own (`new Function`), so each call site
//   stays monomorphic, as in an application that calls one validator.
// - For each function, v1 and the current code run back to back, with warmup.
// - Before timing, both are checked to accept exactly the same inputs.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import { Bench } from "tinybench";
import { INPUT_MIX, INPUTS } from "./inputs.mjs";

const require = createRequire(import.meta.url);
const current = require("../dist/index.js");
const v1 = require("nif-v1");
// tinybench's `exports` don't include its package.json.
const tinybenchVersion = JSON.parse(
  readFileSync(
    new URL("../node_modules/tinybench/package.json", import.meta.url),
    "utf8"
  )
).version;

/** Functions to compare, with the speed-up targets of #47. */
const FUNCTIONS = [
  ["isValidNif", 5],
  ["isValidNaturalPersonNif", null],
  ["isValidDni", 2.5],
  ["isValidNie", 2.5],
  ["isValidCif", 2.5],
  ["isValidDniLetter", null],
  ["isValidCifControlCode", null],
];

const TIME_MS = Number(process.env.BENCH_TIME_MS ?? 2000);
const WARMUP_MS = Number(process.env.BENCH_WARMUP_MS ?? 500);

const sink = { count: 0 };

function makeTask(fn) {
  // A separate function per task, so V8 keeps separate type feedback.
  return new Function(
    "fn",
    "inputs",
    "sink",
    `return function task() {
      let valid = 0;
      for (let i = 0; i < inputs.length; i++) if (fn(inputs[i])) valid++;
      sink.count += valid;
    };`
  )(fn, INPUTS, sink);
}

for (const [name] of FUNCTIONS) {
  const theirs = INPUTS.map((value) => v1[name](value));
  const ours = INPUTS.map((value) => current[name](value));
  const differences = INPUTS.filter((_, i) => theirs[i] !== ours[i]);
  if (differences.length > 0) {
    console.error(`${name} differs from v1.0.11 on`, differences.slice(0, 5));
    process.exit(1);
  }
}

const bench = new Bench({ time: TIME_MS, warmupTime: WARMUP_MS });
for (const [name] of FUNCTIONS) {
  bench.add(`v1.0.11 ${name}`, makeTask(v1[name]));
  bench.add(`current ${name}`, makeTask(current[name]));
}

console.log(
  `Benchmarking ${FUNCTIONS.length} functions on ${INPUTS.length} inputs (${TIME_MS} ms per task)...`
);
await bench.run();

function stats(taskName) {
  const task = bench.getTask(taskName);
  const result = task?.result;
  if (!result || !("throughput" in result))
    throw new Error(`${taskName} did not complete: ${result?.state}`);
  return {
    validationsPerSecond: Math.round(result.throughput.mean * INPUTS.length),
    rmePercent: Number(result.throughput.rme.toFixed(2)),
    samples: result.throughput.samplesCount,
  };
}

const results = FUNCTIONS.map(([name, target]) => {
  const before = stats(`v1.0.11 ${name}`);
  const after = stats(`current ${name}`);
  const speedup = after.validationsPerSecond / before.validationsPerSecond;
  return {
    function: name,
    v1: before,
    current: after,
    speedup: Number(speedup.toFixed(2)),
    target,
    meetsTarget: target === null ? null : speedup >= target,
  };
});

const cpus = os.cpus();
const report = {
  date: new Date().toISOString(),
  machine: {
    cpu: cpus[0]?.model.trim() ?? "unknown",
    cores: cpus.length,
    memoryGiB: Math.round(os.totalmem() / 2 ** 30),
    platform: `${os.platform()} ${os.release()} (${os.arch()})`,
  },
  node: process.version,
  tinybench: tinybenchVersion,
  timePerTaskMs: TIME_MS,
  warmupPerTaskMs: WARMUP_MS,
  inputs: { count: INPUTS.length, mix: INPUT_MIX },
  results,
};

const millions = (value) => (value / 1e6).toFixed(2);
const markdown = [
  "# Benchmark: current code vs v1.0.11",
  "",
  `- Date: ${report.date}`,
  `- Machine: ${report.machine.cpu}, ${report.machine.cores} cores, ${report.machine.memoryGiB} GiB, ${report.machine.platform}`,
  `- Node.js ${report.node}, tinybench ${report.tinybench}, ${TIME_MS} ms per task after ${WARMUP_MS} ms of warmup`,
  `- Input set: ${INPUTS.length} fixed strings (${INPUT_MIX.valid} valid, ${INPUT_MIX.validLowerCase} valid in lower case, ${INPUT_MIX.wrongControl} with a wrong control character, ${INPUT_MIX.junk} junk), see bench/inputs.mjs`,
  "",
  "Millions of validations per second (higher is better), ± relative margin of error.",
  "",
  "| Function | v1.0.11 (before) | current (after) | Speed-up | Target |",
  "| --- | ---: | ---: | ---: | --- |",
  ...results.map(
    (r) =>
      `| \`${r.function}\` | ${millions(r.v1.validationsPerSecond)} ±${r.v1.rmePercent}% | ${millions(r.current.validationsPerSecond)} ±${r.current.rmePercent}% | ${r.speedup.toFixed(2)}× | ${r.target === null ? "—" : `≥ ${r.target}× ${r.meetsTarget ? "(met)" : "(**missed**)"}`} |`
  ),
  "",
  "Reproduce with `pnpm bench`. Numbers depend on the machine; compare the speed-ups, not the absolute values.",
  "",
].join("\n");

const resultsDir = new URL("./results/", import.meta.url);
mkdirSync(resultsDir, { recursive: true });
writeFileSync(
  new URL("baseline.json", resultsDir),
  `${JSON.stringify(report, null, 2)}\n`
);
writeFileSync(new URL("baseline.md", resultsDir), markdown);

console.log(`\n${markdown}`);
console.log("Written to bench/results/baseline.json and baseline.md.");
if (sink.count < 0) console.log(sink.count); // keep the results observable
