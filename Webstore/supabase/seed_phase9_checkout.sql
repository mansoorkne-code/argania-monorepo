-- Phase 9 checkout test fixture.
-- Run in the Supabase SQL Editor AFTER applying
-- migrations/20261003160000_checkout_payments_shipping.sql.
-- Creates a dedicated public catalog item; it does not create users, carts,
-- orders, payments, or touch existing product inventory.

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_variants'
      and column_name = 'weight_kg'
  ) then
    raise exception 'Apply the Phase 9 checkout migration before running this seed.';
  end if;

  if to_regprocedure('public.create_checkout_order(uuid,uuid,jsonb,numeric,text,text,text)') is null then
    raise exception 'Phase 9 checkout RPCs are missing; apply the Phase 9 migration first.';
  end if;
end;
$$;

begin;

insert into public.categories (name, slug, description)
values (
  'Checkout Test Fixtures',
  'checkout-test-fixtures',
  'Temporary catalog fixtures for verifying the Argania checkout flow.'
)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    updated_at = timezone('utc', now());

insert into public.products (category_id, name, slug, description, status)
select
  c.id,
  'Checkout Test Product',
  'checkout-test-product',
  'Dedicated low-price test item. Do not fulfill test orders.',
  'active'::public.product_status
from public.categories as c
where c.slug = 'checkout-test-fixtures'
on conflict (slug) do update
set category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    status = 'active'::public.product_status,
    updated_at = timezone('utc', now());

insert into public.product_variants (
  product_id,
  sku,
  name,
  attributes,
  price,
  compare_at_price,
  stock_quantity,
  is_active,
  weight_kg
)
select
  p.id,
  'TEST-CHECKOUT-001',
  'Test unit',
  '{"size":"test"}'::jsonb,
  1.00,
  null,
  20,
  true,
  0.500
from public.products as p
where p.slug = 'checkout-test-product'
on conflict (lower(sku)) do update
set product_id = excluded.product_id,
    name = excluded.name,
    attributes = excluded.attributes,
    price = excluded.price,
    is_active = true,
    weight_kg = excluded.weight_kg,
    updated_at = timezone('utc', now());

commit;

-- Confirm what was inserted. Save the variant ID if you want to add it to a
-- signed-in test customer's cart through the storefront.
select
  p.id as product_id,
  p.name as product_name,
  p.slug as product_slug,
  v.id as variant_id,
  v.sku,
  v.price,
  v.stock_quantity,
  v.weight_kg
from public.products as p
join public.product_variants as v on v.product_id = p.id
where p.slug = 'checkout-test-product'
  and v.sku = 'TEST-CHECKOUT-001';
