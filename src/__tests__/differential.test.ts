import * as v1 from "nif-v1";
import { describe, expect, it } from "vitest";
import * as current from "..";

// Differential test (#47): the current code must behave exactly like the
// published v1.0.11 (installed as the `nif-v1` dev alias) for every export
// and every input. Any difference is a bug in the refactor, even if the new
// result looks "more correct": behaviour changes belong in their own PR.

type Exports = Record<string, unknown>;
const currentExports = current as unknown as Exports;
const v1Exports = v1 as unknown as Exports;

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

const random = createRandom(47);
const randomInt = (max: number) => Math.floor(random() * max);
const pick = <T>(items: readonly T[]): T => items[randomInt(items.length)] as T;

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const CIF_LETTERS = "JABCDEFGHI";
const CIF_KEYS = "ABCDEFGHJNPQRSUVW";
const CIF_LETTER_KEYS = "NPQRSW";
const CIF_DIGIT_KEYS = "ABEH";

// Characters used for mutations and random strings: ASCII, the whitespace
// that `+" "` turns into 0, non-ASCII digits, and look-alikes whose
// upper case is (or ends with) an ASCII letter.
const ALPHABET = Array.from(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
    " -./\\|$^()[]{}*+?_,;:'\"`~!@#%&=<>" +
    "\t\n\v\f\r\u0000        　﻿᠎" +
    "ıſßẞﬀﬁﬂﬃﬄﬅﬆŉǰİKÅＫｋ０９٣۵ñÑéÉ" +
    "𐀀\u{1f600}\u{10428}"
);

const pad = (value: number, length: number) =>
  String(value).padStart(length, "0");

function cifControl(digits: string): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = Number(digits[i]);
    if (i % 2 === 0) {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += digit;
    }
  }
  return (10 - (sum % 10)) % 10;
}

// Valid documents built with the published algorithms, plus the variants
// that exercise each branch (the other control type for CIF-3, etc.).
function generateValid(): string[] {
  const kind = randomInt(6);
  if (kind === 0) {
    const n = randomInt(100_000_000);
    return [pad(n, 8) + DNI_LETTERS[n % 23]];
  }
  if (kind === 1) {
    const n = randomInt(10_000_000);
    return [pick(["K", "L", "M"]) + pad(n, 7) + DNI_LETTERS[n % 23]];
  }
  if (kind === 2) {
    const prefix = randomInt(3);
    const n = randomInt(10_000_000);
    return ["XYZ"[prefix] + pad(n, 7) + DNI_LETTERS[(prefix * 1e7 + n) % 23]];
  }
  if (kind === 3) {
    const n = randomInt(10_000_000);
    return [`X0${pad(n, 7)}${DNI_LETTERS[n % 23]}`];
  }
  const key = pick(Array.from(CIF_KEYS));
  const digits = pad(randomInt(10_000_000), 7);
  const control = cifControl(digits);
  const letter = key + digits + CIF_LETTERS[control];
  const digit = key + digits + control;
  if (CIF_LETTER_KEYS.includes(key)) return [letter, digit];
  if (CIF_DIGIT_KEYS.includes(key)) return [digit, letter];
  return [letter, digit];
}

function mutate(value: string): string {
  const chars = Array.from(value);
  const at = randomInt(chars.length);
  switch (randomInt(4)) {
    case 0: // replace
      chars[at] = pick(ALPHABET);
      break;
    case 1: // insert
      chars.splice(at, 0, pick(ALPHABET));
      break;
    case 2: // delete
      chars.splice(at, 1);
      break;
    default: {
      // swap with the next character
      const next = (at + 1) % chars.length;
      [chars[at], chars[next]] = [chars[next] as string, chars[at] as string];
    }
  }
  return chars.join("");
}

function mixedCase(value: string): string {
  return Array.from(value)
    .map((char) => (random() < 0.5 ? char.toLowerCase() : char.toUpperCase()))
    .join("");
}

function randomString(maxLength: number): string {
  const length = randomInt(maxLength + 1);
  let value = "";
  for (let i = 0; i < length; i++) value += pick(ALPHABET);
  return value;
}

function randomCodeUnits(maxLength: number): string {
  const length = randomInt(maxLength + 1);
  let value = "";
  for (let i = 0; i < length; i++)
    value += String.fromCharCode(randomInt(0x10000));
  return value;
}

const inputs: unknown[] = [];

// 1. Valid documents, their case variants and single-character mutations.
for (let i = 0; i < 12_000; i++) {
  for (const valid of generateValid()) {
    inputs.push(valid, valid.toLowerCase(), mixedCase(valid));
    inputs.push(mutate(valid), mutate(valid), mutate(valid.toLowerCase()));
    // Truncated and extended forms (wrong lengths, NIE-3 look-alikes).
    inputs.push(valid.slice(0, randomInt(valid.length)));
    inputs.push(valid + pick(ALPHABET));
  }
}

// 2. Look-alikes: control characters replaced with characters whose upper
// case is, or ends with, the expected ASCII letter (for example "ſ" -> "S",
// "ﬅ" -> "ST", "ﬃ" -> "FFI"), and whitespace in place of zeros.
const specialUpperCase: string[] = [];
for (let code = 0x80; code < 0x10000; code++) {
  const char = String.fromCharCode(code);
  const upper = char.toUpperCase();
  if (upper !== char && upper.charCodeAt(upper.length - 1) < 0x80)
    specialUpperCase.push(char);
}
for (let i = 0; i < 4_000; i++) {
  const [valid] = generateValid() as [string];
  const head = valid.slice(0, -1);
  for (const char of specialUpperCase) inputs.push(head + char);
  if (random() < 0.2)
    inputs.push(
      pick(specialUpperCase) + valid.slice(1),
      `${valid.slice(0, 1)}ı${valid.slice(2)}`
    );
  inputs.push(valid.replace(/0/g, () => pick([" ", "\t", " ", "﻿", "　"])));
}

