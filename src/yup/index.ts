/**
 * Entry point of `nif-dni-nie-cif-validation/yup`: Yup schemas for Spanish
 * NIF, DNI, K/L/M, NIE and CIF numbers, and for Spanish VAT numbers.
 * Opt-in: the main entry point never imports this module, and it never
 * bundles Yup. Yup is an optional peer dependency (`yup@^1`): install it
 * yourself if you use this entry point.
 *
 * Every schema is `string().transform(...).test(...)`, so it works wherever
 * a Yup schema does: `object`, `array`, `.optional()`, `InferType`, Formik,
 * React Hook Form's `yupResolver`.
 *
 * - It accepts what `validate()` accepts with the same options, and its
 *   output is the **normalized** value (`" 12.345.678-z "` gives
 *   `"12345678Z"`). See src/adapter.ts.
 * - A value that is refused gives one `ValidationError` whose `message` is
 *   `validate().error.message`, in the locale you pass (`{ locale: es }`).
 *   Its `type` is `"nif"` and its `params` have the error `code` (for
 *   example `"INVALID_CONTROL_CHARACTER"`), the SPEC.md `rule` that failed
 *   (for example `"DNI-2"`) and, for a wrong control character, `expected`.
 * - Unlike Yup's own `string()`, a number is not turned into a string: a
 *   value that is not a string is refused with the `NOT_A_STRING` message
 *   (INPUT-1), and so are `undefined` and `null`. Yup's schemas are optional
 *   by default; these are not, so use `.optional()` for an optional field.
 *   `""` gives the `EMPTY` message.
 *
 * Yup has no `exports` map: in Node, `import { string } from "yup"` works
 * from the ES module build and `require("yup")` from the CommonJS one.
 *
 * Rule IDs refer to SPEC.md.
 */
import { type AnyObject, type StringSchema, string } from "yup";
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
 * The schemas of this entry point: a required string, transformed to its
 * normalized form. Its input and its output are `string`.
 * @example
 * type Output = InferType<NifSchema>; // string
 */
export type NifSchema = StringSchema<string, AnyObject, undefined, "">;

/**
 * The `params` of the error of a refused value: what `validate()` says.
 * @example
 * try {
 *   yDni().validateSync("12345678A");
 * } catch (error) {
 *   const params = (error as ValidationError).params as NifErrorParams;
 *   params.code; // "INVALID_CONTROL_CHARACTER"
 *   params.rule; // "DNI-2"
 * }
 */
export interface NifErrorParams {
  /** The error code of `validate()`. */
  code: NifErrorCode;
  /** The SPEC.md rule that failed, for example `"DNI-2"`. */
  rule: string;
  /** The right control character, for `INVALID_CONTROL_CHARACTER`. */
  expected?: string;
}

function schema(kind: NifSchemaKind, opts?: NifSchemaOptions): NifSchema {
  // INPUT-1: undefined, null and other types are not strings.
  const notAString = notAStringMessage(opts);
  return (
    string()
      .typeError(notAString)
      .defined(notAString)
      .nonNullable(notAString)
      // Yup runs the transforms first, and the tests on their result: a
      // valid value becomes its normalized form, and any other stays as it
      // is, so the test below gives the error for what was typed.
      .transform((value, original) => {
        // Yup turns numbers and other values into strings before this: the
        // original tells what was really given (INPUT-1).
        if (typeof original !== "string") return original;
        const result = checkNif(value, kind, opts);
        return result.ok ? result.value : value;
      })
      .test({
        name: "nif",
        test(value, context) {
          // Yup runs a test on undefined and null too. `defined` and
          // `nonNullable` (above) already refuse them unless the field was
          // made optional or nullable, so here they are accepted.
          if (value === undefined || value === null) return true;
          const result = checkNif(value, kind, opts);
          if (result.ok) return true;
          const { code, rule, expected, message } = result.error;
          return context.createError({
            message,
            params:
              expected === undefined
                ? { code, rule }
                : { code, rule, expected },
          });
        },
      })
  );
}

