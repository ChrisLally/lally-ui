import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "bin/lally-ui": "src/bin/lally-ui.ts",
  },
  format: ["cjs"],
  platform: "node",
  target: "node20",
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  noExternal: ["@chris-lally/ui-branding"],
});
