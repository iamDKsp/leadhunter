import { Lead, COMPANY_TYPES, COMPANY_SIZES, ACTIVITY_BRANCHES } from '@/types/lead';
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Edit2,
  Trash2,
  MessageSquare,
  CheckCircle,
  XCircle,
  MoreVertical,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const typeInfo = COMPANY_TYPES[lead.type] || COMPANY_TYPES['outros'];

  const getProgressColor = (chance: number) => {
    if (chance >= 70) return 'from-green-500 to-emerald-400';
    if (chance >= 40) return 'from-yellow-500 to-orange-400';
    return 'from-red-500 to-rose-400';
  };

  return (
    <div className="glass-card p-5 animate-fade-in hover:border-primary/30 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {lead.name}
            </h3>
            <span className={cn('lead-badge', `lead-badge-${typeInfo.color}`)}>
              {typeInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {lead.location}
            </span>
            <span>{COMPANY_SIZES[lead.size]}</span>
            <span>{ACTIVITY_BRANCHES[lead.activityBranch]}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* WhatsApp Action */}
          {onChatClick && (
            <button
              onClick={onChatClick}
              className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all hover:scale-110"
              title="Conversar no WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}

          {/* Contacted Status */}
          <button
            onClick={() => onToggleContacted(lead.id, !lead.contacted)}
            className={cn(
              'p-2 rounded-lg transition-all',
              lead.contacted
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
            title={lead.contacted ? 'Contatado' : 'Não contatado'}
          >
            {lead.contacted ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </button>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem onClick={() => onChatClick && onChatClick()} className="cursor-pointer">
                <MessageSquare className="w-4 h-4 mr-2" />
                Conversar
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

      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <a
          href={`tel:${lead.phone}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Phone className="w-4 h-4" />
          {lead.phone}
        </a>
        <a
          href={`mailto:${lead.email}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Mail className="w-4 h-4" />
          {lead.email}
        </a>
        {lead.website && (
          <a
            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors col-span-2"
          >
            <Globe className="w-4 h-4" />
            {lead.website}
          </a>
        )}
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <a
          href={lead.googlePlaceId
            ? `https://www.google.com/maps/place/?q=place_id:${lead.googlePlaceId}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary hover:underline transition-colors text-left"
        >
          {lead.address}
        </a>
      </div>

      {/* Tips */}
      {lead.tips && (
        <div className="flex items-start gap-2 text-sm bg-primary/10 text-primary p-3 rounded-lg mb-4">
          <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{lead.tips}</span>
        </div>
      )}

      {/* Success Chance */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Chance de Acerto</span>
          <span className="font-semibold text-foreground">{lead.successChance}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={cn('progress-bar-fill bg-gradient-to-r', getProgressColor(lead.successChance))}
            style={{ width: `${lead.successChance}%` }}
          />
        </div>
      </div>

      {/* Comments */}
      {lead.comments && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{lead.comments}</span>
          </div>
        </div>
      )}
    </div>
  );
}
