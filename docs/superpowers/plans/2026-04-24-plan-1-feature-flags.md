# Feature Flags (Module 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Feature Control Center — admin can toggle features on/off per role and per individual user; all other modules read these flags to show/hide their UI.

**Architecture:** Single MongoDB model `FeatureFlag` seeded with 5 known feature keys. One Express router handles CRUD. Frontend `FeatureFlagContext` fetches resolved flags on auth and exposes `useFeatureFlag(key)` hook used by sidebar + route guards.

**Tech Stack:** Express 5, Mongoose, React 18 + TypeScript, shadcn/ui, Framer Motion, Sonner toasts, Socket.IO `emitDataUpdate`.

---

## File Map

| Action | File |
|---|---|
| Create | `server/src/models/usersModels/FeatureFlag.model.js` |
| Create | `server/src/controllers/usersControllers/featureFlag.controller.js` |
| Create | `server/src/routes/userRoutes/featureFlag.route.js` |
| Modify | `server/src/app.js` — mount `/api/v1/feature-flags` |
| Create | `client/src/api/featureFlags.api.ts` |
| Create | `client/src/contexts/FeatureFlagContext.tsx` |
| Create | `client/src/hooks/useFeatureFlag.ts` |
| Create | `client/src/pages/admin/FeatureFlags.tsx` |
| Modify | `client/src/layouts/AdminLayout.tsx` — add sidebar link |
| Modify | `client/src/components/DashboardSearch.tsx` — add ADMIN_ITEMS entry |
| Modify | `client/src/main.tsx` (or root provider file) — wrap with `FeatureFlagProvider` |

---

### Task 1: FeatureFlag Mongoose Model

**Files:**
- Create: `server/src/models/usersModels/FeatureFlag.model.js`

- [ ] **Step 1: Create the model file**

```js
/**
 * FeatureFlag model – controls which dashboard features are active.
 *
 * Keys (seeded on first load):
 *   invoice-portal | project-deliverables | time-tracking |
 *   knowledge-base | leave-management | performance-analytics
 *
 * Resolution order (most specific wins):
 *   enabledForUsers[]  → always has access regardless of role flag
 *   disabledForUsers[] → never has access regardless of role flag
 *   enabledForRoles[]  → role-level default
 *   isGloballyEnabled  → master switch (false = no one gets it)
 */
import mongoose from "mongoose";

const featureFlagSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    label: { type: String, required: true, trim: true },
    module: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    isGloballyEnabled: { type: Boolean, default: true },
    enabledForRoles: {
      type: [String],
      enum: ["admin", "team", "user"],
      default: ["admin", "team", "user"],
    },
    disabledForUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    enabledForUsers:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("FeatureFlag", featureFlagSchema);
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/usersModels/FeatureFlag.model.js
git commit -m "feat: add FeatureFlag model"
```

---

### Task 2: Feature Flag Controller

**Files:**
- Create: `server/src/controllers/usersControllers/featureFlag.controller.js`

- [ ] **Step 1: Create controller**

