import type { NifErrorCode, NifType } from "nif-dni-nie-cif-validation";
import { createGenerator } from "nif-dni-nie-cif-validation/generate";
import type { CustomerInput } from "./customer";

/**
 * A fixture factory. `createGenerator(seed)` is a stream of different values
 * that is the same on every run and on every platform, so a failing test
 * fails the same way for everyone, and the fixtures never collide.
 *
 * The values are valid but made up: use them in tests, never as real data.
 */
export function createFixtures(seed: number) {
  const gen = createGenerator(seed);
  let count = 0;

  return {
    /** A valid customer, with a different DNI each time. */
    customer(overrides: Partial<CustomerInput> = {}): CustomerInput {
      count++;
      return { name: `Customer ${count}`, nif: gen.dni(), ...overrides };
    },

    /** A customer with a valid NIE. */
    foreignCustomer(overrides: Partial<CustomerInput> = {}): CustomerInput {
      return this.customer({ nif: gen.nie(), ...overrides });
    },

    /**
     * A customer whose NIF fails in a known way: `validate()` gives exactly
     * `reason` for it (see the options of `registerCustomer`).
     */
    invalidCustomer(
      reason: NifErrorCode,
      type: NifType = "DNI"
    ): CustomerInput {
      return this.customer({ nif: gen.invalid(type, { reason }) });
    },
  };
}
