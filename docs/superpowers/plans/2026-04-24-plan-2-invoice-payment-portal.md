# Invoice & Payment Portal (Module 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin generates invoices for clients, sends via email, and tracks payment. Clients view invoices in their dashboard and upload payment proof. Admin approves/rejects proof.

**Architecture:** `Invoice` Mongoose model → Express CRUD routes → React pages for admin (generate/manage) and user (view/pay). Cloudinary stores PDFs and payment proof images. Resend sends email on send/approve. Socket.IO broadcasts changes. `useFeatureFlag('invoice-portal')` guards user sidebar link and route.

**Tech Stack:** Express 5, Mongoose, Multer + Cloudinary (`resource_type: 'auto'`), Resend SDK, React 18 + TypeScript, shadcn/ui, Framer Motion, Sonner, `useDataRealtime`.

**Prerequisite:** Plan 1 (Feature Flags) must be complete — `useFeatureFlag` hook must exist.

---

## File Map

| Action | File |
|---|---|
| Create | `server/src/models/usersModels/Invoice.model.js` |
| Create | `server/src/controllers/usersControllers/invoice.controller.js` |
| Create | `server/src/routes/userRoutes/invoice.route.js` |
| Create | `server/email-templates/5-invoice-sent.html` |
| Create | `server/email-templates/6-payment-received.html` |
| Create | `server/email-templates/7-payment-proof-uploaded.html` |
| Modify | `server/src/utils/sendEmails.js` — add 3 send functions |
| Modify | `server/src/app.js` — mount `/api/v1/invoices` |
| Create | `client/src/api/invoices.api.ts` |
| Create | `client/src/pages/admin/InvoiceManager.tsx` |
| Create | `client/src/pages/user/UserInvoices.tsx` |
| Modify | `client/src/layouts/AdminLayout.tsx` — add sidebar link |
| Modify | `client/src/layouts/UserLayout.tsx` — add sidebar link (guarded) |
| Modify | `client/src/components/DashboardSearch.tsx` — add entries |
| Modify | `client/src/App.tsx` — add routes |

---

### Task 1: Invoice Mongoose Model

**Files:**
- Create: `server/src/models/usersModels/Invoice.model.js`

- [ ] **Step 1: Create model**

```js
import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  quantity:    { type: Number, required: true, min: 0 },
  unitPrice:   { type: Number, required: true, min: 0 },
  total:       { type: Number, required: true, min: 0 },
}, { _id: false });

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      // auto-generated in pre-save: INV-202604-001
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    client:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    items:     { type: [invoiceItemSchema], default: [] },
    subtotal:  { type: Number, default: 0 },
    taxRate:   { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue"],
      default: "draft",
      index: true,
    },
    dueDate: { type: Date },
    paidAt:  { type: Date },

    notes:          { type: String, trim: true, default: "" },
    pdfUrl:         { type: String, default: "" },

    paymentProofUrl:    { type: String, default: "" },
    paymentProofStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Auto-generate invoice number before first save
invoiceSchema.pre("save", async function (next) {
  if (this.isNew) {
    const now = new Date();
    const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const count = await mongoose.model("Invoice").countDocuments({
      invoiceNumber: { $regex: `^${prefix}` },
    });
    this.invoiceNumber = `${prefix}-${String(count + 1).padStart(3, "0")}`;
  }

  // Recalculate totals
  this.subtotal   = this.items.reduce((sum, item) => sum + item.total, 0);
  this.taxAmount  = +(this.subtotal * (this.taxRate / 100)).toFixed(2);
  this.totalAmount = +(this.subtotal + this.taxAmount).toFixed(2);

  next();
});

export default mongoose.model("Invoice", invoiceSchema);
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/usersModels/Invoice.model.js
git commit -m "feat: add Invoice model with auto invoice number and totals"
```

---

### Task 2: Email Templates (3 files)

**Files:**
- Create: `server/email-templates/5-invoice-sent.html`
- Create: `server/email-templates/6-payment-received.html`
- Create: `server/email-templates/7-payment-proof-uploaded.html`

