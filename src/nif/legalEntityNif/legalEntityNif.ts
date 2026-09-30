export const LEGAL_ENTITY_CONTROL_LETTERS = "JABCDEFGHI";
export const LEGAL_ENTITY_NIF_REGEX = /^[ABCDEFGHJNPQRSUVW][\d]{7}[\dA-J]$/i;
// CIF-3 (AEAT D.I.T. 2008): the control type depends only on the
// organisation key. There is no "number starts with 00" rule.
const HAS_CONTROL_LETTER_REGEX = /^[PQRSW]/;
const HAS_CONTROL_NUMBER_REGEX = /^[ABEH]/;

function sumEvenPositions(legalEntityNumbers: string): number {
  return (
    +legalEntityNumbers[1] + +legalEntityNumbers[3] + +legalEntityNumbers[5]
  );
}

function calculateOddPosition(num: number): number {
  const doubledNum = num * 2;
  if (doubledNum < 10) return doubledNum;

  const splittedNum = `${doubledNum}`.split("");
  return +splittedNum[0] + +splittedNum[1];
}

function calculateOddPositions(legalEntityNumbers: string): number {
  return (
    calculateOddPosition(+legalEntityNumbers[0]) +
    calculateOddPosition(+legalEntityNumbers[2]) +
    calculateOddPosition(+legalEntityNumbers[4]) +
    calculateOddPosition(+legalEntityNumbers[6])
  );
}

function getLegalEntityNumbers(legalEntityNif: string): string {
  return legalEntityNif.slice(1, -1);
}

function getLegalEntityNifControlNumber(nif: string): number {
  const legalEntityNumbers = getLegalEntityNumbers(nif);
  const keyNumber = +`${
    sumEvenPositions(legalEntityNumbers) +
    calculateOddPositions(legalEntityNumbers)
  }`.slice(-1);
  return keyNumber === 0 ? keyNumber : 10 - keyNumber;
}

function isControlCodeLetter(legalEntityNif: string): boolean {
  return HAS_CONTROL_LETTER_REGEX.test(legalEntityNif);
}

function isControlCodeNumber(legalEntityNif: string): boolean {
  return HAS_CONTROL_NUMBER_REGEX.test(legalEntityNif);
}

/**
 * Checks the control code of a legal entity NIF that is already upper case.
 */
function hasValidControlCode(legalEntityNif: string): boolean {
  const controlCodeToVerify = legalEntityNif.slice(-1);
  // CIF-4: control arithmetic (convention, no official text).
  const controlNumber = getLegalEntityNifControlNumber(legalEntityNif);

  // CIF-3 (AEAT D.I.T. 2008): these keys take a letter control.
  if (isControlCodeLetter(legalEntityNif))
    return LEGAL_ENTITY_CONTROL_LETTERS[controlNumber] === controlCodeToVerify;

  // CIF-3 (AEAT D.I.T. 2008): these keys take a digit control.
  if (isControlCodeNumber(legalEntityNif))
    return controlNumber === +controlCodeToVerify;

  return isNaN(+controlCodeToVerify)
    ? LEGAL_ENTITY_CONTROL_LETTERS[controlNumber] === controlCodeToVerify
    : controlNumber === +controlCodeToVerify;
}

/**
 * Checks if the legal entity nif control code (letter or number)
 * provided is valid.
 *
 * @WARNING It does not check the `LEGAL_ENITY_NIF_REGEX`.
 * @throws May throw an error if the string is not long enough (9 characters)
 * @param legalEntityNif
 * @returns
 */
export function isValidLegalEntityNifControlCode(
  legalEntityNif: string
): boolean {
  // NORM-1: accept lower-case input. Upper-case once, check that value.
  return hasValidControlCode(legalEntityNif.toUpperCase());
}

/**
 * Checks if the legalEntityNif provided is valid.
 *
 * It does not include old K, L and M formats.
 * @param legalEntityNif
 * @returns true for valid input and false for invalid input.
 */
export function isValidLegalEntityNif(legalEntityNif: string): boolean {
  // CIF-1 / CIF-2. The /i regex runs on the raw input: without the `u` flag
  // it only folds ASCII letters, so look-alikes that toUpperCase() maps to
  // ASCII (U+0131 "ı" -> "I", U+017F "ſ" -> "S") stay invalid.
  if (!LEGAL_ENTITY_NIF_REGEX.test(legalEntityNif)) return false;
  // NORM-1: accept lower-case input. Upper-case once, check that value.
  return hasValidControlCode(legalEntityNif.toUpperCase());
}
