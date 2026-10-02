// The live validator: the package's real validate() and locale objects,
// imported from the repository's build (website/README.md), run in the
// browser. Nothing is sent anywhere.
//
// Each language has its own small entry point (validator-<lang>.ts) that
// imports its locale object and calls mount(), so a page only downloads its
// own language (English is built into validate()). The generators run in a
// worker that starts on the first press of a "Random" button, so they cost
// nothing on page load.
import {
  type NifLocale,
  type NifType,
  type ValidationResult,
  validate,
} from "nif-dni-nie-cif-validation";
import type { ValidatorStrings } from "../../i18n/types";

/** The SPEC.md rule that checks the control character of each type. */
const CONTROL_RULE: Record<NifType, string> = {
  DNI: "DNI-2",
  NIF_KLM: "KLM-2",
  NIE: "NIE-2",
  CIF: "CIF-4",
};

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

let worker: Worker | undefined;

/** A random valid number of a type, from the package's /generate. */
function generate(type: string): Promise<string> {
  worker ??= new Worker(new URL("./generator.worker.ts", import.meta.url), {
    type: "module",
  });
  const current = worker;
  return new Promise((resolve) => {
    current.addEventListener("message", (event) => resolve(event.data), {
      once: true,
    });
    current.postMessage(type);
  });
}

function setUp(root: HTMLElement, locale: NifLocale): void {
  const input = root.querySelector<HTMLInputElement>("[data-input]");
  const result = root.querySelector<HTMLElement>("[data-result]");
  const status = root.querySelector<HTMLElement>("[data-status]");
  const details = root.querySelector<HTMLDListElement>("[data-details]");
  const buttons = root.querySelector<HTMLElement>("[data-generate]");
  const generatedNote = root.querySelector<HTMLElement>(
    "[data-generated-note]"
  );
  if (!input || !result || !status || !details || !buttons) return;

  const t = JSON.parse(root.dataset.strings ?? "{}") as ValidatorStrings;
  const specUrl = root.dataset.spec ?? "";

  const row = (term: string, ...value: (Node | string)[]) => {
    const dd = element("dd");
    dd.append(...value);
    details.append(element("dt", term), dd);
  };

  const ruleLink = (rule: string) => {
    const link = element("a", rule);
    link.href = `${specUrl}#${rule.toLowerCase()}`;
    return link;
  };

  const render = (value: string) => {
    details.replaceChildren();
    if (value.trim() === "") {
      delete result.dataset.valid;
      delete result.dataset.code;
      status.textContent = t.empty;
      details.hidden = true;
      return;
    }
    const r: ValidationResult = validate(value, { locale });
    const type = r.type ? locale.types[r.type] : t.none;
    result.dataset.valid = String(r.valid);
    result.dataset.code = r.error?.code ?? "";
    status.textContent = r.valid
      ? `${t.valid}: ${type}`
      : `${t.invalid}: ${r.error?.message ?? ""}`;

    row(t.type, type);
    row(t.normalized, r.normalized ? element("code", r.normalized) : t.none);
    if (r.valid && r.normalized) {
      row(
        t.control,
        element("code", r.normalized.slice(-1)),
        ` (${t.controlOk})`
      );
    } else if (r.error?.expected) {
      row(t.control, `${t.expected} `, element("code", r.error.expected));
    }
    const rule = r.valid ? r.type && CONTROL_RULE[r.type] : r.error?.rule;
    if (rule) {
      row(
        t.rule,
        ruleLink(rule),
        ` (${r.valid ? t.rulePassed : t.ruleFailed})`
      );
    }
    if (r.meta) {
      row(t.organisation, `${r.meta.orgKey}: ${r.meta.orgDescription}`);
    }
    details.hidden = false;
  };

  input.addEventListener("input", () => render(input.value));
  buttons.addEventListener("click", async (event) => {
    const type = (event.target as HTMLElement).closest("button")?.dataset.type;
    if (!type) return;
    input.value = await generate(type);
    render(input.value);
    if (generatedNote) generatedNote.hidden = false;
  });
  buttons.hidden = false;
  root.querySelector<HTMLElement>("[data-noscript]")?.remove();
  // A value the browser restored (back/forward) is checked straight away.
  render(input.value);
}

/** Starts every live validator of the page, in the page's language. */
export function mount(locale: NifLocale): void {
  for (const root of document.querySelectorAll<HTMLElement>(
    "[data-validator]"
  )) {
    setUp(root, locale);
  }
}
