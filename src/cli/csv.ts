/**
 * The CSV reader of the `check` command (src/cli/main.ts). Not part of the
 * library's API: the command line interface has no entry point in the
 * `exports` map.
 *
 * It follows RFC 4180, with the delimiter as an option (a Spanish
 * spreadsheet saves CSV with `;`), and accepts what spreadsheets write:
 *
 * - Fields are separated by the delimiter, records by CRLF, LF or CR.
 * - A field in double quotes may contain the delimiter, line breaks and
 *   doubled quotes (`""` is one `"`).
 * - A byte order mark at the start is ignored (Excel writes one in UTF-8).
 * - A line break at the end of the file doesn't start another record.
 *
 * Where RFC 4180 has no answer it is lenient and never guesses: a quote
 * inside an unquoted field is kept as it is, and text after a closing quote
 * is added to the field. Only a quoted field that is never closed is an
 * error, since the rest of the file would be one field.
 */

/** A file that isn't CSV: a quoted field that is never closed. */
export class CsvError extends Error {}

const QUOTE = '"';

/**
 * Splits CSV text into records, each an array of fields. A blank line is a
 * record with one empty field (`[""]`), so the record at index `i` is row
 * `i + 1` of a spreadsheet even when the file has blank lines or line
 * breaks inside quoted fields.
 *
 * @param text The content of the file.
 * @param delimiter The field separator, one character other than a quote or
 * a line break (the caller checks it).
 * @returns The records, in order.
 * @throws {CsvError} When a quoted field is never closed.
 */
export function parseCsv(text: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  // At the start of a field, where a quote opens a quoted field.
  let atFieldStart = true;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  while (i < text.length) {
    const c = text.charAt(i);
    if (atFieldStart && c === QUOTE) {
      const row = records.length + 1;
      i++;
      for (;;) {
        if (i >= text.length)
          throw new CsvError(`row ${row}: a quoted field is never closed`);
        const q = text.charAt(i);
        i++;
        if (q !== QUOTE) field += q;
        else if (text.charAt(i) === QUOTE) {
          field += QUOTE;
          i++;
        } else break;
      }
      atFieldStart = false;
    } else if (c === delimiter) {
      record.push(field);
      field = "";
      atFieldStart = true;
      i++;
    } else if (c === "\n" || c === "\r") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
      atFieldStart = true;
      i += c === "\r" && text.charAt(i + 1) === "\n" ? 2 : 1;
    } else {
      field += c;
      atFieldStart = false;
      i++;
    }
  }
  // The last record, unless the file ends with a line break (or is empty).
  if (!atFieldStart || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}
