# Project: Nabeel Agency Website

## Overview
Full-stack Agency Website & CMS. Monorepo with `client/` (React 18 + TypeScript) and `server/` (Express 5 + MongoDB).

## Tech Stack

### Frontend (client/)
- React 18 + **TypeScript** — Vite, port 5173 (proxy → 8000)
- React Router DOM v6 (BrowserRouter)
- Tailwind CSS + **shadcn/ui** components at `src/components/ui/`
- Framer Motion (all animations), Lucide React (icons), Sonner (toasts)

### Backend (server/)
- Express 5 + MongoDB Atlas (Mongoose), port 8000, prefix `/api/v1/`
- JWT auth (access + refresh tokens), roles: `admin | team | user`
- OTP email verification via **Resend SDK**, file uploads via **Multer + Cloudinary**
- `uploadFile(filePath, folder)` in `server/src/middlewares/Cloudinary.js` — use `resource_type: 'auto'` for PDF/DOC/DOCX uploads (not just images)
- Seed file: `server/src/seed.js` — run `node src/seed.js` to populate initial data

## Key Contexts (`client/src/contexts/`)
| Context | Key exports | Storage |
|---|---|---|
| AuthContext.tsx | `user, isAuthenticated, login, logout, updateUser` | localStorage |
| ThemeContext.tsx | `theme, setTheme` | localStorage |
| ContentContext.tsx | `logoUrl`, `pageStatuses`, `setPageStatuses`, `announcements`, `hasActiveAnnouncements`, `tickerDuration`, CMS data | fetched from backend |
| LanguageContext.tsx | `lang, setLang, t()` | localStorage (EN/ES/FR/DE/JP) |
| CookieConsentContext.tsx | `consent, updateConsent, saveConsent, resetConsent, acceptAll, hasDecided` | localStorage (`cookie_consent`) + cookie fallback |

## Auth & Routing
- Login → JWT in localStorage → role-based dashboard redirect
- `admin` → `/admin`, `team` → `/team`, `user` → `/user-dashboard`
- Unverified users → redirected to `/verification` (OTP page)
- `ProtectedRoute` handles all guard logic

## Layouts (`client/src/layouts/`)
- `PublicLayout.tsx` — AnnouncementBar + Navbar + Footer + Chatbot + ScrollToTop; `pt` shifts to `pt-[6.5rem]` when bar is visible
- `AdminLayout.tsx`, `TeamLayout.tsx`, `UserLayout.tsx` — sidebar layouts

## Important Components
| Component | Location | Notes |
|---|---|---|
| Navbar | components/Navbar.tsx | Glass scroll effect; `top-10` when AnnouncementBar visible else `top-0`; profile dropdown or Get Started |
| AnnouncementBar | components/AnnouncementBar.tsx | `fixed top-0 z-[70] h-10`; infinite ticker; duplicates items 2× for seamless loop; admin "Manage" shortcut |
| PageStatusGate | components/PageStatusGate.tsx | Wraps `<Outlet>` in PublicLayout; checks pageStatuses from ContentContext; admin sees real page + warning banner; others see Maintenance/ComingSoon pages |
| Hero | components/Hero.tsx | Full-screen, translatable via `t()`, `pb-40` to push content up |
| ScrollToTop | components/ScrollToTop.tsx | `fixed bottom-[6.5rem] right-6`, `useScroll+useSpring` |
| Chatbot | components/Chatbot.tsx | `fixed bottom-6 right-6 h-16` |
| ShareWidget | components/ShareWidget.tsx | Popover with copy link, LinkedIn, Twitter, Facebook share buttons |

## Translation Pattern
```tsx
const { t } = useLanguage();
// then use: t('nav.services'), t('hero.title'), etc.
// All keys defined in LanguageContext.tsx translations object
```

## Styling Conventions
- Glass cards: `bg-white/5 backdrop-blur-xl border border-white/10`
- Buttons: `rounded-full` (pills), `rounded-2xl` (cards)
- Primary color via CSS var `--primary` (violet family)
- Scroll reveals: `whileInView`, mount/unmount: `AnimatePresence`

---

## Models

