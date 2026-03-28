import { Router } from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    deleteUser,
    getAllUserProfile,
    updateUserProfile,
    updateUserPassword,
    forgotPassword,
    resetPassword,
    verifyUserEmail,
    resendVerificationEmail,
    refreshAccessToken,
    getPublicTeamMembers,
    adminCreateTeamMember,
} from '../../controllers/usersControllers/user.controller.js';
import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';
import upload from '../../middlewares/multer.js';
import { authLimiter, otpLimiter, uploadLimiter, mutationLimiter } from '../../middlewares/rateLimiter.js';
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    mongoIdParam,
    validate,
} from '../../middlewares/validate.js';

const router = Router();

// Public routes (no auth required)
router.post('/register', authLimiter, uploadLimiter, upload.single('avatar'), registerSchema, registerUser);
router.post('/login', authLimiter, loginSchema, loginUser);
router.post('/verify', otpLimiter, verifyUserEmail);
router.post('/resend-verification', otpLimiter, resendVerificationEmail);
router.post('/forgot-password', authLimiter, forgotPasswordSchema, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordSchema, resetPassword);
router.post('/refresh-token', refreshAccessToken);
router.get('/team', getPublicTeamMembers);

// Protected routes
router.post('/logout', userAuthenticated, logoutUser);
router.get('/', userAuthenticated, authorizeRoles('admin'), getAllUserProfile);
router.post('/create-team-member', userAuthenticated, authorizeRoles('admin'), uploadLimiter, upload.single('avatar'), adminCreateTeamMember);
router.get('/profile/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), validate([mongoIdParam('id')]), getUserProfile);
router.put('/update/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), uploadLimiter, upload.single('avatar'), updateProfileSchema, updateUserProfile);
router.put('/update-password/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), mutationLimiter, validate([mongoIdParam('id')]), updateUserPassword);
router.delete('/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), mutationLimiter, validate([mongoIdParam('id')]), deleteUser);

export default router;
