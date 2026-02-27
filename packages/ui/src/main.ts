import { brandingComponents } from "@chris-lally/ui-branding/registry";

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
  console.log("  doctor    Validate UI project setup");
  console.log("");
  console.log("Examples:");
  console.log("  lally-ui init");
  console.log("  lally-ui add button");
  console.log("  lally-ui doctor");
  console.log("");
  console.log(`Available branding components: ${brandingComponents.join(", ")}`);
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
      console.error("Usage: lally-ui add <name>");
      process.exitCode = 1;
      return;
    }

    if (!brandingComponents.includes(item as (typeof brandingComponents)[number])) {
      console.error(`Unknown component: ${item}`);
      console.error(`Available: ${brandingComponents.join(", ")}`);
      process.exitCode = 1;
      return;
    }

    console.log(`add: ${item} (scaffold coming soon)`);
    return;
  }

  if (command === "doctor") {
    console.log("doctor: checks coming soon");
    return;
  }

  console.error(`Unknown command: ${command}`);
  console.log("");
  printHelp();
  process.exitCode = 1;
}
