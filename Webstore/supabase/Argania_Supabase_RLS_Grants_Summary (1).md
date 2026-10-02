# Argania Supabase RLS & Grants Summary

## Current Database

The Argania database uses these 14 public tables:

- `profiles`
- `categories`
- `products`
- `product_variants`
- `product_images`
- `carts`
- `cart_items`
- `addresses`
- `coupons`
- `orders`
- `order_items`
- `order_status_history`
- `payments`
- `coupon_usages`

Important schema facts:

- `profiles.id` references `auth.users(id)`.
- `profiles.role` is an enum: `customer`, `admin`, `manager`.
- `carts.user_id` identifies the cart owner.
- `addresses.user_id` identifies the address owner.
- `orders.user_id` identifies the order owner and can be `NULL`.
- `cart_items.cart_id` belongs to `carts`.
- `order_items.order_id`, `order_status_history.order_id`, and `payments.order_id` belong to `orders`.
- `coupon_usages` has both `order_id` and `user_id`.

## Security Model

Use two layers:

1. **GRANT** — determines whether a role can attempt an operation.
2. **RLS policy** — determines whether the authenticated user can perform that operation on the relevant rows.

The intended model is:

```text
Supabase Auth
     |
     +-- customer --> own user data only
     |
     +-- admin -----> admin-managed data
     |
     +-- manager ---> no special privileges yet
```

Only `admin` currently receives administrative RLS access. The `manager` role is intentionally left undefined until its permissions are decided.

---

# 1. Admin Helper

Create a reusable function for admin checks:

```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where public.profiles.id = (select auth.uid())
      and public.profiles.role = 'admin'::public.app_role
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
```

This function is then used by admin-only RLS policies.

---

# 2. Public Catalog Policies

These tables are readable from the storefront:

### `categories`

```sql
create policy "Public can view categories"
on public.categories
for select
to anon, authenticated
using (true);
```

### `products`

Only active products should be publicly visible:

```sql
create policy "Public can view active products"
on public.products
for select
to anon, authenticated
using (
  status = 'active'::public.product_status
);
```

### `product_variants`

Only active variants should be publicly visible:

```sql
create policy "Public can view active variants"
on public.product_variants
for select
to anon, authenticated
using (
  is_active = true
);
```

### `product_images`

```sql
create policy "Public can view images"
on public.product_images
for select
to anon, authenticated
using (true);
```

---

# 3. Admin Catalog Policies

Admins can fully manage catalog data:

```sql
create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can manage products"
on public.products
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can manage product variants"
on public.product_variants
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can manage product images"
on public.product_images
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
```

Do **not** use `to public` or `using (true)` for admin policies.

---

# 4. Profiles

Users can access only their own profile.

### SELECT

```sql
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
);
```

### INSERT

New users may only create a `customer` profile:

```sql
create policy "Users can create own customer profile"
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
  and role = 'customer'::public.app_role
);
```

### UPDATE

Users may update their own profile but cannot promote themselves:

```sql
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
)
with check (
  (select auth.uid()) = id
  and role = 'customer'::public.app_role
);
```

### Admin

```sql
create policy "Admins can manage profiles"
on public.profiles
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
```

---

# 5. Carts

Each user has one cart because `carts.user_id` is unique.

```sql
create policy "Users can view own cart"
on public.carts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own cart"
on public.carts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own cart"
on public.carts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own cart"
on public.carts
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

---

# 6. Cart Items

Ownership is checked through the parent cart.

```sql
create policy "Users can view own cart items"
on public.cart_items
for select
to authenticated
using (
  exists (
    select 1
    from public.carts
    where public.carts.id = cart_items.cart_id
      and public.carts.user_id = (select auth.uid())
  )
);

create policy "Users can add own cart items"
on public.cart_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.carts
    where public.carts.id = cart_items.cart_id
      and public.carts.user_id = (select auth.uid())
  )
);

create policy "Users can update own cart items"
on public.cart_items
for update
to authenticated
using (
  exists (
    select 1
    from public.carts
    where public.carts.id = cart_items.cart_id
      and public.carts.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.carts
    where public.carts.id = cart_items.cart_id
      and public.carts.user_id = (select auth.uid())
  )
);

create policy "Users can delete own cart items"
on public.cart_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.carts
    where public.carts.id = cart_items.cart_id
      and public.carts.user_id = (select auth.uid())
  )
);
```

---

# 7. Addresses

Users can CRUD only their own addresses:

```sql
create policy "Users can view own addresses"
on public.addresses
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own addresses"
on public.addresses
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own addresses"
on public.addresses
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own addresses"
on public.addresses
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

---

# 8. Coupons

Customers should not directly read or modify the coupon table.

Admin only:

```sql
create policy "Admins can manage coupons"
on public.coupons
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
```

Coupon validation should later be handled through a trusted backend/RPC rather than exposing the entire coupon table.

---

# 9. Orders

