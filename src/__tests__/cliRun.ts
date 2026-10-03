/**
 * Test helper: runs the CLI's `main()` with a fake io, for cli.test.ts and
 * cli-docs.test.ts.
 */
import { main } from "../cli/main";

export interface Run {
  code: number;
  stdout: string;
  stderr: string;
}

/** Runs the CLI with a fake io; `files` are the files it can read. */
export function run(argv: string[], files: Record<string, string> = {}): Run {
  let stdout = "";
  let stderr = "";
  const code = main(argv, {
    stdout: (text) => {
      stdout += text;
    },
    stderr: (text) => {
      stderr += text;
    },
    readFile: (path) => {
      const content = files[path];
      if (content === undefined)
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      return content;
    },
    version: () => "9.8.7",
  });
  return { code, stdout, stderr };
}
