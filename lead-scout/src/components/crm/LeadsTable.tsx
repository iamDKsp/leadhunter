import { Lead, Stage } from '@/types/lead';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Trash2, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface LeadsTableProps {
    leads: Lead[];
    stages: Stage[];
    onViewLead: (lead: Lead) => void;
    onEditLead: (lead: Lead) => void;
    onDeleteLead: (lead: Lead) => void;
}

const LeadsTable = ({ leads, stages, onViewLead, onEditLead, onDeleteLead }: LeadsTableProps) => {
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const getStage = (stageId?: string) => stages.find(s => s.id === stageId);

    const handleChatClick = (lead: Lead) => {
        if (!lead.phone) return;
        const cleanPhone = lead.phone.replace(/\D/g, '');
        let fullPhone = cleanPhone;
        if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
            fullPhone = `55${cleanPhone}`;
        }
        const chatId = `${fullPhone}@c.us`;
        navigate(`/conversas?chatId=${chatId}&name=${encodeURIComponent(lead.name)}&phone=${lead.phone}`);
    };

    const getProgressColor = (value: number) => {
        if (value >= 80) return 'text-green-500';
        if (value >= 50) return 'text-orange-500';
        return 'text-red-500';
    };

    if (isMobile) {
        return (
            <div className="space-y-4 pb-20">
                {leads.map((lead) => {
                    const stage = getStage(lead.stageId);
                    return (
                        <Card key={lead.id} className="bg-card/60 backdrop-blur-sm border-border/30 overflow-hidden">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="space-y-1 overflow-hidden">
                                        <h3 className="font-semibold text-foreground truncate text-lg pr-2">{lead.name}</h3>
                                        {stage && (
                                            <span
                                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${stage.color}20`,
                                                    color: stage.color
                                                }}
                                            >
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{ backgroundColor: stage.color }}
                                                />
                                                {stage.name}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`font-bold text-sm bg-background/50 px-2 py-1 rounded-md border border-border/20 ${getProgressColor(lead.successChance)}`}>
                                        {lead.successChance}%
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-muted-foreground pt-1">
                                    {lead.address && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{lead.address}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-3">
                                        {lead.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 shrink-0" />
                                                <span>{lead.phone}</span>
                                            </div>
                                        )}
                                        {lead.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 shrink-0" />
                                                <span className="truncate max-w-[150px]">{lead.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {(lead.tags && lead.tags.length > 0) && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {lead.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground border border-border/10 uppercase tracking-wide"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-2 pt-2 mt-2 border-t border-border/20">
                                    <Button variant="ghost" size="sm" onClick={() => onViewLead(lead)} className="h-9 hover:bg-secondary/80">
                                        <Eye className="w-4 h-4 mr-2" />
                                        Ver
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleChatClick(lead)} disabled={!lead.phone} className="h-9 hover:bg-green-500/10 text-green-600">
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Chat
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => onEditLead(lead)} className="h-9 hover:bg-primary/10 text-primary">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => onDeleteLead(lead)} className="h-9 hover:bg-red-500/10 text-red-500">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    }

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
                                                onClick={() => handleChatClick(lead)}
                                                disabled={!lead.phone}
                                                className={`w-8 h-8 rounded flex items-center justify-center transition-all ${lead.phone
                                                    ? 'text-muted-foreground hover:text-green-500 hover:bg-green-500/10'
                                                    : 'text-muted-foreground/30 cursor-not-allowed'}`}
                                                title={lead.phone ? "Abrir conversa" : "Sem telefone"}
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </button>
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
