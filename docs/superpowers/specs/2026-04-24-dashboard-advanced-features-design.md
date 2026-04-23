# Dashboard Advanced Features — Design Spec
**Date:** 2026-04-24
**Scope:** User Dashboard + Team Dashboard advanced features with full Admin control
**Approach:** Modular — 5 independent feature modules, each with its own model, API, and frontend pages

---

## Overview

Add 5 production-ready feature modules to the agency website CMS:

| # | Module | Dashboards Affected |
|---|---|---|
| 1 | Invoice & Payment Portal | User (view/pay), Admin (generate/manage) |
| 2 | Project Deliverables | User (download), Team (upload), Admin (manage) |
| 3 | Time Tracking | Team (log hours/timesheets), Admin (approve/reports) |
| 4 | Team Productivity Suite | Team (analytics/wiki/leave/standup), Admin (manage all) |
| 5 | Feature Control Center | Admin (global toggles + per-user overrides) |

All modules follow existing codebase conventions:
- Express 5 + Mongoose models in `server/src/models/usersModels/`
- API files in `client/src/api/`
- Real-time via `emitDataUpdate` + `useDataRealtime`
- Email notifications via Resend + HTML templates in `server/email-templates/`
- DashboardSearch entries added for every new page/tab
- Feature flags enforced via `useFeatureFlag()` hook

---

## Architecture — New MongoDB Models

### 1. `Invoice.model.js`
```
project        ref Project (optional — can be standalone)
client         ref User
invoiceNumber  String (auto-generated: INV-YYYYMM-XXX)
items[]        { description, quantity, unitPrice, total }
subtotal       Number
taxRate        Number (default 0)
taxAmount      Number
totalAmount    Number
status         enum: draft | sent | paid | overdue
dueDate        Date
pdfUrl         String (Cloudinary)
paymentProofUrl String (Cloudinary, uploaded by client)
paymentProofStatus enum: none | pending | approved | rejected
notes          String
createdBy      ref User (admin)
paidAt         Date
```

### 2. `Deliverable.model.js`
```
clientProject  ref Project (client request — optional)
portfolioProject ref AdminProject (portfolio project — optional)
uploadedBy     ref User (team member or admin)
fileName       String
fileUrl        String (Cloudinary)
fileType       String (mime type)
fileSizeBytes  Number
description    String
version        String (e.g. "v1.0", "v2 final")
isVisibleToClient Boolean (default false)
clientId       ref User (which client this is for)
```
Note: exactly one of `clientProject` or `portfolioProject` must be set — enforced via pre-save validation.

### 3. `TimeEntry.model.js`
```
user           ref User (team member)
project        ref AdminProject (optional)
task           ref Task (optional)
date           Date
hours          Number (0.5–24, step 0.5)
description    String
isBillable     Boolean (default true)
timesheetId    ref Timesheet
```

### 4. `Timesheet.model.js`
```
user           ref User
weekStart      Date (Monday)
weekEnd        Date (Sunday)
totalHours     Number
billableHours  Number
status         enum: draft | submitted | approved | rejected
adminNotes     String
submittedAt    Date
reviewedBy     ref User (admin)
reviewedAt     Date
```

### 5. `KnowledgeDoc.model.js`
```
title          String
content        String (markdown)
category       String
tags[]         String
author         ref User
visibility     enum: team | admin
isPinned       Boolean (default false)
lastEditedBy   ref User
```

### 6. `LeaveRequest.model.js`
```
user           ref User
type           enum: sick | annual | unpaid | other
from           Date
to             Date
totalDays      Number (auto-calculated, excludes weekends)
reason         String
status         enum: pending | approved | rejected
adminNotes     String
reviewedBy     ref User
reviewedAt     Date
```

### 7. `FeatureFlag.model.js`
```
key            String (unique, e.g. "invoice-portal")
label          String (human-readable)
module         String (grouping)
description    String
isGloballyEnabled Boolean (default true)
enabledForRoles   String[] enum: admin | team | user
disabledForUsers  ref User[] (per-user overrides — these users lose access)
enabledForUsers   ref User[] (per-user overrides — these users gain access even if role disabled)
```

---

## API Routes

All routes follow `/api/v1/` prefix, existing auth middleware.

### Module 1 — Invoices `/api/v1/invoices`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | admin | All invoices with filters (status, client, date) |
| GET | `/my` | user | Client's own invoices |
| GET | `/:id` | admin \| owner | Single invoice detail |
| POST | `/` | admin | Create invoice (draft) |
| PUT | `/:id` | admin | Update invoice (items, status, notes) |
| POST | `/:id/send` | admin | Send to client (draft→sent, email notification) |
| POST | `/:id/mark-paid` | admin | Mark as paid manually |
| POST | `/:id/upload-proof` | user | Client uploads payment proof (multipart) |
| PUT | `/:id/proof-status` | admin | Approve/reject payment proof |
| DELETE | `/:id` | admin | Delete invoice (draft only) |
| GET | `/stats` | admin | Revenue stats (total, pending, overdue, paid this month) — route declared before `/:id` to avoid Express conflict |

