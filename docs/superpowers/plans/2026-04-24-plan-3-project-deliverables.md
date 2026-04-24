# Project Deliverables (Module 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Team/admin upload project deliverables to Cloudinary; admin controls per-file visibility; clients download only files marked visible. Works for both client project requests and portfolio projects.

**Architecture:** `Deliverable` Mongoose model with `clientProject` or `portfolioProject` ref → Express routes → "Deliverables" tab added to existing Team project detail and User project detail pages. Cloudinary `resource_type: 'auto'` handles any file type. `emitDataUpdate` + `createAndEmitNotification` fires `file_received` when visibility is toggled on.

**Tech Stack:** Express 5, Mongoose, Multer + Cloudinary, React 18 + TypeScript, shadcn/ui, Framer Motion, Sonner, `useDataRealtime`.

**Prerequisite:** Plan 1 (Feature Flags) must be complete — `useFeatureFlag('project-deliverables')` guards user download UI.

---

## File Map

| Action | File |
|---|---|
| Create | `server/src/models/usersModels/Deliverable.model.js` |
| Create | `server/src/controllers/usersControllers/deliverable.controller.js` |
| Create | `server/src/routes/userRoutes/deliverable.route.js` |
| Create | `server/email-templates/11-deliverable-shared.html` |
| Modify | `server/src/utils/sendEmails.js` — add `sendDeliverableSharedEmail` |
| Modify | `server/src/app.js` — mount `/api/v1/deliverables` |
| Create | `client/src/api/deliverables.api.ts` |
| Create | `client/src/components/DeliverablesList.tsx` — reusable list used in both team and user pages |
| Modify | `client/src/pages/team/TeamClientRequestDetail.tsx` — add Deliverables tab |
| Modify | `client/src/pages/team/TeamProjectDetail.tsx` — add Deliverables tab |
| Modify | `client/src/pages/user/UserProjects.tsx` — add Deliverables tab in project detail view |

---

### Task 1: Deliverable Mongoose Model

**Files:**
- Create: `server/src/models/usersModels/Deliverable.model.js`

- [ ] **Step 1: Create model**

```js
/**
 * Deliverable model – files delivered to clients per project.
 *
 * Exactly one of `clientProject` or `portfolioProject` must be set.
 * Pre-save validation enforces this.
 *
 * `isVisibleToClient` defaults to false — team uploads privately,
 * then flips to true when ready to share. That flip triggers a
 * notification + real-time event to the client.
 */
import mongoose from "mongoose";

const deliverableSchema = new mongoose.Schema(
  {
    clientProject:    { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    portfolioProject: { type: mongoose.Schema.Types.ObjectId, ref: "AdminProject" },

    uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clientId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who receives it

    fileName:      { type: String, required: true, trim: true },
    fileUrl:       { type: String, required: true },
    fileType:      { type: String, required: true }, // mime type
    fileSizeBytes: { type: Number, default: 0 },
    cloudinaryId:  { type: String, default: "" }, // for deletion

    description: { type: String, trim: true, default: "" },
    version:     { type: String, trim: true, default: "v1.0" },

    isVisibleToClient: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Enforce: exactly one project ref must be set
deliverableSchema.pre("save", function (next) {
  const hasBoth   = this.clientProject && this.portfolioProject;
  const hasNeither = !this.clientProject && !this.portfolioProject;
  if (hasBoth || hasNeither) {
    return next(new Error("Exactly one of clientProject or portfolioProject must be set"));
  }
  next();
});

export default mongoose.model("Deliverable", deliverableSchema);
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/usersModels/Deliverable.model.js
git commit -m "feat: add Deliverable model"
```

---

### Task 2: Email Template + Send Function

**Files:**
- Create: `server/email-templates/11-deliverable-shared.html`
- Modify: `server/src/utils/sendEmails.js`

