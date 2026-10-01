import { type NifErrorCode, validate } from "nif-dni-nie-cif-validation";

export interface CustomerInput {
  name: string;
  nif: string;
}

export type RegisterResult =
  | { ok: true; customer: { name: string; nif: string } }
  | { ok: false; code: NifErrorCode };

/**
 * The code under test: customers are people, so a DNI or a NIE, and a
 * placeholder such as 00000000T is refused. The NIF is stored normalized.
 */
export function registerCustomer(input: CustomerInput): RegisterResult {
  const result = validate(input.nif, {
    types: ["DNI", "NIE"],
    rejectPlaceholders: true,
  });
  if (!result.valid) return { ok: false, code: result.error?.code ?? "EMPTY" };
  return {
    ok: true,
    customer: { name: input.name, nif: result.normalized as string },
  };
}
