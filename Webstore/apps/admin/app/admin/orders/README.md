# Admin order management

`/admin/orders` lists orders with server-side search, order/payment status filters,
customer name/phone/ID filtering, exact order-number matching, an inclusive date
range, six sort options, and 20 orders per page. Dates are interpreted in
`Asia/Kolkata` and displayed as IST. Search treats punctuation literally; it is
not interpolated into SQL or PostgREST filter expressions. Sorting and pagination
preserve the filters in the URL; applying filters resets the page.

`/admin/orders/[id]` shows customer profile information, the historical shipping
address from `orders.shipping_address_snapshot`, historical item names, SKUs,
quantities and prices from `order_items`, stored totals, and every payment attempt
with provider references. Current addresses and catalog records never reconstruct
an old order. Customer email is not in the public profile schema; this interface
shows available name, phone and account ID without exposing `auth.users`.

Payment filters match any payment attempt, so an order with both a failed and a
paid attempt can match either filter. It is counted only once. An explicit
"Not recorded" filter finds orders without payment rows. No order or payment
status-changing controls are included in this read-only feature.

## Migration and security

Apply `supabase/migrations/20261020100000_admin_order_management.sql` after the
baseline, Phase 3 RLS setup, and Phase 9 checkout migration. Do not replay the
baseline over an existing store. Apply this migration before deploying the
order-management interface.

The application authenticates with `getUser()` and checks the current profile role
on every list/detail read, independently of the admin layout. Only `admin` is
allowed. Managers retain their existing dashboard permissions but cannot read
orders until a deliberate order permission is introduced.

Both RPCs repeat this check and run with `SECURITY INVOKER`, preserving RLS.
Their EXECUTE grants exclude anonymous callers. A narrow `SECURITY DEFINER`
helper reads only the caller's admin flag to avoid recursive profile RLS. The
migration adds admin SELECT policies and indexes without replacing existing
customer-ownership policies. All app reads use the authenticated session and
publishable Supabase key; no service-role key is used.

## Validation

From `Webstore/`:

```sh
pnpm --filter @webstore/admin test
pnpm --filter @webstore/admin check-types
pnpm --filter @webstore/admin lint
pnpm --filter @webstore/admin build
```

Run `supabase/tests/admin-order-management.sql` against a disposable local
PostgreSQL/Supabase database with the prerequisite migrations and Phase 3 RLS.
It rolls back its fixtures and tests direct RPC denial for customers (including
other customers' IDs), managers and anonymous users, ownership RLS, historical
snapshots, multiple payment attempts, exact counts, stable pagination, date
boundaries, and sort/filter behavior. The migration and this SQL suite were also
executed in an isolated PostgreSQL runtime during development.
