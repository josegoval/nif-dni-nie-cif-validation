/// <reference types="node" />
/**
 * The executable of the CLI: src/cli/bin.ts and the real io (src/cli/io.ts)
 * in this process, and the built dist/esm/cli/bin.mjs as a child process,
 * the way npx runs it: shebang, exit codes, output through a pipe, the
 * version from package.json. The package is built into .cache/ by
 * scripts/build.mjs, so the test doesn't depend on (or change) dist/.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ignoreEpipe, nodeIo } from "../cli/io";
import { ROOT } from "./snippets";

const { version } = JSON.parse(
  readFileSync(join(ROOT, "package.json"), "utf8")
) as { version: string; bin: Record<string, string> };

describe("CLI: the real io", () => {
  afterEach(() => {
    process.stdout.off("error", ignoreEpipe);
    vi.restoreAllMocks();
  });

  it("writes to stdout and stderr, reads files and knows the version", () => {
    const stdout = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const stderr = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    const io = nodeIo();
    io.stdout("out\n");
    io.stderr("err\n");
    expect(stdout).toHaveBeenCalledWith("out\n");
    expect(stderr).toHaveBeenCalledWith("err\n");
    expect(io.readFile(join(ROOT, "package.json"))).toContain(
      '"name": "nif-dni-nie-cif-validation"'
    );
    expect(() => io.readFile(join(ROOT, "missing.csv"))).toThrow(/ENOENT/);
    expect(io.version()).toBe(version);
  });

  it("stops quietly when the reader closes the pipe (EPIPE), and only then", () => {
    nodeIo();
    expect(process.stdout.listeners("error")).toContain(ignoreEpipe);
    const epipe = Object.assign(new Error("write EPIPE"), { code: "EPIPE" });
    expect(() => ignoreEpipe(epipe)).not.toThrow();
    const other = Object.assign(new Error("write EIO"), { code: "EIO" });
    expect(() => ignoreEpipe(other)).toThrow(other);
  });

  it("bin.ts runs main() with the process's arguments and sets its exit code", async () => {
    const stdout = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const argv = process.argv;
    process.argv = [argv[0] as string, "bin.mjs", "--version"];
    try {
      await import("../cli/bin");
      expect(stdout).toHaveBeenCalledWith(`${version}\n`);
      expect(process.exitCode).toBe(0);
    } finally {
      process.argv = argv;
      process.exitCode = undefined;
    }
  });
});

describe("CLI: the built executable", () => {
  const out = join(ROOT, ".cache", "cli-bin");
  const bin = join(out, "dist", "esm", "cli", "bin.mjs");
  const cli = (args: string[]) =>
    spawnSync(process.execPath, [bin, ...args], {
      cwd: out,
      encoding: "utf8",
    });

  beforeAll(() => {
    mkdirSync(out, { recursive: true });
    execFileSync(
      process.execPath,
      [join(ROOT, "scripts", "build.mjs"), join(out, "dist")],
      { stdio: "pipe" }
    );
  }, 60_000);

  it("is the bin of package.json, and starts with a shebang", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    expect(pkg.bin).toEqual({
      "nif-dni-nie-cif-validation": "dist/esm/cli/bin.mjs",
    });
    expect(readFileSync(bin, "utf8").startsWith("#!/usr/bin/env node\n")).toBe(
      true
    );
  });

  it("validate 12345678Z --json prints its ValidationResult, exit code 0", () => {
    const result = cli(["validate", "12345678Z", "--json"]);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toEqual([
      { input: "12345678Z", valid: true, type: "DNI", normalized: "12345678Z" },
    ]);
  });

  it("an invalid value gives exit code 1, a usage error 2", () => {
    const invalid = cli(["validate", "12345678A"]);
    expect([invalid.status, invalid.stdout]).toEqual([
      1,
      '12345678A: invalid [DNI-2 INVALID_CONTROL_CHARACTER] The control character is not correct: for this DNI it should be "Z".\n',
    ]);
    const usage = cli(["validate"]);
    expect([usage.status, usage.stdout]).toEqual([2, ""]);
    expect(usage.stderr).toContain("validate needs at least one value");
  });

  it("--version prints the version of package.json", () => {
    expect(cli(["--version"]).stdout).toBe(`${version}\n`);
  });

  it("check reads a CSV file", () => {
    writeFileSync(join(out, "people.csv"), "﻿nif\r\n12345678Z\r\nX\r\n");
    const result = cli(["check", "--file", "people.csv", "--column", "nif"]);
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(
      /^row 3: X: invalid \[NIE-1 INVALID_LENGTH\]/
    );
  });

  it("writes everything to a pipe, also a long output", () => {
    const result = cli(["generate", "nif", "--count", "100000", "--seed", "1"]);
    expect(result.status).toBe(0);
    expect(result.stdout.split("\n")).toHaveLength(100_001);
  });
});