- [ ] **Step 1: Create email template**

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>New Deliverable Shared</title></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1030;border-radius:12px;overflow:hidden;border:1px solid #2d1f5e;">
        <tr><td style="background:#7c3aed;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:20px;">New File Delivered</h1>
          <p style="color:#e0d0ff;margin:4px 0 0;font-size:14px;">{{PROJECT_NAME}}</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#c4b5fd;margin:0 0 16px;">Hi {{CLIENT_NAME}},</p>
          <p style="color:#9ca3af;margin:0 0 24px;">A new file has been shared with you for your project.</p>
          <table width="100%" cellpadding="12" cellspacing="0" style="background:#0f0a1e;border-radius:8px;margin-bottom:24px;">
            <tr>
              <td style="color:#9ca3af;font-size:14px;">File</td>
              <td style="color:#fff;font-size:14px;font-weight:600;">{{FILE_NAME}}</td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="{{CLIENT_URL}}/user-dashboard/projects" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 32px;border-radius:9999px;text-decoration:none;font-weight:600;">View Deliverable</a>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

- [ ] **Step 2: Add send function to sendEmails.js**

At the bottom of `server/src/utils/sendEmails.js` add:
```js
export const sendDeliverableSharedEmail = async ({ to, clientName, projectName, fileName, clientUrl }) => {
  const html = renderTemplate("11-deliverable-shared.html", {
    CLIENT_NAME: clientName,
    PROJECT_NAME: projectName,
    FILE_NAME: fileName,
    CLIENT_URL: clientUrl,
  });
  await resend.emails.send({
    from: FROM,
    to,
    subject: `New File Delivered — ${projectName}`,
    html,
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add server/email-templates/11-deliverable-shared.html server/src/utils/sendEmails.js
git commit -m "feat: add deliverable email template and send function"
```

---

### Task 3: Deliverable Controller

**Files:**
- Create: `server/src/controllers/usersControllers/deliverable.controller.js`

- [ ] **Step 1: Create controller**

```js
import Deliverable from "../../models/usersModels/Deliverable.model.js";
import Project from "../../models/usersModels/Project.model.js";
import AdminProject from "../../models/usersModels/AdminProject.model.js";
import User from "../../models/usersModels/User.model.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import { emitDataUpdate } from "../../utils/dataUpdateService.js";
import { createAndEmitNotification } from "../../utils/notificationService.js";
import { sendDeliverableSharedEmail } from "../../utils/sendEmails.js";
import { uploadFile } from "../../middlewares/Cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// GET /api/v1/deliverables/project/:projectId?type=client|portfolio
export const getDeliverables = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { type = "client" } = req.query;
  const { role, _id: userId } = req.user;

  const filter = type === "portfolio"
    ? { portfolioProject: projectId }
    : { clientProject: projectId };

  // Non-admin/team only see visible files
  if (role === "user") filter.isVisibleToClient = true;

  const deliverables = await Deliverable.find(filter)
    .populate("uploadedBy", "name avatar")
    .sort({ createdAt: -1 });

  return successResponse(res, 200, "Deliverables fetched", deliverables);
});

// POST /api/v1/deliverables  (admin | team) — multipart/form-data
export const uploadDeliverable = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded", 400);

  const { clientProject, portfolioProject, description, version, clientId } = req.body;

  // Upload to Cloudinary
  const result = await uploadFile(req.file.path, "deliverables");
  if (req.file.path) fs.unlink(req.file.path, () => {});

  const deliverable = await Deliverable.create({
    clientProject:    clientProject || undefined,
    portfolioProject: portfolioProject || undefined,
    uploadedBy:  req.user._id,
    clientId:    clientId || undefined,
    fileName:    req.file.originalname,
    fileUrl:     result.secure_url,
    fileType:    req.file.mimetype,
    fileSizeBytes: req.file.size,
    cloudinaryId: result.public_id,
    description:  description || "",
    version:      version || "v1.0",
    isVisibleToClient: false,
  });

  emitDataUpdate(req.io, "deliverables", ["admin:global", "team:global"]);
  return successResponse(res, 201, "Deliverable uploaded", deliverable);
});

// PUT /api/v1/deliverables/:id/visibility  (admin | team)
export const toggleVisibility = asyncHandler(async (req, res) => {
  const deliverable = await Deliverable.findById(req.params.id)
    .populate("clientId", "name email");

  if (!deliverable) throw new AppError("Deliverable not found", 404);

  const wasHidden = !deliverable.isVisibleToClient;
  deliverable.isVisibleToClient = !deliverable.isVisibleToClient;
  await deliverable.save();

  // Only notify when flipping from hidden → visible
  if (wasHidden && deliverable.clientId) {
    let projectName = "Your Project";
    if (deliverable.clientProject) {
      const proj = await Project.findById(deliverable.clientProject).select("projectName");
      if (proj) projectName = proj.projectName;
    } else if (deliverable.portfolioProject) {
      const proj = await AdminProject.findById(deliverable.portfolioProject).select("projectTitle");
      if (proj) projectName = proj.projectTitle;
    }

    await Promise.allSettled([
      sendDeliverableSharedEmail({
        to: deliverable.clientId.email,
        clientName: deliverable.clientId.name,
        projectName,
        fileName: deliverable.fileName,
        clientUrl: CLIENT_URL,
      }),
      createAndEmitNotification(req.io, {
        recipient: deliverable.clientId._id,
        type: "file_received",
        title: "New File Delivered",
        message: `${deliverable.fileName} is ready to download for ${projectName}.`,
        link: "/user-dashboard/projects",
      }),
    ]);

    emitDataUpdate(req.io, "deliverables", [
      `user:${deliverable.clientId._id}`,
      "admin:global",
      "team:global",
    ]);
  } else {
    emitDataUpdate(req.io, "deliverables", ["admin:global", "team:global"]);
  }

  return successResponse(res, 200, "Visibility updated", deliverable);
});

// DELETE /api/v1/deliverables/:id  (admin | team)
export const deleteDeliverable = asyncHandler(async (req, res) => {
  const deliverable = await Deliverable.findById(req.params.id);
  if (!deliverable) throw new AppError("Deliverable not found", 404);

  // Delete from Cloudinary
  if (deliverable.cloudinaryId) {
    await cloudinary.uploader.destroy(deliverable.cloudinaryId, { resource_type: "auto" })
      .catch(() => {}); // non-blocking
  }

  await deliverable.deleteOne();
  emitDataUpdate(req.io, "deliverables", ["admin:global", "team:global"]);
  return successResponse(res, 200, "Deliverable deleted");
});
```

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/usersControllers/deliverable.controller.js
git commit -m "feat: add deliverable controller"
```

---

### Task 4: Route + App Mount

**Files:**
- Create: `server/src/routes/userRoutes/deliverable.route.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: Create route**

