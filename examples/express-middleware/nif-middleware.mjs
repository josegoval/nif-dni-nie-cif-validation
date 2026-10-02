import { validate } from "nif-dni-nie-cif-validation";
import { ca } from "nif-dni-nie-cif-validation/locales/ca";
import { en } from "nif-dni-nie-cif-validation/locales/en";
import { es } from "nif-dni-nie-cif-validation/locales/es";
import { eu } from "nif-dni-nie-cif-validation/locales/eu";
import { gl } from "nif-dni-nie-cif-validation/locales/gl";

const LOCALES = { en, es, ca, eu, gl };

/**
 * The locale for an `Accept-Language` header such as `ca-ES,ca;q=0.9,en;q=0.8`:
 * the first language of the header that the package has, else English.
 * Languages are objects, so the package never guesses one from a string:
 * this is the one place where the application chooses.
 */
export function localeFor(acceptLanguage) {
  for (const range of String(acceptLanguage ?? "").split(",")) {
    const code = range.split(";")[0]?.trim().split("-")[0]?.toLowerCase();
    if (code && Object.hasOwn(LOCALES, code)) return LOCALES[code];
  }
  return en;
}

/**
 * Express middleware: validates `req.body[field]` with `validate()` and the
 * given options (`types`, `rejectPlaceholders`, ...).
 *
 * - Valid: the field is replaced by the normalized document (`" 12.345.678-z "`
 *   becomes `"12345678Z"`), `req.nif` has the whole result, and the next
 *   handler runs.
 * - Invalid: it answers `422` with the error code, the SPEC.md rule and a
 *   message in the language of the request, and nothing else runs.
 */
export function validateNif(field, options = {}) {
  return (req, res, next) => {
    const result = validate(req.body?.[field], {
      locale: localeFor(req.get("accept-language")),
      ...options,
    });
    if (!result.valid) {
      const { code, rule, message, expected } = result.error;
      return res.status(422).json({
        errors: [{ field, code, rule, message, ...(expected && { expected }) }],
      });
    }
    req.body[field] = result.normalized;
    req.nif = result;
    next();
  };
}
