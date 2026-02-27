import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { applyImportReplacements, interpolateTargetPath, readAliasContext, writeIfMissing } from "./helpers";
import type { RegistryItem } from "./types";

function detectPackageManager(cwd: string): "pnpm" | "npm" | "yarn" | "bun" {
  if (existsSync(resolve(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(resolve(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(resolve(cwd, "bun.lockb")) || existsSync(resolve(cwd, "bun.lock"))) return "bun";
  return "npm";
}

function installDepsIfNeeded(cwd: string, deps: string[]): void {
  if (deps.length === 0) return;

  const pm = detectPackageManager(cwd);
  const argsByPm: Record<typeof pm, string[]> = {
    pnpm: ["add", ...deps],
    npm: ["install", ...deps],
    yarn: ["add", ...deps],
    bun: ["add", ...deps],
  };

  console.log(`Installing dependencies via ${pm}: ${deps.join(", ")}`);
  const result = spawnSync(pm, argsByPm[pm], { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    console.log("Dependency install skipped/failed; you can install manually.");
  }
}

export async function applyRegistryItem(cwd: string, item: RegistryItem): Promise<void> {
  const { aliases, componentsRoot } = await readAliasContext(cwd);
  const templateCandidates = [resolve(__dirname, "../templates"), resolve(__dirname, "../../templates")];
  const templateRoot = templateCandidates.find((candidate) => existsSync(candidate));
  if (!templateRoot) {
    throw new Error("Template directory not found in package output. Reinstall @chris-lally/ui.");
  }

  for (const file of item.files) {
    const sourcePath = resolve(templateRoot, file.source);
    const source = await readFile(sourcePath, "utf8");

    const replaceImports = file.replaceImports
      ? Object.fromEntries(
          Object.entries(file.replaceImports).map(([from, to]) => [from, interpolateTargetPath(to, aliases)]),
        )
      : undefined;

    const transformed = applyImportReplacements(source, replaceImports);
    const targetPath = resolve(componentsRoot, file.target);
    const result = await writeIfMissing(targetPath, transformed);
    console.log(`${result === "created" ? "Created" : "Skipped"} ${targetPath}`);
  }

  installDepsIfNeeded(cwd, item.dependencies ?? []);
}
