import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs", "iife"],
  globalName: "DynamicFormsSDK",
  outExtension: ({ format }) => ({
    js: format === "esm" ? ".esm.js" : format === "cjs" ? ".cjs.js" : ".global.js",
  }),
  dts: true,
  sourcemap: true,
  clean: true,
});