```js
/**
 * Feature flag controller.
 *
 * GET  /api/v1/feature-flags        – admin: all flags full detail
 * GET  /api/v1/feature-flags/my     – any auth: resolved map for current user
 * PUT  /api/v1/feature-flags/:key   – admin: update a flag
 * POST /api/v1/feature-flags/seed   – admin: (re)seed default flags
 * POST /api/v1/feature-flags/reset  – admin: reset all to defaults
 */
import FeatureFlag from "../../models/usersModels/FeatureFlag.model.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import { emitDataUpdate } from "../../utils/dataUpdateService.js";

const DEFAULT_FLAGS = [
  {
    key: "invoice-portal",
    label: "Invoice & Payment Portal",
    module: "Billing",
    description: "Clients can view invoices and upload payment proof",
    enabledForRoles: ["admin", "user"],
  },
  {
    key: "project-deliverables",
    label: "Project Deliverables",
    module: "Projects",
    description: "Team can upload deliverables; clients can download them",
    enabledForRoles: ["admin", "team", "user"],
  },
  {
    key: "time-tracking",
    label: "Time Tracking",
    module: "Productivity",
    description: "Team logs hours and submits weekly timesheets",
    enabledForRoles: ["admin", "team"],
  },
  {
    key: "knowledge-base",
    label: "Internal Knowledge Base",
    module: "Productivity",
    description: "Team wiki — SOPs, guides, docs",
    enabledForRoles: ["admin", "team"],
  },
  {
    key: "leave-management",
    label: "Leave Management",
    module: "Productivity",
    description: "Team requests leave; admin approves/rejects",
    enabledForRoles: ["admin", "team"],
  },
  {
    key: "performance-analytics",
    label: "Performance Analytics",
    module: "Productivity",
    description: "Per-member task completion rate and velocity metrics",
    enabledForRoles: ["admin", "team"],
  },
];

// Seed on server start (called from app.js after DB connects)
export const seedFeatureFlags = async () => {
  for (const flag of DEFAULT_FLAGS) {
    await FeatureFlag.findOneAndUpdate(
      { key: flag.key },
      { $setOnInsert: flag },
      { upsert: true, new: true }
    );
  }
};

// GET /api/v1/feature-flags  (admin)
export const getAllFlags = asyncHandler(async (req, res) => {
  const flags = await FeatureFlag.find()
    .populate("disabledForUsers", "name email avatar")
    .populate("enabledForUsers", "name email avatar")
    .sort({ module: 1, label: 1 });

  return successResponse(res, 200, "Feature flags fetched", flags);
});

// GET /api/v1/feature-flags/my  (any authenticated user)
export const getMyFlags = asyncHandler(async (req, res) => {
  const { _id: userId, role } = req.user;
  const flags = await FeatureFlag.find();

  const resolved = {};
  for (const flag of flags) {
    if (!flag.isGloballyEnabled) {
      resolved[flag.key] = false;
      continue;
    }
    const isUserEnabled  = flag.enabledForUsers.some(id => id.toString() === userId.toString());
    const isUserDisabled = flag.disabledForUsers.some(id => id.toString() === userId.toString());
    if (isUserEnabled)  { resolved[flag.key] = true;  continue; }
    if (isUserDisabled) { resolved[flag.key] = false; continue; }
    resolved[flag.key] = flag.enabledForRoles.includes(role);
  }

  return successResponse(res, 200, "My feature flags", resolved);
});

// PUT /api/v1/feature-flags/:key  (admin)
export const updateFlag = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { isGloballyEnabled, enabledForRoles, disabledForUsers, enabledForUsers } = req.body;

  const flag = await FeatureFlag.findOne({ key });
  if (!flag) throw new AppError(`Feature flag '${key}' not found`, 404);

  if (typeof isGloballyEnabled === "boolean") flag.isGloballyEnabled = isGloballyEnabled;
  if (Array.isArray(enabledForRoles)) flag.enabledForRoles = enabledForRoles;
  if (Array.isArray(disabledForUsers)) flag.disabledForUsers = disabledForUsers;
  if (Array.isArray(enabledForUsers))  flag.enabledForUsers  = enabledForUsers;

  await flag.save();
  emitDataUpdate(req.io, "feature-flags", ["admin:global", "team:global"]);

  return successResponse(res, 200, "Feature flag updated", flag);
});

// POST /api/v1/feature-flags/reset  (admin)
export const resetFlags = asyncHandler(async (req, res) => {
  await FeatureFlag.deleteMany({});
  for (const flag of DEFAULT_FLAGS) {
    await FeatureFlag.create(flag);
  }
  emitDataUpdate(req.io, "feature-flags", ["admin:global", "team:global"]);
  return successResponse(res, 200, "All feature flags reset to defaults");
});
```

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/usersControllers/featureFlag.controller.js
git commit -m "feat: add feature flag controller"
```

---

### Task 3: Feature Flag Route + App Mount

**Files:**
- Create: `server/src/routes/userRoutes/featureFlag.route.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: Create route file**

```js
import express from "express";
import {
  getAllFlags,
  getMyFlags,
  updateFlag,
  resetFlags,
} from "../../controllers/usersControllers/featureFlag.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import { mutationLimiter } from "../../middlewares/rateLimiter.js";

const router = express.Router();

// Must be before /:key to avoid Express treating them as keys
router.get("/my",   userAuthenticated, getMyFlags);
router.post("/reset", userAuthenticated, authorizeRoles("admin"), mutationLimiter, resetFlags);

router.get("/",     userAuthenticated, authorizeRoles("admin"), getAllFlags);
router.put("/:key", userAuthenticated, authorizeRoles("admin"), mutationLimiter, updateFlag);

export default router;
```

