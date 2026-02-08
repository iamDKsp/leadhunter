import { User, Permission } from '@/types/auth';

export const hasPermission = (user: User | undefined | null, permission: keyof Permission): boolean => {
    if (!user) return false;

    // Admins have full access
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;

    // If permissions object exists, check it
    if (user.permissions) {
        return !!user.permissions[permission];
    }

    // Fallback: if no detailed permissions but has AccessGroup (shouldn't happen with correct backend)
    // We default to false to be safe
    return false;
};

export const canViewPage = (user: User | undefined | null, viewId: string): boolean => {
    if (!user) return false;

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;

    // Mapping view IDs to permissions
    switch (viewId) {
        case 'dashboard':
            return hasPermission(user, 'canViewDashboard');
        case 'personal':
            return hasPermission(user, 'canViewPersonal');
        case 'leads':
            return hasPermission(user, 'canViewAllLeads') || hasPermission(user, 'canViewOwnLeads');
        case 'users':
            return hasPermission(user, 'canManageUsers');
        case 'monitoring':
            return hasPermission(user, 'canViewMonitoring');
        case 'access-groups':
            return hasPermission(user, 'canManageGroups');
        case 'costs':
            return hasPermission(user, 'canViewCosts');
        case 'search':
            return hasPermission(user, 'canSearchLeads');
        case 'analytics':
            return true; // Everyone can view analytics? Or should be restricted?
        case 'settings':
            return true; // Profile settings usually open to all
        case 'conversas':
            return true;
        default:
            // Files/folders usually unrestricted or have their own logic
            if (viewId.startsWith('folder-')) return true;
            return true;
    }
};
