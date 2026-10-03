-- Phase 9: secure checkout persistence, stock reservation, and payment/shipping references.
-- This migration is intentionally separate from the manually prepared Phase 3 database.

alter table public.product_variants
  add column if not exists weight_kg numeric(8, 3) not null default 0.500;

alter table public.product_variants
  drop constraint if exists product_variants_weight_kg_non_negative;
alter table public.product_variants
  add constraint product_variants_weight_kg_non_negative check (weight_kg > 0);

alter table public.orders
  add column if not exists checkout_key uuid,
  add column if not exists checkout_expires_at timestamptz,
  add column if not exists shipping_provider text,
  add column if not exists shipping_quote_reference text,
  add column if not exists shipping_courier_id text,
  add column if not exists shipping_courier_name text;

create unique index if not exists orders_checkout_key_unique
  on public.orders (checkout_key)
  where checkout_key is not null;

alter table public.payments
  add column if not exists provider_order_id text;

create unique index if not exists payments_provider_order_id_unique
  on public.payments (provider, provider_order_id)
  where provider_order_id is not null;

create or replace function public.create_checkout_order(
  p_user_id uuid,
  p_checkout_key uuid,
  p_shipping_address_snapshot jsonb,
  p_shipping_total numeric,
  p_shipping_quote_reference text,
  p_shipping_courier_id text,
  p_shipping_courier_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart_id uuid;
  v_existing_order_id uuid;
  v_existing_status public.order_status;
  v_order_id uuid;
  v_cart_count integer;
  v_valid_count integer;
  v_subtotal numeric(12, 2);
  v_total numeric(12, 2);
  v_expired record;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Checkout service access required' using errcode = '42501';
  end if;
  if p_user_id is null or p_checkout_key is null then
    raise exception 'Checkout identity is required' using errcode = '22023';
  end if;
  if jsonb_typeof(p_shipping_address_snapshot) <> 'object'
    or p_shipping_total is null or p_shipping_total < 0 then
    raise exception 'Checkout address and delivery charge are invalid' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_checkout_key::text, 0));

  select o.id, o.status
    into v_existing_order_id, v_existing_status
  from public.orders as o
  where o.checkout_key = p_checkout_key
    and o.user_id = p_user_id
  for update;

  if v_existing_order_id is not null then
    if v_existing_status = 'pending' then
      if exists (
        select 1 from public.orders as o
        where o.id = v_existing_order_id
          and o.checkout_expires_at > timezone('utc', now())
      ) then
      return v_existing_order_id;
      end if;
      raise exception 'Checkout payment window has expired' using errcode = 'P0001';
    end if;
    raise exception 'Checkout key has already been used' using errcode = '23505';
  end if;

  -- Release stock held by abandoned checkout attempts for this customer.
  for v_expired in
    select o.id
    from public.orders as o
    where o.user_id = p_user_id
      and o.status = 'pending'
      and o.checkout_expires_at <= timezone('utc', now())
    for update
  loop
    update public.product_variants as v
    set stock_quantity = v.stock_quantity + oi.quantity
    from public.order_items as oi
    where oi.order_id = v_expired.id
      and oi.variant_id = v.id;

    update public.payments as pay
    set status = 'failed', updated_at = timezone('utc', now())
    where pay.order_id = v_expired.id and pay.status = 'pending';

    update public.orders as o
    set status = 'cancelled', cancelled_at = timezone('utc', now()),
        checkout_expires_at = null, updated_at = timezone('utc', now())
    where o.id = v_expired.id;

    insert into public.order_status_history (order_id, from_status, to_status, note)
    values (v_expired.id, 'pending', 'cancelled', 'Checkout payment window expired');
  end loop;

  select c.id into v_cart_id
  from public.carts as c
  where c.user_id = p_user_id
  for update;
  if v_cart_id is null then
    raise exception 'Cart is empty' using errcode = 'P0002';
  end if;

  perform 1
  from public.cart_items as ci
  join public.product_variants as v on v.id = ci.variant_id
  where ci.cart_id = v_cart_id
  order by v.id
  for update of ci, v;

  select count(*) into v_cart_count
  from public.cart_items as ci
  where ci.cart_id = v_cart_id;

  select count(*) into v_valid_count
  from public.cart_items as ci
  join public.product_variants as v on v.id = ci.variant_id
  join public.products as p on p.id = v.product_id
  where ci.cart_id = v_cart_id
    and v.is_active
    and p.status = 'active'
    and v.stock_quantity >= ci.quantity;

  if v_cart_count = 0 then
    raise exception 'Cart is empty' using errcode = 'P0002';
  end if;
  if v_cart_count <> v_valid_count then
    raise exception 'Cart contains unavailable or out-of-stock items' using errcode = 'P0001';
  end if;

  select coalesce(sum(v.price * ci.quantity), 0)::numeric(12, 2)
    into v_subtotal
  from public.cart_items as ci
  join public.product_variants as v on v.id = ci.variant_id
  where ci.cart_id = v_cart_id;
  v_total := v_subtotal + p_shipping_total;

  insert into public.orders (
    user_id, status, currency, subtotal, discount_total, shipping_total,
    tax_total, total, shipping_address_snapshot, checkout_key,
    checkout_expires_at, shipping_provider, shipping_quote_reference,
    shipping_courier_id, shipping_courier_name
  ) values (
    p_user_id, 'pending', 'INR', v_subtotal, 0, p_shipping_total,
    0, v_total, p_shipping_address_snapshot, p_checkout_key,
    timezone('utc', now()) + interval '20 minutes', 'shiprocket',
    p_shipping_quote_reference, p_shipping_courier_id, p_shipping_courier_name
  ) returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, variant_id, product_name, sku, variant_name,
    unit_price, quantity
  )
  select v_order_id, p.id, v.id, p.name, v.sku, v.name, v.price, ci.quantity
  from public.cart_items as ci
  join public.product_variants as v on v.id = ci.variant_id
  join public.products as p on p.id = v.product_id
  where ci.cart_id = v_cart_id;

  update public.product_variants as v
  set stock_quantity = v.stock_quantity - ci.quantity,
      updated_at = timezone('utc', now())
  from public.cart_items as ci
  where ci.cart_id = v_cart_id and ci.variant_id = v.id;

  insert into public.payments (order_id, provider, amount, currency, status)
  values (v_order_id, 'razorpay', v_total, 'INR', 'pending');

  insert into public.order_status_history (order_id, from_status, to_status, note)
  values (v_order_id, null, 'pending', 'Checkout order created; stock reserved');

  return v_order_id;
