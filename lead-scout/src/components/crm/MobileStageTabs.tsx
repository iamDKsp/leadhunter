import React, { useRef, useEffect } from 'react';
import { Stage, Lead } from '@/types/lead';
import { Copy, Plus, ChevronRight } from 'lucide-react';
import { formatStageLeadsForWhatsApp, copyToClipboard } from '@/utils/leadExport';
import { toast } from 'sonner';

interface MobileStageTabsProps {
  stages: Stage[];
  leads: Lead[];
  activeStageId: string;
  onSelectStage: (stageId: string) => void;
  onOpenNewLead?: () => void;
}

export const MobileStageTabs: React.FC<MobileStageTabsProps> = ({
  stages,
  leads,
  activeStageId,
  onSelectStage,
  onOpenNewLead,
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      const offsetLeft = tab.offsetLeft - container.offsetLeft;
      container.scrollTo({
        left: offsetLeft - containerRect.width / 2 + tabRect.width / 2,
        behavior: 'smooth',
      });
    }
  }, [activeStageId]);

  const activeStage = sortedStages.find((s) => s.id === activeStageId) || sortedStages[0];
  const stageLeads = leads.filter(
    (l) => (l.stageId || 'prospeccao') === (activeStage?.id || 'prospeccao')
  );

  const totalValue = stageLeads.reduce((acc, lead) => {
    const val = (lead as any).dealValue || (lead as any).value || 0;
    return acc + Number(val || 0);
  }, 0);

  const handleCopyLeads = async () => {
    if (!stageLeads || stageLeads.length === 0) {
      toast.info(`Nenhum lead na etapa "${activeStage?.name}" para copiar.`);
      return;
    }

    try {
      const text = formatStageLeadsForWhatsApp(activeStage.name, stageLeads);
      const success = await copyToClipboard(text);
      if (success) {
        toast.success(
          `${stageLeads.length} lead${stageLeads.length > 1 ? 's' : ''} copiado${
            stageLeads.length > 1 ? 's' : ''
          }! Pronto para colar no WhatsApp.`
        );
      }
    } catch {
      toast.error('Erro ao copiar leads.');
    }
  };

  return (
    <div className="md:hidden mb-3">
      {/* Horizontal Tabs Carousel */}
      <div
        ref={tabsContainerRef}
        className="flex items-center gap-2 overflow-x-auto py-1 px-1 custom-scrollbar no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {sortedStages.map((stage) => {
          const count = leads.filter(
            (l) => (l.stageId || 'prospeccao') === stage.id
          ).length;
          const isActive = (activeStage?.id || 'prospeccao') === stage.id;

          return (
            <button
              key={stage.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => onSelectStage(stage.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-102'
                  : 'bg-card/70 hover:bg-card text-muted-foreground border-border/40'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: stage.color || '#3b82f6' }}
              />
              <span>{stage.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-black/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stage Info Header Banner */}
      <div className="flex items-center justify-between mt-2 px-2 py-1.5 bg-card/40 border border-border/30 rounded-xl">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: activeStage?.color || '#3b82f6' }}
          />
          <span className="font-semibold text-xs text-foreground">
            {stageLeads.length} {stageLeads.length === 1 ? 'lead' : 'leads'}
          </span>
          {totalValue > 0 && (
            <>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-xs text-emerald-400 font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalValue)}
              </span>
            </>
          )}
        </div>

        <button
          onClick={handleCopyLeads}
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
          title="Copiar lista de leads da etapa para o WhatsApp"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copiar p/ WhatsApp</span>
        </button>
      </div>
    </div>
  );
};
