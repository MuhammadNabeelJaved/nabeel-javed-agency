import express from 'express';
import {
    getMilestones,
    getAllMilestones,
    createMilestone,
    updateMilestone,
    approveMilestone,
    rejectMilestone,
    deleteMilestone,
    toggleDeliverable,
} from '../../controllers/usersControllers/milestone.controller.js';
import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';

const router = express.Router();

// Admin: get all milestones across projects
router.get('/admin', userAuthenticated, authorizeRoles('admin'), getAllMilestones);

// Authenticated: get milestones for a specific project (?project=id)
router.get('/', userAuthenticated, getMilestones);

// Admin / Team: create milestone
router.post('/', userAuthenticated, authorizeRoles('admin', 'team'), createMilestone);

// Client approval routes — must be before /:id
router.put('/:id/approve', userAuthenticated, approveMilestone);
router.put('/:id/reject',  userAuthenticated, rejectMilestone);

// Deliverable toggle
router.patch('/:id/deliverable/:delivId', userAuthenticated, authorizeRoles('admin', 'team'), toggleDeliverable);

// Admin / Team: update / delete
router.put('/:id',    userAuthenticated, authorizeRoles('admin', 'team'), updateMilestone);
router.delete('/:id', userAuthenticated, authorizeRoles('admin'), deleteMilestone);

export default router;
