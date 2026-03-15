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
} from '../../controllers/usersControllers/user.controller.js';
import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';
import upload from '../../middlewares/multer.js';

const router = Router();

// Public routes (no auth required)
router.post('/register', upload.single('avatar'), registerUser);
router.post('/login', loginUser);
router.post('/verify', verifyUserEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshAccessToken);
router.get('/team', getPublicTeamMembers);

// Protected routes
router.post('/logout', userAuthenticated, logoutUser);
router.get('/', userAuthenticated, authorizeRoles('admin'), getAllUserProfile);
router.get('/profile/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), getUserProfile);
router.put('/update/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), upload.single('avatar'), updateUserProfile);
router.put('/update-password/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), updateUserPassword);
router.delete('/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), deleteUser);

export default router;
