// Validates Spanish NIF, DNI, NIE and CIF numbers from CommonJS with
// require(). Run it with `pnpm start`; it exits with an error if any result
// is not the one written next to it.
const assert = require("node:assert/strict");
const {
  isValidNif,
  isValidDni,
  isValidNie,
  isValidCif,
  validate,
  normalize,
} = require("nif-dni-nie-cif-validation");
// A language is its own entry point, so only the ones you require are loaded.
const { es } = require("nif-dni-nie-cif-validation/locales/es");

// The booleans: true or false, and they never throw.
assert.equal(isValidNif("12345678Z"), true); // a DNI
assert.equal(isValidDni(" 12.345.678-z "), true); // typed with dots, in lower case
assert.equal(isValidNie("x-1234567-l"), true); // a NIE
assert.equal(isValidCif("B12345674"), true); // the NIF of a company
assert.equal(isValidNif("12345678A"), false); // wrong letter: it should be Z
assert.equal(isValidNif(null), false); // not a string: false, not an exception

// validate() says why a value is invalid, which document it is, and the
// normalized form to store.
const result = validate(" 12.345.678-a ", { locale: es });
console.log(result);
assert.equal(result.valid, false);
assert.equal(result.type, "DNI");
assert.equal(result.normalized, "12345678A");
assert.deepEqual(result.error, {
  code: "INVALID_CONTROL_CHARACTER",
  rule: "DNI-2",
  expected: "Z",
  message:
    "El carácter de control no es correcto: para este DNI debería ser «Z».",
});

assert.equal(normalize(" b-1234567-4 "), "B12345674");

console.log("node-cjs: OK");
