begin;
create function pg_temp.assert_true(value boolean, label text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'Assertion failed: %', label; end if; end; $$;
create function pg_temp.expect_error(statement text, expected text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if sqlerrm like '%' || expected || '%' then return; end if;
    raise exception 'Expected %, got %', expected, sqlerrm;
  end;
  raise exception 'Expected error: %', expected;
end; $$;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000011'), ('00000000-0000-4000-8000-000000000012'), ('00000000-0000-4000-8000-000000000013');
insert into public.profiles(id,role) values
 ('00000000-0000-4000-8000-000000000011','admin'), ('00000000-0000-4000-8000-000000000012','manager'), ('00000000-0000-4000-8000-000000000013','customer')
 on conflict (id) do update set role=excluded.role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000011',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000011","role":"authenticated"}',true);
insert into public.categories(id,name,slug,status) values ('00000000-0000-4000-8000-000000000014','Image test','category-image-test','active');
insert into storage.objects(bucket_id,name,metadata) values
 ('product-images','categories/00000000-0000-4000-8000-000000000014/00000000-0000-4000-8000-000000000015.jpg','{"mimetype":"image/jpeg","size":1024}'),
 ('product-images','categories/00000000-0000-4000-8000-000000000014/00000000-0000-4000-8000-000000000016.webp','{"mimetype":"image/webp","size":10485760}'),
 ('product-images','categories/00000000-0000-4000-8000-000000000014/00000000-0000-4000-8000-000000000017.png','{"mimetype":"image/png","size":10485761}'),
 ('product-images','categories/00000000-0000-4000-8000-000000000014/00000000-0000-4000-8000-000000000018.jpg','{"mimetype":"text/html","size":1024}');
set local role authenticated;
do $$
declare target_id uuid := '00000000-0000-4000-8000-000000000014';
 path text := 'categories/00000000-0000-4000-8000-000000000014/00000000-0000-4000-8000-000000000015.jpg';
 replacement text := 'categories/00000000-0000-4000-8000-000000000014/00000000-0000-4000-8000-000000000016.webp';
begin
 perform public.admin_set_category_image(target_id,path,'Cover',null);
 perform pg_temp.assert_true((select image_path=path and image_alt='Cover' from public.admin_category_list() where admin_category_list.id=target_id), 'image and alt saved');
 perform pg_temp.assert_true(not public.admin_category_image_cleanup_allowed(target_id,path), 'referenced image protected');
 perform pg_temp.expect_error(format('select public.admin_set_category_image(%L,%L,''Wrong'',null)',target_id,replacement),'category_image_conflict');
 perform pg_temp.expect_error(format('select public.admin_remove_category(%L,''delete'')',target_id),'category_image_dependency');
 perform public.admin_set_category_image(target_id,path,'Updated alt',path);
 perform pg_temp.assert_true((select image_alt='Updated alt' from public.admin_category_list() where admin_category_list.id=target_id),'alt-only edit');
 perform pg_temp.expect_error(format('select public.admin_set_category_image(%L,%L,''Alt'',%L)',target_id,'categories/00000000-0000-4000-8000-000000000014/00000000-0000-4000-8000-000000000017.png',path),'category_image_missing');
 perform pg_temp.expect_error(format('select public.admin_set_category_image(%L,%L,''Alt'',%L)',target_id,'categories/00000000-0000-4000-8000-000000000014/00000000-0000-4000-8000-000000000018.jpg',path),'category_image_missing');
 perform pg_temp.expect_error(format('select public.admin_set_category_image(%L,%L,''Alt'',%L)',target_id,'categories/00000000-0000-4000-8000-000000000014/00000000-0000-4000-8000-000000000019.jpg',path),'category_image_missing');
 perform pg_temp.expect_error(format('select public.admin_set_category_image(%L,%L,''Alt'',%L)',target_id,'assets/shared.webp',path),'category_image_missing');
 perform pg_temp.expect_error(format('select public.admin_set_category_image(%L,%L,%L,%L)',target_id,path,repeat('x',251),path),'category_image_invalid');
 perform public.admin_set_category_image(target_id,replacement,'Replacement',path);
 perform pg_temp.assert_true(public.admin_category_image_cleanup_allowed(target_id,path),'replaced file eligible for cleanup');
 perform pg_temp.assert_true(not public.admin_category_image_cleanup_allowed(target_id,replacement),'replacement file protected');
 perform public.admin_set_category_image(target_id,null,null,replacement);
 perform pg_temp.assert_true((select image_path is null and image_alt is null from public.admin_category_list() where admin_category_list.id=target_id),'remove clears metadata');
end; $$;
reset role;
-- Shared legacy/reference images can be edited and detached, never cleaned up.
update public.categories set image_path='assets/shared.webp' where id='00000000-0000-4000-8000-000000000014';
set local role authenticated;
select public.admin_set_category_image('00000000-0000-4000-8000-000000000014','assets/shared.webp','Legacy alt','assets/shared.webp');
select public.admin_set_category_image('00000000-0000-4000-8000-000000000014',null,null,'assets/shared.webp');
select pg_temp.assert_true(not public.admin_category_image_cleanup_allowed('00000000-0000-4000-8000-000000000014','assets/shared.webp'),'shared asset protected');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000012',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000012","role":"authenticated"}',true);
select pg_temp.expect_error($q$select public.admin_set_category_image('00000000-0000-4000-8000-000000000014',null,null,null)$q$,'category_forbidden');
select pg_temp.expect_error($q$select public.admin_category_image_cleanup_allowed('00000000-0000-4000-8000-000000000014','assets/shared.webp')$q$,'category_forbidden');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000013',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000013","role":"authenticated"}',true);
select pg_temp.expect_error($q$select public.admin_set_category_image('00000000-0000-4000-8000-000000000014',null,null,null)$q$,'category_forbidden');
reset role;
select pg_temp.assert_true(not has_function_privilege('anon','public.admin_set_category_image(uuid,text,text,text,text)','execute'),'anonymous mutation forbidden');
rollback;