- [ ] **Step 1: Create invoice-sent template**

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>New Invoice</title></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1030;border-radius:12px;overflow:hidden;border:1px solid #2d1f5e;">
        <tr><td style="background:#7c3aed;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:20px;">New Invoice</h1>
          <p style="color:#e0d0ff;margin:4px 0 0;font-size:14px;">{{INVOICE_NUMBER}}</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#c4b5fd;margin:0 0 16px;">Hi {{NAME}},</p>
          <p style="color:#9ca3af;margin:0 0 24px;">You have a new invoice from us. Please review and complete the payment by the due date.</p>
          <table width="100%" cellpadding="12" cellspacing="0" style="background:#0f0a1e;border-radius:8px;margin-bottom:24px;">
            <tr>
              <td style="color:#9ca3af;font-size:14px;">Amount Due</td>
              <td align="right" style="color:#fff;font-size:20px;font-weight:bold;">{{AMOUNT}}</td>
            </tr>
            <tr>
              <td style="color:#9ca3af;font-size:14px;border-top:1px solid #2d1f5e;">Due Date</td>
              <td align="right" style="color:#c4b5fd;font-size:14px;border-top:1px solid #2d1f5e;">{{DUE_DATE}}</td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="{{CLIENT_URL}}/user-dashboard/invoices" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 32px;border-radius:9999px;text-decoration:none;font-weight:600;">View Invoice</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #2d1f5e;">
          <p style="color:#6b7280;font-size:12px;margin:0;text-align:center;">You received this because you are a client of our agency.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

- [ ] **Step 2: Create payment-received template**

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Payment Confirmed</title></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1030;border-radius:12px;overflow:hidden;border:1px solid #2d1f5e;">
        <tr><td style="background:#059669;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Payment Confirmed</h1>
          <p style="color:#a7f3d0;margin:4px 0 0;font-size:14px;">{{INVOICE_NUMBER}}</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#c4b5fd;margin:0 0 16px;">Hi {{NAME}},</p>
          <p style="color:#9ca3af;margin:0 0 24px;">Your payment has been confirmed. Thank you!</p>
          <table width="100%" cellpadding="12" cellspacing="0" style="background:#0f0a1e;border-radius:8px;margin-bottom:24px;">
            <tr>
              <td style="color:#9ca3af;font-size:14px;">Amount Paid</td>
              <td align="right" style="color:#fff;font-size:20px;font-weight:bold;">{{AMOUNT}}</td>
            </tr>
            <tr>
              <td style="color:#9ca3af;font-size:14px;border-top:1px solid #2d1f5e;">Paid On</td>
              <td align="right" style="color:#a7f3d0;font-size:14px;border-top:1px solid #2d1f5e;">{{PAID_AT}}</td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

- [ ] **Step 3: Create payment-proof-uploaded template**

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Payment Proof Received</title></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1030;border-radius:12px;overflow:hidden;border:1px solid #2d1f5e;">
        <tr><td style="background:#7c3aed;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Payment Proof Received</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#9ca3af;margin:0 0 16px;"><strong style="color:#c4b5fd;">{{CLIENT_NAME}}</strong> uploaded payment proof for invoice <strong style="color:#c4b5fd;">{{INVOICE_NUMBER}}</strong>.</p>
          <p style="color:#9ca3af;margin:0 0 24px;">Please review and approve or reject the payment.</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="{{ADMIN_URL}}/admin/invoices" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 32px;border-radius:9999px;text-decoration:none;font-weight:600;">Review Payment</a>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

- [ ] **Step 4: Commit**

```bash
git add server/email-templates/5-invoice-sent.html server/email-templates/6-payment-received.html server/email-templates/7-payment-proof-uploaded.html
git commit -m "feat: add invoice email templates"
```

---

### Task 3: Send Email Functions

**Files:**
- Modify: `server/src/utils/sendEmails.js` — add 3 functions at end of file

- [ ] **Step 1: Add functions to sendEmails.js**

Open `server/src/utils/sendEmails.js`. At the bottom, before any `export` statements, add:

```js
export const sendInvoiceSentEmail = async ({ to, name, invoiceNumber, amount, dueDate, clientUrl }) => {
  const html = renderTemplate("5-invoice-sent.html", {
    NAME: name,
    INVOICE_NUMBER: invoiceNumber,
    AMOUNT: amount,
    DUE_DATE: dueDate,
    CLIENT_URL: clientUrl,
  });
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Invoice ${invoiceNumber} — Payment Due`,
    html,
  });
};

