-- Repair the manually configured Phase 3 cart_items access rules.
-- Run in the Supabase SQL Editor as project owner. RLS remains enabled; each
-- authenticated customer can only access items in their own cart.

begin;

alter table public.cart_items enable row level security;

grant select on public.carts to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;

drop policy if exists "Users can view own cart items" on public.cart_items;
drop policy if exists "Users can add own cart items" on public.cart_items;
drop policy if exists "Users can update own cart items" on public.cart_items;
drop policy if exists "Users can delete own cart items" on public.cart_items;

create policy "Users can view own cart items"
on public.cart_items
for select
to authenticated
using (
  exists (
    select 1
    from public.carts as c
    where c.id = cart_items.cart_id
      and c.user_id = (select auth.uid())
  )
);

create policy "Users can add own cart items"
on public.cart_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.carts as c
    where c.id = cart_items.cart_id
      and c.user_id = (select auth.uid())
  )
);

create policy "Users can update own cart items"
on public.cart_items
for update
to authenticated
using (
  exists (
    select 1
    from public.carts as c
    where c.id = cart_items.cart_id
      and c.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.carts as c
    where c.id = cart_items.cart_id
      and c.user_id = (select auth.uid())
  )
);

create policy "Users can delete own cart items"
on public.cart_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.carts as c
    where c.id = cart_items.cart_id
      and c.user_id = (select auth.uid())
  )
);

commit;

-- Confirm the four customer-scoped policies are present. This query does not
-- expose cart data or user identifiers.
select policyname, permissive, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'cart_items'
order by cmd, policyname;
