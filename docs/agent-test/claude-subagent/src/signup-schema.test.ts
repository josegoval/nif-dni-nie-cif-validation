import { createGenerator, generateInvalid } from "nif-dni-nie-cif-validation/generate";
import { describe, expect, it } from "vitest";
import { signupSchema } from "./signup-schema.js";

const gen = createGenerator(42); // the same fake NIFs on every run
const base = { name: "Ada", email: "ada@example.com" };

const messageFor = (nif: unknown) =>
  signupSchema.safeParse({ ...base, nif }).error?.issues.find((i) => i.path[0] === "nif")
    ?.message;

describe("signupSchema nif", () => {
  it.each([
    ["DNI", gen.dni()],
    ["NIE", gen.nie()],
    ["CIF", gen.cif()],
    ["generic NIF", gen.nif()],
  ])("accepts a valid fake %s", (_type, nif) => {
    const result = signupSchema.safeParse({ ...base, nif });
    expect(result.success).toBe(true);
    expect(result.data?.nif).toBe(nif);
  });

  it("accepts the documented example NIFs", () => {
    for (const nif of ["12345678Z", "X1234567L", "B12345674"]) {
      expect(signupSchema.safeParse({ ...base, nif }).success).toBe(true);
    }
  });

  it("stores the normalized NIF", () => {
    expect(signupSchema.parse({ ...base, nif: " 12.345.678-z " }).nif).toBe("12345678Z");
  });

  it("tells the user which control character is expected", () => {
    expect(messageFor("12345678A")).toBe(
      'The control character is not correct: for this DNI it should be "Z".',
    );
  });

  it("explains each kind of invalid NIF with a message", () => {
    for (const type of ["DNI", "NIE", "CIF"] as const) {
      const message = messageFor(generateInvalid(type, { seed: 7 }));
      expect(message).toBeTruthy();
      expect(message).not.toBe("Invalid input");
    }
  });

  it("rejects an empty NIF with a message", () => {
    expect(messageFor("")).toBeTruthy();
    expect(messageFor("  ")).toBeTruthy();
  });

  it("rejects a missing or non-string NIF", () => {
    expect(signupSchema.safeParse(base).success).toBe(false);
    expect(messageFor(12345678)).toBeTruthy();
  });

  it("still validates the other fields", () => {
    const result = signupSchema.safeParse({ name: " ", email: "nope", nif: gen.dni() });
    expect(result.error?.issues.map((i) => i.message)).toEqual([
      "Enter your name",
      "Enter a valid email address",
    ]);
  });
});
