import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth';

const prisma = new PrismaClient();

// Permission type for type safety
type PermissionKey =
    | 'canSearchLeads'
    | 'canViewAllLeads'
    | 'canViewOwnLeads'
    | 'canManageLeads'
    | 'canAssignLeads'
    | 'canViewCRM'
    | 'canViewDashboard'
    | 'canViewCosts'
    | 'canViewChat'
    | 'canManageUsers'
    | 'canManageGroups'
    | 'canManageFolders';

// Extended auth request with permissions
export interface AuthRequestWithPermissions extends AuthRequest {
    userPermissions?: {
        role: string;
        permissions: Record<PermissionKey, boolean> | null;
    };
}

// Load user permissions and attach to request
export const loadPermissions = async (req: AuthRequestWithPermissions, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.userId) {
            return next();
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                role: true,
                accessGroup: {
                    include: { permissions: true }
                }
            }
        });

        if (user) {
            req.userPermissions = {
                role: user.role,
                permissions: user.accessGroup?.permissions || null
            };
        }

        next();
    } catch (error) {
        console.error('Load permissions error:', error);
        next();
    }
};

// Check if user has a specific permission
export const checkPermission = (permission: PermissionKey) => {
    return async (req: AuthRequestWithPermissions, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Load permissions if not already loaded
            if (!req.userPermissions) {
                const user = await prisma.user.findUnique({
                    where: { id: req.user.userId },
                    select: {
                        role: true,
                        accessGroup: {
                            include: { permissions: true }
                        }
                    }
                });

                if (user) {
                    req.userPermissions = {
                        role: user.role,
                        permissions: user.accessGroup?.permissions || null
                    };
                }
            }

            // Super admins bypass all permission checks
            if (req.userPermissions?.role === 'SUPER_ADMIN') {
                return next();
            }

            // Check the specific permission
            if (req.userPermissions?.permissions?.[permission]) {
                return next();
            }

            return res.status(403).json({
                error: 'Permission denied',
                required: permission
            });
        } catch (error) {
            console.error('Check permission error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
};

// Check if user has one of the specified roles
export const requireRole = (...roles: string[]) => {
    return async (req: AuthRequestWithPermissions, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Load user role if not already loaded
            if (!req.userPermissions) {
                const user = await prisma.user.findUnique({
                    where: { id: req.user.userId },
                    select: { role: true }
                });

                if (user) {
                    req.userPermissions = {
                        role: user.role,
                        permissions: null
                    };
                }
            }

            if (req.userPermissions && roles.includes(req.userPermissions.role)) {
                return next();
            }

            return res.status(403).json({
                error: 'Permission denied',
                requiredRoles: roles
            });
        } catch (error) {
            console.error('Require role error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
};

// Shortcut for super admin only
export const requireSuperAdmin = requireRole('SUPER_ADMIN');

// Shortcut for admin or super admin
export const requireAdmin = requireRole('SUPER_ADMIN', 'ADMIN');

// Get user permissions (utility function)
export const getUserPermissions = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            accessGroup: {
                include: { permissions: true }
            }
        }
    });

    if (!user) {
        return null;
    }

    // Super admin has all permissions
    if (user.role === 'SUPER_ADMIN') {
        return {
            role: user.role,
            canSearchLeads: true,
            canViewAllLeads: true,
            canViewOwnLeads: true,
            canManageLeads: true,
            canAssignLeads: true,
            canViewCRM: true,
            canViewDashboard: true,
            canViewCosts: true,
            canViewChat: true,
            canManageUsers: true,
            canManageGroups: true,
            canManageFolders: true,
            canUseOwnWhatsApp: true
        };
    }

    // Return group permissions or defaults
    const perms = user.accessGroup?.permissions;
    return {
        role: user.role,
        canSearchLeads: perms?.canSearchLeads ?? false,
        canViewAllLeads: perms?.canViewAllLeads ?? false,
        canViewOwnLeads: perms?.canViewOwnLeads ?? true,
        canManageLeads: perms?.canManageLeads ?? false,
        canAssignLeads: perms?.canAssignLeads ?? false,
        canViewCRM: perms?.canViewCRM ?? true,
        canViewDashboard: perms?.canViewDashboard ?? true,
        canViewCosts: perms?.canViewCosts ?? false,
        canViewChat: perms?.canViewChat ?? false,
        canManageUsers: perms?.canManageUsers ?? false,
        canManageGroups: perms?.canManageGroups ?? false,
        canManageFolders: perms?.canManageFolders ?? false,
        canUseOwnWhatsApp: perms?.canUseOwnWhatsApp ?? false
    };
};
