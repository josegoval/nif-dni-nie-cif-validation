// Run by `pnpm check` after `webpack`: fails if dist/ holds a message or a
// language of the package, or if it doesn't hold isValidDni.
import { fileURLToPath } from "node:url";
import { javascriptFiles, runCheck } from "../shared/bundle-check.mjs";

await runCheck({
  label: "webpack",
  files: javascriptFiles(fileURLToPath(new URL("./dist", import.meta.url))),
});
