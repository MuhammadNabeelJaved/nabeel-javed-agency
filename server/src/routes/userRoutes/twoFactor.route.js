import express from 'express';
import {
    setup2FA,
    verify2FA,
    disable2FA,
    validate2FA,
    get2FAStatus,
    getBackupCodes,
    regenerateBackupCodes,
} from '../../controllers/usersControllers/twoFactor.controller.js';
import { userAuthenticated } from '../../middlewares/Auth.js';

const router = express.Router();

// Public (no auth) — called during login before tokens are issued
router.post('/validate', validate2FA);

// Authenticated
router.get('/status',               userAuthenticated, get2FAStatus);
router.post('/setup',               userAuthenticated, setup2FA);
router.post('/verify',              userAuthenticated, verify2FA);
router.post('/disable',             userAuthenticated, disable2FA);
router.get('/backup-codes',         userAuthenticated, getBackupCodes);
router.post('/regenerate-backup',   userAuthenticated, regenerateBackupCodes);

export default router;
