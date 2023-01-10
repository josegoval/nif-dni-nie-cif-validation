export declare const NIE_REGEX: RegExp;
/**
 * Returns a new string with the nie letter (XYZ) replaced.
 * However it will throw an error if the first character is not X, Y or Z.
 * @throws Invalid NIE letter error
 * @param nie
 * @returns A new string with the nie letter (XYZ) replaced.
 */
export declare function replaceNieLetter(nie: string): string;
/**
 * Checks if the given nie is valid.
 * @param nie
 * @returns true for valid input and false for invalid input.
 */
export declare function isValidNie(nie: string): boolean;
