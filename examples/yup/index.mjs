// Yup schemas for a NIF: a form schema with a DNI/NIE and a CIF, the
// normalized output, and the localized error with its code and SPEC rule.
// Run it with `pnpm start`; it exits with an error if any result is not the
// one written next to it.
import assert from "node:assert/strict";
import { es } from "nif-dni-nie-cif-validation/locales/es";
import { yCif, yDni, yNif } from "nif-dni-nie-cif-validation/yup";
import { object, ValidationError } from "yup";

// The schema outputs the normalized document, so you store what you validated.
const customer = object({
  nif: yNif({ types: ["DNI", "NIE"], locale: es }),
  cif: yCif({ locale: es }),
});

const data = customer.validateSync({
  nif: " 12.345.678-z ",
  cif: "b-1234567-4",
});
console.log(data);
assert.deepEqual(data, { nif: "12345678Z", cif: "B12345674" });

// A refused value gives a ValidationError with what validate() says, in the
// language you passed: the message, and in `params` the error code, the
// SPEC.md rule and, for a wrong control character, the right one.
let error;
try {
  customer.validateSync({ nif: "12345678A", cif: "B12345674" });
} catch (caught) {
  error = caught;
}
assert.ok(error instanceof ValidationError);
console.log(error.path, error.params.code, error.params.rule, error.message);
assert.equal(error.path, "nif");
assert.equal(error.params.code, "INVALID_CONTROL_CHARACTER");
assert.equal(error.params.rule, "DNI-2");
assert.equal(error.params.expected, "Z");
assert.equal(
  error.message,
  "El carácter de control no es correcto: para este DNI debería ser «Z»."
);

// The typed schemas accept one kind of document: a NIE is not a DNI.
assert.equal(yDni().isValidSync("X1234567L"), false);
// A value that is not a string is refused with a message, not an exception.
assert.equal(yNif().isValidSync(null), false);

console.log("yup: OK");
