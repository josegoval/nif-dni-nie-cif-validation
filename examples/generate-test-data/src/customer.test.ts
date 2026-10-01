import type { NifErrorCode, NifType } from "nif-dni-nie-cif-validation";
import { describe, expect, it } from "vitest";
import { registerCustomer } from "./customer";
import { createFixtures } from "./factories";

describe("registerCustomer with generated fixtures", () => {
  it("accepts 100 different valid customers", () => {
    const fixtures = createFixtures(2026);
    const customers = Array.from({ length: 100 }, () => fixtures.customer());

    for (const customer of customers) {
      expect(registerCustomer(customer)).toEqual({ ok: true, customer });
    }
    // A stream of different values: no two customers share a DNI.
    expect(new Set(customers.map((c) => c.nif)).size).toBe(100);
  });

  it("accepts a NIE, and stores it normalized", () => {
    const fixtures = createFixtures(1);
    const customer = fixtures.foreignCustomer();
    const result = registerCustomer({
      ...customer,
      nif: ` ${customer.nif.toLowerCase()} `,
    });
    expect(result).toEqual({ ok: true, customer });
  });

  it("makes the same fixtures for the same seed, on every run", () => {
    const first = createFixtures(42);
    const second = createFixtures(42);
    expect([first.customer(), first.customer()]).toEqual([
      second.customer(),
      second.customer(),
    ]);
    // Golden value: the first DNI of seed 1 is the same on every platform.
    expect(createFixtures(1).customer().nif).toBe("62707394X");
  });

  // generateInvalid makes a value that fails with exactly the reason you ask
  // for, so each error path of your code has a fixture.
  const REASONS: [NifErrorCode, NifType][] = [
    ["INVALID_CONTROL_CHARACTER", "DNI"],
    ["INVALID_CONTROL_CHARACTER", "NIE"],
    ["INVALID_LENGTH", "NIE"],
    ["INVALID_LENGTH", "CIF"],
    ["INVALID_FORMAT", "DNI"],
    ["INVALID_FORMAT", "NIE"],
    ["EMPTY", "DNI"],
    ["UNSUPPORTED_TYPE", "CIF"],
    ["PLACEHOLDER", "DNI"],
    ["PLACEHOLDER", "NIE"],
  ];

  it.each(REASONS)("refuses a %s fixture of a %s", (reason, type) => {
    const fixtures = createFixtures(7);
    for (let i = 0; i < 20; i++) {
      const customer = fixtures.invalidCustomer(reason, type);
      expect(registerCustomer(customer)).toEqual({ ok: false, code: reason });
    }
  });
});
