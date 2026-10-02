// Benchmark of the current build (dist/) against the published v1.0.11 (the
// `nif-v1` dev alias) and, optionally, against another build given in
// BENCH_BASE (for example the dist/ of the previous branch).
//
// Run it with `pnpm bench`, which builds dist/ first. It prints three tables
// and writes bench/results/baseline.json and bench/results/baseline.md:
//
// 1. Every boolean validator on the mixed input set: v1.0.11, the current
//    code with the v1-compatible options, and with the v2 defaults.
// 2. Every boolean validator on canonical input (the fast path), current
//    code against BENCH_BASE, with the budget: at most 10% slower.
// 3. validate() and the booleans on the mixed, canonical and typed
//    (normalized) input sets.
//
// Method:
// - One task call validates a whole input set; the reported figure is
//   validations per second (task calls per second x inputs).
// - Each task loop is compiled on its own (`new Function`), so each call site
//   stays monomorphic, as in an application that calls one validator.
// - Tasks that are compared run back to back, with warmup.
// - Before timing, the v1-compatible mode is checked to accept exactly the
//   same inputs as v1.0.11.
// - Table 2 runs each function in its own child process (this script with
//   `--canonical <function>`), where it is only ever called with the
//   default options, as in an application. In the main process the same
//   function also runs with the v1-compatible options, which makes V8's
//   type feedback polymorphic and would understate the fast path.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import { resolve } from "node:path";
import { Bench } from "tinybench";
import {
  CANONICAL_INPUTS,
  INPUT_MIX,
  INPUTS,
  TYPED_INPUTS,
} from "./inputs.mjs";

const require = createRequire(import.meta.url);
const current = require("../dist/cjs/index.cjs");
const v1 = require("nif-v1");
const baseDir = process.env.BENCH_BASE;
// A base built before the dual build has `index.js` in its dist/; since then
// the CommonJS build is `cjs/index.cjs`.
const base = baseDir
  ? require(
      ["cjs/index.cjs", "index.js"]
        .map((file) => resolve(baseDir, file))
        .find((file) => existsSync(file)) ?? resolve(baseDir, "cjs/index.cjs")
    )
  : null;
/** How the report names the base, for example "refactor/v2-core (#76)". */
const baseLabel = process.env.BENCH_BASE_LABEL ?? baseDir;
// tinybench's `exports` don't include its package.json.
const tinybenchVersion = JSON.parse(
  readFileSync(
    new URL("../node_modules/tinybench/package.json", import.meta.url),
    "utf8"
  )
).version;

/** Boolean validators, with the speed-up targets of #47. */
const FUNCTIONS = [
  ["isValidNif", 5],
  ["isValidNaturalPersonNif", null],
  ["isValidDni", 2.5],
  ["isValidNie", 2.5],
  ["isValidCif", 2.5],
  ["isValidDniLetter", null],
  ["isValidCifControlCode", null],
];

/** The options that restore the v1 behaviour (MIGRATION.md). */
const V1_COMPATIBLE = { normalize: false, cifControl: "lenient" };
/** Budget for the booleans on canonical input, against BENCH_BASE. */
const MAX_SLOWDOWN = 0.1;

const TIME_MS = Number(process.env.BENCH_TIME_MS ?? 2000);
const WARMUP_MS = Number(process.env.BENCH_WARMUP_MS ?? 500);

const sink = { count: 0 };

function makeTask(fn, inputs, opts) {
  // A separate function per task, so V8 keeps separate type feedback.
  return new Function(
    "fn",
    "inputs",
    "opts",
    "sink",
    `return function task() {
      let valid = 0;
      for (let i = 0; i < inputs.length; i++)
        if (${opts === undefined ? "fn(inputs[i])" : "fn(inputs[i], opts)"}) valid++;
      sink.count += valid;
    };`
  )(fn, inputs, opts, sink);
}

function makeValidateTask(validate, inputs) {
  return new Function(
    "validate",
    "inputs",
    "sink",
    `return function task() {
      let valid = 0;
      for (let i = 0; i < inputs.length; i++)
        if (validate(inputs[i]).valid) valid++;
      sink.count += valid;
    };`
  )(validate, inputs, sink);
}

