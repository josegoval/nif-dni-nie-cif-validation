/**
 * The command line interface (#61), through `main(argv, io)` with a fake
 * `io`: every command, its options and usage errors, the text and JSON
 * output and the exit codes. cli-bin.test.ts runs the built executable;
 * cli-csv.test.ts tests the CSV reader.
 */
import { describe, expect, it } from "vitest";
import { BIN, COMMANDS, MAX_COUNT, main } from "../cli/main";
import { createGenerator } from "../generate/index";
import { validate } from "../index";
import { es } from "../locales/es";
import { type Run, run } from "./cliRun";

/** A usage error: exit code 2, nothing on stdout, `message` on stderr. */
function expectUsage(result: Run, message: string | RegExp): void {
  expect(result.code).toBe(2);
  expect(result.stdout).toBe("");
  expect(result.stderr).toMatch(message);
  expect(result.stderr.startsWith(`${BIN}: `)).toBe(true);
}

const json = (result: Run): unknown => JSON.parse(result.stdout);

describe("CLI: help, version and usage errors", () => {
  it("prints the help to stderr with exit code 2 when there is no command", () => {
    const result = run([]);
    expect(result.code).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(`Usage: ${BIN} <command>`);
  });

  it.each([["--help"], ["-h"], ["help"]])(
    "%s prints the help with every command and the exit codes",
    (flag) => {
      const result = run([flag]);
      expect(result).toMatchObject({ code: 0, stderr: "" });
      for (const name of COMMANDS.keys())
        expect(result.stdout).toMatch(new RegExp(`^  ${name} `, "m"));
      expect(result.stdout).toContain(
        "Exit codes: 0 everything valid, 1 something invalid, 2 usage error."
      );
    }
  );

  it.each([["--version"], ["-v"]])("%s prints the version", (flag) => {
    expect(run([flag])).toEqual({ code: 0, stdout: "9.8.7\n", stderr: "" });
  });

  it.each([...COMMANDS])(
    "%s --help, -h and help %s document every option of the command",
    (name, command) => {
      const help = run([name, "--help"]);
      expect(help).toEqual({ code: 0, stdout: command.help, stderr: "" });
      expect(run([name, "-h"]).stdout).toBe(command.help);
      expect(run(["help", name]).stdout).toBe(command.help);
      expect(command.help).toContain(`Usage: ${BIN} ${name} `);
      for (const [option, config] of Object.entries(command.options)) {
        expect(command.help).toContain(`--${option}`);
        if (config.short) expect(command.help).toContain(`-${config.short},`);
      }
      // --help wins over everything else on the line.
      expect(run([name, "x", "--json", "--help"]).stdout).toBe(command.help);
    }
  );

  it("rejects an unknown command, also after help", () => {
    expectUsage(
      run(["valid", "12345678Z"]),
      /unknown command "valid": use validate, type, normalize, generate, check/
    );
    expectUsage(run(["help", "nope"]), /unknown command "nope"/);
  });

  it("rejects an unknown option or a missing option value, and points to the help", () => {
    const unknown = run(["validate", "12345678Z", "--strict"]);
    expectUsage(unknown, /Unknown option '--strict'/);
    expect(unknown.stderr).toContain(`Run "${BIN} validate --help".`);
    expectUsage(run(["validate", "12345678Z", "--locale"]), /--locale/);
    expectUsage(
      run(["normalize", "x", "--types", "DNI"]),
      /Unknown option '--types'/
    );
  });

  it("throws what is not a usage error (a failing write) instead of hiding it", () => {
    const failing = {
      stdout: () => {
        throw new Error("disk full");
      },
      stderr: () => {},
      readFile: () => "",
      version: () => "1.0.0",
    };
    expect(() => main(["normalize", "x"], failing)).toThrow("disk full");
  });
});

