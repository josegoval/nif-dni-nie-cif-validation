const LEGAL_ENTITY_LETTERS = "JABCDEFGHI";
const LEGAL_ENTITY_NIF_REGEX = /^[A-J][\d]{7}[\dA-J]$/i;

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

function isValidLegalEntityNifControlCode(legalEntityNif: string): boolean {
  const legalEntityNumbers = getLegalEntityNumbers(legalEntityNif);
  const keyNumber = +`${
    sumEvenPositions(legalEntityNumbers) +
    calculateOddPositions(legalEntityNumbers)
  }`.slice(-1);
  const controlNumber = keyNumber === 0 ? keyNumber : 10 - keyNumber;
  const controlCodeToVerify = legalEntityNif.slice(-1);
  return isNaN(+controlCodeToVerify)
    ? LEGAL_ENTITY_LETTERS[controlNumber] === controlCodeToVerify
    : controlNumber === +controlCodeToVerify;
}

export function isValidLegalEntityNif(legalEntityNif: string): boolean {
  return (
    LEGAL_ENTITY_NIF_REGEX.test(legalEntityNif) &&
    isValidLegalEntityNifControlCode(legalEntityNif)
  );
}
