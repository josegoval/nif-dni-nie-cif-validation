import { describe, expect, expectTypeOf, it } from "vitest";
import {
  type CifOrganisationKey,
  computeControlCharacter,
  describeCifOrganisation,
  type NifFormatRule,
  type NifLengthRule,
  type NifLocale,
  type NifMessages,
  type NifType,
  type ValidateOptions,
  validate,
} from "..";
import caDefault, { ca } from "../locales/ca";
import enDefault, { en } from "../locales/en";
import esDefault, { es } from "../locales/es";
import euDefault, { eu } from "../locales/eu";
import glDefault, { gl } from "../locales/gl";

// The locale objects (src/locales/): every locale has every text, the
// interpolated values appear in the messages, validate() and
// describeCifOrganisation() use the locale they are given, and anything
// else falls back to English without throwing. Test names start with the
// SPEC.md rule they exercise.

/** Every locale, with its module's default export. */
const LOCALES: [code: string, locale: NifLocale, byDefault: NifLocale][] = [
  ["en", en, enDefault],
  ["es", es, esDefault],
  ["ca", ca, caDefault],
  ["eu", eu, euDefault],
  ["gl", gl, glDefault],
];

// Every key, listed by hand. The compile-time checks below fail if a key is
// added to a type and not here, so the runtime walk covers every key.
const TYPES = ["DNI", "NIF_KLM", "NIE", "CIF"] as const;
const MESSAGE_KEYS = [
  "NOT_A_STRING",
  "EMPTY",
  "INVALID_LENGTH",
  "INVALID_FORMAT",
  "INVALID_CONTROL_CHARACTER",
  "UNSUPPORTED_TYPE",
  "PLACEHOLDER",
] as const;
const LENGTH_RULES = [
  "DNI-1",
  "KLM-1",
  "NIE-1",
  "NIE-3",
  "CIF-1",
  "VAT-1",
] as const;
const FORMAT_RULES = [
  "NIF-1",
  "VAT-1",
  "DNI-1",
  "KLM-1",
  "KLM-3",
  "NIE-1",
  "CIF-1",
] as const;
// biome-ignore format: one key per organisation, in SPEC.md order
const ORGANISATION_KEYS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "J", "N", "P", "Q", "R", "S", "U", "V", "W",
] as const;

type Exhaustive<All, Listed> = [Exclude<All, Listed>] extends [never]
  ? true
  : false;
const exhaustive: [
  Exhaustive<NifType, (typeof TYPES)[number]>,
  Exhaustive<keyof NifMessages, (typeof MESSAGE_KEYS)[number]>,
  Exhaustive<NifLengthRule, (typeof LENGTH_RULES)[number]>,
  Exhaustive<NifFormatRule, (typeof FORMAT_RULES)[number]>,
  Exhaustive<CifOrganisationKey, (typeof ORGANISATION_KEYS)[number]>,
] = [true, true, true, true, true];

/** A full sentence: starts with a non-space, ends with a full stop. */
const SENTENCE = /^\S.*\.$/u;

