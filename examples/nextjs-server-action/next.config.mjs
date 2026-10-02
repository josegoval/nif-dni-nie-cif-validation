import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
export default {
  // The package is installed from examples/.pack, a folder outside this app
  // but inside the examples workspace: tell Next where the project root is,
  // or it infers it from the lockfile it finds (the repository has one too).
  turbopack: { root: fileURLToPath(new URL("..", import.meta.url)) },
};
