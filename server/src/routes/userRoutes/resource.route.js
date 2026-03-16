/**
 * Resource routes – /api/v1/resources
 */
import express from "express";
import {
    createResource,
    getResources,
    getResourceById,
    updateResource,
    deleteResource,
} from "../../controllers/usersControllers/resource.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import upload from "../../middlewares/multer.js";

const router = express.Router();

router.use(userAuthenticated, authorizeRoles("admin", "team"));

router.get("/", getResources);
router.post("/", upload.single("file"), createResource);

router.get("/:id", getResourceById);
router.patch("/:id", updateResource);
router.delete("/:id", deleteResource);

export default router;
