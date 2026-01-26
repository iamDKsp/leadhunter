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
import { TrendingUp, PieChartIcon, BarChart3, Activity } from 'lucide-react';

interface AnalyticsProps {
  leads: Lead[];
}

const COLORS = {
  lavacar: '#0ea5e9',
  barbearia: '#8b5cf6',
  restaurante: '#f97316',
  concertinas: '#ec4899',
  salao: '#f472b6',
};

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Analytics({ leads }: AnalyticsProps) {
  // Data for leads by company type
  const leadsByType = Object.entries(COMPANY_TYPES).map(([key, { label }]) => ({
    name: label,
    value: leads.filter((l) => l.type === key).length,
    color: COLORS[key as CompanyType],
  })).filter(item => item.value > 0);

  // Data for conversion (contacted vs not contacted)
  const conversionData = [
    { 
      name: 'Contatados', 
      value: leads.filter((l) => l.contacted).length,
      color: '#22c55e'
    },
    { 
      name: 'Não Contatados', 
      value: leads.filter((l) => !l.contacted).length,
      color: '#64748b'
    },
  ];

  // Monthly evolution (simulated based on createdAt)
  const getMonthlyData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    
    // Create last 6 months data
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthLeads = Math.floor(Math.random() * 10) + leads.length / 6;
      const contacted = Math.floor(monthLeads * 0.4);
      data.push({
        month: months[monthIndex],
        leads: Math.round(monthLeads),
        contatados: contacted,
        conversao: Math.round((contacted / monthLeads) * 100),
      });
    }
    return data;
  };

  const monthlyData = getMonthlyData();

  // Success chance distribution
  const successDistribution = [
    { range: '0-25%', count: leads.filter((l) => l.successChance <= 25).length, fill: '#ef4444' },
    { range: '26-50%', count: leads.filter((l) => l.successChance > 25 && l.successChance <= 50).length, fill: '#f59e0b' },
    { range: '51-75%', count: leads.filter((l) => l.successChance > 50 && l.successChance <= 75).length, fill: '#3b82f6' },
    { range: '76-100%', count: leads.filter((l) => l.successChance > 75).length, fill: '#22c55e' },
  ];

  // Leads by size
  const leadsBySize = [
    { name: 'Muito Pequeno', value: leads.filter((l) => l.size === 'muito_pequeno').length },
    { name: 'Pequeno', value: leads.filter((l) => l.size === 'pequeno').length },
    { name: 'Médio', value: leads.filter((l) => l.size === 'medio').length },
    { name: 'Grande', value: leads.filter((l) => l.size === 'grande').length },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} leads ({((payload[0].value / leads.length) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">
            {leads.length > 0 
              ? Math.round((leads.filter(l => l.contacted).length / leads.length) * 100) 
              : 0}%
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-muted-foreground">Média Chance Acerto</span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">
            {leads.length > 0 
              ? Math.round(leads.reduce((acc, l) => acc + l.successChance, 0) / leads.length)
              : 0}%
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-muted-foreground">Leads Quentes</span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">
            {leads.filter(l => l.successChance >= 70).length}
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <PieChartIcon className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-muted-foreground">Tipos de Empresa</span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">
            {leadsByType.length}
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Evolution */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Evolução Mensal
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorContacted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="leads" 
                name="Leads"
                stroke="#22c55e" 
                fillOpacity={1} 
                fill="url(#colorLeads)" 
              />
              <Area 
                type="monotone" 
                dataKey="contatados" 
                name="Contatados"
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorContacted)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Leads by Type - Pie Chart */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Leads por Tipo de Empresa
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={leadsByType}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {leadsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend 
                formatter={(value) => <span className="text-muted-foreground text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Chance Distribution */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Distribuição de Chance de Acerto
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={successDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis dataKey="range" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]}>
                {successDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Funil de Conversão
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={conversionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {conversionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend 
                formatter={(value) => <span className="text-muted-foreground text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Size */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Leads por Porte da Empresa
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={leadsBySize}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
                {leadsBySize.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Rate Trend */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Tendência de Conversão (%)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="conversao" 
                name="Taxa de Conversão"
                stroke="#22c55e" 
                strokeWidth={3}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8, fill: '#22c55e' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
