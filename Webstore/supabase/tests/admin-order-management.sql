-- Run on a disposable local database after baseline, Phase 3 RLS, checkout,
-- and 20261020100000_admin_order_management.sql. All fixtures roll back.
begin;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'Assertion failed: %', label; end if; end;
$$;
create function pg_temp.expect_forbidden(statement text) returns void language plpgsql as $$
begin
  begin execute statement; exception when insufficient_privilege then return; end;
  raise exception 'Expected access denial: %', statement;
end;
$$;
insert into auth.users(id,email) values
 ('eeeeeeee-0000-4000-8000-000000000001','orders-admin@example.invalid'),
 ('eeeeeeee-0000-4000-8000-000000000002','orders-customer-a@example.invalid'),
 ('eeeeeeee-0000-4000-8000-000000000003','orders-customer-b@example.invalid'),
 ('eeeeeeee-0000-4000-8000-000000000004','orders-manager@example.invalid');
insert into public.profiles(id,role,full_name,phone) values
 ('eeeeeeee-0000-4000-8000-000000000001','admin','Order admin',null),
 ('eeeeeeee-0000-4000-8000-000000000002','customer','Current customer name','9999999901'),
 ('eeeeeeee-0000-4000-8000-000000000003','customer','Second customer','9999999902'),
 ('eeeeeeee-0000-4000-8000-000000000004','manager','Order manager',null)
on conflict(id) do update set role=excluded.role,full_name=excluded.full_name,phone=excluded.phone;
insert into public.products(id,name,slug) values ('eeeeeeee-1000-4000-8000-000000000001','Current product name','admin-order-test-product');
insert into public.orders(id,user_id,status,subtotal,shipping_total,total,shipping_address_snapshot,created_at) values
 ('eeeeeeee-2000-4000-8000-000000000001','eeeeeeee-0000-4000-8000-000000000002','confirmed',1000,200,1200,'{"recipient_name":"Original recipient","phone":"8888888888","line1":"Historical street","city":"Delhi","state":"Delhi","postal_code":"110001","country_code":"IN"}','2026-10-19T18:30:00Z'),
 ('eeeeeeee-2000-4000-8000-000000000002','eeeeeeee-0000-4000-8000-000000000003','pending',500,0,500,'{"recipient_name":"Second recipient","line1":"Other street"}','2026-10-20T18:30:00Z');
insert into public.order_items(order_id,product_id,product_name,variant_name,sku,unit_price,quantity) values
 ('eeeeeeee-2000-4000-8000-000000000001','eeeeeeee-1000-4000-8000-000000000001','Historical product name','Historical option','HISTORICAL-SKU',500,2);
insert into public.payments(order_id,provider,status,amount,provider_payment_id) values
 ('eeeeeeee-2000-4000-8000-000000000001','razorpay','failed',1200,'admin-order-test-failed'),
 ('eeeeeeee-2000-4000-8000-000000000001','razorpay','paid',1200,'admin-order-test-paid'),
 ('eeeeeeee-2000-4000-8000-000000000002','razorpay','pending',500,'admin-order-test-pending');
insert into public.orders(user_id,status,subtotal,total,shipping_address_snapshot,created_at)
 select 'eeeeeeee-0000-4000-8000-000000000002','pending',10+n,10+n,'{}'::jsonb,'2026-10-01T00:00:00Z'::timestamptz from generate_series(1,21) n;
insert into public.addresses(user_id,recipient_name,phone,line1,city,state,postal_code)
 values('eeeeeeee-0000-4000-8000-000000000002','Current recipient','9999999901','Changed current address','Mumbai','Maharashtra','400001');

