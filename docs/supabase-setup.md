# Supabase Setup Guide

This document describes the Supabase resources (tables, storage buckets, and constraints) required to run SPIRO Hub. No credentials are included here — configure those via environment variables (`.env.local`).

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

See `.env.example` for a full template.

---

## Applying Migrations

All required schema changes (tables, RLS policies, constraints, soft-delete) are in:

```
supabase/migrations/0001_rls_softdelete.sql   ← Main migration
supabase/migrations/0002_bootstrap_roles.sql  ← First admin/officer setup
```

**To apply:**
1. Open **Supabase Dashboard → SQL Editor**
2. Paste and run `0001_rls_softdelete.sql` (uses the service role — bypasses RLS)
3. Edit `0002_bootstrap_roles.sql`, replace the UUID placeholders with real user IDs, then run it

> ⚠️ `0002_bootstrap_roles.sql` must be run via the Dashboard SQL Editor (service role context) because the `user_roles` INSERT policy requires an existing admin to add new roles.

---

## Required Tables

### `students`

Stores core student profile data.

| Column              | Type        | Notes                                              |
|---------------------|-------------|----------------------------------------------------|
| `id`                | uuid        | Primary key (default: `gen_random_uuid()`)         |
| `full_name`         | text        |                                                    |
| `email`             | text        |                                                    |
| `student_id_number` | text        | **Unique constraint** (used for CSV upsert)        |
| `nationality`       | text        |                                                    |
| `phone_number`      | text        | Used for SMS dispatch (format: `+254...`)          |
| `deleted_at`        | timestamptz | `NULL` = active; timestamp = archived (soft delete) |

### `visa_records`

Tracks the active visa/immigration record for each student.

| Column              | Type      | Notes                                           |
|---------------------|-----------|-------------------------------------------------|
| `id`                | uuid      | Primary key                                     |
| `student_id`        | uuid      | **FK → `students.id` ON DELETE CASCADE**        |
| `expiry_date`       | date      |                                                 |
| `current_stage`     | text      | e.g. `"Active"`, `"Expiring Soon"`, `"Expired"` |
| `missing_documents` | text[]    | Array of document names not yet submitted       |

### `app_settings`

Single-row configuration table. The app always reads/writes using `id = 'config'`.

| Column                 | Type    | Notes                                               |
|------------------------|---------|-----------------------------------------------------|
| `id`                   | text    | Primary key — always set to `'config'`              |
| `penalty_per_day`      | numeric | Daily overstay penalty (KES). Default: `500`        |
| `default_docs`         | text[]  | List of required document names                     |
| `office_name`          | text    | Display name for the office                         |
| `alert_threshold_days` | integer | Days before expiry to flag "Expiring Soon". Default: `90` |

> **Keying strategy**: the app uses `.upsert({ id: 'config', ... })` and `.single()` for reads. Ensure only one row exists with `id = 'config'`.

### `visa_history`

Audit trail for visa status changes.

| Column         | Type        | Notes                                       |
|----------------|-------------|---------------------------------------------|
| `id`           | uuid        | Primary key                                 |
| `student_id`   | uuid        | **FK → `students.id` ON DELETE CASCADE**    |
| `status`       | text        | Status at time of log entry                 |
| `notes`        | text        | Free-text note                              |
| `performed_by` | uuid        | FK → `auth.users.id` (nullable; who acted)  |
| `created_at`   | timestamptz | Default: `now()`                            |

### `student_documents`

Per-student document tracking with individual expiry dates.

| Column          | Type   | Notes                                          |
|-----------------|--------|------------------------------------------------|
| `id`            | uuid   | Primary key                                    |
| `student_id`    | uuid   | **FK → `students.id` ON DELETE CASCADE**       |
| `document_name` | text   |                                                |
| `expiry_date`   | date   |                                                |
| `status`        | text   | e.g. `"Valid"`, `"Expired"`, etc.              |

### `user_roles`

Maps authenticated users to their access level.

| Column     | Type        | Notes                                                    |
|------------|-------------|----------------------------------------------------------|
| `user_id`  | uuid        | Primary key; FK → `auth.users.id` ON DELETE CASCADE      |
| `role`     | text        | `"admin"` or `"officer"` — check constraint enforced     |
| `created_at` | timestamptz | Default: `now()`                                       |

---

## Required Storage Bucket

### `student-docs`

Used to store uploaded student documents (e.g. passport scans, visa copies).

- **Bucket name**: `student-docs`
- Files are stored under the path `<student_id>/<filename>`.
- Apply storage policies in **Supabase Dashboard → Storage → Policies**:
  - **Read**: `bucket_id = 'student-docs' AND auth.role() = 'authenticated'`
  - **Insert**: same as read + `public.current_user_role() IN ('admin', 'officer')`
  - **Delete**: `bucket_id = 'student-docs' AND public.current_user_role() = 'admin'`

---

## Row Level Security (RLS)

RLS is enabled on all tables via `0001_rls_softdelete.sql`. Summary:

| Table               | SELECT          | INSERT              | UPDATE              | DELETE       |
|---------------------|-----------------|---------------------|---------------------|--------------|
| `students`          | authenticated (non-deleted) + admin (all) | officer, admin | officer (non-deleted), admin (all) | admin only |
| `visa_records`      | authenticated   | officer, admin      | officer, admin      | admin only   |
| `visa_history`      | authenticated   | officer, admin      | admin only          | admin only   |
| `student_documents` | authenticated   | officer, admin      | officer, admin      | admin only   |
| `app_settings`      | authenticated   | admin only          | admin only          | —            |
| `user_roles`        | own row + admin | admin only*         | admin only          | admin only   |

*Initial bootstrap must be run via service role key (Dashboard SQL Editor).

### Soft Delete

`students.deleted_at` — when set to a timestamp, the student is **archived**:
- Hidden from all normal queries (RLS policy filters `deleted_at IS NULL`)
- Admin can still access archived records and restore them
- A database trigger (`enforce_students_deleted_at`) prevents non-admin users from setting or clearing `deleted_at`
