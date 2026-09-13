import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Info,
    Search,
    DollarSign,
    Calendar,
    Activity,
    Zap,
    RefreshCw,
    Users,
    CheckCircle2,
    Image as ImageIcon,
    FileText,
    Layers,
    Clock,
    Filter,
    HelpCircle,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface UserCost {
    userId: string;
    name: string;
    email: string;
    avatar: string | null;
    role?: string;
    customTag?: string | null;
    customTagColor?: string | null;
    totalCost: number;
    requestCount: number;
    searchesCount: number;
    photosCount: number;
    percentageOfTotal: number;
}

interface EndpointBreakdown {
    endpoint: string;
    label: string;
    sku: string;
    unitPrice: number;
    description: string;
    count: number;
    totalCost: number;
    percentage: number;
}

interface RecentLog {
    id: string;
    userId: string | null;
    query: string;
    endpoint: string;
    cost: number;
    timestamp: string;
    userName: string;
    userEmail?: string | null;
    userAvatar?: string | null;
    userRole?: string | null;
    endpointLabel?: string;
    sku?: string;
}

interface CostStats {
    currency: string;
    totalCost: number;
    totalCostUSD: number;
    totalRequests: number;
    avgCostPerSearch: number;
    periods: {
        today: { cost: number; requests: number };
        week: { cost: number; requests: number };
        month: { cost: number; requests: number };
    };
    breakdownByEndpoint: EndpointBreakdown[];
    costByUser: UserCost[];
    recentLogs: RecentLog[];
}

