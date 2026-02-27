export const brandingComponents = ["logo-with-badge"] as const;

export type BrandingComponentName = (typeof brandingComponents)[number];
