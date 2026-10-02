// Draws the coverage badge, in the style of .github/badges/coverage.svg, from
// the `total` of coverage/coverage-summary.json (Vitest's json-summary
// reporter). No dependencies and no third-party service.

const METRICS = ["statements", "branches", "functions", "lines"];

/**
 * The figure on the badge: the lowest of the four metrics, rounded down to
 * one decimal, so the badge never shows more than every metric reaches.
 * @param {Record<string, { pct: number | string }>} totals
 * @returns {number}
 */
export function coveragePercent(totals) {
  const values = METRICS.map((metric) => Number(totals[metric]?.pct));
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error(
      `coverage-summary.json has no ${METRICS.join(", ")} percentages`
    );
  }
  return Math.floor(Math.min(...values) * 10) / 10;
}

/**
 * @param {number} percent
 * @returns {string}
 */
function colour(percent) {
  if (percent >= 95) return "#2e7d32";
  if (percent >= 80) return "#9a6700";
  return "#b3261e";
}

/**
 * @param {number} percent
 * @returns {string} the SVG document
 */
export function coverageBadge(percent) {
  const value = `${percent}%`;
  // The same geometry as .github/badges/coverage.svg, widened for longer
  // values such as "99.5%".
  const valueWidth = Math.max(54, 14 + value.length * 9);
  const width = 96 + valueWidth;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" role="img" aria-label="coverage: ${value}">
  <title>coverage: ${value}</title>
  <rect width="96" height="28" fill="#555"/>
  <rect x="96" width="${valueWidth}" height="28" fill="${colour(percent)}"/>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="10" letter-spacing="1">
    <text x="48" y="18">COVERAGE</text>
    <text x="${96 + valueWidth / 2}" y="18" font-weight="bold">${value}</text>
  </g>
</svg>
`;
}
