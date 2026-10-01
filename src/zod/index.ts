/**
 * Entry point of `nif-dni-nie-cif-validation/zod`: Zod schemas for Spanish
 * NIF, DNI, K/L/M, NIE and CIF numbers, and for Spanish VAT numbers. Opt-in:
 * the main entry point never imports this module, and it never bundles Zod.
 * Zod is an optional peer dependency (**Zod 4**, `zod@^4`): install it
 * yourself if you use this entry point.
 *
 * Every schema is a `z.string()` piped into a transform (Zod's own
 * primitives), so it works wherever a Zod schema does: `z.object`,
 * `.optional()`, `.nullable()`, `z.infer`, `z.input`, React Hook Form's
 * `zodResolver`, tRPC and Next.js server actions.
 *
 * - It accepts what `validate()` accepts with the same options, and its
 *   output is the **normalized** value (`" 12.345.678-z "` gives
 *   `"12345678Z"`). See src/adapter.ts.
 * - A value that is refused gives one issue whose `message` is
 *   `validate().error.message`, in the locale you pass (`{ locale: es }`).
 *   The issue is a `custom` issue; its `params` has the error `code` (for
 *   example `"INVALID_CONTROL_CHARACTER"`), the SPEC.md `rule` that failed
 *   (for example `"DNI-2"`) and, for a wrong control character, `expected`.
 * - A value that is not a string gives Zod's invalid-type issue with the
 *   `NOT_A_STRING` message (INPUT-1).
 *
 * Why Zod 4 only: Zod 4 is the current major, and the two majors have
 * different types (`ZodEffects` in Zod 3, `ZodPipe` in Zod 4), so one
 * implementation can't return a correct type for both. With Zod 3, use
 * `validate()` in a `superRefine`, see docs/api-design.md.
 *
 * Rule IDs refer to SPEC.md.
 */
import {
  NEVER,
  string,
  type ZodPipe,
  type ZodString,
  type ZodTransform,
} from "zod";
import {
  checkNif,
  type NifSchemaKind,
  type NifSchemaOptions,
  notAStringMessage,
  type SpanishVatSchemaOptions,
  type TypedNifSchemaOptions,
} from "../adapter";
import type { NifErrorCode } from "../types";

export type {
  NifSchemaOptions,
  SpanishVatSchemaOptions,
  TypedNifSchemaOptions,
} from "../adapter";

/**
 * The schemas of this entry point: a string, transformed to its normalized
 * form. Its input and its output are `string`.
 * @example
 * import { z } from "zod";
 *
 * const schema: NifSchema = zNif();
 * const output: z.output<NifSchema> = schema.parse(" 12.345.678-z ");
 * output; // "12345678Z"
 * @example
 * import { z } from "zod";
 *
 * const input: z.input<NifSchema> = "b-1234567-4";
 * zCif().parse(input); // "B12345674"
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#nif-1 SPEC.md#nif-1}
 * @since 2.0.0
 */
export type NifSchema = ZodPipe<ZodString, ZodTransform<string, string>>;

/**
 * The `params` of the issue of a refused value: what `validate()` says.
 * @example
 * import { z } from "zod";
 *
 * const result = zDni().safeParse("12345678A");
 * const issue = result.error?.issues[0] as z.core.$ZodIssueCustom;
 * const params = issue.params as NifIssueParams;
 * params.code; // "INVALID_CONTROL_CHARACTER"
 * params.rule; // "DNI-2"
 * @example
 * import { z } from "zod";
 *
 * const issue = zDni().safeParse("12345678A").error?.issues[0] as z.core.$ZodIssueCustom;
 * (issue.params as NifIssueParams).expected; // "Z": the right control character
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#dni-2 SPEC.md#dni-2}
 * @since 2.0.0
 */
export interface NifIssueParams {
  /** The error code of `validate()`. */
  code: NifErrorCode;
  /** The SPEC.md rule that failed, for example `"DNI-2"`. */
  rule: string;
  /** The right control character, for `INVALID_CONTROL_CHARACTER`. */
  expected?: string;
}

function schema(kind: NifSchemaKind, opts?: NifSchemaOptions): NifSchema {
  return string({ error: notAStringMessage(opts) }).transform((value, ctx) => {
    const result = checkNif(value, kind, opts);
    if (result.ok) return result.value;
    const { code, rule, expected, message } = result.error;
    ctx.addIssue({
      code: "custom",
      message,
      input: value,
      params:
        expected === undefined ? { code, rule } : { code, rule, expected },
    });
    return NEVER;
  });
}

