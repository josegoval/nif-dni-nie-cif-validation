// The validation behind the server action. It is a plain function of a
// FormData, apart from app/actions.ts ("use server" files can only export
// async functions), so lib/check-nif.test.ts can call it without Next.js.
import { validate } from "nif-dni-nie-cif-validation";
import { en } from "nif-dni-nie-cif-validation/locales/en";
import { es } from "nif-dni-nie-cif-validation/locales/es";

/** The languages the form offers. A locale is an object: the app chooses it. */
export const LOCALES = { en, es } as const;
export type Language = keyof typeof LOCALES;

/** What the action returns to the form. */
export type FormState =
  | { status: "idle" }
  | { status: "valid"; value: string; language: Language; normalized: string }
  | {
      status: "invalid";
      value: string;
      language: Language;
      code: string;
      rule: string;
      message: string;
    };

/** The language of the form field, else English: the form value is user input. */
function languageOf(data: FormData): Language {
  const language = data.get("language");
  return typeof language === "string" && Object.hasOwn(LOCALES, language)
    ? (language as Language)
    : "en";
}

/**
 * Validates the `nif` field of a submitted form with `validate()`. The message
 * of an invalid value is the library's, in the language of the `language` field.
 */
export function checkNif(data: FormData): FormState {
  const language = languageOf(data);
  const field = data.get("nif");
  // A file or a missing field is not a string: validate() answers with an error.
  const value = typeof field === "string" ? field : "";
  const result = validate(field, { locale: LOCALES[language] });
  if (result.valid && result.normalized !== null) {
    return { status: "valid", value, language, normalized: result.normalized };
  }
  // An invalid result always has an error (the type just doesn't say so).
  if (!result.error)
    throw new Error("validate() gave no error for an invalid value");
  const { code, rule, message } = result.error;
  return { status: "invalid", value, language, code, rule, message };
}
