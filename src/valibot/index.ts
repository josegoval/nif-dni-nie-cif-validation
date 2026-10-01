/**
 * Entry point of `nif-dni-nie-cif-validation/valibot`: Valibot schemas for
 * Spanish NIF, DNI, K/L/M, NIE and CIF numbers, and for Spanish VAT numbers.
 * Opt-in: the main entry point never imports this module, and it never
 * bundles Valibot. Valibot is an optional peer dependency (`valibot@^1`):
 * install it yourself if you use this entry point.
 *
 * Every schema is `pipe(string(), <a transformation>)`, so it works wherever
 * a Valibot schema does: `object`, `optional`, `array`, `InferOutput`,
 * `InferInput`, React Hook Form's `valibotResolver`.
 *
 * - It accepts what `validate()` accepts with the same options, and its
 *   output is the **normalized** value (`" 12.345.678-z "` gives
 *   `"12345678Z"`). See src/adapter.ts.
 * - A value that is refused gives one issue whose `message` is
 *   `validate().error.message`, in the locale you pass (`{ locale: es }`).
 *   The issue (`NifIssue`) has the metadata of the error as properties: its
 *   `code` (for example `"INVALID_CONTROL_CHARACTER"`), the SPEC.md `rule`
 *   that failed (for example `"DNI-2"`), and, for a wrong control character,
 *   `expected`. Valibot's `addIssue` (`rawTransform`, `rawCheck`) takes no
 *   extra properties, so the transformation builds its issue itself, as
 *   Valibot's own actions do, instead of using it.
 * - A value that is not a string gives Valibot's `string` issue with the
 *   `NOT_A_STRING` message (INPUT-1).
 *
 * Rule IDs refer to SPEC.md.
 */
import {
  type BaseIssue,
  type BaseTransformation,
  pipe,
  type SchemaWithPipe,
  type StringSchema,
  string,
} from "valibot";
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
 * The issue of a refused value: a Valibot issue with what `validate()` says.
 * @example
 * import { safeParse } from "valibot";
 *
 * const result = safeParse(vDni(), "12345678A");
 * const issue = result.issues?.[0] as NifIssue;
 * issue.code;     // "INVALID_CONTROL_CHARACTER"
 * issue.rule;     // "DNI-2"
 * issue.expected; // "Z"
 * @example
 * import { safeParse } from "valibot";
 *
 * const issue = safeParse(vNif(), "").issues?.[0] as NifIssue;
 * issue.code;     // "EMPTY"
 * issue.expected; // null: only a wrong control character has an expected value
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#dni-2 SPEC.md#dni-2}
 * @since 2.0.0
 */
export interface NifIssue extends BaseIssue<string> {
  readonly kind: "transformation";
  readonly type: "nif";
  /** The error code of `validate()`. */
  readonly code: NifErrorCode;
  /** The SPEC.md rule that failed, for example `"DNI-2"`. */
  readonly rule: string;
  /**
   * The right control character, for `INVALID_CONTROL_CHARACTER`; `null`
   * otherwise (Valibot's own property, which says what was expected).
   */
  readonly expected: string | null;
}

/**
 * The transformation of the schemas: a string to its normalized form.
 * @since 2.0.0
 */
export interface NifAction
  extends BaseTransformation<string, string, NifIssue> {
  readonly type: "nif";
  readonly reference: typeof nif;
}

/**
 * The schemas of this entry point: a string, transformed to its normalized
 * form. Its input and its output are `string`.
 * @example
 * import { type InferOutput, parse } from "valibot";
 * import { type NifSchema, vNif } from "nif-dni-nie-cif-validation/valibot";
 *
 * const schema: NifSchema = vNif();
 * const output: InferOutput<NifSchema> = parse(schema, " 12.345.678-z ");
 * output; // "12345678Z"
 * @example
 * import { type InferInput, parse } from "valibot";
 * import { type NifSchema, vCif } from "nif-dni-nie-cif-validation/valibot";
 *
 * const input: InferInput<NifSchema> = "b-1234567-4";
 * parse(vCif(), input); // "B12345674"
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#nif-1 SPEC.md#nif-1}
 * @since 2.0.0
 */
export type NifSchema = SchemaWithPipe<
  readonly [StringSchema<string>, NifAction]
>;

/**
 * The transformation itself: Valibot runs `~run` on the dataset of the pipe.
 * It checks the string and replaces it with the normalized value, or fails
 * with a `NifIssue`.
 */
function nif(kind: NifSchemaKind, opts?: NifSchemaOptions): NifAction {
  return {
    kind: "transformation",
    type: "nif",
    reference: nif,
    async: false,
    "~run"(dataset, config) {
      const result = checkNif(dataset.value, kind, opts);
      if (result.ok) {
        dataset.value = result.value;
        return dataset;
      }
      const { code, rule, expected, message } = result.error;
      const issue: NifIssue = {
        kind: "transformation",
        type: "nif",
        input: dataset.value,
        expected: expected ?? null,
        received: `"${dataset.value}"`,
        message,
        requirement: undefined,
        path: undefined,
        issues: undefined,
        lang: config.lang,
        abortEarly: config.abortEarly,
        abortPipeEarly: config.abortPipeEarly,
        code,
        rule,
      };
      return { typed: false, value: dataset.value, issues: [issue] };
    },
  };
}

