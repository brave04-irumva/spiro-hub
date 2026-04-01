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
-- Admin UID:    e4f20a2f-98a1-4e78-af3b-0cace1d19122
-- End-user UID: f4bbb701-d5ae-42dd-9fb9-3a3a6e3006d5

with ids as (
  select
    'e4f20a2f-98a1-4e78-af3b-0cace1d19122'::uuid as admin_user_id,
    'f4bbb701-d5ae-42dd-9fb9-3a3a6e3006d5'::uuid as end_user_id
)
select * from ids;

-- ---------------------------------------------------------------------
-- Step D: Assign roles (CHOOSE the variant that matches your columns)
-- ---------------------------------------------------------------------

-- Variant 1: Columns are (user_id, role)
with ids as (
  select
    'e4f20a2f-98a1-4e78-af3b-0cace1d19122'::uuid as admin_user_id,
    'f4bbb701-d5ae-42dd-9fb9-3a3a6e3006d5'::uuid as end_user_id
)
insert into public.user_roles (user_id, role)
select admin_user_id, 'admin' from ids
on conflict (user_id) do update set role = excluded.role;

with ids as (
  select
    'e4f20a2f-98a1-4e78-af3b-0cace1d19122'::uuid as admin_user_id,
    'f4bbb701-d5ae-42dd-9fb9-3a3a6e3006d5'::uuid as end_user_id
)
insert into public.user_roles (user_id, role)
select end_user_id, 'officer' from ids
on conflict (user_id) do update set role = excluded.role;

-- After running, verify:
select * from public.user_roles order by role, user_id;