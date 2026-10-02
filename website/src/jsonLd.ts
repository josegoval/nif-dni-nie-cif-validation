// The JSON-LD (schema.org) of the documentation pages, for search engines
// and AI agents: `TechArticle` on the guides and migration pages, and
// `FAQPage` on the FAQ, whose questions and answers are read from the page
// itself (its `##` headings and the prose under each), so they can't drift.

const PACKAGE = "nif-dni-nie-cif-validation";
const REPO = "https://github.com/josegoval/nif-dni-nie-cif-validation";

export const AUTHOR = {
  "@type": "Person",
  name: "josegoval",
  url: "https://github.com/josegoval",
};

interface Page {
  title: string;
  description: string;
  url: string;
  lang: string;
  /** The site's home page in the page's language. */
  home: string;
  /** The name of the documentation, in the page's language. */
  docsName: string;
  lastUpdated: Date | undefined;
}

/** A guide or a migration page. */
export function techArticle(page: Page) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: page.title,
    description: page.description,
    url: page.url,
    mainEntityOfPage: page.url,
    inLanguage: page.lang,
    ...(page.lastUpdated
      ? { dateModified: page.lastUpdated.toISOString().slice(0, 10) }
      : {}),
    author: AUTHOR,
    isPartOf: { "@type": "WebSite", name: page.docsName, url: page.home },
    about: {
      "@type": "SoftwareSourceCode",
      name: PACKAGE,
      codeRepository: REPO,
      programmingLanguage: "TypeScript",
    },
  };
}

/** Markdown (MDX) prose as plain text: no code, links or emphasis. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/^```[\s\S]*?^```$/gm, "") // code blocks
    .replace(/^(?:import|export) .*$/gm, "") // MDX imports
    .replace(/^\s*<[^>]+>\s*$/gm, "") // component tags on their own line
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "") // MDX comments
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // links and images
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__|\*|_)(\S[\s\S]*?\S|\S)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();
}

/** The `##` questions of a FAQ page and the prose that answers each. */
export function faqEntries(
  body: string
): { question: string; answer: string }[] {
  const sections = body.split(/^## /m).slice(1);
  return sections.map((section) => {
    const [heading = "", ...rest] = section.split("\n");
    return { question: heading.trim(), answer: plainText(rest.join("\n")) };
  });
}

/** The FAQ page. */
export function faqPage(page: Page, body: string) {
  const entries = faqEntries(body);
  if (entries.length === 0) throw new Error(`${page.url}: no questions`);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: page.title,
    description: page.description,
    url: page.url,
    inLanguage: page.lang,
    mainEntity: entries.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
