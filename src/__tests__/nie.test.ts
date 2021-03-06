import { isValidNie } from "..";

const testCases = [
  { text: "Z9332057L", expect: true },
  { text: "X9864761S", expect: true },
  { text: "Y2541026T", expect: true },
  { text: "whatever", expect: false },
  { text: "Y2541026A", expect: false },
  { text: "U2541026T", expect: false },
  { text: "22541026T", expect: false },
  { text: "9332057L", expect: false },
  { text: "04618341X", expect: false },
  { text: "R7465845A", expect: false },
];

describe("nie validation", () => {
  testCases.forEach((testCase) =>
    it(`test case ${testCase.text}`, () =>
      expect(isValidNie(testCase.text)).toBe(testCase.expect))
  );
});
