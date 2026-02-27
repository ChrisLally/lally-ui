import type { RegistryItem } from "../types";

export const brandingLogoWithBadgeItem: RegistryItem = {
  id: "branding/logo-with-badge",
  namespace: "branding",
  name: "logo-with-badge",
  description: "Brand header row with logo slot, title, and badge text.",
  files: [
    {
      source: "branding/components/branding/logo-with-badge.tsx",
      target: "components/branding/logo-with-badge.tsx",
    },
  ],
};
