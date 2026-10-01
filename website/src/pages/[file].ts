// Serves files of the repository at the root of the site, read at build time
// (and on each request in `astro dev`), so brand/ and the llms files at the
// repository root stay the single source: nothing is copied into the site.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { APIRoute, GetStaticPaths } from "astro";

/** Site path → file in the repository, and its media type. */
const FILES: Record<string, { source: string; type: string }> = {
  "favicon.svg": { source: "brand/favicon.svg", type: "image/svg+xml" },
  "favicon-16.png": { source: "brand/favicon-16.png", type: "image/png" },
  "favicon-32.png": { source: "brand/favicon-32.png", type: "image/png" },
  "apple-touch-icon-180.png": {
    source: "brand/apple-touch-icon-180.png",
    type: "image/png",
  },
  "icon-192.png": { source: "brand/icon-192.png", type: "image/png" },
  "icon-512.png": { source: "brand/icon-512.png", type: "image/png" },
  "site.webmanifest": {
    source: "brand/site.webmanifest",
    type: "application/manifest+json",
  },
  "og-default.png": { source: "brand/og-default.png", type: "image/png" },
  "llms.txt": { source: "llms.txt", type: "text/plain; charset=utf-8" },
  "llms-full.txt": {
    source: "llms-full.txt",
    type: "text/plain; charset=utf-8",
  },
};

export const getStaticPaths = (() =>
  Object.keys(FILES).map((file) => ({
    params: { file },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const entry = FILES[params.file ?? ""];
  if (!entry) return new Response(null, { status: 404 });
  return new Response(
    readFileSync(join(import.meta.env.REPO_ROOT, entry.source)),
    {
      headers: { "Content-Type": entry.type },
    }
  );
};
