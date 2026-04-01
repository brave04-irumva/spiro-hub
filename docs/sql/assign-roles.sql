-- SPIRO Hub: assign roles to two Supabase Auth users
-- Usage:
-- 1) Create the users in Supabase Dashboard -> Authentication -> Users
-- 2) Copy their UUIDs and paste them into the variables below
-- 3) Run this script in Supabase SQL editor

-- ---------------------------------------------------------------------
-- Step A: Inspect user_roles table schema (DO THIS FIRST)
-- ---------------------------------------------------------------------
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'user_roles'
order by ordinal_position;

-- ---------------------------------------------------------------------
-- Step B: (Optional) Create user_roles table if it doesn't exist
-- WARNING: Only run if your project truly does not have this table yet.
-- ---------------------------------------------------------------------
-- create table if not exists public.user_roles (
--   user_id uuid primary key references auth.users(id) on delete cascade,
--   role text not null check (role in ('admin', 'officer'))
-- );

-- ---------------------------------------------------------------------
-- Step C: Paste your two user IDs here
-- ---------------------------------------------------------------------
-- Replace the values below with real UUIDs from Supabase Auth users.
-- Example:
--   ADMIN_USER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
--   END_USER_ID   = 'ffffffff-1111-2222-3333-444444444444'

-- NOTE: SQL editor doesn't support variables in plain SQL consistently,
-- so we use CTE constants:

with ids as (
  select
    'ADMIN_USER_ID_HERE'::uuid as admin_user_id,
    'END_USER_ID_HERE'::uuid as end_user_id
)
select * from ids;

-- ---------------------------------------------------------------------
-- Step D: Assign roles (CHOOSE the variant that matches your columns)
-- ---------------------------------------------------------------------

-- Variant 1: Columns are (user_id, role)
-- with ids as (
--   select
--     'ADMIN_USER_ID_HERE'::uuid as admin_user_id,
--     'END_USER_ID_HERE'::uuid as end_user_id
-- )
-- insert into public.user_roles (user_id, role)
-- select admin_user_id, 'admin' from ids
-- on conflict (user_id) do update set role = excluded.role;
--
-- with ids as (
--   select
--     'ADMIN_USER_ID_HERE'::uuid as admin_user_id,
--     'END_USER_ID_HERE'::uuid as end_user_id
-- )
-- insert into public.user_roles (user_id, role)
-- select end_user_id, 'officer' from ids
-- on conflict (user_id) do update set role = excluded.role;

-- Variant 2: Columns are (id, user_id, role) and id is generated
-- insert into public.user_roles (user_id, role)
-- values ('ADMIN_USER_ID_HERE'::uuid, 'admin')
-- on conflict (user_id) do update set role = excluded.role;
--
-- insert into public.user_roles (user_id, role)
-- values ('END_USER_ID_HERE'::uuid, 'officer')
-- on conflict (user_id) do update set role = excluded.role;

-- After running, verify:
-- select * from public.user_roles order by role, user_id;