import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/authorization';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../controllers/templateController';

const router = Router();

router.use(authenticateToken);

// All template routes require canSendMessage permission as a baseline
router.get('/', checkPermission('canSendMessage'), getTemplates);
router.post('/', checkPermission('canSendMessage'), createTemplate);
router.patch('/:id', checkPermission('canSendMessage'), updateTemplate);
router.delete('/:id', checkPermission('canSendMessage'), deleteTemplate);

export default router;
