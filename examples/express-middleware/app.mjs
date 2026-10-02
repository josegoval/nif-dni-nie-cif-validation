import express from "express";
import { validateNif } from "./nif-middleware.mjs";

export function createApp() {
  const app = express();
  app.use(express.json());

  // A person: a DNI or a NIE only.
  app.post(
    "/customers",
    validateNif("nif", { types: ["DNI", "NIE"] }),
    (req, res) => {
      res.status(201).json({ nif: req.body.nif, type: req.nif.type });
    }
  );

  // A company: its CIF, and what kind of entity it is, in the request's language.
  app.post("/companies", validateNif("cif", { types: ["CIF"] }), (req, res) => {
    res.status(201).json({
      cif: req.body.cif,
      entity: req.nif.meta.orgDescription,
    });
  });

  return app;
}
