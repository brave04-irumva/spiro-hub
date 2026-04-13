# SPIRO Hub — Development Reference & Prompt

**SPIRO Hub** is a student visa and immigration compliance tracker built for the International Relations (SPIRO) Office at Daystar University (Kenya). It enables officers and admins to monitor international student visa statuses, track compliance stages, send alerts, and generate reports.

---

## Project Status (as of April 2026)

The core application is **feature-complete and production-ready**. All primary pages, database schema, RLS policies, role-based access control, and integrations are implemented. Active work involves refinement, bug fixes, and potential new features.

### What is built and working

| Feature                                           | Route                         | Status      |
| ------------------------------------------------- | ----------------------------- | ----------- |
| Auth guard (login redirect)                       | `middleware.ts`               | ✅ Complete |
| Login page                                        | `/login`                      | ✅ Complete |
| Role-based access (`admin` / `officer`)           | `useRole` hook                | ✅ Complete |
| Dashboard (student list, search, status filter)   | `/`                           | ✅ Complete |
| Add student modal (with phone + audit trail init) | `/` modal                     | ✅ Complete |
| Student detail / edit page                        | `/student/[id]`               | ✅ Complete |
| Visa stage pipeline                               | `/student/[id]`               | ✅ Complete |
| Missing documents checklist                       | `/student/[id]`               | ✅ Complete |
| Visa history audit trail                          | `/student/[id]`               | ✅ Complete |
| File attachment upload (Supabase Storage)         | `/student/[id]`               | ✅ Complete |
| Soft-delete / archive students                    | `/student/[id]`, `/directory` | ✅ Complete |
| Alerts Center (email + SMS dispatch)              | `/alerts`                     | ✅ Complete |
| Student Directory (searchable, CSV export)        | `/directory`                  | ✅ Complete |
| Analytics / Statistics dashboard                  | `/statistics`                 | ✅ Complete |
| Bulk CSV import (upsert)                          | `/upload`                     | ✅ Complete |
| Admin settings (penalty, docs, threshold)         | `/settings`                   | ✅ Complete |
| SMS API route (Africa's Talking)                  | `/api/send-sms`               | ✅ Complete |
| Toast notification system                         | `ToastContainer`              | ✅ Complete |
| RLS policies on all tables                        | Supabase migrations           | ✅ Complete |

---

## Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Framework    | Next.js 16.1.7 (App Router, React Compiler enabled) |
| Language     | TypeScript 5                                        |
| Styling      | Tailwind CSS 4                                      |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + RLS)        |
| Auth         | Supabase Auth (`@supabase/ssr`)                     |
| SMS          | Africa's Talking (`africastalking` npm package)     |
| CSV parsing  | PapaParse                                           |
| Icons        | Lucide React                                        |
| Runtime      | React 19                                            |

---

## Environment Variables

Copy `.env.example` → `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
AT_USERNAME=sandbox
AT_API_KEY=your-at-api-key-here
```

`AT_USERNAME` / `AT_API_KEY` are only required for SMS dispatch. Use `sandbox` and the sandbox key for development.

---

## Running Locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

---

## Project Structure

```
src/
  app/
    page.tsx               ← Dashboard (student list, search, status filter)
    layout.tsx             ← Root layout (Sidebar + ToastContainer)
    login/page.tsx         ← Login form
    alerts/page.tsx        ← Alerts Center (email + SMS)
    directory/page.tsx     ← Full student directory + CSV export
    statistics/page.tsx    ← Analytics (compliance rate, penalties, nationalities)
    upload/page.tsx        ← Bulk CSV import
    settings/page.tsx      ← Admin-only system configuration
    student/[id]/page.tsx  ← Student detail, edit, stage, docs, history
    api/send-sms/route.ts  ← Africa's Talking SMS endpoint
  components/
    Sidebar.tsx            ← Navigation with live alert badge count
    AddStudentModal.tsx    ← Add-student form modal
    ToastContainer.tsx     ← Global toast notification renderer
  hooks/
    useRole.ts             ← Reads user role from user_roles table
  lib/
    supabase.ts            ← Supabase client (browser-side)
    visa-logic.ts          ← calculateVisaStatus() — core status engine
    stats-logic.ts         ← calculateStats() — analytics aggregator
    export-csv.ts          ← downloadCSV() utility (currently unused)
    toast.ts               ← toast() trigger + event bus
middleware.ts              ← Route protection (redirect to /login if unauthenticated)
```

