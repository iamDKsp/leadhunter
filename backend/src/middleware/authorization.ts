import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './auth';

// Permission type for type safety
type PermissionKey =
    | 'canSearchLeads'
    | 'canViewAllLeads'
    | 'canViewOwnLeads'
    | 'canManageLeads'
    | 'canAssignLeads'
    | 'canImportLeads'
    | 'canExportLeads'
    | 'canViewCRM'
    | 'canMoveCards'
    | 'canManageStages'
    | 'canViewDashboard'
    | 'canViewCosts'
    | 'canViewChat'
    | 'canSendMessage'
    | 'canDeleteMessages'
    | 'canViewAllChats'
    | 'canManageConnections'
    | 'canManageUsers'
    | 'canManageGroups'
    | 'canManageFolders'
    | 'canViewSystemLogs'
    | 'canManageSettings'
    | 'canManageIntegrations'
    | 'canViewPersonal'
    | 'canManageTasks'
    | 'canManageGoals'
    | 'canViewMonitoring'
    | 'canUseOwnWhatsApp';

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
            canImportLeads: true,
            canExportLeads: true,
            canViewCRM: true,
            canMoveCards: true,
            canManageStages: true,
            canViewDashboard: true,
            canViewCosts: true,
            canViewChat: true,
            canSendMessage: true,
            canDeleteMessages: true,
            canViewAllChats: true,
            canManageConnections: true,
            canManageUsers: true,
            canManageGroups: true,
            canManageFolders: true,
            canViewSystemLogs: true,
            canManageSettings: true,
            canManageIntegrations: true,
            canViewPersonal: true,
            canManageTasks: true,
            canManageGoals: true,
            canViewMonitoring: true,
            canUseOwnWhatsApp: true
        };
    }

    // Return group permissions or defaults
    const perms = user.accessGroup?.permissions;
    return {
        role: user.role,
        // Lead Permissions
        canSearchLeads: perms?.canSearchLeads ?? false,
        canViewAllLeads: perms?.canViewAllLeads ?? false,
        canViewOwnLeads: perms?.canViewOwnLeads ?? true,
        canManageLeads: perms?.canManageLeads ?? false,
        canAssignLeads: perms?.canAssignLeads ?? false,
        canImportLeads: perms?.canImportLeads ?? false,
        canExportLeads: perms?.canExportLeads ?? false,

        // CRM Permissions
        canViewCRM: perms?.canViewCRM ?? true,
        canMoveCards: perms?.canMoveCards ?? true,
        canManageStages: perms?.canManageStages ?? false,

        // Module Permissions
        canViewDashboard: perms?.canViewDashboard ?? true,
        canViewCosts: perms?.canViewCosts ?? false,

        // Chat Permissions
        canViewChat: perms?.canViewChat ?? false,
        canSendMessage: perms?.canSendMessage ?? false,
        canDeleteMessages: perms?.canDeleteMessages ?? false,
        canViewAllChats: perms?.canViewAllChats ?? false,
        canManageConnections: perms?.canManageConnections ?? false,

        // Admin Permissions
        canManageUsers: perms?.canManageUsers ?? false,
        canManageGroups: perms?.canManageGroups ?? false,
        canManageFolders: perms?.canManageFolders ?? false,
        canViewSystemLogs: perms?.canViewSystemLogs ?? false,
        canManageSettings: perms?.canManageSettings ?? false,
        canManageIntegrations: perms?.canManageIntegrations ?? false,

        // Personal & Monitoring
        canViewPersonal: perms?.canViewPersonal ?? true,
        canManageTasks: perms?.canManageTasks ?? true,
        canManageGoals: perms?.canManageGoals ?? true,
        canViewMonitoring: perms?.canViewMonitoring ?? false,
        canUseOwnWhatsApp: perms?.canUseOwnWhatsApp ?? false
    };
};
