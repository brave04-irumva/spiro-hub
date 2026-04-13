-- =============================================================================
-- SPIRO Hub — Production Security Migration
-- Migration: 0001_rls_softdelete
--
-- Apply this in Supabase Dashboard → SQL Editor, or via Supabase CLI:
--   supabase db push
--
-- Order of operations:
--   1. Soft-delete column on students
--   2. performed_by on visa_history (audit)
--   3. Data integrity constraints (unique, FK, check)
--   4. Helper function for role checks
--   5. Trigger to protect deleted_at
--   6. Enable RLS + policies on all tables
-- =============================================================================

-- =============================================================================
-- PHASE 1: SCHEMA ADDITIONS
-- =============================================================================

-- 1a. Soft-delete column on students (null = active, timestamp = archived)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 1b. Audit: who performed the change (visa_history)
ALTER TABLE public.visa_history
  ADD COLUMN IF NOT EXISTS performed_by UUID DEFAULT NULL
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- =============================================================================
-- PHASE 2: DATA INTEGRITY
-- =============================================================================

-- 2a. Unique constraint on student_id_number (required for CSV upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'students_student_id_number_unique'
      AND table_schema = 'public'
      AND table_name = 'students'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_student_id_number_unique UNIQUE (student_id_number);
  END IF;
END $$;

-- 2b. Role check constraint on user_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_roles_role_check'
      AND table_schema = 'public'
      AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'officer'));
  END IF;
END $$;

-- 2c. Foreign key: visa_records.student_id → students.id (cascade delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'visa_records_student_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'visa_records'
  ) THEN
    ALTER TABLE public.visa_records
      ADD CONSTRAINT visa_records_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2d. Foreign key: student_documents.student_id → students.id (cascade delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'student_documents_student_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'student_documents'
  ) THEN
    ALTER TABLE public.student_documents
      ADD CONSTRAINT student_documents_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2e. Foreign key: visa_history.student_id → students.id (cascade delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'visa_history_student_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'visa_history'
  ) THEN
    ALTER TABLE public.visa_history
      ADD CONSTRAINT visa_history_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================================================
-- PHASE 3: ROLE HELPER FUNCTION
-- Runs as function owner (security definer) so it bypasses RLS on user_roles.
-- This avoids circular RLS dependency when policies call this function.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;

-- =============================================================================
-- PHASE 4: TRIGGER — PROTECT deleted_at
-- Prevents non-admin users from setting or clearing deleted_at via UPDATE.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.protect_deleted_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when deleted_at is actually changing
  IF (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at) THEN
    -- Allow service role (auth.uid() IS NULL means service/super user)
    IF auth.uid() IS NOT NULL
       AND COALESCE(public.current_user_role(), '') != 'admin' THEN
      RAISE EXCEPTION 'Only administrators can archive or restore student records'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_students_deleted_at ON public.students;
CREATE TRIGGER enforce_students_deleted_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.protect_deleted_at();

-- =============================================================================
-- PHASE 5: ROW LEVEL SECURITY
-- =============================================================================

-- ── students ─────────────────────────────────────────────────────────────────

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow idempotent re-runs
DROP POLICY IF EXISTS "students_select" ON public.students;
DROP POLICY IF EXISTS "students_insert" ON public.students;
DROP POLICY IF EXISTS "students_update" ON public.students;
DROP POLICY IF EXISTS "students_delete" ON public.students;

-- SELECT: authenticated users see non-deleted students;
--         admins also see archived students (for restore UI)
CREATE POLICY "students_select"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    OR public.current_user_role() = 'admin'
  );

-- INSERT: officers and admins can register new students
CREATE POLICY "students_insert"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin', 'officer'));

-- UPDATE: officers can edit non-deleted students; admins can edit any
--         (the protect_deleted_at trigger enforces who can change deleted_at)
CREATE POLICY "students_update"
  ON public.students FOR UPDATE
  TO authenticated
  USING (
    (deleted_at IS NULL AND public.current_user_role() IN ('admin', 'officer'))
    OR public.current_user_role() = 'admin'
  )
  WITH CHECK (public.current_user_role() IN ('admin', 'officer'));