---

## Database Schema

All tables are in the `public` schema with RLS enabled.

### `students`

Core student profile. Supports soft-delete via `deleted_at`.

| Column              | Type        | Notes                                                |
| ------------------- | ----------- | ---------------------------------------------------- |
| `id`                | uuid        | PK, `gen_random_uuid()`                              |
| `full_name`         | text        |                                                      |
| `email`             | text        |                                                      |
| `student_id_number` | text        | **Unique** — used for CSV upsert conflict resolution |
| `nationality`       | text        |                                                      |
| `phone_number`      | text        | Kenya format: `+254...`                              |
| `deleted_at`        | timestamptz | `NULL` = active; timestamp = archived                |

### `visa_records`

One record per student. Tracks current visa state.

| Column              | Type   | Notes                                |
| ------------------- | ------ | ------------------------------------ |
| `id`                | uuid   | PK                                   |
| `student_id`        | uuid   | FK → `students.id` ON DELETE CASCADE |
| `expiry_date`       | date   | Used by `calculateVisaStatus()`      |
| `current_stage`     | text   | One of the 5 defined pipeline stages |
| `missing_documents` | text[] | Names of outstanding required docs   |

### `visa_history`

Append-only audit trail.

| Column         | Type        | Notes                                |
| -------------- | ----------- | ------------------------------------ |
| `id`           | uuid        | PK                                   |
| `student_id`   | uuid        | FK → `students.id` ON DELETE CASCADE |
| `status`       | text        | Status label at time of entry        |
| `notes`        | text        | Free-text description of the action  |
| `performed_by` | uuid        | FK → `auth.users.id` (nullable)      |
| `created_at`   | timestamptz | `now()` default                      |

### `student_documents`

Per-document tracking with individual expiry.

| Column          | Type | Notes                                |
| --------------- | ---- | ------------------------------------ |
| `id`            | uuid | PK                                   |
| `student_id`    | uuid | FK → `students.id` ON DELETE CASCADE |
| `document_name` | text |                                      |
| `expiry_date`   | date |                                      |
| `status`        | text | e.g. `"Valid"`, `"Expired"`          |

### `app_settings`

Single-row config table. Always keyed with `id = 'config'`.

| Column                 | Type    | Default                            |
| ---------------------- | ------- | ---------------------------------- |
| `id`                   | text    | `'config'`                         |
| `penalty_per_day`      | numeric | `500` (KES)                        |
| `default_docs`         | text[]  | List of required document names    |
| `office_name`          | text    | `"International Relations Office"` |
| `alert_threshold_days` | integer | `90`                               |

### `user_roles`

Maps Supabase Auth users to roles. Constrained to `admin` or `officer`.

| Column    | Type | Notes                       |
| --------- | ---- | --------------------------- |
| `user_id` | uuid | FK → `auth.users.id`        |
| `role`    | text | CHECK: `admin` or `officer` |

---

## Core Business Logic

### Visa Status — `calculateVisaStatus(expiryDate, penaltyRate, alertThresholdDays)`

Located in `src/lib/visa-logic.ts`. Returns `{ status, color, penalty, diffDays }`.

- `diffDays < 0` → **Expired** (penalty = `|diffDays| × penaltyRate`)
- `diffDays <= alertThresholdDays` → **Expiring Soon**
- otherwise → **Active**

### Visa Stage Pipeline

Defined in `src/app/student/[id]/page.tsx`:

1. Documents Pending
2. Payment Made
3. Submitted to EFNS
4. Awaiting Collection
5. Collected & Active

### Alert Severity Levels (Alerts Center)

