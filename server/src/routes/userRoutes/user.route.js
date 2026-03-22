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
import User from '../../models/usersModels/User.model.js';

const router = Router();

// ⚠️ TEMP DEV-ONLY: promote a user to admin for testing — REMOVE BEFORE PROD
router.post('/devpromote', async (req, res) => {
    const { email, role = 'admin' } = req.body;
    const user = await User.findOneAndUpdate({ email }, { role, isVerified: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `${email} promoted to ${role}`, role: user.role });
});

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
router.post('/create-team-member', userAuthenticated, authorizeRoles('admin'), upload.single('avatar'), adminCreateTeamMember);
router.get('/profile/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), getUserProfile);
router.put('/update/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), upload.single('avatar'), updateUserProfile);
router.put('/update-password/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), updateUserPassword);
router.delete('/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), deleteUser);

export default router;
