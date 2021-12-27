import { isValidDniLetter } from "./shared";

const NIE_REGEX = /^[XYZ][\d]{7}[TRWAGMYFPDXBNJZSQVHLCKET]$/i;

function replaceNieLetter(nie: string): string {
  let nieLetter: string | number = nie.charAt(0).toUpperCase();
  if (nieLetter === "X") nieLetter = 0;
  if (nieLetter === "Y") nieLetter = 1;
  if (nieLetter === "Z") nieLetter = 2;
  return nieLetter + nie.substring(1);
}

export function isValidNie(nie: string): boolean {
  return NIE_REGEX.test(nie) && isValidDniLetter(replaceNieLetter(nie));
}
