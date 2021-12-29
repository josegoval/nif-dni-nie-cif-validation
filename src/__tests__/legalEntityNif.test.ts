import { isValidLegalEntityNif } from "..";

const testCases = [
  { text: "whatever", expect: false },
  { text: "Z9332057L", expect: false },
  { text: "X9864761S", expect: false },
  { text: "Y2541026T", expect: false },
  { text: "Y2541026A", expect: false },
  { text: "U2541026T", expect: false },
  { text: "22541026T", expect: false },
  { text: "9332057L", expect: false },
  { text: "04618341X", expect: false },
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
  // does not alloes old cases
  // { text: "K3841569T", expect: true },
  // { text: "L2841589T", expect: true },
  // { text: "M5275115T", expect: true },
  { text: "N1847858F", expect: true },
  { text: "P5925945G", expect: true },
  { text: "Q2106894E", expect: true },
  { text: "R3838940I", expect: true },
  { text: "S7345549E", expect: true },
  { text: "U07984792", expect: true },
  { text: "V23932064", expect: true },
  { text: "W7759996G", expect: true },
];

describe("legal enitity nif validation", () => {
  testCases.forEach((testCase, index) =>
    it(`test case ${index}`, () =>
      expect(isValidLegalEntityNif(testCase.text)).toBe(testCase.expect))
  );
});
