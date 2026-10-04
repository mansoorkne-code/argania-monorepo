-- Sample catalog seed for the Supabase SQL Editor.
-- Safe to run repeatedly: categories and products are upserted, and existing
-- variant inventory is left unchanged when its SKU already exists.
-- Sample prices and stock are placeholders; edit them for your real catalog.
-- Apply 20261004120000_category_metadata.sql and Phase 9 checkout migration first.

begin;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'categories'
      and column_name = 'status'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'categories'
      and column_name = 'image_path'
  ) then
    raise exception 'Apply migrations/20261004120000_category_metadata.sql first.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_variants'
      and column_name = 'weight_kg'
  ) then
    raise exception 'Apply the Phase 9 checkout migration before seeding checkout-ready products.';
  end if;
end;
$$;

insert into public.categories (name, slug, description, image_path, status)
values
  ('Hair Care', 'hair-care', 'Nourishing care for healthy, beautiful hair.', null, 'active'),
  ('Skin Care', 'skin-care', 'Everyday essentials for soft, balanced skin.', null, 'active'),
  ('Makeup', 'makeup', 'Easy-to-wear beauty and finishing touches.', null, 'active')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    status = excluded.status,
    updated_at = timezone('utc', now());

insert into public.products (category_id, name, slug, description, status)
select c.id, seed.name, seed.slug, seed.description, 'active'::public.product_status
from (values
  ('hair-care', 'Argan Repair Shampoo', 'argan-repair-shampoo', 'A gentle daily shampoo with argan oil for dry or damaged hair.'),
  ('hair-care', 'Argan Smoothing Conditioner', 'argan-smoothing-conditioner', 'A nourishing conditioner that leaves hair soft and manageable.'),
  ('skin-care', 'Daily Argan Face Oil', 'daily-argan-face-oil', 'A lightweight facial oil for a soft, hydrated finish.'),
  ('skin-care', 'Hydrating Glow Serum', 'hydrating-glow-serum', 'A daily hydrating serum for a fresh, dewy-looking complexion.'),
  ('makeup', 'Nourishing Lip Color', 'nourishing-lip-color', 'A comfortable lip color with a smooth, nourishing feel.'),
  ('makeup', 'Argan Makeup Remover', 'argan-makeup-remover', 'A gentle cleansing oil to lift makeup and daily impurities.')
) as seed(category_slug, name, slug, description)
join public.categories as c on c.slug = seed.category_slug
on conflict (slug) do update
set category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    status = excluded.status,
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
  seed.sku,
  seed.variant_name,
  seed.attributes::jsonb,
  seed.price,
  null,
  seed.stock_quantity,
  true,
  seed.weight_kg
from (values
  ('argan-repair-shampoo', 'ARG-HAIR-SHAMPOO-250', '250 ml', '{"size":"250 ml"}', 549.00::numeric, 20, 0.350::numeric),
  ('argan-smoothing-conditioner', 'ARG-HAIR-CONDITIONER-250', '250 ml', '{"size":"250 ml"}', 599.00::numeric, 20, 0.350::numeric),
  ('daily-argan-face-oil', 'ARG-SKIN-FACEOIL-30', '30 ml', '{"size":"30 ml"}', 799.00::numeric, 20, 0.200::numeric),
  ('hydrating-glow-serum', 'ARG-SKIN-SERUM-30', '30 ml', '{"size":"30 ml"}', 699.00::numeric, 20, 0.200::numeric),
  ('nourishing-lip-color', 'ARG-MAKEUP-LIPCOLOR-4', '4 g', '{"size":"4 g"}', 399.00::numeric, 20, 0.100::numeric),
  ('argan-makeup-remover', 'ARG-MAKEUP-REMOVER-100', '100 ml', '{"size":"100 ml"}', 499.00::numeric, 20, 0.250::numeric)
) as seed(product_slug, sku, variant_name, attributes, price, stock_quantity, weight_kg)
join public.products as p on p.slug = seed.product_slug
on conflict (lower(sku)) do nothing;

commit;

-- Review the seeded categories, products, and variants.
select
  c.name as category,
  p.name as product,
  p.slug as product_slug,
  v.name as variant,
  v.sku,
  v.price,
  v.stock_quantity,
  v.weight_kg
from public.products as p
join public.categories as c on c.id = p.category_id
join public.product_variants as v on v.product_id = p.id
where c.slug in ('hair-care', 'skin-care', 'makeup')
  and p.slug in (
    'argan-repair-shampoo',
    'argan-smoothing-conditioner',
    'daily-argan-face-oil',
    'hydrating-glow-serum',
    'nourishing-lip-color',
    'argan-makeup-remover'
  )
order by c.name, p.name;
