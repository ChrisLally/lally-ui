import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { listRegistryItems } from "./registry";
import type { AliasContext, RegistryItem } from "./types";
import { applyImportReplacements, interpolateTargetPath } from "./helpers";

const DEFAULT_ALIASES: AliasContext = {
  componentsAlias: "@/components",
  uiAlias: "@/components/ui",
  utilsAlias: "@/lib/utils",
};

type ExportedRegistryFile = {
  path: string;
  content: string;
  type: "registry:component" | "registry:lib" | "registry:hook" | "registry:page";
  target?: string;
};

type ExportedRegistryItem = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json";
  name: string;
  type: "registry:component";
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: ExportedRegistryFile[];
};

function titleCase(text: string): string {
  return text.replace(/[-_]/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function slugForItem(item: RegistryItem): string {
  return item.id.replaceAll("/", "-");
}

function fileTypeForTarget(target: string): ExportedRegistryFile["type"] {
  if (target.startsWith("app/")) return "registry:page";
  if (target.includes("/hooks/") || target.startsWith("hooks/")) return "registry:hook";
  if (target.includes("/lib/") || target.startsWith("lib/") || target.includes("/types/") || target.startsWith("types/")) {
    return "registry:lib";
  }
  return "registry:component";
}

async function readTemplateContent(templateRoot: string, item: RegistryItem): Promise<ExportedRegistryFile[]> {
  const files: ExportedRegistryFile[] = [];

  for (const file of item.files) {
    const sourcePath = resolve(templateRoot, file.source);
    if (!existsSync(sourcePath)) {
      throw new Error(`Missing template source for registry export: ${sourcePath}`);
    }

    const source = await readFile(sourcePath, "utf8");
    const replaceImports = file.replaceImports
      ? Object.fromEntries(
          Object.entries(file.replaceImports).map(([from, to]) => [from, interpolateTargetPath(to, DEFAULT_ALIASES)]),
        )
      : undefined;
    const content = applyImportReplacements(source, replaceImports);

    files.push({
      path: `registry/chris-lally/${slugForItem(item)}/${file.target}`,
      content,
      type: fileTypeForTarget(file.target),
      target: file.target,
    });
  }

  return files;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function exportRegistry(outDir: string): Promise<void> {
  const templateRoot = resolve(__dirname, "../../templates");
  if (!existsSync(templateRoot)) {
    throw new Error(`Missing templates directory: ${templateRoot}`);
  }

  const items = listRegistryItems();
  const exportedItems: Array<{
    name: string;
    type: "registry:component";
    title: string;
    description: string;
    dependencies?: string[];
    registryDependencies?: string[];
    files: Array<{ path: string; type: ExportedRegistryFile["type"]; target?: string }>;
  }> = [];

  for (const item of items) {
    const slug = slugForItem(item);
    const files = await readTemplateContent(templateRoot, item);

    const exportedItem: ExportedRegistryItem = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: slug,
      type: "registry:component",
      title: titleCase(slug),
      description: item.description,
      dependencies: item.dependencies,
      registryDependencies: item.registryDependencies,
      files,
    };

    await writeJson(resolve(outDir, `${slug}.json`), exportedItem);

    exportedItems.push({
      name: slug,
      type: "registry:component",
      title: titleCase(slug),
      description: item.description,
      dependencies: item.dependencies,
      registryDependencies: item.registryDependencies,
      files: files.map((file) => ({ path: file.path, type: file.type, target: file.target })),
    });
  }

  await writeJson(resolve(outDir, "registry.json"), {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "chris-lally",
    homepage: "https://github.com/ChrisLally/lally-ui",
    items: exportedItems,
  });

  console.log(`Exported ${items.length} registry item(s) to ${outDir}`);
}