- [ ] **Step 2: Add import and mount in `server/src/app.js`**

After the last existing import (around line 140) add:
```js
import featureFlagRoutes from "./routes/userRoutes/featureFlag.route.js";
import { seedFeatureFlags } from "./controllers/usersControllers/featureFlag.controller.js";
```

After the last `app.use(...)` route mount (before `app.use(notFound)`) add:
```js
app.use("/api/v1/feature-flags", featureFlagRoutes); // Feature control center
```

Find the DB connection callback (where mongoose connects) and add the seed call after connect:
```js
// After mongoose.connect() resolves, or in the existing connectDB callback:
await seedFeatureFlags();
```

- [ ] **Step 3: Start server and verify**

```bash
cd server && npm run dev
# Expected: server starts, no errors, "Feature flags seeded" or silent (upsert)
curl http://localhost:8000/api/v1/feature-flags/my -H "Authorization: Bearer <token>"
# Expected: { data: { "invoice-portal": true, "time-tracking": true, ... } }
```

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/userRoutes/featureFlag.route.js server/src/app.js
git commit -m "feat: mount feature-flags route, seed on startup"
```

---

### Task 4: Frontend API Client

**Files:**
- Create: `client/src/api/featureFlags.api.ts`

- [ ] **Step 1: Create API client**

```ts
import apiClient from './apiClient';

export interface FeatureFlag {
  _id: string;
  key: string;
  label: string;
  module: string;
  description: string;
  isGloballyEnabled: boolean;
  enabledForRoles: string[];
  disabledForUsers: { _id: string; name: string; email: string }[];
  enabledForUsers:  { _id: string; name: string; email: string }[];
}

export type FlagMap = Record<string, boolean>;

export const featureFlagsApi = {
  getAll:   ()                          => apiClient.get<FeatureFlag[]>('/feature-flags'),
  getMy:    ()                          => apiClient.get<FlagMap>('/feature-flags/my'),
  update:   (key: string, data: Partial<Pick<FeatureFlag,
              'isGloballyEnabled' | 'enabledForRoles' | 'disabledForUsers' | 'enabledForUsers'
            >>) => apiClient.put(`/feature-flags/${key}`, data),
  reset:    ()                          => apiClient.post('/feature-flags/reset'),
};
```

- [ ] **Step 2: Commit**

```bash
git add client/src/api/featureFlags.api.ts
git commit -m "feat: add featureFlags API client"
```

---

### Task 5: FeatureFlagContext + useFeatureFlag Hook

**Files:**
- Create: `client/src/contexts/FeatureFlagContext.tsx`
- Create: `client/src/hooks/useFeatureFlag.ts`

- [ ] **Step 1: Create context**

```tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { featureFlagsApi, FlagMap } from '../api/featureFlags.api';
import { useAuth } from './AuthContext';