set local role authenticated;
select set_config('request.jwt.claim.sub','eeeeeeee-0000-4000-8000-000000000001',true);
do $$ declare result jsonb; detail jsonb; first_page jsonb; second_page jsonb; begin
  result := public.admin_order_list();
  perform pg_temp.assert_true((result->>'total_count')::int=23,'total counts orders, not payment attempts');
  perform pg_temp.assert_true(jsonb_array_length(result->'orders')=20,'bounded first page');
  first_page := result;
  second_page := public.admin_order_list(p_page=>2);
  perform pg_temp.assert_true(jsonb_array_length(second_page->'orders')=3,'second page');
  perform pg_temp.assert_true(not exists(select 1 from jsonb_array_elements(first_page->'orders') a join jsonb_array_elements(second_page->'orders') b on a->>'id'=b->>'id'),'stable pages do not overlap');
  perform pg_temp.assert_true((public.admin_order_list(p_payment=>'paid')->>'total_count')::int=1,'payment filter does not duplicate orders');
  perform pg_temp.assert_true((public.admin_order_list(p_payment=>'none')->>'total_count')::int=21,'missing-payment filter');
  perform pg_temp.assert_true((public.admin_order_list(p_status=>'confirmed')->>'total_count')::int=1,'order status filter');
  perform pg_temp.assert_true((public.admin_order_list(p_from=>'2026-10-20',p_to=>'2026-10-20')->>'total_count')::int=1,'IST day inclusive start and exclusive following midnight');
  perform pg_temp.assert_true((public.admin_order_list(p_customer=>'eeeeeeee-0000-4000-8000-000000000003')->>'total_count')::int=1,'customer ID filter');
  perform pg_temp.assert_true((public.admin_order_list(p_search=>'original recipient')->>'total_count')::int=1,'search stored recipient');
  perform pg_temp.assert_true(exists(select 1 from jsonb_array_elements(public.admin_order_list(p_search=>(select '#' || order_number::text from public.orders where id='eeeeeeee-2000-4000-8000-000000000001'))->'orders') r where r->>'id'='eeeeeeee-2000-4000-8000-000000000001'),'search displayed order number with hash prefix');
  perform pg_temp.assert_true((public.admin_order_list(p_search=>'%')->>'total_count')::int=0,'search wildcard treated literally');
  perform pg_temp.assert_true(public.admin_order_list(p_sort=>'total_desc')->'orders'->0->>'id'='eeeeeeee-2000-4000-8000-000000000001','numeric total sorting');
  perform pg_temp.assert_true((public.admin_order_list(p_number=>(select order_number::text from public.orders where id='eeeeeeee-2000-4000-8000-000000000001'))->>'total_count')::int=1,'exact order number filter');
  detail := public.admin_order_detail('eeeeeeee-2000-4000-8000-000000000001');
  perform pg_temp.assert_true(detail->'shipping_address_snapshot'->>'line1'='Historical street','address comes from order snapshot, not changed address');
  perform pg_temp.assert_true(detail->'customer'->>'full_name'='Current customer name','customer profile shown separately');
  perform pg_temp.assert_true(detail->'items'->0->>'product_name'='Historical product name','item name not reconstructed from current catalog');
  perform pg_temp.assert_true((detail->'items'->0->>'line_total')::numeric=1000,'historical line price');
  perform pg_temp.assert_true(jsonb_array_length(detail->'payments')=2,'all payment attempts');
  perform pg_temp.assert_true(public.admin_order_detail('eeeeeeee-ffff-4000-8000-000000000001') is null,'missing order');
  begin perform public.admin_order_list(p_sort=>'total;drop'); raise exception 'invalid sort accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.admin_order_list(p_from=>'2026-10-21',p_to=>'2026-10-20'); raise exception 'invalid range accepted'; exception when invalid_parameter_value then null; end;
end $$;

-- Neither list nor detail can be used as a customer-side back door.
select set_config('request.jwt.claim.sub','eeeeeeee-0000-4000-8000-000000000002',true);
select pg_temp.expect_forbidden('select public.admin_order_list()');
select pg_temp.expect_forbidden($q$select public.admin_order_detail('eeeeeeee-2000-4000-8000-000000000002')$q$);
select pg_temp.expect_forbidden($q$select public.admin_order_detail('eeeeeeee-2000-4000-8000-000000000001')$q$);
select pg_temp.assert_true(not exists(select 1 from public.orders where id='eeeeeeee-2000-4000-8000-000000000002'),'customer cannot select another customer order through RLS');
select pg_temp.assert_true(exists(select 1 from public.orders where id='eeeeeeee-2000-4000-8000-000000000001'),'existing customer own-order access is preserved');
select pg_temp.assert_true(not exists(select 1 from public.payments where order_id='eeeeeeee-2000-4000-8000-000000000002'),'other customer payments remain private');
select set_config('request.jwt.claim.sub','eeeeeeee-0000-4000-8000-000000000004',true);
select pg_temp.expect_forbidden('select public.admin_order_list()');
reset role;
set local role anon;
select pg_temp.expect_forbidden('select public.admin_order_list()');
select pg_temp.expect_forbidden($q$select public.admin_order_detail('eeeeeeee-2000-4000-8000-000000000001')$q$);
reset role;
rollback;
