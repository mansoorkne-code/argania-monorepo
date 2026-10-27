-- Read-only order management. Apply after Phase 3 RLS and Phase 9 checkout.
begin;

-- Only the role lookup uses SECURITY DEFINER, to avoid recursive profile RLS.
-- The list/detail functions remain SECURITY INVOKER and obey table RLS.
create function public.admin_can_read_orders()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.admin_can_read_orders() from public, anon;
grant execute on function public.admin_can_read_orders() to authenticated;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.profiles enable row level security;
create policy "Order management admin orders read" on public.orders for select to authenticated
  using ((select public.admin_can_read_orders()));
create policy "Order management admin items read" on public.order_items for select to authenticated
  using ((select public.admin_can_read_orders()));
create policy "Order management admin payments read" on public.payments for select to authenticated
  using ((select public.admin_can_read_orders()));
create policy "Order management admin customers read" on public.profiles for select to authenticated
  using ((select public.admin_can_read_orders()));
grant select on public.orders, public.order_items, public.payments, public.profiles to authenticated;

create index if not exists orders_created_id_idx on public.orders(created_at desc, id desc);
create index if not exists payments_status_order_idx on public.payments(status, order_id);

create function public.admin_order_list(
  p_search text default '', p_status text default '', p_payment text default '',
  p_from date default null, p_to date default null, p_customer text default '',
  p_number text default '', p_sort text default 'newest', p_page integer default 1
) returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
  if not public.admin_can_read_orders() then
    raise exception using errcode = '42501', message = 'admin_orders_forbidden';
  end if;
  if p_search is null or p_customer is null or p_number is null or p_page is null
    or length(p_search) > 100 or length(p_customer) > 100
    or p_number !~ '^([0-9]{1,19})?$'
    or p_status is null or p_status not in ('','pending','confirmed','processing','shipped','delivered','cancelled','refund_requested','refunded')
    or p_payment is null or p_payment not in ('','none','pending','authorized','paid','failed','refunded','partially_refunded','cancelled')
    or p_sort is null or p_sort not in ('newest','oldest','total_desc','total_asc','number_desc','number_asc')
    or p_page < 1 or p_page > 1000000 or (p_from is not null and p_to is not null and p_from > p_to)
  then raise exception using errcode = '22023', message = 'admin_orders_invalid_filters'; end if;

  with filtered as (
    select o.id, o.order_number, o.user_id, o.status, o.currency, o.total, o.created_at,
      coalesce(nullif(trim(p.full_name), ''), nullif(o.shipping_address_snapshot->>'recipient_name', '')) as customer_name,
      coalesce(nullif(trim(p.phone), ''), nullif(o.shipping_address_snapshot->>'phone', '')) as customer_phone
    from public.orders o left join public.profiles p on p.id = o.user_id
    where (p_status = '' or o.status::text = p_status)
      and (p_number = '' or o.order_number::text = ltrim(p_number, '0'))
      and (p_from is null or o.created_at >= (p_from::timestamp at time zone 'Asia/Kolkata'))
      and (p_to is null or o.created_at < ((p_to + 1)::timestamp at time zone 'Asia/Kolkata'))
      and (p_customer = '' or strpos(lower(concat_ws(' ',p.full_name,p.phone,o.user_id::text,o.shipping_address_snapshot->>'recipient_name',o.shipping_address_snapshot->>'phone')),lower(p_customer)) > 0)
      and (p_search = '' or strpos(lower(concat_ws(' ',o.order_number::text,'#' || o.order_number::text,o.id::text,p.full_name,p.phone,o.shipping_address_snapshot->>'recipient_name',o.shipping_address_snapshot->>'phone')),lower(p_search)) > 0)
      and (p_payment = '' or (p_payment = 'none' and not exists(select 1 from public.payments pay where pay.order_id = o.id))
        or exists(select 1 from public.payments pay where pay.order_id = o.id and pay.status::text = p_payment))
  ), page_rows as (
    select * from filtered order by
      case when p_sort = 'newest' then created_at end desc,
      case when p_sort = 'oldest' then created_at end asc,
      case when p_sort = 'total_desc' then total end desc,
      case when p_sort = 'total_asc' then total end asc,
      case when p_sort = 'number_desc' then order_number end desc,
      case when p_sort = 'number_asc' then order_number end asc,
      id desc
    limit 20 offset (p_page - 1) * 20
  )
  select jsonb_build_object(
    'total_count', (select count(*) from filtered),
    'orders', coalesce((select jsonb_agg(to_jsonb(r) || jsonb_build_object(
      'order_number',r.order_number::text,
      'payment_statuses',coalesce((select jsonb_agg(s.status order by s.status) from
        (select distinct pay.status::text as status from public.payments pay where pay.order_id = r.id) s),'[]'::jsonb)
    )) from page_rows r),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;

create function public.admin_order_detail(p_id uuid)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
  if not public.admin_can_read_orders() then
    raise exception using errcode = '42501', message = 'admin_orders_forbidden';
  end if;
  select jsonb_build_object(
    'id',o.id,'order_number',o.order_number::text,'user_id',o.user_id,
    'status',o.status,'currency',o.currency,'created_at',o.created_at,'placed_at',o.placed_at,
    'subtotal',o.subtotal,'discount_total',o.discount_total,'shipping_total',o.shipping_total,
    'tax_total',o.tax_total,'total',o.total,'shipping_address_snapshot',o.shipping_address_snapshot,
    'shipping_provider',o.shipping_provider,'shipping_courier_name',o.shipping_courier_name,
    'customer',jsonb_build_object('full_name',p.full_name,'phone',p.phone),
    'items',coalesce((select jsonb_agg(jsonb_build_object(
      'id',i.id,'product_name',i.product_name,'variant_name',i.variant_name,'sku',i.sku,
      'quantity',i.quantity,'unit_price',i.unit_price,'line_total',i.line_total
    ) order by i.created_at,i.id) from public.order_items i where i.order_id = o.id),'[]'::jsonb),
    'payments',coalesce((select jsonb_agg(jsonb_build_object(
      'id',pay.id,'provider',pay.provider,'provider_order_id',pay.provider_order_id,
      'provider_payment_id',pay.provider_payment_id,'amount',pay.amount,'currency',pay.currency,
      'status',pay.status,'paid_at',pay.paid_at,'created_at',pay.created_at
    ) order by pay.created_at desc,pay.id desc) from public.payments pay where pay.order_id = o.id),'[]'::jsonb)
  ) into result from public.orders o left join public.profiles p on p.id = o.user_id where o.id = p_id;
  return result;
end;
$$;
revoke all on function public.admin_order_list(text,text,text,date,date,text,text,text,integer) from public, anon;
revoke all on function public.admin_order_detail(uuid) from public, anon;
grant execute on function public.admin_order_list(text,text,text,date,date,text,text,text,integer) to authenticated;
grant execute on function public.admin_order_detail(uuid) to authenticated;
commit;
