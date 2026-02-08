import { useState } from 'react';
import { Lead } from '@/types/lead';
import { MapPin, Phone, Mail, Eye, UserPlus, User, Building2, X, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface KanbanCardProps {
    lead: Lead;
    isDragging: boolean;
    onView: () => void;
    onAssign?: () => void;
}

const KanbanCard = ({ lead, isDragging, onView, onAssign }: KanbanCardProps) => {
    const [isImageOpen, setIsImageOpen] = useState(false);
    const navigate = useNavigate();

    const handleChatClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!lead.phone) return;

        // Clean phone and format chatId
        const cleanPhone = lead.phone.replace(/\D/g, '');
        // Assume 55 if not present and length suggests it (optional, but backend controller does similar)
        // Let's stick to simple "if missing, add it" or Just use what we have if backend is robust.
        // Controller looks for `chatId` using IN clause with variations.
        // Safe bet: Default to 55 prefix if 10-11 digits.
        let fullPhone = cleanPhone;
        if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
            fullPhone = `55${cleanPhone}`;
        }

        const chatId = `${fullPhone}@c.us`;
        navigate(`/conversas?chatId=${chatId}&name=${encodeURIComponent(lead.name)}&phone=${lead.phone}`);
    };

    const getProgressColor = (value: number) => {
        if (value >= 80) return 'bg-green-500';
        if (value >= 50) return 'bg-orange-500';
        return 'bg-red-500';
    };

    // Check if lead has a responsible user assigned
    const responsible = (lead as any).responsible;
    const hasResponsible = responsible?.id;

    return (
        <>
            <div
                className={`bg-card/80 backdrop-blur-sm border border-border/30 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all ${isDragging ? 'shadow-lg shadow-primary/20 border-primary/50 rotate-2' : 'hover:border-primary/30'
                    }`}
            >
                {/* Header with Photo */}
                <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                        {/* Photo Thumbnail */}
                        <div
                            className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (lead.photoUrl) setIsImageOpen(true);
                            }}
                        >
                            {lead.photoUrl ? (
                                <img
                                    src={lead.photoUrl}
                                    alt={lead.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                            ) : null}
                            <Building2 className={`w-5 h-5 text-muted-foreground ${lead.photoUrl ? 'hidden' : ''}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground text-sm truncate pr-1">{lead.name}</h4>
                            <div className="flex flex-wrap gap-1">
                                {Array.isArray((lead as any).tags) && (lead as any).tags.map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons - Fixed width to prevent jumping */}
                    <div className="flex items-start gap-1 flex-shrink-0">
                        {onAssign && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAssign();
                                }}
                                className={`w-6 h-6 rounded flex items-center justify-center transition-all ${hasResponsible
                                    ? 'text-primary bg-primary/10 hover:bg-primary/20'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                    }`}
                                title={hasResponsible ? `Atribuído a ${responsible?.name || responsible?.email}` : 'Atribuir vendedor'}
                            >
                                {hasResponsible ? <User className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                            </button>
                        )}
                        <button
                            onClick={handleChatClick}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-all ${lead.phone
                                ? 'text-muted-foreground hover:text-green-500 hover:bg-green-500/10'
                                : 'text-muted-foreground/30 cursor-not-allowed'}`}
                            title={lead.phone ? "Abrir conversa" : "Sem telefone"}
                            disabled={!lead.phone}
                        >
                            <MessageCircle className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onView();
                            }}
                            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                        >
                            <Eye className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Responsible badge */}
                {hasResponsible && (
                    <div className="mb-2 flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full w-fit">
                        <User className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{responsible?.name || responsible?.email}</span>
                    </div>
                )}

                {/* Info */}
                <div className="space-y-1 text-xs text-muted-foreground">
                    {lead.phone && (
                        <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3" />
                            <span className="truncate">{lead.phone}</span>
                        </div>
                    )}
                    {lead.email && (
                        <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{lead.email}</span>
                        </div>
                    )}
                    {lead.address && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{lead.address}</span>
                        </div>
                    )}
                </div>

                {/* Chance de Acerto */}
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Acerto</span>
                        <span className="font-medium text-foreground">{lead.successChance}%</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getProgressColor(lead.successChance)} transition-all`}
                            style={{ width: `${lead.successChance}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Full Screen Image Dialog */}
            <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
                    <div className="relative">
                        <button
                            onClick={() => setIsImageOpen(false)}
                            className="absolute -top-10 right-0 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        {lead.photoUrl && (
                            <img
                                src={lead.photoUrl}
                                alt={lead.name}
                                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default KanbanCard;
