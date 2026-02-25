import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, ShieldAlert, Trash2, X } from 'lucide-react';
import { Stage } from '@/types/lead';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import api from '@/services/api';
import { useEffect } from 'react';

interface BulkActionsToolbarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onBulkAssign: (userId: string) => void;
    onBulkMove: (stageId: string) => void;
    onBulkDelete: () => void;
    stages: Stage[];
}

export function BulkActionsToolbar({
    selectedCount,
    onClearSelection,
    onBulkAssign,
    onBulkMove,
    onBulkDelete,
    stages
}: BulkActionsToolbarProps) {
    const [users, setUsers] = useState<{ id: string, name: string, email: string }[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/auth/users');
                setUsers(response.data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };
        fetchUsers();
    }, []);

    if (selectedCount === 0) return null;

    return (
        <div className="bg-card border border-border/50 rounded-lg p-2 flex items-center justify-between gap-4 mb-4 shadow-lg animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onClearSelection} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{selectedCount} selecionado(s)</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
                {/* Bulk Assign */}
                <div className="flex items-center bg-secondary/50 rounded-md p-1 min-w-max">
                    <Select onValueChange={onBulkAssign}>
                        <SelectTrigger className="h-8 bg-transparent border-none focus:ring-0 w-[140px] text-xs">
                            <SelectValue placeholder="Atribuir a..." />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Bulk Move */}
                <div className="flex items-center bg-secondary/50 rounded-md p-1 min-w-max">
                    <Select onValueChange={onBulkMove}>
                        <SelectTrigger className="h-8 bg-transparent border-none focus:ring-0 w-[140px] text-xs">
                            <SelectValue placeholder="Mover para..." />
                        </SelectTrigger>
                        <SelectContent>
                            {stages.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 min-w-max"
                    onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir ${selectedCount} lead(s)?`)) {
                            onBulkDelete();
                        }
                    }}
                >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Excluir
                </Button>
            </div>
        </div>
    );
}