```js
import express from "express";
import multer from "multer";
import path from "path";
import {
  getDeliverables,
  uploadDeliverable,
  toggleVisibility,
  deleteDeliverable,
} from "../../controllers/usersControllers/deliverable.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import { mutationLimiter } from "../../middlewares/rateLimiter.js";
import { mongoIdParam, validate } from "../../middlewares/validate.js";

const upload = multer({
  dest: "src/public/uploads/",
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB — deliverables can be large
});

const router = express.Router();

router.get("/project/:projectId", userAuthenticated, getDeliverables);

router.post("/",
  userAuthenticated, authorizeRoles("admin", "team"),
  mutationLimiter,
  upload.single("file"),
  uploadDeliverable
);

router.put("/:id/visibility",
  userAuthenticated, authorizeRoles("admin", "team"),
  mutationLimiter,
  validate([mongoIdParam("id")]),
  toggleVisibility
);

router.delete("/:id",
  userAuthenticated, authorizeRoles("admin", "team"),
  mutationLimiter,
  validate([mongoIdParam("id")]),
  deleteDeliverable
);

export default router;
```

- [ ] **Step 2: Mount in app.js**

Add import:
```js
import deliverableRoutes from "./routes/userRoutes/deliverable.route.js";
```

Add mount:
```js
app.use("/api/v1/deliverables", deliverableRoutes); // Project deliverables
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/userRoutes/deliverable.route.js server/src/app.js
git commit -m "feat: mount deliverable routes"
```

---

### Task 5: Frontend API Client

**Files:**
- Create: `client/src/api/deliverables.api.ts`

- [ ] **Step 1: Create API client**

