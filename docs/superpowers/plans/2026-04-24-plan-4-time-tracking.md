# Time Tracking (Module 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Team members log daily time entries against projects/tasks, then submit weekly timesheets for admin approval. Admin sees billable hour reports per project and per team member.

**Architecture:** Two models — `TimeEntry` (individual log) and `Timesheet` (weekly aggregate). Team logs entries via `/team/time-tracker`. Submitting a week auto-aggregates entries into a Timesheet doc. Admin approves/rejects timesheets at `/admin/timesheets` and views a billable report. `useFeatureFlag('time-tracking')` guards team sidebar link.

**Tech Stack:** Express 5, Mongoose, React 18 + TypeScript, shadcn/ui, Framer Motion, Sonner, `useDataRealtime`, Resend email on timesheet review.

**Prerequisite:** Plan 1 (Feature Flags) must be complete.

---

## File Map

| Action | File |
|---|---|
| Create | `server/src/models/usersModels/TimeEntry.model.js` |
| Create | `server/src/models/usersModels/Timesheet.model.js` |
| Create | `server/src/controllers/usersControllers/timeTracking.controller.js` |
| Create | `server/src/routes/userRoutes/timeTracking.route.js` |
| Create | `server/email-templates/10-timesheet-reviewed.html` |
| Modify | `server/src/utils/sendEmails.js` — add `sendTimesheetReviewedEmail` |
| Modify | `server/src/app.js` — mount routes |
| Create | `client/src/api/timeTracking.api.ts` |
| Create | `client/src/pages/team/TeamTimeTracker.tsx` |
| Create | `client/src/pages/admin/AdminTimesheets.tsx` |
| Modify | `client/src/layouts/TeamLayout.tsx` — add sidebar link (guarded) |
| Modify | `client/src/layouts/AdminLayout.tsx` — add sidebar link |
| Modify | `client/src/components/DashboardSearch.tsx` — add entries |
| Modify | `client/src/App.tsx` — add routes |

---

### Task 1: TimeEntry Model

**Files:**
- Create: `server/src/models/usersModels/TimeEntry.model.js`

- [ ] **Step 1: Create model**

```js
import mongoose from "mongoose";

const timeEntrySchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "AdminProject" },
    task:    { type: mongoose.Schema.Types.ObjectId, ref: "Task" },

    date:        { type: Date, required: true, index: true },
    hours:       { type: Number, required: true, min: 0.5, max: 24 },
    description: { type: String, trim: true, default: "" },
    isBillable:  { type: Boolean, default: true },

    // Set when entry is included in a submitted timesheet
    timesheetId: { type: mongoose.Schema.Types.ObjectId, ref: "Timesheet" },
  },
  { timestamps: true }
);

// Compound index: one user, one day, one project/task combination
timeEntrySchema.index({ user: 1, date: 1 });

export default mongoose.model("TimeEntry", timeEntrySchema);
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/usersModels/TimeEntry.model.js
git commit -m "feat: add TimeEntry model"
```

---

### Task 2: Timesheet Model

**Files:**
- Create: `server/src/models/usersModels/Timesheet.model.js`

- [ ] **Step 1: Create model**

```js
import mongoose from "mongoose";

const timesheetSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekStart: { type: Date, required: true }, // Monday 00:00 UTC
    weekEnd:   { type: Date, required: true }, // Sunday 23:59 UTC

    totalHours:    { type: Number, default: 0 },
    billableHours: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "submitted",
      index: true,
    },

    adminNotes:  { type: String, trim: true, default: "" },
    submittedAt: { type: Date },
    reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt:  { type: Date },
  },
  { timestamps: true }
);

// One timesheet per user per week
timesheetSchema.index({ user: 1, weekStart: 1 }, { unique: true });

export default mongoose.model("Timesheet", timesheetSchema);
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/usersModels/Timesheet.model.js
git commit -m "feat: add Timesheet model"
```

---

### Task 3: Email Template + Send Function

**Files:**
- Create: `server/email-templates/10-timesheet-reviewed.html`
- Modify: `server/src/utils/sendEmails.js`

