// The only use of the package: one boolean validator.
import { isValidDni } from "nif-dni-nie-cif-validation";

const input = document.querySelector("input");
const result = document.querySelector("output");
input.addEventListener("input", () => {
  result.textContent = isValidDni(input.value) ? "valid" : "invalid";
});