describe("CLI: validate", () => {
  it("prints one line per value and exits with 0 when every value is valid", () => {
    expect(
      run(["validate", "12345678Z", " x-0123456-7l ", "b-1234567-4"])
    ).toEqual({
      code: 0,
      stdout:
        "12345678Z: valid DNI 12345678Z\n" +
        '" x-0123456-7l ": valid NIE X1234567L\n' +
        "b-1234567-4: valid CIF B12345674 (Limited liability company)\n",
      stderr: "",
    });
  });

  it("gives the rule, the code and the message of an invalid value, and exits with 1", () => {
    expect(run(["validate", "12345678Z", "12345678A", ""])).toEqual({
      code: 1,
      stdout:
        "12345678Z: valid DNI 12345678Z\n" +
        '12345678A: invalid [DNI-2 INVALID_CONTROL_CHARACTER] The control character is not correct: for this DNI it should be "Z".\n' +
        '"": invalid [INPUT-2 EMPTY] Enter a NIF, NIE or CIF.\n',
      stderr: "",
    });
  });

  it("--json prints validate()'s result for each value, with its input", () => {
    const values = ["12345678Z", "12345678A", "B12345674", "T1"];
    const result = run(["validate", ...values, "--json"]);
    expect(result.code).toBe(1);
    expect(result.stdout.endsWith("}\n]\n")).toBe(true);
    expect(json(result)).toEqual(
      values.map((input) => ({ input, ...validate(input) }))
    );
    expect(json(run(["validate", "12345678Z", "--json"]))).toEqual([
      { input: "12345678Z", valid: true, type: "DNI", normalized: "12345678Z" },
    ]);
  });

  it("--locale picks the language of the messages and of the organisation names", () => {
    const result = run([
      "validate",
      "12345678A",
      "B12345674",
      "--locale",
      "ES",
    ]);
    expect(result.stdout).toBe(
      "12345678A: invalid [DNI-2 INVALID_CONTROL_CHARACTER] El carácter de control no es correcto: para este DNI debería ser «Z».\n" +
        "B12345674: valid CIF B12345674 (Sociedad de responsabilidad limitada)\n"
    );
    expect(
      json(run(["validate", "12345678A", "--json", "--locale=es"]))
    ).toEqual([
      { input: "12345678A", ...validate("12345678A", { locale: es }) },
    ]);
    for (const code of ["en", "ca", "eu", "gl"])
      expect(run(["validate", "12345678A", "--locale", code]).code).toBe(1);
    expectUsage(
      run(["validate", "12345678A", "--locale", "fr"]),
      /unknown --locale "fr": use en, es, ca, eu, gl/
    );
    // Not a property of Object.prototype either.
    expectUsage(run(["validate", "x", "--locale", "constructor"]), /--locale/);
  });

  it("--types accepts only those types (POLICY-2)", () => {
    const result = run([
      "validate",
      "B12345674",
      "12345678Z",
      "--types",
      "dni, nie",
    ]);
    expect(result.code).toBe(1);
    expect(result.stdout).toBe(
      "B12345674: invalid [POLICY-2 UNSUPPORTED_TYPE] This NIF of a legal person or entity (CIF) is not accepted here.\n" +
        "12345678Z: valid DNI 12345678Z\n"
    );
    expect(run(["validate", "K1234567L", "--types", "NIF_KLM"]).code).toBe(0);
    expectUsage(
      run(["validate", "x", "--types", "DNI,KLM"]),
      /unknown type "KLM" in --types: use DNI, NIF_KLM, NIE, CIF/
    );
    expectUsage(
      run(["validate", "x", "--types", " , "]),
      /--types needs at least one/
    );
  });

  it("--cif-control lenient accepts a letter on C D F G J U V (CIF-3)", () => {
    expect(run(["validate", "G1234567D"]).code).toBe(1);
    expect(
      run(["validate", "G1234567D", "--cif-control", "lenient"]).code
    ).toBe(0);
    expect(
      run(["validate", "G1234567D", "--cif-control", "official"]).code
    ).toBe(1);
    expectUsage(
      run(["validate", "G1234567D", "--cif-control", "v1"]),
      /--cif-control must be official or lenient, not "v1"/
    );
  });

  it("--reject-placeholders and --allow-vat-prefix (POLICY-1, VAT-1)", () => {
    expect(run(["validate", "00000000T"]).code).toBe(0);
    expect(
      run(["validate", "00000000T", "--reject-placeholders"]).stdout
    ).toMatch(/^00000000T: invalid \[POLICY-1 PLACEHOLDER\] /);
    expect(run(["validate", "ESB12345674"]).code).toBe(1);
    expect(run(["validate", "ESB12345674", "--allow-vat-prefix"]).stdout).toBe(
      "ESB12345674: valid CIF B12345674 (Limited liability company)\n"
    );
  });

  it("takes a value that starts with a hyphen after --", () => {
    expect(run(["validate", "--", "-12345678Z"]).stdout).toBe(
      "-12345678Z: valid DNI 12345678Z\n"
    );
  });

  it("needs at least one value", () => {
    expectUsage(run(["validate"]), /validate needs at least one value/);
    expectUsage(
      run(["validate", "--json"]),
      /validate needs at least one value/
    );
  });
});

