import { describe, expect, it } from "vitest";
import * as current from "../src/index";
import {
  CONTENDERS,
  callFor,
  compileCall,
  SUBJECT_ID,
  supportsMixed,
  TYPES,
  versionOf,
} from "./competitors.mjs";
import { INPUTS, TYPE_INPUTS } from "./inputs.mjs";

// The registry of the competitor benchmark (#49): every call it lists must
// run, and give the right answer on a canonical document of its type.

// `pnpm test` runs before `pnpm build`, so the subject is loaded from src/.
const contenders = CONTENDERS.map((contender) =>
  contender.id === SUBJECT_ID
    ? { ...contender, load: () => current }
    : contender
);

const VALID = { DNI: "12345678Z", NIE: "X1234567L", CIF: "A58818501" };
const WRONG = { DNI: "12345678A", NIE: "X1234567A", CIF: "A58818500" };

describe("registry", () => {
  it("has unique ids and exactly one subject", () => {
    const ids = CONTENDERS.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CONTENDERS.filter(({ kind }) => kind === "subject")).toHaveLength(1);
    expect(ids).toContain(SUBJECT_ID);
  });

  it("covers the libraries of the issue", () =>
    expect(CONTENDERS.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        "v1",
        "spain-id",
        "better-dni",
        "dni-js",
        "stdnum",
        "validator-identity-card",
        "validator-tax-id",
        "maistik",
        "kreyo",
        "jsvat",
      ])
    ));

  it.each(CONTENDERS.map((c) => [c.id, c]))(
    "%s lists a call exactly for the types it supports",
    (_id, contender) => {
      for (const type of TYPES) {
        expect(contender.calls[type] !== null).toBe(contender.supports[type]);
        expect(contender.bundles[type] !== null).toBe(contender.supports[type]);
      }
      expect(contender.calls.any).toEqual(expect.any(String));
      expect(contender.bundles.full).toBeDefined();
    }
  );

  it.each(CONTENDERS.filter((c) => c.kind !== "subject").map((c) => [c.id, c]))(
    "%s has a version that is installed",
    (_id, contender) => expect(versionOf(contender)).toMatch(/^\d+\.\d+\.\d+$/)
  );

  it("times the mixed set only for libraries that cover DNI, NIE and CIF", () => {
    expect(
      CONTENDERS.filter(supportsMixed)
        .map(({ id }) => id)
        .sort()
    ).toEqual(
      [
        "current",
        "v1",
        "spain-id",
        "stdnum",
        "maistik",
        "kreyo",
        "jsvat",
      ].sort()
    );
  });

  it("describes how to bundle every call, as a module or as code", () => {
    for (const contender of CONTENDERS) {
      for (const spec of Object.values(contender.bundles)) {
        if (spec === null) continue;
        expect(Boolean(spec.code) !== Boolean(spec.from)).toBe(true);
      }
    }
  });
});

describe("calls", () => {
  for (const contender of contenders) {
    describe(contender.id, () => {
      for (const type of TYPES) {
        const call = callFor(contender, type);
        if (call === null) continue;
        it(`${type}: ${call}`, () => {
          const fn = compileCall(contender, call);
          expect(Boolean(fn(VALID[type]))).toBe(true);
          expect(Boolean(fn(WRONG[type]))).toBe(false);
          expect(Boolean(fn(""))).toBe(false);
        });
      }

      it(`any: ${contender.calls.any}`, () => {
        const fn = compileCall(contender, contender.calls.any);
        for (const type of TYPES) {
          if (!contender.supports[type]) continue;
          expect(Boolean(fn(VALID[type]))).toBe(true);
          expect(Boolean(fn(WRONG[type]))).toBe(false);
        }
      });
    });
  }

  it("a library without a call for a type has none in callFor", () =>
    expect(
      callFor(
        CONTENDERS.find(({ id }) => id === "better-dni"),
        "CIF"
      )
    ).toBe(null));
});

describe("input sets", () => {
  it.each([
    ["DNI", /^\d{8}[A-Z]$/],
    ["NIE", /^[XYZ]\d{7}[A-Z]$/],
    ["CIF", /^[A-Z]\d{7}[A-Z0-9]$/],
  ])(
    "the %s set is made of canonical documents of that type",
    (type, regex) => {
      expect(TYPE_INPUTS[type].length).toBeGreaterThan(100);
      for (const input of TYPE_INPUTS[type]) expect(input).toMatch(regex);
    }
  );

  it("the current build accepts the valid half and rejects the rest", () => {
    const fns = {
      DNI: current.isValidDni,
      NIE: current.isValidNie,
      CIF: current.isValidCif,
    };
    const valid = { DNI: 150, NIE: 100, CIF: 180 };
    for (const type of TYPES) {
      const accepted = TYPE_INPUTS[type].filter((x) => fns[type](x));
      expect(accepted).toHaveLength(valid[type]);
    }
  });

  it("the mixed set is the set of the v1 comparison", () =>
    expect(INPUTS).toHaveLength(1001));
});

describe("jsvat", () => {
  it("validates a VAT number, so the input gets the ES prefix", () => {
    const jsvat = contenders.find(({ id }) => id === "jsvat");
    expect(jsvat.transformInput("12345678Z")).toBe("ES12345678Z");
    expect(compileCall(jsvat, jsvat.calls.any)("12345678Z")).toBe(true);
  });
});