```ts
import apiClient from './apiClient';

export interface Deliverable {
  _id: string;
  clientProject?: string;
  portfolioProject?: string;
  uploadedBy: { _id: string; name: string; avatar?: string };
  clientId?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  description: string;
  version: string;
  isVisibleToClient: boolean;
  createdAt: string;
}

export const deliverablesApi = {
  getForProject: (projectId: string, type: 'client' | 'portfolio' = 'client') =>
    apiClient.get<Deliverable[]>(`/deliverables/project/${projectId}`, { params: { type } }),

  upload: (data: {
    file: File;
    clientProject?: string;
    portfolioProject?: string;
    clientId?: string;
    description?: string;
    version?: string;
  }) => {
    const fd = new FormData();
    fd.append('file', data.file);
    if (data.clientProject)    fd.append('clientProject',    data.clientProject);
    if (data.portfolioProject) fd.append('portfolioProject', data.portfolioProject);
    if (data.clientId)         fd.append('clientId',         data.clientId);
    if (data.description)      fd.append('description',      data.description);
    if (data.version)          fd.append('version',          data.version);
    return apiClient.post('/deliverables', fd);
  },

  toggleVisibility: (id: string) =>
    apiClient.put(`/deliverables/${id}/visibility`),

  delete: (id: string) =>
    apiClient.delete(`/deliverables/${id}`),
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/api/deliverables.api.ts
git commit -m "feat: add deliverables API client"
```

---

### Task 6: Reusable DeliverablesList Component

**Files:**
- Create: `client/src/components/DeliverablesList.tsx`

- [ ] **Step 1: Create component**

```tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Download, Trash2, Eye, EyeOff, FileText,
  Image, FileArchive, Loader2, Plus,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { deliverablesApi, Deliverable, formatFileSize } from '../api/deliverables.api';
import { useDataRealtime } from '../hooks/useDataRealtime';

interface Props {
  projectId: string;
  projectType: 'client' | 'portfolio';
  clientId?: string;       // pass when team knows the client
  canUpload: boolean;      // true for admin/team
  canToggleVisibility: boolean;
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType.includes('zip') || mimeType.includes('rar')) return FileArchive;
  return FileText;
}

export default function DeliverablesList({
  projectId, projectType, clientId, canUpload, canToggleVisibility,
}: Props) {
  const [items, setItems] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadForm, setUploadForm] = useState({ description: '', version: 'v1.0', file: null as File | null });

  const load = useCallback(async () => {
    try {
      const res = await deliverablesApi.getForProject(projectId, projectType);
      setItems(res.data.data ?? res.data);
    } catch {
      toast.error('Failed to load deliverables');
    } finally {
      setLoading(false);
    }
  }, [projectId, projectType]);

  useEffect(() => { load(); }, [load]);
  useDataRealtime('deliverables', load);

  const handleUpload = async () => {
    if (!uploadForm.file) { toast.error('Select a file first'); return; }
    setUploading(true);
    try {
      await deliverablesApi.upload({
        file: uploadForm.file,
        [projectType === 'client' ? 'clientProject' : 'portfolioProject']: projectId,
        clientId,
        description: uploadForm.description,
        version: uploadForm.version,
      });
      toast.success('File uploaded');
      setShowUpload(false);
      setUploadForm({ description: '', version: 'v1.0', file: null });
      load();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      await deliverablesApi.toggleVisibility(id);
      toast.success('Visibility updated');
      load();
    } catch {
      toast.error('Failed to update visibility');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setDeleting(id);
    try {
      await deliverablesApi.delete(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowUpload(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" /> Upload File
          </Button>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-center text-white/40 py-8">No deliverables yet</p>
      )}

      <AnimatePresence>
        {items.map(item => {
          const Icon = fileIcon(item.fileType);
          return (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.fileName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/40">{formatFileSize(item.fileSizeBytes)}</span>
                  {item.version && <span className="text-xs text-white/40">{item.version}</span>}
                  {item.description && <span className="text-xs text-white/40 truncate">{item.description}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {canToggleVisibility && (
                  <button
                    onClick={() => handleToggle(item._id)}
                    disabled={toggling === item._id}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title={item.isVisibleToClient ? 'Hide from client' : 'Share with client'}
                  >
                    {toggling === item._id
                      ? <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                      : item.isVisibleToClient
                        ? <Eye className="w-4 h-4 text-emerald-400" />
                        : <EyeOff className="w-4 h-4 text-white/30" />
                    }
                  </button>
                )}
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={item.fileName}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Download className="w-4 h-4 text-white/50 hover:text-white" />
                </a>
                {canUpload && (
                  <button
                    onClick={() => handleDelete(item._id, item.fileName)}
                    disabled={deleting === item._id}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    {deleting === item._id
                      ? <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                      : <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-400" />
                    }
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={v => { setShowUpload(v); if (!v) setUploadForm({ description: '', version: 'v1.0', file: null }); }}>
        <DialogContent className="bg-[#1a1030] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Upload Deliverable</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70 text-xs mb-1 block">File</Label>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={e => setUploadForm(p => ({ ...p, file: e.target.files?.[0] ?? null }))}
              />
              <div
                onClick={() => fileRef.current?.click()}
                className="border border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {uploadForm.file
                  ? <p className="text-sm text-white">{uploadForm.file.name}</p>
                  : <><Upload className="w-6 h-6 text-white/30 mx-auto mb-2" /><p className="text-sm text-white/40">Click to select file</p></>
                }
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Version</Label>
                <Input
                  value={uploadForm.version}
                  onChange={e => setUploadForm(p => ({ ...p, version: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="v1.0"
                />
              </div>
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Description</Label>
                <Input
                  value={uploadForm.description}
                  onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Optional note"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUpload(false)} className="border-white/10 text-white/70">Cancel</Button>
              <Button onClick={handleUpload} disabled={uploading || !uploadForm.file} className="bg-primary hover:bg-primary/90">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
              </Button>
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
git add client/src/components/DeliverablesList.tsx
git commit -m "feat: add reusable DeliverablesList component"
```

