import { Router } from 'express';
import { registerUser, loginUser, getUserProfile, deleteUser, getAllUserProfile } from '../controllers/user.controller.js';

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/profile/:id').get(getUserProfile);
router.route('/:id').delete(deleteUser);
router.route('/').get(getAllUserProfile);


export default router;