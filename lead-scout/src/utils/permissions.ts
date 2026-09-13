import { User, Permission } from '@/types/auth';

export const getCurrentUser = (): User | null => {
    try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export const hasPermission = (user: User | undefined | null, permission: keyof Permission): boolean => {
    // If no user is passed, fallback to current stored user
    const targetUser = user ?? getCurrentUser();
    if (!targetUser) return false;

    // Admins have full access
    if (targetUser.role === 'SUPER_ADMIN') return true;

    // If permissions object exists, check it
    if (targetUser.permissions) {
        return !!targetUser.permissions[permission];
    }

    // Fallback: if no detailed permissions but has AccessGroup (shouldn't happen with correct backend)
    // We default to false to be safe
    return false;
};

export const canViewPage = (user: User | undefined | null, viewId: string): boolean => {
    const targetUser = user ?? getCurrentUser();
    if (!targetUser) return false;

    if (targetUser.role === 'SUPER_ADMIN') return true;

    // Mapping view IDs to permissions
    switch (viewId) {
        case 'management':
            return hasPermission(targetUser, 'canManageLeads');
        case 'dashboard':
            return hasPermission(targetUser, 'canViewDashboard');
        case 'personal':
            return hasPermission(targetUser, 'canViewPersonal');
        case 'leads':
            return hasPermission(targetUser, 'canViewCRM') || hasPermission(targetUser, 'canViewAllLeads') || hasPermission(targetUser, 'canViewOwnLeads');
        case 'users':
            return hasPermission(targetUser, 'canManageUsers');
        case 'monitoring':
            return hasPermission(targetUser, 'canViewMonitoring');
        case 'access-groups':
            return hasPermission(targetUser, 'canManageGroups');
        case 'costs':
            return hasPermission(targetUser, 'canViewCosts');
        case 'search':
            return hasPermission(targetUser, 'canSearchLeads');
        case 'analytics':
            return hasPermission(targetUser, 'canViewAnalytics');
        case 'settings':
            return hasPermission(targetUser, 'canManageSettings');
        case 'conversas':
            return hasPermission(targetUser, 'canViewChat');
        default:
            if (viewId.startsWith('folder-')) {
                return hasPermission(targetUser, 'canViewAllLeads') || hasPermission(targetUser, 'canViewOwnLeads') || hasPermission(targetUser, 'canManageFolders');
            }
            return false;
    }
};

/**
 * Returns the first available view for the user upon login or redirection.
 */
export const getDefaultView = (user: User | undefined | null): string => {
    if (!user) return 'leads';
    if (user.role === 'SUPER_ADMIN') return 'management';

    const preferredViews = [
        'management',
        'leads',
        'conversas',
        'personal',
        'search',
        'monitoring',
        'analytics',
        'costs',
        'users',
        'access-groups',
    ];

    for (const viewId of preferredViews) {
        if (canViewPage(user, viewId)) {
            return viewId;
        }
    }

    return 'personal';
};

