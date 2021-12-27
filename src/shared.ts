export const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

export function isValidDniLetter(dni: string): boolean {
  const letterIndex = +dni.substring(0, 8) % 23;
  const letter = dni.slice(-1);
  return DNI_LETTERS.charAt(letterIndex) === letter;
}
