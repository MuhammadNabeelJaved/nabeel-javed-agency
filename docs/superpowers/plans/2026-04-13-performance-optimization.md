# Performance Optimization & Production-Grade Upgrades — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce initial JS bundle by ~70%, compress API responses, add Redis caching, Error Boundaries, Web Vitals, health check, graceful shutdown, and MongoDB compound indexes — zero UI/feature/animation changes.

**Architecture:** Frontend code-split via React.lazy (55+ pages → separate chunks); vendor libraries in isolated cached chunks. Backend adds compression + Redis response cache (graceful fallback if Redis unavailable). Infrastructure layer (health, shutdown, indexes) added without touching business logic.

**Tech Stack:** React 18 + Vite, ioredis (already installed), `compression` (new), `web-vitals` (new), Express 5, Mongoose, MongoDB Atlas

**Spec:** `docs/superpowers/specs/2026-04-13-performance-optimization-design.md`

> **Note on testing:** No test runner is configured in this project. Verification steps use `curl`, browser DevTools Network tab, and console output instead of automated tests.

---

## File Map

### New Files
| File | Purpose |
|---|---|
| `client/src/components/ErrorBoundary.tsx` | React class component — catch render errors, show fallback |
| `client/src/lib/webVitals.ts` | Report LCP/FCP/CLS/TTFB/INP to console (dev) or backend (prod) |
| `client/src/lib/apiCache.ts` | In-memory TTL cache for public GET responses |
| `server/src/config/redis.js` | Singleton ioredis client with graceful fallback |
| `server/src/middlewares/redisCache.js` | Express middleware: cache GET responses in Redis |
| `server/src/middlewares/cacheHeaders.js` | Middleware factory: set Cache-Control headers |
| `server/src/routes/userRoutes/health.route.js` | `GET /api/v1/health` + `POST /api/v1/health/vitals` |

### Modified Files
| File | What changes |
|---|---|
| `client/vite.config.ts` | Add `build` block: manual chunks, esbuild minifier |
| `client/src/App.tsx` | Convert 55+ page imports to `React.lazy`; add `<Suspense>` + `<ErrorBoundary>` wrappers |
| `client/src/main.tsx` | Call `reportWebVitals()` after render |
| `client/src/contexts/ContentContext.tsx` | Wrap CMS + pageStatus fetches with `apiCache` |
| `client/src/api/announcements.api.ts` | Wrap `getActive` with cache; invalidate on mutations |
| `client/src/api/pageStatus.api.ts` | Wrap `getAll` with cache |
| `server/src/app.js` | Add `compression` + register `/api/v1/health` route |
| `server/src/index.js` | Add `SIGTERM`/`SIGINT` graceful shutdown handlers |
| `server/src/routes/userRoutes/services.route.js` | Add `cacheMiddleware(300)` + `setCacheHeaders(300)` to GET routes |
| `server/src/routes/userRoutes/jobs.route.js` | Same |
| `server/src/routes/userRoutes/adminProject.route.js` | Same |
| `server/src/routes/userRoutes/announcement.route.js` | Same (60s TTL) |
| `server/src/routes/userRoutes/cms.route.js` | Same (600s TTL) |
| `server/src/routes/userRoutes/pageStatus.route.js` | Same (120s TTL) |
| `server/src/controllers/usersControllers/services.controller.js` | Call `invalidateCache('/services')` on create/update/delete |
| `server/src/controllers/usersControllers/jobs.controller.js` | Same for `/jobs` |
| `server/src/controllers/usersControllers/adminProject.controller.js` | Same for `/admin/projects` |
| `server/src/controllers/usersControllers/announcement.controller.js` | Same for `/announcements` |
| `server/src/models/usersModels/Project.model.js` | Add compound index |
| `server/src/models/usersModels/Notification.model.js` | Add compound index |
| `server/src/models/usersModels/Task.model.js` | Add compound index |

---

## Task 1: Vite Build Optimization

**Files:**
- Modify: `client/vite.config.ts`

- [ ] **Step 1: Open `client/vite.config.ts` and replace its full contents**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    minify: 'esbuild',
    chunkSizeWarningLimit: 800,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-charts': ['recharts'],
          'vendor-socket': ['socket.io-client'],
          'vendor-icons':  ['lucide-react'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        proxyTimeout: 300000,
        timeout: 300000,
      },
      '/socket.io': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (err.message.includes('ECONNREFUSED') || err.message.includes('ECONNABORTED')) {
              if ('writeHead' in res && typeof res.writeHead === 'function') {
                res.writeHead(503, { 'Content-Type': 'text/plain' });
                res.end('Backend unavailable');
              }
              return;
            }
            console.error('socket.io proxy error', err);
          });
        },
      },
    },
  },
})
```

- [ ] **Step 2: Verify the build produces separate chunks**

```bash
cd client && npm run build
```

Expected: Output lists chunk files like `vendor-react-[hash].js`, `vendor-motion-[hash].js`, etc. No single file should exceed 800KB (warning threshold).

- [ ] **Step 3: Commit**

```bash
git add client/vite.config.ts
git commit -m "perf: add vite manual chunks and esbuild minifier"
```

---

## Task 2: React.lazy Code Splitting

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Replace all page imports in `client/src/App.tsx`**

Replace the entire block of static page imports (lines 22–113) with lazy equivalents. Keep all provider/layout/component imports as static. The complete new import section:

```tsx
import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ContentProvider } from './contexts/ContentContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SocketProvider } from './contexts/SocketContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalStyles } from './components/GlobalStyles';
import { Toaster } from 'sonner';
import { useTheme } from './contexts/ThemeContext';
import { PublicLayout } from './layouts/PublicLayout';
import { CookieConsent } from './components/CookieConsent';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import { useContent } from './contexts/ContentContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Dashboard layouts (lazy — only needed for authenticated users)
const DashboardLayout      = lazy(() => import('./layouts/DashboardLayout'));
const TeamDashboardLayout  = lazy(() => import('./layouts/TeamDashboardLayout').then(m => ({ default: m.TeamDashboardLayout })));
const UserDashboardLayout  = lazy(() => import('./layouts/UserDashboardLayout').then(m => ({ default: m.UserDashboardLayout })));

