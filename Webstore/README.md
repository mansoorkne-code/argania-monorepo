# Webstore

A modular, production-oriented ecommerce platform built with pnpm, Turborepo,
Next.js, and Supabase.

## Workspace layout

- `apps/storefront` — customer-facing ecommerce application (port 3000)
- `apps/admin` — administrative dashboard (port 3001)
- `packages/ui` — shared presentational UI primitives
- `packages/eslint-config` — shared ESLint configuration
- `packages/typescript-config` — shared TypeScript configuration
- `supabase` — database migrations and Supabase operational documentation
- `packages/types` — shared domain contracts
- `packages/validations` — Zod schemas for untrusted input
- `packages/api` — server-side domain rules and business calculations

The `db`, `auth`, and `config` packages will be added in their respective
implementation phases.

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
