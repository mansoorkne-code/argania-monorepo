-- Phase 2: initial ecommerce schema.
--
-- Row Level Security policies deliberately belong to Phase 3. This migration
-- establishes constraints and relationships only; it must be applied before
-- any application code uses the database.

create type public.app_role as enum ('customer', 'admin', 'manager');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.order_status as enum (
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refund_requested',
  'refunded'
);

create type public.payment_status as enum (
  'pending',
  'authorized',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
  'cancelled'
);

create type public.discount_type as enum ('percentage', 'fixed_amount');

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  full_name text,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint categories_name_not_blank check (char_length(trim(name)) > 0),
  constraint categories_slug_not_blank check (char_length(trim(slug)) > 0)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  status public.product_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint products_name_not_blank check (char_length(trim(name)) > 0),
  constraint products_slug_not_blank check (char_length(trim(slug)) > 0)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null,
  name text not null,
  attributes jsonb not null default '{}'::jsonb,
  price numeric(12, 2) not null,
  compare_at_price numeric(12, 2),
  stock_quantity integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_variants_sku_not_blank check (char_length(trim(sku)) > 0),
  constraint product_variants_name_not_blank check (char_length(trim(name)) > 0),
  constraint product_variants_price_non_negative check (price >= 0),
  constraint product_variants_compare_at_price_valid
    check (compare_at_price is null or compare_at_price >= price),
  constraint product_variants_stock_non_negative check (stock_quantity >= 0),
  constraint product_variants_attributes_is_object check (jsonb_typeof(attributes) = 'object')
);

create unique index product_variants_sku_unique_ci
  on public.product_variants (lower(sku));

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint product_images_storage_path_not_blank check (char_length(trim(storage_path)) > 0),
  constraint product_images_position_non_negative check (position >= 0)
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint cart_items_quantity_positive check (quantity > 0),
  constraint cart_items_cart_variant_unique unique (cart_id, variant_id)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country_code char(2) not null default 'IN',
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint addresses_required_fields_not_blank check (
    char_length(trim(recipient_name)) > 0
    and char_length(trim(phone)) > 0
    and char_length(trim(line1)) > 0
    and char_length(trim(city)) > 0
    and char_length(trim(state)) > 0
    and char_length(trim(postal_code)) > 0
  ),
  constraint addresses_country_code_format check (country_code ~ '^[A-Z]{2}$')
);

create unique index addresses_one_default_per_user
  on public.addresses (user_id)
  where is_default;

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_type public.discount_type not null,
  discount_value numeric(12, 2) not null,
  minimum_order_amount numeric(12, 2),
  usage_limit integer,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint coupons_discount_value_positive check (discount_value > 0),
  constraint coupons_percentage_not_over_100 check (
    discount_type <> 'percentage' or discount_value <= 100
  ),
  constraint coupons_minimum_order_amount_non_negative check (
    minimum_order_amount is null or minimum_order_amount >= 0
  ),
  constraint coupons_usage_limit_positive check (usage_limit is null or usage_limit > 0),
  constraint coupons_active_period_valid check (starts_at is null or ends_at is null or starts_at <= ends_at)
);

create unique index coupons_code_unique_ci on public.coupons (lower(code));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  user_id uuid references public.profiles(id) on delete set null,
  status public.order_status not null default 'pending',
  currency char(3) not null default 'INR',
  subtotal numeric(12, 2) not null,
  discount_total numeric(12, 2) not null default 0,
  shipping_total numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  shipping_address_snapshot jsonb not null,
  coupon_id uuid references public.coupons(id) on delete set null,
  placed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint orders_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint orders_amounts_non_negative check (
    subtotal >= 0 and discount_total >= 0 and shipping_total >= 0 and tax_total >= 0 and total >= 0
  ),
  constraint orders_total_matches_components check (
    total = subtotal - discount_total + shipping_total + tax_total
  ),
  constraint orders_shipping_address_is_object check (jsonb_typeof(shipping_address_snapshot) = 'object')
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  sku text not null,
  variant_name text not null,
  unit_price numeric(12, 2) not null,
  quantity integer not null,
  line_total numeric(12, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default timezone('utc', now()),
  constraint order_items_product_name_not_blank check (char_length(trim(product_name)) > 0),
  constraint order_items_sku_not_blank check (char_length(trim(sku)) > 0),
  constraint order_items_variant_name_not_blank check (char_length(trim(variant_name)) > 0),
  constraint order_items_unit_price_non_negative check (unit_price >= 0),
  constraint order_items_quantity_positive check (quantity > 0)
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null,
  provider_payment_id text,
  amount numeric(12, 2) not null,
  currency char(3) not null default 'INR',
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint payments_provider_not_blank check (char_length(trim(provider)) > 0),
  constraint payments_amount_non_negative check (amount >= 0),
  constraint payments_currency_format check (currency ~ '^[A-Z]{3}$')
);

create unique index payments_provider_payment_id_unique
  on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;

create table public.coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  user_id uuid references public.profiles(id) on delete set null,
  discount_amount numeric(12, 2) not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint coupon_usages_discount_amount_non_negative check (discount_amount >= 0),
  constraint coupon_usages_coupon_order_unique unique (coupon_id, order_id)
);

create index categories_parent_id_idx on public.categories (parent_id);
create index products_category_id_idx on public.products (category_id);
create index products_status_idx on public.products (status);
create index product_variants_product_id_idx on public.product_variants (product_id);
create index product_images_product_id_idx on public.product_images (product_id);
create index product_images_variant_id_idx on public.product_images (variant_id);
create index cart_items_cart_id_idx on public.cart_items (cart_id);
create index cart_items_variant_id_idx on public.cart_items (variant_id);
create index addresses_user_id_idx on public.addresses (user_id);
create index orders_user_id_created_at_idx on public.orders (user_id, created_at desc);
create index orders_status_created_at_idx on public.orders (status, created_at desc);
create index orders_coupon_id_idx on public.orders (coupon_id);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_status_history_order_id_created_at_idx on public.order_status_history (order_id, created_at);
create index payments_order_id_idx on public.payments (order_id);
create index coupon_usages_coupon_id_idx on public.coupon_usages (coupon_id);
create index coupon_usages_user_id_idx on public.coupon_usages (user_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

create trigger coupons_set_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();