// ─── Public Pages ────────────────────────────────────────────────────────────
const Home                   = lazy(() => import('./pages/public/Home'));
const Services               = lazy(() => import('./pages/public/Services'));
const ServiceDetail          = lazy(() => import('./pages/public/ServiceDetail'));
const Portfolio              = lazy(() => import('./pages/public/Portfolio'));
const ProjectDetail          = lazy(() => import('./pages/public/ProjectDetail'));
const Contact                = lazy(() => import('./pages/public/Contact'));
const ContactSuccess         = lazy(() => import('./pages/public/ContactSuccess'));
const Login                  = lazy(() => import('./pages/public/Login'));
const Signup                 = lazy(() => import('./pages/public/Signup'));
const NotFound               = lazy(() => import('./pages/public/NotFound'));
const ServerError            = lazy(() => import('./pages/public/ServerError'));
const StyleGuide             = lazy(() => import('./pages/public/StyleGuide'));
const PrivacyPolicy          = lazy(() => import('./pages/public/PrivacyPolicy'));
const TermsOfService         = lazy(() => import('./pages/public/TermsOfService'));
const CookiesSettings        = lazy(() => import('./pages/public/CookiesSettings'));
const Verification           = lazy(() => import('./pages/public/Verification'));
const Team                   = lazy(() => import('./pages/public/Team'));
const JobApplication         = lazy(() => import('./pages/public/JobApplication'));
const JobPrivacyPolicy       = lazy(() => import('./pages/public/JobPrivacyPolicy'));
const JobApplicationSuccess  = lazy(() => import('./pages/public/JobApplicationSuccess'));
const Careers                = lazy(() => import('./pages/public/Careers'));
const JobDetail              = lazy(() => import('./pages/public/JobDetail'));
const UnderConstruction      = lazy(() => import('./pages/public/UnderConstruction'));
const Maintenance            = lazy(() => import('./pages/public/Maintenance'));
const SkeletonPage           = lazy(() => import('./pages/public/SkeletonPage'));
const LoadingPage            = lazy(() => import('./pages/public/LoadingPage'));
const PageLoader             = lazy(() => import('./pages/public/PageLoader'));
const OAuthCallback          = lazy(() => import('./pages/public/OAuthCallback'));
const OtpVerification        = lazy(() => import('./pages/OtpVerification'));

// ─── Email Templates ─────────────────────────────────────────────────────────
const SignupConfirmation  = lazy(() => import('./pages/emails/SignupConfirmation'));
const EmailVerification  = lazy(() => import('./pages/emails/EmailVerification'));
const PasswordReset      = lazy(() => import('./pages/emails/PasswordReset'));
const ProjectCreated     = lazy(() => import('./pages/emails/ProjectCreated'));
const ProjectCompleted   = lazy(() => import('./pages/emails/ProjectCompleted'));
const FeedbackRequest    = lazy(() => import('./pages/emails/FeedbackRequest'));

// ─── Admin Pages ─────────────────────────────────────────────────────────────
const DashboardHome         = lazy(() => import('./pages/admin/DashboardHome'));
const Messages              = lazy(() => import('./pages/admin/Messages'));
const Projects              = lazy(() => import('./pages/admin/Projects'));
const ServicesAdmin         = lazy(() => import('./pages/admin/ServicesAdmin'));
const CategoriesAdmin       = lazy(() => import('./pages/admin/CategoriesAdmin'));
const AITools               = lazy(() => import('./pages/admin/AITools'));
const ChatbotManager        = lazy(() => import('./pages/admin/ChatbotManager'));
const Support               = lazy(() => import('./pages/admin/Support'));
const Notifications         = lazy(() => import('./pages/admin/Notifications'));
const Settings              = lazy(() => import('./pages/admin/Settings'));
const ContentEditor         = lazy(() => import('./pages/admin/ContentEditor'));
const TeamManagement        = lazy(() => import('./pages/admin/TeamManagement'));
const JobManagement         = lazy(() => import('./pages/admin/JobManagement'));
const AdminJobApplications  = lazy(() => import('./pages/admin/AdminJobApplications'));
const ClientManagement      = lazy(() => import('./pages/admin/ClientManagement'));
const ContactManagement     = lazy(() => import('./pages/admin/ContactManagement'));
const DatabaseManager       = lazy(() => import('./pages/admin/DatabaseManager'));
const ClientProjectRequests = lazy(() => import('./pages/admin/ClientProjectRequests'));
const PageManager           = lazy(() => import('./pages/admin/PageManager'));
const AnnouncementManager   = lazy(() => import('./pages/admin/AnnouncementManager'));
const NavFooterManager      = lazy(() => import('./pages/admin/NavFooterManager'));

