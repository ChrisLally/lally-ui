export type RegistryFile = {
  source: string;
  target: string;
  replaceImports?: Record<string, string>;
};

export type RegistryItem = {
  id: string;
  namespace: string;
  name: string;
  description: string;
  dependencies?: string[];
  files: RegistryFile[];
};

export type ComponentsConfig = {
  aliases?: {
    components?: string;
    ui?: string;
    utils?: string;
  };
};

export type AliasContext = {
  componentsAlias: string;
  uiAlias: string;
  utilsAlias: string;
};
