// A TypeDoc plugin for the API reference: each module is named after the
// import specifier of its entry point (`nif-dni-nie-cif-validation/zod`),
// which is what a reader types, instead of its path in src/.
import { Converter, ReflectionKind } from "typedoc";

const PACKAGE = "nif-dni-nie-cif-validation";

/** The src/ path of an entry point (without `.ts`) → its import specifier. */
const specifierOf = (path) =>
  path === "index" ? PACKAGE : `${PACKAGE}/${path.replace(/\/index$/, "")}`;

/** @param {import("typedoc").Application} app */
export function load(app) {
  app.converter.on(Converter.EVENT_RESOLVE_BEGIN, (context) => {
    for (const module of context.project.getReflectionsByKind(
      ReflectionKind.Module
    )) {
      const source = module.sources?.[0]?.fileName;
      if (!source) continue;
      const path = source.replace(/^.*?src\//, "").replace(/\.ts$/, "");
      module.name = specifierOf(path);
    }
  });
}
