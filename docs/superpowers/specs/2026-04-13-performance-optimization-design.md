# Performance Optimization & Production-Grade Upgrades — Design Spec
**Date:** 2026-04-13  
**Project:** Nabeel Agency Website (MERN Stack)  
**Approach:** Comprehensive Full-Stack (Approach B)  
**Constraint:** Zero UI/feature/animation changes — infrastructure only

---

## Problem Statement

The website is slow across all surfaces:
- Initial page load is heavy because all 50+ page components are eagerly imported in `App.tsx`
- Backend responses are uncompressed and uncached
- No error isolation — a single crash can take down the whole app
- No performance visibility (no metrics, no health endpoint)

---

## Goals

1. Dramatically reduce initial JS bundle size via code splitting
2. Compress all backend responses (gzip/brotli)
3. Cache public API responses on both client and server (Redis)
4. Isolate component crashes with Error Boundaries
5. Track real user performance metrics (Web Vitals)
6. Add production-grade server lifecycle management (health check + graceful shutdown)
7. Add MongoDB compound indexes for the most-queried collections

---

## Out of Scope

- No UI changes of any kind
- No animation changes (Framer Motion untouched)
- No route structure changes
- No context API shape changes
- No PWA / Service Worker (Approach C territory)
- No virtual scrolling
- No bundle analyzer tooling

---

## Frontend Changes

### 1. Code Splitting — `client/src/App.tsx`

**What:** Convert all 50+ eager page imports to `React.lazy()`.  
**Why:** Currently every user downloads admin + team + user dashboard JS even if they never visit those pages. This is the single biggest performance issue.

**Implementation:**
- Replace every static import of a page component with `React.lazy(() => import(...))`
- Wrap route groups in `<Suspense>` with `<PageLoader />` as fallback (already exists)
- 4 Suspense boundaries: Public routes, Admin routes, Team routes, User routes
- Non-page imports (layouts, contexts, components) remain static — do NOT lazy-load those

**Files changed:** `client/src/App.tsx`

---

### 2. Vite Build Optimization — `client/vite.config.ts`

**What:** Split vendor libraries into separate cached chunks.  
**Why:** Right now all vendor code is in one giant bundle. With manual chunks, browser can cache e.g. `vendor-react` separately — if only app code changes, users don't re-download React.

**Chunks to create:**
| Chunk name | Libraries |
|---|---|
| `vendor-react` | `react`, `react-dom`, `react-router-dom` |
| `vendor-motion` | `framer-motion` |
| `vendor-charts` | `recharts` |
| `vendor-socket` | `socket.io-client` |
| `vendor-icons` | `lucide-react` |

**Additional config:**
- `build.minify: 'esbuild'` (faster + slightly better than terser default)
- `build.chunkSizeWarningLimit: 800`
- `build.sourcemap: false` (production)

**Files changed:** `client/vite.config.ts`

---

### 3. Error Boundaries — `client/src/components/ErrorBoundary.tsx`

**What:** React class component that catches render errors and shows a fallback UI instead of crashing the whole app.  
**Why:** Currently one component crash = blank white screen for the user.

**Fallback UI:** Simple card using existing glass style (`bg-white/5 backdrop-blur-xl border border-white/10`) — "Something went wrong. Please refresh."  No new styles introduced.

**Where to apply:**
- Wrap Public `<Routes>` group
- Wrap Admin `<Routes>` group
- Wrap Team `<Routes>` group
- Wrap User `<Routes>` group
- Wrap `<Chatbot />` widget individually
- Wrap `<DashboardChatbot />` widget individually

**Files changed:**
- `client/src/components/ErrorBoundary.tsx` (new)
- `client/src/App.tsx` (add boundary wrappers)

---

### 4. Web Vitals Monitoring — `client/src/lib/webVitals.ts`

**What:** Track LCP, FCP, CLS, TTFB, INP using the `web-vitals` package.  
**Why:** Gives visibility into real user experience — without this, optimizations are guesswork.

**Behavior:**
- `development`: log metrics to console as a clean table
- `production`: POST to `/api/v1/health/vitals` (non-blocking, fire-and-forget, errors silently ignored)

**Install:** `npm install web-vitals` in `client/`

**Call site:** `client/src/main.tsx` — call after `ReactDOM.createRoot(...).render(...)` 

