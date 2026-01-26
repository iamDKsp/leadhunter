import express from 'express';
import { register, login } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

import { createUser, getUsers } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
router.post('/create-user', authenticateToken, createUser);
router.get('/users', authenticateToken, getUsers);

export default router;
