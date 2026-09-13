import { useState, useEffect } from 'react';
import { CyberRadarLoader } from '@/components/ui/CyberRadarLoader';
import { accessGroups as accessGroupsApi, users as usersApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, Edit2, Plus, Shield, Users, Check, X, UserPlus, UserMinus, Search, Database, Kanban, MessageSquare, UserCheck, Sliders, ShieldCheck, type LucideIcon } from 'lucide-react';
import { PermissionPreviewPanel } from './access-control/PermissionPreviewPanel';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarUrl } from "@/utils/media";

interface Permission {
    id: string;
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

interface User {
    id: string;
    name: string | null;
    email: string;
    avatar?: string | null;
    role?: string;
    accessGroupId?: string | null;
}

interface AccessGroup {
    id: string;
    name: string;
    description: string | null;
    permissions: Permission | null;
    users: User[];
    createdAt: string;
}

const DEFAULT_PERMISSIONS: Omit<Permission, 'id'> = {
    canSearchLeads: false,
    canViewAllLeads: false,
    canViewOwnLeads: true,
    canManageLeads: false,
    canDeleteLeads: false,
    canAssignLeads: false,
    canImportLeads: false,
    canExportLeads: false,
    canViewCRM: true,
    canMoveCards: true,
    canManageStages: false,
    canBulkActions: false,
    canViewDashboard: true,
    canViewAnalytics: false,
    canViewCosts: false,
    canViewChat: false,
    canSendMessage: false,
    canSendMedia: false,
    canDeleteMessages: false,
    canViewAllChats: false,
    canManageConnections: false,
    canManageUsers: false,
    canManageGroups: false,
    canManageFolders: false,
    canViewSystemLogs: false,
    canManageSettings: false,
    canManageIntegrations: false,
    canViewPersonal: true,
    canManageTasks: true,
    canManageGoals: true,
    canViewMonitoring: false,
    canUseOwnWhatsApp: false,
};

const PERMISSION_LABELS: Record<string, { label: string; description: string; category: string }> = {
    // Leads
    canSearchLeads: { label: 'Pesquisar Leads', description: 'Pode pesquisar novos leads na API do Google', category: 'leads' },
    canViewAllLeads: { label: 'Ver Todos Leads', description: 'Pode visualizar todos os leads do sistema', category: 'leads' },
    canViewOwnLeads: { label: 'Ver Próprios Leads', description: 'Pode ver apenas leads atribuídos a si', category: 'leads' },
    canManageLeads: { label: 'Gerenciar Leads', description: 'Pode criar e editar dados de leads', category: 'leads' },
    canDeleteLeads: { label: 'Excluir Leads', description: 'Pode remover leads definitivamente do sistema', category: 'leads' },
    canAssignLeads: { label: 'Atribuir Leads', description: 'Pode atribuir leads a vendedores', category: 'leads' },
    canImportLeads: { label: 'Importar Leads', description: 'Pode importar leads via CSV/Excel', category: 'leads' },
    canExportLeads: { label: 'Exportar Leads', description: 'Pode exportar leads para CSV/Excel', category: 'leads' },

    // CRM
    canViewCRM: { label: 'Acessar CRM', description: 'Pode visualizar o módulo CRM', category: 'crm' },
    canMoveCards: { label: 'Mover Cards', description: 'Pode mover cards entre colunas', category: 'crm' },
    canManageStages: { label: 'Gerenciar Etapas', description: 'Pode criar e editar funis e etapas', category: 'crm' },
    canBulkActions: { label: 'Ações em Massa', description: 'Pode executar ações em lote com múltiplos cards', category: 'crm' },

    // Chat
    canViewChat: { label: 'Acessar Chat', description: 'Pode usar o chat WhatsApp', category: 'chat' },
    canSendMessage: { label: 'Enviar Mensagens', description: 'Pode enviar mensagens de texto pelo chat', category: 'chat' },
    canSendMedia: { label: 'Enviar Áudios e Mídia', description: 'Pode enviar mensagens de voz, imagens e arquivos', category: 'chat' },
    canDeleteMessages: { label: 'Apagar Mensagens', description: 'Pode apagar mensagens do histórico', category: 'chat' },
    canViewAllChats: { label: 'Ver Todos Chats', description: 'Pode ver chats de outros usuários', category: 'chat' },
    canManageConnections: { label: 'Gerenciar Conexões', description: 'Pode conectar/desconectar WhatsApp', category: 'chat' },
    canUseOwnWhatsApp: { label: 'WhatsApp Próprio', description: 'Pode conectar sua própria conta do WhatsApp', category: 'chat' },

    // Modules/System
    canViewDashboard: { label: 'Acessar Dashboard', description: 'Pode visualizar o dashboard', category: 'system' },
    canViewAnalytics: { label: 'Acessar Análises', description: 'Pode visualizar métricas e taxas de conversão', category: 'system' },
    canViewCosts: { label: 'Ver Custos', description: 'Pode visualizar custos de API', category: 'system' },
    canViewSystemLogs: { label: 'Ver Logs', description: 'Pode visualizar logs do sistema', category: 'system' },
    canManageSettings: { label: 'Configurações', description: 'Pode alterar configurações gerais', category: 'system' },
    canManageIntegrations: { label: 'Integrações', description: 'Pode gerenciar integrações externas', category: 'system' },

    // Admin
    canManageUsers: { label: 'Gerenciar Usuários', description: 'Pode criar e editar usuários', category: 'admin' },
    canManageGroups: { label: 'Gerenciar Grupos', description: 'Pode criar e editar grupos de acesso', category: 'admin' },
    canManageFolders: { label: 'Gerenciar Pastas', description: 'Pode criar e organizar pastas', category: 'admin' },

    // Personal
    canViewPersonal: { label: 'Módulo Pessoal', description: 'Acesso à área pessoal', category: 'personal' },
    canManageTasks: { label: 'Gerenciar Tarefas', description: 'Pode criar e editar tarefas', category: 'personal' },
    canManageGoals: { label: 'Gerenciar Metas', description: 'Pode criar e editar metas', category: 'personal' },
    canViewMonitoring: { label: 'Monitoramento', description: 'Acesso ao monitoramento (Admin)', category: 'personal' },
};

export function AccessGroups() {
    const [groups, setGroups] = useState<AccessGroup[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
    const [usersDialogOpen, setUsersDialogOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<AccessGroup | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [permissions, setPermissions] = useState<Omit<Permission, 'id'>>(DEFAULT_PERMISSIONS);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [hoveredPermission, setHoveredPermission] = useState<string>('canSearchLeads');

    const fetchGroups = async () => {
        try {
            const data = await accessGroupsApi.getAll();
            setGroups(data);
        } catch (error) {
            console.error('Error fetching groups:', error);
            toast.error('Erro ao carregar grupos de acesso');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const data = await usersApi.getAll();
            setAllUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchGroups();
        fetchAllUsers();
    }, []);

    const handleOpenDialog = (group?: AccessGroup) => {
        if (group) {
            setSelectedGroup(group);
            setFormData({ name: group.name, description: group.description || '' });
        } else {
            setSelectedGroup(null);
            setFormData({ name: '', description: '' });
        }
        setDialogOpen(true);
    };

    const handleOpenPermissionDialog = (group: AccessGroup) => {
        setSelectedGroup(group);
        setHoveredPermission('canSearchLeads');
        if (group.permissions) {
            const { id, ...rest } = group.permissions;
            setPermissions(rest);
        } else {
            setPermissions(DEFAULT_PERMISSIONS);
        }
        setPermissionDialogOpen(true);
    };

    const handleOpenUsersDialog = (group: AccessGroup) => {
        setSelectedGroup(group);
        setUserSearchQuery('');
        setUsersDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedGroup) {
                await accessGroupsApi.update(selectedGroup.id, formData);
            } else {
                await accessGroupsApi.create(formData);
            }

            toast.success(selectedGroup ? 'Grupo atualizado!' : 'Grupo criado!');
            setDialogOpen(false);
            fetchGroups();
        } catch (error) {
            console.error('Error saving group:', error);
            toast.error('Erro ao salvar grupo');
        }
    };

    const handleSavePermissions = async () => {
        if (!selectedGroup) return;
        try {
            await accessGroupsApi.updatePermissions(selectedGroup.id, permissions);

            toast.success('Permissões atualizadas!');
            setPermissionDialogOpen(false);
            fetchGroups();
        } catch (error) {
            console.error('Error saving permissions:', error);
            toast.error('Erro ao salvar permissões');
        }
    };

    const handleAddUserToGroup = async (userId: string) => {
        if (!selectedGroup) return;
        try {
            await accessGroupsApi.addUser(selectedGroup.id, userId);

            toast.success('Usuário adicionado ao grupo!');
            fetchGroups();
            fetchAllUsers();
        } catch (error) {
            console.error('Error adding user:', error);
            toast.error('Erro ao adicionar usuário');
        }
    };

    const handleRemoveUserFromGroup = async (userId: string) => {
        if (!selectedGroup) return;
        try {
            await accessGroupsApi.removeUser(selectedGroup.id, userId);

            toast.success('Usuário removido do grupo!');
            fetchGroups();
            fetchAllUsers();
        } catch (error) {
            console.error('Error removing user:', error);
            toast.error('Erro ao remover usuário');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este grupo?')) return;
        try {
            await accessGroupsApi.delete(id);

            toast.success('Grupo excluído!');
            fetchGroups();
        } catch (error) {
            console.error('Error deleting group:', error);
            toast.error('Erro ao excluir grupo');
        }
    };

    const getInitials = (name: string | null, email: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return email.slice(0, 2).toUpperCase();
    };

    // Users in current group
    const groupUserIds = selectedGroup?.users.map(u => u.id) || [];

    // Filter users for search
    const filteredUsers = allUsers.filter(user =>
    (user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
    );

    // Separate users into in-group and available
    const usersInGroup = filteredUsers.filter(u => u.accessGroupId === selectedGroup?.id);
    const usersAvailable = filteredUsers.filter(u => !u.accessGroupId || u.accessGroupId !== selectedGroup?.id);

    const renderPermissionSection = (category: string, title: string, Icon: LucideIcon) => {
        const categoryPermissions = Object.entries(PERMISSION_LABELS)
            .filter(([_, info]) => info.category === category);

        return (
            <div className="space-y-2">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pb-1">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    <span>{title}</span>
                </h4>
                <div className="space-y-1">
                    {categoryPermissions.map(([key, info]) => {
                        const isHovered = hoveredPermission === key;
                        return (
                            <div
                                key={key}
                                onMouseEnter={() => setHoveredPermission(key)}
                                onClick={() => setHoveredPermission(key)}
                                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all cursor-pointer ${
                                    isHovered
                                        ? 'bg-primary/15 border border-primary/40 shadow-sm'
                                        : 'hover:bg-secondary/60 border border-transparent'
                                }`}
                            >
                                <div className="flex-1 pr-2">
                                    <Label htmlFor={key} className="font-medium text-xs cursor-pointer block">{info.label}</Label>
                                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{info.description}</p>
                                </div>
                                <Checkbox
                                    id={key}
                                    checked={permissions[key as keyof typeof permissions]}
                                    onCheckedChange={(checked) =>
                                        setPermissions(prev => ({ ...prev, [key]: !!checked }))
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <CyberRadarLoader size="md" label="CARREGANDO..." />
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Grupos de Acesso</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Gerencie grupos e permissões de usuários</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Novo Grupo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {selectedGroup ? 'Editar Grupo' : 'Novo Grupo de Acesso'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Nome do Grupo</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ex: Vendedores"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Descrição</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Descrição do grupo..."
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    {selectedGroup ? 'Salvar' : 'Criar'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Groups Grid */}
            {groups.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Shield className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Nenhum grupo criado</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Crie grupos de acesso para organizar as permissões dos usuários
                        </p>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Criar Primeiro Grupo
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map(group => (
                        <Card key={group.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                            <Shield className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{group.name}</CardTitle>
                                            <CardDescription className="line-clamp-1">
                                                {group.description || 'Sem descrição'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Users in group */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    <span>{group.users.length} usuário(s)</span>
                                </div>

                                {/* User avatars */}
                                {group.users.length > 0 && (
                                    <div className="flex -space-x-2">
                                        {group.users.slice(0, 5).map(user => {
                                            const avatarUrl = getUserAvatarUrl(user.avatar);
                                            return (
                                                <Avatar key={user.id} className="w-8 h-8 border-2 border-background shadow-sm">
                                                    {avatarUrl && (
                                                        <AvatarImage
                                                            src={avatarUrl}
                                                            alt={user.name || user.email}
                                                            className="object-cover"
                                                        />
                                                    )}
                                                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                                                        {getInitials(user.name, user.email)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            );
                                        })}
                                        {group.users.length > 5 && (
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                                +{group.users.length - 5}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Permission badges */}
                                <div className="flex flex-wrap gap-1">
                                    {group.permissions && (
                                        <>
                                            {group.permissions.canSearchLeads && (
                                                <Badge variant="secondary" className="text-xs">Pesquisar</Badge>
                                            )}
                                            {group.permissions.canAssignLeads && (
                                                <Badge variant="secondary" className="text-xs">Atribuir</Badge>
                                            )}
                                            {group.permissions.canManageUsers && (
                                                <Badge variant="secondary" className="text-xs">Usuários</Badge>
                                            )}
                                            {group.permissions.canViewCosts && (
                                                <Badge variant="secondary" className="text-xs">Custos</Badge>
                                            )}
                                        </>
                                    )}
                                </div>

                                <Separator />

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 gap-1"
                                        onClick={() => handleOpenUsersDialog(group)}
                                    >
                                        <UserPlus className="w-3 h-3" />
                                        Usuários
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 gap-1"
                                        onClick={() => handleOpenPermissionDialog(group)}
                                    >
                                        <Shield className="w-3 h-3" />
                                        Permissões
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleOpenDialog(group)}
                                    >
                                        <Edit2 className="w-3 h-3 mr-1" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() => handleDelete(group.id)}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Permission Dialog */}
            <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
                <DialogContent className="max-w-5xl max-h-[88vh] flex flex-col p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <span>Permissões: {selectedGroup?.name}</span>
                        </DialogTitle>
                    </DialogHeader>

                    {/* Split View */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-2 flex-1 min-h-0 overflow-hidden">
                        {/* Left Column: Permissions List */}
                        <div className="lg:col-span-7 overflow-y-auto max-h-[58vh] pr-2 space-y-4">
                            {renderPermissionSection('leads', 'Leads & Dados', Database)}
                            <Separator />
                            {renderPermissionSection('crm', 'CRM & Vendas', Kanban)}
                            <Separator />
                            {renderPermissionSection('chat', 'Chat & WhatsApp', MessageSquare)}
                            <Separator />
                            {renderPermissionSection('personal', 'Pessoal & Monitoramento', UserCheck)}
                            <Separator />
                            {renderPermissionSection('system', 'Sistema & Módulos', Sliders)}
                            <Separator />
                            {renderPermissionSection('admin', 'Administração', ShieldCheck)}
                        </div>

                        {/* Right Column: Interactive Code Mockup Live Preview */}
                        <div className="hidden lg:flex lg:col-span-5 h-[58vh] flex-col">
                            <PermissionPreviewPanel
                                permissionKey={hoveredPermission}
                                permissionInfo={PERMISSION_LABELS[hoveredPermission]}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t">
                        <Button variant="outline" onClick={() => setPermissionDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSavePermissions} className="gap-2">
                            <Check className="w-4 h-4" />
                            Salvar Permissões
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Users Management Dialog */}
            <Dialog open={usersDialogOpen} onOpenChange={setUsersDialogOpen}>
                <DialogContent className="max-w-lg max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Usuários: {selectedGroup?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar usuários..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <ScrollArea className="h-96">
                        {/* Users in group */}
                        {usersInGroup.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                    No Grupo ({usersInGroup.length})
                                </h4>
                                <div className="space-y-1">
                                    {usersInGroup.map(user => {
                                        const avatarUrl = getUserAvatarUrl(user.avatar);
                                        return (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
                                            >
                                                <Avatar className="w-10 h-10 border border-primary/30 shrink-0">
                                                    {avatarUrl && (
                                                        <AvatarImage
                                                            src={avatarUrl}
                                                            alt={user.name || user.email}
                                                            className="object-cover"
                                                        />
                                                    )}
                                                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                                        {getInitials(user.name, user.email)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-medium">{user.name || user.email}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRemoveUserFromGroup(user.id)}
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Available users */}
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                Disponíveis ({usersAvailable.length})
                            </h4>
                            {usersAvailable.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
                                    Nenhum usuário disponível
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {usersAvailable.map(user => {
                                        const avatarUrl = getUserAvatarUrl(user.avatar);
                                        return (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                                            >
                                                <Avatar className="w-10 h-10 border border-border/50 shrink-0">
                                                    {avatarUrl && (
                                                        <AvatarImage
                                                            src={avatarUrl}
                                                            alt={user.name || user.email}
                                                            className="object-cover"
                                                        />
                                                    )}
                                                    <AvatarFallback className="bg-muted font-semibold">
                                                        {getInitials(user.name, user.email)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-medium">{user.name || user.email}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {user.email}
                                                        {user.accessGroupId && (
                                                            <span className="ml-2 text-yellow-500">
                                                                (já em outro grupo)
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary hover:bg-primary/10"
                                                    onClick={() => handleAddUserToGroup(user.id)}
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="flex justify-end pt-4 border-t">
                        <Button variant="outline" onClick={() => setUsersDialogOpen(false)}>
                            Fechar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