export const sendPaymentConfirmationEmail = async ({ to, name, invoiceNumber, amount, paidAt }) => {
  const html = renderTemplate("6-payment-received.html", {
    NAME: name,
    INVOICE_NUMBER: invoiceNumber,
    AMOUNT: amount,
    PAID_AT: paidAt,
  });
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Payment Confirmed — ${invoiceNumber}`,
    html,
  });
};

export const sendPaymentProofAdminEmail = async ({ to, clientName, invoiceNumber, adminUrl }) => {
  const html = renderTemplate("7-payment-proof-uploaded.html", {
    CLIENT_NAME: clientName,
    INVOICE_NUMBER: invoiceNumber,
    ADMIN_URL: adminUrl,
  });
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Payment Proof Received — ${invoiceNumber}`,
    html,
  });
};
```

Note: `FROM` and `renderTemplate` are already defined in the file — do NOT redefine them.

- [ ] **Step 2: Commit**

```bash
git add server/src/utils/sendEmails.js
git commit -m "feat: add invoice and payment email send functions"
```

---

### Task 4: Invoice Controller

**Files:**
- Create: `server/src/controllers/usersControllers/invoice.controller.js`

- [ ] **Step 1: Create controller**

```js
import Invoice from "../../models/usersModels/Invoice.model.js";
import User from "../../models/usersModels/User.model.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import { emitDataUpdate } from "../../utils/dataUpdateService.js";
import { createAndEmitNotification } from "../../utils/notificationService.js";
import {
  sendInvoiceSentEmail,
  sendPaymentConfirmationEmail,
  sendPaymentProofAdminEmail,
} from "../../utils/sendEmails.js";
import { uploadFile } from "../../middlewares/Cloudinary.js";
import fs from "fs";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.RESEND_FROM || "";

// GET /api/v1/invoices  (admin)
export const getAllInvoices = asyncHandler(async (req, res) => {
  const { status, client, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (client) filter.client = client;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate("client", "name email avatar")
      .populate("project", "projectName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Invoice.countDocuments(filter),
  ]);

  return successResponse(res, 200, "Invoices fetched", {
    invoices,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/v1/invoices/stats  (admin)
export const getInvoiceStats = asyncHandler(async (req, res) => {
  const [total, pending, overdue, paidThisMonth] = await Promise.all([
    Invoice.aggregate([{ $group: { _id: null, amount: { $sum: "$totalAmount" } } }]),
    Invoice.aggregate([{ $match: { status: { $in: ["draft", "sent"] } } }, { $group: { _id: null, amount: { $sum: "$totalAmount" } } }]),
    Invoice.aggregate([{ $match: { status: "overdue" } }, { $group: { _id: null, amount: { $sum: "$totalAmount" } } }]),
    Invoice.aggregate([
      { $match: { status: "paid", paidAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
      { $group: { _id: null, amount: { $sum: "$totalAmount" } } },
    ]),
  ]);

  return successResponse(res, 200, "Invoice stats", {
    totalRevenue:     total[0]?.amount || 0,
    pendingAmount:    pending[0]?.amount || 0,
    overdueAmount:    overdue[0]?.amount || 0,
    paidThisMonth:   paidThisMonth[0]?.amount || 0,
  });
});

// GET /api/v1/invoices/my  (user/client)
export const getMyInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ client: req.user._id, status: { $ne: "draft" } })
    .populate("project", "projectName")
    .sort({ createdAt: -1 });
  return successResponse(res, 200, "My invoices", invoices);
});

// GET /api/v1/invoices/:id  (admin | owner)
export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("client", "name email avatar")
    .populate("project", "projectName");
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (req.user.role !== "admin" && invoice.client._id.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized", 403);
  }
  return successResponse(res, 200, "Invoice fetched", invoice);
});

// POST /api/v1/invoices  (admin)
export const createInvoice = asyncHandler(async (req, res) => {
  const { client, project, items, taxRate, dueDate, notes } = req.body;
  const invoice = await Invoice.create({
    client, project, items, taxRate, dueDate, notes,
    createdBy: req.user._id,
  });
  emitDataUpdate(req.io, "invoices", ["admin:global"]);
  return successResponse(res, 201, "Invoice created", invoice);
});

// PUT /api/v1/invoices/:id  (admin)
export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.status === "paid") throw new AppError("Cannot edit a paid invoice", 400);

  const { items, taxRate, dueDate, notes, status } = req.body;
  if (items)   invoice.items   = items;
  if (taxRate !== undefined) invoice.taxRate = taxRate;
  if (dueDate) invoice.dueDate = dueDate;
  if (notes !== undefined)   invoice.notes   = notes;
  if (status && ["draft", "overdue"].includes(status)) invoice.status = status;

  await invoice.save();
  emitDataUpdate(req.io, "invoices", ["admin:global"]);
  return successResponse(res, 200, "Invoice updated", invoice);
});

// POST /api/v1/invoices/:id/send  (admin)
export const sendInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate("client", "name email");
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.status === "paid") throw new AppError("Invoice already paid", 400);

  invoice.status = "sent";
  await invoice.save();

  await Promise.allSettled([
    sendInvoiceSentEmail({
      to: invoice.client.email,
      name: invoice.client.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: `$${invoice.totalAmount.toFixed(2)}`,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A",
      clientUrl: CLIENT_URL,
    }),
    createAndEmitNotification(req.io, {
      recipient: invoice.client._id,
      type: "invoice_sent",
      title: "New Invoice",
      message: `Invoice ${invoice.invoiceNumber} for $${invoice.totalAmount.toFixed(2)} has been sent.`,
      link: "/user-dashboard/invoices",
    }),
  ]);

  emitDataUpdate(req.io, "invoices", [`user:${invoice.client._id}`, "admin:global"]);
  return successResponse(res, 200, "Invoice sent", invoice);
});

