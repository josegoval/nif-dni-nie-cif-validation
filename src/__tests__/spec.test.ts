import { isValidCif, isValidDni, isValidNie, isValidNif } from "..";

// Test values from the official rules spec (issue #36), checked against the
// v1 validators. Every name starts with the rule ID it exercises.

type Case = {
  value: string;
  rule: string;
  validate: (value: string) => boolean;
  why?: string;
};

const valid: Case[] = [
  { value: "12345678Z", rule: "DNI-2", validate: isValidDni },
  { value: "01234567L", rule: "DNI-1", validate: isValidDni, why: "leading zero" },
  { value: "00000008P", rule: "DNI-1", validate: isValidDni, why: "leading zeros" },
  { value: "X1234567L", rule: "NIE-2", validate: isValidNie, why: "X -> 0" },
  { value: "Y1234567X", rule: "NIE-2", validate: isValidNie, why: "Y -> 1" },
  { value: "Z1234567R", rule: "NIE-2", validate: isValidNie, why: "Z -> 2" },
  { value: "X01234567L", rule: "NIE-3", validate: isValidNie, why: "old 10-character form" },
  { value: "K1234567L", rule: "KLM-2", validate: isValidDni },
  { value: "L1234567L", rule: "KLM-2", validate: isValidDni },
  { value: "M1234567L", rule: "KLM-2", validate: isValidDni },
  { value: "A58818501", rule: "CIF-3", validate: isValidCif, why: "A takes a digit" },
  { value: "B12345674", rule: "CIF-3", validate: isValidCif, why: "B takes a digit" },
  { value: "B00123455", rule: "CIF-3", validate: isValidCif, why: "no 00 rule" },
  { value: "P2807900B", rule: "CIF-4", validate: isValidCif, why: "Ayuntamiento de Madrid" },
  { value: "Q2826000H", rule: "CIF-4", validate: isValidCif, why: "AEAT" },
  { value: "N1234567D", rule: "CIF-3", validate: isValidCif, why: "N takes a letter" },
  { value: "W1234567D", rule: "CIF-3", validate: isValidCif, why: "W takes a letter" },
];

const invalid: Case[] = [
  { value: "12345678A", rule: "DNI-2", validate: isValidDni, why: "wrong letter" },
  { value: "12345678I", rule: "DNI-3", validate: isValidDni, why: "I is not in the table" },
  { value: "12345678O", rule: "DNI-3", validate: isValidDni, why: "O is not in the table" },
  { value: "12345678U", rule: "DNI-3", validate: isValidDni, why: "U is not in the table" },
  { value: "Y1234567L", rule: "NIE-2", validate: isValidNie, why: "the prefix changes the letter" },
  { value: "X11234567L", rule: "NIE-3", validate: isValidNie, why: "only a leading 0 may be dropped" },
  { value: "K1234567A", rule: "KLM-2", validate: isValidDni, why: "wrong letter" },
  { value: "T12345678", rule: "NIE-1", validate: isValidNie, why: "no official T prefix" },
  { value: "123456789", rule: "DNI-1", validate: isValidDni, why: "the check character must be a letter" },
  { value: "Q12345674", rule: "CIF-3", validate: isValidCif, why: "Q needs a letter" },
  { value: "N12345674", rule: "CIF-3", validate: isValidCif, why: "N needs a letter" },
  { value: "B0012345E", rule: "CIF-3", validate: isValidCif, why: "B needs a digit; the 00 rule is folklore" },
  { value: "I1234567D", rule: "CIF-2", validate: isValidCif, why: "I is not an entity key" },
  { value: "K1234567D", rule: "CIF-2", validate: isValidCif, why: "K is a natural-person prefix" },
  { value: "X1234567D", rule: "CIF-2", validate: isValidCif, why: "X is a natural-person prefix" },
  { value: "B1234567", rule: "CIF-1", validate: isValidCif, why: "too short" },
  { value: "B123456745", rule: "CIF-1", validate: isValidCif, why: "too long" },
  { value: "B12345675", rule: "CIF-4", validate: isValidCif, why: "wrong control" },
  { value: "B1234567D", rule: "CIF-3", validate: isValidCif, why: "B needs a digit" },
];

const label = ({ value, why }: Case) => (why ? `${value} (${why})` : value);

describe("SPEC test values: valid", () => {
  valid.forEach((c) =>
    it(`${c.rule}: ${label(c)} is valid`, () => {
      expect(c.validate(c.value)).toBe(true);
      expect(isValidNif(c.value)).toBe(true);
    })
  );
});

describe("SPEC test values: invalid", () => {
  invalid.forEach((c) =>
    it(`${c.rule}: ${label(c)} is invalid`, () => {
      expect(c.validate(c.value)).toBe(false);
      expect(isValidNif(c.value)).toBe(false);
    })
  );
});

describe("SPEC test values: v1 differences, pending v2 (#38)", () => {
  // TODO(v2, #38): C D F G J U V are digit-only per CIF-3, so G1234567D
  // becomes invalid (valid only with cifControl: "lenient").
  it("CIF-3: G1234567D is still valid in v1 (lenient until v2)", () =>
    expect(isValidCif("G1234567D")).toBe(true));
});