// ─── Team Pages ───────────────────────────────────────────────────────────────
const TeamDashboardHome       = lazy(() => import('./pages/team/TeamDashboardHome'));
const TeamProjects            = lazy(() => import('./pages/team/TeamProjects'));
const TeamProjectDetail       = lazy(() => import('./pages/team/TeamProjectDetail'));
const TeamTasks               = lazy(() => import('./pages/team/TeamTasks'));
const TeamReports             = lazy(() => import('./pages/team/TeamReports'));
const TeamNotifications       = lazy(() => import('./pages/team/TeamNotifications'));
const TeamSettings            = lazy(() => import('./pages/team/TeamSettings'));
const TeamCalendar            = lazy(() => import('./pages/team/TeamCalendar'));
const TeamChat                = lazy(() => import('./pages/team/TeamChat'));
const TeamResources           = lazy(() => import('./pages/team/TeamResources'));
const TeamClientRequestDetail = lazy(() => import('./pages/team/TeamClientRequestDetail'));
const TeamSupport             = lazy(() => import('./pages/team/TeamSupport'));
const TeamAIChat              = lazy(() => import('./pages/team/TeamAIChat'));
const TeamAppliedJobs         = lazy(() => import('./pages/team/TeamAppliedJobs'));

// ─── User Pages ───────────────────────────────────────────────────────────────
const UserDashboardHome  = lazy(() => import('./pages/user/UserDashboardHome'));
const UserProjects       = lazy(() => import('./pages/user/UserProjects'));
const UserChat           = lazy(() => import('./pages/user/UserChat'));
const UserAIChat         = lazy(() => import('./pages/user/UserAIChat'));
const UserProfile        = lazy(() => import('./pages/user/UserProfile'));
const UserNotifications  = lazy(() => import('./pages/user/UserNotifications'));
const UserAppliedJobs    = lazy(() => import('./pages/user/UserAppliedJobs'));
const UserBilling        = lazy(() => import('./pages/user/UserBilling'));
const UserSupport        = lazy(() => import('./pages/user/UserSupport'));
```

- [ ] **Step 2: Import PageLoader as a static fallback component**

`PageLoader` is lazy too — we need a static fallback for the Suspense boundary itself. Add this import (static, not lazy):

```tsx
// At the top of App.tsx, with the static imports:
import PageLoaderFallback from './pages/public/PageLoader';
```

> Note: `PageLoader` is also exported as a lazy component for its route. The static import `PageLoaderFallback` is used exclusively as the Suspense fallback — it's a separate import.

- [ ] **Step 3: Wrap route groups with `<Suspense>` and `<ErrorBoundary>` in the `App()` return**

Replace the existing `<Routes>` block with:

```tsx
<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  <CookieConsent />
  <Routes>
    {/* Public Routes */}
    <Route element={<PublicLayout />}>
      <ErrorBoundary>
        <Suspense fallback={<PageLoaderFallback />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:slug" element={<ProjectDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/contact/success" element={<ContactSuccess />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/500" element={<ServerError />} />
          <Route path="/style-guide" element={<StyleGuide />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiesSettings />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/our-team" element={<Team />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/careers/:id" element={<JobDetail />} />
          <Route path="/careers/apply" element={<JobApplication />} />
          <Route path="/careers/apply/success" element={<JobApplicationSuccess />} />
          <Route path="/careers/privacy" element={<JobPrivacyPolicy />} />
          <Route path="/coming-soon" element={<UnderConstruction />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/skeleton" element={<SkeletonPage />} />
          <Route path="/loading" element={<LoadingPage />} />
          <Route path="/page-loader" element={<PageLoader />} />
          <Route path="/emails/signup-confirmation" element={<SignupConfirmation />} />
          <Route path="/emails/email-verification" element={<EmailVerification />} />
          <Route path="/emails/password-reset" element={<PasswordReset />} />
          <Route path="/emails/project-created" element={<ProjectCreated />} />
          <Route path="/emails/project-completed" element={<ProjectCompleted />} />
          <Route path="/emails/feedback-request" element={<FeedbackRequest />} />
          <Route path="/otp-verification" element={<OtpVerification />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="*" element={<NotFound />} />
        </Suspense>
      </ErrorBoundary>
    </Route>

    {/* Admin Routes */}
    <Route path="/admin" element={
      <ProtectedRoute allowedRoles={['admin']}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoaderFallback />}>
            <DashboardLayout />
          </Suspense>
        </ErrorBoundary>
      </ProtectedRoute>
    }>
      <Route index element={<DashboardHome />} />
      <Route path="messages" element={<Messages />} />
      <Route path="projects" element={<Projects />} />
      <Route path="services" element={<ServicesAdmin />} />
      <Route path="categories" element={<CategoriesAdmin />} />
      <Route path="ai-tools" element={<AITools />} />
      <Route path="chatbot-manager" element={<ChatbotManager />} />
      <Route path="support" element={<Support />} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="team" element={<TeamManagement />} />
      <Route path="clients" element={<ClientManagement />} />
      <Route path="client-requests" element={<ClientProjectRequests />} />
      <Route path="contacts" element={<ContactManagement />} />
      <Route path="jobs" element={<JobManagement />} />
      <Route path="job-applications" element={<AdminJobApplications />} />
      <Route path="database" element={<DatabaseManager />} />
      <Route path="announcements" element={<AnnouncementManager />} />
      <Route path="page-manager" element={<PageManager />} />
      <Route path="nav-footer" element={<NavFooterManager />} />
      <Route path="content-editor" element={<ContentEditor />} />
      <Route path="settings" element={<Settings />} />
    </Route>

    {/* Team Dashboard Routes */}
    <Route path="/team" element={
      <ProtectedRoute allowedRoles={['admin', 'team']}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoaderFallback />}>
            <TeamDashboardLayout />
          </Suspense>
        </ErrorBoundary>
      </ProtectedRoute>
    }>
      <Route index element={<TeamDashboardHome />} />
      <Route path="projects" element={<TeamProjects />} />
      <Route path="projects/:id" element={<TeamProjectDetail />} />
      <Route path="client-requests/:id" element={<TeamClientRequestDetail />} />
      <Route path="tasks" element={<TeamTasks />} />
      <Route path="reports" element={<TeamReports />} />
      <Route path="calendar" element={<TeamCalendar />} />
      <Route path="chat" element={<TeamChat />} />
      <Route path="resources" element={<TeamResources />} />
      <Route path="notifications" element={<TeamNotifications />} />
      <Route path="settings" element={<TeamSettings />} />
      <Route path="ai-assistant" element={<TeamAIChat />} />
      <Route path="support" element={<TeamSupport />} />
      <Route path="applied-jobs" element={<TeamAppliedJobs />} />
    </Route>

    {/* User Dashboard Routes */}
    <Route path="/user-dashboard" element={
      <ProtectedRoute allowedRoles={['admin', 'team', 'user']}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoaderFallback />}>
            <UserDashboardLayout />
          </Suspense>
        </ErrorBoundary>
      </ProtectedRoute>
    }>
      <Route index element={<UserDashboardHome />} />
      <Route path="projects" element={<UserProjects />} />
      <Route path="messages" element={<UserChat />} />
      <Route path="ai-assistant" element={<UserAIChat />} />
      <Route path="applied-jobs" element={<UserAppliedJobs />} />
      <Route path="billing" element={<UserBilling />} />
      <Route path="profile" element={<UserProfile />} />
      <Route path="notifications" element={<UserNotifications />} />
      <Route path="support" element={<UserSupport />} />
    </Route>
  </Routes>
</BrowserRouter>
```

> **Note on Suspense + Routes nesting:** React Router v6 requires `<Route>` to be a direct child of `<Routes>` or another `<Route>`. Wrapping with `<Suspense>` and `<ErrorBoundary>` inside the public `<Route element={<PublicLayout/>}>` works because they wrap the inner route elements, not the `<Route>` declarations themselves. Admin/team/user routes place the wrappers on the layout element prop — this is the correct pattern.

- [ ] **Step 4: Verify in browser**

Start the dev server:
```bash
cd client && npm run dev
```

Open browser → DevTools → Network tab → filter by JS. Navigate to `/` — verify that admin/team/user dashboard chunks are NOT downloaded. Navigate to `/admin` — verify the admin chunk downloads on demand.

- [ ] **Step 5: Commit**

```bash
git add client/src/App.tsx
git commit -m "perf: lazy-load all 55+ page components via React.lazy + Suspense"
```

---

## Task 3: Error Boundary Component

**Files:**
- Create: `client/src/components/ErrorBoundary.tsx`

- [ ] **Step 1: Create `client/src/components/ErrorBoundary.tsx`**

```tsx
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Verify it is already imported in App.tsx from Task 2**

The import `import { ErrorBoundary } from './components/ErrorBoundary';` was added in Task 2. Confirm it is present in `client/src/App.tsx`.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ErrorBoundary.tsx
git commit -m "feat: add ErrorBoundary component to isolate render crashes"
```

---

## Task 4: Web Vitals Monitoring

**Files:**
- Create: `client/src/lib/webVitals.ts`
- Modify: `client/src/main.tsx`

- [ ] **Step 1: Install `web-vitals`**

```bash
cd client && npm install web-vitals
```

Expected: `web-vitals` appears in `client/package.json` dependencies.

- [ ] **Step 2: Create `client/src/lib/webVitals.ts`**

```ts
import type { Metric } from 'web-vitals';

function logToConsole(metric: Metric): void {
  const { name, value, rating } = metric;
  const color =
    rating === 'good' ? '#22c55e' :
    rating === 'needs-improvement' ? '#f59e0b' :
    '#ef4444';
  console.log(
    `%c[Web Vitals] ${name}: ${Math.round(value)}${name === 'CLS' ? '' : 'ms'} — ${rating}`,
    `color: ${color}; font-weight: bold`
  );
}

function sendToBackend(metric: Metric): void {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/v1/health/vitals',
        new Blob([body], { type: 'application/json' })
      );
    } else {
      fetch('/api/v1/health/vitals', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Fire-and-forget — never throw
  }
}

export function reportWebVitals(): void {
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    const handler = (metric: Metric) => {
      if (import.meta.env.DEV) {
        logToConsole(metric);
      } else {
        sendToBackend(metric);
      }
    };
    onCLS(handler);
    onFCP(handler);
    onLCP(handler);
    onTTFB(handler);
    onINP(handler);
  });
}
```

- [ ] **Step 3: Call `reportWebVitals()` in `client/src/main.tsx`**

Replace the full file:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { reportWebVitals } from './lib/webVitals'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

reportWebVitals()
```