// 3. Random strings around document length and longer, and random UTF-16
// code units (lone surrogates included).
for (let i = 0; i < 30_000; i++) inputs.push(randomString(12));
for (let i = 0; i < 5_000; i++) inputs.push(randomString(40));
for (let i = 0; i < 5_000; i++) inputs.push(randomCodeUnits(12));

// 4. Digit runs of every length with letters: isValidDniLetter ignores the
// format and parses all digits as one number (a rounded double above 2^53,
// Infinity above ~309 digits).
for (let length = 1; length <= 40; length++) {
  for (let i = 0; i < 100; i++) {
    let digits = "";
    for (let j = 0; j < length; j++) digits += randomInt(10);
    const letter = DNI_LETTERS.charAt(Number(digits) % 23);
    inputs.push(
      digits + letter,
      digits + pick(ALPHABET),
      `A${digits}${letter}`
    );
  }
}
for (const length of [300, 308, 309, 310, 400, 1000]) {
  inputs.push(`${"9".repeat(length)}T`, `${"1".repeat(length)}T`);
  inputs.push(`${"9".repeat(length)}Z`, `K${"9".repeat(length)}t`);
}

// 5. Every BMP code unit at the first and last position of a DNI and a
// letter-control CIF.
for (const template of ["12345678Z", "P2807900B"]) {
  for (let code = 0; code < 0x10000; code++) {
    const char = String.fromCharCode(code);
    inputs.push(char + template.slice(1), template.slice(0, -1) + char);
  }
}
// A sample of astral code points at the last position.
for (let codePoint = 0x10000; codePoint <= 0x10ffff; codePoint += 0x3f1)
  inputs.push(`12345678${String.fromCodePoint(codePoint)}`);

// 6. Empty, whitespace-only and very long strings.
inputs.push("", " ", "\t", "\n", "   ", " ", "﻿");
inputs.push(
  "9".repeat(100_000),
  `X${"0".repeat(100_000)}L`,
  "A".repeat(100_000),
  `B${"1".repeat(100_000)}4`,
  "36698729K".repeat(10_000)
);

// 7. Non-string values.
inputs.push(
  null,
  undefined,
  0,
  -1,
  12345678,
  1.5,
  NaN,
  Infinity,
  BigInt(36698729),
  true,
  false,
  Symbol("36698729K"),
  {},
  [],
  ["36698729K"],
  ["A07727886"],
  { toString: () => "36698729K" },
  new String("36698729K"),
  new Date(0),
  /36698729K/,
  () => "36698729K"
);

type Outcome =
  | { threw: false; value: unknown }
  | { threw: true; name: string; message: string };

function run(fn: (value: unknown) => unknown, value: unknown): Outcome {
  try {
    return { threw: false, value: fn(value) };
  } catch (error) {
    const { name, message } = error as Error;
    return { threw: true, name, message };
  }
}

function show(value: unknown): string {
  if (typeof value === "string")
    return value.length > 40
      ? `${JSON.stringify(value.slice(0, 40))}... (${value.length})`
      : JSON.stringify(value);
  if (typeof value === "symbol" || typeof value === "bigint")
    return String(value);
  return `${typeof value} ${Object.prototype.toString.call(value)}`;
}

const exportNames = Object.keys(v1Exports).sort();
const functionNames = exportNames.filter(
  (name) => typeof v1Exports[name] === "function"
);

describe(`differential test against v1.0.11 (${inputs.length} inputs)`, () => {
  it("compares at least 200,000 inputs", () =>
    expect(inputs.length).toBeGreaterThanOrEqual(200_000));

  it("exports exactly the same names", () =>
    expect(Object.keys(currentExports).sort()).toEqual(exportNames));

  it.each(exportNames)("%s has the same type and shape", (name) => {
    const ours = currentExports[name];
    const theirs = v1Exports[name];
    expect(typeof ours).toBe(typeof theirs);
    if (theirs instanceof RegExp) {
      expect(ours).toBeInstanceOf(RegExp);
      expect((ours as RegExp).source).toBe(theirs.source);
      expect((ours as RegExp).flags).toBe(theirs.flags);
    } else if (typeof theirs === "function") {
      expect((ours as () => unknown).length).toBe(theirs.length);
    } else {
      expect(ours).toEqual(theirs);
    }
  });

  it("keeps the same aliases (isValidCif is isValidLegalEntityNif, etc.)", () => {
    const aliases = [
      ["isValidCif", "isValidLegalEntityNif"],
      ["isValidCifControlCode", "isValidLegalEntityNifControlCode"],
    ] as const;
    for (const [alias, name] of aliases) {
      expect(v1Exports[alias]).toBe(v1Exports[name]);
      expect(currentExports[alias]).toBe(currentExports[name]);
    }
  });

  it.each(functionNames)(
    "%s returns (or throws) exactly the same",
    (name) => {
      const ours = currentExports[name] as (value: unknown) => unknown;
      const theirs = v1Exports[name] as (value: unknown) => unknown;
      const mismatches: string[] = [];
      for (const value of inputs) {
        const expected = run(theirs, value);
        const actual = run(ours, value);
        const same =
          expected.threw === actual.threw &&
          (expected.threw
            ? actual.threw &&
              expected.name === actual.name &&
              expected.message === actual.message
            : !actual.threw && Object.is(expected.value, actual.value));
        if (!same && mismatches.length < 20)
          mismatches.push(
            `${name}(${show(value)}): v1 ${JSON.stringify(expected)}, now ${JSON.stringify(actual)}`
          );
      }
      expect(mismatches).toEqual([]);
    },
    60_000
  );
});
