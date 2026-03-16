/**
 * Invoice controller – billing management for User Dashboard and Admin.
 *
 * Handles invoice creation, listing, status changes, and revenue statistics.
 * Clients see their own invoices; admins see all.
 */
import asyncHandler from "../../middlewares/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import Invoice from "../../models/usersModels/Invoice.model.js";
import Notification from "../../models/usersModels/Notification.model.js";

// ─── Create Invoice ───────────────────────────────────────────────────────────

/**
 * POST /api/v1/invoices
 * Admin creates an invoice for a client.
 * Body: { client, project?, items[], taxRate?, dueDate, paymentMethod?, notes? }
 */
export const createInvoice = asyncHandler(async (req, res) => {
    const { client, project, items, taxRate = 0, dueDate, paymentMethod, notes } = req.body;

    if (!client) throw new AppError("Client (user ID) is required", 400);
    if (!items?.length) throw new AppError("At least one invoice item is required", 400);
    if (!dueDate) throw new AppError("Due date is required", 400);

    // Calculate totals
    const processedItems = items.map((item) => {
        const total = item.quantity * item.unitPrice;
        return { ...item, total };
    });

    const subtotal = processedItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const invoice = await Invoice.create({
        client,
        project: project || undefined,
        items: processedItems,
        subtotal,
        taxRate,
        taxAmount,
        total,
        dueDate: new Date(dueDate),
        paymentMethod,
        notes,
        status: "draft",
        createdBy: req.user._id,
    });

    return successResponse(res, "Invoice created", invoice, 201);
});

// ─── List All Invoices (Admin) ────────────────────────────────────────────────

/**
 * GET /api/v1/invoices
 * Admin: all invoices with filters.
 * Query: status, client, search, page, limit, sortBy, order
 */
export const getAllInvoices = asyncHandler(async (req, res) => {
    const { status, client, search, page = 1, limit = 20, sortBy = "createdAt", order = "desc" } =
        req.query;

    const filter = {};
    if (status) filter.status = status;
    if (client) filter.client = client;
    if (search) {
        filter.invoiceNumber = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const [invoices, total] = await Promise.all([
        Invoice.find(filter)
            .populate("client", "name email photo")
            .populate("project", "projectName")
            .populate("createdBy", "name")
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        Invoice.countDocuments(filter),
    ]);

    return successResponse(res, "Invoices fetched", {
        invoices,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    });
});

// ─── Get My Invoices (Client) ─────────────────────────────────────────────────

/**
 * GET /api/v1/invoices/my
 * Client fetches their own billing history.
 */
export const getMyInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({ client: req.user._id })
        .populate("project", "projectName")
        .sort({ createdAt: -1 })
        .lean();

    return successResponse(res, "Invoices fetched", invoices);
});

// ─── Invoice Statistics (Admin) ───────────────────────────────────────────────

/**
 * GET /api/v1/invoices/stats
 * Revenue statistics for the admin dashboard.
 */
export const getInvoiceStats = asyncHandler(async (req, res) => {
    const [statusBreakdown, revenueByMonth, totals] = await Promise.all([
        Invoice.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$total" } } },
        ]),
        Invoice.aggregate([
            { $match: { status: "paid" } },
            {
                $group: {
                    _id: {
                        year: { $year: "$paidAt" },
                        month: { $month: "$paidAt" },
                    },
                    revenue: { $sum: "$paidAmount" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
            { $limit: 12 },
        ]),
        Invoice.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$paidAmount" },
                    totalInvoiced: { $sum: "$total" },
                    totalOutstanding: {
                        $sum: {
                            $cond: [
                                { $in: ["$status", ["sent", "overdue"]] },
                                "$total",
                                0,
                            ],
                        },
                    },
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);

    return successResponse(res, "Invoice stats fetched", {
        overview: totals[0] || { totalRevenue: 0, totalInvoiced: 0, totalOutstanding: 0, count: 0 },
        byStatus: statusBreakdown,
        revenueByMonth,
    });
});

// ─── Get Single Invoice ───────────────────────────────────────────────────────

/**
 * GET /api/v1/invoices/:id
 */
export const getInvoiceById = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id)
        .populate("client", "name email photo")
        .populate("project", "projectName status")
        .populate("createdBy", "name");

    if (!invoice) throw new AppError("Invoice not found", 404);

    // Client can only see their own invoices
    if (
        req.user.role !== "admin" &&
        invoice.client._id.toString() !== req.user._id.toString()
    ) {
        throw new AppError("Not authorized to view this invoice", 403);
    }

    return successResponse(res, "Invoice fetched", invoice);
});

