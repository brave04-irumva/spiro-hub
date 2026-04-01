-- =============================================================================
-- SPIRO Hub — Role Bootstrap Migration
-- Migration: 0002_bootstrap_roles
--
-- PURPOSE: Assign admin and officer roles to existing Supabase Auth users.
--
-- IMPORTANT: Run this in the Supabase Dashboard → SQL Editor, which uses the
-- service role key and therefore BYPASSES RLS. This is required for the first
-- admin creation because the user_roles INSERT policy requires an existing admin.
--
-- STEPS:
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. Copy the UUID of the user who should be admin (e.g. admin@daystar.ac.ke)
--   3. Copy the UUID of each officer user (e.g. user1@daystar.ac.ke)
--   4. Replace the placeholder UUIDs below
--   5. Run in SQL Editor (service role context — bypasses RLS)
-- =============================================================================

-- Replace these values with real UUIDs from Supabase Auth:
-- admin@daystar.ac.ke  → ADMIN_UUID
-- user1@daystar.ac.ke  → OFFICER_UUID

INSERT INTO public.user_roles (user_id, role)
VALUES ('ADMIN_UUID_HERE'::uuid, 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO public.user_roles (user_id, role)
VALUES ('OFFICER_UUID_HERE'::uuid, 'officer')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- =============================================================================
-- Verification query — run after inserting to confirm assignments:
-- =============================================================================
-- SELECT
--   u.email,
--   ur.role,
--   ur.created_at
-- FROM auth.users u
-- LEFT JOIN public.user_roles ur ON ur.user_id = u.id
-- ORDER BY u.email;
-- =============================================================================

-- =============================================================================
-- To add more officers later (run as admin via service role):
-- =============================================================================
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('NEW_OFFICER_UUID'::uuid, 'officer')
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
-- =============================================================================
