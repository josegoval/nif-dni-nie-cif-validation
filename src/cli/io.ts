/// <reference types="node" />
/**
 * The real input and output of the command line interface: the process's
 * standard output and error, the file system and the package's version.
 * src/cli/main.ts takes them as an `Io`, so its tests pass a fake.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { Io } from "./main";

/**
 * A reader that stops early (`generate dni --count 1000 | head -1`) closes
 * the pipe, and the next write fails with EPIPE: that ends the output, and
 * is not an error. Anything else still is.
 */
export function ignoreEpipe(error: NodeJS.ErrnoException): void {
  if (error.code !== "EPIPE") throw error;
}

/** The `Io` of the running process. */
export function nodeIo(): Io {
  process.stdout.on("error", ignoreEpipe);
  return {
    stdout: (text) => {
      process.stdout.write(text);
    },
    stderr: (text) => {
      process.stderr.write(text);
    },
    readFile: (path) => readFileSync(path, "utf8"),
    // The package's own package.json, through its `exports` map (a package
    // can import itself by name), so the path is the same from src/ and
    // from dist/esm/cli/.
    version: () =>
      (
        createRequire(import.meta.url)(
          "nif-dni-nie-cif-validation/package.json"
        ) as { version: string }
      ).version,
  };
}
