import { Lead, Stage } from '@/types/lead';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';

interface LeadsTableProps {
    leads: Lead[];
    stages: Stage[];
    onViewLead: (lead: Lead) => void;
    onEditLead: (lead: Lead) => void;
    onDeleteLead: (lead: Lead) => void;
}

const LeadsTable = ({ leads, stages, onViewLead, onEditLead, onDeleteLead }: LeadsTableProps) => {
    const getStage = (stageId?: string) => stages.find(s => s.id === stageId);

    const getProgressColor = (value: number) => {
        if (value >= 80) return 'text-green-500';
        if (value >= 50) return 'text-orange-500';
        return 'text-red-500';
    };

    return (
        <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl overflow-x-auto">
            <div className="min-w-[800px]">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border/30 hover:bg-transparent">
                            <TableHead className="text-muted-foreground">Nome</TableHead>
                            <TableHead className="text-muted-foreground">Contato</TableHead>
                            <TableHead className="text-muted-foreground">Etapa</TableHead>
                            <TableHead className="text-muted-foreground">Categoria</TableHead>
                            <TableHead className="text-muted-foreground text-center">Acerto</TableHead>
                            <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map((lead) => {
                            const stage = getStage(lead.stageId);
                            return (
                                <TableRow key={lead.id} className="border-border/30">
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-foreground">{lead.name}</p>
                                            {lead.address && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate max-w-[200px]">{lead.address}</span>
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1 text-sm">
                                            {lead.phone && (
                                                <p className="text-muted-foreground flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {lead.phone}
                                                </p>
                                            )}
                                            {lead.email && (
                                                <p className="text-muted-foreground flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {lead.email}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {stage && (
                                            <span
                                                className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${stage.color}20`,
                                                    color: stage.color
                                                }}
                                            >
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: stage.color }}
                                                />
                                                {stage.name}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {(lead.tags || []).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={`font-medium ${getProgressColor(lead.successChance)}`}>
                                            {lead.successChance}%
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => onViewLead(lead)}
                                                className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEditLead(lead)}
                                                className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteLead(lead)}
                                                className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default LeadsTable;
