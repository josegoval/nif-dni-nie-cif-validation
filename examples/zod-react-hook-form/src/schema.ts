import { es } from "nif-dni-nie-cif-validation/locales/es";
import { zCif, zNif } from "nif-dni-nie-cif-validation/zod";
import { z } from "zod";

/**
 * The form's schema. `zNif` and `zCif` check the value with the same rules as
 * `validate()` and give its messages in Spanish (`locale: es`); their output
 * is the normalized document, so " 12.345.678-z " is stored as "12345678Z".
 */
export const customerSchema = z.object({
  name: z.string().min(1, "Escribe tu nombre"),
  // A person: a DNI or a NIE only. A NIF of a company gives "not accepted here".
  nif: zNif({ types: ["DNI", "NIE"], locale: es }),
  // A company: optional, empty means none.
  cif: z.union([z.literal(""), zCif({ locale: es })]),
});

/** What the inputs hold: strings, as typed. */
export type CustomerInput = z.input<typeof customerSchema>;
/** What the form gives to `onSubmit`: the NIF and the CIF are normalized. */
export type Customer = z.output<typeof customerSchema>;
