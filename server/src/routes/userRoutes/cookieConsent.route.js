/**
 * Cookie Consent Routes
 * Prefix: /api/v1/consent
 *
 * Public:
 *   POST /          — log a consent event (no auth required)
 *
 * Admin-only:
 *   GET  /          — paginated consent records
 *   GET  /stats     — aggregate breakdown stats
 *   DELETE /clear   — bulk-delete records older than ?days=N
 *   DELETE /:id     — delete a single record
 */
import { Router } from 'express';
import {
  saveConsent,
  getConsents,
  getConsentStats,
  clearOldConsents,
  deleteConsent,
} from '../../controllers/usersControllers/cookieConsent.controller.js';
import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/', saveConsent);

// ── Admin only ────────────────────────────────────────────────────────────────
router.use(userAuthenticated, authorizeRoles('admin'));

router.get('/stats', getConsentStats);
router.delete('/clear', clearOldConsents);   // must come before /:id
router.get('/', getConsents);
router.delete('/:id', deleteConsent);

export default router;
