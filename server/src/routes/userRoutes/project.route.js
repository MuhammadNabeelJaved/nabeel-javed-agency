import express from 'express';
import upload from "../../middlewares/multer.js"
import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';
import {
    createProject,
    getAllProjects,
    updateProject,
    getProjectById,
    updateProjectStatus,
    deleteProject,
    getProjectStats,
    deleteAttachment
} from '../../controllers/usersControllers/project.controller.js';
import { uploadLimiter, mutationLimiter } from '../../middlewares/rateLimiter.js';
import { createProjectSchema, mongoIdParam, validate } from '../../middlewares/validate.js';

const router = express.Router();

router.route('/create').post(userAuthenticated, authorizeRoles("admin", "user"), uploadLimiter, upload.array('files', 5), createProjectSchema, createProject);
router.route('/').get(userAuthenticated, authorizeRoles('admin', 'user', 'team'), getAllProjects);
router.route('/stats').get(userAuthenticated, authorizeRoles('admin', 'user'), getProjectStats);
router.route('/:id').get(userAuthenticated, authorizeRoles("admin", "user"), validate([mongoIdParam('id')]), getProjectById);
router.route('/:id').patch(userAuthenticated, authorizeRoles("admin", "user"), uploadLimiter, upload.array('files', 5), validate([mongoIdParam('id')]), updateProject);
router.route('/:id/status').patch(userAuthenticated, authorizeRoles('admin'), mutationLimiter, validate([mongoIdParam('id')]), updateProjectStatus);
router.route('/:id').delete(userAuthenticated, authorizeRoles('admin', 'user'), mutationLimiter, validate([mongoIdParam('id')]), deleteProject);
router.route('/:id/attachments/:attachmentId').delete(userAuthenticated, authorizeRoles('admin'), mutationLimiter, validate([mongoIdParam('id')]), deleteAttachment);
export default router;
