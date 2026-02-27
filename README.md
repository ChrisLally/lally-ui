# lally-ui

Monorepo for `@chris-lally` UI packages.

## Structure

- `packages/ui-branding`: branding-focused UI component package
- `packages/ui-cli`: `lally-ui` distribution CLI package

## Quick start

```bash
pnpm install
pnpm --filter @chris-lally/ui-branding run build
pnpm --filter @chris-lally/ui-cli run build
```

## Notes

- `opensrc/` contains local source references used for implementation research.