---

### Task 7: Add Deliverables Tab to Team Pages

**Files:**
- Modify: `client/src/pages/team/TeamClientRequestDetail.tsx`
- Modify: `client/src/pages/team/TeamProjectDetail.tsx`

- [ ] **Step 1: Add to TeamClientRequestDetail.tsx**

Find the existing tab state (or detail layout). Add a "Deliverables" tab:

```tsx
// Add import at top
import DeliverablesList from '../../components/DeliverablesList';

// In the tabs array or wherever tabs are defined, add:
{ key: 'deliverables', label: 'Deliverables' }

// In tab content render, add:
{activeTab === 'deliverables' && (
  <DeliverablesList
    projectId={project._id}
    projectType="client"
    clientId={project.requestedBy?._id}
    canUpload={true}
    canToggleVisibility={true}
  />
)}
```

- [ ] **Step 2: Add to TeamProjectDetail.tsx**

```tsx
import DeliverablesList from '../../components/DeliverablesList';

// Add tab:
{ key: 'deliverables', label: 'Deliverables' }

// Add content:
{activeTab === 'deliverables' && (
  <DeliverablesList
    projectId={project._id}
    projectType="portfolio"
    canUpload={true}
    canToggleVisibility={true}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/team/TeamClientRequestDetail.tsx client/src/pages/team/TeamProjectDetail.tsx
git commit -m "feat: add Deliverables tab to team project detail pages"
```

---

### Task 8: Add Deliverables Tab to User Projects

**Files:**
- Modify: `client/src/pages/user/UserProjects.tsx`

- [ ] **Step 1: Add deliverables tab to user project detail view**

In `UserProjects.tsx`, find where the project detail/modal is rendered. Add:

```tsx
import DeliverablesList from '../../components/DeliverablesList';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

// inside component:
const deliverablesEnabled = useFeatureFlag('project-deliverables');

// In project detail tabs, add conditionally:
{deliverablesEnabled && { key: 'deliverables', label: 'Deliverables' }}

// In tab content:
{activeTab === 'deliverables' && deliverablesEnabled && (
  <DeliverablesList
    projectId={selectedProject._id}
    projectType="client"
    canUpload={false}
    canToggleVisibility={false}
  />
)}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/user/UserProjects.tsx
git commit -m "feat: add Deliverables tab to user projects page"
```

---

## Self-Review Checklist

- [x] Pre-save validation ensures exactly one project ref — no orphaned deliverables
- [x] `isVisibleToClient: false` default — team uploads privately first, shares deliberately
- [x] Notification + email only fires when flipping hidden → visible (not on every toggle)
- [x] Cloudinary deletion happens on deliverable delete — no orphaned files
- [x] 100MB upload limit — large video/design file deliverables supported
- [x] `resource_type: 'auto'` via existing `uploadFile()` helper — PDF/video/ZIP all work
- [x] `useFeatureFlag('project-deliverables')` guards user tab
- [x] Reusable `DeliverablesList` used in 3 places — no code duplication
