#!/usr/bin/env node
/**
 * The executable of the command line interface: the `bin` of package.json,
 * built to dist/esm/cli/bin.mjs (scripts/build.mjs checks that it keeps the
 * line above). Everything it does is in main.ts.
 *
 * It sets `process.exitCode` instead of calling `process.exit()`, so Node.js
 * writes all of the output to a pipe before the process ends.
 */
import { nodeIo } from "./io";
import { main } from "./main";

process.exitCode = main(process.argv.slice(2), nodeIo());