- [ ] **Step 1: Create template**

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Timesheet Reviewed</title></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1030;border-radius:12px;overflow:hidden;border:1px solid #2d1f5e;">
        <tr><td style="background:#7c3aed;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Timesheet {{STATUS}}</h1>
          <p style="color:#e0d0ff;margin:4px 0 0;font-size:14px;">Week of {{WEEK}}</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#c4b5fd;margin:0 0 16px;">Hi {{NAME}},</p>
          <p style="color:#9ca3af;margin:0 0 24px;">Your timesheet for the week of <strong style="color:#fff;">{{WEEK}}</strong> has been <strong style="color:#fff;">{{STATUS}}</strong>.</p>
          {{#if ADMIN_NOTES}}
          <div style="background:#0f0a1e;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;">Admin Notes:</p>
            <p style="color:#c4b5fd;margin:0;">{{ADMIN_NOTES}}</p>
          </div>
          {{/if}}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

- [ ] **Step 2: Add send function to sendEmails.js**

```js
export const sendTimesheetReviewedEmail = async ({ to, name, week, status, adminNotes }) => {
  let html = renderTemplate("10-timesheet-reviewed.html", {
    NAME: name,
    WEEK: week,
    STATUS: status,
    ADMIN_NOTES: adminNotes || "",
  });
  // Simple conditional rendering for admin notes block
  if (!adminNotes) {
    html = html.replace(/\{\{#if ADMIN_NOTES\}\}[\s\S]*?\{\{\/if ADMIN_NOTES\}\}/g, "");
  } else {
    html = html.replace("{{#if ADMIN_NOTES}}", "").replace("{{/if ADMIN_NOTES}}", "");
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Timesheet ${status} — Week of ${week}`,
    html,
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add server/email-templates/10-timesheet-reviewed.html server/src/utils/sendEmails.js
git commit -m "feat: add timesheet review email template and send function"
```

---

### Task 4: Time Tracking Controller

**Files:**
- Create: `server/src/controllers/usersControllers/timeTracking.controller.js`

- [ ] **Step 1: Create controller**

```js
import TimeEntry from "../../models/usersModels/TimeEntry.model.js";
import Timesheet from "../../models/usersModels/Timesheet.model.js";
import User from "../../models/usersModels/User.model.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import { emitDataUpdate } from "../../utils/dataUpdateService.js";
import { createAndEmitNotification } from "../../utils/notificationService.js";
import { sendTimesheetReviewedEmail } from "../../utils/sendEmails.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = (day === 0 ? -6 : 1 - day); // offset to Monday
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return { weekStart: monday, weekEnd: sunday };
}

// ─── Time Entries ──────────────────────────────────────────────────────────────

// GET /api/v1/time-entries  (admin)
export const getAllEntries = asyncHandler(async (req, res) => {
  const { user, project, from, to, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (user)    filter.user = user;
  if (project) filter.project = project;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to)   filter.date.$lte = new Date(to);
  }
  const entries = await TimeEntry.find(filter)
    .populate("user", "name avatar")
    .populate("project", "projectTitle")
    .populate("task", "title")
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  return successResponse(res, 200, "Time entries fetched", entries);
});

// GET /api/v1/time-entries/my  (team)
export const getMyEntries = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const filter = { user: req.user._id };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to)   filter.date.$lte = new Date(to);
  }
  const entries = await TimeEntry.find(filter)
    .populate("project", "projectTitle")
    .populate("task", "title")
    .sort({ date: -1 });
  return successResponse(res, 200, "My time entries", entries);
});

// POST /api/v1/time-entries  (team)
export const createEntry = asyncHandler(async (req, res) => {
  const { project, task, date, hours, description, isBillable } = req.body;
  if (!date || !hours) throw new AppError("date and hours are required", 400);

  const entry = await TimeEntry.create({
    user: req.user._id,
    project: project || undefined,
    task:    task    || undefined,
    date:    new Date(date),
    hours:   Number(hours),
    description: description || "",
    isBillable:  isBillable !== false,
  });

  emitDataUpdate(req.io, "timesheets", [`user:${req.user._id}`, "admin:global"]);
  return successResponse(res, 201, "Time entry created", entry);
});

