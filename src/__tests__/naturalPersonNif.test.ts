import { isValidNaturalPersonNif } from "..";

const testCases = [
  { text: "whatever", expect: false },
  { text: "36698729K", expect: true },
  { text: "57655929N", expect: true },
  { text: "41989851Q", expect: true },
  { text: "K0867756N", expect: true },
  { text: "L3453453A", expect: true },
  { text: "M5566542J", expect: true },
  { text: "Z9332057L", expect: true },
  { text: "X9864761S", expect: true },
  { text: "Y2541026T", expect: true },
  { text: "Z9332057L", expect: true },
  { text: "41989851A", expect: false },
  { text: "4198981Q", expect: false },
  { text: "R7465845A", expect: false },
];

describe("natural person nif validation", () => {
  testCases.forEach((testCase) =>
    it(`test case ${testCase.text}`, () =>
      expect(isValidNaturalPersonNif(testCase.text)).toBe(testCase.expect))
  );
});
