"use client";

// The only use of the package: one boolean validator, in a client component.
import { isValidDni } from "nif-dni-nie-cif-validation";
import { useState } from "react";

export function Checker() {
  const [value, setValue] = useState("");
  return (
    <label>
      DNI
      <input value={value} onChange={(event) => setValue(event.target.value)} />
      <output>{isValidDni(value) ? "valid" : "invalid"}</output>
    </label>
  );
}