**Files changed:**
- `client/src/lib/webVitals.ts` (new)
- `client/src/main.tsx` (add one call)

---

### 5. Client-Side API Caching — `client/src/lib/apiCache.ts`

**What:** In-memory TTL cache for public/CMS GET requests.  
**Why:** `ContentContext` and public pages re-fetch the same data on every mount. Same data fetched 10x in one session.

**Design:**
- `Map<string, { data: unknown; expiresAt: number }>` — key = URL + serialized params
- `get(key)` — returns data if not expired, else `null`
- `set(key, data, ttlMs)` — stores with expiry
- `invalidate(keyPrefix)` — removes all keys matching prefix (called on mutations)
- `clear()` — wipe all

**TTLs per endpoint:**
| Endpoint | TTL |
|---|---|
| `/api/v1/services` | 5 min |
| `/api/v1/jobs/active` | 5 min |
| `/api/v1/announcements` | 1 min |
| `/api/v1/page-status` | 2 min |
| `/api/v1/cms` | 10 min |
| `/api/v1/admin/projects` (public) | 5 min |

**Auth-required endpoints:** Never cached.  
**Mutations (POST/PUT/DELETE):** Call `apiCache.invalidate(prefix)` in the relevant `api/*.ts` file.

**Files changed:**
- `client/src/lib/apiCache.ts` (new)
- `client/src/contexts/ContentContext.tsx` — wrap CMS/public fetches with cache (services, cms, announcements, page-status are fetched here)
- `client/src/api/jobs.api.ts`, `announcements.api.ts`, `pageStatus.api.ts` — add cache reads/writes/invalidations where these exist as standalone api files

---

## Backend Changes

### 6. Compression Middleware

**What:** Gzip compress all HTTP responses above 1KB threshold.  
**Why:** API JSON responses can be 5-20KB uncompressed. Gzip reduces this by 60-80% — massive bandwidth and latency saving especially on slow connections.

**Install:** `npm install compression` in `server/`

**Placement in `app.js`:** After helmet, before all routes.

**Config:**
```js
compression({ threshold: 1024 }) // only compress responses > 1KB
```

**Files changed:** `server/src/app.js`, `server/package.json`

---

### 7. HTTP Cache Headers — `server/src/middlewares/cacheHeaders.js`

**What:** A small middleware factory `setCacheHeaders(seconds)` that sets `Cache-Control` on responses.  
**Why:** Browsers and CDNs can cache public responses — users don't hit the server at all on repeat visits.

**Rules:**
| Route type | Header |
|---|---|
| Public read-only (services, jobs, portfolio, cms) | `Cache-Control: public, max-age=300` (5 min) |
| Announcements | `Cache-Control: public, max-age=60` (1 min) |
| Auth-required routes | `Cache-Control: no-store, no-cache` |
| Mutation responses (POST/PUT/DELETE) | `Cache-Control: no-store` |

**Files changed:**
- `server/src/middlewares/cacheHeaders.js` (new)
- Applied in: `services.route.js`, `jobs.route.js`, `adminProject.route.js`, `announcement.route.js`, `cms.route.js`, `pageStatus.route.js`

---

### 8. Redis API Response Caching — `server/src/middlewares/redisCache.js`

**What:** Server-side cache using `ioredis` (already installed). Cache full JSON responses for public GET routes.  
**Why:** Even if the client re-fetches, the server doesn't hit MongoDB — Redis responds in <1ms vs MongoDB's 50-200ms.

**Design:**
- `cacheMiddleware(ttlSeconds)` — express middleware factory
  - On request: check Redis for key `cache:{method}:{url}`
  - Cache hit: return JSON immediately, set `X-Cache: HIT` header
  - Cache miss: let request proceed, intercept `res.json()`, store result in Redis, set `X-Cache: MISS`
- `invalidateCache(prefix)` — called in controllers after write operations using Redis `SCAN` + `DEL`

**Routes to cache:**
| Route | TTL |
|---|---|
| `GET /api/v1/services` | 5 min |
| `GET /api/v1/jobs/active` | 5 min |
| `GET /api/v1/admin/projects` | 5 min |
| `GET /api/v1/announcements` | 1 min |
| `GET /api/v1/page-status` | 2 min |
| `GET /api/v1/cms` | 10 min |