describe("CLI: type", () => {
  it("prints the type from the format, without checking the control character", () => {
    expect(run(["type", "12345678A"])).toEqual({
      code: 0,
      stdout: "DNI\n",
      stderr: "",
    });
    expect(run(["type", "k1234567l"]).stdout).toBe("NIF_KLM\n");
    expect(run(["type", "X1234567L"]).stdout).toBe("NIE\n");
    expect(run(["type", "B1234567D"]).stdout).toBe("CIF\n");
  });

  it("exits with 1, and explains on stderr, when the format is not recognised", () => {
    expect(run(["type", "T1234567A"])).toEqual({
      code: 1,
      stdout: "",
      stderr: "T1234567A: not the format of a NIF, NIE or CIF\n",
    });
  });

  it("--json prints the input and the type, null when not recognised", () => {
    const valid = run(["type", "12345678A", "--json"]);
    expect([valid.code, json(valid)]).toEqual([
      0,
      { input: "12345678A", type: "DNI" },
    ]);
    const unknown = run(["type", "T1", "--json"]);
    expect([unknown.code, json(unknown), unknown.stderr]).toEqual([
      1,
      { input: "T1", type: null },
      "",
    ]);
  });

  it("--allow-vat-prefix accepts ES + NIF (VAT-1)", () => {
    expect(run(["type", "ESB12345674"]).code).toBe(1);
    expect(run(["type", "ESB12345674", "--allow-vat-prefix"]).stdout).toBe(
      "CIF\n"
    );
  });

  it("takes exactly one value", () => {
    expectUsage(run(["type"]), /type takes one value, got none/);
    expectUsage(run(["type", "a", "b"]), /type takes one value, got 2/);
  });
});

describe("CLI: normalize", () => {
  it("prints the canonical form, without validating, and exits with 0", () => {
    expect(run(["normalize", " x-0123456-7l "])).toEqual({
      code: 0,
      stdout: "X1234567L\n",
      stderr: "",
    });
    expect(run(["normalize", "1234567l"]).stdout).toBe("01234567L\n");
    expect(run(["normalize", "abc 1.2"]).stdout).toBe("ABC12\n");
  });

  it("--json prints the input and the normalized value", () => {
    expect(json(run(["normalize", "12.345.678-z", "--json"]))).toEqual({
      input: "12.345.678-z",
      normalized: "12345678Z",
    });
  });

  it("takes exactly one value", () => {
    expectUsage(run(["normalize"]), /normalize takes one value, got none/);
    expectUsage(
      run(["normalize", "a", "b"]),
      /normalize takes one value, got 2/
    );
  });
});

