import express, { Response } from 'express';
import { register, login, createUser, getUsers, updateUser, deleteUser } from '../controllers/authController';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getUserPermissions, checkPermission } from '../middleware/authorization';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes - User management
router.post('/create-user', authenticateToken, checkPermission('canManageUsers'), createUser);
router.get('/users', authenticateToken, checkPermission('canManageUsers'), getUsers);
router.put('/users/:id', authenticateToken, checkPermission('canManageUsers'), updateUser);
router.delete('/users/:id', authenticateToken, checkPermission('canManageUsers'), deleteUser);

// Get current user with permissions
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                interfacePreference: true,
                role: true,
                accessGroupId: true,
                accessGroup: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const permissions = await getUserPermissions(userId);

        res.json({
            ...user,
            permissions
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
