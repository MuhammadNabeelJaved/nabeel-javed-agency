/**
 * Resource routes – /api/v1/resources
 */
import express from "express";
import { uploadResource, getAllResources, deleteResource, bulkDeleteResources } from "../../controllers/usersControllers/resource.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import uploadAny from "../../middlewares/multerAny.js";

const router = express.Router();

router.use(userAuthenticated);
router.use(authorizeRoles("admin", "team"));

router.get("/",        getAllResources);
router.post("/",       uploadAny.single("file"), uploadResource);
router.delete("/bulk", bulkDeleteResources);
router.delete("/:id",  deleteResource);

export default router;
