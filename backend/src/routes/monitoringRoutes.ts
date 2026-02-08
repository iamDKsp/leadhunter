import express from 'express';
import { authenticateToken } from '../middleware/auth';
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
router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/chats/:userId', getUserChats);

// Session Management
router.post('/heartbeat', heartbeat);
router.post('/logout', logout);

export default router;
