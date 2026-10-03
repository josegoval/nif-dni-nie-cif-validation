/// <reference types="node" />
/**
 * The command line interface (#61): `npx nif-dni-nie-cif-validation
 * <command>`. src/cli/bin.ts is the executable, the `bin` of package.json;
 * this module is everything it does, as a function of the arguments, so the
 * tests call it without starting a process.
 *
 * Not part of the library's API: it has no entry point in the `exports` map
 * (it can't be imported, and the size budgets never include it), and it is
 * built only as an ES module, for Node.js. It only calls the public API
 * (`validate`, `getNifType`, `normalize`, `createGenerator`, the locales),
 * so it applies exactly the rules of the library, with the same rule IDs.
 *
 * Exit codes: 0 when everything is valid, 1 when something is invalid, 2
 * for a usage error (an unknown command or option, a bad value, a file that
 * can't be read). With `--json`, standard output is one JSON document; the
 * shapes are documented in docs/api-design.md (D13).
 */
import { type ParseArgsOptionsConfig, parseArgs } from "node:util";
import { createGenerator } from "../generate/index";
import { getNifType, normalize, validate } from "../index";
import { ca } from "../locales/ca";
import { en } from "../locales/en";
import { es } from "../locales/es";
import { eu } from "../locales/eu";
import { gl } from "../locales/gl";
import type {
  NifLocale,
  NifType,
  NifValidationError,
  ValidateOptions,
  ValidationResult,
} from "../types";
import { parseCsv } from "./csv";

/** What the CLI reads and writes: the process, or a fake in the tests. */
export interface Io {
  /** Writes text to standard output. */
  stdout(text: string): void;
  /** Writes text to standard error. */
  stderr(text: string): void;
  /** Reads a UTF-8 text file. Throws when it can't. */
  readFile(path: string): string;
  /** The version of the package. */
  version(): string;
}

export const BIN = "nif-dni-nie-cif-validation";

const EXIT_VALID = 0;
const EXIT_INVALID = 1;
const EXIT_USAGE = 2;

/** The most values `generate` makes in one run. */
export const MAX_COUNT = 1_000_000;

/** A mistake in the command line: exit code 2, with a message. */
class UsageError extends Error {}

/** The parsed options of any command (each command defines its own). */
interface Values {
  json?: boolean;
  help?: boolean;
  types?: string;
  "cif-control"?: string;
  "reject-placeholders"?: boolean;
  "allow-vat-prefix"?: boolean;
  locale?: string;
  count?: string;
  seed?: string;
  format?: boolean;
  file?: string;
  column?: string;
  delimiter?: string;
}

interface Command {
  /** The text of `<command> --help`. */
  help: string;
  options: ParseArgsOptionsConfig;
  run(values: Values, positionals: string[], io: Io): number;
}

const LOCALES = new Map<string, NifLocale>([
  ["en", en],
  ["es", es],
  ["ca", ca],
  ["eu", eu],
  ["gl", gl],
]);
const TYPES: NifType[] = ["DNI", "NIF_KLM", "NIE", "CIF"];

const COMMON_OPTIONS: ParseArgsOptionsConfig = {
  json: { type: "boolean" },
  help: { type: "boolean", short: "h" },
};

/** The options of `validate` and `check`: the ValidateOptions. */
const VALIDATE_OPTIONS: ParseArgsOptionsConfig = {
  ...COMMON_OPTIONS,
  types: { type: "string" },
  "cif-control": { type: "string" },
  "reject-placeholders": { type: "boolean" },
  "allow-vat-prefix": { type: "boolean" },
  locale: { type: "string" },
};

const VALIDATE_OPTIONS_HELP = `  --types <list>          Accept only these types, comma-separated: DNI,
                          NIF_KLM, NIE, CIF (others give UNSUPPORTED_TYPE)
  --cif-control <mode>    official (default) or lenient: C D F G J U V also
                          take a letter control, as v1 did (no official basis)
  --reject-placeholders   Reject 00000000T, 00000001R, 99999999R, X0000000T
  --allow-vat-prefix      Also accept a Spanish VAT number, ES + NIF
  --locale <code>         Language of the messages: en (default), es, ca, eu, gl
  --json                  Print one JSON document
  -h, --help              Show this help`;

