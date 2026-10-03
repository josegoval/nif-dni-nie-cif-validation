// Shared by the bundle examples (bundle-webpack, bundle-nextjs): proves that a
// production bundle whose only use of the package is
// `import { isValidDni } from "nif-dni-nie-cif-validation"` holds no error
// message, no organisation name and no language.
//
// The strings to look for are not written here: they are read from the
// unpacked package (examples/.pack/package/dist/esm/locales/{en,es,ca,eu,gl}),
// so a new message or language is covered without touching this file.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const examples = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(examples, ".pack", "package", "dist", "esm");
const LANGUAGES = ["en", "es", "ca", "eu", "gl"];

// Present in the code of isValidDni and in no message: the table of control
// letters of the DNI (SPEC DNI-2). Without it the bundle isn't the validator.
export const DNI_MARKER = "TRWAGMYFPDXBNJZSQVHLCKE";

// A bundler may re-quote or escape a string, so look for the longest runs of
// plain characters (letters, digits, spaces and a little punctuation, no quote,
// backslash or accent) of a text, not for the whole text.
const PLAIN_RUN = /[A-Za-z0-9 ,.:;()/+-]{16,}/g;
const MIN_WORDS = 3;

function collectTexts(value, texts) {
  if (typeof value === "string") texts.push(value);
  // Messages that need the document are functions: their source text holds
  // the fixed pieces of the message.
  else if (typeof value === "function") texts.push(value.toString());
  else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectTexts(item, texts);
  }
}

/** Distinctive fragments of every message, type name and organisation name of every language. */
export async function forbiddenFragments() {
  const fragments = new Set();
  for (const code of LANGUAGES) {
    const file = join(dist, "locales", `${code}.mjs`);
    const locale = (await import(file))[code];
    if (!locale || locale.code !== code) {
      throw new Error(`${file} does not export the locale "${code}"`);
    }
    const source = readFileSync(file, "utf8");
    const texts = [];
    collectTexts(locale, texts);
    for (const text of texts) {
      for (const run of text.match(PLAIN_RUN) ?? []) {
        const fragment = run.trim();
        if (fragment.split(" ").length < MIN_WORDS) continue;
        // The fragment must be in the file that the package ships, or this
        // check would be looking for something no bundle could contain.
        if (!source.includes(fragment)) continue;
        fragments.add(fragment);
      }
    }
  }
  if (fragments.size < 100) {
    throw new Error(
      `only ${fragments.size} fragments were found in the locales: the extraction is broken`
    );
  }
  return [...fragments];
}

/** Every `.js`/`.mjs` file under `directory`, recursively. */
export function javascriptFiles(directory) {
  const found = [];
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) found.push(...javascriptFiles(path));
    else if (/\.m?js$/.test(name)) found.push(path);
  }
  return found;
}

/**
 * Fails (exit code 1) unless some file has the DNI marker and no file has a
 * message. `files` are the JavaScript files that a browser would load.
 */
export async function assertNoMessages({ label, files }) {
  if (files.length === 0)
    throw new Error(`${label}: no JavaScript files found`);
  const fragments = await forbiddenFragments();
  const contents = files.map((file) => ({
    file,
    text: readFileSync(file, "utf8"),
  }));

  const withValidator = contents.filter(({ text }) =>
    text.includes(DNI_MARKER)
  );
  if (withValidator.length === 0) {
    throw new Error(
      `${label}: no file has the DNI control letters (${DNI_MARKER}): the bundle doesn't hold isValidDni`
    );
  }

  const leaks = [];
  for (const { file, text } of contents) {
    for (const fragment of fragments) {
      if (text.includes(fragment)) leaks.push({ file, fragment });
    }
  }

  for (const { file, text } of withValidator) {
    const raw = Buffer.byteLength(text);
    const gzip = gzipSync(text, { level: 9 }).length;
    console.log(
      `${label}: ${relative(examples, file)} has isValidDni, ${raw} B (${gzip} B gzipped)`
    );
  }
  console.log(
    `${label}: scanned ${files.length} file(s) for ${fragments.length} message fragments of ${LANGUAGES.join(", ")}`
  );

  if (leaks.length > 0) {
    const sample = leaks
      .slice(0, 5)
      .map(
        ({ file, fragment }) => `  ${relative(examples, file)}: "${fragment}"`
      )
      .join("\n");
    throw new Error(
      `${label}: the bundle holds ${leaks.length} message fragment(s) of the package:\n${sample}`
    );
  }
  console.log(
    `${label}: OK, no message, organisation name or language in the bundle`
  );
}

/** Runs `assertNoMessages` as a script: a failure is a message and exit code 1. */
export async function runCheck(options) {
  try {
    await assertNoMessages(options);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
