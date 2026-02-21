import express from 'express';
import { getStages, updateStages } from '../controllers/stageController';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/authorization';

const router = express.Router();

router.get('/', authenticateToken, checkPermission('canViewCRM'), getStages);
router.post('/', authenticateToken, checkPermission('canManageStages'), updateStages);

export default router;