/**
 * A Yup schema for any Spanish NIF: a DNI, a K/L/M NIF, an NIE or a NIF of a
 * legal person or entity (CIF). The output is the normalized value. Takes the
 * options of `validate()`, including `types` to accept only some documents
 * (POLICY-2) and `locale` for the messages.
 *
 * @param opts `types`, `normalize`, `cifControl`, `rejectPlaceholders`,
 * `allowVatPrefix`, `locale`. See {@link NifSchemaOptions}.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * import { object } from "yup";
 * import { es } from "nif-dni-nie-cif-validation/locales/es";
 *
 * const form = object({ nif: yNif({ types: ["DNI", "NIE"], locale: es }) });
 * form.validateSync({ nif: " 12.345.678-z " }); // { nif: "12345678Z" }
 * @example
 * try {
 *   yNif().validateSync("12345678A");
 * } catch (error) {
 *   (error as ValidationError).message; // 'The control character is not correct: ...'
 *   (error as ValidationError).params;  // { code: "INVALID_CONTROL_CHARACTER", rule: "DNI-2", expected: "Z", ... }
 * }
 * @see SPEC.md#nif-1
 */
export function yNif(opts?: NifSchemaOptions): NifSchema {
  return schema("nif", opts);
}

/**
 * A Yup schema for a DNI (8 digits and a letter) or a K/L/M NIF, like
 * `isValidDni`. Another valid document, such as an NIE, gives
 * `UNSUPPORTED_TYPE`. The output is the normalized value: a DNI with fewer
 * than 8 digits is padded with zeros (NORM-4).
 *
 * @param opts The options of `validate()` except `types`.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * yDni().validateSync("1234567-l"); // "01234567L"
 * @example
 * yDni().isValidSync("X1234567L"); // false: UNSUPPORTED_TYPE
 * @see SPEC.md#dni-1
 * @see SPEC.md#klm-1
 */
export function yDni(opts?: TypedNifSchemaOptions): NifSchema {
  return schema("dni", opts);
}

/**
 * A Yup schema for an NIE. The output is the canonical 9-character form: an
 * old 10-character NIE is shortened (NIE-3).
 *
 * @param opts The options of `validate()` except `types`.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * yNie().validateSync("x-01234567-l"); // "X1234567L"
 * @example
 * yNie().isValidSync("12345678Z"); // false: a DNI is not an NIE
 * @see SPEC.md#nie-1
 * @see SPEC.md#nie-3
 */
export function yNie(opts?: TypedNifSchemaOptions): NifSchema {
  return schema("nie", opts);
}

/**
 * A Yup schema for the NIF of a legal person or entity (CIF). The control
 * character follows CIF-3 unless `cifControl: "lenient"`.
 *
 * @param opts The options of `validate()` except `types`.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * yCif().validateSync(" b-1234567-4 "); // "B12345674"
 * @example
 * yCif().isValidSync("G1234567D");                         // false (CIF-3)
 * yCif({ cifControl: "lenient" }).isValidSync("G1234567D"); // true
 * @see SPEC.md#cif-3
 */
export function yCif(opts?: TypedNifSchemaOptions): NifSchema {
  return schema("cif", opts);
}

/**
 * A Yup schema for a Spanish VAT number: `ES` and a NIF (VAT-1). The prefix
 * is required, as in `isValidSpanishVat`, and the output keeps it: `ES` and
 * the normalized NIF. It checks the format only: a valid format doesn't mean
 * the number is registered in VIES.
 *
 * @param opts The options of `validate()` except `allowVatPrefix`.
 * @returns A schema from `string` to the normalized `string`.
 * @example
 * ySpanishVat().validateSync("es b-1234567-4"); // "ESB12345674"
 * @example
 * ySpanishVat().isValidSync("B12345674"); // false: no ES prefix
 * @see SPEC.md#vat-1
 */
export function ySpanishVat(opts?: SpanishVatSchemaOptions): NifSchema {
  return schema("vat", opts);
}