**Graceful fallback:** Wrap all Redis calls in try/catch. If Redis is unavailable (e.g. not running locally), the middleware silently skips — app works normally without cache.

**Redis connection:** Separate `server/src/config/redis.js` — `new Redis(process.env.REDIS_URL || 'redis://localhost:6379')`. Export the client instance. Add `REDIS_URL=redis://localhost:6379` to `.env` (optional — defaults to localhost). Note: `@socket.io/redis-adapter` already uses Redis separately — this is a second independent client instance for caching only.

**Files changed:**
- `server/src/config/redis.js` (new)
- `server/src/middlewares/redisCache.js` (new)
- Applied in route files: `services.route.js`, `jobs.route.js`, `adminProject.route.js`, `announcement.route.js`, `cms.route.js`, `pageStatus.route.js`
- Cache invalidation in: `services.controller.js`, `jobs.controller.js`, `adminProject.controller.js`, `announcement.controller.js`

---

### 9. Health Check Endpoint — `server/src/routes/userRoutes/health.route.js`

**What:** `GET /api/v1/health` — public, no auth.  
**Why:** Production-standard endpoint for load balancers, uptime monitors, and debugging.

**Response shape:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2026-04-13T12:00:00Z",
  "memory": { "rss": "45MB", "heapUsed": "28MB", "heapTotal": "50MB" },
  "db": "connected",
  "redis": "connected"
}
```

**Web Vitals endpoint:** `POST /api/v1/health/vitals` — accepts `{ name, value, rating }`, logs to console in dev. No DB writes needed.

**Files changed:**
- `server/src/routes/userRoutes/health.route.js` (new)
- `server/src/app.js` (register route)

---

### 10. Graceful Shutdown — `server/src/index.js`

**What:** Handle `SIGTERM` and `SIGINT` signals — stop accepting requests, drain existing ones, close connections cleanly.  
**Why:** Without this, abrupt process kill can corrupt in-flight DB writes or leave open connections.

**Shutdown sequence:**
1. Stop HTTP server (no new connections)
2. Close MongoDB connection
3. Close Redis connection
4. `process.exit(0)`
5. Force exit after 10s timeout if stuck

**Files changed:** `server/src/index.js`

---

### 11. MongoDB Compound Indexes

**What:** Add compound indexes to 4 collections that have the most frequent filtered queries.  
**Why:** Without indexes, MongoDB does full collection scans — slow on large datasets.

**Indexes to add** (in respective model files):

| Model | Index | Query it supports |
|---|---|---|
| `Project.model.js` | `{ requestedBy: 1, isArchived: 1, status: 1 }` | User/admin project list with filters |
| `Notification.model.js` | `{ userId: 1, isRead: 1, createdAt: -1 }` | Unread notifications per user |
| `Task.model.js` | `{ assignedTo: 1, status: 1 }` | Team tasks by assignee + status |
| `ChatbotSession.model.js` | `{ sessionId: 1 }` | Session lookup by UUID |

**Method:** Add `.index({...})` calls in Mongoose schema definitions — Mongoose syncs indexes on startup automatically.

**Files changed:**
- `server/src/models/usersModels/Project.model.js`
- `server/src/models/usersModels/Notification.model.js`  
- `server/src/models/usersModels/Task.model.js`
- `server/src/models/usersModels/ChatbotSession.model.js`

---

## Packages to Install

### Client
```bash
npm install web-vitals
```

### Server
```bash
npm install compression
```
*(ioredis already installed)*

---

## What Does NOT Change

| Category | Examples |
|---|---|
| UI components | Navbar, Hero, Chatbot widget appearance, all cards |
| Animations | All Framer Motion usage untouched |
| Route paths | No URL changes |
| Context API shapes | AuthContext, ContentContext, SocketContext — same exports |
| Feature logic | All business logic untouched |
| Existing middleware | helmet, cors, rateLimiter — untouched |

---

## Expected Impact

| Metric | Before | After |
|---|---|---|
| Initial JS bundle | ~2-4MB (estimated) | ~300-600KB (public chunk only) |
| API response size | Uncompressed | ~60-80% smaller |
| Repeat API calls | Always hits MongoDB | Redis cache hit in <1ms |
| Component crash | White screen | Isolated error card |
| Performance visibility | None | LCP/FCP/CLS in console |
| Server shutdown | Abrupt | Graceful drain |
