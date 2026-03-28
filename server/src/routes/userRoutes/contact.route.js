import express from "express";
import { createContact, getAllContacts, getContactById, updateContact, deleteContact, deleteMultipleContacts, getContactStats, searchContactByEmail } from "../../controllers/usersControllers/contact.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import { mutationLimiter } from "../../middlewares/rateLimiter.js";
import { contactSchema, mongoIdParam, validate } from "../../middlewares/validate.js";


const router = express.Router();

router.route('/').post(mutationLimiter, contactSchema, createContact);
router.route('/').get(userAuthenticated, authorizeRoles("admin"), getAllContacts);
router.route('/search').get(userAuthenticated, authorizeRoles("admin"), searchContactByEmail);
router.route('/stats').get(userAuthenticated, authorizeRoles("admin"), getContactStats);
router.route('/:id').get(userAuthenticated, authorizeRoles("admin"), validate([mongoIdParam("id")]), getContactById);
router.route('/:id').put(userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), updateContact);
router.route('/:id').delete(userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), deleteContact);
router.route('/').delete(userAuthenticated, authorizeRoles("admin"), deleteMultipleContacts);

export default router;