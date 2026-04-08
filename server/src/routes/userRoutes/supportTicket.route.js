import { Router } from 'express';
import {
  createTicket,
  getMyTickets,
  addUserReply,
  getAllTickets,
  getTicketStats,
  updateTicket,
  addAdminResponse,
  deleteTicket,
} from '../../controllers/usersControllers/supportTicket.controller.js';
import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';
import { mutationLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

// ── User routes ────────────────────────────────────────────────────────────────
router.post('/',              userAuthenticated, mutationLimiter, createTicket);
router.get('/my',             userAuthenticated, getMyTickets);
router.post('/:id/reply',     userAuthenticated, addUserReply);

// ── Admin routes ───────────────────────────────────────────────────────────────
router.get('/stats',          userAuthenticated, authorizeRoles('admin'), getTicketStats);
router.get('/',               userAuthenticated, authorizeRoles('admin'), getAllTickets);
router.put('/:id',            userAuthenticated, authorizeRoles('admin'), updateTicket);
router.post('/:id/respond',   userAuthenticated, authorizeRoles('admin'), addAdminResponse);
router.delete('/:id',         userAuthenticated, authorizeRoles('admin'), mutationLimiter, deleteTicket);

export default router;