describe("CLI: generate", () => {
  it("prints the values of createGenerator(seed), one per line", () => {
    const stream = createGenerator(42);
    expect(run(["generate", "dni", "--count", "3", "--seed", "42"])).toEqual({
      code: 0,
      stdout: `${[stream.dni(), stream.dni(), stream.dni()].join("\n")}\n`,
      stderr: "",
    });
    expect(run(["generate", "dni", "--seed", "1"]).stdout).toBe("62707394X\n");
    expect(run(["generate", "DNI", "--seed=1"]).stdout).toBe("62707394X\n");
  });

  it.each(["dni", "nie", "cif", "nif"] as const)(
    "%s: valid values of the type, the same for the same seed",
    (name) => {
      const result = run(["generate", name, "--count", "50", "--seed", "7"]);
      const values = result.stdout.trimEnd().split("\n");
      expect(values).toHaveLength(50);
      const generator = createGenerator(7);
      for (const value of values) {
        expect(value).toBe(generator[name]());
        const { valid, type } = validate(value);
        expect(valid).toBe(true);
        if (name !== "nif")
          expect(type === "NIF_KLM" ? "dni" : type?.toLowerCase()).toBe(name);
      }
    }
  );

  it("--format gives the display form", () => {
    expect(run(["generate", "dni", "--seed", "1", "--format"]).stdout).toBe(
      "62707394-X\n"
    );
  });

  it("--json prints the seed and the values; without --seed the seed is random and reproduces them", () => {
    const stream = createGenerator(1);
    expect(
      json(run(["generate", "nie", "--seed", "1", "--count", "2", "--json"]))
    ).toEqual({ seed: 1, values: [stream.nie(), stream.nie()] });
    const random = json(run(["generate", "cif", "--count", "3", "--json"])) as {
      seed: number;
      values: string[];
    };
    expect(Number.isInteger(random.seed)).toBe(true);
    expect(random.seed).toBeGreaterThanOrEqual(0);
    expect(random.seed).toBeLessThan(2 ** 32);
    expect(
      json(
        run([
          "generate",
          "cif",
          "--count",
          "3",
          "--json",
          "--seed",
          String(random.seed),
        ])
      )
    ).toEqual(random);
  });

  it("accepts any integer seed, negative ones with --seed=", () => {
    expect(run(["generate", "dni", "--seed=-5"]).stdout).toBe(
      `${createGenerator(-5).dni()}\n`
    );
    expect(run(["generate", "dni", "--seed", "+5"]).stdout).toBe(
      `${createGenerator(5).dni()}\n`
    );
  });

  it("rejects an unknown type, a bad --count or a bad --seed", () => {
    expectUsage(
      run(["generate"]),
      /generate takes one type \(dni, nie, cif, nif\), got none/
    );
    expectUsage(run(["generate", "dni", "nie"]), /got 2/);
    expectUsage(
      run(["generate", "passport"]),
      /unknown type "passport": use dni, nie, cif, nif/
    );
    for (const count of ["0", "-1", "1.5", "abc", "", String(MAX_COUNT + 1)])
      expectUsage(
        run(["generate", "dni", `--count=${count}`]),
        `--count must be an integer from 1 to ${MAX_COUNT}, not "${count}"`
      );
    for (const seed of ["1.5", "abc", "", "1e3", "9007199254740992"])
      expectUsage(
        run(["generate", "dni", `--seed=${seed}`]),
        /--seed must be an integer/
      );
  });

  it("--count accepts the maximum", () => {
    const result = run([
      "generate",
      "nif",
      "--count",
      String(MAX_COUNT),
      "--seed",
      "3",
    ]);
    expect(result.code).toBe(0);
    expect(result.stdout.split("\n")).toHaveLength(MAX_COUNT + 1);
  });
});

