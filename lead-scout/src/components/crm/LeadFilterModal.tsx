import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Stage } from '@/types/lead';
import { User } from '@/types/auth';
import { users } from '@/services/api';

export interface FilterState {
    stageId: string | 'all';
    responsibleId: string | 'all';
    successChanceMin: number;
    hasWebsite: boolean | 'all';
}

interface LeadFilterModalProps {
    open: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    currentFilters: FilterState;
    stages: Stage[];
    user?: User | undefined;
}

export function LeadFilterModal({
    open,
    onClose,
    onApply,
    currentFilters,
    stages,
    user
}: LeadFilterModalProps) {
    const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);
    const [usersList, setUsersList] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        setLocalFilters(currentFilters);
    }, [currentFilters, open]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await users.getAll();
                setUsersList(data);
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };
        if (open) {
            fetchUsers();
        }
    }, [open]);

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleReset = () => {
        const initialFilters: FilterState = {
            stageId: 'all',
            responsibleId: 'all',
            successChanceMin: 0,
            hasWebsite: 'all'
        };
        setLocalFilters(initialFilters);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle>Filtrar Leads</DialogTitle>
                    <DialogDescription>
                        Refine sua visualização de leads com os filtros abaixo.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Status / Stage */}
                    <div className="grid gap-2">
                        <Label htmlFor="stage" className="text-left">
                            Etapa do Pipeline
                        </Label>
                        <Select
                            value={localFilters.stageId}
                            onValueChange={(val) => setLocalFilters({ ...localFilters, stageId: val })}
                        >
                            <SelectTrigger id="stage" className="bg-secondary/50 border-input">
                                <SelectValue placeholder="Todas as etapas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as etapas</SelectItem>
                                {stages.map((stage) => (
                                    <SelectItem key={stage.id} value={stage.id}>
                                        {stage.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Responsible - Only for Admins or Permitted Users */}
                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.permissions?.canViewAllLeads) && (
                        <div className="grid gap-2">
                            <Label htmlFor="responsible" className="text-left">
                                Responsável
                            </Label>
                            <Select
                                value={localFilters.responsibleId}
                                onValueChange={(val) => setLocalFilters({ ...localFilters, responsibleId: val })}
                            >
                                <SelectTrigger id="responsible" className="bg-secondary/50 border-input">
                                    <SelectValue placeholder="Todos os responsáveis" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os responsáveis</SelectItem>
                                    <SelectItem value="unassigned" className="text-muted-foreground font-medium">Sem responsável</SelectItem>
                                    {usersList.map((u) => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Success Chance */}
                    <div className="grid gap-2">
                        <div className="flex justify-between">
                            <Label htmlFor="chance" className="text-left">
                                Chance de Sucesso Mínima
                            </Label>
                            <span className="text-sm text-muted-foreground">{localFilters.successChanceMin}%</span>
                        </div>
                        <Slider
                            id="chance"
                            min={0}
                            max={100}
                            step={5}
                            value={[localFilters.successChanceMin]}
                            onValueChange={(val) => setLocalFilters({ ...localFilters, successChanceMin: val[0] })}
                            className="py-4"
                        />
                    </div>

                    {/* Has Website */}
                    <div className="grid gap-2">
                        <Label htmlFor="website" className="text-left">
                            Possui Website?
                        </Label>
                        <Select
                            value={localFilters.hasWebsite === 'all' ? 'all' : (localFilters.hasWebsite ? 'yes' : 'no')}
                            onValueChange={(val) => {
                                let newValue: boolean | 'all' = 'all';
                                if (val === 'yes') newValue = true;
                                if (val === 'no') newValue = false;
                                setLocalFilters({ ...localFilters, hasWebsite: newValue });
                            }}
                        >
                            <SelectTrigger id="website" className="bg-secondary/50 border-input">
                                <SelectValue placeholder="Indiferente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Indiferente</SelectItem>
                                <SelectItem value="yes">Sim, possui</SelectItem>
                                <SelectItem value="no">Não possui</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button variant="ghost" onClick={handleReset}>
                        Limpar Filtros
                    </Button>
                    <Button onClick={handleApply}>Aplicar Filtros</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