// POST /api/v1/invoices/:id/mark-paid  (admin)
export const markInvoicePaid = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate("client", "name email");
  if (!invoice) throw new AppError("Invoice not found", 404);

  invoice.status = "paid";
  invoice.paidAt = new Date();
  invoice.paymentProofStatus = "approved";
  await invoice.save();

  await Promise.allSettled([
    sendPaymentConfirmationEmail({
      to: invoice.client.email,
      name: invoice.client.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: `$${invoice.totalAmount.toFixed(2)}`,
      paidAt: new Date().toLocaleDateString(),
    }),
    createAndEmitNotification(req.io, {
      recipient: invoice.client._id,
      type: "payment_approved",
      title: "Payment Confirmed",
      message: `Your payment for invoice ${invoice.invoiceNumber} has been confirmed.`,
      link: "/user-dashboard/invoices",
    }),
  ]);

  emitDataUpdate(req.io, "invoices", [`user:${invoice.client._id}`, "admin:global"]);
  return successResponse(res, 200, "Invoice marked as paid", invoice);
});

// POST /api/v1/invoices/:id/upload-proof  (user/client) — multipart/form-data
export const uploadPaymentProof = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate("client", "name email");
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.client._id.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  if (!req.file) throw new AppError("No file uploaded", 400);

  const result = await uploadFile(req.file.path, "payment-proofs");
  if (req.file.path) fs.unlink(req.file.path, () => {});

  invoice.paymentProofUrl    = result.secure_url;
  invoice.paymentProofStatus = "pending";
  await invoice.save();

  const adminUsers = await User.find({ role: "admin" }).select("email name");
  await Promise.allSettled(
    adminUsers.map(admin =>
      sendPaymentProofAdminEmail({
        to: admin.email,
        clientName: invoice.client.name,
        invoiceNumber: invoice.invoiceNumber,
        adminUrl: CLIENT_URL,
      })
    )
  );

  emitDataUpdate(req.io, "invoices", ["admin:global"]);
  return successResponse(res, 200, "Payment proof uploaded", invoice);
});

// PUT /api/v1/invoices/:id/proof-status  (admin)
export const updateProofStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // "approved" | "rejected"
  if (!["approved", "rejected"].includes(status)) throw new AppError("Invalid status", 400);

  const invoice = await Invoice.findById(req.params.id).populate("client", "name email");
  if (!invoice) throw new AppError("Invoice not found", 404);

  invoice.paymentProofStatus = status;
  if (status === "approved") {
    invoice.status = "paid";
    invoice.paidAt = new Date();
    await Promise.allSettled([
      sendPaymentConfirmationEmail({
        to: invoice.client.email,
        name: invoice.client.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: `$${invoice.totalAmount.toFixed(2)}`,
        paidAt: new Date().toLocaleDateString(),
      }),
      createAndEmitNotification(req.io, {
        recipient: invoice.client._id,
        type: "payment_approved",
        title: "Payment Confirmed",
        message: `Your payment proof for invoice ${invoice.invoiceNumber} was approved.`,
        link: "/user-dashboard/invoices",
      }),
    ]);
  }
  await invoice.save();

  emitDataUpdate(req.io, "invoices", [`user:${invoice.client._id}`, "admin:global"]);
  return successResponse(res, 200, `Payment proof ${status}`, invoice);
});

// DELETE /api/v1/invoices/:id  (admin — draft only)
export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.status !== "draft") throw new AppError("Only draft invoices can be deleted", 400);
  await invoice.deleteOne();
  emitDataUpdate(req.io, "invoices", ["admin:global"]);
  return successResponse(res, 200, "Invoice deleted");
});
```

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/usersControllers/invoice.controller.js
git commit -m "feat: add invoice controller (CRUD, send, mark-paid, upload-proof)"
```

---

### Task 5: Invoice Route + App Mount

**Files:**
- Create: `server/src/routes/userRoutes/invoice.route.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: Create route file**

```js
import express from "express";
import multer from "multer";
import path from "path";
import {
  getAllInvoices, getInvoiceStats, getMyInvoices, getInvoiceById,
  createInvoice, updateInvoice, sendInvoice, markInvoicePaid,
  uploadPaymentProof, updateProofStatus, deleteInvoice,
} from "../../controllers/usersControllers/invoice.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import { mutationLimiter } from "../../middlewares/rateLimiter.js";
import { mongoIdParam, validate } from "../../middlewares/validate.js";

