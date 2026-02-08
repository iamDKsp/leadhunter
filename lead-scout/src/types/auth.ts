export interface Permission {
    canSearchLeads: boolean;
    canViewAllLeads: boolean;
    canViewOwnLeads: boolean;
    canManageLeads: boolean;
    canAssignLeads: boolean;
    canViewCRM: boolean;
    canViewDashboard: boolean;
    canViewCosts: boolean;
    canViewChat: boolean;
    canManageUsers: boolean;
    canManageGroups: boolean;
    canManageFolders: boolean;
    canViewPersonal: boolean;
    canViewMonitoring: boolean;
    canUseOwnWhatsApp: boolean;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role?: 'ADMIN' | 'USER' | 'SUPER_ADMIN' | 'SELLER';
    interfacePreference?: 'PC' | 'MOBILE' | 'BOTH';
    accessGroupId?: string | null;
    useOwnWhatsApp?: boolean;
    permissions?: Permission;
}

export interface AuthResponse {
    user: User;
    token: string;
}
