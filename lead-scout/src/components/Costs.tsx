import { useState, useEffect } from 'react';
import axios from 'axios';
import { Info, Search } from 'lucide-react';

interface CostStats {
    totalCost: number;
    costByUser: { userId: string, name: string, email: string, totalCost: number }[];
    recentLogs: { id: string, query: string, endpoint: string, cost: number, timestamp: string, userName: string }[];
}

export function Costs() {
    const [stats, setStats] = useState<CostStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await axios.get(`${API_URL}/costs/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch costs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando custos...</div>;
    }

    if (!stats) {
        return <div className="p-8 text-center text-red-400">Erro ao carregar dados.</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Custo Total */}
            <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-6 max-w-md shadow-xl hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Custo Total</span>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-3xl font-bold text-foreground">R$ {stats.totalCost.toFixed(2).replace('.', ',')}</p>
                <p className="text-sm text-primary mt-1">Gasto total estimado com API</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Custo por Usuário */}
                <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-6 shadow-xl">
                    <h3 className="font-semibold text-foreground mb-4">Custo por Usuário</h3>
                    <div className="space-y-4">
                        {stats.costByUser.map((user) => (
                            <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <span className="font-semibold text-foreground">R$ {user.totalCost.toFixed(2).replace('.', ',')}</span>
                            </div>
                        ))}
                        {stats.costByUser.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum custo registrado por usuário.</p>
                        )}
                    </div>
                </div>

                {/* Buscas Recentes */}
                <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-6 shadow-xl">
                    <h3 className="font-semibold text-foreground mb-4">Buscas Recentes</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {stats.recentLogs.map((log) => (
                            <div key={log.id} className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors border-b border-border/10 last:border-0">
                                <div className="flex items-start gap-3">
                                    <Search className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-foreground line-clamp-2">{log.query}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            por <span className="text-primary">{log.userName}</span> em {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-red-400 whitespace-nowrap">- R$ {log.cost.toFixed(2).replace('.', ',')}</span>
                            </div>
                        ))}
                        {stats.recentLogs.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma busca recente.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
