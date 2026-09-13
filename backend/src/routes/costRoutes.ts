import express from 'express';
import { getCostStats } from '../controllers/costController';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/authorization';

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', checkPermission('canViewCosts'), getCostStats);

export default router;
