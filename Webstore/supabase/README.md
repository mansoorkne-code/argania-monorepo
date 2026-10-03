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

## Phase 9 checkout

`migrations/20261003160000_checkout_payments_shipping.sql` adds checkout
reservation fields, product parcel weight, payment-provider references, and
three service-role-only RPCs. `create_checkout_order` snapshots the address
and items, calculates totals from current database prices, reserves stock, and
saves the pending order/payment before redirecting to Razorpay. A 20-minute
pending reservation expires and is released on a later checkout attempt.
`confirm_checkout_payment` confirms an order only after server-side Razorpay
signature and payment-status verification. Failed setup cancels the saved order
and restores stock. The existing Phase 2 orders/payments tables are reused.

The migration is separate from the manually configured database. Reconcile the
existing Supabase migration history and schema first, then apply it with
`supabase db push`; do not push the Phase 2 baseline over the manually prepared
store without reviewing migration history.

### Provider setup

1. Add the Phase 9 variables from `.env.example` to the storefront environment.
   Keep Razorpay secrets, Shiprocket credentials, and
   `SUPABASE_SERVICE_ROLE_KEY` server-side. Only
   `NEXT_PUBLIC_RAZORPAY_KEY_ID` is public.
2. In Razorpay, create a webhook pointing to
   `https://<storefront-host>/api/webhooks/razorpay`; subscribe to
   `payment.captured` and `payment.failed`, and copy its signing secret to
   `RAZORPAY_WEBHOOK_SECRET`. Use test keys for test checkout and live keys for
   production.
3. Create Shiprocket API credentials, set the account pickup PIN code, and
   configure realistic parcel dimensions/packaging weight. Set each
   `product_variants.weight_kg` to the packed product's weight. Checkout asks
   Shiprocket for serviceability and charges the cheapest unblocked courier
   quote returned for the destination.
4. Place a test order with a serviceable PIN code. Confirm the pending order,
   stock reservation, Razorpay capture, payment webhook, and saved order
   history in Supabase before enabling live credentials.

## Public product images

The storefront reads product image paths from `public.product_images` and
renders objects from a public Supabase Storage bucket. Create a public bucket
named `product-images` (or set
`NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET` to the bucket you choose), upload
the image objects, and save each object path in `product_images.storage_path`.
For example, an object uploaded as `daily-oil/front.jpg` should use that same
path in the row. Keep write access restricted to trusted administrators; public
read access is needed for storefront visitors to view the catalog images.

## Security boundary

This migration intentionally creates no Row Level Security policies. Phase 3
must enable RLS and add policies before browser clients are connected to these
tables. Never expose a service-role key to either Next.js application.
