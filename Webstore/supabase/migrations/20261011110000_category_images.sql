-- One cover image per category, using the existing product-images bucket.
-- Apply after admin_category_management and product_image_storage.
begin;
alter table public.categories add column image_alt text;
alter table public.categories add constraint categories_image_alt_length
  check (image_alt is null or char_length(image_alt) <= 250);

-- Return the cover image alongside the category hierarchy.
drop function public.admin_category_list();
create function public.admin_category_list()
returns table (id uuid, parent_id uuid, name text, slug text, description text, status text,
  product_count bigint, active_product_count bigint, image_path text, image_alt text)
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(public.category_management_role(), '') not in ('admin', 'manager') then
    raise exception using errcode = '42501', message = 'category_forbidden';
  end if;
  return query select c.id, c.parent_id, c.name, c.slug, c.description, c.status,
    (select count(*) from public.products p where p.category_id = c.id),
    (select count(*) from public.products p where p.category_id = c.id and p.status = 'active'),
    c.image_path, c.image_alt from public.categories c order by c.name;
end;
$$;
revoke all on function public.admin_category_list() from public, anon;
grant execute on function public.admin_category_list() to authenticated;

create function public.admin_set_category_image(p_id uuid, p_path text, p_alt_text text,
  p_expected_path text, p_bucket text default 'product-images')
returns void language plpgsql security definer set search_path = '' as $$
declare current_path text;
begin
  if coalesce(public.category_management_role(), '') <> 'admin' then
    raise exception using errcode = '42501', message = 'category_forbidden';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(20261011, 1);
  select image_path into current_path from public.categories where id = p_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'category_not_found';
  end if;
  if current_path is distinct from p_expected_path then
    raise exception using errcode = '23514', message = 'category_image_conflict';
  end if;
  if coalesce(char_length(p_alt_text), 0) > 250 then
    raise exception using errcode = '23514', message = 'category_image_invalid';
  end if;
  -- Alt-only changes and clearing legacy/shared paths preserve existing assets.
  if p_path is not null and p_path is distinct from current_path then
    if p_path !~ ('^categories/' || p_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp|avif)$')
      or not exists (
        select 1 from storage.objects o join storage.buckets b on b.id = o.bucket_id
        where o.bucket_id = p_bucket and b.public and o.name = p_path
          and o.metadata->>'mimetype' in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')
          and case when coalesce(o.metadata->>'size', '') ~ '^[0-9]+$'
            then (o.metadata->>'size')::numeric between 1 and 10485760 else false end
      ) then
      raise exception using errcode = '23514', message = 'category_image_missing';
    end if;
  end if;
  update public.categories set image_path = p_path,
    image_alt = case when p_path is null then null else nullif(trim(p_alt_text), '') end
    where id = p_id;
end;
$$;
revoke all on function public.admin_set_category_image(uuid,text,text,text,text) from public, anon;
grant execute on function public.admin_set_category_image(uuid,text,text,text,text) to authenticated;

create function public.admin_category_image_cleanup_allowed(p_id uuid, p_path text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(public.category_management_role(), '') <> 'admin' then
    raise exception using errcode = '42501', message = 'category_forbidden';
  end if;
  return p_path ~ ('^categories/' || p_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp|avif)$')
    and not exists(select 1 from public.categories where image_path = p_path)
    and not exists(select 1 from public.product_images where storage_path = p_path);
end;
$$;
revoke all on function public.admin_category_image_cleanup_allowed(uuid,text) from public, anon;
grant execute on function public.admin_category_image_cleanup_allowed(uuid,text) to authenticated;

-- Never orphan a cover image by deleting the category before removing its image.
create function public.category_image_delete_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.image_path is not null then
    raise exception using errcode = '23514', message = 'category_image_dependency';
  end if;
  return old;
end;
$$;
create trigger category_image_delete_check before delete on public.categories
for each row execute function public.category_image_delete_guard();
revoke all on function public.category_image_delete_guard() from public, anon, authenticated;

-- Existing product-image policies remain in force. These add explicit category
-- upload/read/delete rights for admins, including if other catalog policies differ.
create policy "Admins upload category images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and name ~ '^categories/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|avif)$'
  and (select public.category_management_role()) = 'admin'
  and exists(select 1 from public.categories c where c.id::text = split_part(name, '/', 2)));
create policy "Admins inspect category images" on storage.objects for select to authenticated
using (bucket_id = 'product-images' and name like 'categories/%'
  and (select public.category_management_role()) = 'admin');
create policy "Admins clean up category images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and name like 'categories/%'
  and (select public.category_management_role()) = 'admin'
  and not exists(select 1 from public.categories c where c.image_path = name)
  and not exists(select 1 from public.product_images p where p.storage_path = name));
commit;