export function Costs() {
    const [stats, setStats] = useState<CostStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [showTransparencyGuide, setShowTransparencyGuide] = useState(false);

    const resolveAvatarUrl = (avatar?: string | null) => {
        if (!avatar) return undefined;
        if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
        if (avatar.startsWith('/')) {
            const apiBase = import.meta.env.VITE_API_URL
                ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
                : (import.meta.env.PROD ? '' : 'http://localhost:3000');
            return `${apiBase}${avatar}`;
        }
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatar)}`;
    };

    const fetchStats = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000');
            const params: any = {};
            if (periodFilter !== 'all') params.period = periodFilter;
            if (selectedUserFilter !== 'ALL') params.userId = selectedUserFilter;

            const response = await axios.get(`${API_URL}/costs/stats`, {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch costs:', error);
        } finally {
            setLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [periodFilter, selectedUserFilter]);

    // Filter recent logs locally for instant search response
    const filteredLogs = useMemo(() => {
        if (!stats?.recentLogs) return [];
        let logs = stats.recentLogs;

        if (selectedUserFilter !== 'ALL') {
            logs = logs.filter(l => l.userId === selectedUserFilter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            logs = logs.filter(l =>
                l.query.toLowerCase().includes(q) ||
                l.userName.toLowerCase().includes(q) ||
                l.endpoint.toLowerCase().includes(q)
            );
        }

        return logs;
    }, [stats?.recentLogs, selectedUserFilter, searchQuery]);

    const getEndpointBadge = (endpoint: string) => {
        switch (endpoint) {
            case 'textsearch':
                return {
                    label: 'Busca Maps',
                    icon: Search,
                    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                };
            case 'placedetails':
                return {
                    label: 'Detalhes',
                    icon: FileText,
                    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                };
            case 'placephoto':
                return {
                    label: 'Foto Fachada',
                    icon: ImageIcon,
                    className: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                };
            default:
                return {
                    label: endpoint,
                    icon: Layers,
                    className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                };
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Carregando dados financeiros da API...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-8 text-center text-red-400 bg-destructive/10 rounded-xl border border-destructive/20 max-w-lg mx-auto mt-8">
                <p className="font-semibold">Erro ao carregar dados de custos da API.</p>
                <p className="text-xs text-muted-foreground mt-1">Verifique sua conexão ou tente recarregar.</p>
                <button
                    onClick={() => fetchStats(true)}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Top Toolbar: Period Filters & Refresh */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-4 rounded-xl border border-border/40">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5" /> Filtrar Período:
                    </span>
                    <div className="flex flex-wrap gap-1 bg-secondary/50 p-1 rounded-lg border border-border/30">
                        {(['all', 'month', 'week', 'today'] as const).map((p) => {
                            const labels = {
                                all: 'Todo o Período',
                                month: 'Este Mês',
                                week: 'Últimos 7 dias',
                                today: 'Hoje'
                            };
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPeriodFilter(p)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                        periodFilter === p
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                    }`}
                                >
                                    {labels[p]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                        onClick={() => setShowTransparencyGuide(!showTransparencyGuide)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg border border-border/40 hover:bg-secondary/40"
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Transparência de Custos</span>
                        {showTransparencyGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                        onClick={() => fetchStats(true)}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 text-xs bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-lg border border-border/40 transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>Atualizar</span>
                    </button>
                </div>
            </div>

            {/* Transparency / Calculation Guide Box (Expandable) */}
            {showTransparencyGuide && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4 animate-fade-in text-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                            <Info className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-foreground">Como os custos da API são calculados e auditados?</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Os valores registrados refletem com precisão as <strong>requisições HTTP reais</strong> enviadas aos servidores da Google Cloud Platform (Google Places API New).
                                Cada centavo é registrado no momento exato em que a ação ocorre:
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        <div className="bg-card/70 border border-border/40 p-3 rounded-lg space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-emerald-400">Places Text Search (New)</span>
                                <span className="text-xs font-mono font-bold text-foreground">R$ 0,20 / pág</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                SKU: Text Search Enterprise (~$0.032 USD). O Google traz 20 estabelecimentos por página. Se uma busca consulta 3 páginas, são feitas 3 chamadas HTTP reais (R$ 0,60). Se encontrar apenas 1 página, cobra-se apenas 1 chamada (R$ 0,20).
                            </p>
                        </div>

                        <div className="bg-card/70 border border-border/40 p-3 rounded-lg space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-blue-400">Places Detalhes (New)</span>
                                <span className="text-xs font-mono font-bold text-foreground">R$ 0,15 / req</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                SKU: Place Details Enterprise (~$0.025 USD). Executado apenas quando um local precisa de enriquecimento individual de dados não contidos na busca original.
                            </p>
                        </div>

                        <div className="bg-card/70 border border-border/40 p-3 rounded-lg space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-purple-400">Places Photos (New)</span>
                                <span className="text-xs font-mono font-bold text-foreground">R$ 0,04 / foto</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                SKU: Place Photo (~$0.007 USD). Cobrado quando o usuário importa um lead com foto de fachada, fazendo o download direto e seguro para o servidor local.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Custo Total */}
                <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl p-5 shadow-lg hover:border-primary/40 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-semibold uppercase tracking-wider">Custo Total Acumulado</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                            R$ {stats.totalCost.toFixed(2).replace('.', ',')}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs">
                            <span className="text-emerald-400 font-medium">~ ${stats.totalCostUSD.toFixed(2)} USD</span>
                            <span className="text-muted-foreground">Total geral</span>
                        </div>
                    </div>
                </div>

                {/* 2. Custo no Mês Atual */}
                <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl p-5 shadow-lg hover:border-primary/40 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-semibold uppercase tracking-wider">Fatura Deste Mês</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <Calendar className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                            R$ {stats.periods.month.cost.toFixed(2).replace('.', ',')}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs">
                            <span className="text-blue-400 font-medium">{stats.periods.month.requests} chamadas</span>
                            <span className="text-muted-foreground">Mês corrente</span>
                        </div>
                    </div>
                </div>

                {/* 3. Total de Requisições da API */}
                <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl p-5 shadow-lg hover:border-primary/40 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total de Requisições</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                            <Activity className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                            {stats.totalRequests}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs">
                            <span className="text-purple-400 font-medium">Hoje: R$ {stats.periods.today.cost.toFixed(2).replace('.', ',')}</span>
                            <span className="text-muted-foreground">({stats.periods.today.requests} reqs)</span>
                        </div>
                    </div>
                </div>

                {/* 4. Custo Médio por Busca */}
                <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl p-5 shadow-lg hover:border-primary/40 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-semibold uppercase tracking-wider">Custo Médio / Req</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                            <Zap className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                            R$ {stats.avgCostPerSearch.toFixed(2).replace('.', ',')}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs">
                            <span className="text-amber-400 font-medium">Google Places New</span>
                            <span className="text-muted-foreground">Média unitária</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown by Google API Service / SKU */}
            <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary" /> Discriminação por Serviço do Google Cloud (SKU)
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Detalhamento de volume e faturamento por endpoint da Google Places API
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.breakdownByEndpoint.map((item) => {
                        const badgeInfo = getEndpointBadge(item.endpoint);
                        const Icon = badgeInfo.icon;
                        return (
                            <div key={item.endpoint} className="bg-secondary/25 border border-border/30 rounded-xl p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg border ${badgeInfo.className}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-xs text-foreground">{item.label}</p>
                                            <p className="text-[10px] text-muted-foreground">{item.sku}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-sm text-foreground">
                                        R$ {item.totalCost.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] text-muted-foreground">
                                        <span>{item.count} chamadas realizadas</span>
                                        <span>{item.percentage}% do total</span>
                                    </div>
                                    <Progress value={item.percentage} className="h-1.5" />
                                </div>

                                <p className="text-[11px] text-muted-foreground leading-tight pt-1 border-t border-border/20">
                                    {item.description}
                                </p>
                            </div>
                        );
                    })}

                    {stats.breakdownByEndpoint.length === 0 && (
                        <div className="col-span-3 text-center py-6 text-xs text-muted-foreground">
                            Nenhum registro de consumo de API neste período.
                        </div>
                    )}
                </div>
            </div>

            {/* Main 2-Column Grid: Users Breakdown & Detailed Audit Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column 1: Cost by User (5 Cols) */}
                <div className="lg:col-span-5 bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" /> Custo por Usuário
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Equipe e volume de consumo individual
                                </p>
                            </div>
                            {selectedUserFilter !== 'ALL' && (
                                <button
                                    onClick={() => setSelectedUserFilter('ALL')}
                                    className="text-xs text-primary hover:underline"
                                >
                                    Ver Todos
                                </button>
                            )}
                        </div>

                        <div className="space-y-3 max-h-[580px] overflow-y-auto custom-scrollbar pr-1">
                            {stats.costByUser.map((user) => {
                                const isSelected = selectedUserFilter === user.userId;
                                return (
                                    <div
                                        key={user.userId}
                                        onClick={() => setSelectedUserFilter(isSelected ? 'ALL' : user.userId)}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-primary/10 border-primary/50 shadow-md ring-1 ring-primary/30'
                                                : 'bg-secondary/20 hover:bg-secondary/40 border-border/30'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* User Avatar with Radix Image and Fallback */}
                                                <Avatar className="w-10 h-10 border border-border/50 flex-shrink-0">
                                                    {user.avatar ? (
                                                        <AvatarImage
                                                            src={resolveAvatarUrl(user.avatar)}
                                                            alt={user.name}
                                                            className="object-cover"
                                                        />
                                                    ) : null}
                                                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-sm text-foreground truncate">{user.name}</p>
                                                        {user.customTag ? (
                                                            <span
                                                                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                                                style={{
                                                                    backgroundColor: `${user.customTagColor || '#3b82f6'}20`,
                                                                    color: user.customTagColor || '#3b82f6',
                                                                    border: `1px solid ${user.customTagColor || '#3b82f6'}40`
                                                                }}
                                                            >
                                                                {user.customTag}
                                                            </span>
                                                        ) : user.role === 'SUPER_ADMIN' ? (
                                                            <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-medium">
                                                                Super Admin
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>

                                            <div className="text-right flex-shrink-0">
                                                <span className="font-bold text-sm text-foreground">
                                                    R$ {user.totalCost.toFixed(2).replace('.', ',')}
                                                </span>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {user.percentageOfTotal}% da equipe
                                                </p>
                                            </div>
                                        </div>

                                        {/* User Sub-metrics */}
                                        <div className="mt-3 pt-2 border-t border-border/20 flex items-center justify-between text-[11px] text-muted-foreground">
                                            <span>
                                                🔍 <strong>{user.searchesCount}</strong> buscas
                                            </span>
                                            <span>
                                                📷 <strong>{user.photosCount}</strong> fotos
                                            </span>
                                            <span>
                                                ⚡ <strong>{user.requestCount}</strong> reqs
                                            </span>
                                        </div>

                                        {/* Participation Progress Bar */}
                                        <div className="mt-2">
                                            <Progress value={user.percentageOfTotal} className="h-1 bg-secondary" />
                                        </div>
                                    </div>
                                );
                            })}

                            {stats.costByUser.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-8">
                                    Nenhum custo registrado por usuário.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/30 text-center text-xs text-muted-foreground">
                        Clique em um usuário para filtrar o histórico ao lado.
                    </div>
                </div>

                {/* Column 2: Audit Logs & Recent Searches (7 Cols) */}
                <div className="lg:col-span-7 bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                            <div>
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" /> Histórico de Requisições
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {selectedUserFilter !== 'ALL'
                                        ? `Filtrado pelo usuário selecionado (${filteredLogs.length} logs)`
                                        : `Últimas requisições auditadas (${filteredLogs.length} logs)`}
                                </p>
                            </div>

                            {/* Quick Search in Logs */}
                            <div className="relative w-full sm:w-56">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar no histórico..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-secondary/40 border border-border/40 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5 max-h-[580px] overflow-y-auto custom-scrollbar pr-1">
                            {filteredLogs.map((log) => {
                                const badgeInfo = getEndpointBadge(log.endpoint);
                                const Icon = badgeInfo.icon;
                                const logDate = new Date(log.timestamp);

                                return (
                                    <div
                                        key={log.id}
                                        className="p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 border border-border/30 transition-colors flex items-start justify-between gap-3"
                                    >
                                        <div className="flex items-start gap-3 min-w-0">
                                            {/* User Avatar */}
                                            <Avatar className="w-8 h-8 border border-border/40 flex-shrink-0 mt-0.5">
                                                {log.userAvatar ? (
                                                    <AvatarImage
                                                        src={resolveAvatarUrl(log.userAvatar)}
                                                        alt={log.userName}
                                                        className="object-cover"
                                                    />
                                                ) : null}
                                                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                                                    {log.userName?.charAt(0).toUpperCase() || 'S'}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeInfo.className}`}>
                                                        <Icon className="w-3 h-3" />
                                                        {badgeInfo.label}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        por <strong className="text-foreground font-medium">{log.userName}</strong>
                                                    </span>
                                                </div>

                                                <p className="font-medium text-xs text-foreground mt-1 break-words">
                                                    {log.query}
                                                </p>

                                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                                                    <span>
                                                        {logDate.toLocaleDateString('pt-BR')} às {logDate.toLocaleTimeString('pt-BR')}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="text-emerald-400/90 font-mono">200 OK</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right flex-shrink-0">
                                            <span className="text-xs font-bold text-red-400 font-mono">
                                                - R$ {log.cost.toFixed(2).replace('.', ',')}
                                            </span>
                                            <p className="text-[9px] text-muted-foreground font-mono">
                                                ~${(log.cost / 5.90).toFixed(3)} USD
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredLogs.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground text-xs space-y-1">
                                    <p>Nenhuma requisição encontrada com os filtros atuais.</p>
                                    {selectedUserFilter !== 'ALL' && (
                                        <button
                                            onClick={() => setSelectedUserFilter('ALL')}
                                            className="text-primary hover:underline text-xs mt-2"
                                        >
                                            Limpar filtro de usuário
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Exibindo até 80 registros recentes</span>
                        <span>Auditoria Google Cloud Platform</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

