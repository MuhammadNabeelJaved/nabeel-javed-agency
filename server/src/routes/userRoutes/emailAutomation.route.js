import express from 'express';
import {
    getAll, getById, create, update, toggle, remove, getStats,
    getTemplates, createTemplate, updateTemplate, deleteTemplate, resetTemplate, generateTemplate,
} from '../../controllers/usersControllers/emailAutomation.controller.js';
import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';

const router = express.Router();
const admin = [userAuthenticated, authorizeRoles('admin')];

// ── Static / named routes first (must precede /:id) ──────────────────────────
router.get('/stats',                       ...admin, getStats);
router.get('/templates',                   ...admin, getTemplates);
router.post('/templates/generate',         ...admin, generateTemplate);
router.post('/templates',                  ...admin, createTemplate);
router.put('/templates/:id',               ...admin, updateTemplate);
router.delete('/templates/:id/reset',      ...admin, resetTemplate);
router.delete('/templates/:id',            ...admin, deleteTemplate);

// ── Automation CRUD (/:id last) ───────────────────────────────────────────────
router.get('/',         ...admin, getAll);
router.get('/:id',      ...admin, getById);
router.post('/',        ...admin, create);
router.put('/:id',      ...admin, update);
router.patch('/:id/toggle', ...admin, toggle);
router.delete('/:id',   ...admin, remove);

export default router;
