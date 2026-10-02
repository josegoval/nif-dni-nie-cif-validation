// robots.txt: every crawler may read every page, including the AI crawlers
// (they are named so the intent is explicit), and the sitemap is listed.
//
// GitHub Pages serves a project site under a path, and crawlers only read
// robots.txt at the root of the host, so this file takes effect once the site
// moves to a custom domain (website/README.md). It is published anyway, and
// the sitemap is also linked from every page.
import type { APIRoute } from "astro";

const AGENTS = [
  "Googlebot",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "YandexBot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(
    `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}sitemap-index.xml`,
    site
  );
  const body = [
    ...AGENTS.flatMap((agent) => [`User-agent: ${agent}`, "Allow: /", ""]),
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${sitemap.href}`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
