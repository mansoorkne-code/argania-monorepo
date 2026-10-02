# Webstore

A modular, production-oriented ecommerce platform built with pnpm, Turborepo,
Next.js, and Supabase.

## Workspace layout

- `apps/storefront` — customer-facing ecommerce application (port 3000)
- `apps/admin` — administrative dashboard (port 3001)
- `packages/ui` — shared presentational UI primitives
- `packages/eslint-config` — shared ESLint configuration
- `packages/typescript-config` — shared TypeScript configuration

Future shared packages (`db`, `auth`, `api`, `types`, `validations`, and
`config`) will be added only in their respective implementation phases.

## Commands

```sh
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
```

Run one app with a Turborepo filter:

```sh
pnpm dev --filter=@webstore/storefront
pnpm dev --filter=@webstore/admin
```

## Architecture

Supabase PostgreSQL is the system of record. Business-critical operations,
pricing, inventory, authentication, and authorization are enforced on the
server and through Supabase Row Level Security. See the repository-level
`Agent.md` for the architecture, security, and phased-delivery rules.