### Module 2 — Deliverables `/api/v1/deliverables`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/project/:projectId` | admin\|team\|owner | Files for a project (client sees only visible ones) |
| POST | `/` | admin\|team | Upload file (multipart, Cloudinary resource_type: auto) |
| PUT | `/:id/visibility` | admin\|team | Toggle isVisibleToClient |
| DELETE | `/:id` | admin\|team | Delete deliverable + Cloudinary cleanup |

### Module 3 — Time Tracking
**Time Entries `/api/v1/time-entries`**
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | admin | All entries, filter by user/project/date |
| GET | `/my` | team | Own entries |
| POST | `/` | team | Log a time entry |
| PUT | `/:id` | team\|admin | Update entry |
| DELETE | `/:id` | team\|admin | Delete entry |

**Timesheets `/api/v1/timesheets`**
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | admin | All timesheets, filter by user/week/status |
| GET | `/my` | team | Own timesheets |
| GET | `/:id` | admin\|owner | Timesheet + entries |
| POST | `/submit` | team | Submit current week (auto-aggregates entries) |
| PUT | `/:id/review` | admin | Approve or reject with notes |
| GET | `/reports` | admin | Billable hours report by project/client |

### Module 4 — Team Productivity
**Knowledge Docs `/api/v1/knowledge-docs`**
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | admin\|team | All docs (admin sees admin-only, team sees team-visible) |
| GET | `/:id` | admin\|team | Single doc |
| POST | `/` | admin | Create doc |
| PUT | `/:id` | admin | Update doc |
| PUT | `/:id/pin` | admin | Toggle pin |
| DELETE | `/:id` | admin | Delete |

**Leave Requests `/api/v1/leave-requests`**
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | admin | All requests, filter by user/status/date |
| GET | `/my` | team | Own requests |
| GET | `/calendar` | admin\|team | Approved leaves for calendar view |
| POST | `/` | team | Submit leave request |
| PUT | `/:id/review` | admin | Approve/reject with notes |
| DELETE | `/:id` | team | Cancel pending request |

**Feature Flags `/api/v1/feature-flags`**
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | admin | All flags with full detail |
| GET | `/my` | any auth | Current user's resolved flag map (used by frontend hook) |
| PUT | `/:key` | admin | Update flag (toggle, roles, user overrides) |
| POST | `/reset` | admin | Reset all flags to defaults |

---

## Frontend — New Pages & Components

### User Dashboard (new)
| Page | Path | Notes |
|---|---|---|
| Invoices | `/user-dashboard/invoices` | List + download PDF + upload proof |
| Project Detail (enhanced) | `/user-dashboard/projects/:id` | Add "Deliverables" tab |

### Team Dashboard (new)
| Page | Path | Notes |
|---|---|---|
| Time Tracker | `/team/time-tracker` | Daily log + weekly timesheet view + submit |
| Performance | `/team/performance` | Personal stats: completion rate, on-time %, hours |
| Knowledge Base | `/team/knowledge-base` | Browse/search docs, markdown render |
| Leave Management | `/team/leave` | Apply leave, history, status |
| Project Detail (enhanced) | `/team/projects/:id` | Add "Deliverables" tab with upload |

### Admin Dashboard (new)
| Page | Path | Notes |
|---|---|---|
| Invoice Manager | `/admin/invoices` | Generate, send, stats, proof approval |
| Timesheets | `/admin/timesheets` | List, approve/reject, billable report |
| Team Performance | `/admin/team-performance` | Per-member analytics, ranking |
| Knowledge Base | `/admin/knowledge-base` | Create/edit/pin/delete wiki docs |
| Leave Management | `/admin/leave-management` | Approve/reject, calendar view |
| Feature Flags | `/admin/feature-flags` | Master toggles + per-user overrides |

---

## Feature Flag Hook

```ts
// client/src/hooks/useFeatureFlag.ts
export function useFeatureFlag(key: string): boolean

// Usage in any component:
const invoiceEnabled = useFeatureFlag('invoice-portal');
if (!invoiceEnabled) return null; // hide sidebar link + guard route
```

- On app load (after auth), `GET /api/v1/feature-flags/my` fetches resolved map for current user
- Stored in `FeatureFlagContext` — consumed by hook
- Sidebar links auto-hide, routes redirect to `/not-found` if flag is off

---

## Email Templates (new files in `server/email-templates/`)

