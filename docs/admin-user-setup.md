# Admin + End-user setup (Supabase)

This project uses Supabase Auth for authentication and a `user_roles` table (in public schema) to control authorization (admin vs officer/end-user).

## 1) Create two users in Supabase Auth

Supabase Dashboard → Authentication → Users → **Add user**

Create:

- Admin user (email/password)
- End-user/officer (email/password)

After creating them, copy each user’s **UUID** from the Users table:

- `ADMIN_USER_ID` (uuid)
- `END_USER_ID` (uuid)

## 2) Verify required tables exist

In Supabase SQL Editor, run:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('user_roles')
order by table_name, ordinal_position;
```

If `user_roles` does not exist, you must create it (see `docs/sql/assign-roles.sql` for a template).

## 3) Assign roles using SQL

Open and run: `docs/sql/assign-roles.sql`

Steps inside that file:

- paste `ADMIN_USER_ID` and `END_USER_ID`
- choose the correct INSERT statements that match your table columns
- run the script

## 4) Confirm in the app

- Sign in as admin → admin-only actions should be available.
- Sign in as end-user/officer → restricted actions should be blocked.

## Notes / safety

- Do not commit any credentials or `.env.local`.
- Role changes are DB state; the SQL script is committed to keep changes reproducible.
