import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  outExtension: ({ format }) => ({
    js: format === "esm" ? ".esm.js" : ".cjs.js",
  }),
  dts: true,
  sourcemap: true,
  clean: true,
});
