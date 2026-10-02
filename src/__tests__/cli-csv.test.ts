/**
 * The CSV reader of the CLI's `check` command (src/cli/csv.ts): RFC 4180,
 * what spreadsheets write (CRLF, a byte order mark, `;`), and the lenient
 * cases.
 */
import { describe, expect, it } from "vitest";
import { CsvError, parseCsv } from "../cli/csv";

const csv = (text: string, delimiter = ",") => parseCsv(text, delimiter);

describe("parseCsv", () => {
  it("splits records and fields", () => {
    expect(csv("a,b,c\n1,2,3\n")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("reads the last record without a line break, and adds none after one", () => {
    expect(csv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(csv("a\n")).toEqual([["a"]]);
    expect(csv("")).toEqual([]);
  });

  it("accepts CRLF, LF and CR line breaks", () => {
    expect(csv("a\r\nb\nc\rd\r\n")).toEqual([["a"], ["b"], ["c"], ["d"]]);
  });

  it("ignores a byte order mark at the start only", () => {
    expect(csv("﻿nif,x\n﻿1,2")).toEqual([
      ["nif", "x"],
      ["﻿1", "2"],
    ]);
  });

  it("keeps empty fields, also at the end of a record", () => {
    expect(csv("a,,b\n,\n,x,")).toEqual([
      ["a", "", "b"],
      ["", ""],
      ["", "x", ""],
    ]);
  });

  it("gives a blank line as one empty field, so row numbers match a spreadsheet", () => {
    expect(csv("a\n\nb\n\n")).toEqual([["a"], [""], ["b"], [""]]);
    expect(csv("\n")).toEqual([[""]]);
  });

  it("reads quoted fields with the delimiter, line breaks and doubled quotes", () => {
    expect(
      csv('"Acme, S.L.","line 1\r\nline 2","say ""hi""",""\n"",x')
    ).toEqual([
      ["Acme, S.L.", "line 1\r\nline 2", 'say "hi"', ""],
      ["", "x"],
    ]);
  });

  it("is lenient where RFC 4180 has no answer", () => {
    // A quote inside an unquoted field is kept.
    expect(csv('ab"c,d"\n')).toEqual([['ab"c', 'd"']]);
    // Text after a closing quote is added to the field.
    expect(csv('"ab"c,d')).toEqual([["abc", "d"]]);
    // White space before a quote: the field is not quoted.
    expect(csv(' "a,b"')).toEqual([[' "a', 'b"']]);
  });

  it("throws a CsvError, with the row, for a quoted field that is never closed", () => {
    expect(() => csv('a\nb\n"c,d\n')).toThrow(
      new CsvError("row 3: a quoted field is never closed")
    );
    expect(() => csv('"say ""hi""')).toThrow(CsvError);
  });

  it("takes another delimiter", () => {
    expect(csv('name;nif\n"García; Ana";12345678Z', ";")).toEqual([
      ["name", "nif"],
      ["García; Ana", "12345678Z"],
    ]);
    expect(csv("a\tb,c", "\t")).toEqual([["a", "b,c"]]);
  });
});
