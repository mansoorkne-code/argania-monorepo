-- Public storefront reads use getPublicUrl; all bucket mutations require admin.
alter table public.product_images enable row level security;

drop policy if exists "Public can view images" on public.product_images;
create policy "Public can view images"
on public.product_images
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage product images" on public.product_images;
create policy "Admins can manage product images"
on public.product_images
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant select on public.product_images to anon, authenticated;
grant select, insert, update, delete on public.product_images to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view product image objects" on storage.objects;
create policy "Public can view product image objects"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product image objects" on storage.objects;
create policy "Admins can upload product image objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (select public.is_admin())
);

drop policy if exists "Admins can update product image objects" on storage.objects;
create policy "Admins can update product image objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and (select public.is_admin())
)
with check (
  bucket_id = 'product-images'
  and (select public.is_admin())
);

drop policy if exists "Admins can delete product image objects" on storage.objects;
create policy "Admins can delete product image objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (select public.is_admin())
);

grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;

create or replace function public.reorder_product_images(
  p_product_id uuid,
  p_image_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  matched_count integer;
  product_image_count integer;
begin
  if p_image_ids is null
     or cardinality(p_image_ids) = 0
     or cardinality(p_image_ids) <> (
       select count(distinct id) from unnest(p_image_ids) as items(id)
     ) then
    raise exception 'Invalid product image order.' using errcode = '22023';
  end if;

  select count(*) into product_image_count
  from public.product_images
  where product_id = p_product_id;

  if product_image_count <> cardinality(p_image_ids) then
    raise exception 'Image order must include every image for this product.' using errcode = '22023';
  end if;

  select count(*) into matched_count
  from public.product_images
  where product_id = p_product_id
    and id = any(p_image_ids);

  if matched_count <> cardinality(p_image_ids) then
    raise exception 'Image order does not match this product.' using errcode = '22023';
  end if;

  update public.product_images as image
  set position = ordered.position - 1
  from unnest(p_image_ids) with ordinality as ordered(id, position)
  where image.id = ordered.id
    and image.product_id = p_product_id;
end;
$$;

revoke all on function public.reorder_product_images(uuid, uuid[]) from public;
grant execute on function public.reorder_product_images(uuid, uuid[]) to authenticated;
