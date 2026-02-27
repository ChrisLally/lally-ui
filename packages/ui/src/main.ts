import { resolve } from "node:path";
import { applyRegistryItem } from "./registry/apply";
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

function printHelp() {
  console.log("lally-ui");
  console.log("");
  console.log("Usage:");
  console.log("  lally-ui <command> [options]");
  console.log("");
  console.log("Commands:");
  console.log("  init      Initialize UI project config");
  console.log("  add       Add UI components/templates");
  console.log("  registry  Export shadcn-compatible registry JSON");
  console.log("  doctor    Validate UI project setup");
  console.log("");
  console.log("Examples:");
  console.log("  lally-ui init");
  console.log("  lally-ui add fumadocs/sdk-layout");
  console.log("  lally-ui add branding/logo-with-badge");
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
    await applyRegistryItem(process.cwd(), itemEntry);
    return;
  }

  if (command === "doctor") {
    console.log("doctor: checks coming soon");
    return;
  }

  if (command === "registry") {
    const [subcommand, ...registryArgs] = rest;
    if (subcommand !== "export") {
      console.error(`Unknown registry command: ${subcommand ?? "(missing)"}`);
      console.error("Usage: lally-ui registry export [--out <dir>]");
      process.exitCode = 1;
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
