# Project Status

Last updated: 2026-10-03

## Completed and pushed

### Phase 1 — Turborepo foundation

Commit [`dff6517`](https://github.com/mansoorkne-code/argania-monorepo/commit/dff6517)
is on `main`.

- Established the `Webstore` pnpm/Turborepo workspace.
- Renamed starter applications to `apps/storefront` and `apps/admin`.
- Kept the shared UI, ESLint, and TypeScript configuration packages.
- Added root workspace documentation and a `typecheck` command alias.
- Configured Turborepo to use stream output in non-interactive environments.

## Implemented locally, awaiting dependency resolution and commit

### Phase 2 — Database foundation

- Added the initial Supabase migration at
  `Webstore/supabase/migrations/20261002120000_initial_schema.sql`.
- Defined the required ecommerce entities: profiles, catalog, carts, addresses,
  coupons, orders, payments, and their related records.
- Added foreign keys, indexes, monetary/inventory checks, timestamp triggers,
  and historical order-item/address snapshots.
- Added `Webstore/.env.example` and Supabase setup documentation.

The configured Supabase store has the Phase 2 tables used by the manual Phase 3
RLS setup. The local migration history has not been reconciled with that manual
database state; check it before applying future migrations.

### Phase 4 — Safe domain layer foundations

- Added `@webstore/types` for catalog and order domain contracts.
- Added `@webstore/validations` with Zod schemas for cart, checkout, and order
  status inputs. These inputs intentionally exclude client-provided prices and
  totals.
- Added `@webstore/api` with deterministic integer-minor-unit order total
  calculation, domain errors, and lifecycle transition validation.
- Added unit tests for pricing and permitted/forbidden order transitions.

The pnpm lockfile was refreshed while adding the Supabase SSR dependencies on
2026-10-03. The full Phase 4 typecheck and test suite remain unverified.

## Completed manually; live verification pending

### Phase 3 — Authentication and RLS

The database-side grants and RLS policies were applied manually in the Supabase
store. Their intended policy model is documented in
`Webstore/supabase/Argania_Supabase_RLS_Grants_Summary (1).md`.
`Webstore/supabase/tests/phase3_rls.test.mjs` provides a repeatable anonymous
PostgREST smoke test using the configured publishable key. The live anonymous
requests returned HTTP 200 for public catalog queries and no rows for probed
private tables. Those private tables currently return zero fixture rows, so
customer-to-customer and admin authorization still need identity-based tests.
The storefront now has Google OAuth with PKCE, cookie-backed SSR sessions,
session refresh, a protected account page, and sign-out. Configure Google Cloud
and the Supabase provider/redirect allow list using
`Webstore/supabase/GOOGLE_OAUTH_SETUP.md` before testing the live OAuth flow.
Role and permission utilities remain future work before admin database access.

## Implemented locally

### Phase 5 — Shared UI system

- Added shared design tokens and accessible UI primitives to `@repo/ui`.
- Integrated the shared stylesheet into both app shells.
- Documented the package exports and usage.

### Phase 6 — Storefront shell

- Replaced the starter page with the Argania storefront landing page.
- Added a responsive shared header, mobile navigation, footer, and metadata.
- Added brand, approach, and journal sections without introducing catalog or
  cart behavior from later phases.
- Used the shared UI package for badges, cards, and button styling.

### Phase 7 — Product catalog

- Added server-rendered `/products` collection and `/products/[slug]` detail
  routes backed by the public Supabase client and Phase 2 catalog schema.
- Added category filtering, name search, pagination, category breadcrumbs,
  product variants, INR pricing, stock labels, and product metadata.
- Added empty and recoverable error states. Product image paths resolve from a
  public Supabase Storage bucket configured by
  `NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET` (defaults to `product-images`).
- Lint, storefront TypeScript, and production build pass. Live catalog rendering
  still depends on active product/variant rows and the configured public image
  bucket; it was not verified against populated catalog data.

### Phase 8 — Cart

- Added a signed-in `/cart` backed by each customer's Supabase cart and cart
  items, with live database prices, integer-minor-unit subtotal calculation,
  quantity updates, removal, empty/error states, and stock warnings.
- Product detail variants can be added to the bag. Server actions accept only
  variant IDs and quantities, verify that the product and variant are active,
  and validate current inventory before writing. RLS continues to scope cart
  reads and writes to the authenticated owner.
- Missing customer profiles are created with the customer role when the user
  first accesses their cart. Checkout remains disabled for Phase 9.
- Storefront lint, TypeScript, and production build pass. Live signed-in cart
  ownership and stock behavior still need verification against populated data.

### Phase 9 — Checkout, saved orders, payments, and delivery

- Added `/checkout` address entry and Shiprocket serviceability/rate lookup.
  The cheapest available courier quote is included in the server-calculated
  database total.
- Added a separate SQL migration with service-role-only RPCs that save an
  order, address/item snapshots, and pending payment before payment begins;
  inventory is reserved atomically. Failed initialization restores stock and
  abandoned reservations expire after 20 minutes.
- Added Razorpay order creation, Checkout UI, server-side signature and
  payment-status verification, captured-payment confirmation, and webhook
  handling. Successful orders are confirmed and appear in the customer's
  account/order history.
- Added `.env.example` provider settings and Supabase/provider setup steps.
- The migration has not been applied to the manually configured Supabase
  store. Reconcile migration history before pushing it. External Razorpay and
  Shiprocket flows still need test-order verification with account credentials.

### Later phases
- Phase 10–17: admin workflows, analytics, testing, security audit,
  performance, and deployment

## Current prerequisites

1. Reconcile local migration history with the manually prepared Supabase schema
   before applying further migrations.
2. Run the Phase 4 domain checks.
3. Run `node --test supabase/tests/phase3_rls.test.mjs` from `Webstore/` and
   perform identity-based customer/admin isolation checks before browser
   clients or database-backed order operations are connected.
4. Add active catalog fixtures and configure the public product image bucket to
   verify Phase 7 against populated Supabase data.

## Verification record

- Workspace JSON and Turborepo task graph: verified during Phase 1.
- Phase 2 schema coverage and whitespace checks: verified.
- Domain type syntax and whitespace checks: verified.
- Phase 3 anonymous PostgREST smoke tests: 3 passed against the configured live
  URL; private data tables have no rows to exercise row isolation.
- Phase 5 UI package lint and typecheck: passed.
- Phase 6 storefront lint, route type generation, typecheck, and production
  build: passed. Home page returned HTTP 200 in the local preview.
- Phase 7 storefront lint, TypeScript, and production build: passed. Supabase
  catalog data and public Storage image delivery remain unverified.
- Phase 8 storefront lint, TypeScript, and production build: passed. Live
  authenticated cart/RLS behavior remains unverified.
- Storefront Google OAuth routes compile and the production build passes; the
  provider flow remains unverified until the manual Google/Supabase setup is
  complete.
- Phase 9 storefront lint, TypeScript, and production build pass. The Supabase
  migration and provider credentials are not yet applied/configured, so live
  database and payment/shipping flows remain unverified.
- Monorepo-wide lint, typecheck, build, and Vitest suite remain unverified.