// PUT /api/v1/time-entries/:id  (team | admin)
export const updateEntry = asyncHandler(async (req, res) => {
  const entry = await TimeEntry.findById(req.params.id);
  if (!entry) throw new AppError("Entry not found", 404);
  if (req.user.role !== "admin" && entry.user.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized", 403);
  }
  if (entry.timesheetId) throw new AppError("Cannot edit an entry already in a submitted timesheet", 400);

  const { hours, description, isBillable, project, task } = req.body;
  if (hours !== undefined)       entry.hours       = Number(hours);
  if (description !== undefined) entry.description = description;
  if (isBillable !== undefined)  entry.isBillable  = isBillable;
  if (project !== undefined)     entry.project     = project || undefined;
  if (task !== undefined)        entry.task        = task    || undefined;
  await entry.save();

  emitDataUpdate(req.io, "timesheets", [`user:${req.user._id}`, "admin:global"]);
  return successResponse(res, 200, "Time entry updated", entry);
});

// DELETE /api/v1/time-entries/:id  (team | admin)
export const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await TimeEntry.findById(req.params.id);
  if (!entry) throw new AppError("Entry not found", 404);
  if (req.user.role !== "admin" && entry.user.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized", 403);
  }
  if (entry.timesheetId) throw new AppError("Cannot delete an entry in a submitted timesheet", 400);
  await entry.deleteOne();
  emitDataUpdate(req.io, "timesheets", [`user:${req.user._id}`, "admin:global"]);
  return successResponse(res, 200, "Entry deleted");
});

// ─── Timesheets ────────────────────────────────────────────────────────────────

