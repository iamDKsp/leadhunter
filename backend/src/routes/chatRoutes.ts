
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getConversations, getSessionStatus, connectSession, logoutSession, sendMedia, markChatAsRead, createChat, deleteChat } from '../controllers/chatController';

import { checkPermission } from '../middleware/authorization';

const router = express.Router();

router.use(authenticateToken);

router.get('/conversations', checkPermission('canViewChat'), getConversations);
router.get('/status', checkPermission('canViewChat'), getSessionStatus);
router.post('/create', checkPermission('canViewChat'), createChat);
router.delete('/:chatId', checkPermission('canViewChat'), deleteChat);
router.post('/connect', checkPermission('canManageConnections'), connectSession);
router.post('/logout', checkPermission('canManageConnections'), logoutSession);
router.post('/send-media', checkPermission('canSendMessage'), sendMedia);
router.put('/:chatId/read', checkPermission('canViewChat'), markChatAsRead);

export default router;
