import { isValidDniLetter } from "./shared";

const DNI_REGEX = /^[\d]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;

export function isValidDni(dni: string): boolean {
  return DNI_REGEX.test(dni) && isValidDniLetter(dni);
}