### Two Project Models — Do Not Confuse
| Model | File | Purpose | API prefix |
|---|---|---|---|
| `Project` | `server/src/models/usersModels/Project.model.js` | **Client project requests** submitted by users | `/api/v1/projects` |
| `AdminProject` | `server/src/models/adminModels/AdminProject.model.js` | **Agency portfolio** projects managed by admin | `/api/v1/admin/projects` |

### Client Project Requests (`Project` model)
- Fields: `projectName`, `projectType`, `budgetRange`, `projectDetails`, `status` (pending→in_review→approved/rejected→completed), `progress`, `deadline`, `totalCost`, `paidAmount`, `paymentStatus` (auto via pre-save hook), `attachments[]`, `requestedBy` (ref User), `assignedTeam[]` (ref User[]), `isArchived`
- Role-based filtering in `getAllProjects`: admin sees all, team sees `assignedTeam` contains their ID, user sees `requestedBy` equals their ID
- File uploads via Multer + Cloudinary; `deleteAttachment` removes from Cloudinary + DB

### JobPosting model (`server/src/models/usersModels/JobPosting.model.js`)
- Fields: `jobTitle`, `department` (enum: Engineering/Design/Marketing/Sales/HR/Finance/Operations/Product/Other), `employmentType`, `workMode`, `location`, `experienceLevel` (enum: 'Entry Level'/'Mid Level'/'Senior Level'/'Lead'/'Executive'), `salaryRange: { min, max, currency }`, `salaryDisplay` (optional override string), `description`, `responsibilities[]`, `requirements[]`, `benefits[]`, `status` (Active/Draft/Closed/Filled/Paused)
- API: `GET /api/v1/jobs` (all, admin), `GET /api/v1/jobs/active` (public), `GET /api/v1/jobs/:id` (public)
- `getAllJobs` returns `{ jobs, pagination }` — always use `data?.jobs || (Array.isArray(data) ? data : [])` to parse
- `getActiveJobs` returns array directly

### JobApplication model (`server/src/models/usersModels/JobApplication.model.js`)
- Fields: `job` (ref JobPosting), `firstName`, `lastName`, `email`, `phone`, `desiredRole`, `experienceLevel`, `resumeUrl` (Cloudinary), `coverLetter`, `status` (pending/reviewing/shortlisted/rejected/hired), `adminNotes`
- Submit: `POST /api/v1/job-applications` (public, multipart/form-data with `resume` file)
- On submit: resume uploaded to Cloudinary via `uploadFile()`, confirmation email sent to applicant + admin notification (both via `Promise.allSettled` — non-blocking)
- `GET /api/v1/job-applications/my` — authenticated user sees their own applications (matched by email)
- `PUT /api/v1/job-applications/:id/status` — admin only; when status = `'hired'`, user role is automatically upgraded to `'team'`

### PageStatus model (`server/src/models/usersModels/PageStatus.model.js`)
- Fields: `key` (unique), `label`, `path`, `matchPrefix`, `status` (active/maintenance/coming-soon), `category` (public/admin/user/team), `isCustom`, `updatedBy`
- `PAGE_REGISTRY` in `pageStatus.controller.js` defines **36 built-in pages** across 4 categories
- Auto-seeds on first load; migrates missing pages on subsequent loads (migration-safe)
- Built-in pages cannot be deleted; `isCustom: true` pages can be deleted by admin
- API: `GET /api/v1/page-status` (public), `PUT /:key`, `POST /`, `DELETE /:key` (admin only)

### Announcement model (`server/src/models/usersModels/Announcement.model.js`)
- Fields: `text`, `emoji`, `link`, `linkLabel`, `bgColor`, `textColor`, `isActive`, `order`, `createdBy`
- **Singleton settings** stored as a special document with `_meta: true` in the same collection — holds `tickerDuration` (Number, default 30s). All `getAll`/`getActive` queries filter out `_meta: true` docs.
- API: `GET /api/v1/announcements` (public, active only), `GET /api/v1/announcements/settings` (public), `GET /api/v1/announcements/all` (admin), `PUT /api/v1/announcements/settings` (admin, clamps 5–120s), `POST/PUT/DELETE /api/v1/announcements/:id` (admin)

