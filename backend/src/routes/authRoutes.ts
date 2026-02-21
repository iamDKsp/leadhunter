import express, { Request, Response } from 'express';
import { register, login, createUser, getUsers, updateUser, deleteUser, updateProfile, uploadAvatar } from '../controllers/authController';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getUserPermissions, checkPermission } from '../middleware/authorization';
import prisma from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'public/uploads/avatars';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

// Public routes
router.post('/register', register);
router.post('/login', login);

// Upload route
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), uploadAvatar);

// Protected routes - User management
router.post('/create-user', authenticateToken, checkPermission('canManageUsers'), createUser);
router.get('/users', authenticateToken, checkPermission('canManageUsers'), getUsers);
router.put('/users/:id', authenticateToken, checkPermission('canManageUsers'), updateUser);
router.delete('/users/:id', authenticateToken, checkPermission('canManageUsers'), deleteUser);

// Profile update (Self)
router.put('/profile', authenticateToken, updateProfile);

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
                avatar: true,
                interfacePreference: true,
                role: true,
                accessGroupId: true,
                useOwnWhatsApp: true,
                customTag: true,
                customTagColor: true,
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
