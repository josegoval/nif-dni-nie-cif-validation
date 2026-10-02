// Valibot schemas for a NIF: a form schema with a DNI/NIE and a CIF, the
// normalized output, and the localized error with its code and SPEC rule.
// Run it with `pnpm start`; it exits with an error if any result is not the
// one written next to it.
import assert from "node:assert/strict";
import { es } from "nif-dni-nie-cif-validation/locales/es";
import { vCif, vDni, vNif } from "nif-dni-nie-cif-validation/valibot";
import { object, parse, safeParse } from "valibot";

// The schema outputs the normalized document, so you store what you parsed.
const customer = object({
  nif: vNif({ types: ["DNI", "NIE"], locale: es }),
  cif: vCif({ locale: es }),
});

const data = parse(customer, { nif: " 12.345.678-z ", cif: "b-1234567-4" });
console.log(data);
assert.deepEqual(data, { nif: "12345678Z", cif: "B12345674" });

// A refused value gives an issue with what validate() says, in the language
// you passed: the message, the error code, the SPEC.md rule and, for a wrong
// control character, the right one.
const result = safeParse(customer, { nif: "12345678A", cif: "B12345674" });
assert.equal(result.success, false);
const [issue] = result.issues;
console.log(issue.path[0].key, issue.code, issue.rule, issue.message);
assert.equal(issue.path[0].key, "nif");
assert.equal(issue.code, "INVALID_CONTROL_CHARACTER");
assert.equal(issue.rule, "DNI-2");
assert.equal(issue.expected, "Z");
assert.equal(
  issue.message,
  "El carácter de control no es correcto: para este DNI debería ser «Z»."
);

// The typed schemas accept one kind of document: a NIE is not a DNI.
assert.equal(safeParse(vDni(), "X1234567L").success, false);
// A value that is not a string is refused with a message, not an exception.
assert.equal(safeParse(vNif(), 12345678).success, false);

console.log("valibot: OK");
