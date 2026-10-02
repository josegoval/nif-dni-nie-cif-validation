// The "Random DNI / NIE / CIF" buttons of the live validator: the package's
// own generators, in a worker that the page starts on the first press, so
// they cost nothing on page load. Receives a type, answers with a number.
import {
  generateCif,
  generateDni,
  generateNie,
} from "nif-dni-nie-cif-validation/generate";

self.addEventListener("message", (event: MessageEvent<string>) => {
  const value =
    event.data === "NIE"
      ? generateNie()
      : event.data === "CIF"
        ? generateCif()
        : generateDni();
  self.postMessage(value);
});
