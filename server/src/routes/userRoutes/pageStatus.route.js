import express from "express";
import { getAllPageStatuses, updatePageStatus } from "../../controllers/usersControllers/pageStatus.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

// Public — visitors need this to know if a page is under maintenance
router.get("/", getAllPageStatuses);

// Admin only — toggle page status
router.put("/:key", userAuthenticated, authorizeRoles("admin"), updatePageStatus);

export default router;
