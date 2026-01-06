import express from "express";
import { createContact, getAllContacts, getContactById, updateContact, deleteContact, deleteMultipleContacts, getContactStats, searchContactByEmail } from "../../controllers/usersControllers/contact.controller.js";


const router = express.Router();

router.route('/').post(createContact);
router.route('/').get(getAllContacts);
router.route('/search').get(searchContactByEmail);
router.route('/stats').get(getContactStats);
router.route('/:id').get(getContactById);
router.route('/:id').put(updateContact);
router.route('/:id').delete(deleteContact);
router.route('/').delete(deleteMultipleContacts);

export default router;