import { describe, expect, it } from "vitest";
import {
  isValidCif,
  isValidCifControlCode,
  isValidDni,
  isValidDniLetter,
  isValidLegalEntityNif,
  isValidLegalEntityNifControlCode,
  isValidNaturalPersonNif,
  isValidNie,
  isValidNif,
  replaceNieLetter,
} from "..";

// #40: every isValid* function is total. Any input returns a boolean and
// nothing throws.

type Validator = (value: string) => boolean;

const validators: Record<string, Validator> = {
  isValidNif,
  isValidNaturalPersonNif,
  isValidDni,
  isValidDniLetter,
  isValidNie,
  isValidLegalEntityNif,
  isValidCif,
  isValidLegalEntityNifControlCode,
  isValidCifControlCode,
};

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

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
  " -./\\|$^()[]{}*+?\n\t\u0000ıſßñÑﬁK\u{1f600}";

function randomString(random: () => number, maxLength: number): string {
  const chars = Array.from(ALPHABET);
  const length = Math.floor(random() * (maxLength + 1));
  let value = "";
  for (let i = 0; i < length; i++)
    value += chars[Math.floor(random() * chars.length)];
  return value;
}

const random = createRandom(40);
const randomStrings = Array.from({ length: 500 }, (_, i) =>
  // mostly around document length, some longer
  randomString(random, i % 10 === 0 ? 64 : 12)
);

const longStrings = [
  "9".repeat(100_000),
  `X${"0".repeat(100_000)}L`,
  "A".repeat(1_000_000),
  `B${"1".repeat(1_000_000)}4`,
  "36698729K".repeat(10_000),
];

const nonStrings: unknown[] = [
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
  {
    toString() {
      throw new Error("toString should not be called");
    },
  },
  new String("36698729K"),
  new Date(),
  /36698729K/,
  () => "36698729K",
];

describe("#40: validators never throw and always return a boolean", () => {
  Object.entries(validators).forEach(([name, validate]) => {
    it(`${name}: random strings`, () => {
      randomStrings.forEach((value) => {
        let result: unknown;
        expect(() => {
          result = validate(value);
        }).not.toThrow();
        expect(typeof result).toBe("boolean");
      });
    });

    it(`${name}: very long strings`, () => {
      longStrings.forEach((value) => {
        let result: unknown;
        expect(() => {
          result = validate(value);
        }).not.toThrow();
        expect(typeof result).toBe("boolean");
      });
    });

    it(`${name}: non-string input returns false`, () => {
      nonStrings.forEach((value) => {
        let result: unknown;
        expect(() => {
          result = validate(value as string);
        }).not.toThrow();
        expect(result).toBe(false);
      });
    });

    it(`${name}: empty and short strings return false`, () => {
      ["", " ", "A", "A1", "X", "12345678"].forEach((value) => {
        expect(validate(value)).toBe(false);
      });
    });
  });
});

describe("#40: replaceNieLetter keeps its v1 behaviour and throws (deprecated)", () => {
  it("replaces X, Y and Z (NIE-2)", () => {
    expect(replaceNieLetter("X1234567L")).toBe("01234567L");
    expect(replaceNieLetter("y1234567X")).toBe("11234567X");
    expect(replaceNieLetter("Z1234567R")).toBe("21234567R");
  });

  it("throws Error('Invalid NIE letter') if the first character is not X, Y or Z", () => {
    expect(() => replaceNieLetter("A1234567L")).toThrow("Invalid NIE letter");
    expect(() => replaceNieLetter("")).toThrow("Invalid NIE letter");
  });

  it("throws a TypeError for non-string input", () => {
    expect(() => replaceNieLetter(null as unknown as string)).toThrow(
      TypeError
    );
    expect(() => replaceNieLetter(123 as unknown as string)).toThrow(TypeError);
  });
});
