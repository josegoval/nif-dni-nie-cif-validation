import { isValidNif } from "..";

const testCases = [
  { text: "whatever", expect: false },
  { text: "9332057L", expect: false },
  { text: "36698729K", expect: true },
  { text: "57655929N", expect: true },
  { text: "41989851Q", expect: true },
  { text: "K0867756N", expect: true },
  { text: "L3453453A", expect: true },
  { text: "M5566542J", expect: true },
  { text: "Z9332057L", expect: true },
  { text: "X9864761S", expect: true },
  { text: "Y2541026T", expect: true },
  { text: "A07727886", expect: true },
  { text: "B91662627", expect: true },
  { text: "B72327000", expect: true },
  { text: "C90684846", expect: true },
  { text: "D78118080", expect: true },
  { text: "E05070164", expect: true },
  { text: "F49420151", expect: true },
  { text: "G21111513", expect: true },
  { text: "H37648599", expect: true },
  { text: "J34790493", expect: true },
  { text: "N1847858F", expect: true },
  { text: "P5925945G", expect: true },
  { text: "Q2106894E", expect: true },
  { text: "R3838940I", expect: true },
  { text: "S7345549E", expect: true },
  { text: "U07984792", expect: true },
  { text: "V23932064", expect: true },
  { text: "W7759996G", expect: true },
];

describe("nif validation", () => {
  testCases.forEach((testCase) =>
    it(`test case ${testCase.text}`, () =>
      expect(isValidNif(testCase.text)).toBe(testCase.expect))
  );
});
