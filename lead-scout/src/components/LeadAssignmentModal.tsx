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

interface Seller {
    id: string;
    name: string | null;
    email: string;
    role: string;
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
    currentResponsibleId?: string | null;
    onAssigned?: () => void;
}

export function LeadAssignmentModal({
    open,
    onOpenChange,
    leadId,
    leadIds,
    leadName,
    currentResponsibleId,
    onAssigned
}: LeadAssignmentModalProps) {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    const fetchSellers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/leads/sellers/list`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch sellers');
            const data = await response.json();
            setSellers(data);
        } catch (error) {
            console.error('Error fetching sellers:', error);
            toast.error('Erro ao carregar vendedores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchSellers();
            setSelectedSellerId(currentResponsibleId || null);
            setSearchQuery('');
        }
    }, [open, currentResponsibleId]);

    const handleAssign = async () => {
        if (!selectedSellerId) {
            toast.error('Selecione um vendedor');
            return;
        }

        setAssigning(true);
        try {
            let response;

            if (leadIds && leadIds.length > 0) {
                // Bulk assignment
                response = await fetch(`${API_URL}/leads/bulk-assign`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ leadIds, userId: selectedSellerId })
                });
            } else if (leadId) {
                // Single assignment
                response = await fetch(`${API_URL}/leads/${leadId}/assign`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ userId: selectedSellerId })
                });
            } else {
                throw new Error('No lead specified');
            }

            if (!response.ok) throw new Error('Failed to assign lead');

            const count = leadIds?.length || 1;
            toast.success(`${count} lead(s) atribuído(s) com sucesso!`);
            onOpenChange(false);
            onAssigned?.();
        } catch (error) {
            console.error('Error assigning lead:', error);
            toast.error('Erro ao atribuir lead');
        } finally {
            setAssigning(false);
        }
    };

    const handleUnassign = async () => {
        if (!leadId) return;

        setAssigning(true);
        try {
            const response = await fetch(`${API_URL}/leads/${leadId}/assign`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to unassign lead');

            toast.success('Lead desatribuído com sucesso!');
            onOpenChange(false);
            onAssigned?.();
        } catch (error) {
            console.error('Error unassigning lead:', error);
            toast.error('Erro ao desatribuir lead');
        } finally {
            setAssigning(false);
        }
    };

    const filteredSellers = sellers.filter(seller =>
    (seller.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seller.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getInitials = (name: string | null, email: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return email.slice(0, 2).toUpperCase();
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return <Badge variant="default" className="bg-yellow-500/20 text-yellow-500 text-xs">Super Admin</Badge>;
            case 'ADMIN':
                return <Badge variant="secondary" className="text-xs">Admin</Badge>;
            default:
                return <Badge variant="outline" className="text-xs">Vendedor</Badge>;
        }
    };

    const isBulk = leadIds && leadIds.length > 1;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        {isBulk
                            ? `Atribuir ${leadIds.length} Leads`
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
                                    <Avatar className="w-10 h-10">
                                        <AvatarFallback className="bg-primary/20 text-primary">
                                            {getInitials(seller.name, seller.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium">{seller.name || seller.email}</p>
                                        <p className="text-xs text-muted-foreground">{seller.email}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {getRoleBadge(seller.role)}
                                        <span className="text-xs text-muted-foreground">
                                            {seller._count.assignedLeads} leads
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
