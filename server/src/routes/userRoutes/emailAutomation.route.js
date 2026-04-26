import express from 'express';
import { getAll, getById, create, update, toggle, remove, getStats } from '../../controllers/usersControllers/emailAutomation.controller.js';
import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';

const router = express.Router();

const admin = [userAuthenticated, authorizeRoles('admin')];

router.get('/stats', ...admin, getStats);
router.get('/',      ...admin, getAll);
router.get('/:id',   ...admin, getById);
router.post('/',     ...admin, create);
router.put('/:id',   ...admin, update);
router.patch('/:id/toggle', ...admin, toggle);
router.delete('/:id', ...admin, remove);

export default router;