end;
$$;

create or replace function public.cancel_checkout_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Checkout service access required' using errcode = '42501';
  end if;

  select * into v_order
  from public.orders as o
  where o.id = p_order_id
  for update;
  if not found or v_order.status <> 'pending' then return; end if;

  update public.product_variants as v
  set stock_quantity = v.stock_quantity + oi.quantity,
      updated_at = timezone('utc', now())
  from public.order_items as oi
  where oi.order_id = p_order_id and oi.variant_id = v.id;

  update public.payments as pay
  set status = 'failed', updated_at = timezone('utc', now())
  where pay.order_id = p_order_id and pay.status = 'pending';

  update public.orders as o
  set status = 'cancelled', cancelled_at = timezone('utc', now()),
      checkout_expires_at = null, updated_at = timezone('utc', now())
  where o.id = p_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, note)
  values (p_order_id, 'pending', 'cancelled', 'Checkout could not be initialized');
end;
$$;

create or replace function public.confirm_checkout_payment(
  p_order_id uuid,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_amount_minor bigint,
  p_currency text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Checkout service access required' using errcode = '42501';
  end if;

  select * into v_order
  from public.orders as o
  where o.id = p_order_id
  for update;
  if not found then raise exception 'Checkout order not found' using errcode = 'P0002'; end if;

  select * into v_payment
  from public.payments as pay
  where pay.order_id = p_order_id
    and pay.provider = 'razorpay'
    and pay.provider_order_id = p_provider_order_id
  for update;
  if not found then raise exception 'Payment does not belong to this order' using errcode = '42501'; end if;

  if p_currency <> v_order.currency
    or p_amount_minor <> round(v_order.total * 100)::bigint then
    raise exception 'Payment amount or currency does not match order' using errcode = '22023';
  end if;

  if v_order.status = 'confirmed' and v_payment.provider_payment_id = p_provider_payment_id then
    return;
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Checkout order is no longer payable' using errcode = 'P0001';
  end if;

  update public.payments as pay
  set provider_payment_id = p_provider_payment_id, status = 'paid',
      paid_at = timezone('utc', now()), updated_at = timezone('utc', now())
  where pay.id = v_payment.id;

  update public.orders as o
  set status = 'confirmed', placed_at = timezone('utc', now()),
      checkout_expires_at = null, updated_at = timezone('utc', now())
  where o.id = p_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, note)
  values (p_order_id, 'pending', 'confirmed', 'Razorpay payment captured');

  -- Remove only unchanged cart lines represented by this order.
  delete from public.cart_items as ci
  using public.carts as c, public.order_items as oi
  where c.user_id = v_order.user_id
    and ci.cart_id = c.id
    and oi.order_id = p_order_id
    and ci.variant_id = oi.variant_id
    and ci.quantity = oi.quantity;
end;
$$;

revoke execute on function public.create_checkout_order(uuid, uuid, jsonb, numeric, text, text, text) from public, anon, authenticated;
revoke execute on function public.cancel_checkout_order(uuid) from public, anon, authenticated;
revoke execute on function public.confirm_checkout_payment(uuid, text, text, bigint, text) from public, anon, authenticated;
grant execute on function public.create_checkout_order(uuid, uuid, jsonb, numeric, text, text, text) to service_role;
grant execute on function public.cancel_checkout_order(uuid) to service_role;
grant execute on function public.confirm_checkout_payment(uuid, text, text, bigint, text) to service_role;
