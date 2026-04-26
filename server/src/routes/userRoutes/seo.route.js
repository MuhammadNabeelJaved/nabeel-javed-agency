import express from 'express';
import {
    getAllSeoMeta,
    getSeoMetaByPage,
    upsertSeoMeta,
    deleteSeoMeta,
    bulkUpsertSeoMeta,
} from '../../controllers/usersControllers/seo.controller.js';
import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';

const router = express.Router();

// Public
router.get('/', getAllSeoMeta);
router.get('/:page', getSeoMetaByPage);

// Admin
router.post('/bulk', userAuthenticated, authorizeRoles('admin'), bulkUpsertSeoMeta);
router.put('/:page', userAuthenticated, authorizeRoles('admin'), upsertSeoMeta);
router.delete('/:page', userAuthenticated, authorizeRoles('admin'), deleteSeoMeta);

export default router;
