/**
 * The core shared by the schema adapters (`/zod`, `/valibot`, `/yup`): one
 * function that decides, with `validate()`, what a schema accepts and what
 * it outputs, so the three libraries follow the same rules and give the same
 * messages. Each adapter only maps the result onto its library's API. Only
 * the adapters import this module; the main entry point does not.
 *
 * - A schema accepts what `validate()` accepts with the same options
 *   (`normalize`, `cifControl`, `rejectPlaceholders`, `allowVatPrefix`,
 *   `locale`, and `types` for the generic schema), and outputs
 *   `validate().normalized`, the canonical form (NORM-1 to NORM-4, NIE-3).
 * - A value that is not accepted gives `validate().error`, whole: the
 *   message in the locale, the error code and the SPEC.md rule (INPUT-1 for a
 *   value that is not a string).
 * - `dni` accepts what `isValidDni` accepts: a DNI (DNI-1) or a K/L/M NIF
 *   (KLM-1). `nie` accepts an NIE and `cif` a NIF of a legal person or
 *   entity, through `types` (POLICY-2), so another valid document is
 *   `UNSUPPORTED_TYPE`.
 * - `vat` accepts a Spanish VAT number: `ES` and a NIF (VAT-1). The prefix is
 *   required, as in `isValidSpanishVat`, and the output keeps it (`ES` and
 *   the normalized NIF).
 *
 * Rule IDs refer to SPEC.md.
 */

import type { NifType, NifValidationError, ValidateOptions } from "./types";
import { validate } from "./validate";

/**
 * Options of the generic schema (`zNif`, `vNif`, `yNif`): the options of
 * `validate()`.
 * @example
 * import { es } from "nif-dni-nie-cif-validation/locales/es";
 *
 * const options: NifSchemaOptions = { types: ["DNI", "NIE"], locale: es };
 * zNif(options).safeParse("B12345674").success; // false: a CIF is not accepted
 * @example
 * const options: NifSchemaOptions = { rejectPlaceholders: true, cifControl: "lenient" };
 * zNif(options).safeParse("00000000T").success; // false: a placeholder (POLICY-1)
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#policy-2 SPEC.md#policy-2}
 * @since 2.0.0
 */
export type NifSchemaOptions = ValidateOptions;

/**
 * Options of the schemas for one type (DNI, NIE, CIF): the options of
 * `validate()` except `types`, which the schema fixes.
 * @example
 * import { es } from "nif-dni-nie-cif-validation/locales/es";
 *
 * const options: TypedNifSchemaOptions = { locale: es };
 * zNie(options).safeParse("12345678Z").error?.issues[0]?.message;
 * // "Aquí no se admite un DNI."
 * @example
 * const options: TypedNifSchemaOptions = { cifControl: "lenient" };
 * zCif(options).safeParse("G1234567D").success; // true
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#policy-2 SPEC.md#policy-2}
 * @since 2.0.0
 */
export type TypedNifSchemaOptions = Omit<ValidateOptions, "types">;

/**
 * Options of the Spanish VAT schema: the options of `validate()` except
 * `allowVatPrefix`, which the schema always sets (the `ES` prefix is
 * required).
 * @example
 * import { es } from "nif-dni-nie-cif-validation/locales/es";
 *
 * const options: SpanishVatSchemaOptions = { locale: es };
 * zSpanishVat(options).parse("ES 12345678-z"); // "ES12345678Z"
 * @example
 * const options: SpanishVatSchemaOptions = { rejectPlaceholders: true };
 * zSpanishVat(options).safeParse("ES00000000T").success; // false: a placeholder
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#vat-1 SPEC.md#vat-1}
 * @since 2.0.0
 */
export type SpanishVatSchemaOptions = Omit<ValidateOptions, "allowVatPrefix">;

/** The schema a check is for. */
export type NifSchemaKind = "nif" | "dni" | "nie" | "cif" | "vat";

/** What a check found: the output to keep, or why the value is refused. */
export type NifCheck =
  | { ok: true; value: string }
  | { ok: false; error: NifValidationError };

/** The document types each typed schema accepts (POLICY-2). */
const KIND_TYPES: Record<"dni" | "nie" | "cif", NifType[]> = {
  // isValidDni: a DNI and a K/L/M NIF (DNI-1, KLM-1).
  dni: ["DNI", "NIF_KLM"],
  nie: ["NIE"],
  cif: ["CIF"],
};

/**
 * VAT-1: `ES` + NIF. `validate()` with `allowVatPrefix` accepts a NIF with or
 * without the prefix, so the prefix is detected first: without the option,
 * `validate()` rejects a value that has it with `INVALID_FORMAT` and rule
 * VAT-1.
 */
function checkVat(value: unknown, opts: ValidateOptions | undefined): NifCheck {
  const bare = validate(value, { ...opts, allowVatPrefix: false });
  if (bare.error?.rule !== "VAT-1")
    return {
      ok: false,
      // A value without the prefix is refused even if it is a valid NIF: say
      // what a VAT number is, in the locale ("ES followed by a NIF", the
      // VAT-1 length message, which `validate` gives for a bare "ES").
      error: (bare.valid
        ? validate("ES", { ...opts, allowVatPrefix: true }).error
        : bare.error) as NifValidationError,
    };
  const result = validate(value, { ...opts, allowVatPrefix: true });
  return result.valid
    ? { ok: true, value: `ES${result.normalized}` }
    : { ok: false, error: result.error as NifValidationError };
}

/**
 * Checks `value` for the schema `kind` with `opts`: the normalized output, or
 * the error of `validate()`. Never throws.
 */
export function checkNif(
  value: unknown,
  kind: NifSchemaKind,
  opts?: ValidateOptions
): NifCheck {
  if (kind === "vat") return checkVat(value, opts);
  const result = validate(
    value,
    kind === "nif" ? opts : { ...opts, types: KIND_TYPES[kind] }
  );
  return result.valid
    ? { ok: true, value: result.normalized as string }
    : { ok: false, error: result.error as NifValidationError };
}

/**
 * INPUT-1: the message for a value that is not a string, in the locale of
 * `opts`. The schemas of each library check the type themselves, and use it.
 */
export function notAStringMessage(opts?: ValidateOptions): string {
  return (validate(null, opts).error as NifValidationError).message;
}
