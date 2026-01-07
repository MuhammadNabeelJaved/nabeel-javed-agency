import express from "express";
import { getHomePage, createHomePage, updateHomePage, deleteHomePage, deleteSpecificField } from "../../controllers/usersControllers/homePage.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

router.route("/").get(userAuthenticated, authorizeRoles("admin"), getHomePage);
router.route("/add").post(userAuthenticated, authorizeRoles("admin"), createHomePage);
router.route("/update").put(userAuthenticated, authorizeRoles("admin"), updateHomePage);
router.route("/delete-field").delete(userAuthenticated, authorizeRoles("admin"), deleteSpecificField);
router.route("/delete").delete(userAuthenticated, authorizeRoles("admin"), deleteHomePage);

export default router;