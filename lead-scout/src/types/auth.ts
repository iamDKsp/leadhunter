export interface Permission {
    canSearchLeads: boolean;
    canViewAllLeads: boolean;
    canViewOwnLeads: boolean;
    canManageLeads: boolean;
    canDeleteLeads: boolean;
    canAssignLeads: boolean;
    canImportLeads: boolean;
    canExportLeads: boolean;
    canViewCRM: boolean;
    canMoveCards: boolean;
    canManageStages: boolean;
    canBulkActions: boolean;
    canViewDashboard: boolean;
    canViewAnalytics: boolean;
    canViewCosts: boolean;
    canViewChat: boolean;
    canSendMessage: boolean;
    canSendMedia: boolean;
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
    role?: 'SUPER_ADMIN' | 'SELLER';
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
