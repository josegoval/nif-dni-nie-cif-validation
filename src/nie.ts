import { isValidDniLetter } from "./shared";

const NIE_REGEX = /^[XYZ][\d]{7}[TRWAGMYFPDXBNJZSQVHLCKET]$/i;

function replaceNieLetter(nie: string): string {
  let nieLetter: string | number = nie.charAt(0).toUpperCase();
  if (nieLetter === "X") return 0 + nie.substring(1);
  if (nieLetter === "Y") return 1 + nie.substring(1);
  if (nieLetter === "Z") return 2 + nie.substring(1);
  throw new Error("Invalid NIE letter");
}

export function isValidNie(nie: string): boolean {
  return NIE_REGEX.test(nie) && isValidDniLetter(replaceNieLetter(nie));
}