Customers can read their own orders.

```sql
create policy "Users can view own orders"
on public.orders
for select
to authenticated
using ((select auth.uid()) = user_id);
```

Do not give customers direct `UPDATE` or `DELETE` access.

Order creation should eventually happen through a trusted backend/RPC because the order contains:

- subtotal
- discount
- shipping
- tax
- total
- shipping address snapshot
- coupon
- payment-related state

Admin:

```sql
create policy "Admins can manage orders"
on public.orders
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
```

---

# 10. Order Items

Customers can only read items belonging to their own orders:

```sql
create policy "Users can view own order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where public.orders.id = order_items.order_id
      and public.orders.user_id = (select auth.uid())
  )
);
```

Admin:

```sql
create policy "Admins can manage order items"
on public.order_items
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
```

Customers should not directly insert, update, or delete order items.

---

# 11. Order Status History

Customers can read status history for their own orders:

```sql
create policy "Users can view own order history"
on public.order_status_history
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where public.orders.id = order_status_history.order_id
      and public.orders.user_id = (select auth.uid())
  )
);
```

Admin:

```sql
create policy "Admins can manage order history"
on public.order_status_history
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
```

Customers should not modify order history.

---

# 12. Payments

Customers can read payment records belonging to their own orders:

```sql
create policy "Users can view own payments"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where public.orders.id = payments.order_id
      and public.orders.user_id = (select auth.uid())
  )
);
```

Admin:

```sql
create policy "Admins can manage payments"
on public.payments
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
```

Payment creation/status updates should come from a trusted backend/payment webhook.

---

# 13. Coupon Usages

Customers can read their own coupon usage:

```sql
create policy "Users can view own coupon usages"
on public.coupon_usages
for select
to authenticated
using ((select auth.uid()) = user_id);
```

Admin:

```sql
create policy "Admins can manage coupon usages"
on public.coupon_usages
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
```

Customers should not directly insert/update/delete usage records.

---

# 14. Grants

Because all privileges were previously revoked, grants must be added.

## Public catalog

```sql
grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_variants to anon, authenticated;
grant select on public.product_images to anon, authenticated;
```

## Customer-owned data

```sql
grant select, insert, update, delete
on public.profiles
to authenticated;

grant select, insert, update, delete
on public.carts
to authenticated;

grant select, insert, update, delete
on public.cart_items
to authenticated;

grant select, insert, update, delete
on public.addresses
to authenticated;
```

## Customer read-only order/payment data

```sql
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.order_status_history to authenticated;
grant select on public.payments to authenticated;
grant select on public.coupon_usages to authenticated;
```

## Admin-managed tables

The authenticated role needs the relevant table privileges even though RLS will restrict which authenticated users can actually use them:

```sql
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.product_variants to authenticated;
grant select, insert, update, delete on public.product_images to authenticated;
grant select, insert, update, delete on public.coupons to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert, update, delete on public.order_status_history to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.coupon_usages to authenticated;
```

RLS remains the row-level authorization layer.

---

# Policy Matrix

| Table | Customer SELECT | Customer INSERT | Customer UPDATE | Customer DELETE | Admin |
|---|---|---|---|---|---|
| `categories` | Public | — | — | — | ALL |
| `products` | Active only | — | — | — | ALL |
| `product_variants` | Active only | — | — | — | ALL |
| `product_images` | Public | — | — | — | ALL |
| `profiles` | Own | Own customer | Own customer | — | ALL |
| `carts` | Own | Own | Own | Own | — |
| `cart_items` | Own cart | Own cart | Own cart | Own cart | — |
| `addresses` | Own | Own | Own | Own | — |
| `coupons` | — | — | — | — | ALL |
| `orders` | Own | Backend/RPC | — | — | ALL |
| `order_items` | Own order | — | — | — | ALL |
| `order_status_history` | Own order | — | — | — | ALL |
| `payments` | Own order | — | — | — | ALL |
| `coupon_usages` | Own | — | — | — | ALL |

---

# Recommended Migration Structure

Since the database is being managed manually through Supabase SQL Editor, keep migrations conceptually separated:

```text
001_schema.sql
    ↓
002_grants.sql
    ↓
003_rls.sql
    ↓
004_functions.sql
    ↓
005_seed.sql
```

The immediate next task after creating the RLS policies is **testing**.

Test at least:

```text
Customer A
  ✓ sees own cart
  ✓ sees own addresses
  ✓ sees own orders
  ✓ sees own order items
  ✓ sees own payments
  ✗ sees Customer B's data
  ✗ changes product
  ✗ changes order status
  ✗ promotes self to admin

Customer B
  ✓ same isolation

Admin
  ✓ manages products
  ✓ manages categories
  ✓ manages variants/images
  ✓ manages coupons
  ✓ manages orders
  ✓ manages payments
  ✓ manages customers
```

This should be treated as the security checklist before connecting the Next.js storefront/admin dashboard.