// GET /api/v1/timesheets  (admin)
export const getAllTimesheets = asyncHandler(async (req, res) => {
  const { user, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (user)   filter.user   = user;
  if (status) filter.status = status;

  const [timesheets, total] = await Promise.all([
    Timesheet.find(filter)
      .populate("user", "name avatar email")
      .populate("reviewedBy", "name")
      .sort({ weekStart: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Timesheet.countDocuments(filter),
  ]);
  return successResponse(res, 200, "Timesheets fetched", {
    timesheets,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/v1/timesheets/my  (team)
export const getMyTimesheets = asyncHandler(async (req, res) => {
  const timesheets = await Timesheet.find({ user: req.user._id })
    .populate("reviewedBy", "name")
    .sort({ weekStart: -1 });
  return successResponse(res, 200, "My timesheets", timesheets);
});

// GET /api/v1/timesheets/reports  (admin) — billable hours by project
export const getBillableReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const matchDate = {};
  if (from) matchDate.$gte = new Date(from);
  if (to)   matchDate.$lte = new Date(to);

  const pipeline = [
    ...(Object.keys(matchDate).length ? [{ $match: { date: matchDate } }] : []),
    { $match: { isBillable: true } },
    {
      $group: {
        _id: "$project",
        totalHours: { $sum: "$hours" },
        memberCount: { $addToSet: "$user" },
      },
    },
    {
      $lookup: {
        from: "adminprojects",
        localField: "_id",
        foreignField: "_id",
        as: "projectInfo",
      },
    },
    {
      $project: {
        project:     { $arrayElemAt: ["$projectInfo.projectTitle", 0] },
        totalHours:  1,
        memberCount: { $size: "$memberCount" },
      },
    },
    { $sort: { totalHours: -1 } },
  ];

  const report = await TimeEntry.aggregate(pipeline);
  return successResponse(res, 200, "Billable report", report);
});

// POST /api/v1/timesheets/submit  (team)
export const submitTimesheet = asyncHandler(async (req, res) => {
  const { weekDate } = req.body; // any date in the target week
  const { weekStart, weekEnd } = getWeekBounds(weekDate ? new Date(weekDate) : new Date());

  // Check no existing submitted/approved timesheet for this week
  const existing = await Timesheet.findOne({
    user: req.user._id,
    weekStart,
    status: { $in: ["submitted", "approved"] },
  });
  if (existing) throw new AppError("Timesheet for this week already submitted", 400);

  // Aggregate entries for the week
  const entries = await TimeEntry.find({
    user: req.user._id,
    date: { $gte: weekStart, $lte: weekEnd },
    timesheetId: { $exists: false },
  });

  if (entries.length === 0) throw new AppError("No time entries found for this week", 400);

  const totalHours    = entries.reduce((s, e) => s + e.hours, 0);
  const billableHours = entries.filter(e => e.isBillable).reduce((s, e) => s + e.hours, 0);

  // Upsert timesheet (draft may already exist)
  const timesheet = await Timesheet.findOneAndUpdate(
    { user: req.user._id, weekStart },
    {
      user: req.user._id,
      weekStart, weekEnd,
      totalHours, billableHours,
      status: "submitted",
      submittedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // Link entries to this timesheet
  await TimeEntry.updateMany(
    { _id: { $in: entries.map(e => e._id) } },
    { $set: { timesheetId: timesheet._id } }
  );

  emitDataUpdate(req.io, "timesheets", ["admin:global", `user:${req.user._id}`]);
  return successResponse(res, 201, "Timesheet submitted", timesheet);
});

// PUT /api/v1/timesheets/:id/review  (admin)
export const reviewTimesheet = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;
  if (!["approved", "rejected"].includes(status)) throw new AppError("Status must be approved or rejected", 400);

  const timesheet = await Timesheet.findById(req.params.id).populate("user", "name email");
  if (!timesheet) throw new AppError("Timesheet not found", 404);
  if (timesheet.status !== "submitted") throw new AppError("Only submitted timesheets can be reviewed", 400);

  timesheet.status     = status;
  timesheet.adminNotes = adminNotes || "";
  timesheet.reviewedBy = req.user._id;
  timesheet.reviewedAt = new Date();
  await timesheet.save();

  const weekLabel = new Date(timesheet.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  await Promise.allSettled([
    sendTimesheetReviewedEmail({
      to: timesheet.user.email,
      name: timesheet.user.name,
      week: weekLabel,
      status,
      adminNotes,
    }),
    createAndEmitNotification(req.io, {
      recipient: timesheet.user._id,
      type: "status_updated",
      title: `Timesheet ${status}`,
      message: `Your timesheet for the week of ${weekLabel} was ${status}.`,
      link: "/team/time-tracker",
    }),
  ]);

  emitDataUpdate(req.io, "timesheets", [`user:${timesheet.user._id}`, "admin:global"]);
  return successResponse(res, 200, `Timesheet ${status}`, timesheet);
});
```

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/usersControllers/timeTracking.controller.js
git commit -m "feat: add time tracking controller (entries + timesheets + submit + review)"
```

---

### Task 5: Route + App Mount

**Files:**
- Create: `server/src/routes/userRoutes/timeTracking.route.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: Create route**

```js
import express from "express";
import {
  getAllEntries, getMyEntries, createEntry, updateEntry, deleteEntry,
  getAllTimesheets, getMyTimesheets, getBillableReport, submitTimesheet, reviewTimesheet,
} from "../../controllers/usersControllers/timeTracking.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import { mutationLimiter } from "../../middlewares/rateLimiter.js";
import { mongoIdParam, validate } from "../../middlewares/validate.js";

const entriesRouter = express.Router();
const timesheetsRouter = express.Router();

// ── Time Entries ──
entriesRouter.get("/my",  userAuthenticated, authorizeRoles("team", "admin"), getMyEntries);
entriesRouter.get("/",    userAuthenticated, authorizeRoles("admin"), getAllEntries);
entriesRouter.post("/",   userAuthenticated, authorizeRoles("team", "admin"), mutationLimiter, createEntry);
entriesRouter.put("/:id", userAuthenticated, authorizeRoles("team", "admin"), mutationLimiter, validate([mongoIdParam("id")]), updateEntry);
entriesRouter.delete("/:id", userAuthenticated, authorizeRoles("team", "admin"), mutationLimiter, validate([mongoIdParam("id")]), deleteEntry);

// ── Timesheets ──
timesheetsRouter.get("/reports",      userAuthenticated, authorizeRoles("admin"), getBillableReport);
timesheetsRouter.get("/my",           userAuthenticated, authorizeRoles("team", "admin"), getMyTimesheets);
timesheetsRouter.get("/",             userAuthenticated, authorizeRoles("admin"), getAllTimesheets);
timesheetsRouter.post("/submit",      userAuthenticated, authorizeRoles("team", "admin"), mutationLimiter, submitTimesheet);
timesheetsRouter.put("/:id/review",   userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), reviewTimesheet);

export { entriesRouter, timesheetsRouter };
```

- [ ] **Step 2: Mount in app.js**

Add imports:
```js
import { entriesRouter, timesheetsRouter } from "./routes/userRoutes/timeTracking.route.js";
```

Add mounts:
```js
app.use("/api/v1/time-entries", entriesRouter);  // Individual time logs
app.use("/api/v1/timesheets",   timesheetsRouter); // Weekly timesheets
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/userRoutes/timeTracking.route.js server/src/app.js
git commit -m "feat: mount time-entries and timesheets routes"
```

---

### Task 6: Frontend API Client

**Files:**
- Create: `client/src/api/timeTracking.api.ts`

- [ ] **Step 1: Create API client**

```ts
import apiClient from './apiClient';

export interface TimeEntry {
  _id: string;
  user: { _id: string; name: string; avatar?: string };
  project?: { _id: string; projectTitle: string };
  task?: { _id: string; title: string };
  date: string;
  hours: number;
  description: string;
  isBillable: boolean;
  timesheetId?: string;
  createdAt: string;
}

export interface Timesheet {
  _id: string;
  user: { _id: string; name: string; avatar?: string; email: string };
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  billableHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  adminNotes: string;
  submittedAt?: string;
  reviewedBy?: { _id: string; name: string };
  reviewedAt?: string;
}

export const timeEntriesApi = {
  getAll:  (params?: Record<string, any>) => apiClient.get('/time-entries', { params }),
  getMy:   (params?: Record<string, any>) => apiClient.get('/time-entries/my', { params }),
  create:  (data: Partial<TimeEntry>)     => apiClient.post('/time-entries', data),
  update:  (id: string, data: Partial<TimeEntry>) => apiClient.put(`/time-entries/${id}`, data),
  delete:  (id: string)                   => apiClient.delete(`/time-entries/${id}`),
};

export const timesheetsApi = {
  getAll:   (params?: Record<string, any>) => apiClient.get('/timesheets', { params }),
  getMy:    ()                              => apiClient.get('/timesheets/my'),
  submit:   (weekDate?: string)            => apiClient.post('/timesheets/submit', { weekDate }),
  review:   (id: string, status: 'approved' | 'rejected', adminNotes?: string) =>
              apiClient.put(`/timesheets/${id}/review`, { status, adminNotes }),
  getReport: (params?: { from?: string; to?: string }) =>
              apiClient.get('/timesheets/reports', { params }),
};
```

- [ ] **Step 2: Commit**

```bash
git add client/src/api/timeTracking.api.ts
git commit -m "feat: add time tracking API client"
```

---

### Task 7: Team Time Tracker Page

**Files:**
- Create: `client/src/pages/team/TeamTimeTracker.tsx`

- [ ] **Step 1: Create page**

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, CheckCircle, Loader2, Trash2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { timeEntriesApi, timesheetsApi, TimeEntry, Timesheet } from '../../api/timeTracking.api';
import { useDataRealtime } from '../../hooks/useDataRealtime';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1 - day) + offset * 7;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + diff + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  approved:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected:  'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function TeamTimeTracker() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = getWeekDates(weekOffset);
  const from = weekDates[0].toISOString().split('T')[0];
  const to   = weekDates[6].toISOString().split('T')[0];

  const [entries, setEntries]     = useState<TimeEntry[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: 1,
    description: '',
    isBillable: true,
    project: '',
  });

  const load = useCallback(async () => {
    try {
      const [entriesRes, tsRes] = await Promise.all([
        timeEntriesApi.getMy({ from, to }),
        timesheetsApi.getMy(),
      ]);
      setEntries(entriesRes.data.data ?? []);
      setTimesheets(tsRes.data.data ?? []);
    } catch {
      toast.error('Failed to load time data');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);
  useDataRealtime('timesheets', load);

  const currentTimesheet = timesheets.find(ts => {
    const ws = new Date(ts.weekStart).toISOString().split('T')[0];
    return ws === from;
  });

  const handleAdd = async () => {
    if (!form.hours || form.hours < 0.5) { toast.error('Minimum 0.5 hours'); return; }
    try {
      await timeEntriesApi.create({
        date: form.date,
        hours: form.hours,
        description: form.description,
        isBillable: form.isBillable,
        project: form.project || undefined,
      } as any);
      toast.success('Time entry added');
      setShowAdd(false);
      setForm({ date: new Date().toISOString().split('T')[0], hours: 1, description: '', isBillable: true, project: '' });
      load();
    } catch { toast.error('Failed to add entry'); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await timeEntriesApi.delete(id);
      toast.success('Entry deleted');
      load();
    } catch { toast.error('Cannot delete — may be in a submitted timesheet'); }
    finally { setDeleting(null); }
  };

  const handleSubmit = async () => {
    if (!confirm('Submit timesheet for this week?')) return;
    setSubmitting(true);
    try {
      await timesheetsApi.submit(from);
      toast.success('Timesheet submitted for review');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Group entries by date
  const byDay: Record<string, TimeEntry[]> = {};
  for (const e of entries) {
    const key = new Date(e.date).toISOString().split('T')[0];
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(e);
  }

  const totalHours    = entries.reduce((s, e) => s + e.hours, 0);
  const billableHours = entries.filter(e => e.isBillable).reduce((s, e) => s + e.hours, 0);
  const canSubmit     = !currentTimesheet && entries.length > 0;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white">Time Tracker</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(p => p - 1)} className="border-white/10 text-white/70">←</Button>
          <span className="text-sm text-white/50 px-2">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(p => p + 1)} className="border-white/10 text-white/70">→</Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" /> Log Time
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Hours', value: `${totalHours.toFixed(1)}h` },
          { label: 'Billable', value: `${billableHours.toFixed(1)}h` },
          { label: 'Non-Billable', value: `${(totalHours - billableHours).toFixed(1)}h` },
        ].map(s => (
          <Card key={s.label} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <p className="text-xs text-white/50">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timesheet Status */}
      {currentTimesheet && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Timesheet Status</p>
              <Badge className={`mt-1 text-xs border ${STATUS_COLORS[currentTimesheet.status] ?? 'bg-white/10 text-white/50 border-white/10'}`}>
                {currentTimesheet.status}
              </Badge>
              {currentTimesheet.adminNotes && (
                <p className="text-xs text-white/40 mt-1 italic">{currentTimesheet.adminNotes}</p>
              )}
            </div>
            <p className="text-sm text-white/50">
              {currentTimesheet.totalHours.toFixed(1)}h total · {currentTimesheet.billableHours.toFixed(1)}h billable
            </p>
          </CardContent>
        </Card>
      )}

      {/* Weekly Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, idx) => {
          const key = date.toISOString().split('T')[0];
          const dayEntries = byDay[key] ?? [];
          const dayTotal = dayEntries.reduce((s, e) => s + e.hours, 0);
          const isToday = key === new Date().toISOString().split('T')[0];
          return (
            <div key={key} className={`rounded-xl p-2 border ${isToday ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-white/[0.03]'}`}>
              <p className="text-xs text-white/40 mb-1">{DAYS[idx]}</p>
              <p className="text-xs text-white/60 mb-2">{date.getDate()}</p>
              {dayTotal > 0 && (
                <div className="text-xs font-bold text-primary mb-1">{dayTotal.toFixed(1)}h</div>
              )}
              {dayEntries.map(e => (
                <div key={e._id} className="text-[10px] text-white/40 truncate py-0.5">
                  {e.hours}h {e.description || 'No description'}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Entry List */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">This Week's Entries</h2>
        {entries.length === 0 && <p className="text-white/40 text-sm py-4">No entries logged this week</p>}
        {entries.map(e => (
          <motion.div key={e._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{e.hours}h</span>
                {e.isBillable
                  ? <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] border">Billable</Badge>
                  : <Badge className="bg-white/10 text-white/40 border-white/10 text-[10px] border">Non-billable</Badge>
                }
                <span className="text-xs text-white/40">{new Date(e.date).toLocaleDateString()}</span>
              </div>
              {e.description && <p className="text-xs text-white/50 mt-0.5">{e.description}</p>}
              {e.project && <p className="text-xs text-white/30">{(e.project as any).projectTitle}</p>}
            </div>
            {!e.timesheetId && (
              <button onClick={() => handleDelete(e._id)} disabled={deleting === e._id} className="p-1.5 rounded-lg hover:bg-red-500/10">
                {deleting === e._id ? <Loader2 className="w-4 h-4 animate-spin text-white/40" /> : <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-400" />}
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Submit Timesheet */}
      {canSubmit && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Submit Timesheet</>}
          </Button>
        </div>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#1a1030] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Log Time</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Hours</Label>
                <Input type="number" min={0.5} max={24} step={0.5} value={form.hours} onChange={e => setForm(p => ({ ...p, hours: +e.target.value }))} className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-white/70 text-xs mb-1 block">Description</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="What did you work on?" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="billable" checked={form.isBillable} onChange={e => setForm(p => ({ ...p, isBillable: e.target.checked }))} className="accent-primary" />
              <Label htmlFor="billable" className="text-white/70 text-sm cursor-pointer">Billable</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="border-white/10 text-white/70">Cancel</Button>
              <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">Log Time</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/team/TeamTimeTracker.tsx
git commit -m "feat: add TeamTimeTracker page with weekly grid, entry log, and submit"
```

---

### Task 8: Admin Timesheets Page

**Files:**
- Create: `client/src/pages/admin/AdminTimesheets.tsx`

- [ ] **Step 1: Create page**

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, Loader2, BarChart2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { timesheetsApi, Timesheet } from '../../api/timeTracking.api';
import { useDataRealtime } from '../../hooks/useDataRealtime';

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  approved:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected:  'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function AdminTimesheets() {
  const [timesheets, setTimesheets]   = useState<Timesheet[]>([]);
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [loading, setLoading]         = useState(true);
  const [reviewing, setReviewing]     = useState<Timesheet | null>(null);
  const [notes, setNotes]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [report, setReport]           = useState<any[]>([]);
  const [activeTab, setActiveTab]     = useState<'list' | 'report'>('list');

  const load = useCallback(async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const [tsRes, repRes] = await Promise.all([
        timesheetsApi.getAll(params),
        timesheetsApi.getReport(),
      ]);
      setTimesheets(tsRes.data.data?.timesheets ?? []);
      setReport(repRes.data.data ?? []);
    } catch {
      toast.error('Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);
  useDataRealtime('timesheets', load);

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!reviewing) return;
    setSaving(true);
    try {
      await timesheetsApi.review(reviewing._id, status, notes);
      toast.success(`Timesheet ${status}`);
      setReviewing(null);
      setNotes('');
      load();
    } catch {
      toast.error('Review failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white">Timesheets</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={activeTab === 'list' ? 'default' : 'outline'} onClick={() => setActiveTab('list')} className={activeTab === 'list' ? 'bg-primary' : 'border-white/10 text-white/70'}>List</Button>
          <Button size="sm" variant={activeTab === 'report' ? 'default' : 'outline'} onClick={() => setActiveTab('report')} className={activeTab === 'report' ? 'bg-primary' : 'border-white/10 text-white/70'}>
            <BarChart2 className="w-4 h-4 mr-1" /> Billable Report
          </Button>
        </div>
      </div>

      {activeTab === 'list' && (
        <>
          <div className="flex gap-2">
            {['', 'submitted', 'approved', 'rejected'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${statusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {timesheets.length === 0 && <p className="text-center text-white/40 py-12">No timesheets found</p>}
            {timesheets.map(ts => (
              <Card key={ts._id} className="bg-white/5 border-white/10">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{ts.user.name}</span>
                      <Badge className={`text-xs border ${STATUS_COLORS[ts.status] ?? 'bg-white/10 text-white/50 border-white/10'}`}>{ts.status}</Badge>
                    </div>
                    <p className="text-sm text-white/50 mt-0.5">
                      Week of {new Date(ts.weekStart).toLocaleDateString()} — {ts.totalHours.toFixed(1)}h total · {ts.billableHours.toFixed(1)}h billable
                    </p>
                    {ts.adminNotes && <p className="text-xs text-white/30 italic mt-0.5">{ts.adminNotes}</p>}
                  </div>
                  {ts.status === 'submitted' && (
                    <Button size="sm" onClick={() => { setReviewing(ts); setNotes(''); }} className="bg-primary hover:bg-primary/90 shrink-0">
                      Review
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'report' && (
        <div className="space-y-3">
          <p className="text-sm text-white/50">Billable hours by project (all time)</p>
          {report.length === 0 && <p className="text-center text-white/40 py-12">No billable data yet</p>}
          {report.map((r, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardContent className="p-4 flex items-center justify-between">
                <p className="text-white">{r.project || 'No Project'}</p>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{r.totalHours.toFixed(1)}h</p>
                  <p className="text-xs text-white/40">{r.memberCount} members</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewing} onOpenChange={v => { if (!v) setReviewing(null); }}>
        <DialogContent className="bg-[#1a1030] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Review Timesheet</DialogTitle></DialogHeader>
          {reviewing && (
            <div className="space-y-4">
              <div className="text-sm text-white/70 space-y-1">
                <p><span className="text-white/40">Member:</span> {reviewing.user.name}</p>
                <p><span className="text-white/40">Week:</span> {new Date(reviewing.weekStart).toLocaleDateString()}</p>
                <p><span className="text-white/40">Hours:</span> {reviewing.totalHours.toFixed(1)}h ({reviewing.billableHours.toFixed(1)}h billable)</p>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Admin Notes (optional)</label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="Feedback for team member..." />
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

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/admin/AdminTimesheets.tsx
git commit -m "feat: add AdminTimesheets page with review and billable report"
```

---

### Task 9: Wire Routes, Sidebars, DashboardSearch

**Files:**
- Modify: `client/src/App.tsx`
- Modify: Team sidebar — add Time Tracker link (guarded)
- Modify: Admin sidebar — add Timesheets link
- Modify: `client/src/components/DashboardSearch.tsx`

- [ ] **Step 1: Add routes in App.tsx**

```tsx
import TeamTimeTracker from '../pages/team/TeamTimeTracker';
import AdminTimesheets from '../pages/admin/AdminTimesheets';
// Team routes:
<Route path="time-tracker" element={<TeamTimeTracker />} />
// Admin routes:
<Route path="timesheets" element={<AdminTimesheets />} />
```

- [ ] **Step 2: Team sidebar with feature flag**

```tsx
import { useFeatureFlag } from '../hooks/useFeatureFlag';
const timeEnabled = useFeatureFlag('time-tracking');
// Add to links (conditionally):
...(timeEnabled ? [{ label: 'Time Tracker', path: '/team/time-tracker', icon: Clock }] : [])
```

- [ ] **Step 3: Admin sidebar**

```tsx
{ label: 'Timesheets', path: '/admin/timesheets', icon: Clock }
```

- [ ] **Step 4: DashboardSearch entries**

```tsx
// TEAM_ITEMS:
{ id: 't-time-tracker', label: 'Time Tracker', description: 'Log hours and submit weekly timesheets', path: '/team/time-tracker', icon: Clock, group: 'Pages', keywords: ['hours', 'timesheet', 'log', 'billable'] },
// ADMIN_ITEMS:
{ id: 'a-timesheets', label: 'Timesheets', description: 'Approve team timesheets and view billable reports', path: '/admin/timesheets', icon: Clock, group: 'Pages', keywords: ['timesheet', 'hours', 'billable', 'approve'] },
```

- [ ] **Step 5: Commit**

```bash
git add client/src/App.tsx client/src/layouts/TeamLayout.tsx client/src/layouts/AdminLayout.tsx client/src/components/DashboardSearch.tsx
git commit -m "feat: wire time tracking routes, sidebar links, and search"
```

---

## Self-Review Checklist

- [x] `getWeekBounds` uses UTC to avoid timezone shifts corrupting week boundaries
- [x] `/reports` and `/my` declared before `/:id` — no Express param conflict
- [x] Submit validates entries exist before creating timesheet — no empty submissions
- [x] `$setOnInsert` not needed for timesheet — `findOneAndUpdate` with upsert handles re-submit attempts
- [x] Entries locked once linked to a timesheet — `timesheetId` check on update/delete
- [x] Email + notification wrapped in `Promise.allSettled` — review succeeds even if email fails
- [x] `useFeatureFlag('time-tracking')` guards team sidebar link
- [x] DashboardSearch entries added for both team and admin pages
