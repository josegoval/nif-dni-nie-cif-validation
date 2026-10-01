// The website: Astro + Starlight, published on GitHub Pages by
// .github/workflows/pages.yml. See README.md in this folder, which also
// explains how to move it to a custom domain (`site`, `base` and a CNAME).
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightLinksValidator from "starlight-links-validator";
import { repoFiles } from "./integrations/repo-files.mjs";

// GitHub Pages serves a project site from https://<owner>.github.io/<repo>/.
// For a custom domain, set `site` to it and `base` to "/" (README.md).
const site = "https://josegoval.github.io";
const base = "/nif-dni-nie-cif-validation/";

export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "nif-dni-nie-cif-validation",
      description:
        "Validates Spanish NIF, DNI, K/L/M, NIE and CIF numbers against the official rules. 0 dependencies, typed, errors in 5 languages.",
      // English is the default, at the root (`/`); every other language has
      // the same files under its own folder (`/es/`, `/ca/`, `/eu/`, `/gl/`).
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        es: { label: "Español", lang: "es" },
        ca: { label: "Català", lang: "ca" },
        eu: { label: "Euskara", lang: "eu" },
        gl: { label: "Galego", lang: "gl" },
      },
      // brand/ is the single source of the logo: these are imported from it
      // at build time, not copied.
      logo: {
        light: "../brand/logo-mark.svg",
        dark: "../brand/logo-mark-dark.svg",
        alt: "",
      },
      favicon: "/favicon.svg",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/josegoval/nif-dni-nie-cif-validation",
        },
      ],
      sidebar: [
        {
          label: "Benchmarks",
          translations: {
            // cspell:disable
            es: "Rendimiento",
            ca: "Rendiment",
            eu: "Errendimendua",
            gl: "Rendemento",
            // cspell:enable
          },
          slug: "benchmarks",
        },
      ],
      customCss: ["./src/styles/fonts.css", "./src/styles/theme.css"],
      components: {
        Hero: "./src/components/overrides/Hero.astro",
        Footer: "./src/components/overrides/Footer.astro",
      },
      // Icons, Open Graph image and JSON-LD in the <head> (src/routeData.ts).
      routeMiddleware: "./src/routeData.ts",
      plugins: [starlightLinksValidator()],
    }),
    repoFiles(),
  ],
  vite: {
    server: {
      // The library is linked from the repository root (`link:..`), and
      // brand/, bench/ and the llms files are read from there.
      fs: { allow: [".."] },
    },
  },
});