const upload = multer({
  dest: "src/public/uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.test(ext));
  },
});

const router = express.Router();

// Admin — stats and list (before /:id)
router.get("/stats", userAuthenticated, authorizeRoles("admin"), getInvoiceStats);
router.get("/",      userAuthenticated, authorizeRoles("admin"), getAllInvoices);

// User/client
router.get("/my",    userAuthenticated, getMyInvoices);

// Shared — detail (owner or admin)
router.get("/:id",   userAuthenticated, validate([mongoIdParam("id")]), getInvoiceById);

// Admin mutations
router.post("/",               userAuthenticated, authorizeRoles("admin"), mutationLimiter, createInvoice);
router.put("/:id",             userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), updateInvoice);
router.post("/:id/send",       userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), sendInvoice);
router.post("/:id/mark-paid",  userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), markInvoicePaid);
router.put("/:id/proof-status",userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), updateProofStatus);
router.delete("/:id",          userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), deleteInvoice);

// Client mutation
router.post("/:id/upload-proof", userAuthenticated, mutationLimiter, validate([mongoIdParam("id")]),
  upload.single("proof"), uploadPaymentProof);

export default router;
```

- [ ] **Step 2: Mount in app.js**

Add import:
```js
import invoiceRoutes from "./routes/userRoutes/invoice.route.js";
```

Add mount (before `app.use(notFound)`):
```js
app.use("/api/v1/invoices", invoiceRoutes);    // Invoice & payment portal
```

- [ ] **Step 3: Test routes exist**

```bash
cd server && npm run dev
curl http://localhost:8000/api/v1/invoices -H "Authorization: Bearer <admin_token>"
# Expected: { data: { invoices: [], pagination: {...} } }
```

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/userRoutes/invoice.route.js server/src/app.js
git commit -m "feat: mount invoice routes"
```

---

### Task 6: Frontend API Client

**Files:**
- Create: `client/src/api/invoices.api.ts`

- [ ] **Step 1: Create API client**

```ts
import apiClient from './apiClient';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  project?: { _id: string; projectName: string };
  client: { _id: string; name: string; email: string; avatar?: string };
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate?: string;
  paidAt?: string;
  notes: string;
  pdfUrl: string;
  paymentProofUrl: string;
  paymentProofStatus: 'none' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface InvoiceStats {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  paidThisMonth: number;
}

export const invoicesApi = {
  getAll:         (params?: Record<string, any>) => apiClient.get('/invoices', { params }),
  getStats:       ()                              => apiClient.get<InvoiceStats>('/invoices/stats'),
  getMy:          ()                              => apiClient.get<Invoice[]>('/invoices/my'),
  getById:        (id: string)                    => apiClient.get<Invoice>(`/invoices/${id}`),
  create:         (data: Partial<Invoice> & { items: InvoiceItem[] }) => apiClient.post('/invoices', data),
  update:         (id: string, data: any)         => apiClient.put(`/invoices/${id}`, data),
  send:           (id: string)                    => apiClient.post(`/invoices/${id}/send`),
  markPaid:       (id: string)                    => apiClient.post(`/invoices/${id}/mark-paid`),
  uploadProof:    (id: string, file: File)        => {
    const fd = new FormData();
    fd.append('proof', file);
    return apiClient.post(`/invoices/${id}/upload-proof`, fd);
  },
  updateProofStatus: (id: string, status: 'approved' | 'rejected') =>
    apiClient.put(`/invoices/${id}/proof-status`, { status }),
  delete:         (id: string)                    => apiClient.delete(`/invoices/${id}`),
};
```

- [ ] **Step 2: Commit**

```bash
git add client/src/api/invoices.api.ts
git commit -m "feat: add invoices API client"
```

---

### Task 7: Admin Invoice Manager Page

**Files:**
- Create: `client/src/pages/admin/InvoiceManager.tsx`

- [ ] **Step 1: Create admin page** (summary — full implementation below)

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Send, CheckCircle, DollarSign, AlertCircle,
  Loader2, Trash2, Eye, ExternalLink, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { toast } from 'sonner';
import { invoicesApi, Invoice, InvoiceStats, InvoiceItem } from '../../api/invoices.api';
import { useDataRealtime } from '../../hooks/useDataRealtime';