interface FeatureFlagContextValue {
  flags: FlagMap;
  isLoaded: boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  flags: {},
  isLoaded: false,
  refresh: async () => {},
});

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [flags, setFlags] = useState<FlagMap>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await featureFlagsApi.getMy();
      setFlags(res.data.data ?? res.data);
    } catch {
      // silently fail — default to all enabled so UI doesn't break
      setFlags({});
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setFlags({});
      setIsLoaded(false);
    }
  }, [isAuthenticated, refresh]);

  // Re-fetch when feature-flags real-time event fires
  useEffect(() => {
    const handler = (e: Event) => {
      const section = (e as CustomEvent).detail?.section;
      if (section === 'feature-flags') refresh();
    };
    window.addEventListener('cms:updated', handler);
    return () => window.removeEventListener('cms:updated', handler);
  }, [refresh]);

  return (
    <FeatureFlagContext.Provider value={{ flags, isLoaded, refresh }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export const useFeatureFlagContext = () => useContext(FeatureFlagContext);
```

- [ ] **Step 2: Create hook**

```ts
// client/src/hooks/useFeatureFlag.ts
import { useFeatureFlagContext } from '../contexts/FeatureFlagContext';

/**
 * Returns true if the feature is enabled for the current user.
 * Defaults to true while flags are loading (optimistic) so UI doesn't flash.
 */
export function useFeatureFlag(key: string): boolean {
  const { flags, isLoaded } = useFeatureFlagContext();
  if (!isLoaded) return true; // optimistic default while loading
  return flags[key] ?? true;  // unknown keys default to enabled
}
```

- [ ] **Step 3: Wrap app with provider**

Find the root provider file (check `client/src/main.tsx` or where `AuthContext` is wrapped). Add `FeatureFlagProvider` inside `AuthProvider`:

```tsx
// In the providers tree (after AuthProvider, before Router):
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';

// Wrap:
<AuthProvider>
  <FeatureFlagProvider>
    {/* rest of providers */}
  </FeatureFlagProvider>
</AuthProvider>
```

- [ ] **Step 4: Commit**

```bash
git add client/src/contexts/FeatureFlagContext.tsx client/src/hooks/useFeatureFlag.ts client/src/main.tsx
git commit -m "feat: add FeatureFlagContext and useFeatureFlag hook"
```

---

### Task 6: Admin Feature Flags Page

**Files:**
- Create: `client/src/pages/admin/FeatureFlags.tsx`

- [ ] **Step 1: Create the admin page**

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, RefreshCw, ToggleLeft, ToggleRight, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { featureFlagsApi, FeatureFlag } from '../../api/featureFlags.api';
import { useFeatureFlagContext } from '../../contexts/FeatureFlagContext';
import { useDataRealtime } from '../../hooks/useDataRealtime';

const ROLES = ['admin', 'team', 'user'] as const;
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  team:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  user:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export default function FeatureFlagsPage() {
  const { refresh: refreshMyFlags } = useFeatureFlagContext();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await featureFlagsApi.getAll();
      setFlags(res.data.data ?? res.data);
    } catch {
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useDataRealtime('feature-flags', load);

  const toggleGlobal = async (flag: FeatureFlag) => {
    setSaving(flag.key);
    try {
      await featureFlagsApi.update(flag.key, { isGloballyEnabled: !flag.isGloballyEnabled });
      toast.success(`${flag.label} ${!flag.isGloballyEnabled ? 'enabled' : 'disabled'}`);
      await load();
      await refreshMyFlags();
    } catch {
      toast.error('Failed to update flag');
    } finally {
      setSaving(null);
    }
  };

  const toggleRole = async (flag: FeatureFlag, role: string) => {
    setSaving(flag.key + role);
    const roles = flag.enabledForRoles.includes(role)
      ? flag.enabledForRoles.filter(r => r !== role)
      : [...flag.enabledForRoles, role];
    try {
      await featureFlagsApi.update(flag.key, { enabledForRoles: roles });
      await load();
      await refreshMyFlags();
      toast.success('Role access updated');
    } catch {
      toast.error('Failed to update role access');
    } finally {
      setSaving(null);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset ALL feature flags to defaults?')) return;
    setSaving('reset');
    try {
      await featureFlagsApi.reset();
      toast.success('All flags reset to defaults');
      await load();
      await refreshMyFlags();
    } catch {
      toast.error('Reset failed');
    } finally {
      setSaving(null);
    }
  };

  const grouped = flags.reduce<Record<string, FeatureFlag[]>>((acc, f) => {
    if (!acc[f.module]) acc[f.module] = [];
    acc[f.module].push(f);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-white">Feature Control Center</h1>
            <p className="text-sm text-white/50">Toggle features per role or per user</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={saving === 'reset'}
          className="border-white/10 text-white/70 hover:bg-white/5"
        >
          {saving === 'reset' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="ml-2">Reset All</span>
        </Button>
      </div>

      {/* Groups */}
      {Object.entries(grouped).map(([module, moduleFlags]) => (
        <div key={module}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">{module}</h2>
          <div className="space-y-3">
            {moduleFlags.map(flag => (
              <motion.div
                key={flag.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white">{flag.label}</span>
                          <Badge variant="outline" className="text-xs text-white/40 border-white/10">
                            {flag.key}
                          </Badge>
                          {!flag.isGloballyEnabled && (
                            <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                              Disabled Globally
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-white/50 mt-1">{flag.description}</p>

                        {/* Role toggles */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Users className="w-3.5 h-3.5 text-white/30" />
                          {ROLES.map(role => {
                            const active = flag.enabledForRoles.includes(role) && flag.isGloballyEnabled;
                            return (
                              <button
                                key={role}
                                onClick={() => toggleRole(flag, role)}
                                disabled={!flag.isGloballyEnabled || saving === flag.key + role}
                                className={`px-2.5 py-0.5 rounded-full text-xs border transition-all
                                  ${active ? ROLE_COLORS[role] : 'bg-white/5 text-white/30 border-white/10'}
                                  ${!flag.isGloballyEnabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                                `}
                              >
                                {role}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Global toggle */}
                      <button
                        onClick={() => toggleGlobal(flag)}
                        disabled={saving === flag.key}
                        className="shrink-0 mt-1"
                      >
                        {saving === flag.key
                          ? <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                          : flag.isGloballyEnabled
                            ? <ToggleRight className="w-8 h-8 text-primary" />
                            : <ToggleLeft className="w-8 h-8 text-white/30" />
                        }
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/admin/FeatureFlags.tsx
git commit -m "feat: add FeatureFlags admin page"
```

---

### Task 7: Wire Sidebar + Router + DashboardSearch

**Files:**
- Modify: `client/src/layouts/AdminLayout.tsx` (or `Sidebar.tsx`) — add sidebar link
- Modify: `client/src/App.tsx` (or admin router file) — add route
- Modify: `client/src/components/DashboardSearch.tsx` — add ADMIN_ITEMS entry

- [ ] **Step 1: Add route**

In the admin routes section (wherever `/admin/*` routes are defined), add:
```tsx
import FeatureFlagsPage from '../pages/admin/FeatureFlags';
// ...
<Route path="feature-flags" element={<FeatureFlagsPage />} />
```

- [ ] **Step 2: Add sidebar link**

In the admin sidebar DEFAULT_LINKS array, add:
```tsx
{ label: 'Feature Flags', path: '/admin/feature-flags', icon: Shield }
```

- [ ] **Step 3: Add DashboardSearch entry**

In `ADMIN_ITEMS` array in `DashboardSearch.tsx`, add:
```tsx
{
  id: 'a-feature-flags',
  label: 'Feature Flags',
  description: 'Toggle features on/off per role and per user',
  path: '/admin/feature-flags',
  icon: Shield,
  group: 'Pages',
  keywords: ['toggle', 'control', 'permissions', 'access', 'modules'],
},
```

- [ ] **Step 4: Commit**

```bash
git add client/src/layouts/AdminLayout.tsx client/src/App.tsx client/src/components/DashboardSearch.tsx
git commit -m "feat: wire FeatureFlags page to admin sidebar, router, and search"
```

---

### Task 8: Guard Existing Sidebar Links with useFeatureFlag

**Files:**
- Modify: `client/src/layouts/AdminLayout.tsx` — sidebar uses `useFeatureFlag` to filter links
- Note: When Module 1–4 pages are added, their sidebar links will use this hook. This task just verifies the hook works by logging the flag map in dev mode.

- [ ] **Step 1: Verify hook works end-to-end**

In `client/src/layouts/AdminLayout.tsx` (or any authenticated page temporarily), add:
```tsx
import { useFeatureFlag } from '../hooks/useFeatureFlag';
// inside component:
const invoiceEnabled = useFeatureFlag('invoice-portal');
console.log('[FeatureFlag] invoice-portal:', invoiceEnabled);
```

Start frontend (`npm run dev` in `client/`), log in as admin, open console.
Expected: `[FeatureFlag] invoice-portal: true`

- [ ] **Step 2: Remove debug log, commit**

Remove the console.log. Commit:
```bash
git add client/src/layouts/AdminLayout.tsx
git commit -m "feat: verify useFeatureFlag hook integration"
```

---

## Self-Review Checklist

- [x] Model seeded with 6 known keys — all other plan files reference these exact keys
- [x] `/my` route declared before `/:key` to avoid Express conflict
- [x] `seedFeatureFlags` is idempotent — uses `$setOnInsert` so re-runs don't overwrite admin changes
- [x] Context defaults to `true` while loading — avoids flash of hidden UI
- [x] Unknown keys default to `true` — forward compatible with future flags
- [x] `emitDataUpdate` fires on every mutation — other dashboards refresh silently
- [x] DashboardSearch entry added