| File | Function | Placeholders |
|---|---|---|
| `5-invoice-sent.html` | `sendInvoiceSentEmail` | `{{NAME}}`, `{{INVOICE_NUMBER}}`, `{{AMOUNT}}`, `{{DUE_DATE}}`, `{{CLIENT_URL}}` |
| `6-payment-received.html` | `sendPaymentConfirmationEmail` | `{{NAME}}`, `{{INVOICE_NUMBER}}`, `{{AMOUNT}}`, `{{PAID_AT}}` |
| `7-payment-proof-uploaded.html` | `sendPaymentProofAdminEmail` | `{{CLIENT_NAME}}`, `{{INVOICE_NUMBER}}`, `{{ADMIN_URL}}` |
| `8-leave-request.html` | `sendLeaveRequestAdminEmail` | `{{MEMBER_NAME}}`, `{{LEAVE_TYPE}}`, `{{FROM}}`, `{{TO}}`, `{{DAYS}}`, `{{ADMIN_URL}}` |
| `9-leave-reviewed.html` | `sendLeaveReviewedEmail` | `{{NAME}}`, `{{STATUS}}`, `{{FROM}}`, `{{TO}}`, `{{ADMIN_NOTES}}` |
| `10-timesheet-reviewed.html` | `sendTimesheetReviewedEmail` | `{{NAME}}`, `{{WEEK}}`, `{{STATUS}}`, `{{ADMIN_NOTES}}` |
| `11-deliverable-shared.html` | `sendDeliverableSharedEmail` | `{{CLIENT_NAME}}`, `{{PROJECT_NAME}}`, `{{FILE_NAME}}`, `{{CLIENT_URL}}` |

---

## Real-Time Sync Rules

| Action | Rooms | Section | Notification |
|---|---|---|---|
| Invoice sent | `user:{clientId}`, `admin:global` | `invoices` | ✅ `invoice_sent` → client |
| Invoice paid | `user:{clientId}`, `admin:global` | `invoices` | ✅ `payment_approved` → client |
| Payment proof uploaded | `admin:global` | `invoices` | ✅ `file_received` → admin |
| Deliverable visibility toggled | `user:{clientId}`, `admin:global` | `deliverables` | ✅ `file_received` → client |
| Timesheet submitted | `admin:global` | `timesheets` | ❌ (admin sees badge) |
| Timesheet approved/rejected | `user:{memberId}`, `admin:global` | `timesheets` | ✅ `status_updated` → member |
| Leave request submitted | `admin:global` | `leave` | ❌ (admin sees badge) |
| Leave approved/rejected | `user:{memberId}`, `team:global` | `leave` | ✅ `status_updated` → member |
| Feature flag changed | `admin:global`, `team:global`, broadcast | `feature-flags` | ❌ (silent refresh) |

---

## DashboardSearch Entries

All new pages registered in `client/src/components/DashboardSearch.tsx`:

**ADMIN_ITEMS additions:**
- Invoice Manager (`/admin/invoices`) — group: Pages
- Timesheets (`/admin/timesheets`) — group: Pages
- Team Performance (`/admin/team-performance`) — group: Pages
- Knowledge Base (`/admin/knowledge-base`) — group: Pages
- Leave Management (`/admin/leave-management`) — group: Pages
- Feature Flags (`/admin/feature-flags`) — group: Pages

**TEAM_ITEMS additions:**
- Time Tracker (`/team/time-tracker`) — group: Pages
- My Performance (`/team/performance`) — group: Pages
- Knowledge Base (`/team/knowledge-base`) — group: Pages
- Leave (`/team/leave`) — group: Pages

**USER_ITEMS additions:**
- Invoices (`/user-dashboard/invoices`) — group: Pages

---

## Notification Types (extending existing enum)

Add to `Notification.model.js` enum:
```
invoice_sent | payment_approved | payment_proof_uploaded |
deliverable_shared | timesheet_approved | timesheet_rejected |
leave_approved | leave_rejected
```

---

## Standup Enhancement (existing model upgrade)

Add fields to existing `StandupNote.model.js`:
```
blockers   String (optional — what is blocking you)
mood       enum: great | good | okay | struggling | blocked
```

Admin dashboard home shows team standup summary card:
- Who submitted today vs who hasn't
- Mood distribution (emoji bar)
- Blockers list for admin attention

---

## Implementation Order (within Approach B)

Each module can be built independently but this order minimizes blockers:

1. **Feature Flags** (Module 5) — build first; all other modules use it
2. **Invoice & Payment Portal** (Module 1) — high client value
3. **Project Deliverables** (Module 2) — depends on existing Project/AdminProject refs
4. **Time Tracking** (Module 3) — depends on existing Task/AdminProject refs
5. **Team Productivity Suite** (Module 4) — largest; build sub-features A→D in order

---

## Out of Scope

- PDF generation library (invoices use a pre-built HTML template uploaded to Cloudinary as static HTML; actual PDF generation via headless browser is a future enhancement)
- Payroll processing / salary calculations
- External calendar integrations (Google Calendar sync)
- Public-facing client portal (separate from user dashboard)
