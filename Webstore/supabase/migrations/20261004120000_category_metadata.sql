-- Add storefront metadata to the existing categories table.
-- image_path uses the configured public product-images storage bucket.
alter table public.categories
  add column if not exists image_path text,
  add column if not exists status text not null default 'active';

alter table public.categories
  drop constraint if exists categories_status_check;

alter table public.categories
  add constraint categories_status_check
  check (status in ('draft', 'active', 'archived'));

alter table public.categories
  drop constraint if exists categories_image_path_not_blank;

alter table public.categories
  add constraint categories_image_path_not_blank
  check (image_path is null or char_length(trim(image_path)) > 0);

create index if not exists categories_status_name_idx
  on public.categories (status, name);
