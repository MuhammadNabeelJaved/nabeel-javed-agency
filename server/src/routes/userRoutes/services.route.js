import express from 'express';
import { createService, getAllServices, getServiceBySlug, getServiceById, deleteService, updateService, bulkDeleteServices } from '../../controllers/usersControllers/services.controller.js';
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js"


const router = express.Router();

router.route('/create').post(userAuthenticated, authorizeRoles("admin"), createService);
router.route('/').get(getAllServices);
router.route('/:slug').get(getServiceBySlug);
router.route('/id/:id').get(getServiceById);
router.route('/delete/:id').delete(userAuthenticated, authorizeRoles("admin"), deleteService);
router.route('/update/:id').put(userAuthenticated, authorizeRoles("admin"), updateService);
router.delete('/bulk', userAuthenticated, authorizeRoles("admin"), bulkDeleteServices);

export default router;