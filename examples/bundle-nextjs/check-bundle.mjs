// Run by `pnpm check` after `next build`: fails if the client JavaScript holds
// a message or a language of the package, or if none of it holds isValidDni.
//
// `.next/static` is what the browser downloads (the files of `.next/server`
// stay on the server, where prerendering uses the component too). Every file
// there is scanned, not only the chunk with the validator, so a message that
// ended up in any other chunk fails the check as well.
import { fileURLToPath } from "node:url";
import { javascriptFiles, runCheck } from "../shared/bundle-check.mjs";

await runCheck({
  label: "nextjs",
  files: javascriptFiles(
    fileURLToPath(new URL("./.next/static", import.meta.url))
  ),
});