---

## API Files (`client/src/api/`)
| File | Base path | Key methods |
|---|---|---|
| `projects.api.ts` | `/projects` | `getAll`, `getStats`, `getById`, `create` (FormData), `delete` |
| `adminProjects.api.ts` | `/admin/projects` | CRUD for portfolio projects |
| `jobs.api.ts` | `/jobs` | `getAll` (admin), `getActive` (public), `getById`, `create`, `update`, `delete` |
| `jobApplications.api.ts` | `/job-applications` | `getAll`, `getStats`, `getById`, `updateStatus`, `delete`, `getMyApplications`, `submitJobApplication` (FormData) |
| `pageStatus.api.ts` | `/page-status` | `getAll`, `update(key, status)`, `create(payload)`, `delete(key)` |
| `announcements.api.ts` | `/announcements` | `getActive`, `getAll`, `create`, `update`, `delete`, `getSettings`, `updateSettings(tickerDuration)` |
| `users.api.ts` | `/users` | `update` (FormData or JSON), `updatePassword` |
| `auth.api.ts` | `/auth` | login, register, refresh |

---

## Dashboard Pages

### User Dashboard (`/user-dashboard`)
| Page | File | Notes |
|---|---|---|
| Overview | `pages/user/UserDashboardHome.tsx` | Live stats from `projectsApi.getStats()`, recent 3 projects |
| My Projects | `pages/user/UserProjects.tsx` | Full CRUD — create with file upload, list, delete (pending/rejected only) |
| Applied Jobs | `pages/user/UserAppliedJobs.tsx` | Shows all job applications by the logged-in user; status badges, resume link, admin notes, view job button |
| Profile | `pages/user/UserProfile.tsx` | Avatar upload, password change via `usersApi.updatePassword` |
| Support | `pages/user/UserSupport.tsx` | Client-facing: ticket list, FAQ accordion (project/billing/account), New Ticket dialog with success state |

### Admin Dashboard (`/admin`)
| Page | File | Notes |
|---|---|---|
| Client Requests | `pages/admin/ClientProjectRequests.tsx` | Approve/reject/delete requests; assign team members (checkbox picker with stacked avatar display) |
| Job Management | `pages/admin/JobManagement.tsx` | Full CRUD for job postings; department uses Select with enum values; salary uses min/max number inputs; `getAllJobs` returns `{ jobs, pagination }` |
| Job Applications | `pages/admin/AdminJobApplications.tsx` | Stats cards; table with hire/reject/delete actions; hire upgrades applicant user role to 'team' |
| Page Manager | `pages/admin/PageManager.tsx` | 5 collapsible categories (Public, Admin, User, Team, Custom); 36 built-in pages + custom URLs; 3-button status toggle per page |
| Announcement Manager | `pages/admin/AnnouncementManager.tsx` | Full CRUD for ticker bar items; 10 color presets + custom hex pickers; live preview; speed control (slider 5–120s + presets); singleton settings via `_meta` doc |

### Team Dashboard (`/team`)
| Page | File | Notes |
|---|---|---|
| Projects | `pages/team/TeamProjects.tsx` | Two tabs: "Client Requests" (assigned via `assignedTeam`) + "Portfolio Projects" (AdminProject); fetches both in parallel |
| Client Request Detail | `pages/team/TeamClientRequestDetail.tsx` | Full detail view: description, attachments (clickable links), assigned team list, client info, payment info; route: `/team/client-requests/:id` |
| Project Detail | `pages/team/TeamProjectDetail.tsx` | Detail view for AdminProject portfolio items; route: `/team/projects/:id` |
| Support | `pages/team/TeamSupport.tsx` | Internal help: IT/HR/Admin contact cards, internal ticket list, FAQ accordion; New Ticket dialog |

---

