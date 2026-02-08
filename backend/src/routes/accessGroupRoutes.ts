import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin, checkPermission } from '../middleware/authorization';
import {
    createAccessGroup,
    getAccessGroups,
    getAccessGroup,
    updateAccessGroup,
    deleteAccessGroup,
    updatePermissions,
    addUserToGroup,
    removeUserFromGroup
} from '../controllers/accessGroupController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// CRUD for access groups (requires admin permissions)
router.post('/', checkPermission('canManageGroups'), createAccessGroup);
router.get('/', getAccessGroups); // Any authenticated user can see groups
router.get('/:id', getAccessGroup);
router.put('/:id', checkPermission('canManageGroups'), updateAccessGroup);
router.delete('/:id', checkPermission('canManageGroups'), deleteAccessGroup);

// Permission management
router.put('/:id/permissions', checkPermission('canManageGroups'), updatePermissions);

// User-group management
router.post('/:id/users', checkPermission('canManageGroups'), addUserToGroup);
router.delete('/:id/users/:userId', checkPermission('canManageGroups'), removeUserFromGroup);

export default router;
