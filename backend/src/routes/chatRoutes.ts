
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getConversations, getSessionStatus, connectSession, logoutSession, sendMedia } from '../controllers/chatController';

const router = express.Router();

router.use(authenticateToken);

router.get('/conversations', getConversations);
router.get('/status', getSessionStatus);
router.post('/connect', connectSession);
router.post('/logout', logoutSession);
router.post('/send-media', sendMedia);

export default router;