## Public Pages (Careers)
| Page | File | Notes |
|---|---|---|
| Careers | `pages/public/Careers.tsx` | Uses `jobsApi.getActive()` — returns array directly (not paginated). Field names: `job.jobTitle`, `job.employmentType`, `job.salaryRange` (object). Format salary with helper: `$3k – $6k` |
| Job Detail | `pages/public/JobDetail.tsx` | Uses `jobsApi.getById(id)`. Salary display: `job.salaryDisplay \|\| (job.salaryRange?.min ? ...)` — never render the object directly. Includes Share widget and Job Privacy Policy link |
| Job Application | `pages/public/JobApplication.tsx` | Multipart/form-data with `resume` file. Experience level values must match DB enum exactly (e.g. 'Senior Level' not 'Senior') |
| Job Application Success | `pages/public/JobApplicationSuccess.tsx` | Shown after successful submit |
| Job Privacy Policy | `pages/public/JobPrivacyPolicy.tsx` | Linked from JobDetail apply card |

---

## Announcement Bar — Layout & Positioning
- `AnnouncementBar` renders at `fixed top-0 z-[70] h-10` — **above** the navbar (`z-50`)
- Navbar shifts: `top-10` when `hasActiveAnnouncements === true`, `top-0` otherwise
- `PublicLayout` main content padding: `pt-[6.5rem]` with bar, `pt-16` without
- Ticker uses `@keyframes announcement-ticker` in `GlobalStyles.tsx`: `translateX(0) → translateX(-50%)`
- Items duplicated 2× so the loop point is invisible (50% translateX trick)
- `--ticker-duration` CSS variable controls speed; set by `tickerDuration` from ContentContext

## Page Manager — Status Gate
- `PageStatusGate` wraps `<Outlet>` inside `PublicLayout`
- Matches current `pathname` against `pageStatuses` from ContentContext (prefix or exact match)
- **Admin bypass**: always sees the real page + amber warning banner (status) or slate banner (hidden)
- **Non-admin**: `maintenance` → `<Maintenance />` page, `coming-soon` → `<UnderConstruction />` page
- `isHidden` flag: non-admin redirected away; admin still sees page with banner

---

## shadcn/ui `Select` — Important Gotcha
The `Select` component in this codebase is a **native `<select>` wrapper**, NOT Radix UI.
- **Wrong**: wrapping with `<SelectTrigger>`, `<SelectContent>`, `<SelectValue>` → causes `<div> cannot appear as child of <select>` DOM error
- **Correct**: use `<SelectItem>` (renders `<option>`) directly as children of `<Select>`

## `Tabs` Component — `onTabChange` Gotcha
`Tabs` passes `onTabChange` via `React.cloneElement` to ALL children. `TabsContent` must destructure `onTabChange` from props to prevent it being spread to the DOM `<div>`.

## Email System (Resend)
- Transactional emails sent via Resend SDK from `server/src/utils/sendEmails.js`
- Job application flow: `sendJobApplicationConfirmation` (to applicant) + `sendJobApplicationAdminNotification` (to admin)
- All email sends wrapped in `Promise.allSettled` — submission succeeds even if email fails
- OTP verification also uses Resend

## Email Templates (`server/email-templates/`)
Responsive HTML email templates — table-based layout, inline CSS, dark brand theme (`#0f0a1e` bg, `#7c3aed` primary). `sendEmails.js` loads them via `fs.readFileSync` and replaces `{{PLACEHOLDER}}` tokens.

| File | Function | Placeholders |
|---|---|---|
| `1-verification-email.html` | `sendVerificationEmail` | `{{NAME}}`, `{{CODE}}`, `{{D1}}`–`{{D6}}` |
| `2-password-reset-email.html` | `sendPasswordResetEmail` | `{{NAME}}`, `{{RESET_URL}}` |
| `3-job-application-confirmation.html` | `sendJobApplicationConfirmation` | `{{NAME}}`, `{{JOB_TITLE}}`, `{{DEPARTMENT}}`, `{{CLIENT_URL}}` |
| `4-job-application-admin-notification.html` | `sendJobApplicationAdminNotification` | `{{APPLICANT_NAME}}`, `{{APPLICANT_EMAIL}}`, `{{JOB_TITLE}}`, `{{DEPARTMENT}}`, `{{APPLICATION_ID}}`, `{{ADMIN_URL}}`, `{{SUBMITTED_AT}}` |

