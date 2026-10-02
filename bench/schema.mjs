// Checks the shape and the internal consistency of bench/results/latest.json,
// the schema that bench/README.md documents ("The schema of latest.json").
// No dependency: `validateResults(report)` returns the list of problems, empty
// when the report is valid. bench/schema.test.mjs runs it on the committed
// file, so a change to the runner that breaks the schema fails `pnpm test`.

const SETS = ["DNI", "NIE", "CIF", "mixed"];
const TYPES = ["DNI", "NIE", "CIF"];
const BUCKETS = ["DNI", "NIE", "CIF", "KLM", "general"];
const KINDS = ["subject", "previous", "competitor"];
const round2 = (value) => Number(value.toFixed(2));

const isObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isCount = (value) => Number.isInteger(value) && value >= 0;
const isPositive = (value) => typeof value === "number" && value > 0;
const isText = (value) => typeof value === "string" && value.length > 0;

/**
 * @param {unknown} report the parsed latest.json
 * @returns {string[]} the problems found
 */
export function validateResults(report) {
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
    return condition;
  };

  if (!check(isObject(report), "the report is not an object")) return errors;
  check(report.schemaVersion === 1, "schemaVersion must be 1");
  check(
    isText(report.generatedAt) && !Number.isNaN(Date.parse(report.generatedAt)),
    "generatedAt must be an ISO date"
  );

  check(isObject(report.git), "git must be an object");
  check(
    report.git?.sha === null || /^[0-9a-f]{40}$/.test(report.git?.sha ?? ""),
    "git.sha must be a 40-character hash or null"
  );
  check(typeof report.git?.dirty === "boolean", "git.dirty must be a boolean");

  const machine = report.machine;
  check(isObject(machine), "machine must be an object");
  check(isText(machine?.cpu), "machine.cpu must be text");
  check(isPositive(machine?.cores), "machine.cores must be positive");
  check(isPositive(machine?.memoryGiB), "machine.memoryGiB must be positive");
  check(isText(machine?.os), "machine.os must be text");
  check(isText(machine?.arch), "machine.arch must be text");
  check(
    machine?.runner === null || isText(machine?.runner),
    "machine.runner must be text or null"
  );

  check(
    /^v\d+\./.test(report.node ?? ""),
    "node must be a version like v24.1.0"
  );
  check(isText(report.tinybench), "tinybench must be a version");
  check(
    isPositive(report.config?.timePerTaskMs) &&
      isPositive(report.config?.warmupPerTaskMs) &&
      Number.isInteger(report.config?.rounds) &&
      report.config.rounds > 0 &&
      isText(report.config?.order),
    "config needs timePerTaskMs, warmupPerTaskMs, rounds and order"
  );

  // Input sets.
  for (const set of SETS) {
    const inputSet = report.inputSets?.[set];
    check(
      isObject(inputSet) &&
        isCount(inputSet.count) &&
        isText(inputSet.description),
      `inputSets.${set} needs count and description`
    );
  }

  // Contenders.
  const contenders = Array.isArray(report.contenders) ? report.contenders : [];
  check(contenders.length >= 2, "contenders must list the libraries");
  const ids = contenders.map((contender) => contender?.id);
  check(new Set(ids).size === ids.length, "contender ids must be unique");
  check(ids.includes(report.subject), "subject must be a contender id");
  check(
    contenders.filter((c) => c?.kind === "subject").length === 1 &&
      contenders.find((c) => c?.kind === "subject")?.id === report.subject,
    "exactly one contender has the kind subject: the subject"
  );
  for (const contender of contenders) {
    const at = `contenders.${contender?.id}`;
    check(
      isText(contender?.id) &&
        isText(contender?.label) &&
        KINDS.includes(contender?.kind) &&
        isText(contender?.package) &&
        isText(contender?.version) &&
        isText(contender?.homepage),
      `${at} needs id, label, kind, package, version and homepage`
    );
    for (const key of [...TYPES, "any"]) {
      const call = contender?.calls?.[key];
      check(
        call === null || isText(call),
        `${at}.calls.${key} must be the call or null`
      );
    }
    for (const type of TYPES) {
      check(
        typeof contender?.supports?.[type] === "boolean",
        `${at}.supports.${type} must be a boolean`
      );
    }
    check(
      contender?.inputTransform === null || isText(contender?.inputTransform),
      `${at}.inputTransform must be text or null`
    );
    check(
      Array.isArray(contender?.notes) && contender.notes.every(isText),
      `${at}.notes must be a list of text`
    );
  }
  const byId = Object.fromEntries(contenders.map((c) => [c?.id, c]));
  const coversAll = (c) => TYPES.every((type) => c?.supports?.[type]);

  // Throughput.
  for (const set of SETS) {
    const entries = report.throughput?.[set];
    if (!check(isObject(entries), `throughput.${set} must be an object`))
      continue;
    const subject = entries[report.subject];
    for (const id of ids) {
      const at = `throughput.${set}.${id}`;
      const entry = entries[id];
      if (!check(isObject(entry), `${at} is missing`)) continue;
      const contender = byId[id];
      const supported =
        set === "mixed" ? coversAll(contender) : contender.calls[set] !== null;
      if (entry.status === "unsupported") {
        check(!supported, `${at} is unsupported but the library supports it`);
        check(isText(entry.reason), `${at} needs a reason`);
        continue;
      }
      check(entry.status === "ok", `${at}.status must be ok or unsupported`);
      check(supported, `${at} has a result but the library doesn't support it`);
      check(
        isPositive(entry.opsPerSecond),
        `${at}.opsPerSecond must be positive`
      );
      check(
        typeof entry.rmePercent === "number" && entry.rmePercent >= 0,
        `${at}.rmePercent must be a number`
      );
      check(isPositive(entry.samples), `${at}.samples must be positive`);
      const rounds = entry.rounds;
      if (
        check(
          Array.isArray(rounds) &&
            rounds.length === report.config?.rounds &&
            rounds.every(isPositive),
          `${at}.rounds must have the ops/s of each round`
        )
      ) {
        const sorted = [...rounds].sort((a, b) => a - b);
        const median = sorted[Math.floor((sorted.length - 1) / 2)];
        check(
          entry.opsPerSecond === median,
          `${at}.opsPerSecond must be the median round`
        );
        check(
          entry.rangePercent ===
            round2(((sorted[sorted.length - 1] - sorted[0]) / median) * 100),
          `${at}.rangePercent must be the range of the rounds over the median`
        );
      }
      check(
        entry.inputs === report.inputSets?.[set]?.count,
        `${at}.inputs must be the size of the set`
      );
      check(
        isCount(entry.accepted) && entry.accepted <= entry.inputs,
        `${at}.accepted must be a count of the inputs`
      );
      if (subject?.status === "ok" && isPositive(entry.opsPerSecond)) {
        check(
          entry.subjectSpeedup ===
            round2(subject.opsPerSecond / entry.opsPerSecond),
          `${at}.subjectSpeedup must be the subject's ops/s over this one's`
        );
      }
    }
  }

  // Accuracy.
  const accuracy = report.accuracy;
  const byBucket = accuracy?.fixtures?.byBucket;
  check(
    isCount(accuracy?.fixtures?.total) &&
      Array.isArray(accuracy?.fixtures?.files) &&
      BUCKETS.every((bucket) => isCount(byBucket?.[bucket])) &&
      BUCKETS.reduce((sum, bucket) => sum + (byBucket?.[bucket] ?? 0), 0) ===
        accuracy?.fixtures?.total,
    "accuracy.fixtures needs files, total and byBucket (adding up to total)"
  );
  for (const id of ids) {
    const result = accuracy?.results?.[id];
    if (!check(isObject(result), `accuracy.results.${id} is missing`)) continue;
    for (const view of ["all", "canonical"]) {
      const at = `accuracy.results.${id}.${view}`;
      const stats = result[view];
      if (!check(isObject(stats), `${at} is missing`)) continue;
      let supportedTotal = 0;
      for (const bucket of BUCKETS) {
        const bucketStats = stats[bucket];
        const supported = !TYPES.includes(bucket) || byId[id].supports[bucket];
        if (!supported) {
          check(
            bucketStats?.supported === false,
            `${at}.${bucket} must be unsupported`
          );
          continue;
        }
        if (
          !check(
            bucketStats?.supported === true,
            `${at}.${bucket} must be supported`
          )
        )
          continue;
        supportedTotal += bucketStats.total;
        check(
          bucketStats.total ===
            bucketStats.agree +
              bucketStats.falseAccepts +
              bucketStats.falseRejects,
          `${at}.${bucket}: agree, falseAccepts and falseRejects must add up to total`
        );
        check(
          bucketStats.agreementPercent ===
            (bucketStats.total === 0
              ? null
              : round2((bucketStats.agree / bucketStats.total) * 100)),
          `${at}.${bucket}.agreementPercent must be agree / total`
        );
        check(
          bucketStats.onDocumentedDecisions <=
            bucketStats.falseAccepts + bucketStats.falseRejects,
          `${at}.${bucket}.onDocumentedDecisions can't exceed the disagreements`
        );
        if (view === "all") {
          check(
            bucketStats.total === byBucket?.[bucket],
            `${at}.${bucket}.total must be the fixtures of the bucket`
          );
        }
      }
      check(
        stats.overall?.total === supportedTotal,
        `${at}.overall.total must add up the supported buckets`
      );
    }
    const overall = result.all?.overall;
    check(
      result.disagreementCount ===
        (overall?.falseAccepts ?? 0) + (overall?.falseRejects ?? 0),
      `accuracy.results.${id}.disagreementCount must match the false accepts and rejects`
    );
    check(
      Array.isArray(result.disagreements) &&
        result.disagreements.length <= result.disagreementCount &&
        result.disagreements.every(
          (item) =>
            typeof item.input === "string" &&
            ["valid", "invalid"].includes(item.got) &&
            ["falseAccept", "falseReject"].includes(item.kind) &&
            isText(item.rule) &&
            (item.documentedDecision === null ||
              isText(item.documentedDecision))
        ),
      `accuracy.results.${id}.disagreements has a malformed item`
    );
  }

  // Sizes.
  for (const id of ids) {
    const sizes = report.sizes?.[id];
    if (!check(isObject(sizes), `sizes.${id} is missing`)) continue;
    for (const key of [...TYPES, "any", "full"]) {
      const at = `sizes.${id}.${key}`;
      const size = sizes[key];
      const supported = !TYPES.includes(key) || byId[id].supports[key];
      if (!supported) {
        check(size === null, `${at} must be null: unsupported`);
        continue;
      }
      check(
        isObject(size) &&
          isText(size.import) &&
          isPositive(size.minBytes) &&
          isPositive(size.gzipBytes),
        `${at} needs import, minBytes and gzipBytes`
      );
    }
    check(
      Array.isArray(sizes.alternatives) &&
        sizes.alternatives.every(
          (alt) =>
            isText(alt.label) &&
            isPositive(alt.minBytes) &&
            isPositive(alt.gzipBytes)
        ),
      `sizes.${id}.alternatives must be a list of sizes`
    );
  }
  return errors;
}
