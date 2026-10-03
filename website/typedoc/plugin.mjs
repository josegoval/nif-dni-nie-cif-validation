// A TypeDoc plugin for the API reference: each module is named after the
// import specifier of its entry point (`nif-dni-nie-cif-validation/zod`),
// which is what a reader types, instead of its path in src/. Declarations that
// come from a dependency (the members our Valibot types inherit from
// `BaseIssue`, say) get no "Defined in" link: their source is in
// node_modules, which is not in the repository, so the link would be a 404.
import { Converter, ReflectionKind } from "typedoc";

const PACKAGE = "nif-dni-nie-cif-validation";

/** The src/ path of an entry point (without `.ts`) → its import specifier. */
const specifierOf = (path) =>
  path === "index" ? PACKAGE : `${PACKAGE}/${path.replace(/\/index$/, "")}`;

/** @param {import("typedoc").Application} app */
export function load(app) {
  app.converter.on(Converter.EVENT_RESOLVE_END, (context) => {
    for (const reflection of Object.values(context.project.reflections)) {
      if (!reflection.sources) continue;
      const own = reflection.sources.filter(
        (source) => !/(^|[\\/])node_modules[\\/]/.test(source.fullFileName)
      );
      if (own.length < reflection.sources.length) {
        reflection.sources = own.length > 0 ? own : undefined;
      }
    }
  });
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
