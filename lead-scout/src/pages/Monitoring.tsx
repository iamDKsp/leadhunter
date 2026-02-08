import { useState, useEffect, useMemo } from "react";
import MonitoringStats from "@/components/monitoring/MonitoringStats";
import MonitoringFilters, { StatusFilter } from "@/components/monitoring/MonitoringFilters";
import UsersTable from "@/components/monitoring/UsersTable";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Message {
    id: string;
    sender: "user" | "lead";
    content: string;
    timestamp: string;
    read: boolean;
}

interface ChatSession {
    leadName: string;
    leadPhone: string;
    messages: Message[];
}

interface User {
    id: string;
    name: string;
    email: string;
    status: "online" | "away" | "offline";
    lastSeen: string;
    sessionDuration: string;
    activeChats: number;
    chatHistory: ChatSession[];
}

interface Stats {
    totalUsers: number;
    onlineUsers: number;
    awayUsers: number;
    totalChats: number;
}

export function Monitoring() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        onlineUsers: 0,
        awayUsers: 0,
        totalChats: 0,
    });
    const [loading, setLoading] = useState(true);

    // Filter states
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

    const token = localStorage.getItem('token');

    const fetchData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch stats
            const statsRes = await fetch(`${API_URL}/monitoring/stats`, { headers });
            if (statsRes.ok) {
                setStats(await statsRes.json());
            }

            // Fetch users with filters
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (dateFrom) params.append("dateFrom", dateFrom.toISOString());
            if (dateTo) params.append("dateTo", dateTo.toISOString());

            const usersRes = await fetch(`${API_URL}/monitoring/users?${params}`, { headers });
            if (usersRes.ok) {
                const usersData = await usersRes.json();

                // Fetch chat history for each user
                const usersWithChats = await Promise.all(
                    usersData.map(async (user: User) => {
                        try {
                            const chatsRes = await fetch(`${API_URL}/monitoring/chats/${user.id}`, { headers });
                            if (chatsRes.ok) {
                                const chatsData = await chatsRes.json();
                                return {
                                    ...user,
                                    activeChats: chatsData.activeChats || 0,
                                    chatHistory: chatsData.chatHistory || [],
                                };
                            }
                        } catch (e) {
                            console.error('Error fetching chats for user', user.id, e);
                        }
                        return { ...user, chatHistory: [] };
                    })
                );

                setUsers(usersWithChats);
            }
        } catch (error) {
            console.error('Error fetching monitoring data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Refresh data every 30 seconds for real-time updates
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [statusFilter, dateFrom, dateTo]);

    // Apply client-side filters
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            if (statusFilter !== "all" && user.status !== statusFilter) {
                return false;
            }
            return true;
        });
    }, [users, statusFilter]);

    const handleClearFilters = () => {
        setStatusFilter("all");
        setDateFrom(undefined);
        setDateTo(undefined);
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {/* Stats Overview */}
            <MonitoringStats
                totalUsers={stats.totalUsers}
                onlineUsers={stats.onlineUsers}
                awayUsers={stats.awayUsers}
                totalChats={stats.totalChats}
            />

            {/* Filters */}
            <MonitoringFilters
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onClearFilters={handleClearFilters}
            />

            {/* Users Table */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                        Usuários da Equipe
                    </h2>
                    <span className="text-sm text-muted-foreground">
                        Mostrando {filteredUsers.length} de {users.length} usuários
                    </span>
                </div>
                <UsersTable users={filteredUsers} />
            </div>
        </div>
    );
}

export default Monitoring;
