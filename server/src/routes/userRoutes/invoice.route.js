/**
 * Invoice routes – /api/v1/invoices
 */
import express from "express";
import {
    createInvoice,
    getAllInvoices,
    getMyInvoices,
    getInvoiceStats,
    getInvoiceById,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
} from "../../controllers/usersControllers/invoice.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

router.use(userAuthenticated);

router.get("/my", getMyInvoices);
router.get("/stats", authorizeRoles("admin"), getInvoiceStats);

router.get("/", authorizeRoles("admin"), getAllInvoices);
router.post("/", authorizeRoles("admin"), createInvoice);

router.get("/:id", getInvoiceById);
router.patch("/:id", authorizeRoles("admin"), updateInvoice);
router.patch("/:id/status", authorizeRoles("admin"), updateInvoiceStatus);
router.delete("/:id", authorizeRoles("admin"), deleteInvoice);

export default router;
