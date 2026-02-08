import { Lead, COMPANY_TYPES, COMPANY_SIZES, ACTIVITY_BRANCHES } from '@/types/lead';
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Edit2,
  Trash2,
  MessageSquare,
  Copy,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  Lightbulb,
  Building2,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onToggleContacted: (id: string, contacted: boolean) => void;
  onChatClick?: () => void;
}

export function LeadCard({ lead, onEdit, onDelete, onToggleContacted, onChatClick }: LeadCardProps) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const typeInfo = COMPANY_TYPES[lead.type] || COMPANY_TYPES['outros'];

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn(
      "bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-4 hover:border-primary/30 transition-all group animate-fade-in relative overflow-hidden",
      !lead.contacted && "shadow-[0_0_15px_-3px_rgba(255,215,0,0.3)] border-yellow-500/40 hover:border-yellow-500/60 hover:shadow-[0_0_20px_-3px_rgba(255,215,0,0.4)]"
    )}>
      {/* Contacted Overlay/Indicator - Moved to Top Left to avoid menu overlap */}
      {lead.contacted && (
        <div className="absolute top-0 left-0 p-2 z-10">
          <div className="bg-green-500/20 text-green-400 p-1.5 rounded-br-xl rounded-tl-xl backdrop-blur-md border-r border-b border-green-500/30">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Pending Response Indicator - Moved to Top Left */}
      {!lead.contacted && lead.status === 'Pendente Rsp.' && (
        <div className="absolute top-0 left-0 p-2 z-10">
          <div className="bg-yellow-500/20 text-yellow-400 p-1.5 rounded-br-xl rounded-tl-xl backdrop-blur-md border-r border-b border-yellow-500/30 animate-pulse">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3 pl-8">
        <div className="flex items-start gap-3 flex-1 pr-2">
          {/* Photo Thumbnail */}
          <div
            className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center border border-border/30 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
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
            <Building2 className={`w-6 h-6 text-muted-foreground ${lead.photoUrl ? 'hidden' : ''}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-foreground truncate">{lead.name}</h3>
              <span
                className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase"
                style={{ color: typeInfo.color, backgroundColor: `${typeInfo.color}20` }}
              >
                {typeInfo.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{lead.location}</span>
              </div>
              <span>•</span>
              <span>{COMPANY_SIZES[lead.size]}</span>
              <span>•</span>
              <span>{ACTIVITY_BRANCHES[lead.activityBranch]}</span>
            </div>
          </div>
        </div>

        {/* Actions - Top Right */}
        <div className="flex items-center gap-1">
          {/* Direct Chat Button */}
          <button
            onClick={() => onChatClick && onChatClick()}
            className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            title="Abrir Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border backdrop-blur-xl">
              <DropdownMenuItem onClick={() => onChatClick && onChatClick()} className="cursor-pointer">
                <MessageSquare className="w-4 h-4 mr-2" />
                Conversar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleContacted(lead.id, !lead.contacted)} className="cursor-pointer">
                {lead.contacted ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                {lead.contacted ? 'Marcar como não contatado' : 'Marcar como contatado'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(lead)} className="cursor-pointer">
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(lead.id)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm mt-4">
        {lead.phone && (
          <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer group/link">
            <Phone className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
            <a href={`tel:${lead.phone}`}>{lead.phone}</a>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer group/link">
            <Mail className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
            <a href={`mailto:${lead.email}`}>{lead.email}</a>
          </div>
        )}
        {lead.website && (
          <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer group/link">
            <Globe className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
            <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="truncate">
              {lead.website}
            </a>
          </div>
        )}
        {lead.address && (
          <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer group/link">
            <MapPin className="w-4 h-4 flex-shrink-0 group-hover/link:scale-110 transition-transform" />
            <a
              href={lead.googlePlaceId
                ? `https://www.google.com/maps/place/?q=place_id:${lead.googlePlaceId}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="truncate"
            >
              {lead.address}
            </a>
          </div>
        )}
      </div>

      {/* Tips / Comments */}
      {lead.tips && (
        <div className="mt-3 flex items-start gap-2 text-xs bg-primary/10 text-primary p-2.5 rounded-lg border border-primary/20">
          <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{lead.tips}</span>
        </div>
      )}

      {/* Source */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <MapPin className="w-3 h-3 text-primary" />
        <span className="text-primary font-medium">Importado do Google Maps</span>
        {/* Assuming default source as we don't have source prop in Lead type explicitly shown in view_file but common in new design */}
      </div>

      {/* Chance de Acerto */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground font-medium">Chance de Acerto</span>
          <span className="font-bold text-foreground">{lead.successChance}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor(lead.successChance)} transition-all duration-1000 ease-out`}
            style={{ width: `${lead.successChance}%` }}
          />
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
    </div>
  );
}
