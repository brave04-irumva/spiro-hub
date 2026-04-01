# Supabase Setup Guide

This document describes the Supabase resources (tables, storage buckets, and constraints) required to run SPIRO Hub. No credentials are included here — configure those via environment variables (`.env.local`).

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

---

## Required Tables

### `students`

Stores core student profile data.

| Column              | Type    | Notes                                          |
|---------------------|---------|------------------------------------------------|
| `id`                | uuid    | Primary key (default: `gen_random_uuid()`)     |
| `full_name`         | text    |                                                |
| `email`             | text    |                                                |
| `student_id_number` | text    | **Must have a unique constraint** (used for CSV upsert) |
| `nationality`       | text    |                                                |
| `phone_number`      | text    | Used for SMS dispatch (format: `+254...`)      |

### `visa_records`

Tracks the active visa/immigration record for each student.

| Column              | Type      | Notes                                         |
|---------------------|-----------|-----------------------------------------------|
| `id`                | uuid      | Primary key                                   |
| `student_id`        | uuid      | Foreign key → `students.id`                   |
| `expiry_date`       | date      |                                               |
| `current_stage`     | text      | e.g. `"Active"`, `"Expiring Soon"`, `"Expired"` |
| `missing_documents` | text[]    | Array of document names not yet submitted     |

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

| Column       | Type        | Notes                             |
|--------------|-------------|-----------------------------------|
| `id`         | uuid        | Primary key                       |
| `student_id` | uuid        | Foreign key → `students.id`       |
| `status`     | text        | Status at time of log entry       |
| `notes`      | text        | Free-text note                    |
| `created_at` | timestamptz | Default: `now()`                  |

### `student_documents`

Per-student document tracking with individual expiry dates.

| Column          | Type   | Notes                              |
|-----------------|--------|------------------------------------|
| `id`            | uuid   | Primary key                        |
| `student_id`    | uuid   | Foreign key → `students.id`        |
| `document_name` | text   |                                    |
| `expiry_date`   | date   |                                    |
| `status`        | text   | e.g. `"Valid"`, `"Expired"`, etc.  |

### `user_roles`

Maps authenticated users to their access level.

| Column    | Type | Notes                                         |
|-----------|------|-----------------------------------------------|
| `id`      | uuid | Primary key                                   |
| `user_id` | uuid | Foreign key → `auth.users.id`                 |
| `role`    | text | `"admin"` or `"officer"` (default: `"officer"`) |

---

## Required Storage Bucket

### `student-docs`

Used to store uploaded student documents (e.g. passport scans, visa copies).

- **Bucket name**: `student-docs`
- Files are stored under the path `<student_id>/<filename>`.
- Ensure the bucket exists and that authenticated users have appropriate read/write policies.

---

## Row Level Security (RLS)

It is strongly recommended to enable RLS on all tables and create policies that:

- Allow authenticated users to **read** `students`, `visa_records`, `student_documents`, `visa_history`, and `app_settings`.
- Restrict **write** operations (insert/update/delete) on `students`, `visa_records`, `student_documents`, and `app_settings` to users whose `user_roles.role = 'admin'`.
- Allow authenticated users to **insert** into `visa_history` (for audit logging).

Without RLS, the client-side role checks in the UI are the only access control layer and can be bypassed.
