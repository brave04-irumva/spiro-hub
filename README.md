# SPIRO Hub: Student Visa & Compliance Tracker

A specialized Management Information System (MIS) designed for the **Student Placement & International Relations Office (SPIRO)** at **Daystar University**. This platform automates the tracking of international student immigration documents, visa expiries, and institutional compliance.

## 🚀 Key Features

### 1. Smart Compliance Engine

- **Visa Expiry Tracking:** Real-time calculation of remaining days with visual status flagging (Active, Expiring Soon, Expired).
- **Automated Penalty Calculation:** Dynamically calculates overstay penalties based on university-defined daily rates.
- **Intelligent Document Checklist:** Tracks 8-point mandatory immigration requirements with individual document expiry monitoring (e.g., Police Clearance).

### 2. Communication Hub

- **Africa's Talking SMS Integration:** Direct SMS dispatching to students for urgent compliance alerts.
- **Outlook Integration:** Pre-formatted email templates for professional staff-to-student communication.

### 3. Security & Governance

- **Hybrid Authentication:** Secure staff login powered by Supabase Auth with modern SSR middleware protection.
- **Role-Based Access Control (RBAC):** Tiered permissions for 'Admins' (System configuration & Deletion) and 'Officers' (Data entry & Monitoring).
- **Audit Trail:** Comprehensive historical logging of all status changes for institutional accountability.

### 4. Data Management

- **Analytics Dashboard:** Visual distribution of student nationalities and compliance rates.
- **Master Directory:** Centralized student database with advanced search and CSV export capabilities for university reporting.

## 🛠️ Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend/Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (SSR Client)
- **SMS Gateway:** Africa's Talking API
- **Icons:** Lucide React

## ⚙️ Environment Setup

Create a `.env.local` file in the root directory and populate it with the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Africa's Talking Configuration
AT_USERNAME=sandbox_or_live_username
AT_API_KEY=your_at_api_key
```
# spiro-hub