describe("CLI: check", () => {
  const CSV = [
    "id,nif,name",
    "1,12345678Z,Ana",
    '2,"B-1234567-4","Acme, S.L."',
    "3,12345678A,Luis",
    "",
    '4,,"Sin ""NIF"""',
    "5,X1234567L",
    "6",
    "",
  ].join("\n");
  const files = { "people.csv": CSV };

  it("prints each invalid row with its number, and a summary, and exits with 1", () => {
    expect(
      run(["check", "--file", "people.csv", "--column", "nif"], files)
    ).toEqual({
      code: 1,
      stdout:
        'row 4: 12345678A: invalid [DNI-2 INVALID_CONTROL_CHARACTER] The control character is not correct: for this DNI it should be "Z".\n' +
        'row 6: "": invalid [INPUT-2 EMPTY] Enter a NIF, NIE or CIF.\n' +
        'row 8: "": invalid [INPUT-2 EMPTY] Enter a NIF, NIE or CIF.\n' +
        '6 rows checked in people.csv, column "nif": 3 valid, 3 invalid\n',
      stderr: "",
    });
  });

  it("--json prints the counts and validate()'s result for each invalid row", () => {
    const result = run(
      ["check", "--file", "people.csv", "--column", "nif", "--json"],
      files
    );
    expect(result.code).toBe(1);
    expect(json(result)).toEqual({
      file: "people.csv",
      column: "nif",
      rows: 6,
      valid: 3,
      invalid: 3,
      errors: [
        { row: 4, input: "12345678A", ...validate("12345678A") },
        { row: 6, input: "", ...validate("") },
        { row: 8, input: "", ...validate("") },
      ],
    });
  });

  it("exits with 0 when every row is valid", () => {
    const valid = { "ok.csv": '﻿nif\r\n12345678Z\r\n"X-1234567-L"\r\n' };
    expect(
      run(["check", "--file", "ok.csv", "--column", "nif"], valid)
    ).toEqual({
      code: 0,
      stdout: '2 rows checked in ok.csv, column "nif": 2 valid, 0 invalid\n',
      stderr: "",
    });
    expect(
      json(
        run(["check", "--file", "ok.csv", "--column", "nif", "--json"], valid)
      )
    ).toEqual({
      file: "ok.csv",
      column: "nif",
      rows: 2,
      valid: 2,
      invalid: 0,
      errors: [],
    });
  });

  it("counts one row, and none", () => {
    expect(
      run(["check", "--file", "a.csv", "--column", "nif"], {
        "a.csv": "nif\n12345678Z",
      }).stdout
    ).toBe('1 row checked in a.csv, column "nif": 1 valid, 0 invalid\n');
    expect(
      run(["check", "--file", "a.csv", "--column", "nif"], { "a.csv": "nif\n" })
        .stdout
    ).toBe('0 rows checked in a.csv, column "nif": 0 valid, 0 invalid\n');
  });

  it("--delimiter reads a file separated by semicolons; column names are trimmed", () => {
    const semicolons = { "s.csv": 'name; NIF \n"García; Ana";12345678A\n' };
    expect(
      run(
        ["check", "--file", "s.csv", "--column", "NIF", "--delimiter", ";"],
        semicolons
      ).stdout
    ).toMatch(/^row 2: 12345678A: invalid \[DNI-2 /);
    expectUsage(
      run(["check", "--file", "s.csv", "--column", "NIF"], semicolons),
      /s\.csv: no column "NIF" in the first row: "name; NIF "/
    );
  });

  it("applies the validate options and --locale", () => {
    const data = { "d.csv": "nif\nG1234567D\nB12345674\n" };
    const args = ["check", "--file", "d.csv", "--column", "nif"];
    expect(run([...args, "--cif-control", "lenient"], data).code).toBe(0);
    expect(
      run([...args, "--types", "DNI", "--locale", "gl"], data).stdout
    ).toContain("row 3: B12345674: invalid [POLICY-2 UNSUPPORTED_TYPE] ");
  });

  it("rejects a bad command line or a file it can't read (exit code 2)", () => {
    expectUsage(
      run(["check", "people.csv", "--column", "nif"], files),
      /check takes no values/
    );
    expectUsage(
      run(["check", "--column", "nif"], files),
      /check needs --file <path>/
    );
    expectUsage(
      run(["check", "--file", "people.csv"], files),
      /check needs --column <name>/
    );
    for (const delimiter of ["", ";;", '"', "\n"])
      expectUsage(
        run(
          [
            "check",
            "--file",
            "people.csv",
            "--column",
            "nif",
            `--delimiter=${delimiter}`,
          ],
          files
        ),
        /--delimiter must be one character, not a quote or a line break/
      );
    expectUsage(
      run(["check", "--file", "missing.csv", "--column", "nif"], files),
      /missing\.csv: ENOENT: no such file or directory/
    );
    expectUsage(
      run(["check", "--file", "e.csv", "--column", "nif"], { "e.csv": "" }),
      /e\.csv: the file is empty/
    );
    expectUsage(
      run(["check", "--file", "q.csv", "--column", "nif"], {
        "q.csv": 'nif\n12345678Z\n"B1234567',
      }),
      /q\.csv: row 3: a quoted field is never closed/
    );
    expectUsage(
      run(["check", "--file", "people.csv", "--column", "cif"], files),
      /people\.csv: no column "cif" in the first row: "id", "nif", "name"/
    );
    expectUsage(
      run(
        ["check", "--file", "people.csv", "--column", "nif", "--locale", "it"],
        files
      ),
      /unknown --locale "it"/
    );
  });
});
