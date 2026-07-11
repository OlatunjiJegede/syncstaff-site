# SyncStaff Architecture

## One database, two front-ends

```
                    ┌──────────────────────────────────────────┐
                    │       Supabase (vxwusigwwdjbiinjumkp)    │
                    │  Postgres + RLS · Auth · Storage         │
                    │                                          │
   shared tables →  │  profiles, user_roles, employee_manager  │
   classic app   →  │  timesheets, timesheet_rows,             │
                    │  leave_requests, leave_balances,         │
                    │  expense_reports, expense_entries,       │
                    │  projects, billing_types, audit_log,     │
                    │  app_config, directory sync tables       │
   workspace new →  │  shifts, onboarding_*, jobs, candidates, │
                    │  goals, review_*, training_*,            │
                    │  hr_documents, esign_requests,           │
                    │  automations, automation_runs            │
                    └───────────────┬──────────────────────────┘
                        same auth,  │  same RLS role helpers
                        same users  │  (is_admin/is_hr/is_manager/is_finance)
              ┌─────────────────────┴─────────────────────┐
              │                                           │
┌─────────────▼─────────────┐               ┌─────────────▼─────────────┐
│  Classic HR app (Next.js) │               │  SyncStaff Workspace(SPA) │
│  hrmanagementsystem1      │               │  syncstaff-site/app       │
│  Deep editors:            │               │  Everything else:         │
│  timesheet weekly grid,   │               │  dashboard, time off,     │
│  expense day entry,       │               │  shifts, onboarding, ATS, │
│  receipts, approvals UI,  │               │  performance, training,   │
│  Entra sync, SharePoint   │               │  goals, payroll prep,     │
└───────────────────────────┘               │  e-sign, documents, org   │
                                            │  chart, reports, autos,   │
              ┌───────────────────────────┐ │  integrations             │
              │  Marketing site (static)  │ └───────────────────────────┘
              │  syncstaff-site.vercel.app│
              │  48 pages · Book a demo   │
              └───────────────────────────┘
```

## Why this shape

1. **One employee record.** Both apps authenticate against the same Supabase Auth
   and read the same `profiles`/`user_roles`. Sign up once, use everything.
2. **Security lives in the database.** Row-level security policies, not
   front-end checks, decide who sees what. The workspace ships only the public
   anon key; every query is filtered by the signed-in user's JWT.
3. **Each front-end does what it's best at.** The Next.js app keeps the complex
   editors it already does well (weekly timesheet grid, per-day expenses,
   receipt uploads, Entra sync, SharePoint export). The workspace adds the
   twelve new modules and cross-module views (dashboard, payroll prep, reports)
   without touching the existing codebase.
4. **Approvals stay consistent.** The workspace drives the same status machine
   (draft → submitted → manager_approved → approved) on the same tables, so an
   approval made in either app is instantly true in both.

## Module → table map

| Module | Tables | Notes |
|---|---|---|
| Time Off | leave_requests, leave_balances (existing) | full request/approve flow in workspace |
| Time Tracking | timesheets, timesheet_rows (existing) | status/submissions here; grid editing in classic app |
| Shift Management | shifts (new) | schedule, swap requests, cancellations |
| Project Tracking | projects (existing), timesheet_rows | hours aggregate per project |
| Onboarding/Offboarding | onboarding_templates/_template_tasks/_cases/_case_tasks (new) | template-driven checklists |
| Talent Acquisition | jobs, candidates (new) | kanban pipeline |
| Performance | review_cycles, review_entries (new) | self/manager/peer reviews |
| Training | training_courses, training_assignments (new) | catalog + assignments + completion |
| Goals & OKRs | goals (new) | progress tracking, public/private |
| Payroll Prep | timesheets + leave_requests + expense_reports (existing) | approved-only aggregate + CSV export |
| Expenses | expense_reports, expense_entries (existing) | status/approvals here; entry in classic app |
| E-Signature | esign_requests, hr_documents (new) | in-app acknowledgment signing; DocuSign later |
| Documents | hr_documents (new) | metadata + links; storage uploads later |
| Org Chart | v_org_directory view (profiles + employee_manager) | live tree |
| Reports & KPIs | everything above | client-side aggregates |
| Automations | automations, automation_runs (new) | rules + run log; server-side executor next |
| Integrations | app_config (existing) | status panel; config in classic app |

## Next steps (in order)

1. **Multi-tenancy** for selling to other companies: `organizations` table,
   `organization_id` on every row, org-scoped RLS, signup flow, Stripe billing.
2. **Server-side automation executor**: a scheduled Supabase Edge Function that
   evaluates `automations` rules against events and writes `automation_runs`.
3. **Storage uploads** for `hr_documents` (dedicated bucket + storage RLS).
4. **External e-signature** (DocuSign/Dropbox Sign) replacing in-app acknowledgment
   where legal weight is required.
5. **Payroll integrations** via a unified API (Finch) fed from the payroll prep view.
6. **Merge the two front-ends** gradually: port the timesheet grid and expense
   editor into the workspace, then retire the classic UI (the database never changes).
