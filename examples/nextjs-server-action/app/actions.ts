"use server";

import { checkNif, type FormState } from "../lib/check-nif.ts";

/**
 * The server action of the form. React calls it on the server with the state
 * from the previous submission and the FormData of the form (`useActionState`).
 */
export async function submitNif(
  _previous: FormState,
  data: FormData
): Promise<FormState> {
  return checkNif(data);
}
