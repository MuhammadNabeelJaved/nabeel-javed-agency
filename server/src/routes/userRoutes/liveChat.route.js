import { Router } from 'express';
import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';
import {
  getStats, getSessions, getSessionById, updateSession, deleteSession, getMessages,
  assignSession,
  getCannedResponses, createCannedResponse, updateCannedResponse, deleteCannedResponse,
  suggestReply,
} from '../../controllers/usersControllers/liveChat.controller.js';

const router = Router();
const adminOnly  = [userAuthenticated, authorizeRoles('admin')];
const agentOnly  = [userAuthenticated, authorizeRoles('admin', 'team')];

// Stats & sessions (team sees their own subset via controller filter)
router.get('/stats',                      ...agentOnly,  getStats);
router.get('/sessions',                   ...agentOnly,  getSessions);
router.get('/sessions/:id',               ...agentOnly,  getSessionById);
router.patch('/sessions/:id',             ...agentOnly,  updateSession);
router.delete('/sessions/:id',            ...adminOnly,  deleteSession);
router.get('/messages/:sessionId',        ...agentOnly,  getMessages);

// Assign session to a team member (admin only)
router.patch('/sessions/:id/assign',      ...adminOnly,  assignSession);

// Canned responses
router.get('/canned',                     ...agentOnly,  getCannedResponses);
router.post('/canned',                    ...adminOnly,  createCannedResponse);
router.patch('/canned/:id',               ...adminOnly,  updateCannedResponse);
router.delete('/canned/:id',              ...adminOnly,  deleteCannedResponse);

// AI reply suggestion
router.post('/suggest',                   ...agentOnly,  suggestReply);

export default router;
