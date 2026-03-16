/**
 * Invoice model – billing records for the User Dashboard Billing tab.
 *
 * The User Dashboard shows:
 *  - Payment methods (credit/debit cards)
 *  - Billing history (Invoice #INV-001, amount, status)
 *
 * Invoices are linked to a client user and optionally to a Project.
 *
 * Endpoints:
 *  - POST   /api/v1/invoices              – create invoice (admin)
 *  - GET    /api/v1/invoices              – list all invoices (admin)
 *  - GET    /api/v1/invoices/my           – client's own invoices (auth user)
 *  - GET    /api/v1/invoices/stats        – revenue statistics (admin)
 *  - GET    /api/v1/invoices/:id          – get single invoice
 *  - PATCH  /api/v1/invoices/:id          – update invoice (admin)
 *  - PATCH  /api/v1/invoices/:id/status   – mark paid / void (admin)
 *  - DELETE /api/v1/invoices/:id          – delete invoice (admin)
 */
import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: [300, "Item description cannot exceed 300 characters"],
        },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        // Calculated: quantity * unitPrice
        total: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const invoiceSchema = new mongoose.Schema(
    {
        // Auto-generated invoice number: INV-YYYY-NNNN
        invoiceNumber: {
            type: String,
            unique: true,
            trim: true,
            index: true,
        },

        // The client (user) this invoice is billed to
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Optional project association
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            index: true,
        },

        // Line items
        items: [invoiceItemSchema],

        // Computed totals (in USD cents or plain number)
        subtotal: { type: Number, required: true, min: 0 },
        taxRate: { type: Number, default: 0, min: 0, max: 100 }, // percentage
        taxAmount: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 },

        // Payment tracking
        status: {
            type: String,
            enum: ["draft", "sent", "paid", "overdue", "void"],
            default: "draft",
            index: true,
        },

        paidAt: { type: Date },
        paidAmount: { type: Number, default: 0, min: 0 },

        dueDate: {
            type: Date,
            required: [true, "Due date is required"],
        },

        // Payment method info (last 4 digits only, never full card number)
        paymentMethod: {
            type: String,
            trim: true, // e.g. "Visa ending in 4242"
        },

        notes: {
            type: String,
            trim: true,
            maxlength: [500, "Notes cannot exceed 500 characters"],
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Virtual: amount still outstanding
invoiceSchema.virtual("dueAmount").get(function () {
    return Math.max(0, this.total - this.paidAmount);
});

// Virtual: is overdue?
invoiceSchema.virtual("isOverdue").get(function () {
    if (this.status === "paid" || this.status === "void") return false;
    return this.dueDate && new Date() > this.dueDate;
});

// Auto-generate invoice number before first save
invoiceSchema.pre("save", async function () {
    if (!this.invoiceNumber) {
        const year = new Date().getFullYear();
        const count = await this.constructor.countDocuments({
            invoiceNumber: { $regex: `^INV-${year}-` },
        });
        this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;
    }
});

// Auto-set paidAt when status becomes 'paid'
invoiceSchema.pre("save", async function () {
    if (this.isModified("status") && this.status === "paid" && !this.paidAt) {
        this.paidAt = new Date();
        if (!this.paidAmount) this.paidAmount = this.total;
    }
});

invoiceSchema.index({ client: 1, status: 1, createdAt: -1 });

const Invoice =
    mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export default Invoice;
