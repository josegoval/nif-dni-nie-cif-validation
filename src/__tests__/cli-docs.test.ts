/**
 * Runs the command lines of the docs (#61), as readme-examples.test.ts and
 * website-examples.test.ts run their code: every ```sh block of the
 * READMEs, docs/api-design.md and the website's command line page.
 *
 * - A line that starts with `npx nif-dni-nie-cif-validation ` is a command,
 *   run with `main()` (cliRun.ts). The `# ` lines right after it are what
 *   it prints, exactly (stdout, then stderr). A command without them must
 *   not be a usage error.
 * - `check` reads the CSV of the last ```csv block before it.
 * - README.es.md has the same commands as README.md, and every language of
 *   the website the same commands as the English page, except the value of
 *   `--locale`, so a translated page can't show a command nobody runs.
 */
import { describe, expect, it } from "vitest";
import { BIN } from "../cli/main";
import { run } from "./cliRun";
import { read } from "./snippets";

const SITE_PAGE = "guides/command-line.mdx";
const SITE = "website/src/content/docs";
const LOCALES = ["es", "ca", "eu", "gl"];
const DOCS = [
  "README.md",
  "README.es.md",
  "docs/api-design.md",
  `${SITE}/${SITE_PAGE}`,
  ...LOCALES.map((locale) => `${SITE}/${locale}/${SITE_PAGE}`),
];

interface Command {
  doc: string;
  /** 1-based line of the command. */
  line: number;
  args: string[];
  /** The `# ` lines after it; `null` when there are none. */
  output: string[] | null;
  /** The content of the last ```csv block before it. */
  csv: string | undefined;
}

/** Splits a command line as a POSIX shell does, for plain quoting only. */
function shellWords(text: string): string[] {
  return [...text.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(
    (match) => match[1] ?? match[2] ?? (match[3] as string)
  );
}

function commands(doc: string): Command[] {
  const lines = read(doc).split("\n");
  const found: Command[] = [];
  let csv: string | undefined;
  for (let i = 0; i < lines.length; i++) {
    const open = /^(\s*)```(sh|csv)\s*$/.exec(lines[i] as string);
    if (!open) continue;
    const indent = (open[1] as string).length;
    const body: { text: string; line: number }[] = [];
    for (i++; i < lines.length && (lines[i] as string).trim() !== "```"; i++)
      body.push({ text: (lines[i] as string).slice(indent), line: i + 1 });
    if (open[2] === "csv") {
      csv = `${body.map((entry) => entry.text).join("\n")}\n`;
      continue;
    }
    let current: Command | undefined;
    for (const { text, line } of body) {
      if (text.startsWith(`npx ${BIN} `)) {
        current = {
          doc,
          line,
          args: shellWords(text.slice(`npx ${BIN} `.length)),
          output: null,
          csv,
        };
        found.push(current);
      } else if (current && (text === "#" || text.startsWith("# "))) {
        current.output ??= [];
        current.output.push(text.slice(2));
      } else current = undefined;
    }
  }
  return found;
}

const ALL = DOCS.flatMap(commands);

describe("command lines of the docs", () => {
  it.each(DOCS)("%s has command lines", (doc) => {
    expect(ALL.filter((command) => command.doc === doc).length).toBeGreaterThan(
      1
    );
  });

  it.each(
    ALL.map((command) => [`${command.doc}:${command.line}`, command] as const)
  )("%s prints what the docs show", (_, command) => {
    const files: Record<string, string> = {};
    const file = command.args[command.args.indexOf("--file") + 1];
    if (command.args.includes("--file") && file && command.csv)
      files[file] = command.csv;
    const result = run(command.args, files);
    if (command.output === null) expect(result.code).not.toBe(2);
    else
      expect(`${result.stdout}${result.stderr}`).toBe(
        `${command.output.join("\n")}\n`
      );
  });

  const shape = (doc: string) =>
    ALL.filter((command) => command.doc === doc).map((command) =>
      command.args.join(" ").replace(/--locale \w+/, "--locale <code>")
    );

  it("README.es.md has the commands of README.md", () => {
    expect(shape("README.es.md")).toEqual(shape("README.md"));
  });

  it.each(LOCALES)(
    "the %s command line page has the commands of the English one",
    (locale) => {
      expect(shape(`${SITE}/${locale}/${SITE_PAGE}`)).toEqual(
        shape(`${SITE}/${SITE_PAGE}`)
      );
    }
  );
});
