import { useState } from 'react';
import { CyberRadarLoader } from '@/components/ui/CyberRadarLoader';
import { useLeads } from '@/hooks/useLeads';
import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, UserPlus, Users } from 'lucide-react';
import { LeadAssignmentModal } from '@/components/LeadAssignmentModal';
import { toast } from 'sonner';
import { getMediaUrl, getCompanyInitials, getCompanyAvatarColor } from '@/utils/media';

export default function LeadManagement() {
    // Only fetch TRIAGE leads
    const { leads, refresh, isLoading } = useLeads('TRIAGE');

    // Assignment State
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isAssignOpen, setIsAssignOpen] = useState(false);

    // Multi-select State
    const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
    const [selectCount, setSelectCount] = useState<string>('');

    const handleSelectAmount = () => {
        const count = parseInt(selectCount, 10);
        if (isNaN(count) || count <= 0) {
            toast.error("Insira uma quantidade válida.");
            return;
        }
        if (count > leads.length) {
            toast.error(`Existem apenas ${leads.length} leads disponíveis.`);
            return;
        }

        const idsToSelect = leads.slice(0, count).map(l => l.id);
        setSelectedLeadIds(idsToSelect);
    };

    const handleAssignClick = (lead: Lead) => {
        setSelectedLead(lead);
        setIsAssignOpen(true);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedLeadIds(leads.map(l => l.id));
        } else {
            setSelectedLeadIds([]);
        }
    };

    const handleSelectOne = (leadId: string, checked: boolean) => {
        if (checked) {
            setSelectedLeadIds(prev => [...prev, leadId]);
        } else {
            setSelectedLeadIds(prev => prev.filter(id => id !== leadId));
        }
    };

    const handleBulkAssign = () => {
        if (selectedLeadIds.length === 0) {
            toast.error("Selecione pelo menos um lead.");
            return;
        }
        setSelectedLead(null); // Clear single selection
        setIsAssignOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <CyberRadarLoader size="lg" label="CARREGANDO LEADS..." />
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 h-full flex flex-col overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Triagem de Leads</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Gerencie leads recém-importados e atribua responsáveis.
                    </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min="1"
                            max={leads.length}
                            placeholder="Qtd..."
                            className="w-20 sm:w-24 h-9"
                            value={selectCount}
                            onChange={(e) => setSelectCount(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSelectAmount();
                            }}
                        />
                        <Button variant="secondary" size="sm" onClick={handleSelectAmount}>
                            Selecionar
                        </Button>
                    </div>
                    {selectedLeadIds.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                {selectedLeadIds.length} selecionado(s)
                            </span>
                            <Button onClick={handleBulkAssign} className="gap-2" size="sm">
                                <Users className="w-4 h-4" />
                                Atribuir
                            </Button>
                        </div>
                    )}
                    <Badge variant="secondary" className="text-sm sm:text-base px-3 py-1">
                        {leads.length} Pendentes
                    </Badge>
                </div>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col border-0 shadow-none bg-transparent">
                <CardContent className="p-0 flex-1 overflow-auto rounded-md border bg-card custom-scrollbar">
                    <Table className="min-w-[650px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Localização</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Nenhum lead aguardando triagem.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leads.map((lead) => (
                                    <TableRow key={lead.id} className="hover:bg-muted/50">
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedLeadIds.includes(lead.id)}
                                                onCheckedChange={(checked) => handleSelectOne(lead.id, checked as boolean)}
                                                aria-label={`Select ${lead.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {(() => {
                                                    const photo = getMediaUrl(lead.photoUrl);
                                                    return (
                                                        <div className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs border ${
                                                            photo ? 'bg-muted border-border/30' : getCompanyAvatarColor(lead.name)
                                                        }`}>
                                                            {photo ? (
                                                                <img
                                                                    src={photo}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        target.nextElementSibling?.classList.remove('hidden');
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <span className={photo ? 'hidden' : ''}>
                                                                {getCompanyInitials(lead.name)}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                                <span>{lead.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">{lead.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                <span className="truncate max-w-[200px]" title={lead.address}>{lead.address || lead.location}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{lead.phone}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleAssignClick(lead)}
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    <span className="sr-only">Atribuir</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <LeadAssignmentModal
                open={isAssignOpen}
                onOpenChange={setIsAssignOpen}
                leadId={selectedLead?.id}
                leadIds={selectedLead ? undefined : selectedLeadIds} // Pass bulk IDs if no single lead selected
                leadName={selectedLead?.name}
                currentResponsibleId={selectedLead?.responsibleId}
                newStatus="ACTIVE"
                onAssigned={() => {
                    refresh();
                    setSelectedLead(null);
                    setSelectedLeadIds([]); // Clear selection after assignment
                }}
            />
        </div>
    );
}
