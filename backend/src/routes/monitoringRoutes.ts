import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/authorization';
import {
    getStats,
    getUsers,
    getUserChats,
    heartbeat,
    logout,
} from '../controllers/monitoringController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Stats & Users
router.get('/stats', checkPermission('canViewMonitoring'), getStats);
router.get('/users', checkPermission('canViewMonitoring'), getUsers);
router.get('/chats/:userId', checkPermission('canViewMonitoring'), getUserChats);

// Session Management
router.post('/heartbeat', heartbeat);
router.post('/logout', logout);

export default router;