-- DELETE (hard delete): admin only
CREATE POLICY "students_delete"
  ON public.students FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- ── visa_records ─────────────────────────────────────────────────────────────

ALTER TABLE public.visa_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visa_records_select" ON public.visa_records;
DROP POLICY IF EXISTS "visa_records_insert" ON public.visa_records;
DROP POLICY IF EXISTS "visa_records_update" ON public.visa_records;
DROP POLICY IF EXISTS "visa_records_delete" ON public.visa_records;

CREATE POLICY "visa_records_select"
  ON public.visa_records FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "visa_records_insert"
  ON public.visa_records FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin', 'officer'));

CREATE POLICY "visa_records_update"
  ON public.visa_records FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'officer'))
  WITH CHECK (public.current_user_role() IN ('admin', 'officer'));

CREATE POLICY "visa_records_delete"
  ON public.visa_records FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- ── visa_history ─────────────────────────────────────────────────────────────

ALTER TABLE public.visa_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visa_history_select" ON public.visa_history;
DROP POLICY IF EXISTS "visa_history_insert" ON public.visa_history;
DROP POLICY IF EXISTS "visa_history_update" ON public.visa_history;
DROP POLICY IF EXISTS "visa_history_delete" ON public.visa_history;

CREATE POLICY "visa_history_select"
  ON public.visa_history FOR SELECT
  TO authenticated USING (true);

-- Both roles can insert audit log entries
CREATE POLICY "visa_history_insert"
  ON public.visa_history FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin', 'officer'));

-- Only admins can modify or delete audit entries
CREATE POLICY "visa_history_update"
  ON public.visa_history FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "visa_history_delete"
  ON public.visa_history FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- ── student_documents ────────────────────────────────────────────────────────

ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_documents_select" ON public.student_documents;
DROP POLICY IF EXISTS "student_documents_insert" ON public.student_documents;
DROP POLICY IF EXISTS "student_documents_update" ON public.student_documents;
DROP POLICY IF EXISTS "student_documents_delete" ON public.student_documents;

CREATE POLICY "student_documents_select"
  ON public.student_documents FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "student_documents_insert"
  ON public.student_documents FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin', 'officer'));

CREATE POLICY "student_documents_update"
  ON public.student_documents FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'officer'))
  WITH CHECK (public.current_user_role() IN ('admin', 'officer'));

CREATE POLICY "student_documents_delete"
  ON public.student_documents FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- ── app_settings ─────────────────────────────────────────────────────────────

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_select" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_insert" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_update" ON public.app_settings;

-- All authenticated users can read settings
CREATE POLICY "app_settings_select"
  ON public.app_settings FOR SELECT
  TO authenticated USING (true);

-- Admin only for insert/update
CREATE POLICY "app_settings_insert"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "app_settings_update"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ── user_roles ───────────────────────────────────────────────────────────────

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;

-- Users can read their own role; admins can read all
CREATE POLICY "user_roles_select"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() = 'admin');

-- Only admins can manage roles (bootstrap must use service role key)
CREATE POLICY "user_roles_insert"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "user_roles_update"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "user_roles_delete"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- =============================================================================
-- PHASE 6: STORAGE POLICIES (student-docs bucket)
-- These must be applied via Supabase Dashboard → Storage → Policies,
-- or via Supabase CLI storage configuration.
--
-- Recommended policies for bucket "student-docs":
--
-- 1. Allow authenticated read:
--    Definition: bucket_id = 'student-docs' AND auth.role() = 'authenticated'
--    Operations: SELECT
--
-- 2. Allow officers and admins to upload:
--    Definition: bucket_id = 'student-docs'
--                AND auth.role() = 'authenticated'
--                AND (public.current_user_role() IN ('admin', 'officer'))
--    Operations: INSERT
--
-- 3. Allow admins to delete storage objects:
--    Definition: bucket_id = 'student-docs'
--                AND public.current_user_role() = 'admin'
--    Operations: DELETE
-- =============================================================================
