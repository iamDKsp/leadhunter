import { Lead } from '@/types/lead';
import { Users, PhoneCall, TrendingUp, Target } from 'lucide-react';

interface StatsCardsProps {
  leads: Lead[];
}

export function StatsCards({ leads }: StatsCardsProps) {
  const totalLeads = leads.length;
  const contactedLeads = leads.filter((l) => l.contacted).length;
  const avgSuccessChance = leads.length > 0 
    ? Math.round(leads.reduce((acc, l) => acc + l.successChance, 0) / leads.length)
    : 0;
  const hotLeads = leads.filter((l) => l.successChance >= 70 && !l.contacted).length;

  const stats = [
    {
      label: 'Total de Leads',
      value: totalLeads,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Contatados',
      value: contactedLeads,
      icon: PhoneCall,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      label: 'Média de Acerto',
      value: `${avgSuccessChance}%`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      label: 'Leads Quentes',
      value: hotLeads,
      icon: Target,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
