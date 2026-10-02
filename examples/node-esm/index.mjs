// Validates Spanish NIF, DNI, NIE and CIF numbers from an ES module. Run it
// with `pnpm start`; it exits with an error if any result is not the one
// written next to it.
import assert from "node:assert/strict";
import {
  computeControlCharacter,
  describeCifOrganisation,
  format,
  getNifType,
  isValidNif,
  validate,
} from "nif-dni-nie-cif-validation";
// Opt-in entry points: test data, and a language (English is built in).
import { generateDni } from "nif-dni-nie-cif-validation/generate";
import { es } from "nif-dni-nie-cif-validation/locales/es";

assert.equal(isValidNif("12345678Z"), true);
assert.equal(isValidNif("12345678A"), false);

// Which kind of document is it, whatever its control character?
assert.equal(getNifType("12345678A"), "DNI");
assert.equal(getNifType("X1234567L"), "NIE");
assert.equal(getNifType("B12345674"), "CIF");

// A CIF says what kind of entity it is, in the language you pass.
const company = validate("B12345674", { locale: es });
assert.equal(company.valid, true);
assert.deepEqual(company.meta, {
  orgKey: "B",
  orgDescription: "Sociedad de responsabilidad limitada",
});
assert.equal(describeCifOrganisation("G"), "Association");

// "Did you mean ...?": the control character of a value without it.
assert.equal(computeControlCharacter("12345678"), "Z");
assert.equal(format("12345678z"), "12345678-Z");

// Test data: a valid DNI that is the same on every run, for a given seed.
const dni = generateDni({ seed: 7 });
assert.equal(dni, generateDni({ seed: 7 }));
assert.equal(isValidNif(dni), true);

console.log(`node-esm: OK (generated ${dni}, ${format(dni)})`);
