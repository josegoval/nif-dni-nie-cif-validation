import { fileURLToPath } from "node:url";

export default {
  mode: "production",
  target: "web",
  entry: "./src/index.js",
  output: {
    path: fileURLToPath(new URL("./dist", import.meta.url)),
    filename: "main.js",
    clean: true,
  },
  // Default optimizations on purpose: this is what an application gets.
  performance: { hints: false },
};