- [ ] **Step 4: Verify**

Start dev server, open browser console. Within a few seconds of page load, you should see colored `[Web Vitals]` log lines like:

```
[Web Vitals] FCP: 312ms — good
[Web Vitals] LCP: 890ms — good
[Web Vitals] CLS: 0 — good
```

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/webVitals.ts client/src/main.tsx client/package.json client/package-lock.json
git commit -m "feat: add Web Vitals monitoring (LCP, FCP, CLS, TTFB, INP)"
```

---

## Task 5: Client-Side API Cache

**Files:**
- Create: `client/src/lib/apiCache.ts`
- Modify: `client/src/contexts/ContentContext.tsx`
- Modify: `client/src/api/pageStatus.api.ts`

- [ ] **Step 1: Create `client/src/lib/apiCache.ts`**

```ts
interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const _cache = new Map<string, CacheEntry>();

export const apiCache = {
  get(key: string): unknown | null {
    const entry = _cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      _cache.delete(key);
      return null;
    }
    return entry.data;
  },

  set(key: string, data: unknown, ttlMs: number): void {
    _cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  },

  invalidate(keyPrefix: string): void {
    for (const key of _cache.keys()) {
      if (key.startsWith(keyPrefix)) _cache.delete(key);
    }
  },

  clear(): void {
    _cache.clear();
  },
};

