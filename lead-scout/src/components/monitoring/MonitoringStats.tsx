import { Users, UserCheck, Clock, MessageSquare } from "lucide-react";

interface MonitoringStatsProps {
    totalUsers: number;
    onlineUsers: number;
    awayUsers: number;
    totalChats: number;
}

const MonitoringStats = ({ totalUsers, onlineUsers, awayUsers, totalChats }: MonitoringStatsProps) => {
    const stats = [
        { icon: Users, label: "Total Usuários", value: totalUsers, color: "text-primary bg-primary/10" },
        { icon: UserCheck, label: "Online", value: onlineUsers, color: "text-green-500 bg-green-500/10" },
        { icon: Clock, label: "Ausentes", value: awayUsers, color: "text-yellow-500 bg-yellow-500/10" },
        { icon: MessageSquare, label: "Chats Ativos", value: totalChats, color: "text-blue-500 bg-blue-500/10" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <div
                    key={stat.label}
                    className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MonitoringStats;
