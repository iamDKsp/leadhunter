import { useState, useMemo } from 'react';
import { Lead, COMPANY_TYPES, CompanyType } from '@/types/lead';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import { TrendingUp, PieChartIcon, BarChart3, Activity, CalendarDays, User as UserIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsers } from '@/hooks/useUsers';
import { subDays, startOfMonth, startOfYear, isAfter } from 'date-fns';

interface AnalyticsProps {
  leads: Lead[];
}

const COLORS = {
  lavacar: '#0ea5e9',
  barbearia: '#8b5cf6',
  restaurante: '#f97316',
  concertinas: '#ec4899',
  salao: '#f472b6',
  outros: '#94a3b8'
};

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Analytics({ leads }: AnalyticsProps) {
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  const { users } = useUsers();

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // User Filter
      if (userFilter !== 'all' && lead.responsibleId !== userFilter) return false;

      // Date Filter
      if (dateFilter !== 'all') {
        const leadDate = new Date(lead.createdAt);
        const now = new Date();
        if (dateFilter === '7d' && !isAfter(leadDate, subDays(now, 7))) return false;
        if (dateFilter === '30d' && !isAfter(leadDate, subDays(now, 30))) return false;
        if (dateFilter === 'thisMonth' && !isAfter(leadDate, startOfMonth(now))) return false;
        if (dateFilter === 'thisYear' && !isAfter(leadDate, startOfYear(now))) return false;
      }

      return true;
    });
  }, [leads, userFilter, dateFilter]);

  // Data for leads by company type
  const leadsByType = Object.entries(COMPANY_TYPES).map(([key, { label }]) => ({
    name: label,
    value: filteredLeads.filter((l) => l.type === key).length,
    color: COLORS[key as keyof typeof COLORS] || COLORS.outros,
  })).filter(item => item.value > 0);

  // Data for conversion (contacted vs not contacted)
  const conversionData = [
    {
      name: 'Contatados',
      value: filteredLeads.filter((l) => l.contacted).length,
      color: '#22c55e'
    },
    {
      name: 'Não Contatados',
      value: filteredLeads.filter((l) => !l.contacted).length,
      color: '#64748b'
    },
  ];

  // Monthly evolution (Based on real createdAt dates)
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();

    const data = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setMonth(currentMonth - i);
      const m = targetDate.getMonth();
      const y = targetDate.getFullYear();

      // Consider all leads (regardless of user/date filter) for the timeline? 
      // Usually, B.I timelines respect filters, so we use filteredLeads. 
      // If a user selected "Last 7 days", the timeline will just show the current month as non-zero.
      const monthLeads = filteredLeads.filter(l => {
        const d = new Date(l.createdAt);
        return d.getMonth() === m && d.getFullYear() === y;
      });

      const contacted = monthLeads.filter(l => l.contacted).length;

      data.push({
        month: months[m],
        leads: monthLeads.length,
        contatados: contacted,
        conversao: monthLeads.length > 0 ? Math.round((contacted / monthLeads.length) * 100) : 0,
      });
    }
    return data;
  }, [filteredLeads]);

  // Success chance distribution
  const successDistribution = [
    { range: '0-25%', count: filteredLeads.filter((l) => l.successChance <= 25).length, fill: '#ef4444' },
    { range: '26-50%', count: filteredLeads.filter((l) => l.successChance > 25 && l.successChance <= 50).length, fill: '#f59e0b' },
    { range: '51-75%', count: filteredLeads.filter((l) => l.successChance > 50 && l.successChance <= 75).length, fill: '#3b82f6' },
    { range: '76-100%', count: filteredLeads.filter((l) => l.successChance > 75).length, fill: '#22c55e' },
  ];

  // Leads by size
  const leadsBySize = [
    { name: 'Muito Pequeno', value: filteredLeads.filter((l) => l.size === 'muito_pequeno').length },
    { name: 'Pequeno', value: filteredLeads.filter((l) => l.size === 'pequeno').length },
    { name: 'Médio', value: filteredLeads.filter((l) => l.size === 'medio').length },
    { name: 'Grande', value: filteredLeads.filter((l) => l.size === 'grande').length },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
          <p className="text-foreground font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm mb-1 last:mb-0">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{entry.name}</span>
              </span>
              <span className="font-bold text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl text-center">
          <p className="text-foreground font-semibold mb-1">{payload[0].name}</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {payload[0].value}
            </span>
            <span className="text-sm text-muted-foreground">leads</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ({((payload[0].value / (filteredLeads.length || 1)) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Filters - Futuristic Glass Panel */}
      <div className="p-4 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.2)] flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 opacity-50 pointer-events-none" />
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-40 h-40 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Centro de Inteligência</h2>
            <p className="text-xs text-muted-foreground">Métricas avançadas de performance</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
          {/* User Filter */}
          <div className="flex items-center gap-2 bg-background/50 border border-white/5 rounded-lg p-1">
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[180px] border-none bg-transparent shadow-none focus:ring-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserIcon className="w-4 h-4 text-blue-400" />
                  <SelectValue placeholder="Todos os Usuários" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Usuários</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-background/50 border border-white/5 rounded-lg p-1">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px] border-none bg-transparent shadow-none focus:ring-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="w-4 h-4 text-purple-400" />
                  <SelectValue placeholder="Período" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o Período</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="thisMonth">Este Mês</SelectItem>
                <SelectItem value="thisYear">Este Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Stats - KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Taxa de Conversão</span>
          </div>
          <p className="text-4xl font-display font-bold text-foreground relative z-10 drop-shadow-md">
            {filteredLeads.length > 0
              ? Math.round((filteredLeads.filter(l => l.contacted).length / filteredLeads.length) * 100)
              : 0}<span className="text-2xl text-muted-foreground/50">%</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2 relative z-10">Leads contatados vs total</p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-green-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Média Chance Acerto</span>
          </div>
          <p className="text-4xl font-display font-bold text-foreground relative z-10 drop-shadow-md">
            {filteredLeads.length > 0
              ? Math.round(filteredLeads.reduce((acc, l) => acc + l.successChance, 0) / filteredLeads.length)
              : 0}<span className="text-2xl text-muted-foreground/50">%</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2 relative z-10">Probabilidade média avaliada</p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Leads Quentes</span>
          </div>
          <p className="text-4xl font-display font-bold text-foreground relative z-10 drop-shadow-md">
            {filteredLeads.filter(l => l.successChance >= 70).length}
          </p>
          <p className="text-xs text-muted-foreground mt-2 relative z-10">Chances &gt;= 70%</p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Total no Filtro</span>
          </div>
          <p className="text-4xl font-display font-bold text-foreground relative z-10 drop-shadow-md">
            {filteredLeads.length}
          </p>
          <p className="text-xs text-muted-foreground mt-2 relative z-10">Leads encontrados</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Evolution */}
        <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-semibold text-lg text-foreground">
              Evolução nos Últimos 6 Meses
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorContacted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Area
                type="monotone"
                dataKey="leads"
                name="Novos Leads"
                stroke="#22c55e"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorLeads)"
              />
              <Area
                type="monotone"
                dataKey="contatados"
                name="Leads Contatados"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorContacted)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Leads by Type - Pie Chart */}
        <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-lg">
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Segmentação de Leads
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={leadsByType}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {leadsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}66)` }} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => <span className="text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Chance Distribution */}
        <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-lg">
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Distribuição de Probabilidade
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={successDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} opacity={0.5} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="range" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={70} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="count" name="Qtd. Leads" radius={[0, 6, 6, 0]} barSize={24}>
                {successDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel */}
        <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-lg">
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Funil de Abordagem
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={conversionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {conversionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}66)` }} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => <span className="text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Size */}
        <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-lg">
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Leads por Porte da Empresa
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={leadsBySize} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="value" name="Leads" radius={[6, 6, 0, 0]} barSize={40}>
                {leadsBySize.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Rate Trend */}
        <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-lg">
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Tendência de Conversão (%)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
              <Line
                type="monotone"
                dataKey="conversao"
                name="Taxa de Conversão"
                stroke="#8b5cf6"
                strokeWidth={4}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 10, fill: '#8b5cf6', strokeWidth: 0, style: { filter: 'drop-shadow(0px 0px 10px rgba(139, 92, 246, 0.8))' } }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

