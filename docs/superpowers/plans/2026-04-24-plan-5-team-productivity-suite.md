# Team Productivity Suite (Module 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four sub-features for the team dashboard — (A) Performance Analytics, (B) Internal Knowledge Base / Wiki, (C) Leave Management, (D) Enhanced Standup. Full admin control over all four.

**Architecture:** Two new models (`KnowledgeDoc`, `LeaveRequest`) + two fields added to existing `StandupNote`. Independent controllers and routes per sub-feature. Four new team pages + three new admin pages. `useFeatureFlag` guards each team sidebar link.

**Tech Stack:** Express 5, Mongoose, React 18 + TypeScript, shadcn/ui, Framer Motion, Sonner, `useDataRealtime`, `react-markdown` for wiki rendering, Resend for leave emails.

**Prerequisite:** Plan 1 (Feature Flags) must be complete.

---

## File Map

| Action | File |
|---|---|
| Create | `server/src/models/usersModels/KnowledgeDoc.model.js` |
| Create | `server/src/models/usersModels/LeaveRequest.model.js` |
| Modify | `server/src/models/usersModels/StandupNote.model.js` — add `mood`, `blockers` |
| Create | `server/src/controllers/usersControllers/knowledgeDoc.controller.js` |
| Create | `server/src/controllers/usersControllers/leaveRequest.controller.js` |
| Create | `server/src/routes/userRoutes/knowledgeDoc.route.js` |
| Create | `server/src/routes/userRoutes/leaveRequest.route.js` |
| Create | `server/email-templates/8-leave-request.html` |
| Create | `server/email-templates/9-leave-reviewed.html` |
| Modify | `server/src/utils/sendEmails.js` — add leave email functions |
| Modify | `server/src/app.js` — mount new routes |
| Create | `client/src/api/knowledgeDocs.api.ts` |
| Create | `client/src/api/leaveRequests.api.ts` |
| Create | `client/src/pages/team/TeamKnowledgeBase.tsx` |
| Create | `client/src/pages/team/TeamLeave.tsx` |
| Create | `client/src/pages/team/TeamPerformance.tsx` |
| Create | `client/src/pages/admin/AdminKnowledgeBase.tsx` |
| Create | `client/src/pages/admin/AdminLeaveManagement.tsx` |
| Create | `client/src/pages/admin/AdminTeamPerformance.tsx` |
| Modify | `client/src/pages/admin/DashboardHome.tsx` — add standup summary card |
| Modify | `client/src/layouts/TeamLayout.tsx` — add sidebar links (guarded) |
| Modify | `client/src/layouts/AdminLayout.tsx` — add sidebar links |
| Modify | `client/src/components/DashboardSearch.tsx` — add entries |
| Modify | `client/src/App.tsx` — add routes |

---

## Sub-Feature A: Performance Analytics

### Task A1: Team Performance — Admin Page

**Files:**
- Create: `client/src/pages/admin/AdminTeamPerformance.tsx`

This page queries existing data (Tasks model) — no new model needed.

