import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UserPlus, Users, Search, Check, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import api, { users } from '@/services/api';

interface Seller {
    id: string;
    name: string | null;
    email: string;
    avatar?: string;
    role: string;
    customTag?: string | null;
    customTagColor?: string | null;
    _count: {
        assignedLeads: number;
    };
}

interface LeadAssignmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId?: string;
    leadIds?: string[];
    leadName?: string;
    currentResponsibleId?: string;
    onAssigned?: () => void;
    newStatus?: string;
}

export function LeadAssignmentModal({
    open,
    onOpenChange,
    leadId,
    leadIds,
    leadName,
    currentResponsibleId,
    onAssigned,
    newStatus
}: LeadAssignmentModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const ids = leadIds || (leadId ? [leadId] : []);
    const isBulk = ids.length > 1;

    useEffect(() => {
        if (open) {
            setSearchQuery('');
            setSelectedSellerId(currentResponsibleId || null);
            fetchSellers();
        }
    }, [open, currentResponsibleId]);

    const fetchSellers = async () => {
        setLoading(true);
        try {
            const data = await users.getAll();
            // Filter only sellers/admins if needed, or show all users
            // Assuming the API returns all users
            setSellers(data);
        } catch (error) {
            console.error("Failed to fetch sellers", error);
            toast.error("Erro ao carregar vendedores");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedSellerId || ids.length === 0) return;

        setAssigning(true);
        try {
            // Update each lead with the new responsibleId and optionally the new status
            await Promise.all(ids.map(id => {
                const payload: any = { responsibleId: selectedSellerId };
                if (newStatus) {
                    payload.status = newStatus;
                }
                return api.put(`/companies/${id}`, payload);
            }));

            toast.success(isBulk
                ? `${ids.length} leads atribuídos com sucesso!`
                : 'Lead atribuído com sucesso!'
            );

            onOpenChange(false);
            if (onAssigned) onAssigned();
        } catch (error) {
            console.error("Failed to assign lead", error);
            toast.error("Erro ao atribuir lead");
        } finally {
            setAssigning(false);
        }
    };

    const handleUnassign = async () => {
        if (ids.length === 0) return;

        setAssigning(true);
        try {
            await Promise.all(ids.map(id =>
                api.put(`/companies/${id}`, { responsibleId: null })
            ));

            toast.success('Atribuição removida com sucesso!');
            onOpenChange(false);
            if (onAssigned) onAssigned();
        } catch (error) {
            console.error("Failed to unassign lead", error);
            toast.error("Erro ao remover atribuição");
        } finally {
            setAssigning(false);
        }
    };


    const getInitials = (name: string | null, email: string) => {
        const source = name || email;
        return source
            .split(' ')
            .map((names) => names[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getRoleBadge = (seller: Seller) => {
        if (seller.customTag) {
            return (
                <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                        backgroundColor: `${seller.customTagColor || '#000000'}20`,
                        color: seller.customTagColor || '#000000',
                        borderColor: `${seller.customTagColor || '#000000'}50`
                    }}
                >
                    {seller.customTag}
                </Badge>
            );
        }

        switch (seller.role) {
            case 'SUPER_ADMIN':
                return <Badge variant="default" className="bg-yellow-500/20 text-yellow-500 text-xs">Super Admin</Badge>;
            case 'ADMIN':
                return <Badge variant="secondary" className="text-xs">Admin</Badge>;
            default:
                return <Badge variant="outline" className="text-xs">Vendedor</Badge>;
        }
    };

    const filteredSellers = sellers.filter(seller => {
        const searchLower = searchQuery.toLowerCase();
        return (
            (seller.name && seller.name.toLowerCase().includes(searchLower)) ||
            (seller.email && seller.email.toLowerCase().includes(searchLower))
        );
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        {isBulk
                            ? `Atribuir ${ids.length} Leads`
                            : `Atribuir Lead${leadName ? `: ${leadName}` : ''}`
                        }
                    </DialogTitle>
                </DialogHeader>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar vendedor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Sellers List */}
                <ScrollArea className="h-64">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredSellers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Users className="w-8 h-8 mb-2" />
                            <p>Nenhum vendedor encontrado</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredSellers.map(seller => (
                                <button
                                    key={seller.id}
                                    onClick={() => setSelectedSellerId(seller.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${selectedSellerId === seller.id
                                        ? 'bg-primary/20 border border-primary'
                                        : 'hover:bg-secondary border border-transparent'
                                        }`}
                                >
                                    <Avatar className="w-10 h-10 border border-border/50">
                                        {seller.avatar ? (
                                            <img
                                                src={seller.avatar.startsWith('http') || seller.avatar.startsWith('/')
                                                    ? `${seller.avatar.startsWith('/') ? import.meta.env.VITE_API_URL || 'http://localhost:3000' : ''}${seller.avatar}`
                                                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${seller.avatar}`}
                                                alt={seller.name || "Avatar"}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <AvatarFallback className="bg-primary/20 text-primary">
                                                {getInitials(seller.name, seller.email)}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium capitalize">{seller.name || seller.email}</p>
                                        <p className="text-xs text-muted-foreground">{seller.email}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {getRoleBadge(seller)}
                                        <span className="text-xs text-muted-foreground">
                                            {seller._count?.assignedLeads || 0} leads
                                        </span>
                                    </div>
                                    {selectedSellerId === seller.id && (
                                        <Check className="w-5 h-5 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                    {currentResponsibleId && !isBulk && (
                        <Button
                            variant="outline"
                            onClick={handleUnassign}
                            disabled={assigning}
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Remover
                        </Button>
                    )}
                    <div className="flex-1" />
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedSellerId || assigning}
                        className="gap-1"
                    >
                        {assigning ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background" />
                        ) : (
                            <Check className="w-4 h-4" />
                        )}
                        Atribuir
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