const HELP = `Usage: ${BIN} <command> [options]

Validates Spanish NIF, DNI, K/L/M NIF, NIE and CIF numbers with the rules of
SPEC.md (BOE, AEAT): the same checks and rule IDs as the library.

Commands:
  validate <value...>            Validate values: valid or not, and why
  type <value>                   The document type, from the format only
  normalize <value>              The canonical form (does not validate)
  generate <type>                Synthetic test values: dni, nie, cif or nif
  check --file <csv> --column <name>
                                 Validate one column of a CSV file

Options:
  --json                         Print one JSON document on standard output
  -h, --help                     Show help; "<command> --help" for a command
  -v, --version                  Show the version

Exit codes: 0 everything valid, 1 something invalid, 2 usage error.

Examples:
  ${BIN} validate 12345678Z " x-0123456-7l " B12345674
  ${BIN} validate 12345678A --json --locale es
  ${BIN} generate dni --count 5 --seed 42
  ${BIN} check --file customers.csv --column nif

Docs: https://josegoval.github.io/nif-dni-nie-cif-validation/guides/command-line/
`;

/** Writes `value` as one JSON document. */
function writeJson(io: Io, value: unknown): void {
  io.stdout(`${JSON.stringify(value, null, 2)}\n`);
}

/** A value as typed, in quotes when it has spaces or is empty. */
function show(input: string): string {
  return /^[\w./-]+$/.test(input) ? input : JSON.stringify(input);
}

/** One line of text for a validated value. */
function describeResult(input: string, result: ValidationResult): string {
  if (result.valid) {
    const org = result.meta ? ` (${result.meta.orgDescription})` : "";
    return `${show(input)}: valid ${result.type} ${result.normalized}${org}`;
  }
  const error = result.error as NifValidationError;
  return `${show(input)}: invalid [${error.rule} ${error.code}] ${error.message}`;
}

/** The ValidateOptions given on the command line. */
function validateOptions(values: Values): ValidateOptions {
  const opts: ValidateOptions = {};
  if (values.types !== undefined) {
    const types = values.types
      .split(",")
      .map((type) => type.trim().toUpperCase())
      .filter((type) => type !== "");
    for (const type of types)
      if (!TYPES.includes(type as NifType))
        throw new UsageError(
          `unknown type "${type}" in --types: use ${TYPES.join(", ")}`
        );
    if (types.length === 0)
      throw new UsageError(`--types needs at least one of ${TYPES.join(", ")}`);
    opts.types = types as NifType[];
  }
  const cifControl = values["cif-control"];
  if (cifControl !== undefined) {
    if (cifControl !== "official" && cifControl !== "lenient")
      throw new UsageError(
        `--cif-control must be official or lenient, not "${cifControl}"`
      );
    opts.cifControl = cifControl;
  }
  if (values.locale !== undefined) {
    const locale = LOCALES.get(values.locale.toLowerCase());
    if (!locale)
      throw new UsageError(
        `unknown --locale "${values.locale}": use ${[...LOCALES.keys()].join(", ")}`
      );
    opts.locale = locale;
  }
  if (values["reject-placeholders"]) opts.rejectPlaceholders = true;
  if (values["allow-vat-prefix"]) opts.allowVatPrefix = true;
  return opts;
}

/** The only value of a command that takes exactly one. */
function oneValue(positionals: string[], what: string): string {
  if (positionals.length !== 1)
    throw new UsageError(
      `${what}, got ${positionals.length === 0 ? "none" : positionals.length}`
    );
  return positionals[0] as string;
}

/** An integer option, as a number. */
function integer(name: string, text: string, min: number, max: number): number {
  const value = Number(text);
  if (!/^[-+]?\d+$/.test(text) || value < min || value > max)
    throw new UsageError(
      `${name} must be an integer from ${min} to ${max}, not "${text}"`
    );
  return value;
}

const validateCommand: Command = {
  help: `Usage: ${BIN} validate <value...> [options]

Validates each value and prints one line per value: valid, with its type and
canonical form, or invalid, with the SPEC.md rule, the error code and the
message. Exit code 1 if any value is invalid.

Options:
${VALIDATE_OPTIONS_HELP}

With --json: an array with validate()'s result for each value, in order,
each with its "input".

Examples:
  ${BIN} validate 12345678Z " x-0123456-7l "
  ${BIN} validate 12345678A --json --locale es
  ${BIN} validate G1234567D --cif-control lenient
`,
  options: VALIDATE_OPTIONS,
  run(values, positionals, io) {
    if (positionals.length === 0)
      throw new UsageError("validate needs at least one value");
    const opts = validateOptions(values);
    const results = positionals.map((input) => ({
      input,
      ...validate(input, opts),
    }));
    if (values.json) writeJson(io, results);
    else
      io.stdout(
        results
          .map((result) => `${describeResult(result.input, result)}\n`)
          .join("")
      );
    return results.every((result) => result.valid) ? EXIT_VALID : EXIT_INVALID;
  },
};

