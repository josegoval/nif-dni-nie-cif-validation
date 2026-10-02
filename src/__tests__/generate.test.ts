import { stdnum } from "stdnum";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import * as root from "..";
import {
  type CifOrganisationKey,
  isValidCif,
  isValidDni,
  isValidNie,
  isValidNif,
  type NifErrorCode,
  type NifType,
  normalize,
  validate,
} from "..";
import {
  buildCif,
  buildDni,
  buildNie,
  buildNif,
  CIF_KEYS,
} from "../generate/core";
import {
  createGenerator,
  type Generator,
  generateCif,
  generateDni,
  generateInvalid,
  generateNie,
  generateNif,
} from "../generate/index";
import { mulberry32, pad, randomFor, seeded } from "../generate/random";

// Test-data generators (#57, `nif-dni-nie-cif-validation/generate`). The
// values are checked with validate(), which is independent of the generators'
// code path, with stdnum, and with a small implementation of the published
// algorithms written here.

const RUNS = 100_000;

/** Every key that takes a letter (CIF-3); the others take a digit. */
const LETTER_KEYS = "NPQRSW";

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const CIF_LETTERS = "JABCDEFGHI";

/** DNI-2, written out: the letter of a number. */
const dniLetter = (n: number) => DNI_LETTERS.charAt(n % 23);

/** CIF-4, written out: the control value of 7 digits. */
function cifControl(digits: string): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const d = Number(digits.charAt(i));
    sum += i % 2 === 0 ? Math.floor((2 * d) / 10) + ((2 * d) % 10) : d;
  }
  return (10 - (sum % 10)) % 10;
}

/** Is the control character right, with this file's own code? */
function hasRightControl(value: string): boolean {
  const first = value.charAt(0);
  const last = value.charAt(8);
  const digits = value.slice(1, 8);
  if (/\d/.test(first)) return last === dniLetter(Number(value.slice(0, 8)));
  if (first === "K" || first === "L" || first === "M")
    return last === dniLetter(Number(digits));
  if (first === "X" || first === "Y" || first === "Z")
    return last === dniLetter("XYZ".indexOf(first) * 1e7 + Number(digits));
  const control = cifControl(digits);
  return LETTER_KEYS.includes(first)
    ? last === CIF_LETTERS.charAt(control)
    : last === String(control);
}

const PLACEHOLDERS = ["00000000T", "00000001R", "99999999R", "X0000000T"];

/** Checks a generated value against everything that can judge it. */
function expectValid(value: string, type: NifType): void {
  // The canonical form: 9 upper-case characters, no separators (DNI-1,
  // NIE-1, KLM-1, CIF-1).
  expect(value).toMatch(/^[0-9A-Z]{9}$/);
  const result = validate(value, { rejectPlaceholders: true });
  expect(result.error).toBeUndefined();
  expect(result.type).toBe(type);
  expect(result.normalized).toBe(value);
  expect(PLACEHOLDERS).not.toContain(value);
  expect(hasRightControl(value)).toBe(true);
  expect(isValidNif(value, { rejectPlaceholders: true })).toBe(true);
}

/**
 * The first values of `n` that `ok` refuses. The loops below run 100,000
 * times, too many for an `expect` each: they collect the failures and the
 * test expects none.
 */