describe("locales: every locale has every text", () => {
  it("CIF-2: the key lists match the types (compile-time check)", () => {
    expect(exhaustive).toEqual([true, true, true, true, true]);
    for (const [, locale] of LOCALES)
      expectTypeOf(locale).toEqualTypeOf<NifLocale>();
    expect(ORGANISATION_KEYS).toHaveLength(17);
  });

  it.each(LOCALES)(
    "CIF-2: %s has the code of its module, and a default export",
    (code, locale, byDefault) => {
      expect(locale.code).toBe(code);
      expect(byDefault).toBe(locale);
    }
  );

  it.each(LOCALES)(
    "INPUT-2: %s has exactly the keys of every table",
    (_code, locale) => {
      const keys = (object: object) => Object.keys(object).sort();
      expect(keys(locale)).toEqual(
        ["code", "messages", "organisations", "types"].sort()
      );
      expect(keys(locale.types)).toEqual([...TYPES].sort());
      expect(keys(locale.messages)).toEqual([...MESSAGE_KEYS].sort());
      expect(keys(locale.messages.INVALID_LENGTH)).toEqual(
        [...LENGTH_RULES].sort()
      );
      expect(keys(locale.messages.INVALID_FORMAT)).toEqual(
        [...FORMAT_RULES].sort()
      );
      expect(keys(locale.organisations)).toEqual([...ORGANISATION_KEYS].sort());
    }
  );

  it.each(LOCALES)(
    "INPUT-2: every message of %s is a sentence, for every type",
    (_code, locale) => {
      const m = locale.messages;
      const texts = [
        m.NOT_A_STRING,
        m.EMPTY,
        m.PLACEHOLDER,
        ...LENGTH_RULES.map((rule) => m.INVALID_LENGTH[rule]),
        ...FORMAT_RULES.map((rule) => m.INVALID_FORMAT[rule]),
      ];
      for (const type of TYPES) {
        texts.push(m.UNSUPPORTED_TYPE(type));
        texts.push(m.INVALID_CONTROL_CHARACTER(type, "Z"));
      }
      for (const text of texts) {
        expect(typeof text).toBe("string");
        expect(text).toMatch(SENTENCE);
        expect(text).not.toMatch(/\s{2}|undefined|\$\{/);
      }
    }
  );

  it.each(LOCALES)(
    "CIF-2: %s names every document type and organisation key",
    (_code, locale) => {
      for (const type of TYPES) expect(locale.types[type]).toMatch(/^\S/);
      for (const key of ORGANISATION_KEYS) {
        const name = locale.organisations[key];
        // A noun phrase: capitalised, no final full stop.
        expect(name).toMatch(/^\p{Lu}\S*( \S+)*$/u);
        expect(name).not.toMatch(/\.$/);
      }
    }
  );

  it.each(LOCALES.filter(([code]) => code !== "en"))(
    "INPUT-2: %s translates every message and organisation name",
    (_code, locale) => {
      const m = locale.messages;
      const e = en.messages;
      const pairs: [string, string][] = [
        [m.NOT_A_STRING, e.NOT_A_STRING],
        [m.EMPTY, e.EMPTY],
        [m.PLACEHOLDER, e.PLACEHOLDER],
        ...LENGTH_RULES.map((r): [string, string] => [
          m.INVALID_LENGTH[r],
          e.INVALID_LENGTH[r],
        ]),
        ...FORMAT_RULES.map((r): [string, string] => [
          m.INVALID_FORMAT[r],
          e.INVALID_FORMAT[r],
        ]),
        ...TYPES.map((t): [string, string] => [
          m.INVALID_CONTROL_CHARACTER(t, "Z"),
          e.INVALID_CONTROL_CHARACTER(t, "Z"),
        ]),
        ...TYPES.map((t): [string, string] => [
          m.UNSUPPORTED_TYPE(t),
          e.UNSUPPORTED_TYPE(t),
        ]),
        ...ORGANISATION_KEYS.map((k): [string, string] => [
          locale.organisations[k],
          en.organisations[k],
        ]),
      ];
      for (const [text, english] of pairs) expect(text).not.toBe(english);
    }
  );
});

describe("locales: interpolated values", () => {
  it.each(LOCALES)(
    "DNI-2: %s puts the expected character and the type in the message",
    (_code, locale) => {
      for (const type of TYPES) {
        for (const expected of ["Z", "4", "W"]) {
          const text = locale.messages.INVALID_CONTROL_CHARACTER(
            type,
            expected
          );
          expect(text).toContain(expected);
          expect(text).toContain(locale.types[type]);
        }
        expect(locale.messages.UNSUPPORTED_TYPE(type)).toContain(
          locale.types[type]
        );
      }
    }
  );
});

/** One input per error code and rule, and the message it must get. */
const MESSAGE_CASES: [
  input: unknown,
  opts: ValidateOptions,
  message: (locale: NifLocale) => string,
][] = [
  [null, {}, (l) => l.messages.NOT_A_STRING],
  ["", {}, (l) => l.messages.EMPTY],
  ["ES", { allowVatPrefix: true }, (l) => l.messages.INVALID_LENGTH["VAT-1"]],
  ["123456789Z", {}, (l) => l.messages.INVALID_LENGTH["DNI-1"]],
  ["K12345678L", {}, (l) => l.messages.INVALID_LENGTH["KLM-1"]],
  ["X123456L", {}, (l) => l.messages.INVALID_LENGTH["NIE-1"]],
  ["X11234567L", {}, (l) => l.messages.INVALID_LENGTH["NIE-3"]],
  ["B1234567", {}, (l) => l.messages.INVALID_LENGTH["CIF-1"]],
  ["T12345678", {}, (l) => l.messages.INVALID_FORMAT["NIF-1"]],
  ["ES12345678Z", {}, (l) => l.messages.INVALID_FORMAT["VAT-1"]],
  ["1234567AZ", {}, (l) => l.messages.INVALID_FORMAT["DNI-1"]],
  ["K12345678", {}, (l) => l.messages.INVALID_FORMAT["KLM-1"]],
  ["K123456AL", {}, (l) => l.messages.INVALID_FORMAT["KLM-3"]],
  ["X123456AL", {}, (l) => l.messages.INVALID_FORMAT["NIE-1"]],
  ["B123456A4", {}, (l) => l.messages.INVALID_FORMAT["CIF-1"]],
  ["12345678A", {}, (l) => l.messages.INVALID_CONTROL_CHARACTER("DNI", "Z")],
  [
    "K1234567A",
    {},
    (l) => l.messages.INVALID_CONTROL_CHARACTER("NIF_KLM", "L"),
  ],
  ["Y1234567L", {}, (l) => l.messages.INVALID_CONTROL_CHARACTER("NIE", "X")],
  ["B12345675", {}, (l) => l.messages.INVALID_CONTROL_CHARACTER("CIF", "4")],
  ["12345678Z", { types: ["CIF"] }, (l) => l.messages.UNSUPPORTED_TYPE("DNI")],
  [
    "K1234567L",
    { types: ["DNI"] },
    (l) => l.messages.UNSUPPORTED_TYPE("NIF_KLM"),
  ],
  ["X1234567L", { types: ["DNI"] }, (l) => l.messages.UNSUPPORTED_TYPE("NIE")],
  ["B12345674", { types: ["DNI"] }, (l) => l.messages.UNSUPPORTED_TYPE("CIF")],
  ["00000000T", { rejectPlaceholders: true }, (l) => l.messages.PLACEHOLDER],
];

describe("locales: validate() and describeCifOrganisation()", () => {
  it("INPUT-2: the cases reach every code and every rule's message", () => {
    const seen = new Set(
      MESSAGE_CASES.map(([input, opts]) => {
        const { code, rule } = validate(input, opts).error ?? {};
        return code === "INVALID_LENGTH" || code === "INVALID_FORMAT"
          ? `${code} ${rule}`
          : code;
      })
    );
    expect([...seen].sort()).toEqual(
      [
        "NOT_A_STRING",
        "EMPTY",
        "INVALID_CONTROL_CHARACTER",
        "UNSUPPORTED_TYPE",
        "PLACEHOLDER",
        ...LENGTH_RULES.map((rule) => `INVALID_LENGTH ${rule}`),
        ...FORMAT_RULES.map((rule) => `INVALID_FORMAT ${rule}`),
      ].sort()
    );
  });

  it.each(LOCALES)(
    "INPUT-1: validate(x, { locale: %s }) gives that locale's messages",
    (_code, locale) => {
      for (const [input, opts, message] of MESSAGE_CASES) {
        const { error } = validate(input, { ...opts, locale });
        expect(error?.message).toBe(message(locale));
      }
    }
  );

  it.each(LOCALES)(
    "CIF-2: %s describes every organisation key, in validate() too",
    (_code, locale) => {
      for (const key of ORGANISATION_KEYS) {
        const description = locale.organisations[key];
        expect(describeCifOrganisation(key, locale)).toBe(description);
        expect(describeCifOrganisation(key.toLowerCase(), locale)).toBe(
          description
        );
        const cif = `${key}1234567${computeControlCharacter(`${key}1234567`)}`;
        expect(validate(cif, { locale }).meta).toEqual({
          orgKey: key,
          orgDescription: description,
        });
      }
    }
  );

  it("INPUT-1: English is the default", () => {
    for (const [input, opts, message] of MESSAGE_CASES)
      expect(validate(input, opts).error?.message).toBe(message(en));
    expect(describeCifOrganisation("B")).toBe(en.organisations.B);
  });
});

describe("locales: anything else falls back to English, never throws", () => {
  /** What plain JavaScript may pass as `locale`. */
  const NOT_LOCALES: unknown[] = [
    "es",
    "ca",
    "fr",
    "",
    null,
    42,
    true,
    [],
    {},
    () => es,
    { code: "es" },
    { messages: null, organisations: null },
    { messages: "es", organisations: "es" },
    { messages: { INVALID_LENGTH: null, INVALID_FORMAT: 1 } },
  ];

  it.each(NOT_LOCALES)("INPUT-1: locale %j gives English", (locale) => {
    for (const [input, opts, message] of MESSAGE_CASES) {
      const result = validate(input, {
        ...opts,
        locale: locale as NifLocale,
      });
      expect(result.error?.message).toBe(message(en));
    }
    expect(validate("B12345674", { locale: locale as NifLocale }).meta).toEqual(
      { orgKey: "B", orgDescription: en.organisations.B }
    );
    expect(describeCifOrganisation("B", locale as NifLocale)).toBe(
      en.organisations.B
    );
  });

  it("INPUT-1: a partial locale gives English for the texts it lacks", () => {
    const partial = {
      code: "xx",
      messages: { EMPTY: "Nothing here.", PLACEHOLDER: "" },
      organisations: { B: "Limitada" },
    } as unknown as NifLocale;
    expect(validate("", { locale: partial }).error?.message).toBe(
      "Nothing here."
    );
    expect(validate(null, { locale: partial }).error?.message).toBe(
      en.messages.NOT_A_STRING
    );
    // An empty string is not a message.
    expect(
      validate("00000000T", { rejectPlaceholders: true, locale: partial }).error
        ?.message
    ).toBe(en.messages.PLACEHOLDER);
    expect(describeCifOrganisation("B", partial)).toBe("Limitada");
    expect(describeCifOrganisation("A", partial)).toBe(en.organisations.A);
  });

  it("INPUT-1: message functions that throw or return a non-string give English", () => {
    const broken = {
      ...es,
      messages: {
        ...es.messages,
        INVALID_CONTROL_CHARACTER: () => {
          throw new Error("broken");
        },
        UNSUPPORTED_TYPE: () => 42,
      },
    } as unknown as NifLocale;
    expect(validate("12345678A", { locale: broken }).error?.message).toBe(
      en.messages.INVALID_CONTROL_CHARACTER("DNI", "Z")
    );
    expect(
      validate("12345678Z", { types: ["CIF"], locale: broken }).error?.message
    ).toBe(en.messages.UNSUPPORTED_TYPE("DNI"));
    expect(validate("", { locale: broken }).error?.message).toBe(
      es.messages.EMPTY
    );
  });
});