- To add a new template: create the HTML file in `server/email-templates/`, use `{{KEY}}` placeholders, call `renderTemplate(filename, vars)` in `sendEmails.js`
- `renderTemplate` is a private helper — not exported; only the `send*` functions are exported

## Cookie Consent System (GDPR)

### Consent Data Structure (exact shape stored in localStorage key `cookie_consent`)
```json
{
  "essential": true,
  "functional": false,
  "analytics": false,
  "marketing": false,
  "consentGiven": false,
  "timestamp": null
}
```

### Context API — `useCookieConsent()`
| Method | Description |
|---|---|
| `consent` | Current consent object |
| `updateConsent(updates)` | Update toggles without saving (used by settings page) |
| `saveConsent()` | Persist, set `consentGiven=true`, trigger scripts, POST to backend |
| `resetConsent()` | Reset non-essential to `false` (does NOT auto-save) |
| `acceptAll()` | Set all `true`, save, trigger all scripts |
| `hasDecided` | `true` when a saved consent exists in storage |

### Storage
- **Primary**: `localStorage` key `cookie_consent`
- **Fallback**: `document.cookie` key `cookie_consent` (365 days, SameSite=Lax)
- **Migration**: old `cookie-preferences` key auto-migrated and removed on first load

### Script Loader (`client/src/lib/scriptLoader.ts`)
- `loadScript(src, id)` — injects `<script>` once; deduped by DOM id + in-memory Set
- `removeScript(id)` — removes from DOM + memory (page reload needed for full cleanup)
- Scripts are never injected before `consentGiven === true`
- Add env vars to enable real scripts: `VITE_GA_MEASUREMENT_ID`, `VITE_FB_PIXEL_ID`

### Backend API — `/api/v1/consent`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Public | Log a consent event (called automatically on save/acceptAll) |
| GET | `/stats` | Admin | Aggregate stats: total, last30Days, breakdown by category with % |
| GET | `/` | Admin | Paginated audit log (`?page=1&limit=15`) |
| DELETE | `/clear?days=N` | Admin | Bulk-delete records older than N days (GDPR minimisation) |
| DELETE | `/:id` | Admin | Delete a single record |

### MongoDB Model — `CookieConsent`
- Collection: `cookieconsents`
- Fields: `userId` (ref User, nullable), `consent` (object), `timestamp`, `ipAddress` (last octet stripped), `userAgent` (≤300 chars)
- Indexed on `createdAt` desc and `userId`

### Admin Dashboard
- **Settings → Cookie Consent tab** — stats cards, per-category acceptance rate bars, paginated audit table with delete, bulk-clear by age
- Auto-loads when tab is opened; refresh button available

### Banner (`CookieConsent.tsx`)
- Shows 1.5s after first visit if `hasDecided === false`
- "Accept All" → `acceptAll()` | "Decline" → essential-only + `saveConsent()` | "Manage Preferences" → `/cookies`
- Hides automatically once `hasDecided` becomes `true`

---

## Searchable Pages — All Dashboards

Every dashboard has a command-palette search (Cmd/Ctrl+K) powered by `client/src/components/DashboardSearch.tsx`.

### How it works
- `<DashboardSearch role="admin|team|user" />` is rendered in every dashboard topbar (DashboardLayout, TeamDashboardLayout, UserDashboardLayout)
- Each role has a static registry: `ADMIN_ITEMS`, `TEAM_ITEMS`, `USER_ITEMS` — arrays of `SearchItem`
- Results are scored and sorted by label/description/keywords match
- Selecting an item calls `navigate(item.path)` — supports `?tab=` query params for deep-linking

### SearchItem shape
```ts
{
  id: string;           // unique, e.g. 'a-content'
  label: string;        // display name
  description?: string; // subtitle shown in results
  path: string;         // navigate path — can include ?tab= for sub-tabs
  icon: LucideIcon;
  group: string;        // section header: 'Pages' | 'Actions' | 'Content Sections' | etc.
  keywords?: string[];  // extra search terms
}
```

### RULE — When you add a new page, tab, or section, you MUST:
1. **Add an entry to the relevant role's registry** in `DashboardSearch.tsx`
   - Admin pages → `ADMIN_ITEMS`
   - Team pages → `TEAM_ITEMS`
   - User pages → `USER_ITEMS`