function failures(n: number, make: () => string, ok: (v: string) => boolean) {
  const bad: string[] = [];
  for (let i = 0; i < n; i++) {
    const value = make();
    if (!ok(value) && bad.length < 5) bad.push(value);
  }
  return bad;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("mulberry32 (the seeded PRNG)", () => {
  /** The reference implementation, as its author published it. */
  function reference(seed: number): () => number {
    let a = seed;
    return () => {
      a += 0x6d2b79f5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it("matches the reference implementation", () => {
    for (const seed of [0, 1, 42, 2024, 2 ** 31, 2 ** 32 - 1]) {
      const ours = mulberry32(seed);
      const theirs = reference(seed);
      let same = true;
      for (let i = 0; i < 20_000; i++) same = same && ours() === theirs();
      expect(same).toBe(true);
    }
  });

  it("gives fixed numbers for fixed seeds (the same on every platform)", () => {
    const a = mulberry32(1);
    expect([a(), a(), a()].map((n) => n.toFixed(10))).toEqual([
      "0.6270739406",
      "0.0027357212",
      "0.5274470400",
    ]);
    const b = mulberry32(0);
    expect([b(), b(), b()].map((n) => n.toFixed(10))).toEqual([
      "0.2664292087",
      "0.0003297457",
      "0.2232720274",
    ]);
  });

  it("returns numbers in [0, 1)", () => {
    const random = mulberry32(99);
    for (let i = 0; i < 50_000; i++) {
      const n = random();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it("reduces a seed modulo 2^32", () => {
    expect(generateDni({ seed: 2 ** 32 })).toBe(generateDni({ seed: 0 }));
    expect(generateDni({ seed: -1 })).toBe(generateDni({ seed: 2 ** 32 - 1 }));
    expect(generateDni({ seed: 2 ** 32 + 7 })).toBe(generateDni({ seed: 7 }));
  });

  it("never reads Math.random when a seed is given", () => {
    const spy = vi.spyOn(Math, "random");
    generateDni({ seed: 1 });
    generateNie({ seed: 1 });
    generateCif({ seed: 1 });
    generateNif({ seed: 1 });
    generateInvalid("DNI", { seed: 1 });
    const gen = createGenerator(1);
    gen.dni();
    gen.nie();
    gen.cif();
    gen.nif();
    gen.invalid("CIF");
    expect(spy).not.toHaveBeenCalled();
  });

  it("reads Math.random when no seed is given", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);
    expect(generateDni()).toBe(generateDni({ seed: undefined }));
    expect(spy).toHaveBeenCalled();
    // 0 -> the smallest number that is not a placeholder, 00000002.
    expect(generateDni()).toBe(`00000002${dniLetter(2)}`);
    expect(randomFor(undefined)).toBe(Math.random);
  });

  it("rejects a seed that is not an integer with a RangeError", () => {
    for (const seed of [
      1.5,
      Number.NaN,
      Infinity,
      "1",
      null,
      {},
      Symbol("s"),
    ]) {
      expect(() => seeded(seed)).toThrow(RangeError);
      expect(() => generateDni({ seed } as never)).toThrow(RangeError);
      expect(() => createGenerator(seed as never)).toThrow(RangeError);
    }
    expect(() => generateDni({ seed: 1.5 })).toThrow("seed must be an integer");
    expect(() => generateDni({ seed: Symbol("s") } as never)).toThrow(
      "a symbol"
    );
  });

  it("pads a number with zeros", () => {
    expect(pad(7, 3)).toBe("007");
    expect(pad(1234, 3)).toBe("1234");
  });
});

describe("DNI-1: generateDni", () => {
  it("DNI-1, DNI-2: 100,000 DNIs validate", () => {
    const gen = createGenerator(1001);
    const bad = failures(
      RUNS,
      () => gen.dni(),
      (v) =>
        /^\d{8}[A-Z]$/.test(v) &&
        validate(v, { rejectPlaceholders: true }).valid
    );
    expect(bad).toEqual([]);
  });

  it("DNI-1, DNI-2: the DNIs have the right shape, letter and type", () => {
    const gen = createGenerator(1002);
    for (let i = 0; i < 5000; i++) expectValid(gen.dni(), "DNI");
    expect(isValidDni(generateDni())).toBe(true);
  });

  it("DNI-1: zero-pads the 8 digits, so some DNIs start with zeros", () => {
    const gen = createGenerator(1003);
    const values = Array.from({ length: 2000 }, () => gen.dni());
    const zeros = values.filter((v) => v.startsWith("0")).length;
    // About one in ten.
    expect(zeros).toBeGreaterThan(100);
    expect(zeros).toBeLessThan(400);
    for (const v of values) expect(v).toHaveLength(9);
  });

  it("DNI-1, POLICY-1: never a placeholder, at the edges of the range", () => {
    // The smallest and the largest numbers the builder can draw.
    expect(buildDni(() => 0)).toBe(`00000002${dniLetter(2)}`);
    expect(buildDni(() => 0.9999999999)).toBe(`99999998${dniLetter(99999998)}`);
    expect(PLACEHOLDERS).not.toContain(buildDni(() => 0));
    expect(PLACEHOLDERS).not.toContain(buildDni(() => 0.9999999999));
    expect(validate("00000002W").valid).toBe(true);
    expect(validate("99999998T").valid).toBe(true);
  });

  it("KLM-1, KLM-2: kind makes a K, L or M NIF with the letter of the 7 digits", () => {
    for (const kind of ["K", "L", "M"] as const) {
      const gen = createGenerator(1004);
      const bad = failures(
        20_000,
        () => gen.dni({ kind }),
        (v) =>
          v.charAt(0) === kind &&
          validate(v).type === "NIF_KLM" &&
          validate(v).valid
      );
      expect(bad).toEqual([]);
      expectValid(generateDni({ kind }), "NIF_KLM");
    }
    // KLM-2: the same digits give the same letter under any prefix.
    expect(generateDni({ seed: 5, kind: "K" }).slice(1)).toBe(
      generateDni({ seed: 5, kind: "M" }).slice(1)
    );
    expect(generateDni({ seed: 5, kind: "DNI" })).toBe(
      generateDni({ seed: 5 })
    );
  });

  it("KLM-1: generateNif makes K, L and M NIFs, all three prefixes", () => {
    const gen = createGenerator(1005);
    const prefixes = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const value = gen.nif({ types: ["NIF_KLM"] });
      prefixes.add(value.charAt(0));
    }
    expect([...prefixes].sort()).toEqual(["K", "L", "M"]);
  });

  it("rejects an unknown kind with a RangeError", () => {
    expect(() => generateDni({ kind: "X" } as never)).toThrow(RangeError);
    expect(() => generateDni({ kind: "k" } as never)).toThrow(
      "kind must be one of DNI, K, L, M"
    );
    expect(() => generateDni({ kind: null } as never)).toThrow(RangeError);
    expect(() => createGenerator(1).dni({ kind: 3 } as never)).toThrow("got 3");
  });
});

describe("NIE-1: generateNie", () => {
  it("NIE-1, NIE-2: 100,000 NIEs validate", () => {
    const gen = createGenerator(2001);
    const bad = failures(
      RUNS,
      () => gen.nie(),
      (v) =>
        /^[XYZ]\d{7}[A-Z]$/.test(v) &&
        validate(v, { rejectPlaceholders: true }).valid
    );
    expect(bad).toEqual([]);
  });

  it("NIE-1, NIE-2: the NIEs have the right shape, letter and type", () => {
    const gen = createGenerator(2002);
    for (let i = 0; i < 5000; i++) expectValid(gen.nie(), "NIE");
    expect(isValidNie(generateNie())).toBe(true);
  });

  it("NIE-1: every prefix X, Y and Z is generated", () => {
    const gen = createGenerator(2003);
    const counts: Record<string, number> = { X: 0, Y: 0, Z: 0 };
    for (let i = 0; i < 3000; i++) {
      const prefix = gen.nie().charAt(0);
      counts[prefix] = (counts[prefix] ?? 0) + 1;
    }
    for (const prefix of ["X", "Y", "Z"])
      expect(counts[prefix]).toBeGreaterThan(800);
  });

  it("NIE-1: prefix picks the first letter", () => {
    for (const prefix of ["X", "Y", "Z"] as const) {
      const gen = createGenerator(2004);
      const bad = failures(
        20_000,
        () => gen.nie({ prefix }),
        (v) => v.charAt(0) === prefix && validate(v).valid
      );
      expect(bad).toEqual([]);
    }
  });

  it("NIE-3: the canonical form has 9 characters, never the old 10-character one", () => {
    const gen = createGenerator(2005);
    const bad = failures(
      20_000,
      () => gen.nie({ prefix: "X" }),
      (v) => v.length === 9 && normalize(v) === v
    );
    expect(bad).toEqual([]);
  });

  it("NIE-1, POLICY-1: X0000000T is never generated, the next X NIE can be", () => {
    expect(buildNie(() => 0, "X")).toBe(`X0000001${dniLetter(1)}`);
    expect(validate("X0000001R").valid).toBe(true);
    // Y0000000 and Z0000000 are not placeholders.
    expect(buildNie(() => 0, "Y")).toBe(`Y0000000${dniLetter(10000000)}`);
    expect(buildNie(() => 0, "Z")).toBe(`Z0000000${dniLetter(20000000)}`);
    expect(buildNie(() => 0.9999999999, "X")).toBe(
      `X9999999${dniLetter(9999999)}`
    );
  });

  it("rejects an unknown prefix with a RangeError", () => {
    expect(() => generateNie({ prefix: "K" } as never)).toThrow(RangeError);
    expect(() => generateNie({ prefix: "x" } as never)).toThrow(
      "prefix must be one of X, Y, Z"
    );
    expect(() => generateNie({ prefix: "" } as never)).toThrow(RangeError);
    expect(() => createGenerator(1).nie({ prefix: 1 } as never)).toThrow(
      RangeError
    );
  });
});

describe("CIF-1: generateCif", () => {
  it("CIF-1 to CIF-4: 100,000 CIFs validate", () => {
    const gen = createGenerator(3001);
    const bad = failures(
      RUNS,
      () => gen.cif(),
      (v) => /^[A-W]\d{7}[0-9A-J]$/.test(v) && validate(v).valid
    );
    expect(bad).toEqual([]);
  });

  it("CIF-1 to CIF-4: the CIFs have the right shape, control and type", () => {
    const gen = createGenerator(3002);
    for (let i = 0; i < 5000; i++) expectValid(gen.cif(), "CIF");
    expect(isValidCif(generateCif())).toBe(true);
  });

  it("CIF-2: every organisation key is generated, and no other", () => {
    const gen = createGenerator(3003);
    const counts = new Map<string, number>();
    for (let i = 0; i < 5000; i++) {
      const key = gen.cif().charAt(0);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect([...counts.keys()].sort().join("")).toBe("ABCDEFGHJNPQRSUVW");
    for (const count of counts.values()) expect(count).toBeGreaterThan(150);
    expect(CIF_KEYS.join("")).toBe("ABCDEFGHJNPQRSUVW");
  });

  it("CIF-3: the control is a digit for A B C D E F G H J U V and a letter for N P Q R S W", () => {
    const gen = createGenerator(3004);
    const bad = failures(
      20_000,
      () => gen.cif(),
      (v) =>
        /[A-J]/.test(v.charAt(8)) === LETTER_KEYS.includes(v.charAt(0)) &&
        // Official mode, never the lenient legacy one.
        validate(v, { cifControl: "official" }).valid
    );
    expect(bad).toEqual([]);
  });

  it("CIF-3: orgKey picks the key, and the control follows the key", () => {
    for (const orgKey of CIF_KEYS) {
      const gen = createGenerator(3005);
      for (let i = 0; i < 2000; i++) {
        const value = gen.cif({ orgKey });
        expect(value.charAt(0)).toBe(orgKey);
        expect(validate(value).valid).toBe(true);
        expect(validate(value).meta?.orgKey).toBe(orgKey);
      }
    }
  });

  it("CIF-3: control picks the keys that take it, every one of them", () => {
    const letterKeys = new Set<string>();
    const digitKeys = new Set<string>();
    const gen = createGenerator(3006);
    for (let i = 0; i < 3000; i++) {
      const letter = gen.cif({ control: "letter" });
      letterKeys.add(letter.charAt(0));
      expect(/[A-J]$/.test(letter)).toBe(true);
      expect(validate(letter).valid).toBe(true);
      const digit = gen.cif({ control: "digit" });
      digitKeys.add(digit.charAt(0));
      expect(/\d$/.test(digit)).toBe(true);
      expect(validate(digit).valid).toBe(true);
    }
    expect([...letterKeys].sort().join("")).toBe("NPQRSW");
    expect([...digitKeys].sort().join("")).toBe("ABCDEFGHJUV");
  });

  it("CIF-3: orgKey and control together work when the key takes that control", () => {
    expect(
      validate(generateCif({ orgKey: "P", control: "letter" })).valid
    ).toBe(true);
    expect(validate(generateCif({ orgKey: "B", control: "digit" })).valid).toBe(
      true
    );
  });

  it("CIF-3: a control that the key can't take throws a RangeError", () => {
    // B takes a digit; asking for a letter is a programming error.
    expect(() => generateCif({ orgKey: "B", control: "letter" })).toThrow(
      RangeError
    );
    expect(() => generateCif({ orgKey: "B", control: "letter" })).toThrow(
      "Organisation key B takes a digit control (CIF-3)"
    );
    expect(() => generateCif({ orgKey: "P", control: "digit" })).toThrow(
      "Organisation key P takes a letter control (CIF-3)"
    );
    for (const key of CIF_KEYS) {
      const letter = LETTER_KEYS.includes(key);
      expect(() =>
        generateCif({ orgKey: key, control: letter ? "digit" : "letter" })
      ).toThrow(RangeError);
    }
  });

  it("CIF-2: an unknown orgKey or control throws a RangeError", () => {
    // K, L, M, X, Y, Z are natural-person prefixes, never entity keys.
    for (const orgKey of ["K", "L", "M", "X", "Y", "Z", "I", "b", "", "AB"])
      expect(() => generateCif({ orgKey } as never)).toThrow(RangeError);
    expect(() => generateCif({ orgKey: "K" } as never)).toThrow(
      "orgKey must be one of A, B, C"
    );
    expect(() => generateCif({ control: "number" } as never)).toThrow(
      "control must be one of letter, digit, got number."
    );
    expect(() => createGenerator(1).cif({ control: 1 } as never)).toThrow(
      RangeError
    );
  });

  it("CIF-5: the 7 digits are random, with no province rule", () => {
    const gen = createGenerator(3007);
    const provinces = new Set<string>();
    for (let i = 0; i < 3000; i++) provinces.add(gen.cif().slice(1, 3));
    // All of 00 to 99 show up, unlike the repealed province codes.
    expect(provinces.size).toBe(100);
  });
});

describe("NIF-1: generateNif", () => {
  it("NIF-1: 100,000 NIFs of any type validate", () => {
    const gen = createGenerator(4001);
    expect(
      failures(
        RUNS,
        () => gen.nif(),
        (v) => validate(v).valid
      )
    ).toEqual([]);
  });

  it("NIF-1: every type is generated by default, in similar numbers", () => {
    const gen = createGenerator(4002);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 4000; i++) {
      const type = validate(gen.nif()).type as NifType;
      counts[type] = (counts[type] ?? 0) + 1;
    }
    expect(Object.keys(counts).sort()).toEqual([
      "CIF",
      "DNI",
      "NIE",
      "NIF_KLM",
    ]);
    for (const count of Object.values(counts))
      expect(count).toBeGreaterThan(800);
  });

  it("NIF-1: types restricts the types", () => {
    const gen = createGenerator(4003);
    const natural = new Set<string | null>();
    for (let i = 0; i < 2000; i++) {
      natural.add(validate(gen.nif({ types: ["DNI", "NIE"] })).type);
      expect(validate(gen.nif({ types: ["CIF"] })).type).toBe("CIF");
      expect(validate(gen.nif({ types: ["NIF_KLM"] })).type).toBe("NIF_KLM");
    }
    expect([...natural].sort()).toEqual(["DNI", "NIE"]);
    expect(validate(generateNif({ types: ["NIE"] })).type).toBe("NIE");
  });

  it("NIF-1: types that are empty or unknown throw a RangeError", () => {
    expect(() => generateNif({ types: [] })).toThrow(RangeError);
    expect(() => generateNif({ types: [] })).toThrow("non-empty array");
    expect(() => generateNif({ types: ["DNI", "VAT"] as never })).toThrow(
      "types must be one of DNI, NIF_KLM, NIE, CIF, got VAT."
    );
    expect(() => generateNif({ types: "DNI" as never })).toThrow(RangeError);
    expect(() => createGenerator(1).nif({ types: [] })).toThrow(RangeError);
    expect(() => buildNif(() => 0, null as never)).toThrow(RangeError);
  });

  it("NIF-1: isValidNif accepts them", () => {
    const gen = createGenerator(4004);
    for (let i = 0; i < 2000; i++) expect(isValidNif(gen.nif())).toBe(true);
  });
});

describe("agreement with other implementations", () => {
  it("stdnum accepts what the generators make", () => {
    const nif = stdnum.ES?.nif;
    if (!nif) throw new Error("stdnum has no ES.nif");
    const gen = createGenerator(5001);
    expect(
      failures(
        20_000,
        () => gen.nif(),
        (v) => nif.validate(v).isValid
      )
    ).toEqual([]);
  });
});

describe("POLICY-1: no placeholder", () => {
  it("POLICY-1: no generator makes a placeholder, even over many values", () => {
    const gen = createGenerator(6001);
    const values = new Set<string>();
    for (let i = 0; i < 50_000; i++) {
      values.add(gen.dni());
      values.add(gen.nie());
      values.add(gen.nif());
    }
    for (const placeholder of PLACEHOLDERS)
      expect(values.has(placeholder)).toBe(false);
    expect(values.size).toBeGreaterThan(100_000);
  });
});

describe("output format", () => {
  it("is canonical by default", () => {
    expect(generateDni({ seed: 1 })).toBe("62707394X");
    expect(generateDni({ seed: 1, format: false })).toBe("62707394X");
    expect(generateDni({ seed: 1, format: { separator: "" } })).toBe(
      "62707394X"
    );
  });

  it("formats with format(): true is the default separator, or pass one", () => {
    expect(generateDni({ seed: 1, format: true })).toBe("62707394-X");
    expect(generateDni({ seed: 1, format: {} })).toBe("62707394-X");
    expect(generateDni({ seed: 1, kind: "K", format: true })).toBe(
      "K-6270739-L"
    );
    expect(
      generateNie({ seed: 1, prefix: "Y", format: { separator: " " } })
    ).toBe("Y 6270739 X");
    expect(
      generateCif({ seed: 1, orgKey: "B", format: { separator: " " } })
    ).toBe("B 6270739 3");
    expect(generateNif({ seed: 1, types: ["CIF"], format: true })).toBe(
      "A-5274470-3"
    );
  });

  it("gives the canonical form back through normalize()", () => {
    const gen = createGenerator(7001);
    for (let i = 0; i < 2000; i++) {
      const canonical = createGenerator(i).nif();
      const formatted = createGenerator(i).nif({ format: true });
      expect(formatted).toMatch(/^[0-9A-Z]+-[0-9A-Z]+(-[0-9A-Z]+)?$/);
      expect(normalize(formatted)).toBe(canonical);
      expect(validate(formatted).valid).toBe(true);
    }
    expect(gen.dni({ format: true })).toMatch(/^\d{8}-[A-Z]$/);
    expect(gen.nie({ format: true })).toMatch(/^[XYZ]-\d{7}-[A-Z]$/);
    expect(gen.cif({ format: true })).toMatch(/^[A-W]-\d{7}-[0-9A-J]$/);
  });
});

describe("determinism (golden values)", () => {
  // Fixed seeds give these values on every run and on every platform: they
  // come from integer operations only. A change here is a change of the
  // sequences, which users may have in their fixtures: make it on purpose.
  const GOLDEN = [
    {
      seed: 0,
      dni: "26642922K",
      klm: "L2664292H",
      nie: "X0003298D",
      cif: "E00032979",
      nif: "K2232720H",
      invalid: "26642922A",
      stream: ["26642922K", "X2232721L", "C46732780", "Y6489853A", "YX812189B"],
    },
    {
      seed: 1,
      dni: "62707394X",
      klm: "L6270739L",
      nie: "Y0027357R",
      cif: "P0027357C",
      nif: "X5274470H",
      invalid: "62707394A",
      stream: ["62707394X", "X5274470H", "W9683778F", "L7207431J", "Y994D229F"],
    },
    {
      seed: 42,
      dni: "60110375J",
      klm: "L6011037X",
      nie: "Y4482905N",
      cif: "P4482905I",
      nif: "Y8524657C",
      invalid: "60110375M",
      stream: ["60110375J", "Y8524657C", "Q1748138C", "X6247446W", "Z472317TX"],
    },
    {
      seed: 2024,
      dni: "81176236J",
      klm: "L8117623A",
      nie: "Z7108214T",
      cif: "S7108214C",
      nif: "R6505258A",
      invalid: "81176236S",
      stream: ["81176236J", "Z6505258N", "Q5189407I", "Y1587874Z", "Y70221557"],
    },
    {
      seed: 4294967295,
      dni: "89642260J",
      klm: "L8964226E",
      nie: "Z1894782R",
      cif: "V18947820",
      nif: "D71565261",
      invalid: "89642260E",
      stream: ["89642260J", "X7156527P", "W8452364F", "Z4755720S", "X98844451"],
    },
  ];

  for (const golden of GOLDEN) {
    it(`gives the same values for seed ${golden.seed}`, () => {
      const { seed } = golden;
      expect(generateDni({ seed })).toBe(golden.dni);
      expect(generateDni({ seed, kind: "L" })).toBe(golden.klm);
      expect(generateNie({ seed })).toBe(golden.nie);
      expect(generateCif({ seed })).toBe(golden.cif);
      expect(generateNif({ seed })).toBe(golden.nif);
      expect(generateInvalid("DNI", { seed })).toBe(golden.invalid);
      const gen = createGenerator(seed);
      expect([
        gen.dni(),
        gen.nie(),
        gen.cif(),
        gen.nif(),
        gen.invalid("NIE", { reason: "INVALID_FORMAT" }),
      ]).toEqual(golden.stream);
    });
  }

  it("gives the same values in a second run, and in another order", () => {
    const first = Array.from({ length: 200 }, (_, seed) =>
      generateNif({ seed })
    );
    const second = Array.from({ length: 200 }, (_, seed) =>
      generateNif({ seed })
    ).reverse();
    expect(first).toEqual(second.reverse());
    // A generator is not affected by other calls in between.
    const gen = createGenerator(3);
    const a = gen.dni();
    generateDni();
    generateDni({ seed: 9 });
    const other = createGenerator(3);
    expect(other.dni()).toBe(a);
    expect(gen.dni()).toBe(other.dni());
  });

  it("a call with a seed gives the same value each time", () => {
    expect(generateCif({ seed: 10 })).toBe(generateCif({ seed: 10 }));
    expect(generateCif({ seed: 10 })).not.toBe(generateCif({ seed: 11 }));
  });
});

describe("createGenerator", () => {
  it("makes a stream of different values from one seed", () => {
    const gen = createGenerator(77);
    const values = new Set(Array.from({ length: 1000 }, () => gen.dni()));
    expect(values.size).toBe(1000);
  });

  it("the same seed gives the same stream, a different seed another", () => {
    const stream = (seed: number) => {
      const gen = createGenerator(seed);
      return [
        gen.dni(),
        gen.nie({ prefix: "Z" }),
        gen.cif({ orgKey: "Q" }),
        gen.nif({ types: ["DNI", "CIF"] }),
        gen.invalid("NIF_KLM", { reason: "INVALID_LENGTH" }),
      ];
    };
    expect(stream(5)).toEqual(stream(5));
    expect(stream(5)).not.toEqual(stream(6));
  });

  it("every method takes the options of its generate function", () => {
    const gen = createGenerator(8);
    expect(gen.dni({ kind: "M", format: true })).toMatch(/^M-\d{7}-[A-Z]$/);
    expect(gen.nie({ prefix: "Y", format: { separator: " " } })).toMatch(
      /^Y \d{7} [A-Z]$/
    );
    expect(gen.cif({ control: "letter" })).toMatch(/^[NPQRSW]\d{7}[A-J]$/);
    expect(validate(gen.nif({ types: ["NIE"] })).type).toBe("NIE");
    expect(validate(gen.invalid("DNI")).error?.code).toBe(
      "INVALID_CONTROL_CHARACTER"
    );
    expect(gen.dni(undefined)).toMatch(/^\d{8}[A-Z]$/);
    expect(gen.dni(null as never)).toMatch(/^\d{8}[A-Z]$/);
  });

  it("takes a seed of 0", () => {
    expect(createGenerator(0).dni()).toBe("26642922K");
  });

  it("two generators do not share their state", () => {
    const a = createGenerator(1);
    const b = createGenerator(1);
    const a1 = a.dni();
    a.dni();
    expect(b.dni()).toBe(a1);
  });
});

describe("generateInvalid", () => {
  const TYPES: NifType[] = ["DNI", "NIF_KLM", "NIE", "CIF"];
  /** The rules an INVALID_LENGTH error cites, by type. */
  const LENGTH_RULES: Record<NifType, string[]> = {
    DNI: ["DNI-1"],
    NIF_KLM: ["KLM-1"],
    NIE: ["NIE-1", "NIE-3"],
    CIF: ["CIF-1"],
  };

  for (const type of TYPES) {
    it(`INVALID_CONTROL_CHARACTER: ${RUNS} ${type} values fail with it, changing only the control character`, () => {
      const gen = createGenerator(8001);
      const bad = failures(
        RUNS,
        () => gen.invalid(type, { reason: "INVALID_CONTROL_CHARACTER" }),
        (v) => {
          const result = validate(v);
          return (
            result.error?.code === "INVALID_CONTROL_CHARACTER" &&
            result.type === type &&
            v.length === 9 &&
            v.slice(8) !== result.error.expected &&
            // Wrong with the legacy lenient mode too (CIF-3).
            validate(v, { cifControl: "lenient" }).error?.code ===
              "INVALID_CONTROL_CHARACTER"
          );
        }
      );
      expect(bad).toEqual([]);
    });

    it(`INVALID_LENGTH: ${RUNS} ${type} values fail with it`, () => {
      const gen = createGenerator(8002);
      const lengths = new Set<number>();
      const bad = failures(
        RUNS,
        () => gen.invalid(type, { reason: "INVALID_LENGTH" }),
        (v) => {
          lengths.add(v.length);
          const { error } = validate(v);
          return (
            error?.code === "INVALID_LENGTH" &&
            LENGTH_RULES[type].includes(error.rule) &&
            v.length !== 9
          );
        }
      );
      expect(bad).toEqual([]);
      // A DNI is only made longer (NORM-4 pads a short one).
      if (type === "DNI") expect(Math.min(...lengths)).toBe(10);
      else expect(Math.min(...lengths)).toBeLessThan(9);
      expect(Math.max(...lengths)).toBeGreaterThan(9);
    });

    it(`INVALID_FORMAT: ${RUNS} ${type} values fail with it`, () => {
      const gen = createGenerator(8003);
      const bad = failures(
        RUNS,
        () => gen.invalid(type, { reason: "INVALID_FORMAT" }),
        (v) => validate(v).error?.code === "INVALID_FORMAT"
      );
      expect(bad).toEqual([]);
    });

    it(`EMPTY: ${type} values are empty or only separators`, () => {
      const gen = createGenerator(8004);
      const seen = new Set<string>();
      for (let i = 0; i < 500; i++) {
        const value = gen.invalid(type, { reason: "EMPTY" });
        expect(validate(value).error?.code).toBe("EMPTY");
        expect(normalize(value)).toBe("");
        seen.add(value);
      }
      expect(seen.size).toBeGreaterThan(3);
    });

    it(`UNSUPPORTED_TYPE: ${type} values are valid, and rejected when types leaves the type out`, () => {
      const gen = createGenerator(8005);
      const others = TYPES.filter((t) => t !== type);
      for (let i = 0; i < 2000; i++) {
        const value = gen.invalid(type, { reason: "UNSUPPORTED_TYPE" });
        expect(validate(value).valid).toBe(true);
        expect(validate(value).type).toBe(type);
        expect(validate(value, { types: others }).error?.code).toBe(
          "UNSUPPORTED_TYPE"
        );
        expect(validate(value, { types: [type] }).valid).toBe(true);
      }
    });

    it(`defaults to INVALID_CONTROL_CHARACTER for ${type}`, () => {
      const value = generateInvalid(type, { seed: 4 });
      expect(validate(value).error?.code).toBe("INVALID_CONTROL_CHARACTER");
      expect(generateInvalid(type, { seed: 4 })).toBe(value);
    });
  }

  it("PLACEHOLDER: DNI and NIE values are placeholders, rejected with rejectPlaceholders (POLICY-1)", () => {
    const placeholderSet = new Set<string>();
    const gen = createGenerator(8006);
    for (let i = 0; i < 500; i++) {
      const dni = gen.invalid("DNI", { reason: "PLACEHOLDER" });
      placeholderSet.add(dni);
      expect(validate(dni).valid).toBe(true);
      expect(validate(dni, { rejectPlaceholders: true }).error?.code).toBe(
        "PLACEHOLDER"
      );
      expect(validate(dni).type).toBe("DNI");
      expect(gen.invalid("NIE", { reason: "PLACEHOLDER" })).toBe("X0000000T");
    }
    expect([...placeholderSet].sort()).toEqual([
      "00000000T",
      "00000001R",
      "99999999R",
    ]);
    expect(
      validate("X0000000T", { rejectPlaceholders: true }).error?.code
    ).toBe("PLACEHOLDER");
  });

  it("PLACEHOLDER: K/L/M NIFs and CIFs have none, so it throws a RangeError", () => {
    expect(() => generateInvalid("NIF_KLM", { reason: "PLACEHOLDER" })).toThrow(
      RangeError
    );
    expect(() => generateInvalid("CIF", { reason: "PLACEHOLDER" })).toThrow(
      "There is no placeholder for CIF"
    );
  });

  it("NOT_A_STRING: throws, because the result is always a string", () => {
    for (const type of TYPES)
      expect(() => generateInvalid(type, { reason: "NOT_A_STRING" })).toThrow(
        "NOT_A_STRING cannot be generated"
      );
  });

  it("throws a RangeError for an unknown type or reason", () => {
    expect(() => generateInvalid("VAT" as never)).toThrow(
      "type must be one of DNI, NIF_KLM, NIE, CIF, got VAT."
    );
    expect(() => generateInvalid(undefined as never)).toThrow(RangeError);
    expect(() => generateInvalid("DNI", { reason: "NOPE" as never })).toThrow(
      "reason must be one of EMPTY, INVALID_LENGTH"
    );
    expect(() => generateInvalid("DNI", { reason: null as never })).toThrow(
      RangeError
    );
    expect(() => createGenerator(1).invalid("X" as never)).toThrow(RangeError);
  });

  it("works without options, and with null", () => {
    expect(validate(generateInvalid("NIE")).error?.code).toBe(
      "INVALID_CONTROL_CHARACTER"
    );
    expect(validate(generateInvalid("NIE", null as never)).error?.code).toBe(
      "INVALID_CONTROL_CHARACTER"
    );
  });

  it("every code it supports is an error code of validate()", () => {
    const codes: NifErrorCode[] = [
      "EMPTY",
      "INVALID_LENGTH",
      "INVALID_FORMAT",
      "INVALID_CONTROL_CHARACTER",
      "UNSUPPORTED_TYPE",
      "PLACEHOLDER",
    ];
    for (const reason of codes)
      expect(typeof generateInvalid("DNI", { reason })).toBe("string");
  });
});

describe("options of null or undefined", () => {
  it("every generator works without options, and with null or undefined", () => {
    expect(generateDni()).toMatch(/^\d{8}[A-Z]$/);
    expect(generateDni(null as never)).toMatch(/^\d{8}[A-Z]$/);
    expect(generateNie(null as never)).toMatch(/^[XYZ]\d{7}[A-Z]$/);
    expect(generateCif(null as never)).toMatch(/^[A-W]\d{7}[0-9A-J]$/);
    expect(validate(generateNif(null as never)).valid).toBe(true);
    expect(generateDni({ kind: undefined, seed: undefined })).toMatch(
      /^\d{8}[A-Z]$/
    );
    expect(buildCif(() => 0, undefined, undefined)).toBe("A00000000");
    expect(buildDni(() => 0, undefined)).toBe("00000002W");
  });

  it("without a seed the values are not always the same (Math.random)", () => {
    const values = new Set(Array.from({ length: 50 }, () => generateDni()));
    expect(values.size).toBeGreaterThan(40);
  });
});

describe("the package entry point", () => {
  it("does not export any generator", () => {
    const names = Object.keys(root).filter((name) =>
      /^(generate|create)/.test(name)
    );
    expect(names).toEqual([]);
  });
});

describe("types", () => {
  it("the generators take and return what the API says", () => {
    expectTypeOf(generateDni).parameter(0).toEqualTypeOf<
      | {
          seed?: number | undefined;
          kind?: "DNI" | "K" | "L" | "M" | undefined;
          format?: boolean | root.FormatOptions | undefined;
        }
      | undefined
    >();
    expectTypeOf(generateDni).returns.toEqualTypeOf<string>();
    expectTypeOf(generateNie).returns.toEqualTypeOf<string>();
    expectTypeOf(generateCif).returns.toEqualTypeOf<string>();
    expectTypeOf(generateNif).returns.toEqualTypeOf<string>();
    expectTypeOf(generateInvalid).returns.toEqualTypeOf<string>();
    expectTypeOf(generateInvalid).parameter(0).toEqualTypeOf<NifType>();
    expectTypeOf<Parameters<typeof generateNie>[0]>().toEqualTypeOf<
      | {
          seed?: number | undefined;
          prefix?: "X" | "Y" | "Z" | undefined;
          format?: boolean | root.FormatOptions | undefined;
        }
      | undefined
    >();
    expectTypeOf<
      NonNullable<Parameters<typeof generateCif>[0]>["orgKey"]
    >().toEqualTypeOf<CifOrganisationKey | undefined>();
    expectTypeOf<
      NonNullable<Parameters<typeof generateCif>[0]>["control"]
    >().toEqualTypeOf<"letter" | "digit" | undefined>();
    expectTypeOf<
      NonNullable<Parameters<typeof generateNif>[0]>["types"]
    >().toEqualTypeOf<NifType[] | undefined>();
    expectTypeOf<
      NonNullable<Parameters<typeof generateInvalid>[1]>["reason"]
    >().toEqualTypeOf<NifErrorCode | undefined>();
  });

  it("createGenerator takes a seed and returns a Generator", () => {
    expectTypeOf(createGenerator).parameters.toEqualTypeOf<[seed: number]>();
    expectTypeOf(createGenerator).returns.toEqualTypeOf<Generator>();
    expectTypeOf<Generator["dni"]>().returns.toEqualTypeOf<string>();
    expectTypeOf<Generator["invalid"]>().parameter(0).toEqualTypeOf<NifType>();
    // The seed is fixed by createGenerator, not by each call.
    // @ts-expect-error a generator's methods take no seed
    createGenerator(1).dni({ seed: 2 });
  });
});
