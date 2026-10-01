// Validates Spanish NIF, DNI, NIE and CIF numbers with Deno. Run it with
// `pnpm start` (or `deno task start`); it exits with an error if any result
// is not the one written next to it.
//
// The imports below are bare names, which Deno resolves from package.json and
// node_modules here (deno.json: "nodeModulesDir": "manual"), so the example
// runs against the packed package. In your own project, import from the
// registry with the `npm:` specifier instead:
//
//   import { validate } from "npm:nif-dni-nie-cif-validation@^2";
//   import { es } from "npm:nif-dni-nie-cif-validation@^2/locales/es";
import assert from "node:assert/strict";
import { isValidNif, validate } from "nif-dni-nie-cif-validation";
import { generateDni } from "nif-dni-nie-cif-validation/generate";
import { es } from "nif-dni-nie-cif-validation/locales/es";

assert.equal(isValidNif("12345678Z"), true);
assert.equal(isValidNif(" b-1234567-4 "), true);
assert.equal(isValidNif("12345678A"), false);

const result = validate("12345678A", { locale: es });
assert.equal(result.valid, false);
assert.equal(result.error?.code, "INVALID_CONTROL_CHARACTER");
assert.equal(result.error?.rule, "DNI-2");
assert.equal(
  result.error?.message,
  "El carácter de control no es correcto: para este DNI debería ser «Z»."
);

// The same seed gives the same valid DNI on every run.
const dni = generateDni({ seed: 7 });
assert.equal(dni, generateDni({ seed: 7 }));
assert.equal(isValidNif(dni), true);

console.log(`deno ${Deno.version.deno}: OK (generated ${dni})`);
