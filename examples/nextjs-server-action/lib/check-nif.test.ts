// Runs the validation behind the server action on submitted forms, without
// Next.js (`pnpm test`). The expected messages are not typed in: they are what
// validate() itself returns, so the test follows the library.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type NifLocale, validate } from "nif-dni-nie-cif-validation";
import { es } from "nif-dni-nie-cif-validation/locales/es";
import { checkNif } from "./check-nif.ts";

/** What validate() says about a value, in a language: always an error here. */
function libraryError(value: string, locale?: NifLocale) {
  const result = validate(value, { locale });
  assert.equal(result.valid, false);
  assert.ok(result.error);
  return result.error;
}

/** A form as the browser submits it. */
function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

describe("checkNif", () => {
  it("accepts a valid NIF and returns it normalized", () => {
    const state = checkNif(form({ nif: " 12.345.678-z ", language: "es" }));
    assert.deepEqual(state, {
      status: "valid",
      value: " 12.345.678-z ",
      language: "es",
      normalized: "12345678Z",
    });
  });

  it("answers an invalid NIF with the Spanish message of the library", () => {
    const state = checkNif(form({ nif: "12345678A", language: "es" }));
    const expected = libraryError("12345678A", es);
    assert.ok(state.status === "invalid");
    assert.equal(state.message, expected.message);
    assert.equal(state.code, expected.code);
    assert.equal(state.rule, expected.rule);
  });

  it("answers in English by default, and when the language is unknown", () => {
    const expected = libraryError("12345678A");
    const forms: Record<string, string>[] = [
      { nif: "12345678A" },
      { nif: "12345678A", language: "fr" },
    ];
    for (const fields of forms) {
      const state = checkNif(form(fields));
      assert.ok(state.status === "invalid");
      assert.equal(state.message, expected.message);
      assert.equal(state.language, "en");
    }
  });

  it("answers a missing field with an error, not an exception", () => {
    const state = checkNif(form({ language: "es" }));
    assert.equal(state.status, "invalid");
  });
});
