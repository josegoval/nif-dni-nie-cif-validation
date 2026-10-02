import { describe, expect, it } from "vitest";
import { generateCif, generateDni, generateNie } from "nif-dni-nie-cif-validation/generate";
import { signupSchema } from "./signup-schema.js";

const base = { name: "Ana", email: "ana@example.com" };

describe("signupSchema nif", () => {
  it.each([
    ["DNI", generateDni({ seed: 1 })],
    ["NIE", generateNie({ seed: 2 })],
    ["CIF", generateCif({ seed: 3 })],
  ])("accepts a valid fake %s", (_type, nif) => {
    const result = signupSchema.safeParse({ ...base, nif });
    expect(result.success).toBe(true);
    expect(result.data?.nif).toBe(nif);
  });

  it("normalizes separators and lower case", () => {
    const result = signupSchema.safeParse({ ...base, nif: " 12.345.678-z " });
    expect(result.data?.nif).toBe("12345678Z");
  });

  it("explains a wrong control letter", () => {
    const result = signupSchema.safeParse({ ...base, nif: "12345678A" });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "nif");
    expect(issue?.message).toBe(
      'The control character is not correct: for this DNI it should be "Z".',
    );
  });

  it("rejects an empty value with a message", () => {
    const result = signupSchema.safeParse({ ...base, nif: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["nif"]);
    expect(result.error?.issues[0]?.message).toBeTruthy();
  });
});
