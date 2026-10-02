import { defineCollection } from "astro:content";
import { docsLoader, i18nLoader } from "@astrojs/starlight/loaders";
import { docsSchema, i18nSchema } from "@astrojs/starlight/schema";

export const collections = {
  // One folder per language, with the same files: src/content/docs/ is
  // English (the root locale), src/content/docs/<code>/ the others.
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  // Starlight's own UI strings for the languages it doesn't ship (Basque),
  // and fixes to the ones it does (src/content/i18n/<code>.json).
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
