// Facts about SPEC.md, read from the file at build time.
import spec from "../../../SPEC.md?raw";

export const SPEC_URL =
  "https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md";

/** The number of rules in SPEC.md: each has an anchor such as `dni-1`. */
export const ruleCount = new Set(
  [...spec.matchAll(/<a id="([a-z]+-\d+)"><\/a>/g)].map((m) => m[1])
).size;

/** The link to one rule of SPEC.md, for example `DNI-2`. */
export const ruleUrl = (rule: string) => `${SPEC_URL}#${rule.toLowerCase()}`;
