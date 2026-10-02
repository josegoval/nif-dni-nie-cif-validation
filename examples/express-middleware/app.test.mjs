// Starts the app on a free port and posts to it. `pnpm check` runs this, and
// exits with an error if any answer is not the expected one.
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createApp } from "./app.mjs";

let server;
let url;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  url = `http://localhost:${server.address().port}`;
});

after(() => server.close());

/** POSTs a JSON body, optionally in a language, and returns status and body. */
async function post(path, body, language) {
  const response = await fetch(url + path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(language && { "accept-language": language }),
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

describe("POST /customers", () => {
  it("stores the normalized NIF of a valid DNI", async () => {
    const { status, body } = await post("/customers", {
      nif: " 12.345.678-z ",
    });
    assert.equal(status, 201);
    assert.deepEqual(body, { nif: "12345678Z", type: "DNI" });
  });

  it("accepts a NIE", async () => {
    const { status, body } = await post("/customers", { nif: "x-1234567-l" });
    assert.equal(status, 201);
    assert.deepEqual(body, { nif: "X1234567L", type: "NIE" });
  });

  it("answers 422 with the code, the rule and the right letter, in English", async () => {
    const { status, body } = await post("/customers", { nif: "12345678A" });
    assert.equal(status, 422);
    assert.deepEqual(body.errors, [
      {
        field: "nif",
        code: "INVALID_CONTROL_CHARACTER",
        rule: "DNI-2",
        message:
          'The control character is not correct: for this DNI it should be "Z".',
        expected: "Z",
      },
    ]);
  });

  it("answers in the language of Accept-Language", async () => {
    const es = await post("/customers", { nif: "12345678A" }, "es-ES,es;q=0.9");
    assert.equal(
      es.body.errors[0].message,
      "El carácter de control no es correcto: para este DNI debería ser «Z»."
    );
    const ca = await post("/customers", { nif: "12345678A" }, "ca");
    assert.equal(
      ca.body.errors[0].message,
      "El caràcter de control no és correcte: per a aquest DNI hauria de ser «Z»."
    );
    // A language the package doesn't have: English.
    const fr = await post("/customers", { nif: "12345678A" }, "fr-FR,fr");
    assert.match(fr.body.errors[0].message, /^The control character/);
  });

  it("refuses a CIF here, because the route accepts persons only", async () => {
    const { status, body } = await post("/customers", { nif: "B12345674" });
    assert.equal(status, 422);
    assert.equal(body.errors[0].code, "UNSUPPORTED_TYPE");
    assert.equal(body.errors[0].rule, "POLICY-2");
  });

  it("refuses a missing field", async () => {
    const { status, body } = await post("/customers", {});
    assert.equal(status, 422);
    assert.equal(body.errors[0].code, "NOT_A_STRING");
  });
});

describe("POST /companies", () => {
  it("says what kind of entity the CIF is, in the request's language", async () => {
    const { status, body } = await post(
      "/companies",
      { cif: " b-1234567-4 " },
      "es"
    );
    assert.equal(status, 201);
    assert.deepEqual(body, {
      cif: "B12345674",
      entity: "Sociedad de responsabilidad limitada",
    });
  });

  it("refuses a CIF whose control character is the wrong kind for its key", async () => {
    const { status, body } = await post("/companies", { cif: "G1234567D" });
    assert.equal(status, 422);
    assert.equal(body.errors[0].rule, "CIF-3");
  });
});