2. **Use `?tab=<value>` in `path`** if the destination is a tab inside an existing page
3. **The target page must read `?tab=` from URL** on mount to auto-select the tab:
   ```tsx
   const location = useLocation();
   const [activeTab, setActiveTab] = useState(() =>
     new URLSearchParams(location.search).get('tab') || 'default'
   );
   useEffect(() => {
     const tab = new URLSearchParams(location.search).get('tab');
     if (tab) setActiveTab(tab);
   }, [location.search]);
   ```

### Current registries
| Role | Groups | # Items |
|------|--------|---------|
| admin | Pages, Content Sections, Actions | ~30 |
| team | Pages, Actions | ~13 |
| user | Pages, Actions | ~12 |

### Content Editor deep-links
All tabs in `/admin/content-editor` are searchable via `?tab=` params:
`hero`, `logo`, `tech`, `process`, `why`, `testimonials`, `contact`, `social`, `nav-footer`

ContentEditor reads `?tab=` on mount and on `location.search` change (useEffect).

---

## Real-Time Sync Architecture

Every CRUD operation instantly reflects across all dashboards without a page reload.

### How it works (two-layer system)

**Layer 1 — Public CMS events (unauthenticated):**
- Server controllers call `io.of('/public').emit('cms:updated', { section })`
- `ContentContext` subscribes to `/public` namespace and dispatches `window CustomEvent 'cms:updated'`
- `useDataRealtime(section, refetch)` hooks on any page pick this up and call their refetch function

**Layer 2 — Authenticated private events (role-based rooms):**
- Server controllers call `emitDataUpdate(io, section, ['admin:global' | 'team:global' | 'user:{id}'])`  
  → utility is at `server/src/utils/dataUpdateService.js`
- `SocketContext` listens for `data:updated` on the authenticated socket and dispatches `window 'cms:updated'`
- Same `useDataRealtime` hooks fire automatically

### Socket rooms
| Room | Who joins | Used for |
|---|---|---|
| `user:{userId}` | Every authenticated user | Private notifications + project updates |
| `admin:global` | All admins | New project requests, client changes, admin data sync |
| `team:global` | All team members | Task/resource updates |
| `conversation:{id}` | Chat participants | Chat messages |
| `/public` namespace | Everyone (no auth) | CMS: services, jobs, announcements, page status, admin projects |

### What triggers what
| Action | Rooms notified | Section | Notification sent? |
|---|---|---|---|
| User submits project | `admin:global` | `projects` | ✅ `project_submitted` → all admins |
| Admin updates project status | `user:{owner}`, `admin:global` | `projects` | ✅ `project_accepted/rejected/status_updated` → user |
| Admin assigns team to project | `user:{teamId}` | `projects` | ✅ `project_assigned` → team member |
| Admin/team creates task | `/public` + `team:global` | `tasks` | ✅ `task_assigned` → assignee |
| Admin/team reassigns task | `/public` + `team:global` | `tasks` | ✅ `task_assigned` → new assignee |
| Client CRUD | `admin:global` | `clients` | ❌ (admin-only data) |
| Services/Jobs/Announcements CRUD | `/public` | `services/jobs/announcements` | ❌ |
| Resources CRUD | `/public` | `resources` | ❌ |

### RULE — When adding a new feature that mutates data:
1. **Import** `emitDataUpdate` from `server/src/utils/dataUpdateService.js`
2. **After** your DB write, call `emitDataUpdate(io, 'sectionName', ['room1', 'room2'])`
3. **On the frontend**, ensure the page that displays the data has `useDataRealtime('sectionName', refetchFn)`
4. For cross-role notifications (e.g. user → admin), use `createAndEmitNotification` from `notificationService.js`

### Notification types (Notification.model.js enum)
`message` | `file_received` | `project_accepted` | `project_rejected` | `project_assigned` | `project_submitted` | `task_assigned` | `status_updated`

---

## Git Rules
- Branch: `main` → remote: `github.com/MuhammadNabeelJaved/nabeel-javed-agency`
- **Never** stage `server/.claude/settings.local.json`
- Commit message format: `feat/fix/refactor: short description`