- [ ] **Step 1: Create page**

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { BarChart2, TrendingUp, CheckCircle, Clock, Loader2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import apiClient from '../../api/apiClient';
import { useDataRealtime } from '../../hooks/useDataRealtime';

interface MemberStat {
  _id: string;
  name: string;
  avatar?: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  onTimeRate: number;
}

export default function AdminTeamPerformance() {
  const [stats, setStats] = useState<MemberStat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      // Aggregate tasks by assignee from existing /tasks endpoint
      const res = await apiClient.get('/tasks');
      const tasks: any[] = res.data.data?.tasks ?? res.data.data ?? [];

      // Build per-member map
      const memberMap: Record<string, MemberStat> = {};
      for (const task of tasks) {
        const assignees: any[] = Array.isArray(task.assignees) ? task.assignees : (task.assignedTo ? [task.assignedTo] : []);
        for (const assignee of assignees) {
          const id = assignee._id ?? assignee;
          if (!memberMap[id]) {
            memberMap[id] = {
              _id: id,
              name: assignee.name ?? 'Unknown',
              avatar: assignee.avatar,
              totalTasks: 0, completedTasks: 0,
              inProgressTasks: 0, overdueTasks: 0,
              completionRate: 0, onTimeRate: 0,
            };
          }
          const m = memberMap[id];
          m.totalTasks++;
          if (task.status === 'completed') m.completedTasks++;
          if (task.status === 'in_progress') m.inProgressTasks++;
          if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') m.overdueTasks++;
        }
      }

      // Compute rates
      const result = Object.values(memberMap).map(m => ({
        ...m,
        completionRate: m.totalTasks > 0 ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0,
        onTimeRate: m.completedTasks > 0
          ? Math.round(((m.completedTasks - m.overdueTasks) / m.completedTasks) * 100)
          : 0,
      }));

      result.sort((a, b) => b.completionRate - a.completionRate);
      setStats(result);
    } catch {
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useDataRealtime('tasks', load);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <BarChart2 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-white">Team Performance</h1>
      </div>

      {stats.length === 0 && <p className="text-center text-white/40 py-16">No task data available yet</p>}

      <div className="grid gap-4">
        {stats.map((m, idx) => (
          <Card key={m._id} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {idx < 3 && <Star className={`w-4 h-4 shrink-0 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : 'text-amber-600'}`} />}
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{m.name}</p>
                    <p className="text-xs text-white/40">{m.totalTasks} tasks assigned</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 text-center shrink-0">
                  <div>
                    <p className="text-lg font-bold text-emerald-400">{m.completionRate}%</p>
                    <p className="text-[10px] text-white/40">Completion</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-400">{m.onTimeRate}%</p>
                    <p className="text-[10px] text-white/40">On Time</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-400">{m.overdueTasks}</p>
                    <p className="text-[10px] text-white/40">Overdue</p>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${m.completionRate}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Task A2: Team Self-Performance Page

**Files:**
- Create: `client/src/pages/team/TeamPerformance.tsx`

- [ ] **Step 1: Create page**

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { tasksApi } from '../../api/tasks.api';
import { useAuth } from '../../contexts/AuthContext';
import { useDataRealtime } from '../../hooks/useDataRealtime';

export default function TeamPerformance() {
  const { user } = useAuth();
  const [tasks, setTasks]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await tasksApi.getMy();
      setTasks(res.data.data ?? []);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useDataRealtime('tasks', load);

  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProg    = tasks.filter(t => t.status === 'in_progress').length;
  const overdue   = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
  const rate      = total > 0 ? Math.round((completed / total) * 100) : 0;

  const recentCompleted = tasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-white">My Performance</h1>
          <p className="text-sm text-white/50">Personal task analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: total, icon: Clock, color: 'text-white' },
          { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'In Progress', value: inProg, icon: Clock, color: 'text-blue-400' },
          { label: 'Overdue', value: overdue, icon: AlertCircle, color: 'text-red-400' },
        ].map(s => (
          <Card key={s.label} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className="text-xs text-white/50">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Completion Rate */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-white/60">Completion Rate</p>
            <p className="text-2xl font-bold text-emerald-400">{rate}%</p>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all" style={{ width: `${rate}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Recent Completed */}
      {recentCompleted.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Recently Completed</h2>
          <div className="space-y-2">
            {recentCompleted.map(t => (
              <div key={t._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{t.title}</p>
                  {t.project && <p className="text-xs text-white/40">{t.project?.projectTitle}</p>}
                </div>
                <Badge className={`text-[10px] border shrink-0 ${t.priority === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' : t.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-white/10 text-white/40 border-white/10'}`}>
                  {t.priority}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit both files**

```bash
git add client/src/pages/admin/AdminTeamPerformance.tsx client/src/pages/team/TeamPerformance.tsx
git commit -m "feat: add team performance pages (admin overview + member self-view)"
```

---

## Sub-Feature B: Knowledge Base

### Task B1: KnowledgeDoc Model

**Files:**
- Create: `server/src/models/usersModels/KnowledgeDoc.model.js`

- [ ] **Step 1: Create model**

```js
import mongoose from "mongoose";

const knowledgeDocSchema = new mongoose.Schema(
  {
    title:      { type: String, required: true, trim: true, maxlength: 200 },
    content:    { type: String, required: true, maxlength: 50000 },
    category:   { type: String, trim: true, default: "General", index: true },
    tags:       [{ type: String, trim: true }],
    author:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    visibility: { type: String, enum: ["team", "admin"], default: "team", index: true },
    isPinned:   { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

knowledgeDocSchema.index({ title: "text", content: "text", tags: "text" });

export default mongoose.model("KnowledgeDoc", knowledgeDocSchema);
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/usersModels/KnowledgeDoc.model.js
git commit -m "feat: add KnowledgeDoc model"
```

### Task B2: KnowledgeDoc Controller + Route

**Files:**
- Create: `server/src/controllers/usersControllers/knowledgeDoc.controller.js`
- Create: `server/src/routes/userRoutes/knowledgeDoc.route.js`

- [ ] **Step 1: Create controller**

```js
import KnowledgeDoc from "../../models/usersModels/KnowledgeDoc.model.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import { emitDataUpdate } from "../../utils/dataUpdateService.js";

// GET /api/v1/knowledge-docs  (admin | team)
export const getDocs = asyncHandler(async (req, res) => {
  const { search, category } = req.query;
  const filter = {};

  // Team members cannot see admin-only docs
  if (req.user.role === "team") filter.visibility = "team";
  if (category) filter.category = category;

  let query = KnowledgeDoc.find(filter).populate("author", "name avatar").populate("lastEditedBy", "name");

  if (search) {
    query = KnowledgeDoc.find({ ...filter, $text: { $search: search } }, { score: { $meta: "textScore" } })
      .populate("author", "name avatar")
      .populate("lastEditedBy", "name")
      .sort({ score: { $meta: "textScore" } });
  } else {
    query = query.sort({ isPinned: -1, updatedAt: -1 });
  }

  const docs = await query;
  return successResponse(res, 200, "Docs fetched", docs);
});

// GET /api/v1/knowledge-docs/:id  (admin | team)
export const getDoc = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === "team") filter.visibility = "team";

  const doc = await KnowledgeDoc.findOne(filter).populate("author", "name avatar").populate("lastEditedBy", "name");
  if (!doc) throw new AppError("Document not found", 404);
  return successResponse(res, 200, "Doc fetched", doc);
});

// POST /api/v1/knowledge-docs  (admin)
export const createDoc = asyncHandler(async (req, res) => {
  const { title, content, category, tags, visibility, isPinned } = req.body;
  const doc = await KnowledgeDoc.create({
    title, content,
    category: category || "General",
    tags: tags || [],
    visibility: visibility || "team",
    isPinned: isPinned || false,
    author: req.user._id,
    lastEditedBy: req.user._id,
  });
  emitDataUpdate(req.io, "knowledge-docs", ["admin:global", "team:global"]);
  return successResponse(res, 201, "Doc created", doc);
});

// PUT /api/v1/knowledge-docs/:id  (admin)
export const updateDoc = asyncHandler(async (req, res) => {
  const doc = await KnowledgeDoc.findById(req.params.id);
  if (!doc) throw new AppError("Document not found", 404);
  const { title, content, category, tags, visibility } = req.body;
  if (title)   doc.title   = title;
  if (content) doc.content = content;
  if (category !== undefined) doc.category   = category;
  if (tags    !== undefined)  doc.tags       = tags;
  if (visibility !== undefined) doc.visibility = visibility;
  doc.lastEditedBy = req.user._id;
  await doc.save();
  emitDataUpdate(req.io, "knowledge-docs", ["admin:global", "team:global"]);
  return successResponse(res, 200, "Doc updated", doc);
});

// PUT /api/v1/knowledge-docs/:id/pin  (admin)
export const togglePin = asyncHandler(async (req, res) => {
  const doc = await KnowledgeDoc.findById(req.params.id);
  if (!doc) throw new AppError("Document not found", 404);
  doc.isPinned = !doc.isPinned;
  await doc.save();
  emitDataUpdate(req.io, "knowledge-docs", ["admin:global", "team:global"]);
  return successResponse(res, 200, `Doc ${doc.isPinned ? "pinned" : "unpinned"}`, doc);
});

// DELETE /api/v1/knowledge-docs/:id  (admin)
export const deleteDoc = asyncHandler(async (req, res) => {
  const doc = await KnowledgeDoc.findById(req.params.id);
  if (!doc) throw new AppError("Document not found", 404);
  await doc.deleteOne();
  emitDataUpdate(req.io, "knowledge-docs", ["admin:global", "team:global"]);
  return successResponse(res, 200, "Doc deleted");
});
```

- [ ] **Step 2: Create route**

```js
import express from "express";
import { getDocs, getDoc, createDoc, updateDoc, togglePin, deleteDoc } from "../../controllers/usersControllers/knowledgeDoc.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import { mutationLimiter } from "../../middlewares/rateLimiter.js";
import { mongoIdParam, validate } from "../../middlewares/validate.js";

const router = express.Router();

router.get("/",    userAuthenticated, authorizeRoles("admin", "team"), getDocs);
router.get("/:id", userAuthenticated, authorizeRoles("admin", "team"), validate([mongoIdParam("id")]), getDoc);

router.post("/",             userAuthenticated, authorizeRoles("admin"), mutationLimiter, createDoc);
router.put("/:id",           userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), updateDoc);
router.put("/:id/pin",       userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), togglePin);
router.delete("/:id",        userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), deleteDoc);

export default router;
```

- [ ] **Step 3: Mount in app.js**

```js
import knowledgeDocRoutes from "./routes/userRoutes/knowledgeDoc.route.js";
app.use("/api/v1/knowledge-docs", knowledgeDocRoutes); // Internal wiki
```

- [ ] **Step 4: Commit**

```bash
git add server/src/models/usersModels/KnowledgeDoc.model.js server/src/controllers/usersControllers/knowledgeDoc.controller.js server/src/routes/userRoutes/knowledgeDoc.route.js server/src/app.js
git commit -m "feat: add knowledge docs controller, route, and mount"
```

### Task B3: Frontend API + Pages

**Files:**
- Create: `client/src/api/knowledgeDocs.api.ts`
- Create: `client/src/pages/team/TeamKnowledgeBase.tsx`
- Create: `client/src/pages/admin/AdminKnowledgeBase.tsx`

- [ ] **Step 1: Create API client**

```ts
import apiClient from './apiClient';

export interface KnowledgeDoc {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: { _id: string; name: string; avatar?: string };
  lastEditedBy?: { _id: string; name: string };
  visibility: 'team' | 'admin';
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export const knowledgeDocsApi = {
  getAll:    (params?: { search?: string; category?: string }) => apiClient.get<KnowledgeDoc[]>('/knowledge-docs', { params }),
  getById:   (id: string)                => apiClient.get<KnowledgeDoc>(`/knowledge-docs/${id}`),
  create:    (data: Partial<KnowledgeDoc>) => apiClient.post('/knowledge-docs', data),
  update:    (id: string, data: Partial<KnowledgeDoc>) => apiClient.put(`/knowledge-docs/${id}`, data),
  togglePin: (id: string)                => apiClient.put(`/knowledge-docs/${id}/pin`),
  delete:    (id: string)                => apiClient.delete(`/knowledge-docs/${id}`),
};
```

- [ ] **Step 2: Create team knowledge base page**

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, Pin, Search, Loader2, ChevronRight, Tag } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { knowledgeDocsApi, KnowledgeDoc } from '../../api/knowledgeDocs.api';
import { useDataRealtime } from '../../hooks/useDataRealtime';

export default function TeamKnowledgeBase() {
  const [docs, setDocs]       = useState<KnowledgeDoc[]>([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KnowledgeDoc | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await knowledgeDocsApi.getAll(search ? { search } : {});
      setDocs(res.data.data ?? res.data);
    } catch {
      toast.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load]);
  useDataRealtime('knowledge-docs', load);

  const pinned = docs.filter(d => d.isPinned);
  const rest   = docs.filter(d => !d.isPinned);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search docs..."
          className="bg-white/5 border-white/10 text-white pl-10"
        />
      </div>

      {pinned.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3 flex items-center gap-1">
            <Pin className="w-3 h-3" /> Pinned
          </h2>
          <div className="space-y-2">
            {pinned.map(doc => <DocCard key={doc._id} doc={doc} onClick={() => setSelected(doc)} />)}
          </div>
        </div>
      )}

      <div>
        {pinned.length > 0 && <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">All Docs</h2>}
        {rest.length === 0 && docs.length === 0 && <p className="text-center text-white/40 py-12">No documents yet</p>}
        <div className="space-y-2">
          {rest.map(doc => <DocCard key={doc._id} doc={doc} onClick={() => setSelected(doc)} />)}
        </div>
      </div>

      {/* Doc Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
        <DialogContent className="bg-[#1a1030] border-white/10 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected?.isPinned && <Pin className="w-4 h-4 text-primary" />}
              {selected?.title}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge className="bg-white/10 text-white/50 border-white/10 text-xs border">{selected.category}</Badge>
                {selected.tags.map(t => (
                  <span key={t} className="text-xs text-white/30 flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" />{t}</span>
                ))}
                <span className="text-xs text-white/30 ml-auto">By {selected.author.name}</span>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{selected.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocCard({ doc, onClick }: { doc: KnowledgeDoc; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="bg-white/5 border-white/10 hover:bg-white/[0.08] transition-colors">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {doc.isPinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
              <p className="font-medium text-white truncate">{doc.title}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-white/40">{doc.category}</span>
              {doc.tags.slice(0, 2).map(t => (
                <span key={t} className="text-xs text-white/30">{t}</span>
              ))}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
        </CardContent>
      </Card>
    </button>
  );
}
```

Note: Install react-markdown if not present: `npm install react-markdown` in `client/`.

- [ ] **Step 3: Create admin knowledge base page**

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, Plus, Pin, Trash2, Edit2, Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { knowledgeDocsApi, KnowledgeDoc } from '../../api/knowledgeDocs.api';
import { useDataRealtime } from '../../hooks/useDataRealtime';
import { Select } from '../../components/ui/select';

const emptyForm = () => ({ title: '', content: '', category: 'General', tags: '', visibility: 'team' as 'team' | 'admin' });

export default function AdminKnowledgeBase() {
  const [docs, setDocs]           = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<KnowledgeDoc | null>(null);
  const [form, setForm]           = useState(emptyForm());
  const [saving, setSaving]       = useState(false);
  const [toggling, setToggling]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await knowledgeDocsApi.getAll();
      setDocs(res.data.data ?? res.data);
    } catch { toast.error('Failed to load docs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useDataRealtime('knowledge-docs', load);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = (doc: KnowledgeDoc) => {
    setEditing(doc);
    setForm({ title: doc.title, content: doc.content, category: doc.category, tags: doc.tags.join(', '), visibility: doc.visibility });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) { toast.error('Title and content are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (editing) {
        await knowledgeDocsApi.update(editing._id, payload);
        toast.success('Doc updated');
      } else {
        await knowledgeDocsApi.create(payload);
        toast.success('Doc created');
      }
      setShowForm(false);
      load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handlePin = async (id: string) => {
    setToggling(id);
    try { await knowledgeDocsApi.togglePin(id); load(); }
    catch { toast.error('Failed to toggle pin'); }
    finally { setToggling(null); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    setDeleting(id);
    try { await knowledgeDocsApi.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
        </div>
        <Button size="sm" onClick={openCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> New Doc
        </Button>
      </div>

      {docs.length === 0 && <p className="text-center text-white/40 py-16">No documents yet</p>}
      <div className="space-y-3">
        {docs.map(doc => (
          <Card key={doc._id} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {doc.isPinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                  <span className="font-medium text-white">{doc.title}</span>
                  <Badge className="bg-white/10 text-white/50 border-white/10 text-xs border">{doc.category}</Badge>
                  {doc.visibility === 'admin' && (
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs border">Admin Only</Badge>
                  )}
                </div>
                <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{doc.content.slice(0, 100)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handlePin(doc._id)} disabled={toggling === doc._id} className="p-1.5 rounded-lg hover:bg-white/10" title={doc.isPinned ? 'Unpin' : 'Pin'}>
                  {toggling === doc._id ? <Loader2 className="w-4 h-4 animate-spin text-white/40" /> : <Pin className={`w-4 h-4 ${doc.isPinned ? 'text-primary' : 'text-white/30'}`} />}
                </button>
                <button onClick={() => openEdit(doc)} className="p-1.5 rounded-lg hover:bg-white/10">
                  <Edit2 className="w-4 h-4 text-white/50 hover:text-white" />
                </button>
                <button onClick={() => handleDelete(doc._id, doc.title)} disabled={deleting === doc._id} className="p-1.5 rounded-lg hover:bg-red-500/10">
                  {deleting === doc._id ? <Loader2 className="w-4 h-4 animate-spin text-white/40" /> : <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-400" />}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        <DialogContent className="bg-[#1a1030] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Document' : 'New Document'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70 text-xs mb-1 block">Title</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Category</Label>
                <Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="e.g. Engineering, HR" />
              </div>
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Visibility</Label>
                <Select value={form.visibility} onChange={e => setForm(p => ({ ...p, visibility: e.target.value as 'team' | 'admin' }))} className="bg-white/5 border-white/10 text-white w-full">
                  <option value="team">Team</option>
                  <option value="admin">Admin Only</option>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white/70 text-xs mb-1 block">Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="onboarding, sop, guide" />
            </div>
            <div>
              <Label className="text-white/70 text-xs mb-1 block">Content (Markdown)</Label>
              <textarea
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                rows={12}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm font-mono resize-y focus:outline-none focus:border-primary/50"
                placeholder="# Heading&#10;&#10;Write your document in **Markdown**..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-white/10 text-white/70">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? 'Update' : 'Create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd client && npm install react-markdown
git add client/src/api/knowledgeDocs.api.ts client/src/pages/team/TeamKnowledgeBase.tsx client/src/pages/admin/AdminKnowledgeBase.tsx client/package.json client/package-lock.json
git commit -m "feat: add knowledge base pages and API client"
```

---

## Sub-Feature C: Leave Management

### Task C1: LeaveRequest Model + Email Templates + Controller + Route

**Files:**
- Create: `server/src/models/usersModels/LeaveRequest.model.js`
- Create: `server/email-templates/8-leave-request.html`
- Create: `server/email-templates/9-leave-reviewed.html`
- Modify: `server/src/utils/sendEmails.js`
- Create: `server/src/controllers/usersControllers/leaveRequest.controller.js`
- Create: `server/src/routes/userRoutes/leaveRequest.route.js`

- [ ] **Step 1: Create model**

```js
import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type:      { type: String, enum: ["sick", "annual", "unpaid", "other"], required: true },
    from:      { type: Date, required: true },
    to:        { type: Date, required: true },
    totalDays: { type: Number, default: 0 }, // auto-calculated
    reason:    { type: String, trim: true, required: true, maxlength: 500 },
    status:    { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    adminNotes:  { type: String, trim: true, default: "" },
    reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt:  { type: Date },
  },
  { timestamps: true }
);

// Calculate working days (Mon–Fri) between from and to
leaveRequestSchema.pre("save", function (next) {
  if (this.isModified("from") || this.isModified("to")) {
    let count = 0;
    const cur = new Date(this.from);
    const end = new Date(this.to);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    this.totalDays = count;
  }
  next();
});

export default mongoose.model("LeaveRequest", leaveRequestSchema);
```

- [ ] **Step 2: Create email templates**

`server/email-templates/8-leave-request.html`:
```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>New Leave Request</title></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1030;border-radius:12px;overflow:hidden;border:1px solid #2d1f5e;">
        <tr><td style="background:#7c3aed;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Leave Request</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#9ca3af;margin:0 0 16px;"><strong style="color:#c4b5fd;">{{MEMBER_NAME}}</strong> has submitted a leave request.</p>
          <table width="100%" cellpadding="10" cellspacing="0" style="background:#0f0a1e;border-radius:8px;margin-bottom:24px;">
            <tr><td style="color:#9ca3af;font-size:14px;">Type</td><td style="color:#fff;font-size:14px;text-transform:capitalize;">{{LEAVE_TYPE}}</td></tr>
            <tr><td style="color:#9ca3af;font-size:14px;border-top:1px solid #2d1f5e;">From</td><td style="color:#fff;font-size:14px;border-top:1px solid #2d1f5e;">{{FROM}}</td></tr>
            <tr><td style="color:#9ca3af;font-size:14px;border-top:1px solid #2d1f5e;">To</td><td style="color:#fff;font-size:14px;border-top:1px solid #2d1f5e;">{{TO}}</td></tr>
            <tr><td style="color:#9ca3af;font-size:14px;border-top:1px solid #2d1f5e;">Days</td><td style="color:#fff;font-size:14px;border-top:1px solid #2d1f5e;">{{DAYS}} working day(s)</td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="{{ADMIN_URL}}/admin/leave-management" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 32px;border-radius:9999px;text-decoration:none;font-weight:600;">Review Request</a>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

`server/email-templates/9-leave-reviewed.html`:
```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Leave Request Update</title></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1030;border-radius:12px;overflow:hidden;border:1px solid #2d1f5e;">
        <tr><td style="background:#7c3aed;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Leave Request {{STATUS}}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#c4b5fd;margin:0 0 16px;">Hi {{NAME}},</p>
          <p style="color:#9ca3af;margin:0 0 24px;">Your leave request from <strong style="color:#fff;">{{FROM}}</strong> to <strong style="color:#fff;">{{TO}}</strong> has been <strong style="color:#fff;">{{STATUS}}</strong>.</p>
          <p style="color:#9ca3af;margin:0;">{{ADMIN_NOTES}}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

- [ ] **Step 3: Add email functions to sendEmails.js**

```js
export const sendLeaveRequestAdminEmail = async ({ to, memberName, leaveType, from, to: toDate, days, adminUrl }) => {
  const html = renderTemplate("8-leave-request.html", {
    MEMBER_NAME: memberName,
    LEAVE_TYPE: leaveType,
    FROM: from, TO: toDate, DAYS: days,
    ADMIN_URL: adminUrl,
  });
  await resend.emails.send({ from: FROM, to, subject: `Leave Request — ${memberName}`, html });
};

export const sendLeaveReviewedEmail = async ({ to, name, status, from, to: toDate, adminNotes }) => {
  const html = renderTemplate("9-leave-reviewed.html", {
    NAME: name, STATUS: status, FROM: from, TO: toDate,
    ADMIN_NOTES: adminNotes || "",
  });
  await resend.emails.send({ from: FROM, to, subject: `Leave Request ${status}`, html });
};
```

- [ ] **Step 4: Create controller**

```js
import LeaveRequest from "../../models/usersModels/LeaveRequest.model.js";
import User from "../../models/usersModels/User.model.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import { emitDataUpdate } from "../../utils/dataUpdateService.js";
import { createAndEmitNotification } from "../../utils/notificationService.js";
import { sendLeaveRequestAdminEmail, sendLeaveReviewedEmail } from "../../utils/sendEmails.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

export const getAllLeaves = asyncHandler(async (req, res) => {
  const { user, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (user)   filter.user   = user;
  if (status) filter.status = status;
  const [leaves, total] = await Promise.all([
    LeaveRequest.find(filter).populate("user", "name avatar email").populate("reviewedBy", "name").sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)),
    LeaveRequest.countDocuments(filter),
  ]);
  return successResponse(res, 200, "Leave requests fetched", { leaves, pagination: { total, page: Number(page), pages: Math.ceil(total/limit) } });
});

export const getCalendar = asyncHandler(async (req, res) => {
  const leaves = await LeaveRequest.find({ status: "approved" }).populate("user", "name avatar").select("user from to totalDays type");
  return successResponse(res, 200, "Leave calendar", leaves);
});

export const getMyLeaves = asyncHandler(async (req, res) => {
  const leaves = await LeaveRequest.find({ user: req.user._id }).populate("reviewedBy", "name").sort({ createdAt: -1 });
  return successResponse(res, 200, "My leave requests", leaves);
});

export const createLeave = asyncHandler(async (req, res) => {
  const { type, from, to, reason } = req.body;
  if (!type || !from || !to || !reason) throw new AppError("type, from, to, reason are required", 400);
  if (new Date(from) > new Date(to)) throw new AppError("from date must be before to date", 400);

  const leave = await LeaveRequest.create({ user: req.user._id, type, from: new Date(from), to: new Date(to), reason });

  const admins = await User.find({ role: "admin" }).select("email name");
  await Promise.allSettled(
    admins.map(admin => sendLeaveRequestAdminEmail({
      to: admin.email,
      memberName: req.user.name,
      leaveType: type,
      from: new Date(from).toLocaleDateString(),
      to: new Date(to).toLocaleDateString(),
      days: leave.totalDays,
      adminUrl: CLIENT_URL,
    }))
  );

  emitDataUpdate(req.io, "leave", ["admin:global"]);
  return successResponse(res, 201, "Leave request submitted", leave);
});

export const reviewLeave = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;
  if (!["approved", "rejected"].includes(status)) throw new AppError("Invalid status", 400);

  const leave = await LeaveRequest.findById(req.params.id).populate("user", "name email");
  if (!leave) throw new AppError("Leave request not found", 404);
  if (leave.status !== "pending") throw new AppError("Only pending requests can be reviewed", 400);

  leave.status     = status;
  leave.adminNotes = adminNotes || "";
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  await leave.save();

  await Promise.allSettled([
    sendLeaveReviewedEmail({
      to: leave.user.email,
      name: leave.user.name,
      status,
      from: new Date(leave.from).toLocaleDateString(),
      to: new Date(leave.to).toLocaleDateString(),
      adminNotes,
    }),
    createAndEmitNotification(req.io, {
      recipient: leave.user._id,
      type: "status_updated",
      title: `Leave Request ${status}`,
      message: `Your leave request from ${new Date(leave.from).toLocaleDateString()} to ${new Date(leave.to).toLocaleDateString()} was ${status}.`,
      link: "/team/leave",
    }),
  ]);

  emitDataUpdate(req.io, "leave", [`user:${leave.user._id}`, "admin:global", "team:global"]);
  return successResponse(res, 200, `Leave ${status}`, leave);
});

export const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) throw new AppError("Not found", 404);
  if (leave.user.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  if (leave.status !== "pending") throw new AppError("Only pending requests can be cancelled", 400);
  await leave.deleteOne();
  emitDataUpdate(req.io, "leave", [`user:${req.user._id}`, "admin:global"]);
  return successResponse(res, 200, "Leave request cancelled");
});
```

- [ ] **Step 5: Create route**

```js
import express from "express";
import { getAllLeaves, getCalendar, getMyLeaves, createLeave, reviewLeave, cancelLeave } from "../../controllers/usersControllers/leaveRequest.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import { mutationLimiter } from "../../middlewares/rateLimiter.js";
import { mongoIdParam, validate } from "../../middlewares/validate.js";

const router = express.Router();

router.get("/calendar", userAuthenticated, authorizeRoles("admin", "team"), getCalendar);
router.get("/my",       userAuthenticated, authorizeRoles("team", "admin"), getMyLeaves);
router.get("/",         userAuthenticated, authorizeRoles("admin"), getAllLeaves);
router.post("/",        userAuthenticated, authorizeRoles("team", "admin"), mutationLimiter, createLeave);
router.put("/:id/review", userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), reviewLeave);
router.delete("/:id",   userAuthenticated, authorizeRoles("team", "admin"), mutationLimiter, validate([mongoIdParam("id")]), cancelLeave);

export default router;
```

- [ ] **Step 6: Mount + API client**

In `app.js`:
```js
import leaveRequestRoutes from "./routes/userRoutes/leaveRequest.route.js";
app.use("/api/v1/leave-requests", leaveRequestRoutes);
```

`client/src/api/leaveRequests.api.ts`:
```ts
import apiClient from './apiClient';

export interface LeaveRequest {
  _id: string;
  user: { _id: string; name: string; avatar?: string; email: string };
  type: 'sick' | 'annual' | 'unpaid' | 'other';
  from: string;
  to: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string;
  reviewedBy?: { _id: string; name: string };
  reviewedAt?: string;
  createdAt: string;
}

export const leaveRequestsApi = {
  getAll:    (params?: any) => apiClient.get('/leave-requests', { params }),
  getMy:     ()             => apiClient.get<LeaveRequest[]>('/leave-requests/my'),
  getCalendar: ()           => apiClient.get<LeaveRequest[]>('/leave-requests/calendar'),
  create:    (data: Pick<LeaveRequest, 'type' | 'from' | 'to' | 'reason'>) => apiClient.post('/leave-requests', data),
  review:    (id: string, status: 'approved' | 'rejected', adminNotes?: string) =>
               apiClient.put(`/leave-requests/${id}/review`, { status, adminNotes }),
  cancel:    (id: string)   => apiClient.delete(`/leave-requests/${id}`),
};
```

- [ ] **Step 7: Create team leave page**

`client/src/pages/team/TeamLeave.tsx`:
```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Plus, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select } from '../../components/ui/select';
import { toast } from 'sonner';
import { leaveRequestsApi, LeaveRequest } from '../../api/leaveRequests.api';
import { useDataRealtime } from '../../hooks/useDataRealtime';

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const emptyForm = () => ({ type: 'annual' as LeaveRequest['type'], from: '', to: '', reason: '' });

export default function TeamLeave() {
  const [leaves, setLeaves]     = useState<LeaveRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm());
  const [saving, setSaving]     = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await leaveRequestsApi.getMy();
      setLeaves(res.data.data ?? res.data);
    } catch { toast.error('Failed to load leave requests'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useDataRealtime('leave', load);

  const handleSubmit = async () => {
    if (!form.from || !form.to || !form.reason) { toast.error('All fields are required'); return; }
    setSaving(true);
    try {
      await leaveRequestsApi.create(form);
      toast.success('Leave request submitted');
      setShowForm(false);
      setForm(emptyForm());
      load();
    } catch { toast.error('Failed to submit request'); }
    finally { setSaving(false); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this leave request?')) return;
    setCancelling(id);
    try { await leaveRequestsApi.cancel(id); toast.success('Request cancelled'); load(); }
    catch { toast.error('Cannot cancel — may already be reviewed'); }
    finally { setCancelling(null); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white">Leave Management</h1>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Apply Leave
        </Button>
      </div>

      {leaves.length === 0 && <p className="text-center text-white/40 py-16">No leave requests yet</p>}
      <div className="space-y-3">
        {leaves.map(lv => (
          <Card key={lv._id} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white capitalize">{lv.type} Leave</span>
                  <Badge className={`text-xs border ${STATUS_COLORS[lv.status]}`}>{lv.status}</Badge>
                  <span className="text-xs text-white/40">{lv.totalDays} day(s)</span>
                </div>
                <p className="text-sm text-white/50 mt-0.5">
                  {new Date(lv.from).toLocaleDateString()} — {new Date(lv.to).toLocaleDateString()}
                </p>
                {lv.adminNotes && <p className="text-xs text-white/30 italic mt-0.5">{lv.adminNotes}</p>}
              </div>
              {lv.status === 'pending' && (
                <button onClick={() => handleCancel(lv._id)} disabled={cancelling === lv._id} className="p-1.5 rounded-lg hover:bg-red-500/10">
                  {cancelling === lv._id ? <Loader2 className="w-4 h-4 animate-spin text-white/40" /> : <XCircle className="w-4 h-4 text-red-400/60 hover:text-red-400" />}
                </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        <DialogContent className="bg-[#1a1030] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70 text-xs mb-1 block">Leave Type</Label>
              <Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as LeaveRequest['type'] }))} className="bg-white/5 border-white/10 text-white w-full">
                <option value="annual">Annual</option>
                <option value="sick">Sick</option>
                <option value="unpaid">Unpaid</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70 text-xs mb-1 block">From</Label>
                <Input type="date" value={form.from} onChange={e => setForm(p => ({ ...p, from: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-white/70 text-xs mb-1 block">To</Label>
                <Input type="date" value={form.to} onChange={e => setForm(p => ({ ...p, to: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-white/70 text-xs mb-1 block">Reason</Label>
              <Input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="Brief reason for leave" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-white/10 text-white/70">Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 8: Create admin leave management page**

`client/src/pages/admin/AdminLeaveManagement.tsx`:
```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { leaveRequestsApi, LeaveRequest } from '../../api/leaveRequests.api';
import { useDataRealtime } from '../../hooks/useDataRealtime';

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function AdminLeaveManagement() {
  const [leaves, setLeaves]         = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading]       = useState(true);
  const [reviewing, setReviewing]   = useState<LeaveRequest | null>(null);
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);

  const load = useCallback(async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await leaveRequestsApi.getAll(params);
      setLeaves(res.data.data?.leaves ?? res.data.data ?? []);
    } catch { toast.error('Failed to load leave requests'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);
  useDataRealtime('leave', load);

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!reviewing) return;
    setSaving(true);
    try {
      await leaveRequestsApi.review(reviewing._id, status, notes);
      toast.success(`Leave request ${status}`);
      setReviewing(null);
      setNotes('');
      load();
    } catch { toast.error('Review failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-white">Leave Management</h1>
      </div>

      <div className="flex gap-2">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs border transition-all ${statusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {leaves.length === 0 && <p className="text-center text-white/40 py-12">No leave requests</p>}
      <div className="space-y-3">
        {leaves.map(lv => (
          <Card key={lv._id} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white">{lv.user.name}</span>
                  <Badge className={`text-xs border ${STATUS_COLORS[lv.status]}`}>{lv.status}</Badge>
                  <span className="text-xs text-white/40 capitalize">{lv.type}</span>
                  <span className="text-xs text-white/40">{lv.totalDays} day(s)</span>
                </div>
                <p className="text-sm text-white/50 mt-0.5">
                  {new Date(lv.from).toLocaleDateString()} — {new Date(lv.to).toLocaleDateString()}
                </p>
                <p className="text-xs text-white/30 mt-0.5">{lv.reason}</p>
              </div>
              {lv.status === 'pending' && (
                <Button size="sm" onClick={() => { setReviewing(lv); setNotes(''); }} className="bg-primary hover:bg-primary/90 shrink-0">
                  Review
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!reviewing} onOpenChange={v => { if (!v) setReviewing(null); }}>
        <DialogContent className="bg-[#1a1030] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Review Leave Request</DialogTitle></DialogHeader>
          {reviewing && (
            <div className="space-y-4">
              <div className="text-sm text-white/70 space-y-1">
                <p><span className="text-white/40">Member:</span> {reviewing.user.name}</p>
                <p><span className="text-white/40">Type:</span> <span className="capitalize">{reviewing.type}</span></p>
                <p><span className="text-white/40">Period:</span> {new Date(reviewing.from).toLocaleDateString()} — {new Date(reviewing.to).toLocaleDateString()} ({reviewing.totalDays} days)</p>
                <p><span className="text-white/40">Reason:</span> {reviewing.reason}</p>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Notes (optional)</label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="Message to team member..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleReview('rejected')} disabled={saving} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-1" />Reject</>}
                </Button>
                <Button onClick={() => handleReview('approved')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" />Approve</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 9: Commit all leave files**

```bash
git add server/src/models/usersModels/LeaveRequest.model.js \
        server/email-templates/8-leave-request.html \
        server/email-templates/9-leave-reviewed.html \
        server/src/utils/sendEmails.js \
        server/src/controllers/usersControllers/leaveRequest.controller.js \
        server/src/routes/userRoutes/leaveRequest.route.js \
        server/src/app.js \
        client/src/api/leaveRequests.api.ts \
        client/src/pages/team/TeamLeave.tsx \
        client/src/pages/admin/AdminLeaveManagement.tsx
git commit -m "feat: add leave management (model, routes, team + admin pages)"
```

---

## Sub-Feature D: Enhanced Standup

### Task D1: Enhance StandupNote Model

**Files:**
- Modify: `server/src/models/usersModels/StandupNote.model.js`

- [ ] **Step 1: Add fields to existing model**

Open `server/src/models/usersModels/StandupNote.model.js`. Add these two fields to the existing schema (before `timestamps`):

```js
mood: {
  type: String,
  enum: ["great", "good", "okay", "struggling", "blocked"],
  default: "good",
},
blockers: {
  type: String,
  trim: true,
  maxlength: 500,
  default: "",
},
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/usersModels/StandupNote.model.js
git commit -m "feat: add mood and blockers fields to StandupNote model"
```

### Task D2: Standup Summary Card on Admin Dashboard Home

**Files:**
- Modify: `client/src/pages/admin/DashboardHome.tsx`

- [ ] **Step 1: Add standup summary card**

Find where the admin dashboard home loads data. Add a standup summary card that shows today's team standup status.

Import the standup API (already exists as `standupApi`):
```tsx
import { standupApi } from '../../api/standup.api';
```

Add state and load call:
```tsx
const [standups, setStandups] = useState<any[]>([]);

// In the existing load/useEffect, add:
const standupRes = await standupApi.getAll({ date: new Date().toISOString().split('T')[0] });
setStandups(standupRes.data.data ?? []);
```

Add the card in the JSX after existing stats cards:
```tsx
{standups.length > 0 && (
  <Card className="bg-white/5 border-white/10 col-span-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm text-white/60 flex items-center gap-2">
        <span>Today's Standup</span>
        <span className="text-xs text-white/30">{standups.length} submitted</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-2">
        {standups.slice(0, 5).map((s: any) => {
          const moodEmoji: Record<string, string> = {
            great: '🚀', good: '😊', okay: '😐', struggling: '😟', blocked: '🚫'
          };
          return (
            <div key={s._id} className="flex items-start gap-3 p-2 rounded-lg bg-white/[0.03]">
              <span className="text-lg">{moodEmoji[s.mood ?? 'good'] ?? '😊'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{s.user?.name ?? 'Team Member'}</p>
                <p className="text-xs text-white/50 truncate">{s.today}</p>
                {s.blockers && (
                  <p className="text-xs text-red-400 mt-0.5">🚧 {s.blockers}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
)}
```

- [ ] **Step 2: Update standup submit form in TeamDashboardHome or standup component**

Find where the standup form is rendered (likely `TeamDashboardHome.tsx`). Add mood selector and blockers field:

```tsx
// Add to standup form state:
const [standupForm, setStandupForm] = useState({
  yesterday: '', today: '', blockers: '', mood: 'good',
  availability: 'available' as AvailabilityStatus,
});

// Add mood selector in the form JSX:
<div>
  <Label className="text-white/70 text-xs mb-1 block">Mood</Label>
  <div className="flex gap-2">
    {[
      { key: 'great', emoji: '🚀' },
      { key: 'good', emoji: '😊' },
      { key: 'okay', emoji: '😐' },
      { key: 'struggling', emoji: '😟' },
      { key: 'blocked', emoji: '🚫' },
    ].map(m => (
      <button
        key={m.key}
        type="button"
        onClick={() => setStandupForm(p => ({ ...p, mood: m.key }))}
        className={`text-2xl p-1 rounded-lg transition-all ${standupForm.mood === m.key ? 'bg-primary/20 scale-110' : 'opacity-50 hover:opacity-80'}`}
      >
        {m.emoji}
      </button>
    ))}
  </div>
</div>

// Add blockers field:
<div>
  <Label className="text-white/70 text-xs mb-1 block">Blockers (optional)</Label>
  <Input
    value={standupForm.blockers}
    onChange={e => setStandupForm(p => ({ ...p, blockers: e.target.value }))}
    className="bg-white/5 border-white/10 text-white"
    placeholder="Anything blocking your progress?"
  />
</div>
```

Pass `mood` and `blockers` in the standup submit call — check existing `standupApi.submit` signature and include these fields.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/admin/DashboardHome.tsx client/src/pages/team/TeamDashboardHome.tsx
git commit -m "feat: add mood and blockers to standup form; standup summary card on admin home"
```

---

## Final Task: Wire All Routes, Sidebars, DashboardSearch

**Files:**
- Modify: `client/src/App.tsx`
- Modify: Team sidebar
- Modify: Admin sidebar
- Modify: `client/src/components/DashboardSearch.tsx`

- [ ] **Step 1: Add all routes in App.tsx**

```tsx
import TeamPerformance      from '../pages/team/TeamPerformance';
import TeamKnowledgeBase    from '../pages/team/TeamKnowledgeBase';
import TeamLeave            from '../pages/team/TeamLeave';
import AdminTeamPerformance from '../pages/admin/AdminTeamPerformance';
import AdminKnowledgeBase   from '../pages/admin/AdminKnowledgeBase';
import AdminLeaveManagement from '../pages/admin/AdminLeaveManagement';

// Team routes:
<Route path="performance"    element={<TeamPerformance />} />
<Route path="knowledge-base" element={<TeamKnowledgeBase />} />
<Route path="leave"          element={<TeamLeave />} />

// Admin routes:
<Route path="team-performance"   element={<AdminTeamPerformance />} />
<Route path="knowledge-base"     element={<AdminKnowledgeBase />} />
<Route path="leave-management"   element={<AdminLeaveManagement />} />
```

- [ ] **Step 2: Team sidebar links with feature flags**

```tsx
import { useFeatureFlag } from '../hooks/useFeatureFlag';
const perfEnabled = useFeatureFlag('performance-analytics');
const wikiEnabled = useFeatureFlag('knowledge-base');
const leaveEnabled = useFeatureFlag('leave-management');

// Add to DEFAULT_LINKS conditionally:
...(perfEnabled  ? [{ label: 'My Performance',  path: '/team/performance',    icon: TrendingUp }] : []),
...(wikiEnabled  ? [{ label: 'Knowledge Base',   path: '/team/knowledge-base', icon: BookOpen   }] : []),
...(leaveEnabled ? [{ label: 'Leave',            path: '/team/leave',          icon: Calendar   }] : []),
```

- [ ] **Step 3: Admin sidebar links**

```tsx
{ label: 'Team Performance',  path: '/admin/team-performance',  icon: BarChart2  },
{ label: 'Knowledge Base',    path: '/admin/knowledge-base',    icon: BookOpen   },
{ label: 'Leave Management',  path: '/admin/leave-management',  icon: Calendar   },
```

- [ ] **Step 4: DashboardSearch entries**

```tsx
// TEAM_ITEMS:
{ id: 't-performance',    label: 'My Performance',  description: 'View your task completion rate and analytics', path: '/team/performance',    icon: TrendingUp, group: 'Pages', keywords: ['stats', 'analytics', 'rate', 'tasks'] },
{ id: 't-knowledge-base', label: 'Knowledge Base',  description: 'Browse internal docs, SOPs, and guides',       path: '/team/knowledge-base', icon: BookOpen,   group: 'Pages', keywords: ['wiki', 'docs', 'sop', 'guide'] },
{ id: 't-leave',          label: 'Leave',           description: 'Apply for leave and track request status',      path: '/team/leave',          icon: Calendar,   group: 'Pages', keywords: ['leave', 'vacation', 'sick', 'holiday'] },

// ADMIN_ITEMS:
{ id: 'a-team-performance',  label: 'Team Performance',  description: 'Per-member task analytics and rankings', path: '/admin/team-performance',  icon: BarChart2, group: 'Pages', keywords: ['performance', 'analytics', 'team', 'stats'] },
{ id: 'a-knowledge-base',    label: 'Knowledge Base',    description: 'Create and manage internal wiki docs',    path: '/admin/knowledge-base',    icon: BookOpen,  group: 'Pages', keywords: ['wiki', 'docs', 'knowledge', 'sop'] },
{ id: 'a-leave-management',  label: 'Leave Management',  description: 'Approve or reject team leave requests',   path: '/admin/leave-management',  icon: Calendar,  group: 'Pages', keywords: ['leave', 'vacation', 'approve', 'holiday'] },
```

- [ ] **Step 5: Final commit**

```bash
git add client/src/App.tsx client/src/layouts/TeamLayout.tsx client/src/layouts/AdminLayout.tsx client/src/components/DashboardSearch.tsx
git commit -m "feat: wire team productivity suite routes, sidebar links, and search"
```

---

## Self-Review Checklist

- [x] `KnowledgeDoc` visibility filter applied per role in query — team cannot see admin-only docs
- [x] Full-text index on `KnowledgeDoc` — title, content, tags searchable
- [x] `/calendar` and `/my` declared before `/:id` — no Express conflict
- [x] `LeaveRequest` pre-save calculates working days (excludes weekends)
- [x] Leave cancel restricted to `pending` status — cannot cancel approved/rejected
- [x] `StandupNote` model change is additive (new optional fields) — no migration needed
- [x] `react-markdown` installed explicitly — not assumed to be present
- [x] All feature flags guard team sidebar links
- [x] All 6 new pages in DashboardSearch
- [x] Email sends in `Promise.allSettled` — leave ops never fail due to email
