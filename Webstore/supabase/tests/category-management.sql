-- Run as the migration owner on a disposable database. Everything rolls back.
begin;
create function pg_temp.assert_true(value boolean, label text)
returns void language plpgsql as $$
begin
  if value is distinct from true then raise exception 'Assertion failed: %', label; end if;
end;
$$;
create function pg_temp.expect_error(statement text, expected text)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlerrm like '%' || expected || '%' then return; end if;
    raise exception 'Expected %, got %', expected, sqlerrm;
  end;
  raise exception 'Expected error: %', expected;
end;
$$;

insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000003');
insert into public.profiles (id, role) values
  ('00000000-0000-4000-8000-000000000001', 'admin'),
  ('00000000-0000-4000-8000-000000000002', 'manager'),
  ('00000000-0000-4000-8000-000000000003', 'customer')
  on conflict (id) do update set role = excluded.role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

-- RPCs execute under the caller's database role, not only as the owner.
set local role authenticated;
do $$
declare root_id uuid; child_id uuid; leaf_id uuid; draft_id uuid; archived_id uuid;
begin
  root_id := public.admin_save_category(null, 'Test root', 'cm-test-root', null, null, 'active');
  child_id := public.admin_save_category(null, 'Test child', 'cm-test-child', null, root_id, 'active');
  leaf_id := public.admin_save_category(null, 'Test leaf', 'cm-test-leaf', null, child_id, 'active');
  draft_id := public.admin_save_category(null, 'Test draft', 'cm-test-draft', null, null, 'draft');
  archived_id := public.admin_save_category(null, 'Test archived', 'cm-test-archived', null, null, 'archived');
  perform pg_temp.assert_true((select parent_id = child_id from public.admin_category_list() where id = leaf_id), 'three-level nesting');
  perform public.admin_save_category(leaf_id, 'Renamed leaf', 'cm-test-renamed-leaf', 'Updated', child_id, 'active');
  perform pg_temp.assert_true((select name = 'Renamed leaf' and description = 'Updated' from public.admin_category_list() where id = leaf_id), 'edit category');
  perform pg_temp.expect_error($q$select public.admin_save_category(null, 'Duplicate', 'cm-test-root', null, null, 'active')$q$, 'duplicate key');
  perform pg_temp.expect_error($q$select public.admin_save_category(null, 'Duplicate archive', 'cm-test-archived', null, null, 'active')$q$, 'duplicate key');
  perform pg_temp.expect_error($q$select public.admin_save_category(null, 'Bad slug', 'Bad--slug', null, null, 'active')$q$, 'category_invalid_input');
  perform pg_temp.expect_error(format('select public.admin_save_category(%L, ''Root'', ''cm-test-root'', null, %L, ''active'')', root_id, leaf_id), 'category_cycle');
  perform pg_temp.expect_error(format('select public.admin_save_category(%L, ''Child'', ''cm-test-child'', null, %L, ''active'')', child_id, child_id), 'category_cycle');
  perform pg_temp.expect_error(format('select public.admin_save_category(null, ''Invalid'', ''cm-test-invalid'', null, %L, ''active'')', draft_id), 'category_parent_unavailable');
  perform pg_temp.expect_error(format('select public.admin_save_category(null, ''Invalid'', ''cm-test-invalid'', null, %L, ''draft'')', archived_id), 'category_parent_unavailable');
  perform pg_temp.expect_error(format('select public.admin_save_category(null, ''Invalid'', ''cm-test-invalid'', null, %L, ''active'')', '00000000-0000-4000-8000-000000000099'), 'category_parent_unavailable');
  perform pg_temp.expect_error(format('select public.admin_remove_category(%L, ''archive'')', root_id), 'category_dependencies');
  perform pg_temp.expect_error(format('select public.admin_remove_category(%L, ''delete'')', root_id), 'category_dependencies');
  perform pg_temp.expect_error(format('select public.admin_save_category(%L, ''Root'', ''cm-test-root'', null, null, ''draft'')', root_id), 'category_dependencies');
  perform public.admin_remove_category(leaf_id, 'archive');
  perform public.admin_remove_category(child_id, 'archive');
  perform public.admin_remove_category(root_id, 'archive');
  perform pg_temp.assert_true((select count(*) = 3 from public.admin_category_list() where id in (root_id, child_id, leaf_id) and status = 'archived'), 'archive bottom-up');
  perform public.admin_save_category(root_id, 'Test root', 'cm-test-root', null, null, 'active');
  perform public.admin_save_category(child_id, 'Test child', 'cm-test-child', null, root_id, 'active');
  perform public.admin_save_category(leaf_id, 'Test leaf', 'cm-test-leaf', null, child_id, 'active');
  perform pg_temp.assert_true((select status = 'active' from public.admin_category_list() where id = leaf_id), 'restore top-down');
  perform public.admin_remove_category(leaf_id, 'delete');
  perform pg_temp.assert_true(not exists(select 1 from public.admin_category_list() where id = leaf_id), 'delete unreferenced category');
  perform pg_temp.expect_error(format('select public.admin_remove_category(%L, ''delete'')', leaf_id), 'category_not_found');
  perform pg_temp.expect_error(format('select public.admin_remove_category(%L, ''purge'')', root_id), 'category_invalid_operation');
