import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CustomerForm } from "./CustomerForm";

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root");

createRoot(root).render(
  <StrictMode>
    <CustomerForm />
  </StrictMode>
);
