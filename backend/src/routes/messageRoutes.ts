
import { Router } from 'express';
import { getMessages } from '../controllers/messageController';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/authorization';

const router = Router();

router.use(authenticateToken);

router.get('/:chatId', checkPermission('canViewChat'), getMessages);

export default router;
