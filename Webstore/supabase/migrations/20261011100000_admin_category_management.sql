-- All category mutations and product assignments share a transaction lock.
-- This makes cycle/dependency checks safe against concurrent admin requests.
begin;

alter table public.products drop constraint products_category_id_fkey;
alter table public.products add constraint products_category_id_fkey
  foreign key (category_id) references public.categories(id) on delete restrict;

-- Existing slugs are preserved. Duplicate case variants must be resolved before applying.
create unique index categories_slug_case_insensitive_idx on public.categories (lower(slug));
alter table public.categories add constraint categories_slug_format
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 180) not valid;

create function public.category_management_lock()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(20261011, 1);
  return null;
end;
$$;
create trigger category_management_write_lock before insert or update or delete
on public.categories for each statement execute function public.category_management_lock();
create trigger category_management_product_lock before insert or update
on public.products for each statement execute function public.category_management_lock();

create function public.category_management_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare parent_status text;
begin
  if new.parent_id is not null then
    if new.parent_id = new.id or exists (
      with recursive ancestors as (
        select id, parent_id from public.categories where id = new.parent_id
        union
        select c.id, c.parent_id from public.categories c join ancestors a on c.id = a.parent_id
      ) select 1 from ancestors where id = new.id
    ) then
      raise exception using errcode = '23514', message = 'category_cycle';
    end if;
    select status into parent_status from public.categories where id = new.parent_id;
    if parent_status is null or (new.status <> 'archived' and parent_status = 'archived')
      or (new.status = 'active' and parent_status <> 'active') then
      raise exception using errcode = '23514', message = 'category_parent_unavailable';
    end if;
  end if;
  if new.status <> 'active' and (
    exists (select 1 from public.products where category_id = new.id and status = 'active')
    or exists (select 1 from public.categories where parent_id = new.id and
      (status = 'active' or (new.status = 'archived' and status <> 'archived')))
  ) then
    raise exception using errcode = '23514', message = 'category_dependencies';
  end if;
  return new;
end;
$$;
create trigger category_management_validate before insert or update
on public.categories for each row execute function public.category_management_guard();

create function public.category_management_product_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.category_id is not null and new.status = 'active' and not exists (
    select 1 from public.categories where id = new.category_id and status = 'active'
  ) then
    raise exception using errcode = '23514', message = 'category_parent_unavailable';
  end if;
  return new;
end;
$$;
create trigger category_management_validate_product before insert or update
on public.products for each row execute function public.category_management_product_guard();

-- The functions check the caller's identity, including when called directly through REST.
create function public.category_management_role()
returns text language sql stable security definer set search_path = '' as $$
  select role::text from public.profiles where id = (select auth.uid());
$$;
revoke all on function public.category_management_role() from public, anon;
grant execute on function public.category_management_role() to authenticated;

alter table public.categories enable row level security;
create policy "Category management staff read" on public.categories for select to authenticated
  using ((select public.category_management_role()) in ('admin', 'manager'));
create policy "Category management public read" on public.categories for select to anon, authenticated
  using (status = 'active');
grant select on public.categories to anon, authenticated;
-- Client writes use the explicitly authorized transactional RPCs below.
revoke insert, update, delete on public.categories from public, anon, authenticated;

create function public.admin_category_list()
returns table (id uuid, parent_id uuid, name text, slug text, description text, status text,
  product_count bigint, active_product_count bigint)
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(public.category_management_role(), '') not in ('admin', 'manager') then
    raise exception using errcode = '42501', message = 'category_forbidden';
  end if;
  return query select c.id, c.parent_id, c.name, c.slug, c.description, c.status,
    (select count(*) from public.products p where p.category_id = c.id),
    (select count(*) from public.products p where p.category_id = c.id and p.status = 'active')
    from public.categories c order by c.name;
end;
$$;

create function public.admin_save_category(p_id uuid, p_name text, p_slug text,
  p_description text, p_parent_id uuid, p_status text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare saved_id uuid;
begin
  if coalesce(public.category_management_role(), '') <> 'admin' then
    raise exception using errcode = '42501', message = 'category_forbidden';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(20261011, 1);
  if p_name is null or char_length(trim(p_name)) not between 1 and 180
    or p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(p_slug) > 180
    or coalesce(char_length(p_description), 0) > 5000
    or p_status is null or p_status not in ('draft', 'active', 'archived') then
    raise exception using errcode = '23514', message = 'category_invalid_input';
  end if;
  if p_id is null then
    insert into public.categories (name, slug, description, parent_id, status)
      values (trim(p_name), p_slug, nullif(trim(p_description), ''), p_parent_id, p_status)
      returning id into saved_id;
  else
    update public.categories set name = trim(p_name), slug = p_slug,
      description = nullif(trim(p_description), ''), parent_id = p_parent_id, status = p_status
      where id = p_id returning id into saved_id;
    if saved_id is null then
      raise exception using errcode = 'P0002', message = 'category_not_found';
    end if;
  end if;
  return saved_id;
end;
$$;

create function public.admin_remove_category(p_id uuid, p_operation text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(public.category_management_role(), '') <> 'admin' then
    raise exception using errcode = '42501', message = 'category_forbidden';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(20261011, 1);
  if not exists (select 1 from public.categories where id = p_id) then
    raise exception using errcode = 'P0002', message = 'category_not_found';
  end if;
  if p_operation = 'archive' then
    update public.categories set status = 'archived' where id = p_id;
  elsif p_operation = 'delete' then
    if exists (select 1 from public.products where category_id = p_id)
      or exists (select 1 from public.categories where parent_id = p_id) then
      raise exception using errcode = '23514', message = 'category_dependencies';
    end if;
    delete from public.categories where id = p_id;
  else
    raise exception using errcode = '23514', message = 'category_invalid_operation';
  end if;
end;
$$;

revoke all on function public.category_management_lock() from public, anon, authenticated;
revoke all on function public.category_management_guard() from public, anon, authenticated;
revoke all on function public.category_management_product_guard() from public, anon, authenticated;
revoke all on function public.admin_category_list() from public, anon;
revoke all on function public.admin_save_category(uuid, text, text, text, uuid, text) from public, anon;
revoke all on function public.admin_remove_category(uuid, text) from public, anon;
grant execute on function public.admin_category_list() to authenticated;
grant execute on function public.admin_save_category(uuid, text, text, text, uuid, text) to authenticated;
grant execute on function public.admin_remove_category(uuid, text) to authenticated;
commit;
