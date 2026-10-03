import { describe, expect, it } from "vitest";
import {
  generateCif,
  generateDni,
  generateNie,
} from "nif-dni-nie-cif-validation/generate";
import { signupSchema } from "./signup-schema.js";

const form = { name: "Test User", email: "test@example.com" };

// Seeded synthetic identifiers keep these fixtures reproducible.
const validNifs = [
  ["DNI", generateDni({ seed: 1 })],
  ["K NIF", generateDni({ seed: 2, kind: "K" })],
  ["L NIF", generateDni({ seed: 3, kind: "L" })],
  ["M NIF", generateDni({ seed: 4, kind: "M" })],
  ["X NIE", generateNie({ seed: 5, prefix: "X" })],
  ["Y NIE", generateNie({ seed: 6, prefix: "Y" })],
  ["Z NIE", generateNie({ seed: 7, prefix: "Z" })],
  ["CIF with digit control", generateCif({ seed: 8, orgKey: "B" })],
  ["CIF with letter control", generateCif({ seed: 9, orgKey: "P" })],
];

describe("signupSchema", () => {
  it.each(validNifs)("accepts a synthetic valid %s", (_type, nif) => {
    expect(signupSchema.parse({ ...form, nif })).toEqual({ ...form, nif });
  });

  it.each(validNifs)("normalizes a formatted %s", (_type, nif) => {
    const formatted = ` ${nif.slice(0, -1).toLowerCase()}-${nif.slice(-1).toLowerCase()} `;
    expect(signupSchema.parse({ ...form, nif: formatted }).nif).toBe(nif);
  });

  it.each(validNifs)("rejects a wrong check character on a %s", (_type, nif) => {
    const expected = nif.slice(-1);
    const wrong = /\d/.test(expected)
      ? String((Number(expected) + 1) % 10)
      : expected === "A" ? "B" : "A";
    const result = signupSchema.safeParse({ ...form, nif: nif.slice(0, -1) + wrong });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ["nif"],
        message: expect.stringContaining(`it should be "${expected}"`),
      }),
    ]);
  });

  it.each(["", "   ", " . - "])("explains an empty NIF (%j)", (nif) => {
    const result = signupSchema.safeParse({ ...form, nif });
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: ["nif"], message: "Enter a NIF, NIE or CIF." }),
    ]);
  });

  it.each([undefined, null, 12345678, "not-a-nif", "X123"])(
    "rejects a missing, non-text or malformed NIF (%j)",
    (nif) => {
      const result = signupSchema.safeParse({ ...form, nif });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["nif"]);
      expect(result.error?.issues[0]?.message).toBeTruthy();
    },
  );

  it("preserves name trimming and existing field validation", () => {
    const nif = generateDni({ seed: 10 });
    expect(signupSchema.parse({ ...form, name: " Test User ", nif }).name).toBe("Test User");
    const result = signupSchema.safeParse({ name: " ", email: "invalid", nif });
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: ["name"], message: "Enter your name" }),
      expect.objectContaining({ path: ["email"], message: "Enter a valid email address" }),
    ]);
  });
});