function stats(bench, taskName, count) {
  const task = bench.getTask(taskName);
  const result = task?.result;
  if (!result || !("throughput" in result))
    throw new Error(`${taskName} did not complete: ${result?.state}`);
  return {
    validationsPerSecond: Math.round(result.throughput.mean * count),
    rmePercent: Number(result.throughput.rme.toFixed(2)),
    samples: result.throughput.samplesCount,
  };
}

// Child process: one function on canonical and typed input, printed as JSON.
// `--typed <function>`: the same on typed input, in another process, so the
// normalization path doesn't change the feedback of the canonical run.
if (process.argv[2] === "--canonical" || process.argv[2] === "--typed") {
  const name = process.argv[3];
  const child = new Bench({ time: TIME_MS, warmupTime: WARMUP_MS });
  if (process.argv[2] === "--typed") {
    child.add("typed", makeTask(current[name], TYPED_INPUTS));
    await child.run();
    console.log(JSON.stringify(stats(child, "typed", TYPED_INPUTS.length)));
    process.exit(0);
  }
  if (base) child.add("base", makeTask(base[name], CANONICAL_INPUTS));
  child.add("v2", makeTask(current[name], CANONICAL_INPUTS));
  await child.run();
  console.log(
    JSON.stringify({
      base: base ? stats(child, "base", CANONICAL_INPUTS.length) : null,
      v2: stats(child, "v2", CANONICAL_INPUTS.length),
    })
  );
  process.exit(0);
}

/** Runs this script in a child process and parses the JSON it prints. */
function runChild(mode, name) {
  return JSON.parse(
    execFileSync(
      process.execPath,
      [new URL(import.meta.url).pathname, mode, name],
      { encoding: "utf8" }
    )
  );
}

for (const [name] of FUNCTIONS) {
  const differences = INPUTS.filter(
    (value) => v1[name](value) !== current[name](value, V1_COMPATIBLE)
  );
  if (differences.length > 0) {
    console.error(
      `${name} with the v1-compatible options differs from v1.0.11 on`,
      differences.slice(0, 5)
    );
    process.exit(1);
  }
}

const bench = new Bench({ time: TIME_MS, warmupTime: WARMUP_MS });
for (const [name] of FUNCTIONS) {
  bench.add(`mixed v1.0.11 ${name}`, makeTask(v1[name], INPUTS));
  bench.add(
    `mixed compat ${name}`,
    makeTask(current[name], INPUTS, V1_COMPATIBLE)
  );
  bench.add(`mixed v2 ${name}`, makeTask(current[name], INPUTS));
}
const SETS = [
  ["mixed", INPUTS],
  ["canonical", CANONICAL_INPUTS],
  ["typed", TYPED_INPUTS],
];
for (const [set, inputs] of SETS)
  bench.add(`${set} v2 validate`, makeValidateTask(current.validate, inputs));

const tasks = bench.tasks.length;
console.log(
  `Benchmarking ${tasks} tasks (${TIME_MS} ms each)${base ? `, base: ${baseDir}` : ""}...`
);
await bench.run();

const ratio = (a, b) =>
  Number((a.validationsPerSecond / b.validationsPerSecond).toFixed(2));

const mixed = FUNCTIONS.map(([name, target]) => {
  const before = stats(bench, `mixed v1.0.11 ${name}`, INPUTS.length);
  const compat = stats(bench, `mixed compat ${name}`, INPUTS.length);
  const v2 = stats(bench, `mixed v2 ${name}`, INPUTS.length);
  const speedup = ratio(compat, before);
  return {
    function: name,
    v1: before,
    v1Compatible: compat,
    v2Defaults: v2,
    speedup,
    target,
    meetsTarget: target === null ? null : speedup >= target,
  };
});

