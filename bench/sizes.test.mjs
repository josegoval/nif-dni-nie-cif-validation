import { describe, expect, it } from "vitest";
import { ROOT } from "./competitors.mjs";
import {
  entryOf,
  importOf,
  measureBundle,
  measureContenders,
} from "./sizes.mjs";

describe("entryOf and importOf", () => {
  it("imports a named function and uses it", () => {
    const spec = { from: "spain-id", named: "validDNI" };
    expect(entryOf(spec)).toBe(
      'import { validDNI } from "spain-id"; console.log(validDNI);'
    );
    expect(importOf(spec)).toBe('import { validDNI } from "spain-id";');
  });

  it("imports a default export", () =>
    expect(
      entryOf({ from: "validator/es/lib/isTaxID", default: "isTaxID" })
    ).toBe(
      'import isTaxID from "validator/es/lib/isTaxID"; console.log(isTaxID);'
    ));

  it("imports the whole namespace", () =>
    expect(importOf({ from: "jsvat", namespace: true })).toBe(
      'import * as lib from "jsvat";'
    ));

  it("resolves a path of this package from the repository root", () =>
    expect(
      entryOf({ from: "dist/esm/index.mjs", named: "isValidDni" })
    ).toContain(`"${ROOT}dist/esm/index.mjs"`));

  it("takes a code spec as it is", () => {
    const spec = { code: 'import { a } from "x"; console.log(a.b);' };
    expect(entryOf(spec)).toBe(spec.code);
    expect(importOf(spec)).toBe(spec.code);
  });
});

describe("measureBundle", () => {
  it("bundles, minifies and gzips an import", async () => {
    const size = await measureBundle({ from: "spain-id", named: "validDNI" });
    expect(size.import).toBe('import { validDNI } from "spain-id";');
    // Well under the whole of spain-id, which the tree shaking drops.
    const whole = await measureBundle({ from: "spain-id", namespace: true });
    expect(size.gzipBytes).toBeGreaterThan(50);
    expect(size.gzipBytes).toBeLessThan(whole.gzipBytes);
    expect(size.minBytes).toBeGreaterThan(size.gzipBytes);
  });
});

describe("measureContenders", () => {
  it("measures every call once, and leaves a missing one null", async () => {
    const spec = { from: "spain-id", named: "validDNI" };
    const sizes = await measureContenders([
      {
        id: "a",
        bundles: { DNI: spec, NIE: spec, CIF: null, any: spec, full: spec },
        sizeAlternatives: [{ label: "same", bundle: spec }],
      },
    ]);
    expect(sizes.a.CIF).toBeNull();
    expect(sizes.a.DNI).toEqual(sizes.a.NIE);
    expect(sizes.a.alternatives).toEqual([{ label: "same", ...sizes.a.DNI }]);
  });

  it("has no alternatives by default", async () => {
    const sizes = await measureContenders([
      {
        id: "b",
        bundles: { DNI: null, full: { from: "spain-id", namespace: true } },
      },
    ]);
    expect(sizes.b.alternatives).toEqual([]);
  });
});
