import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import axios from 'axios';
import { CircleDollarSign, Search } from 'lucide-react';

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
            const response = await axios.get('http://localhost:3000/costs/stats', {
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
        return <div>Carregando custos...</div>;
    }

    if (!stats) {
        return <div>Erro ao carregar dados.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                        <CircleDollarSign className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {stats.totalCost.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Gasto total estimado com API</p>
                    </CardContent>
                </Card>
                {/* Add more summary cards if needed */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Custo por Usuário</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.costByUser.map((user) => (
                                <div key={user.userId} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                            <span className="font-bold text-primary">{user.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold">R$ {user.totalCost.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Buscas Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto">
                            {stats.recentLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-start gap-3">
                                        <Search className="w-4 h-4 mt-1 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">{log.query}</p>
                                            <p className="text-xs text-muted-foreground">por {log.userName} em {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-red-500">- R$ {log.cost.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
