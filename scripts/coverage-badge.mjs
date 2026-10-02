// The coverage badge of the website, from the `total` of
// coverage/coverage-summary.json (Vitest's json-summary reporter). No
// dependencies and no third-party service. website/integrations/repo-files.mjs
// writes both forms into /coverage/ when it publishes the HTML report:
//
// - /coverage/badge.json, in the shields.io endpoint schema
//   (https://shields.io/badges/endpoint-badge), which the README badge reads;
// - /coverage/badge.svg, drawn here in the flat style of shields.io (20 px
//   tall, 3 px corners, Verdana 11 px, a grey label and a coloured value),
//   for anyone who embeds it directly.

const METRICS = ["statements", "branches", "functions", "lines"];
const LABEL = "coverage";

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
 * The shields.io colour for a percentage, by name (for badge.json) and as
 * the hex value shields.io draws it with (for badge.svg). The library's
 * tests require 100%, so anything less is already a warning.
 */
const COLOURS = [
  { min: 100, name: "brightgreen", hex: "#4b0" },
  { min: 95, name: "green", hex: "#67ac09" },
  { min: 90, name: "yellowgreen", hex: "#95991a" },
  { min: 80, name: "yellow", hex: "#d8b800" },
  { min: 70, name: "orange", hex: "#ea7233" },
  { min: -Infinity, name: "red", hex: "#dd4343" },
];

/**
 * @param {number} percent
 * @returns {{ name: string, hex: string }}
 */
export function coverageColour(percent) {
  const { name, hex } = /** @type {(typeof COLOURS)[number]} */ (
    COLOURS.find(({ min }) => percent >= min)
  );
  return { name, hex };
}

/**
 * The content of /coverage/badge.json: the shields.io endpoint schema.
 * @param {number} percent
 * @returns {string}
 */
export function coverageBadgeJson(percent) {
  return `${JSON.stringify({
    schemaVersion: 1,
    label: LABEL,
    message: `${percent}%`,
    color: coverageColour(percent).name,
  })}\n`;
}

/**
 * Advance widths in Verdana at 11 px (2048 units per em), for the characters
 * a badge can hold. shields.io measures text the same way.
 */
const WIDTH = { ".": 4.0, "%": 12.22 };
const DIGIT = 6.99;
/** "coverage" in Verdana 11 px, as shields.io measures it. */
const LABEL_WIDTH = 51;

/** @param {string} text */
function textWidth(text) {
  let width = 0;
  for (const char of text) width += WIDTH[char] ?? DIGIT;
  return Math.round(width);
}

/**
 * The content of /coverage/badge.svg: the flat style of shields.io.
 * @param {number} percent
 * @returns {string} the SVG document
 */
export function coverageBadge(percent) {
  const value = `${percent}%`;
  const valueText = textWidth(value);
  // 10 px of padding around each text, and the texts 1 px off centre
  // towards the middle of the badge, as shields.io draws them.
  const labelWidth = LABEL_WIDTH + 10;
  const valueWidth = valueText + 10;
  const width = labelWidth + valueWidth;
  const text = (x, length, content) =>
    `<text aria-hidden="true" x="${x * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${length * 10}">${content}</text><text x="${x * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${length * 10}">${content}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${LABEL}: ${value}"><title>${LABEL}: ${value}</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="${width}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${labelWidth}" height="20" fill="#555"/><rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${coverageColour(percent).hex}"/><rect width="${width}" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">${text(6 + LABEL_WIDTH / 2, LABEL_WIDTH, LABEL)}${text(labelWidth + 4 + valueText / 2, valueText, value)}</g></svg>
`;
}
