import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Unit tests only (the benchmark has its own, in bench/). test/smoke is
    // plain Node and runs against the tarball.
    include: ["src/**/*.test.ts", "bench/**/*.test.mjs"],
    coverage: {
      // On by default so `pnpm test` enforces the thresholds. The compat job
      // turns it off with `--coverage.enabled=false`.
      enabled: true,
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/__tests__/**"],
      // `text` for the terminal, `json-summary` for scripts/coverage-summary.mjs,
      // `html` for the CI artifact, `lcovonly` for editors and other tools.
      reporter: [
        "text",
        "json-summary",
        ["html", { subdir: "html" }],
        "lcovonly",
      ],
      // Write the reports even when a test or a threshold fails.
      reportOnFailure: true,
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
