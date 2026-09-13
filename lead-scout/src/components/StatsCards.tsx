import { Lead } from '@/types/lead';
import { Users, Phone, TrendingUp, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';

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
      value: totalLeads.toString(),
      icon: Users,
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
    },
    {
      label: 'Contatados',
      value: contactedLeads.toString(),
      icon: Phone,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
    {
      label: 'Média de Acerto',
      value: `${avgSuccessChance}%`,
      icon: TrendingUp,
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
    },
    {
      label: 'Leads Quentes',
      value: hotLeads.toString(),
      icon: Flame,
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-500',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.2 } }}
          className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-4 flex items-center justify-between shadow-lg hover:border-primary/40 hover:shadow-primary/10 transition-colors duration-300 cursor-default"
        >
          <div>
            <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            <p className="text-3xl font-bold text-foreground mt-1 tracking-tight">{stat.value}</p>
          </div>
          <motion.div
            whileHover={{ rotate: 8, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center`}
          >
            <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}