/** Convenience TTL constants in milliseconds */
export const TTL = {
  ONE_MIN:  60_000,
  TWO_MIN:  120_000,
  FIVE_MIN: 300_000,
  TEN_MIN:  600_000,
} as const;
```

- [ ] **Step 2: Add cache to `fetchCMS` in `client/src/contexts/ContentContext.tsx`**

Find the `fetchCMS` function (around line 367). Add cache check at the top:

```ts
// Add this import at the top of ContentContext.tsx:
import { apiCache, TTL } from '../lib/apiCache';

// Inside fetchCMS, before the try block:
const fetchCMS = useCallback(async () => {
  const CACHE_KEY = 'cms:main';
  const cached = apiCache.get(CACHE_KEY) as any;
  if (cached) {
    const mapped = mapCmsToState(cached);
    setLogoUrl(mapped.logoUrl || defaultLogoUrl);
    if (mapped.techStack.length > 0) setTechStack(mapped.techStack);
    if (mapped.processSteps.length > 0) setProcessSteps(mapped.processSteps);
    setWhyChooseUs(mapped.whyChooseUs);
    setContactInfo(mapped.contactInfo);
    setSocialLinks(mapped.socialLinks);
    setTestimonials(mapped.testimonials);
    setGlobalTheme(cached.globalTheme ?? null);
    setIsLoading(false);
    return;
  }
  try {
    const res = await cmsApi.get();
    const cms = res.data.data;
    if (!cms) return;
    apiCache.set(CACHE_KEY, cms, TTL.TEN_MIN); // ← add this line
    const mapped = mapCmsToState(cms);
    // ... rest of existing setLogoUrl, setTechStack, etc. lines unchanged
```

- [ ] **Step 3: Add cache to `fetchPageStatuses` in `client/src/contexts/ContentContext.tsx`**

Find the `fetchPageStatuses` function (around line 409). Add cache:

```ts
const fetchPageStatuses = useCallback(() => {
  const CACHE_KEY = 'page-status:all';
  const cached = apiCache.get(CACHE_KEY);
  if (cached) {
    setPageStatuses(cached as PageStatusItem[]);
    return;
  }
  pageStatusApi.getAll()
    .then(res => {
      const data = res.data.data ?? [];
      apiCache.set(CACHE_KEY, data, TTL.TWO_MIN);
      setPageStatuses(data);
    })
    .catch(() => {});
}, []);
```

- [ ] **Step 4: Invalidate page-status cache in `client/src/api/pageStatus.api.ts`**

Open `client/src/api/pageStatus.api.ts`. Add an import and invalidation on mutation methods:

```ts
import { apiCache } from '../lib/apiCache';

// Inside the api object, wrap update/create/delete to invalidate cache:
update: async (key: string, status: string) => {
  const res = await apiClient.put(`/page-status/${key}`, { status });
  apiCache.invalidate('page-status:');
  return res;
},
create: async (payload: unknown) => {
  const res = await apiClient.post('/page-status', payload);
  apiCache.invalidate('page-status:');
  return res;
},
delete: async (key: string) => {
  const res = await apiClient.delete(`/page-status/${key}`);
  apiCache.invalidate('page-status:');
  return res;
},
```

> Read `client/src/api/pageStatus.api.ts` first to match the exact existing method names and signatures before making this edit.

- [ ] **Step 5: Verify**

Start dev server. Open DevTools → Network tab. Reload the page once — CMS calls appear. Reload again — the `GET /api/v1/cms` request should NOT appear (served from cache). Console should show no errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/lib/apiCache.ts client/src/contexts/ContentContext.tsx client/src/api/pageStatus.api.ts
git commit -m "perf: add client-side in-memory TTL cache for CMS and page-status"
```

---

## Task 6: Backend Compression

**Files:**
- Modify: `server/src/app.js`
- Modify: `server/package.json` (via npm install)

- [ ] **Step 1: Install `compression`**

```bash
cd server && npm install compression
```

- [ ] **Step 2: Add compression to `server/src/app.js`**

Add the import at the top of `app.js`:

```js
import compression from 'compression';
```

Add the middleware after the Helmet block and before `app.use(cors(...))`:

```js
// ─── Compression ────────────────────────────────────────────────────────────
// Gzip-compress all responses above 1KB — reduces JSON payload by 60-80%.
app.use(compression({ threshold: 1024 }));
```

- [ ] **Step 3: Verify**

Start the server: `cd server && npm run dev`

```bash
curl -s -I -H "Accept-Encoding: gzip" http://localhost:8000/api/v1/services
```

Expected: Response headers include `Content-Encoding: gzip`

- [ ] **Step 4: Commit**

```bash
git add server/src/app.js server/package.json server/package-lock.json
git commit -m "perf: add gzip compression middleware (threshold 1KB)"
```

---

## Task 7: HTTP Cache Headers Middleware

**Files:**
- Create: `server/src/middlewares/cacheHeaders.js`
- Modify: 6 route files

- [ ] **Step 1: Create `server/src/middlewares/cacheHeaders.js`**

```js
/**
 * HTTP cache header helpers.
 *
 * setCacheHeaders(seconds) — public cacheable responses (CDN + browser)
 * noCache                  — auth-required or mutation responses
 */

/**
 * @param {number} maxAgeSeconds
 * @returns {import('express').RequestHandler}
 */
export function setCacheHeaders(maxAgeSeconds) {
  return (_req, res, next) => {
    res.set('Cache-Control', `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${Math.floor(maxAgeSeconds / 2)}`);
    next();
  };
}

/**
 * @returns {import('express').RequestHandler}
 */
export function noCache(_req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
}
```

- [ ] **Step 2: Apply to `server/src/routes/userRoutes/services.route.js`**

Add import and apply to GET routes:

```js
import { setCacheHeaders } from '../../middlewares/cacheHeaders.js';

// Apply to existing GET routes:
router.route('/').get(setCacheHeaders(300), getAllServices);
router.route('/:slug').get(setCacheHeaders(300), getServiceBySlug);
router.route('/id/:id').get(setCacheHeaders(300), getServiceById);
```

- [ ] **Step 3: Apply to `server/src/routes/userRoutes/jobs.route.js`**

Read the file first, then add `setCacheHeaders(300)` to all public GET routes (not admin-only ones).

- [ ] **Step 4: Apply to `server/src/routes/userRoutes/adminProject.route.js`**

Read the file first, then add `setCacheHeaders(300)` to the public GET route (portfolio list and detail).

- [ ] **Step 5: Apply to `server/src/routes/userRoutes/announcement.route.js`**

Read the file first, then add `setCacheHeaders(60)` (1 min — announcements change more frequently) to the public GET route.

- [ ] **Step 6: Apply to `server/src/routes/userRoutes/cms.route.js`**

Read the file first, then add `setCacheHeaders(600)` (10 min) to the GET route.

- [ ] **Step 7: Apply to `server/src/routes/userRoutes/pageStatus.route.js`**

Read the file first, then add `setCacheHeaders(120)` (2 min) to the public GET route.

- [ ] **Step 8: Verify**

```bash
curl -s -I http://localhost:8000/api/v1/services
```

Expected: Response headers include `Cache-Control: public, max-age=300, stale-while-revalidate=150`

- [ ] **Step 9: Commit**

```bash
git add server/src/middlewares/cacheHeaders.js \
        server/src/routes/userRoutes/services.route.js \
        server/src/routes/userRoutes/jobs.route.js \
        server/src/routes/userRoutes/adminProject.route.js \
        server/src/routes/userRoutes/announcement.route.js \
        server/src/routes/userRoutes/cms.route.js \
        server/src/routes/userRoutes/pageStatus.route.js
git commit -m "perf: add HTTP Cache-Control headers to public read-only routes"
```

---

## Task 8: Redis Config + Cache Middleware

**Files:**
- Create: `server/src/config/redis.js`
- Create: `server/src/middlewares/redisCache.js`

- [ ] **Step 1: Create `server/src/config/redis.js`**

```js
/**
 * Singleton ioredis client.
 *
 * Graceful fallback: if Redis is unavailable, all operations are no-ops.
 * The app works normally without Redis — it just loses the server-side cache.
 *
 * Add REDIS_URL=redis://localhost:6379 to .env to enable.
 */
import Redis from 'ioredis';

let _client = null;

export function getRedisClient() {
  if (!_client) {
    _client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      enableOfflineQueue: false,   // Don't queue commands when disconnected
      maxRetriesPerRequest: 1,     // Fail fast — don't hang requests
      connectTimeout: 3000,        // 3s connection timeout
    });

    _client.on('error', (err) => {
      // Suppress repeated connection errors in dev to avoid log spam
      if (process.env.NODE_ENV === 'development') return;
      console.error('[Redis] Connection error:', err.message);
    });

    _client.on('connect', () => {
      console.log('[Redis] Connected');
    });
  }
  return _client;
}

export async function closeRedis() {
  if (_client) {
    try {
      await _client.quit();
    } catch {
      _client.disconnect();
    }
    _client = null;
  }
}
```

- [ ] **Step 2: Create `server/src/middlewares/redisCache.js`**

```js
/**
 * Redis response cache middleware.
 *
 * Usage: router.get('/path', cacheMiddleware(300), controller)
 *
 * - Cache hit  → return JSON immediately, set X-Cache: HIT header
 * - Cache miss → let request proceed, intercept res.json(), store in Redis
 * - Redis down → silently skip, app works normally
 */
import { getRedisClient } from '../config/redis.js';

/**
 * @param {number} ttlSeconds
 * @returns {import('express').RequestHandler}
 */
export function cacheMiddleware(ttlSeconds) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const redis = getRedisClient();
    const key = `cache:GET:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    } catch {
      // Redis unavailable — skip cache, proceed normally
      return next();
    }

    // Intercept res.json to store the response in Redis
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      res.set('X-Cache', 'MISS');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Non-blocking — don't delay the response
        redis.setex(key, ttlSeconds, JSON.stringify(body)).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate all cache keys matching a prefix pattern.
 * Call this in controllers after create/update/delete operations.
 *
 * @param {string} urlFragment — e.g. '/services', '/jobs', '/announcements'
 */
export async function invalidateCache(urlFragment) {
  const redis = getRedisClient();
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor, 'MATCH', `cache:GET:*${urlFragment}*`, 'COUNT', 100
      );
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  } catch {
    // Redis unavailable — skip invalidation silently
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add server/src/config/redis.js server/src/middlewares/redisCache.js
git commit -m "feat: add Redis singleton client and response cache middleware"
```

---

## Task 9: Apply Redis Cache to Routes and Controllers

**Files:**
- Modify: 6 route files (same as Task 7)
- Modify: 4 controller files

- [ ] **Step 1: Add `cacheMiddleware` to `server/src/routes/userRoutes/services.route.js`**

```js
import { cacheMiddleware } from '../../middlewares/redisCache.js';

// Update existing GET routes (keep setCacheHeaders from Task 7):
router.route('/').get(setCacheHeaders(300), cacheMiddleware(300), getAllServices);
router.route('/:slug').get(setCacheHeaders(300), cacheMiddleware(300), getServiceBySlug);
router.route('/id/:id').get(setCacheHeaders(300), cacheMiddleware(300), getServiceById);
```

- [ ] **Step 2: Apply same pattern to jobs, adminProject, announcement, cms, pageStatus route files**

For each file, read it first, then add `cacheMiddleware(N)` after `setCacheHeaders(N)` on the same GET routes. Use matching TTL values:
- `jobs.route.js` → `cacheMiddleware(300)`
- `adminProject.route.js` → `cacheMiddleware(300)`
- `announcement.route.js` → `cacheMiddleware(60)`
- `cms.route.js` → `cacheMiddleware(600)`
- `pageStatus.route.js` → `cacheMiddleware(120)`

- [ ] **Step 3: Add cache invalidation to `server/src/controllers/usersControllers/services.controller.js`**

Read the file first. In `createService`, `updateService`, `deleteService`, and `bulkDeleteServices` controllers, add this after the successful DB write and before the success response:

```js
import { invalidateCache } from '../../middlewares/redisCache.js';

// Inside createService, after DB save:
await invalidateCache('/services');

// Inside updateService, after DB update:
await invalidateCache('/services');

// Inside deleteService, after DB delete:
await invalidateCache('/services');

// Inside bulkDeleteServices, after DB delete:
await invalidateCache('/services');
```

- [ ] **Step 4: Repeat for `jobs.controller.js`**

Read the file. Find create/update/delete controller functions. Add after successful DB write:

```js
import { invalidateCache } from '../../middlewares/redisCache.js';
// After each mutation:
await invalidateCache('/jobs');
```

- [ ] **Step 5: Repeat for `adminProject.controller.js`**

```js
await invalidateCache('/admin/projects');
```

- [ ] **Step 6: Repeat for `announcement.controller.js`**

```js
await invalidateCache('/announcements');
```

- [ ] **Step 7: Verify Redis cache is working**

Make sure Redis is running locally (`redis-server` or via Docker: `docker run -d -p 6379:6379 redis`).

```bash
# First request — cache miss
curl -s -I http://localhost:8000/api/v1/services
# Expected header: X-Cache: MISS

# Second request — cache hit
curl -s -I http://localhost:8000/api/v1/services
# Expected header: X-Cache: HIT
```

> If Redis is not running, both requests should return normally without X-Cache header — graceful fallback working.

- [ ] **Step 8: Commit**

```bash
git add server/src/routes/userRoutes/services.route.js \
        server/src/routes/userRoutes/jobs.route.js \
        server/src/routes/userRoutes/adminProject.route.js \
        server/src/routes/userRoutes/announcement.route.js \
        server/src/routes/userRoutes/cms.route.js \
        server/src/routes/userRoutes/pageStatus.route.js \
        server/src/controllers/usersControllers/services.controller.js \
        server/src/controllers/usersControllers/jobs.controller.js \
        server/src/controllers/usersControllers/adminProject.controller.js \
        server/src/controllers/usersControllers/announcement.controller.js
git commit -m "perf: apply Redis response cache to public GET routes with mutation invalidation"
```

---

## Task 10: Health Check Endpoint

**Files:**
- Create: `server/src/routes/userRoutes/health.route.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: Create `server/src/routes/userRoutes/health.route.js`**

```js
/**
 * Health check endpoints.
 *
 * GET  /api/v1/health         — public; returns server/DB/Redis status
 * POST /api/v1/health/vitals  — public; accepts Web Vitals reports from frontend
 */
import express from 'express';
import mongoose from 'mongoose';
import { getRedisClient } from '../../config/redis.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  const mem = process.memoryUsage();
  const fmt = (bytes) => `${Math.round(bytes / 1024 / 1024)}MB`;

  let redisStatus = 'unavailable';
  try {
    const pong = await Promise.race([
      getRedisClient().ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
    ]);
    redisStatus = pong === 'PONG' ? 'connected' : 'degraded';
  } catch {
    redisStatus = 'unavailable';
  }

  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      rss:       fmt(mem.rss),
      heapUsed:  fmt(mem.heapUsed),
      heapTotal: fmt(mem.heapTotal),
    },
    db:    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisStatus,
  });
});

router.post('/vitals', (req, res) => {
  const { name, value, rating } = req.body ?? {};
  if (name && value !== undefined) {
    console.log(`[Web Vital] ${name}: ${Math.round(value)}${name === 'CLS' ? '' : 'ms'} — ${rating}`);
  }
  res.status(204).end();
});

export default router;
```

- [ ] **Step 2: Register route in `server/src/app.js`**

Add import near the other route imports:

```js
import healthRoutes from './routes/userRoutes/health.route.js';
```

Register it before the error handler (with the other route groups):

```js
app.use('/api/v1/health', healthRoutes);              // Health check + Web Vitals
```

- [ ] **Step 3: Verify**

```bash
curl http://localhost:8000/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 42,
  "timestamp": "2026-04-13T12:00:00.000Z",
  "memory": { "rss": "45MB", "heapUsed": "28MB", "heapTotal": "50MB" },
  "db": "connected",
  "redis": "connected"
}
```

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/userRoutes/health.route.js server/src/app.js
git commit -m "feat: add /api/v1/health endpoint with DB/Redis status and Web Vitals receiver"
```

---

## Task 11: Graceful Shutdown

**Files:**
- Modify: `server/src/index.js`

- [ ] **Step 1: Update `server/src/index.js` to add graceful shutdown**

Add imports for `mongoose` and `closeRedis` at the top, then add the shutdown handler after `httpServer.listen`. The full updated file:

```js
import dns from "dns";
import http from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./database/database.js";
import app from "./app.js";
import { initSocket } from "./socket/socketServer.js";
import { closeRedis } from "./config/redis.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const PORT = process.env.PORT || 8000;
const httpServer = http.createServer(app);

const io = await initSocket(httpServer, {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
});

app.set("io", io);

connectDB()
    .then(() => {
        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Socket.IO is active on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log("Error connecting to database");
        console.log(error.message);
        process.exit(1);
    });

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
function gracefulShutdown(signal) {
    console.log(`\n[Shutdown] ${signal} received. Closing server gracefully...`);

    // Force-exit safety valve — if shutdown hangs, kill after 10s
    const forceExit = setTimeout(() => {
        console.error('[Shutdown] Timed out. Forcing exit.');
        process.exit(1);
    }, 10_000);
    forceExit.unref(); // Don't let this timer keep the process alive

    httpServer.close(async () => {
        console.log('[Shutdown] HTTP server closed.');

        try {
            await mongoose.connection.close();
            console.log('[Shutdown] MongoDB connection closed.');
        } catch (err) {
            console.error('[Shutdown] MongoDB close error:', err.message);
        }

        try {
            await closeRedis();
            console.log('[Shutdown] Redis connection closed.');
        } catch (err) {
            console.error('[Shutdown] Redis close error:', err.message);
        }

        process.exit(0);
    });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
```

- [ ] **Step 2: Verify**

Start the server: `npm run dev`

Press `Ctrl+C`. Expected console output:
```
[Shutdown] SIGINT received. Closing server gracefully...
[Shutdown] HTTP server closed.
[Shutdown] MongoDB connection closed.
[Shutdown] Redis connection closed.
```
Process exits cleanly (no hanging).

- [ ] **Step 3: Commit**

```bash
git add server/src/index.js
git commit -m "feat: add graceful SIGTERM/SIGINT shutdown with 10s force-exit fallback"
```

---

## Task 12: MongoDB Compound Indexes

**Files:**
- Modify: `server/src/models/usersModels/Project.model.js`
- Modify: `server/src/models/usersModels/Notification.model.js`
- Modify: `server/src/models/usersModels/Task.model.js`

> **Note:** `ChatbotSession.model.js` already has `sessionId: { unique: true, index: true }` — no changes needed there.
> `Project.model.js` already has individual indexes on `requestedBy` and `status`. We add a **compound** index that covers the common `{ requestedBy, isArchived, status }` filter pattern — MongoDB uses the compound index instead of intersecting two single-field indexes.

- [ ] **Step 1: Add compound index to `server/src/models/usersModels/Project.model.js`**

Find the end of `projectRequestSchema` definition (before `mongoose.model(...)`). Add:

```js
// Compound index for the most common query: user's non-archived projects by status
projectRequestSchema.index({ requestedBy: 1, isArchived: 1, status: 1 });
```

- [ ] **Step 2: Add compound index to `server/src/models/usersModels/Notification.model.js`**

The model has `recipientId` with `index: true` already. Add a compound index after the schema definition (before `mongoose.model(...)`):

```js
// Compound index for: "unread notifications for user X, sorted newest first"
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
```

- [ ] **Step 3: Add compound index to `server/src/models/usersModels/Task.model.js`**

The model has `assignedTo` and `status` with individual `index: true` already. Add compound:

```js
// Compound index for: "tasks assigned to team member X with status Y"
taskSchema.index({ assignedTo: 1, status: 1 });
```

- [ ] **Step 4: Verify indexes are synced**

Restart the server (`npm run dev`). MongoDB Atlas's auto-index sync will run on startup. Check MongoDB Atlas dashboard → Collections → indexes to confirm the new compound indexes appear. Alternatively, in the server console you should see no index errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/models/usersModels/Project.model.js \
        server/src/models/usersModels/Notification.model.js \
        server/src/models/usersModels/Task.model.js
git commit -m "perf: add compound indexes for Project, Notification, and Task queries"
```

---

## Self-Review

### Spec Coverage Check

| Spec requirement | Task |
|---|---|
| React.lazy code splitting | Task 2 |
| Vite manual chunks + esbuild | Task 1 |
| Error Boundaries | Task 3 |
| Web Vitals monitoring | Task 4 |
| Client-side API cache | Task 5 |
| Backend gzip compression | Task 6 |
| HTTP Cache-Control headers | Task 7 |
| Redis config + cache middleware | Task 8 |
| Apply Redis to routes + invalidation | Task 9 |
| Health check endpoint | Task 10 |
| Graceful shutdown | Task 11 |
| MongoDB compound indexes | Task 12 |

All 11 spec items covered. ✓

### Type/Name Consistency

- `ErrorBoundary` exported as named export in Task 3, imported as named in Task 2. ✓
- `reportWebVitals` exported from `webVitals.ts`, called in `main.tsx`. ✓
- `apiCache` and `TTL` exported from `apiCache.ts`, imported in `ContentContext.tsx` and `pageStatus.api.ts`. ✓
- `getRedisClient()` and `closeRedis()` exported from `redis.js`, used in `redisCache.js`, `health.route.js`, `index.js`. ✓
- `cacheMiddleware(n)` and `invalidateCache(prefix)` exported from `redisCache.js`, used in routes and controllers. ✓
- `setCacheHeaders(n)` and `noCache` exported from `cacheHeaders.js`, used in routes. ✓

### Notes for Executor

1. **Task 2 - Suspense + Routes nesting:** If the `<ErrorBoundary>` + `<Suspense>` wrapping inside `<Route element={<PublicLayout/>}>` causes React Router warnings, move them directly onto the `<Route element={...}>` prop similar to admin/team/user routes.
2. **Task 5 - ContentContext edit:** The `fetchCMS` function is long. Read the full function before editing to ensure the cache-hit branch sets all the same state that the API branch does.
3. **Tasks 7/9 - Route file reads:** Always read each route file before adding middleware. Some routes use `router.get()` and others use `router.route().get()` — match the existing style.
4. **Task 12 - Index sync:** Mongoose `autoIndex` is `true` by default in development. If you see `MongoServerError: Index build failed` on startup, it means a conflicting index exists — drop it manually from Atlas.
