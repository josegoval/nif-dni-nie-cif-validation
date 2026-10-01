// Writes a sample customer CSV with valid and invalid NIFs, made with the
// seeded generators of nif-dni-nie-cif-validation/generate: the same seed
// gives the same file on every run and every platform, so sample.csv is
// checked in.
//
//   node generate-sample.mjs                       writes sample.csv (1,000 rows)
//   node generate-sample.mjs --rows 1000000 --out /tmp/big.csv
//                                                  a big file, to see the throughput
//   node generate-sample.mjs --check               fails if sample.csv is not what
//                                                  this script writes
//
// One row in 16 has an invalid NIF, each with a known error code. The rest are
// valid DNIs, NIEs, K/L/M NIFs and CIFs, some written as a person would type
// them (lower case, spaces, hyphens, dots).
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { createGenerator } from "nif-dni-nie-cif-validation/generate";

const { values: options } = parseArgs({
  options: {
    rows: { type: "string", default: "1000" },
    out: { type: "string", default: "sample.csv" },
    seed: { type: "string", default: "2026" },
    check: { type: "boolean", default: false },
  },
});

const NAMES = [
  "Ana García",
  "Luis Martínez",
  "María López",
  "Jorge Sánchez",
  "Elena Ruiz",
  "Carlos Gómez",
  "Carmen Díaz",
  "Pablo Navarro",
];

/** [type, reason]: what `generateInvalid` makes for the invalid rows. */
const INVALID = [
  ["DNI", "INVALID_CONTROL_CHARACTER"],
  ["NIE", "INVALID_CONTROL_CHARACTER"],
  ["CIF", "INVALID_LENGTH"],
  ["DNI", "INVALID_FORMAT"],
  ["CIF", "INVALID_CONTROL_CHARACTER"],
  ["NIE", "INVALID_LENGTH"],
  ["DNI", "EMPTY"],
  ["CIF", "INVALID_FORMAT"],
];

/** Writes a field as CSV needs it: quoted when it has a comma, quote or line break. */
const field = (value) =>
  /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

/** The sample, as text. */
function sample(rows, seed) {
  const gen = createGenerator(seed);
  const lines = ["id,name,nif"];
  for (let id = 1; id <= rows; id++) {
    const name = NAMES[id % NAMES.length];
    // Some names have a comma, so the parser has quoting to handle.
    const written =
      id % 9 === 0 ? `${name.split(" ")[1]}, ${name.split(" ")[0]}` : name;
    let nif;
    if (id % 16 === 0) {
      const [type, reason] = INVALID[(id / 16 - 1) % INVALID.length];
      nif = gen.invalid(type, { reason });
    } else {
      const kind = id % 4;
      nif =
        kind === 0
          ? gen.nif({ types: ["CIF"] })
          : kind === 1
            ? gen.nie()
            : kind === 2 && id % 8 === 2
              ? gen.dni({ kind: "K" })
              : gen.dni();
      // As typed by people: lower case, a separator format, spaces around.
      if (id % 5 === 0) nif = nif.toLowerCase();
      else if (id % 7 === 0) nif = gen.nif({ types: ["DNI"], format: true });
      else if (id % 11 === 0) nif = ` ${nif} `;
    }
    lines.push([id, field(written), field(nif)].join(","));
  }
  return `${lines.join("\n")}\n`;
}

const text = sample(Number(options.rows), Number(options.seed));
if (options.check) {
  if (readFileSync(options.out, "utf8") !== text) {
    console.error(
      `${options.out} is not what generate-sample.mjs writes: run \`pnpm sample\` and commit it`
    );
    process.exit(1);
  }
  console.log(`${options.out} is up to date`);
} else {
  writeFileSync(options.out, text);
  console.log(`Wrote ${options.rows} rows to ${options.out}`);
}
