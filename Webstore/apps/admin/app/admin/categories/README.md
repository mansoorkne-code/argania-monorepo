# Category management

Routes: `/admin/categories`, `/admin/categories/new`, and `/admin/categories/[id]/edit`.
Admins can create, edit, reparent, archive, restore, and delete categories. Managers
can view the hierarchy and dependency counts. All writes use authenticated Supabase
RPCs with independent database role checks; no service-role key is used.

Apply `supabase/migrations/20261011100000_admin_category_management.sql` using the
normal reviewed migration workflow before using these screens. No remote database
is changed by adding this migration. Existing category slugs remain reserved,
including archived categories. If existing slugs differ only by case, resolve that
collision before applying the case-insensitive unique index.

An active category requires an active parent. Cycles are rejected by the database;
the selector also excludes self and descendants. Archived parents may retain
archived children. Moving an active category to draft requires resolving active
products and active children first. Archiving requires moving or archiving active
products and every unarchived direct child first (work from leaves upward).
Inactive product assignments remain intact. Restore using the editor.

Delete only when **all** product and child category references have been removed,
even if those dependencies are archived. The product foreign key now uses RESTRICT
instead of SET NULL so a concurrent or direct deletion cannot silently orphan a
product's category. No cascading deletes are performed. The UI requires a
confirmation for archive/delete and the database rechecks dependencies atomically.

Statement-level advisory locks serialize category changes and product inserts/
updates, including direct trusted database writes. The lock is held until commit,
so conflicting reparent/archive/assignment requests cannot both pass stale checks.
The SQL functions pin their search path and revoke anonymous/default execute
permissions. Existing catalog reads and image metadata are preserved.

Run unit tests with `node --experimental-strip-types --test apps/admin/tests/categories.test.mjs`
from `Webstore`. Database tests are in `supabase/tests/category-management.sql`; run
them on a disposable migrated database. The tests use transactions and roll back.
