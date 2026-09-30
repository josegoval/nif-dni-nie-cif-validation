// The fixed, mixed input set of the benchmark. It is generated from a seeded
// PRNG, so every run (and every machine) measures exactly the same strings.
//
// It mixes what a validator sees in practice: valid DNI, K/L/M, NIE (new and
// old form) and legal entity NIFs (CIF) of every organisation key, their
// lower-case forms, the same documents with a wrong control character, and
// junk (wrong lengths, random characters, the empty string).

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const CIF_LETTERS = "JABCDEFGHI";
const CIF_KEYS = "ABCDEFGHJNPQRSUVW";
const CIF_LETTER_KEYS = "NPQRSW";
const JUNK_CHARACTERS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -./";

// mulberry32
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(49);
const randomInt = (max) => Math.floor(random() * max);
const pick = (items) => items[randomInt(items.length)];
const pad = (value, length) => String(value).padStart(length, "0");

function cifControl(digits) {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = Number(digits[i]);
    const doubled = digit * 2;
    sum += i % 2 === 0 ? (doubled > 9 ? doubled - 9 : doubled) : digit;
  }
  return (10 - (sum % 10)) % 10;
}

const generators = {
  dni() {
    const n = randomInt(100_000_000);
    return pad(n, 8) + DNI_LETTERS[n % 23];
  },
  klm() {
    const n = randomInt(10_000_000);
    return pick("KLM") + pad(n, 7) + DNI_LETTERS[n % 23];
  },
  nie() {
    const prefix = randomInt(3);
    const n = randomInt(10_000_000);
    return "XYZ"[prefix] + pad(n, 7) + DNI_LETTERS[(prefix * 1e7 + n) % 23];
  },
  oldNie() {
    const n = randomInt(10_000_000);
    return `X0${pad(n, 7)}${DNI_LETTERS[n % 23]}`;
  },
  cif() {
    const key = pick(CIF_KEYS);
    const digits = pad(randomInt(10_000_000), 7);
    const control = cifControl(digits);
    return (
      key +
      digits +
      (CIF_LETTER_KEYS.includes(key) ? CIF_LETTERS[control] : control)
    );
  },
};

/** Replaces the control character with a different, wrong one. */
function withWrongControl(value) {
  const last = value[value.length - 1];
  const pool = /\d/.test(last) ? "0123456789" : DNI_LETTERS;
  let other = last;
  while (other === last) other = pick(pool);
  return value.slice(0, -1) + other;
}

function junk() {
  const length = randomInt(13);
  let value = "";
  for (let i = 0; i < length; i++) value += pick(JUNK_CHARACTERS);
  return value;
}

const valid = [];
for (const [kind, count] of [
  ["dni", 150],
  ["klm", 50],
  ["nie", 100],
  ["oldNie", 20],
  ["cif", 180],
]) {
  for (let i = 0; i < count; i++) valid.push(generators[kind]());
}

export const INPUTS = [
  ...valid,
  ...valid.filter((_, i) => i % 5 === 0).map((value) => value.toLowerCase()),
  ...valid.filter((_, i) => i % 2 === 0).map(withWrongControl),
  ...Array.from({ length: 150 }, junk),
  "",
];

/** How the input set is made up, for the report. */
export const INPUT_MIX = {
  valid: valid.length,
  validLowerCase: Math.ceil(valid.length / 5),
  wrongControl: Math.ceil(valid.length / 2),
  junk: 151,
};