// ─── Update Invoice ───────────────────────────────────────────────────────────

/**
 * PATCH /api/v1/invoices/:id
 * Admin updates invoice details (only for draft invoices).
 */
export const updateInvoice = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new AppError("Admin access required", 403);

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) throw new AppError("Invoice not found", 404);
    if (invoice.status !== "draft") {
        throw new AppError("Only draft invoices can be edited", 400);
    }

    const { items, taxRate, dueDate, notes, paymentMethod } = req.body;

    if (items) {
        const processedItems = items.map((item) => ({
            ...item,
            total: item.quantity * item.unitPrice,
        }));
        invoice.items = processedItems;
        invoice.subtotal = processedItems.reduce((s, i) => s + i.total, 0);
        invoice.taxAmount = (invoice.subtotal * (taxRate ?? invoice.taxRate)) / 100;
        invoice.total = invoice.subtotal + invoice.taxAmount;
    }
    if (taxRate !== undefined) invoice.taxRate = taxRate;
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (notes !== undefined) invoice.notes = notes;
    if (paymentMethod !== undefined) invoice.paymentMethod = paymentMethod;

    await invoice.save();
    return successResponse(res, "Invoice updated", invoice);
});

// ─── Update Invoice Status ────────────────────────────────────────────────────

/**
 * PATCH /api/v1/invoices/:id/status
 * Admin changes invoice status (send, mark paid, void).
 * Body: { status: "sent" | "paid" | "void", paidAmount? }
 */
export const updateInvoiceStatus = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new AppError("Admin access required", 403);

    const { status, paidAmount } = req.body;
    const validStatuses = ["draft", "sent", "paid", "overdue", "void"];
    if (!status || !validStatuses.includes(status)) {
        throw new AppError(`status must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const invoice = await Invoice.findById(req.params.id).populate("client", "_id name");
    if (!invoice) throw new AppError("Invoice not found", 404);

    invoice.status = status;
    if (paidAmount !== undefined) invoice.paidAmount = paidAmount;

    await invoice.save(); // pre-save hook sets paidAt

    // Notify client when invoice is sent or paid
    if (status === "sent") {
        await Notification.notify(
            invoice.client._id,
            "payment_due",
            "New Invoice",
            `Invoice ${invoice.invoiceNumber} for $${invoice.total.toFixed(2)} is due on ${new Date(invoice.dueDate).toDateString()}`,
            { relatedId: invoice._id, relatedModel: "Invoice" }
        );
    } else if (status === "paid") {
        await Notification.notify(
            invoice.client._id,
            "payment_received",
            "Payment Confirmed",
            `We received your payment of $${invoice.paidAmount.toFixed(2)} for Invoice ${invoice.invoiceNumber}`,
            { relatedId: invoice._id, relatedModel: "Invoice" }
        );
    }

    return successResponse(res, "Invoice status updated", invoice);
});

// ─── Delete Invoice ───────────────────────────────────────────────────────────

/**
 * DELETE /api/v1/invoices/:id
 * Admin deletes a draft invoice.
 */
export const deleteInvoice = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new AppError("Admin access required", 403);

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) throw new AppError("Invoice not found", 404);
    if (invoice.status !== "draft") {
        throw new AppError("Only draft invoices can be deleted", 400);
    }

    await invoice.deleteOne();
    return successResponse(res, "Invoice deleted");
});