end;
$$;
reset role;

-- Product dependencies and direct trusted SQL obey the same guards.
do $$
declare target uuid; product_id uuid;
begin
  target := public.admin_save_category(null, 'Products test', 'cm-test-products', null, null, 'active');
  insert into public.products(name, slug, category_id, status)
    values ('Dependency test', 'cm-test-product', target, 'active') returning id into product_id;
  perform pg_temp.assert_true((select product_count = 1 and active_product_count = 1 from public.admin_category_list() where id = target), 'accurate counts');
  perform pg_temp.expect_error(format('select public.admin_remove_category(%L, ''archive'')', target), 'category_dependencies');
  perform pg_temp.expect_error(format('select public.admin_remove_category(%L, ''delete'')', target), 'category_dependencies');
  perform pg_temp.expect_error(format('delete from public.categories where id = %L', target), 'foreign key');
  update public.products set status = 'archived' where id = product_id;
  perform public.admin_remove_category(target, 'archive');
  perform pg_temp.assert_true((select category_id = target from public.products where id = product_id), 'archiving preserves assignments');
  perform pg_temp.expect_error(format('update public.products set status = ''active'' where id = %L', product_id), 'category_parent_unavailable');
  perform pg_temp.expect_error(format('select public.admin_remove_category(%L, ''delete'')', target), 'category_dependencies');
  update public.products set category_id = null where id = product_id;
  perform public.admin_remove_category(target, 'delete');
end;
$$;

-- Case-insensitive uniqueness also reserves legacy mixed-case slugs.
do $$
begin
  alter table public.categories drop constraint categories_slug_format;
  insert into public.categories(name, slug) values ('Legacy slug', 'CM-test-legacy');
  perform pg_temp.expect_error($q$select public.admin_save_category(null, 'Collision', 'cm-test-legacy', null, null, 'active')$q$, 'duplicate key');
end;
$$;

select pg_temp.assert_true(not has_table_privilege('authenticated', 'public.categories', 'INSERT'), 'no direct category insert');
select pg_temp.assert_true(not has_table_privilege('authenticated', 'public.categories', 'UPDATE'), 'no direct category update');
select pg_temp.assert_true(not has_table_privilege('authenticated', 'public.categories', 'DELETE'), 'no direct category delete');
select pg_temp.assert_true(not has_function_privilege('anon', 'public.admin_category_list()', 'EXECUTE'), 'anonymous list forbidden');
select pg_temp.assert_true(not has_function_privilege('anon', 'public.admin_save_category(uuid,text,text,text,uuid,text)', 'EXECUTE'), 'anonymous save forbidden');
select pg_temp.assert_true(not has_function_privilege('anon', 'public.admin_remove_category(uuid,text)', 'EXECUTE'), 'anonymous delete forbidden');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select pg_temp.assert_true((select count(*) > 0 from public.admin_category_list()), 'manager can read');
select pg_temp.expect_error($q$select public.admin_save_category(null, 'No', 'cm-test-no', null, null, 'active')$q$, 'category_forbidden');
select pg_temp.expect_error($q$select public.admin_remove_category('00000000-0000-4000-8000-000000000099', 'delete')$q$, 'category_forbidden');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select pg_temp.expect_error('select * from public.admin_category_list()', 'category_forbidden');
select pg_temp.expect_error($q$select public.admin_save_category(null, 'No', 'cm-test-no', null, null, 'active')$q$, 'category_forbidden');
select pg_temp.assert_true(not exists(select 1 from public.categories where status <> 'active'), 'customer sees only active categories');
reset role;
rollback;
