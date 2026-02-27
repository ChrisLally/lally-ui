import type { RegistryItem } from "../types";

export const fumadocsSdkLayoutItem: RegistryItem = {
  id: "fumadocs/sdk-layout",
  namespace: "fumadocs",
  name: "sdk-layout",
  description: "Interactive SDK docs layout components for Fumadocs pages.",
  dependencies: ["fumadocs-ui", "json5"],
  registryDependencies: ["combobox"],
  files: [
    {
      source: "fumadocs/blocks/sdk-layout/index.ts",
      target: "sdk-layout/index.ts",
    },
    {
      source: "fumadocs/blocks/sdk-layout/types/sdk-function-page-types.ts",
      target: "sdk-layout/types/sdk-function-page-types.ts",
    },
    {
      source: "fumadocs/blocks/sdk-layout/sections/sdk-section.tsx",
      target: "sdk-layout/sections/sdk-section.tsx",
      replaceImports: {
        "../../../lib/cn": "{utilsAlias}",
      },
    },
    {
      source: "fumadocs/blocks/sdk-layout/interactive/sdk-function-page-interactive.tsx",
      target: "sdk-layout/interactive/sdk-function-page-interactive.tsx",
      replaceImports: {
        "../../../components/shared/package-manager-tabs": "{componentsAlias}/mdx/package-manager-tabs",
        "@/components/ui/combobox": "{uiAlias}/combobox",
      },
    },
    {
      source: "fumadocs/components/mdx/package-manager-tabs.tsx",
      target: "mdx/package-manager-tabs.tsx",
    },
  ],
};