function schema(kind: NifSchemaKind, opts?: NifSchemaOptions): NifSchema {
  return pipe(string(notAStringMessage(opts)), nif(kind, opts));
}

/**
 * A Valibot schema for any Spanish NIF: a DNI, a K/L/M NIF, an NIE or a NIF
 * of a legal person or entity (CIF). The output is the normalized value.
 * Takes the options of `validate()`, including `types` to accept only some
 * documents (POLICY-2) and `locale` for the messages.
 *
 * @param opts `types`, `normalize`, `cifControl`, `rejectPlaceholders`,
 * `allowVatPrefix`, `locale`. See {@link NifSchemaOptions}.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * import { object, parse } from "valibot";
 * import { vNif } from "nif-dni-nie-cif-validation/valibot";
 * import { es } from "nif-dni-nie-cif-validation/locales/es";
 *
 * const form = object({ nif: vNif({ types: ["DNI", "NIE"], locale: es }) });
 * parse(form, { nif: " 12.345.678-z " }); // { nif: "12345678Z" }
 * @example
 * import { safeParse } from "valibot";
 *
 * const result = safeParse(vNif(), "12345678A");
 * result.issues?.[0]?.message;
 * // 'The control character is not correct: for this DNI it should be "Z".'
 * (result.issues?.[0] as NifIssue).rule; // "DNI-2"
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#nif-1 SPEC.md#nif-1}
 * @since 2.0.0
 */
export function vNif(opts?: NifSchemaOptions): NifSchema {
  return schema("nif", opts);
}

/**
 * A Valibot schema for a DNI (8 digits and a letter) or a K/L/M NIF, like
 * `isValidDni`. Another valid document, such as an NIE, gives
 * `UNSUPPORTED_TYPE`. The output is the normalized value: a DNI with fewer
 * than 8 digits is padded with zeros (NORM-4).
 *
 * @param opts The options of `validate()` except `types`.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * import { parse } from "valibot";
 *
 * parse(vDni(), "1234567-l"); // "01234567L"
 * @example
 * import { safeParse } from "valibot";
 *
 * safeParse(vDni(), "X1234567L").success; // false: UNSUPPORTED_TYPE
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#dni-1 SPEC.md#dni-1}
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#klm-1 SPEC.md#klm-1}
 * @since 2.0.0
 */
export function vDni(opts?: TypedNifSchemaOptions): NifSchema {
  return schema("dni", opts);
}

/**
 * A Valibot schema for an NIE. The output is the canonical 9-character form:
 * an old 10-character NIE is shortened (NIE-3).
 *
 * @param opts The options of `validate()` except `types`.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * import { parse } from "valibot";
 *
 * parse(vNie(), "x-01234567-l"); // "X1234567L"
 * @example
 * import { safeParse } from "valibot";
 *
 * safeParse(vNie(), "12345678Z").success; // false: a DNI is not an NIE
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#nie-1 SPEC.md#nie-1}
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#nie-3 SPEC.md#nie-3}
 * @since 2.0.0
 */
export function vNie(opts?: TypedNifSchemaOptions): NifSchema {
  return schema("nie", opts);
}

/**
 * A Valibot schema for the NIF of a legal person or entity (CIF). The
 * control character follows CIF-3 unless `cifControl: "lenient"`.
 *
 * @param opts The options of `validate()` except `types`.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * import { parse } from "valibot";
 *
 * parse(vCif(), " b-1234567-4 "); // "B12345674"
 * @example
 * import { safeParse } from "valibot";
 *
 * safeParse(vCif(), "G1234567D").success;                         // false (CIF-3)
 * safeParse(vCif({ cifControl: "lenient" }), "G1234567D").success; // true
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#cif-3 SPEC.md#cif-3}
 * @since 2.0.0
 */
export function vCif(opts?: TypedNifSchemaOptions): NifSchema {
  return schema("cif", opts);
}

/**
 * A Valibot schema for a Spanish VAT number: `ES` and a NIF (VAT-1). The
 * prefix is required, as in `isValidSpanishVat`, and the output keeps it:
 * `ES` and the normalized NIF. It checks the format only: a valid format
 * doesn't mean the number is registered in VIES.
 *
 * @param opts The options of `validate()` except `allowVatPrefix`.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * import { parse } from "valibot";
 *
 * parse(vSpanishVat(), "es b-1234567-4"); // "ESB12345674"
 * @example
 * import { safeParse } from "valibot";
 *
 * safeParse(vSpanishVat(), "B12345674").success; // false: no ES prefix
 * @see {@link https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md#vat-1 SPEC.md#vat-1}
 * @since 2.0.0
 */
export function vSpanishVat(opts?: SpanishVatSchemaOptions): NifSchema {
  return schema("vat", opts);
}
