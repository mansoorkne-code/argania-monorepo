-- Promote the existing profile to an administrator.
-- Run this in the Supabase SQL Editor as a project owner.

begin;

do $$
declare
  changed_rows integer;
begin
  update public.profiles
  set role = 'admin'::public.app_role,
      updated_at = timezone('utc', now())
  where id = 'da0ad1a6-c378-461f-98a2-5c4a1467c572'::uuid;

  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception 'Expected to update one profile for user %, updated % rows.',
      'da0ad1a6-c378-461f-98a2-5c4a1467c572', changed_rows;
  end if;
end;
$$;

commit;

select id, role, full_name, updated_at
from public.profiles
where id = 'da0ad1a6-c378-461f-98a2-5c4a1467c572'::uuid;
