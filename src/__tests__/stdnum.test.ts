import { stdnum } from "stdnum";
import { describe, expect, it } from "vitest";
import { normalize, validate } from "..";
import { cleanup } from "../normalize";

// Differential test against stdnum (#41), the JavaScript port of
// python-stdnum, on about 50,000 generated inputs. Every difference must be
// one of the SPEC.md decisions below, also listed in SPEC.md, "Differences
// from other libraries". Anything else fails the test.

const ALLOWED = {
  "CIF-3": "stdnum accepts a letter or a digit control for every CIF key",
  "NIE-3": "stdnum rejects the old 10-character NIE form X0nnnnnnnL",
  "NORM-4": "stdnum doesn't left-pad a DNI with fewer than 8 digits",
  "NORM-2":
    "stdnum only removes spaces, hyphens, dots and slashes, not other white space (tabs, no-break spaces…)",
  "NORM-1":
    "stdnum folds non-ASCII look-alikes to ASCII (Unicode digits such as ０, ſ -> S, ı -> I); SPEC accepts ASCII only",
  "VAT-1": "stdnum always strips an ES prefix; validate() needs allowVatPrefix",
  "KLM-3":
    "stdnum doesn't check that the 7 characters after K, L or M are digits",
} as const;
type Difference = keyof typeof ALLOWED;

// Small seeded PRNG (mulberry32) so a failure can be reproduced.
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = createRandom(4141);
const randomInt = (max: number) => Math.floor(random() * max);
const pick = <T>(items: readonly T[]): T => items[randomInt(items.length)] as T;
const pad = (n: number, length: number) => String(n).padStart(length, "0");

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const CIF_LETTERS = "JABCDEFGHI";
const CIF_KEYS = Array.from("ABCDEFGHJNPQRSUVW");
const ALPHABET = Array.from(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -./\t _,ñÑıſ０９"
);

function cifControl(digits: string): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const d = Number(digits[i]);
    sum += i % 2 === 0 ? Math.floor((2 * d) / 10) + ((2 * d) % 10) : d;
  }
  return (10 - (sum % 10)) % 10;
}

/** A valid-looking document; CIFs get either control form. */
function document(): string {
  switch (randomInt(5)) {
    case 0: {
      const n = randomInt(100_000_000);
      return pad(n, 8) + DNI_LETTERS[n % 23];
    }
    case 1: {
      const n = randomInt(10_000_000);
      return pick(["K", "L", "M"]) + pad(n, 7) + DNI_LETTERS[n % 23];
    }
    case 2: {
      const p = randomInt(3);
      const n = randomInt(10_000_000);
      return "XYZ"[p] + pad(n, 7) + DNI_LETTERS[(p * 1e7 + n) % 23];
    }
    default: {
      const digits = pad(randomInt(10_000_000), 7);
      const c = cifControl(digits);
      return pick(CIF_KEYS) + digits + (random() < 0.5 ? c : CIF_LETTERS[c]);
    }
  }
}

/** How a person might type it. */
function typed(value: string): string {
  let out = value;
  if (random() < 0.3) out = out.toLowerCase();
  if (random() < 0.1 && out.startsWith("X")) out = `X0${out.slice(1)}`;
  if (random() < 0.1 && /^0\d{7}/.test(out)) out = out.replace(/^0+/, "");
  if (random() < 0.1) out = `ES${out}`;
  const separators = randomInt(3);
  for (let i = 0; i < separators; i++) {
    const at = randomInt(out.length + 1);
    out =
      out.slice(0, at) + pick([" ", "-", ".", "/", "\t", " "]) + out.slice(at);
  }
  return out;
}

function mutate(value: string): string {
  const chars = Array.from(value);
  chars[randomInt(chars.length)] = pick(ALPHABET);
  return chars.join("");
}

const inputs: string[] = [];
for (let i = 0; i < 24_000; i++) {
  const doc = document();
  inputs.push(doc, typed(doc), mutate(doc), mutate(typed(doc)));
}
for (let i = 0; i < 4_000; i++) {
  let value = "";
  const length = randomInt(13);
  for (let j = 0; j < length; j++) value += pick(ALPHABET);
  inputs.push(value);
}

const nif = stdnum.ES?.nif;
if (nif === undefined) throw new Error("stdnum has no ES.nif validator");
const theirs = (value: string) => nif.validate(value);
const CIF_SHAPE = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;

/** The SPEC.md decision behind a difference, or null. */
function explain(value: string): Difference | null {
  const ours = validate(value);
  const them = theirs(value);
  if (them.isValid && !ours.valid) {
    const compact = them.compact as string;
    // Non-ASCII look-alikes that stdnum folds to ASCII.
    // biome-ignore lint/suspicious/noControlCharactersInRegex: ASCII range.
    if (/[^\x00-\x7f]/.test(normalize(value))) return "NORM-1";
    const rule = validate(compact, { allowVatPrefix: true }).error?.rule;
    if (CIF_SHAPE.test(compact) && rule === "CIF-3") return "CIF-3";
    if (rule === "KLM-3" || rule === "KLM-2") return "KLM-3";
    if (normalize(value).startsWith("ES")) return "VAT-1";
    return null;
  }
  if (ours.valid && !them.isValid) {
    // Only ASCII white space and a few separators are removed by stdnum.
    if (/[\t\n\v\f\r ]/.test(value)) return "NORM-2";
    // Cleaned (NORM-1..3) but not yet canonical.
    const clean = cleanup(value);
    if (/^\d{1,7}[A-Z]$/.test(clean)) return "NORM-4";
    if (/^X0\d{7}[A-Z]$/.test(clean)) return "NIE-3";
    return null;
  }
  return null;
}

describe(`differential test against stdnum (${inputs.length} inputs)`, () => {
  it("compares about 100,000 inputs", () =>
    expect(inputs.length).toBeGreaterThanOrEqual(100_000));

  it("every difference is an allow-listed SPEC.md decision", () => {
    const seen = new Map<Difference, number>();
    const unexplained: string[] = [];
    let agree = 0;
    for (const value of inputs) {
      if (validate(value).valid === theirs(value).isValid) {
        agree++;
        continue;
      }
      const reason = explain(value);
      if (reason === null) {
        if (unexplained.length < 20)
          unexplained.push(
            `${JSON.stringify(value)}: ours ${validate(value).valid}, stdnum ${theirs(value).isValid}`
          );
      } else seen.set(reason, (seen.get(reason) ?? 0) + 1);
    }
    expect(unexplained).toEqual([]);
    // Every allow-listed difference actually occurs, so the list stays
    // honest; most inputs agree.
    expect([...seen.keys()].sort()).toEqual(Object.keys(ALLOWED).sort());
    expect(agree / inputs.length).toBeGreaterThan(0.8);
  }, 60_000);

  it("POLICY-1: with rejectPlaceholders, placeholders are the only new difference", () => {
    for (const value of ["00000000T", "00000001R", "99999999R", "X0000000T"]) {
      expect(theirs(value).isValid).toBe(true);
      expect(validate(value).valid).toBe(true);
      expect(validate(value, { rejectPlaceholders: true }).valid).toBe(false);
    }
  });
});
