# Supabase database

This directory holds the reproducible database definition for Webstore.

## Applying migrations

Link a Supabase project, then apply the migration through the Supabase CLI:

```sh
supabase link --project-ref <project-ref>
supabase db push
```

For local development, initialise Supabase configuration with `supabase init`
and start its local services with `supabase start`. Do not commit generated
secrets or service-role keys.

## Phase 2 decisions

- Inventory belongs to `product_variants.stock_quantity`; a product becomes
  purchasable when it has an active variant.
- `order_items` persist the product name, SKU, variant name, unit price, and
  calculated line total so later catalog changes cannot rewrite order history.
- Orders keep a JSON shipping-address snapshot for the same reason.
- `INR` is the default currency. Amounts use `numeric(12, 2)`.
- Coupon eligibility, stock decrements, checkout idempotency, and order-status
  transitions are server-side domain concerns planned for later phases.

## Security boundary

This migration intentionally creates no Row Level Security policies. Phase 3
must enable RLS and add policies before browser clients are connected to these
tables. Never expose a service-role key to either Next.js application.
