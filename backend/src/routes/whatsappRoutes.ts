import express from 'express';
import { connectWhatsApp, disconnectWhatsApp, getStatus } from '../controllers/whatsappController';

import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/authorization';

const router = express.Router();

router.use(authenticateToken);

router.post('/connect', checkPermission('canManageConnections'), connectWhatsApp);
router.post('/disconnect', checkPermission('canManageConnections'), disconnectWhatsApp);
router.get('/status', checkPermission('canViewChat'), getStatus);

export default router;