- `CRITICAL` — Visa expired
- `WARNING` — Expiring within threshold
- `DOCS` — Missing required documents
- `INFO` — Incomplete profile (no visa record)

---

## Role-Based Access Control

Two roles: `admin` and `officer`. Determined at runtime via the `useRole()` hook which queries `user_roles`.

| Action                          | Admin | Officer |
| ------------------------------- | ----- | ------- |
| View all pages                  | ✅    | ✅      |
| Add / edit student data         | ✅    | ✅      |
| Archive (soft-delete) a student | ✅    | ❌      |
| Change system settings          | ✅    | ❌      |
| Send SMS alerts                 | ✅    | ❌      |

---

## Database Setup (new environment)

1. Apply `supabase/migrations/0001_rls_softdelete.sql` via Supabase Dashboard SQL Editor.
2. Edit `supabase/migrations/0002_bootstrap_roles.sql` — replace UUID placeholders with real user IDs — then run it.
3. See `docs/supabase-setup.md` and `docs/admin-user-setup.md` for detailed steps.

---

## CSV Import Format

Upload page (`/upload`) accepts a CSV with these headers:

| Header        | Required | Notes                                         |
| ------------- | -------- | --------------------------------------------- |
| `student_id`  | ✅       | Maps to `student_id_number` — used for upsert |
| `name`        | ✅       | Maps to `full_name`                           |
| `email`       | optional |                                               |
| `nationality` | optional | Defaults to `"Unknown"`                       |
| `expiry_date` | optional | ISO date; defaults to 1 year from today       |

Archived students (those with `deleted_at` set) are skipped; the count is reported in the UI.

---

## Known Issues / Tech Debt

- `src/app/stats/page.tsx` is a legacy duplicate of `src/app/statistics/page.tsx`. The sidebar links to `/statistics`. `/stats` is dead code and can be removed.
- `src/lib/export-csv.ts` (`downloadCSV`) exists but the Directory page (`/directory`) has its own inline CSV export logic. The shared utility is unused.
- The `end` file in the project root is a leftover git diff artifact and should be deleted.
- `app_settings` uses a single-row pattern keyed on `id = 'config'`. Any write must use `.upsert({ id: 'config', ... })`.
- File attachments are stored in Supabase Storage. The storage bucket name and RLS policies for the bucket are not in the migrations — they must be created manually in the Supabase dashboard.

---

## Planned / Potential Enhancements

- **Print / export single student report** — A print-friendly student profile page.
- **Restore archived students** — UI to un-archive (unset `deleted_at`) from the Directory.
- **Bulk SMS dispatch** — Send to all CRITICAL / WARNING students in one click from Alerts Center.
- **Nationality chart visualization** — The statistics page lists nationalities in a table; a bar/pie chart would improve it.
- **Supabase Realtime** — Live alert badge updates without page refresh.
- **Pagination** — The Dashboard, Directory, and Alerts Center load all records at once; pagination or virtual scrolling will be needed at scale.
- **Email template service** — Replace the `mailto:` hack in Alerts with a proper transactional email (e.g. Resend/Postmark) via a Next.js API route.

---

## Development Conventions

- All pages are `"use client"` components — the app does not use Server Components for page-level data fetching.
- Supabase client is a shared singleton from `src/lib/supabase.ts` (browser-side only).
- Server-side Supabase only appears in `middleware.ts` (uses `@supabase/ssr`) and `api/send-sms/route.ts`.
- Toast notifications use a custom event-bus pattern: call `toast(message, type)` from `src/lib/toast.ts`; `ToastContainer` listens for the event.
- Role checks (`isAdmin`) are done client-side via `useRole()`. Enforcement at the data level is handled by Supabase RLS policies.
- Soft delete: never hard-delete students. Set `deleted_at = now()`. All queries filter with `.is("deleted_at", null)`.
- The React Compiler (`reactCompiler: true` in `next.config.ts`) is enabled — avoid manual `useMemo`/`useCallback` unless profiling shows a need.
