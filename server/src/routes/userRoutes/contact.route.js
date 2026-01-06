import express from "express";
import { createContact, getAllContacts, getContactById, updateContact, deleteContact, deleteMultipleContacts, getContactStats, searchContactByEmail } from "../../controllers/usersControllers/contact.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";


const router = express.Router();

router.route('/').post(createContact);
router.route('/').get(userAuthenticated, authorizeRoles("admin"), getAllContacts);
router.route('/search').get(userAuthenticated, authorizeRoles("admin"), searchContactByEmail);
router.route('/stats').get(userAuthenticated, authorizeRoles("admin"), getContactStats);
router.route('/:id').get(userAuthenticated, authorizeRoles("admin"), getContactById);
router.route('/:id').put(userAuthenticated, authorizeRoles("admin"), updateContact);
router.route('/:id').delete(userAuthenticated, authorizeRoles("admin"), deleteContact);
router.route('/').delete(userAuthenticated, authorizeRoles("admin"), deleteMultipleContacts);

export default router;