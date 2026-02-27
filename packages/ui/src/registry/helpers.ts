import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { AliasContext, ComponentsConfig } from "./types";

export function resolveAliasPath(alias: string, cwd: string): string {
  if (alias.startsWith("@/")) {
    return resolve(cwd, "src", alias.slice(2));
  }
  if (alias.startsWith("./") || alias.startsWith("../")) {
    return resolve(cwd, alias);
  }
  return resolve(cwd, alias);
}

export async function writeIfMissing(path: string, content: string): Promise<"created" | "skipped"> {
  if (existsSync(path)) return "skipped";
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
  return "created";
}

export function applyImportReplacements(content: string, replaceImports: Record<string, string> | undefined): string {
  if (!replaceImports) return content;
  let next = content;
  for (const [from, to] of Object.entries(replaceImports)) {
    next = next.replace(new RegExp(`from ['\"]${from}['\"]`, "g"), `from '${to}'`);
  }
  return next;
}

export async function readAliasContext(cwd: string): Promise<{ aliases: AliasContext; componentsRoot: string }> {
  const componentsJsonPath = resolve(cwd, "components.json");
  if (!existsSync(componentsJsonPath)) {
    throw new Error("Missing components.json in current directory. Run shadcn init first.");
  }

  const rawConfig = await readFile(componentsJsonPath, "utf8");
  const config = JSON.parse(rawConfig) as ComponentsConfig;

  const aliases: AliasContext = {
    componentsAlias: config.aliases?.components ?? "@/components",
    uiAlias: config.aliases?.ui ?? "@/components/ui",
    utilsAlias: config.aliases?.utils ?? "@/lib/utils",
  };

  return {
    aliases,
    componentsRoot: resolveAliasPath(aliases.componentsAlias, cwd),
  };
}

export function interpolateTargetPath(template: string, aliases: AliasContext): string {
  return template
    .replaceAll("{componentsAlias}", aliases.componentsAlias)
    .replaceAll("{uiAlias}", aliases.uiAlias)
    .replaceAll("{utilsAlias}", aliases.utilsAlias);
}
