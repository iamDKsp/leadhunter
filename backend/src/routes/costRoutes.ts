import express from 'express';
import { getCostStats } from '../controllers/costController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', getCostStats);

export default router;
