// Starlight route middleware: adds to the <head> of every page what
// Starlight doesn't emit itself. The icons and the manifest (brand/), the
// Open Graph and Twitter image (brand/og-default.png), and, on each landing
// page, the JSON-LD that describes the package. Titles, descriptions,
// canonical URLs and the hreflang alternates (x-default = English) come from
// Starlight and the pages' frontmatter, except on the API reference's
// fallback pages, whose title and description are translated here.
import { defineRouteMiddleware } from "@astrojs/starlight/route-data";
import { langOf, stringsFor } from "./i18n";

const SITE_TITLE = "nif-dni-nie-cif-validation";
const REPO = "https://github.com/josegoval/nif-dni-nie-cif-validation";
const NPM = "https://www.npmjs.com/package/nif-dni-nie-cif-validation";

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  const site = context.site ?? new URL(context.url.origin);
  const absolute = (path: string) => new URL(`${base}${path}`, site).href;
  const lang = langOf(route.lang);
  const t = stringsFor(lang);
  const isLanding = route.entry.data.template === "splash";
  // The page's path without its language folder: "guides/faq".
  const path = route.locale
    ? route.id.slice(route.locale.length + 1)
    : route.id;
  let title = route.entry.data.title;
  let description = route.entry.data.description ?? "";

  // The API reference is English only: in the other languages, Starlight
  // shows its pages as fallback content. Give each one a title and a
  // description in the page's language, so that no two pages of the site
  // share them.
  if (route.isFallback && path.startsWith("reference/api/")) {
    title = t.docs.apiFallback.title(route.entry.data.title);
    description = t.docs.apiFallback.description(route.entry.data.title);
    for (const entry of route.head) {
      if (entry.tag === "title") entry.content = `${title} | ${SITE_TITLE}`;
      const key = entry.attrs?.name ?? entry.attrs?.property;
      if (entry.tag !== "meta" || !entry.attrs) continue;
      if (key === "description" || key === "og:description")
        entry.attrs.content = description;
      if (key === "og:title") entry.attrs.content = title;
    }
  }

  route.head.push(
    {
      tag: "link",
      attrs: {
        rel: "icon",
        href: `${base}favicon-32.png`,
        sizes: "32x32",
        type: "image/png",
      },
    },
    {
      tag: "link",
      attrs: {
        rel: "icon",
        href: `${base}favicon-16.png`,
        sizes: "16x16",
        type: "image/png",
      },
    },
    {
      tag: "link",
      attrs: {
        rel: "apple-touch-icon",
        href: `${base}apple-touch-icon-180.png`,
      },
    },
    {
      tag: "link",
      attrs: { rel: "manifest", href: `${base}site.webmanifest` },
    },
    { tag: "meta", attrs: { name: "theme-color", content: "#C8102E" } },
    {
      tag: "meta",
      attrs: { property: "og:image", content: absolute("og-default.png") },
    },
    { tag: "meta", attrs: { property: "og:image:width", content: "1200" } },
    { tag: "meta", attrs: { property: "og:image:height", content: "630" } },
    {
      tag: "meta",
      attrs: { property: "og:image:alt", content: t.hero.logoAlt },
    },
    {
      tag: "meta",
      attrs: { name: "twitter:image", content: absolute("og-default.png") },
    },
    {
      tag: "meta",
      attrs: { name: "twitter:image:alt", content: t.hero.logoAlt },
    },
    {
      tag: "meta",
      attrs: { name: "twitter:title", content: title },
    },
    {
      tag: "meta",
      attrs: { name: "twitter:description", content: description },
    }
  );

  if (isLanding) {
    // A landing page is the site's front page, not an article.
    const ogType = route.head.find(
      (entry) => entry.tag === "meta" && entry.attrs?.property === "og:type"
    );
    if (ogType?.attrs) ogType.attrs.content = "website";

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      name: "nif-dni-nie-cif-validation",
      description,
      url: new URL(context.url.pathname, site).href,
      inLanguage: route.lang,
      programmingLanguage: { "@type": "ComputerLanguage", name: "TypeScript" },
      runtimePlatform: ["Node.js", "Web browsers", "Deno", "Bun"],
      codeRepository: REPO,
      license: "https://spdx.org/licenses/MIT.html",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      sameAs: [NPM, REPO],
      author: {
        "@type": "Person",
        name: "josegoval",
        url: "https://github.com/josegoval",
      },
      keywords: [
        "NIF",
        "DNI",
        "NIE",
        "CIF",
        "Spain",
        "validation",
        "TypeScript",
      ],
    };
    route.head.push({
      tag: "script",
      attrs: { type: "application/ld+json" },
      content: JSON.stringify(jsonLd),
    });
  }
});