/**
 * A Zod schema for any Spanish NIF: a DNI, a K/L/M NIF, an NIE or a NIF of a
 * legal person or entity (CIF). The output is the normalized value. Takes the
 * options of `validate()`, including `types` to accept only some documents
 * (POLICY-2) and `locale` for the messages.
 *
 * @param opts `types`, `normalize`, `cifControl`, `rejectPlaceholders`,
 * `allowVatPrefix`, `locale`. See {@link NifSchemaOptions}.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * import { z } from "zod";
 * import { zNif } from "nif-dni-nie-cif-validation/zod";
 * import { es } from "nif-dni-nie-cif-validation/locales/es";
 *
 * const form = z.object({ nif: zNif({ types: ["DNI", "NIE"], locale: es }) });
 * form.parse({ nif: " 12.345.678-z " }); // { nif: "12345678Z" }
 * @example
 * import { z } from "zod";
 *
 * const result = zNif().safeParse("12345678A");
 * const issue = result.error?.issues[0] as z.core.$ZodIssueCustom;
 * issue.message;
 * // 'The control character is not correct: for this DNI it should be "Z".'
 * issue.params; // { code: "INVALID_CONTROL_CHARACTER", rule: "DNI-2", expected: "Z" }
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#nif-1 SPEC.md#nif-1}
 * @since 2.0.0
 */
export function zNif(opts?: NifSchemaOptions): NifSchema {
  return schema("nif", opts);
}

/**
 * A Zod schema for a DNI (8 digits and a letter) or a K/L/M NIF, like
 * `isValidDni`. Another valid document, such as an NIE, gives
 * `UNSUPPORTED_TYPE`. The output is the normalized value: a DNI with fewer
 * than 8 digits is padded with zeros (NORM-4).
 *
 * @param opts The options of `validate()` except `types`.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * zDni().parse("1234567-l"); // "01234567L"
 * @example
 * zDni().safeParse("X1234567L").success; // false: UNSUPPORTED_TYPE, a NIE is not a DNI
 * zDni().safeParse("12345678A").success; // false: the letter should be Z (DNI-2)
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#dni-1 SPEC.md#dni-1}
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#klm-1 SPEC.md#klm-1}
 * @since 2.0.0
 */
export function zDni(opts?: TypedNifSchemaOptions): NifSchema {
  return schema("dni", opts);
}

/**
 * A Zod schema for an NIE. The output is the canonical 9-character form: an
 * old 10-character NIE is shortened (NIE-3).
 *
 * @param opts The options of `validate()` except `types`.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * zNie().parse("x-01234567-l"); // "X1234567L"
 * @example
 * zNie().safeParse("12345678Z").success; // false: a DNI is not an NIE
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#nie-1 SPEC.md#nie-1}
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#nie-3 SPEC.md#nie-3}
 * @since 2.0.0
 */
export function zNie(opts?: TypedNifSchemaOptions): NifSchema {
  return schema("nie", opts);
}

/**
 * A Zod schema for the NIF of a legal person or entity (CIF). The control
 * character follows CIF-3 unless `cifControl: "lenient"`.
 *
 * @param opts The options of `validate()` except `types`.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * zCif().parse(" b-1234567-4 "); // "B12345674"
 * @example
 * zCif().safeParse("G1234567D").success;                         // false (CIF-3)
 * zCif({ cifControl: "lenient" }).safeParse("G1234567D").success; // true
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-3 SPEC.md#cif-3}
 * @since 2.0.0
 */
export function zCif(opts?: TypedNifSchemaOptions): NifSchema {
  return schema("cif", opts);
}

/**
 * A Zod schema for a Spanish VAT number: `ES` and a NIF (VAT-1). The prefix
 * is required, as in `isValidSpanishVat`, and the output keeps it: `ES` and
 * the normalized NIF. It checks the format only: a valid format doesn't mean
 * the number is registered in VIES.
 *
 * @param opts The options of `validate()` except `allowVatPrefix`.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * zSpanishVat().parse("es b-1234567-4"); // "ESB12345674"
 * @example
 * zSpanishVat().safeParse("B12345674").success; // false: no ES prefix
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#vat-1 SPEC.md#vat-1}
 * @since 2.0.0
 */
export function zSpanishVat(opts?: SpanishVatSchemaOptions): NifSchema {
  return schema("vat", opts);
}
