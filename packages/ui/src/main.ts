import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { exportRegistry } from "./registry/export";
import { findRegistryItem, listRegistryItems } from "./registry/registry";

type CliArgs = {
  command: string | undefined;
  rest: string[];
};

function parseArgs(argv: string[]): CliArgs {
  const [command, ...rest] = argv;
  return { command, rest };
}

type ComponentsConfig = {
  registries?: Record<string, string>;
};

const DEFAULT_REGISTRY_URL = "https://raw.githubusercontent.com/ChrisLally/lally-ui/main/packages/ui/public/r/{name}.json";

function detectPackageManager(cwd: string): "pnpm" | "yarn" | "bun" | "npm" {
  if (existsSync(resolve(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(resolve(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(resolve(cwd, "bun.lockb")) || existsSync(resolve(cwd, "bun.lock"))) return "bun";
  return "npm";
}

function toRegistryItemName(itemId: string): string {
  return itemId.replaceAll("/", "-");
}

function runShadcnAdd(cwd: string, registryItem: string, extraArgs: string[]): number {
  const pm = detectPackageManager(cwd);

  if (pm === "pnpm") {
    return spawnSync("pnpm", ["dlx", "shadcn@latest", "add", registryItem, ...extraArgs], {
      cwd,
      stdio: "inherit",
    }).status ?? 1;
  }

  if (pm === "yarn") {
    return spawnSync("yarn", ["dlx", "shadcn@latest", "add", registryItem, ...extraArgs], {
      cwd,
      stdio: "inherit",
    }).status ?? 1;
  }

  if (pm === "bun") {
    return spawnSync("bunx", ["shadcn@latest", "add", registryItem, ...extraArgs], {
      cwd,
      stdio: "inherit",
    }).status ?? 1;
  }

  return spawnSync("npx", ["--yes", "shadcn@latest", "add", registryItem, ...extraArgs], {
    cwd,
    stdio: "inherit",
  }).status ?? 1;
}

function connectCommandHint(cwd: string): string {
  const pm = detectPackageManager(cwd);
  if (pm === "pnpm") return "pnpm dlx @chris-lally/ui@alpha registry connect";
  if (pm === "yarn") return "yarn dlx @chris-lally/ui@alpha registry connect";
  if (pm === "bun") return "bunx @chris-lally/ui@alpha registry connect";
  return "npx @chris-lally/ui@alpha registry connect";
}

async function connectRegistry(cwd: string, registryUrl: string): Promise<void> {
  const componentsPath = resolve(cwd, "components.json");
  if (!existsSync(componentsPath)) {
    throw new Error("Missing components.json in current directory. Run shadcn init first.");
  }

  const raw = await readFile(componentsPath, "utf8");
  const parsed = JSON.parse(raw) as ComponentsConfig;
  const registries = parsed.registries ?? {};
  registries["@chris-lally"] = registryUrl;
  parsed.registries = registries;
  await writeFile(componentsPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  console.log(`Configured @chris-lally registry in ${componentsPath}`);
}

async function hasConnectedRegistry(cwd: string): Promise<boolean> {
  const componentsPath = resolve(cwd, "components.json");
  if (!existsSync(componentsPath)) return false;
  const raw = await readFile(componentsPath, "utf8");
  const parsed = JSON.parse(raw) as ComponentsConfig;
  return Boolean(parsed.registries?.["@chris-lally"]);
}

function printHelp() {
  console.log("lally-ui");
  console.log("");
  console.log("Usage:");
  console.log("  lally-ui <command> [options]");
  console.log("");
  console.log("Commands:");
  console.log("  init      Initialize UI project config");
  console.log("  add       Add UI components/templates");
  console.log("  registry  Manage registry export/connect commands");
  console.log("  doctor    Validate UI project setup");
  console.log("");
  console.log("Examples:");
  console.log("  lally-ui init");
  console.log("  lally-ui add fumadocs/sdk-layout");
  console.log("  lally-ui add branding/logo-with-badge");
  console.log("  lally-ui registry connect");
  console.log("  lally-ui registry connect --url https://example.com/r/{name}.json");
  console.log("  lally-ui registry export --out public/r");
  console.log("  lally-ui doctor");
  console.log("");
  console.log(`Available items:`);
  const byNamespace = new Map<string, string[]>();
  for (const item of listRegistryItems()) {
    const list = byNamespace.get(item.namespace) ?? [];
    list.push(item.name);
    byNamespace.set(item.namespace, list);
  }
  for (const [namespace, names] of byNamespace.entries()) {
    console.log(`  ${namespace}/${names.join(`, ${namespace}/`)}`);
  }
}

export async function runCli(argv: string[]) {
  const { command, rest } = parseArgs(argv);

  if (!command || command === "--help" || command === "-h" || command === "help") {
    printHelp();
    return;
  }

  if (command === "init") {
    console.log("init: scaffold coming soon");
    return;
  }

  if (command === "add") {
    const item = rest[0];
    if (!item) {
      console.error("Missing component/template name.");
      console.error("Usage: lally-ui add <namespace/item>");
      process.exitCode = 1;
      return;
    }

    const [namespace, name] = item.split("/");
    if (!namespace || !name) {
      console.error("Invalid item format.");
      console.error("Use <namespace/item>, for example: fumadocs/sdk-layout");
      process.exitCode = 1;
      return;
    }

    const supportedNamespaces = [...new Set(listRegistryItems().map((entry) => entry.namespace))];
    if (!supportedNamespaces.includes(namespace)) {
      console.error(`Unknown namespace: ${namespace}`);
      console.error(`Available namespaces: ${supportedNamespaces.join(", ")}`);
      process.exitCode = 1;
      return;
    }

    const itemId = `${namespace}/${name}`;
    const itemEntry = findRegistryItem(itemId);
    if (!itemEntry) {
      const available = listRegistryItems()
        .filter((entry) => entry.namespace === namespace)
        .map((entry) => entry.name);
      console.error(`Unknown ${namespace} item: ${name}`);
      console.error(`Available: ${available.join(", ")}`);
      process.exitCode = 1;
      return;
    }
    if (!(await hasConnectedRegistry(process.cwd()))) {
      console.error("Missing @chris-lally registry in components.json.");
      console.error(`Run: ${connectCommandHint(process.cwd())}`);
      process.exitCode = 1;
      return;
    }
    const registryItemName = toRegistryItemName(itemEntry.id);
    const registryRef = `@chris-lally/${registryItemName}`;
    const exitCode = runShadcnAdd(process.cwd(), registryRef, rest.slice(1));
    if (exitCode !== 0) {
      process.exitCode = exitCode;
    }
    return;
  }

  if (command === "doctor") {
    console.log("doctor: checks coming soon");
    return;
  }

  if (command === "registry") {
    const [subcommand, ...registryArgs] = rest;
    if (!subcommand || (subcommand !== "export" && subcommand !== "connect")) {
      console.error(`Unknown registry command: ${subcommand ?? "(missing)"}`);
      console.error("Usage:");
      console.error("  lally-ui registry export [--out <dir>]");
      console.error("  lally-ui registry connect [--url <registry-url>]");
      process.exitCode = 1;
      return;
    }

    if (subcommand === "connect") {
      let registryUrl = DEFAULT_REGISTRY_URL;
      for (let index = 0; index < registryArgs.length; index += 1) {
        if (registryArgs[index] === "--url" && registryArgs[index + 1]) {
          registryUrl = registryArgs[index + 1];
          index += 1;
        }
      }
      await connectRegistry(process.cwd(), registryUrl);
      return;
    }

    let outDir = "public/r";
    for (let index = 0; index < registryArgs.length; index += 1) {
      if (registryArgs[index] === "--out" && registryArgs[index + 1]) {
        outDir = registryArgs[index + 1];
        index += 1;
      }
    }
    await exportRegistry(resolve(process.cwd(), outDir));
    return;
  }

  console.error(`Unknown command: ${command}`);
  console.log("");
  printHelp();
  process.exitCode = 1;
}
