import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    registry: "src/registry.ts",
  },
  format: ["cjs"],
  platform: "neutral",
  target: "es2020",
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  external: ["react", "react-dom"],
});
