import { Router } from 'express';
import {
    registerUser, loginUser, getUserProfile, deleteUser, getAllUserProfile,
    updateUserProfile, updateUserPassword, forgotPassword, resetPassword,verifyUserEmail
} from '../controllers/user.controller.js';
import { userAuthenticated, authorizeRoles } from '../middlewares/Auth.js';

const router = Router();

router.route('/register').post(registerUser);
router.route('/verify/:token').get(verifyUserEmail);
router.route('/login').post(loginUser);
router.route('/profile/:id').get(getUserProfile);
router.route('/:id').delete(deleteUser);
router.route('/').get(getAllUserProfile);
router.route('/update/:id').put(updateUserProfile);
router.route('/update-password/:id').put(updateUserPassword);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:token').post(resetPassword);


export default router;