const typeCommand: Command = {
  help: `Usage: ${BIN} type <value> [options]

Prints the document type that the format of the value shows: DNI, NIF_KLM,
NIE or CIF. It does not check the control character: use validate for that.
Exit code 1 when the format is not one of them.

Options:
  --allow-vat-prefix      Also accept a Spanish VAT number, ES + NIF
  --json                  Print one JSON document: {"input", "type"}, where
                          "type" is null when the format is not recognised
  -h, --help              Show this help

Examples:
  ${BIN} type 12345678A
  ${BIN} type ESB12345674 --allow-vat-prefix
`,
  options: { ...COMMON_OPTIONS, "allow-vat-prefix": { type: "boolean" } },
  run(values, positionals, io) {
    const input = oneValue(positionals, "type takes one value");
    const type = getNifType(input, {
      allowVatPrefix: values["allow-vat-prefix"] === true,
    });
    if (values.json) writeJson(io, { input, type });
    else if (type) io.stdout(`${type}\n`);
    else io.stderr(`${show(input)}: not the format of a NIF, NIE or CIF\n`);
    return type ? EXIT_VALID : EXIT_INVALID;
  },
};

const normalizeCommand: Command = {
  help: `Usage: ${BIN} normalize <value> [options]

Prints the canonical form of the value: upper case, without spaces, dots,
hyphens or slashes, a short DNI padded with zeros, an old 10-character NIE
shortened. It does not validate: use validate for that. Exit code 0.

Options:
  --json                  Print one JSON document: {"input", "normalized"}
  -h, --help              Show this help

Example:
  ${BIN} normalize " x-0123456-7l "
`,
  options: COMMON_OPTIONS,
  run(values, positionals, io) {
    const input = oneValue(positionals, "normalize takes one value");
    const normalized = normalize(input);
    if (values.json) writeJson(io, { input, normalized });
    else io.stdout(`${normalized}\n`);
    return EXIT_VALID;
  },
};

const GENERATORS = ["dni", "nie", "cif", "nif"] as const;
type GeneratorName = (typeof GENERATORS)[number];

const generateCommand: Command = {
  help: `Usage: ${BIN} generate <type> [options]

Prints valid test values, one per line. <type> is dni, nie, cif or nif (any
of the three). The numbers are synthetic: valid, but made up, and one may
match a real person or company by chance. Use them in tests only.

Options:
  --count <n>             How many values (default 1, at most ${MAX_COUNT})
  --seed <integer>        The same seed gives the same values on every run
                          and platform (default: a random seed)
  --format                The display form, with hyphens (12345678-Z)
  --json                  Print one JSON document: {"seed", "values"}; the
                          seed reproduces the values even when it was random
  -h, --help              Show this help

Examples:
  ${BIN} generate dni
  ${BIN} generate cif --count 10 --seed 42
`,
  options: {
    ...COMMON_OPTIONS,
    count: { type: "string" },
    seed: { type: "string" },
    format: { type: "boolean" },
  },
  run(values, positionals, io) {
    const name = oneValue(
      positionals,
      `generate takes one type (${GENERATORS.join(", ")})`
    ).toLowerCase() as GeneratorName;
    if (!GENERATORS.includes(name))
      throw new UsageError(
        `unknown type "${positionals[0]}": use ${GENERATORS.join(", ")}`
      );
    const count =
      values.count === undefined
        ? 1
        : integer("--count", values.count, 1, MAX_COUNT);
    // createGenerator reduces the seed modulo 2^32.
    const seed =
      values.seed === undefined
        ? Math.floor(Math.random() * 2 ** 32)
        : integer("--seed", values.seed, -(2 ** 53 - 1), 2 ** 53 - 1);
    const generator = createGenerator(seed);
    const format = values.format === true;
    const generated: string[] = [];
    for (let i = 0; i < count; i++) generated.push(generator[name]({ format }));
    if (values.json) writeJson(io, { seed, values: generated });
    else io.stdout(`${generated.join("\n")}\n`);
    return EXIT_VALID;
  },
};

