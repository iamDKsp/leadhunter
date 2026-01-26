
import { Router } from 'express';
import { getMessages } from '../controllers/messageController';

const router = Router();

router.get('/:chatId', getMessages);

export default router;
