// Validates the NIF column of a CSV file with Node streams, and reports the
// invalid rows with their error code and SPEC.md rule, and the throughput.
//
//   node validate-csv.mjs sample.csv
//   node validate-csv.mjs customers.csv --column tax_id --locale es --limit 20
//
// The file is read as a stream and validated row by row, so memory stays flat
// whatever its size: `node generate-sample.mjs --rows 1000000 --out /tmp/big.csv`
// makes a big file to try. A field with a line break inside quotes is not
// supported (one row is one line).
//
// Options:
//   --column <name>        the column with the NIF (default "nif")
//   --locale en|es|ca|eu|gl  the language of the messages (default "en")
//   --limit <n>            how many invalid rows to print (default 10)
//   --fail-on-invalid      exit with code 1 if there is any invalid row
//   --expect-rows <n>      exit with code 1 unless the file has n rows
//   --expect-invalid <n>   exit with code 1 unless n rows are invalid
import { createReadStream, statSync } from "node:fs";
import { Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { parseArgs } from "node:util";
import { validate } from "nif-dni-nie-cif-validation";
import { ca } from "nif-dni-nie-cif-validation/locales/ca";
import { en } from "nif-dni-nie-cif-validation/locales/en";
import { es } from "nif-dni-nie-cif-validation/locales/es";
import { eu } from "nif-dni-nie-cif-validation/locales/eu";
import { gl } from "nif-dni-nie-cif-validation/locales/gl";

const LOCALES = { en, es, ca, eu, gl };

const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    column: { type: "string", default: "nif" },
    locale: { type: "string", default: "en" },
    limit: { type: "string", default: "10" },
    "fail-on-invalid": { type: "boolean", default: false },
    "expect-rows": { type: "string" },
    "expect-invalid": { type: "string" },
  },
});

const [file] = positionals;
const locale = LOCALES[options.locale];
if (!file || !locale) {
  console.error(
    "Usage: node validate-csv.mjs <file.csv> [--column nif] [--locale en|es|ca|eu|gl] " +
      "[--limit 10] [--fail-on-invalid] [--expect-rows n] [--expect-invalid n]"
  );
  process.exit(2);
}

/** Splits one CSV line into its fields, with "quoted, fields" and "" for a quote. */
function parseLine(line) {
  const fields = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') quoted = false;
      else current += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      fields.push(current);
      current = "";
    } else current += char;
  }
  fields.push(current);
  return fields;
}

/**
 * A Transform from text chunks to rows (objects): it keeps the incomplete
 * last line of a chunk for the next one, and turns each line into an object
 * keyed by the header.
 */
function rows() {
  let pending = "";
  let header;
  let line = 0;
  const emit = (stream, text) => {
    line++;
    if (text === "") return;
    const fields = parseLine(text);
    if (!header) header = fields;
    else
      stream.push({
        line,
        record: Object.fromEntries(
          header.map((name, i) => [name, fields[i] ?? ""])
        ),
      });
  };
  return new Transform({
    readableObjectMode: true,
    decodeStrings: false,
    transform(chunk, _encoding, callback) {
      const lines = (pending + chunk).split("\n");
      pending = lines.pop();
      for (const text of lines) emit(this, text.replace(/\r$/, ""));
      callback();
    },
    flush(callback) {
      if (pending !== "") emit(this, pending.replace(/\r$/, ""));
      callback();
    },
  });
}

const stats = { rows: 0, invalid: 0, byCode: new Map(), shown: [] };
const limit = Number(options.limit);

/** A Writable that validates each row and counts what it finds. */
const validateRows = new Writable({
  objectMode: true,
  write({ line, record }, _encoding, callback) {
    stats.rows++;
    const value = record[options.column];
    const result = validate(value, { locale });
    if (!result.valid) {
      const { code, rule, message } = result.error;
      stats.invalid++;
      stats.byCode.set(code, (stats.byCode.get(code) ?? 0) + 1);
      if (stats.shown.length < limit)
        stats.shown.push({ line, value, code, rule, message });
    }
    callback();
  },
});

const bytes = statSync(file).size;
const started = performance.now();
await pipeline(
  createReadStream(file, { encoding: "utf8" }),
  rows(),
  validateRows
);
const seconds = (performance.now() - started) / 1000;

const number = (n) => n.toLocaleString("en-US");
console.log(
  `${file}: ${number(stats.rows)} rows, ${number(stats.rows - stats.invalid)} valid, ` +
    `${number(stats.invalid)} invalid`
);
if (stats.invalid > 0) {
  console.log("\nInvalid rows by error code:");
  for (const [code, count] of [...stats.byCode].sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(count).padStart(6)}  ${code}`);
  console.log(
    `\nFirst ${stats.shown.length} invalid rows (line, value, code, rule):`
  );
  for (const { line, value, code, rule, message } of stats.shown)
    console.log(
      `  line ${line}: ${JSON.stringify(value)}  ${code} (${rule})  ${message}`
    );
}
console.log(
  `\nThroughput: ${number(Math.round(stats.rows / seconds))} rows/s, ` +
    `${(bytes / 1e6 / seconds).toFixed(1)} MB/s ` +
    `(${(bytes / 1e6).toFixed(2)} MB in ${(seconds * 1000).toFixed(1)} ms)`
);

const expectations = [
  ["rows", options["expect-rows"], stats.rows],
  ["invalid rows", options["expect-invalid"], stats.invalid],
];
for (const [what, expected, actual] of expectations) {
  if (expected !== undefined && Number(expected) !== actual) {
    console.error(`Expected ${expected} ${what}, found ${actual}`);
    process.exitCode = 1;
  }
}
if (options["fail-on-invalid"] && stats.invalid > 0) process.exitCode = 1;
