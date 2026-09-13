import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Kanban,
    Users,
    FileSpreadsheet,
    MessageSquare,
    Shield,
    Database,
    Sliders,
    UserCheck,
    FileText,
    TrendingUp,
    Settings,
    Activity,
    Layers,
    LucideIcon
} from 'lucide-react';
import { SearchLeadsPreview } from './previews/SearchLeadsPreview';
import { MoveCardsPreview } from './previews/MoveCardsPreview';
import { AssignLeadsPreview } from './previews/AssignLeadsPreview';
import { ExportLeadsPreview } from './previews/ExportLeadsPreview';
import { WhatsAppChatPreview } from './previews/WhatsAppChatPreview';
import { GenericPermissionPreview } from './previews/GenericPermissionPreview';

interface PermissionPreviewPanelProps {
    permissionKey: string;
    permissionInfo?: {
        label: string;
        description: string;
        category: string;
    };
}

const PERMISSION_ICONS: Record<string, LucideIcon> = {
    canSearchLeads: Search,
    canViewAllLeads: Database,
    canViewOwnLeads: Database,
    canManageLeads: Layers,
    canAssignLeads: Users,
    canImportLeads: FileSpreadsheet,
    canExportLeads: FileSpreadsheet,
    canViewCRM: Kanban,
    canMoveCards: Kanban,
    canManageStages: Kanban,
    canViewChat: MessageSquare,
    canSendMessage: MessageSquare,
    canDeleteMessages: MessageSquare,
    canViewAllChats: MessageSquare,
    canManageConnections: MessageSquare,
    canUseOwnWhatsApp: MessageSquare,
    canViewDashboard: TrendingUp,
    canViewCosts: TrendingUp,
    canViewSystemLogs: Activity,
    canManageSettings: Settings,
    canManageIntegrations: Sliders,
    canManageUsers: Users,
    canManageGroups: Shield,
    canManageFolders: Layers,
    canViewPersonal: UserCheck,
    canManageTasks: FileText,
    canManageGoals: TrendingUp,
    canViewMonitoring: Activity,
};

export function PermissionPreviewPanel({
    permissionKey,
    permissionInfo,
}: PermissionPreviewPanelProps) {
    const label = permissionInfo?.label || permissionKey;
    const description = permissionInfo?.description || 'Controle de permissão de acesso';
    const category = permissionInfo?.category || 'Geral';
    const Icon = PERMISSION_ICONS[permissionKey] || Shield;

    // Determine which preview component to show
    const renderPreviewContent = () => {
        switch (permissionKey) {
            case 'canSearchLeads':
                return <SearchLeadsPreview />;

            case 'canMoveCards':
            case 'canViewCRM':
            case 'canManageStages':
                return <MoveCardsPreview />;

            case 'canAssignLeads':
                return <AssignLeadsPreview />;

            case 'canExportLeads':
            case 'canImportLeads':
                return <ExportLeadsPreview />;

            case 'canViewChat':
            case 'canSendMessage':
            case 'canUseOwnWhatsApp':
            case 'canViewAllChats':
                return <WhatsAppChatPreview />;

            default:
                const riskLevel = ['canManageUsers', 'canManageGroups', 'canManageSettings', 'canManageIntegrations'].includes(permissionKey)
                    ? 'high'
                    : ['canManageLeads', 'canViewCosts', 'canViewSystemLogs'].includes(permissionKey)
                    ? 'medium'
                    : 'low';

                return (
                    <GenericPermissionPreview
                        label={label}
                        description={description}
                        category={category}
                        icon={Icon}
                        riskLevel={riskLevel}
                    />
                );
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-card/50 border border-border/80 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm">
            {/* Window Chrome Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-secondary/40 border-b border-border/60">
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>

                {/* Title badge */}
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-foreground font-semibold">{label}</span>
                </div>

                {/* Live Simulation Indicator */}
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-medium tracking-wide uppercase">
                        Ao Vivo
                    </span>
                </div>
            </div>

            {/* Dynamic Content Container */}
            <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-background/40 to-background/90">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={permissionKey}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="w-full h-full"
                    >
                        {renderPreviewContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer status caption */}
            <div className="px-3.5 py-2 bg-secondary/30 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Passe o cursor sobre qualquer permissão à esquerda para pré-visualizar.</span>
                <span className="font-mono text-[9px] text-primary/80 font-medium">React Mockup</span>
            </div>
        </div>
    );
}
