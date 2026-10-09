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

## Category metadata

`migrations/20261004120000_category_metadata.sql` adds nullable `image_path` and
an `active`/`draft`/`archived` status (existing categories become `active`).
Apply this additive migration to the existing store before deploying the
storefront changes. For a manually managed project, run the migration SQL in
the Supabase SQL Editor. Add category image object paths from the public image
bucket; only active categories appear on the shop page.

### Provider setup

1. Add the Phase 9 variables from `.env.example` to the storefront environment.
   Keep Razorpay secrets, Shiprocket credentials, and the Supabase secret key
   (`SUPABASE_SECRET_KEY`, or legacy `SUPABASE_SERVICE_ROLE_KEY`) server-side.
   Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is public.
2. Webhooks are optional: the checkout return flow verifies payment directly
   with Razorpay. To enable webhook backup notifications later, create a
   Razorpay webhook pointing to
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
renders objects from the public `product-images` bucket. Apply
`20261009100000_product_image_storage.sql` after the initial schema and Phase 3
RLS setup. It provisions the bucket, admin-only upload/update/delete policies,
public object reads, image-table policies, and the atomic image-reordering
function. The admin product editor then uploads images directly to Storage and
records paths in `public.product_images.storage_path`. Paths are generated as
`<product-uuid>/<image-uuid>.<extension>`; do not edit them manually.

If migrations are applied from Supabase Dashboard, open **SQL Editor**, paste
the contents of that migration, and run it once. You do not also need to create
the bucket or add Storage policies in the dashboard. Keep
`NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET` unset so both apps use
`product-images`, unless you also change the bucket name and its policies in the
migration. Category `image_path` values continue to use this same bucket.

## Security boundary

The initial schema migration intentionally creates no general Row Level
Security policies. Phase 3 must enable RLS and add policies before browser
clients are connected to those tables. The product image migration adds only
the policies needed for image metadata and Storage objects. Never expose a
service-role key to either Next.js application.