const STATUS_COLORS: Record<string, string> = {
  draft:   'bg-white/10 text-white/60 border-white/10',
  sent:    'bg-blue-500/20 text-blue-300 border-blue-500/30',
  paid:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  overdue: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const PROOF_COLORS: Record<string, string> = {
  none:     '',
  pending:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
};

interface CreateForm {
  clientId: string;
  items: InvoiceItem[];
  taxRate: number;
  dueDate: string;
  notes: string;
}

const emptyForm = (): CreateForm => ({
  clientId: '',
  items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
  taxRate: 0,
  dueDate: '',
  notes: '',
});

export default function InvoiceManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);

  const load = useCallback(async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const [invRes, statsRes] = await Promise.all([
        invoicesApi.getAll(params),
        invoicesApi.getStats(),
      ]);
      setInvoices(invRes.data.data?.invoices ?? []);
      setStats(statsRes.data.data ?? statsRes.data);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);
  useDataRealtime('invoices', load);

  const updateItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      items[idx].total = +(items[idx].quantity * items[idx].unitPrice).toFixed(2);
      return { ...prev, items };
    });
  };

  const handleCreate = async () => {
    if (!form.clientId || form.items.some(i => !i.description)) {
      toast.error('Client and item descriptions are required');
      return;
    }
    setSaving(true);
    try {
      await invoicesApi.create({
        client: form.clientId as any,
        items: form.items,
        taxRate: form.taxRate,
        dueDate: form.dueDate || undefined,
        notes: form.notes,
      } as any);
      toast.success('Invoice created');
      setShowCreate(false);
      setForm(emptyForm());
      load();
    } catch {
      toast.error('Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (inv: Invoice) => {
    if (!confirm(`Send invoice ${inv.invoiceNumber} to ${inv.client.name}?`)) return;
    try {
      await invoicesApi.send(inv._id);
      toast.success('Invoice sent');
      load();
    } catch { toast.error('Failed to send'); }
  };

  const handleMarkPaid = async (inv: Invoice) => {
    if (!confirm(`Mark invoice ${inv.invoiceNumber} as paid?`)) return;
    try {
      await invoicesApi.markPaid(inv._id);
      toast.success('Invoice marked as paid');
      load();
    } catch { toast.error('Failed to update'); }
  };

  const handleProofStatus = async (inv: Invoice, status: 'approved' | 'rejected') => {
    try {
      await invoicesApi.updateProofStatus(inv._id, status);
      toast.success(`Payment proof ${status}`);
      setSelected(null);
      load();
    } catch { toast.error('Failed to update proof status'); }
  };

  const handleDelete = async (inv: Invoice) => {
    if (!confirm(`Delete invoice ${inv.invoiceNumber}?`)) return;
    try {
      await invoicesApi.delete(inv._id);
      toast.success('Invoice deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white">Invoice Manager</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} className="border-white/10 text-white/70 hover:bg-white/5">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" /> New Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400' },
            { label: 'Pending', value: `$${stats.pendingAmount.toFixed(2)}`, icon: AlertCircle, color: 'text-amber-400' },
            { label: 'Overdue', value: `$${stats.overdueAmount.toFixed(2)}`, icon: AlertCircle, color: 'text-red-400' },
            { label: 'Paid This Month', value: `$${stats.paidThisMonth.toFixed(2)}`, icon: CheckCircle, color: 'text-blue-400' },
          ].map(s => (
            <Card key={s.label} className="bg-white/5 border-white/10">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <div>
                  <p className="text-xs text-white/50">{s.label}</p>
                  <p className="text-lg font-bold text-white">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['', 'draft', 'sent', 'paid', 'overdue'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs border transition-all
              ${statusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {invoices.length === 0 && (
          <p className="text-center text-white/40 py-12">No invoices found</p>
        )}
        {invoices.map(inv => (
          <motion.div key={inv._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm text-white/70">{inv.invoiceNumber}</span>
                    <span className="font-medium text-white truncate">{inv.client.name}</span>
                    <Badge className={`text-xs border ${STATUS_COLORS[inv.status]}`}>{inv.status}</Badge>
                    {inv.paymentProofStatus !== 'none' && (
                      <Badge className={`text-xs border ${PROOF_COLORS[inv.paymentProofStatus]}`}>
                        proof: {inv.paymentProofStatus}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
                    <span className="font-bold text-white">${inv.totalAmount.toFixed(2)}</span>
                    {inv.dueDate && <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(inv)} className="text-white/50 hover:text-white">
                    <Eye className="w-4 h-4" />
                  </Button>
                  {inv.status === 'draft' && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleSend(inv)} className="text-blue-400 hover:text-blue-300">
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(inv)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {inv.status === 'sent' && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(inv)} className="text-emerald-400 hover:text-emerald-300">
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                  {inv.paymentProofStatus === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => handleProofStatus(inv, 'approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7">
                        Approve Proof
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleProofStatus(inv, 'rejected')} className="border-red-500/30 text-red-400 text-xs h-7">
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-[#1a1030] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-white/50">Client</div>
                <div className="text-white">{selected.client.name}</div>
                <div className="text-white/50">Status</div>
                <Badge className={`text-xs border w-fit ${STATUS_COLORS[selected.status]}`}>{selected.status}</Badge>
                <div className="text-white/50">Total</div>
                <div className="text-white font-bold">${selected.totalAmount.toFixed(2)}</div>
                {selected.dueDate && (
                  <>
                    <div className="text-white/50">Due</div>
                    <div className="text-white">{new Date(selected.dueDate).toLocaleDateString()}</div>
                  </>
                )}
              </div>
              {selected.paymentProofUrl && (
                <div>
                  <p className="text-xs text-white/50 mb-2">Payment Proof</p>
                  <a href={selected.paymentProofUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary text-sm hover:underline">
                    View Proof <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {selected.notes && (
                <div>
                  <p className="text-xs text-white/50 mb-1">Notes</p>
                  <p className="text-sm text-white/70">{selected.notes}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-white/50 mb-2">Items</p>
                {selected.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-white/5">
                    <span className="text-white/70">{item.description} × {item.quantity}</span>
                    <span className="text-white">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); if (!v) setForm(emptyForm()); }}>
        <DialogContent className="bg-[#1a1030] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70 text-xs mb-1 block">Client User ID</Label>
              <Input
                value={form.clientId}
                onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}
                placeholder="MongoDB ObjectId of the client user"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs mb-1 block">Items</Label>
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                  <Input
                    className="bg-white/5 border-white/10 text-white text-xs col-span-3"
                    placeholder="Description"
                    value={item.description}
                    onChange={e => updateItem(idx, 'description', e.target.value)}
                  />
                  <Input type="number" className="bg-white/5 border-white/10 text-white text-xs" placeholder="Qty"
                    value={item.quantity} onChange={e => updateItem(idx, 'quantity', +e.target.value)} min={1} />
                  <Input type="number" className="bg-white/5 border-white/10 text-white text-xs" placeholder="Unit Price"
                    value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', +e.target.value)} min={0} step={0.01} />
                  <div className="flex items-center text-xs text-white/50 justify-end">
                    ${item.total.toFixed(2)}
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setForm(p => ({
                ...p, items: [...p.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
              }))} className="border-white/10 text-white/50 text-xs">
                + Add Item
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Tax Rate (%)</Label>
                <Input type="number" value={form.taxRate} min={0} max={100}
                  onChange={e => setForm(p => ({ ...p, taxRate: +e.target.value }))}
                  className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Due Date</Label>
                <Input type="date" value={form.dueDate}
                  onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-white/70 text-xs mb-1 block">Notes</Label>
              <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="bg-white/5 border-white/10 text-white" placeholder="Optional notes for the client" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/10 text-white/70">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Invoice'}
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
git add client/src/pages/admin/InvoiceManager.tsx
git commit -m "feat: add admin InvoiceManager page"
```

---

### Task 8: User Invoices Page

**Files:**
- Create: `client/src/pages/user/UserInvoices.tsx`

- [ ] **Step 1: Create user page**

```tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, ExternalLink, CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { invoicesApi, Invoice } from '../../api/invoices.api';
import { useDataRealtime } from '../../hooks/useDataRealtime';

const STATUS_COLORS: Record<string, string> = {
  sent:    'bg-blue-500/20 text-blue-300 border-blue-500/30',
  paid:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  overdue: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  sent:    Clock,
  paid:    CheckCircle,
  overdue: AlertCircle,
};

export default function UserInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await invoicesApi.getMy();
      setInvoices(res.data.data ?? res.data);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useDataRealtime('invoices', load);

  const handleUploadClick = (invoiceId: string) => {
    uploadTargetRef.current = invoiceId;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = uploadTargetRef.current;
    if (!file || !id) return;
    setUploading(id);
    try {
      await invoicesApi.uploadProof(id, file);
      toast.success('Payment proof uploaded — admin will review shortly');
      load();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      uploadTargetRef.current = null;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-sm text-white/50">View and pay your invoices</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {invoices.length === 0 && (
        <p className="text-center text-white/40 py-16">No invoices yet</p>
      )}

      <div className="space-y-4">
        {invoices.map(inv => {
          const Icon = STATUS_ICONS[inv.status] ?? Clock;
          return (
            <motion.div key={inv._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-sm text-white/50">{inv.invoiceNumber}</span>
                        <Badge className={`text-xs border ${STATUS_COLORS[inv.status] ?? 'bg-white/10 text-white/50 border-white/10'}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {inv.status}
                        </Badge>
                        {inv.paymentProofStatus === 'pending' && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                            Proof Under Review
                          </Badge>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-white">${inv.totalAmount.toFixed(2)}</p>
                      {inv.dueDate && (
                        <p className={`text-sm mt-1 ${inv.status === 'overdue' ? 'text-red-400' : 'text-white/50'}`}>
                          Due: {new Date(inv.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      {inv.paidAt && (
                        <p className="text-sm text-emerald-400 mt-1">
                          Paid: {new Date(inv.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {inv.pdfUrl && (
                        <a href={inv.pdfUrl} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:bg-white/5 w-full">
                            <ExternalLink className="w-3.5 h-3.5 mr-1" /> View PDF
                          </Button>
                        </a>
                      )}
                      {inv.status !== 'paid' && inv.paymentProofStatus !== 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleUploadClick(inv._id)}
                          disabled={uploading === inv._id}
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          {uploading === inv._id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <><Upload className="w-3.5 h-3.5 mr-1" /> Upload Proof</>
                          }
                        </Button>
                      )}
                    </div>
                  </div>

                  {inv.items.length > 0 && (
                    <div className="mt-4 space-y-1">
                      {inv.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm text-white/50">
                          <span>{item.description} × {item.quantity}</span>
                          <span>${item.total.toFixed(2)}</span>
                        </div>
                      ))}
                      {inv.taxAmount > 0 && (
                        <div className="flex justify-between text-sm text-white/50 border-t border-white/5 pt-1">
                          <span>Tax ({inv.taxRate}%)</span>
                          <span>${inv.taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {inv.notes && (
                    <p className="mt-3 text-sm text-white/40 italic">{inv.notes}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/user/UserInvoices.tsx
git commit -m "feat: add user UserInvoices page with proof upload"
```

---

### Task 9: Wire Routes, Sidebars, DashboardSearch

**Files:**
- Modify: `client/src/App.tsx` — add admin and user routes
- Modify: Admin sidebar — add Invoice Manager link
- Modify: User sidebar — add Invoices link (guarded by `useFeatureFlag('invoice-portal')`)
- Modify: `client/src/components/DashboardSearch.tsx` — add entries

- [ ] **Step 1: Add routes in App.tsx**

In admin routes section:
```tsx
import InvoiceManager from '../pages/admin/InvoiceManager';
// ...
<Route path="invoices" element={<InvoiceManager />} />
```

In user routes section:
```tsx
import UserInvoices from '../pages/user/UserInvoices';
// ...
<Route path="invoices" element={<UserInvoices />} />
```

- [ ] **Step 2: Admin sidebar link**

In admin DEFAULT_LINKS:
```tsx
{ label: 'Invoice Manager', path: '/admin/invoices', icon: FileText }
```

- [ ] **Step 3: User sidebar link with feature flag guard**

In user sidebar component, import hook and filter:
```tsx
import { useFeatureFlag } from '../hooks/useFeatureFlag';
// inside component:
const invoiceEnabled = useFeatureFlag('invoice-portal');
// In the links array or filter step:
{ label: 'Invoices', path: '/user-dashboard/invoices', icon: FileText, hidden: !invoiceEnabled }
// Filter out hidden links when rendering
```

- [ ] **Step 4: DashboardSearch entries**

In `ADMIN_ITEMS`:
```tsx
{ id: 'a-invoices', label: 'Invoice Manager', description: 'Create and manage client invoices, track payments', path: '/admin/invoices', icon: FileText, group: 'Pages', keywords: ['invoice', 'payment', 'billing', 'receipt'] },
```

In `USER_ITEMS`:
```tsx
{ id: 'u-invoices', label: 'My Invoices', description: 'View invoices and upload payment proof', path: '/user-dashboard/invoices', icon: FileText, group: 'Pages', keywords: ['invoice', 'payment', 'bill'] },
```

- [ ] **Step 5: Commit**

```bash
git add client/src/App.tsx client/src/layouts/AdminLayout.tsx client/src/layouts/UserLayout.tsx client/src/components/DashboardSearch.tsx
git commit -m "feat: wire invoice routes, sidebar links, and dashboard search"
```

---

## Self-Review Checklist

- [x] Invoice number auto-generated in pre-save hook — INV-YYYYMM-NNN format
- [x] Totals (subtotal, taxAmount, totalAmount) recalculated on every save — no stale values
- [x] `/stats` and `/my` declared before `/:id` route — no Express param conflict
- [x] `resource_type: 'auto'` used for Cloudinary upload via existing `uploadFile()` helper
- [x] All email sends wrapped in `Promise.allSettled` — invoice ops succeed even if email fails
- [x] `emitDataUpdate` fires on every mutation to correct rooms
- [x] `useFeatureFlag('invoice-portal')` guards user sidebar link
- [x] File size limit 10MB on proof upload
- [x] Admin can only delete `draft` invoices — prevents deleting sent/paid records
