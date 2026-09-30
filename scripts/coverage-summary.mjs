// Turns coverage/coverage-summary.json (the "json-summary" coverage reporter) into a
// Markdown table. In GitHub Actions it is appended to the job summary;
// locally it is printed to stdout.
import { appendFileSync, readFileSync } from "node:fs";
import { relative } from "node:path";

const summary = JSON.parse(readFileSync("coverage/coverage-summary.json", "utf8"));
const metrics = ["statements", "branches", "functions", "lines"];
const cell = (m) => (m.total === 0 ? "n/a" : `${m.pct}% (${m.covered}/${m.total})`);

const rows = Object.entries(summary)
  .filter(([file]) => file !== "total")
  .map(([file, m]) => `| \`${relative(process.cwd(), file)}\` | ${metrics.map((k) => cell(m[k])).join(" | ")} |`);

const table = [
  "## Coverage",
  "",
  `| File | ${metrics.map((k) => k[0].toUpperCase() + k.slice(1)).join(" | ")} |`,
  `|---|${metrics.map(() => "---").join("|")}|`,
  `| **Total** | ${metrics.map((k) => `**${cell(summary.total[k])}**`).join(" | ")} |`,
  ...rows,
  "",
].join("\n");

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, table);
else process.stdout.write(table);