const checkCommand: Command = {
  help: `Usage: ${BIN} check --file <csv> --column <name> [options]

Validates one column of a CSV file whose first row has the column names.
Prints a line for each invalid row, with its row number (the first row after
the names is row 2, as in a spreadsheet), and a summary. Blank lines are
skipped. Exit code 1 if any row is invalid.

The file is UTF-8 CSV (RFC 4180): fields in double quotes may contain the
delimiter, line breaks and doubled quotes; CRLF or LF line breaks; a byte
order mark is ignored.

Options:
  --file <path>           The CSV file
  --column <name>         The name of the column in the first row
  --delimiter <char>      The field separator (default ","; spreadsheets in
                          Spanish often use ";")
${VALIDATE_OPTIONS_HELP}

With --json: {"file", "column", "rows", "valid", "invalid", "errors"}, where
"errors" has validate()'s result for each invalid row, with its "row" and
"input".

Examples:
  ${BIN} check --file customers.csv --column nif
  ${BIN} check --file suppliers.csv --column cif --delimiter ";" --json
`,
  options: {
    ...VALIDATE_OPTIONS,
    file: { type: "string" },
    column: { type: "string" },
    delimiter: { type: "string" },
  },
  run(values, positionals, io) {
    if (positionals.length > 0)
      throw new UsageError(
        "check takes no values: give the file with --file and the column with --column"
      );
    const { file, column } = values;
    if (file === undefined) throw new UsageError("check needs --file <path>");
    if (column === undefined)
      throw new UsageError("check needs --column <name>");
    const delimiter = values.delimiter ?? ",";
    if (delimiter.length !== 1 || /["\r\n]/.test(delimiter))
      throw new UsageError(
        `--delimiter must be one character, not a quote or a line break: ${JSON.stringify(delimiter)}`
      );
    const opts = validateOptions(values);
    let records: string[][];
    try {
      records = parseCsv(io.readFile(file), delimiter);
    } catch (error) {
      throw new UsageError(`${file}: ${(error as Error).message}`);
    }
    const header = records[0];
    if (!header) throw new UsageError(`${file}: the file is empty`);
    const index = header.findIndex((name) => name.trim() === column.trim());
    if (index < 0)
      throw new UsageError(
        `${file}: no column ${JSON.stringify(column)} in the first row: ${header.map((name) => JSON.stringify(name)).join(", ")}`
      );
    let rows = 0;
    const errors: ({ row: number; input: string } & ValidationResult)[] = [];
    records.forEach((record, i) => {
      if (i === 0 || (record.length === 1 && record[0] === "")) return;
      rows++;
      const input = record[index] ?? "";
      const result = validate(input, opts);
      if (!result.valid) errors.push({ row: i + 1, input, ...result });
    });
    const valid = rows - errors.length;
    if (values.json)
      writeJson(io, {
        file,
        column,
        rows,
        valid,
        invalid: errors.length,
        errors,
      });
    else {
      const lines = errors.map(
        (error) => `row ${error.row}: ${describeResult(error.input, error)}\n`
      );
      lines.push(
        `${rows} row${rows === 1 ? "" : "s"} checked in ${file}, column ${JSON.stringify(column)}: ${valid} valid, ${errors.length} invalid\n`
      );
      io.stdout(lines.join(""));
    }
    return errors.length === 0 ? EXIT_VALID : EXIT_INVALID;
  },
};

export const COMMANDS = new Map<string, Command>([
  ["validate", validateCommand],
  ["type", typeCommand],
  ["normalize", normalizeCommand],
  ["generate", generateCommand],
  ["check", checkCommand],
]);

/**
 * Runs the command line `argv` (without `node` and the script) and returns
 * the exit code. Never throws on a bad command line: it writes the error to
 * `io.stderr` and returns 2.
 */
export function main(argv: string[], io: Io): number {
  const [first, ...rest] = argv;
  if (first === undefined) {
    io.stderr(HELP);
    return EXIT_USAGE;
  }
  if (first === "-h" || first === "--help") {
    io.stdout(HELP);
    return EXIT_VALID;
  }
  if (first === "-v" || first === "--version") {
    io.stdout(`${io.version()}\n`);
    return EXIT_VALID;
  }
  if (first === "help") {
    const topic = rest[0];
    const command = topic === undefined ? undefined : COMMANDS.get(topic);
    if (topic !== undefined && !command) return usage(io, unknown(topic));
    io.stdout(command ? command.help : HELP);
    return EXIT_VALID;
  }
  const command = COMMANDS.get(first);
  if (!command) return usage(io, unknown(first));
  try {
    let parsed: { values: Values; positionals: string[] };
    try {
      parsed = parseArgs({
        args: rest,
        options: command.options,
        allowPositionals: true,
        strict: true,
      }) as { values: Values; positionals: string[] };
    } catch (error) {
      throw new UsageError((error as Error).message);
    }
    if (parsed.values.help) {
      io.stdout(command.help);
      return EXIT_VALID;
    }
    return command.run(parsed.values, parsed.positionals, io);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    return usage(io, `${error.message}\nRun "${BIN} ${first} --help".`);
  }
}

function unknown(command: string): string {
  return `unknown command "${command}": use ${[...COMMANDS.keys()].join(", ")}, or --help`;
}

function usage(io: Io, message: string): number {
  io.stderr(`${BIN}: ${message}\n`);
  return EXIT_USAGE;
}
