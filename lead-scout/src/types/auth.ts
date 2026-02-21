export interface Permission {
    canSearchLeads: boolean;
    canViewAllLeads: boolean;
    canViewOwnLeads: boolean;
    canManageLeads: boolean;
    canAssignLeads: boolean;
    canImportLeads: boolean;
    canExportLeads: boolean;
    canViewCRM: boolean;
    canMoveCards: boolean;
    canManageStages: boolean;
    canViewDashboard: boolean;
    canViewCosts: boolean;
    canViewChat: boolean;
    canSendMessage: boolean;
    canDeleteMessages: boolean;
    canViewAllChats: boolean;
    canManageConnections: boolean;
    canManageUsers: boolean;
    canManageGroups: boolean;
    canManageFolders: boolean;
    canViewSystemLogs: boolean;
    canManageSettings: boolean;
    canManageIntegrations: boolean;
    canViewPersonal: boolean;
    canManageTasks: boolean;
    canManageGoals: boolean;
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
    avatar?: string;
    permissions?: Permission;
    customTag?: string | null;
    customTagColor?: string | null;
}

export interface AuthResponse {
    user: User;
    token: string;
}
