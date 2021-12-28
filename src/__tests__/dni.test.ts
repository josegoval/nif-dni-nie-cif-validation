import { isValidDni } from "..";

const testCases = [
  { text: "whatever", expect: false },
  { text: "36698729K", expect: true },
  { text: "57655929N", expect: true },
  { text: "41989851Q", expect: true },
  { text: "41989851A", expect: false },
  { text: "4198981Q", expect: false },
  { text: "Z9332057L", expect: false },
  { text: "R7465845A", expect: false },
];

describe("dni validation", () => {
  testCases.forEach((testCase, index) =>
    it(`test case ${index}`, () =>
      expect(isValidDni(testCase.text)).toBe(testCase.expect))
  );
});