const canonical = FUNCTIONS.map(([name]) => {
  console.log(`Canonical input: ${name} (child process)...`);
  const child = runChild("--canonical", name);
  const v2 = child.v2;
  const before = child.base;
  const relative = before ? ratio(v2, before) : null;
  return {
    function: name,
    base: before,
    v2Defaults: v2,
    relative,
    withinBudget: relative === null ? null : relative >= 1 - MAX_SLOWDOWN,
    typed: runChild("--typed", name),
  };
});

const validateResults = Object.fromEntries(
  SETS.map(([set, inputs]) => [
    set,
    stats(bench, `${set} v2 validate`, inputs.length),
  ])
);

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
  base: baseLabel ?? null,
  inputs: {
    mixed: { count: INPUTS.length, mix: INPUT_MIX },
    canonical: CANONICAL_INPUTS.length,
    typed: TYPED_INPUTS.length,
  },
  results: { mixed, canonical, validate: validateResults },
};

const m = (s) =>
  `${(s.validationsPerSecond / 1e6).toFixed(2)} ±${s.rmePercent}%`;
const markdown = [
  "# Benchmark",
  "",
  `- Date: ${report.date}`,
  `- Machine: ${report.machine.cpu}, ${report.machine.cores} cores, ${report.machine.memoryGiB} GiB, ${report.machine.platform}`,
  `- Node.js ${report.node}, tinybench ${report.tinybench}, ${TIME_MS} ms per task after ${WARMUP_MS} ms of warmup`,
  `- Mixed input set: ${INPUTS.length} fixed strings (${INPUT_MIX.valid} valid, ${INPUT_MIX.validLowerCase} valid in lower case, ${INPUT_MIX.wrongControl} with a wrong control character, ${INPUT_MIX.junk} junk); canonical set: ${CANONICAL_INPUTS.length} 9-character upper-case documents, valid or with a wrong control; typed set: ${TYPED_INPUTS.length} valid documents with separators, spaces or lower case. See bench/inputs.mjs.`,
  "",
  "Millions of validations per second (higher is better), ± relative margin of error.",
  "",
  "## Booleans on the mixed input set, against v1.0.11",
  "",
  `"v1-compatible" is \`${JSON.stringify(V1_COMPATIBLE)}\`, checked to give the v1.0.11 results; "v2 defaults" normalizes the input and follows CIF-3.`,
  "",
  "| Function | v1.0.11 | v2, v1-compatible | v2 defaults | Speed-up (v1-compatible) | Target |",
  "| --- | ---: | ---: | ---: | ---: | --- |",
  ...mixed.map(
    (r) =>
      `| \`${r.function}\` | ${m(r.v1)} | ${m(r.v1Compatible)} | ${m(r.v2Defaults)} | ${r.speedup.toFixed(2)}× | ${r.target === null ? "—" : `≥ ${r.target}× ${r.meetsTarget ? "(met)" : "(**missed**)"}`} |`
  ),
  "",
  "## Booleans on canonical input (the fast path)",
  "",
  base
    ? `Base: ${baseLabel}. Budget: the v2 defaults at most ${MAX_SLOWDOWN * 100}% slower than the base.`
    : "No base given (set BENCH_BASE to a dist/ directory to compare).",
  "",
  "| Function | base | v2 defaults | v2 / base | Budget | v2 on typed input (normalized) |",
  "| --- | ---: | ---: | ---: | --- | ---: |",
  ...canonical.map(
    (r) =>
      `| \`${r.function}\` | ${r.base ? m(r.base) : "—"} | ${m(r.v2Defaults)} | ${r.relative === null ? "—" : `${r.relative.toFixed(2)}×`} | ${r.withinBudget === null ? "—" : r.withinBudget ? "met" : "**missed**"} | ${m(r.typed)} |`
  ),
  "",
  "## validate()",
  "",
  "`validate()` allocates its result object (and a message when invalid).",
  "",
  "| Input set | validate() |",
  "| --- | ---: |",
  ...SETS.map(([set]) => `| ${set} | ${m(validateResults[set])} |`),
  "",
  "Reproduce with `pnpm bench` (and `BENCH_BASE=<dist dir> BENCH_BASE_LABEL=<name> pnpm bench` for the canonical comparison). Numbers depend on the machine; compare the ratios, not the absolute values.",
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
