"use client";

import { useActionState } from "react";
import type { FormState } from "../lib/check-nif.ts";
import { submitNif } from "./actions.ts";

const IDLE: FormState = { status: "idle" };

// A client component for useActionState only: the validation runs on the
// server, and the package never reaches the browser (a type import is erased).
export function NifForm() {
  const [state, action, pending] = useActionState(submitNif, IDLE);
  return (
    <form action={action}>
      <label>
        NIF, DNI, NIE or CIF
        <input
          name="nif"
          defaultValue={state.status === "idle" ? "" : state.value}
          autoComplete="off"
        />
      </label>
      <label>
        Error language
        <select
          name="language"
          defaultValue={state.status === "idle" ? "en" : state.language}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
        </select>
      </label>
      <button type="submit" disabled={pending}>
        Validate
      </button>
      {state.status === "valid" && (
        <p role="status">Valid: {state.normalized}</p>
      )}
      {state.status === "invalid" && (
        <p role="alert">
          {state.message} ({state.code}, {state.rule})
        </p>
      )}
    </form>
  );
}
