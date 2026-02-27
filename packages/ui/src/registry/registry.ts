import { fumadocsSdkLayoutItem } from "./items/fumadocs-sdk-layout";
import { brandingLogoWithBadgeItem } from "./items/branding-logo-with-badge";
import type { RegistryItem } from "./types";

const items: RegistryItem[] = [fumadocsSdkLayoutItem, brandingLogoWithBadgeItem];

export function listRegistryItems(): RegistryItem[] {
  return items;
}

export function findRegistryItem(id: string): RegistryItem | null {
  return items.find((item) => item.id === id) ?? null;
}
