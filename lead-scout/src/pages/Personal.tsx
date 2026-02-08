import { useState, useEffect } from "react";
import { Target, Phone, TrendingUp, Flame } from "lucide-react";
import WelcomeSection from "@/components/personal/WelcomeSection";
import MetricCard from "@/components/personal/MetricCard";
import HotLeadsCard from "@/components/personal/HotLeadsCard";
import PendingTasksCard from "@/components/personal/PendingTasksCard";
import TotalValueCard from "@/components/personal/TotalValueCard";
import CommissionCard from "@/components/personal/CommissionCard";
import PerformanceChart from "@/components/personal/PerformanceChart";
import WeeklyGoalsCard from "@/components/personal/WeeklyGoalsCard";
import RecentActivityCard from "@/components/personal/RecentActivityCard";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Metrics {
    totalLeads: number;
    contacted: number;
    averageScore: number;
    hotLeads: number;
    totalValue: number;
    averageTicket: number;
}

interface HotLead {
    id: string;
    name: string;
    category: string;
    phone: string;
    address?: string;
    score: number;
    value: number;
}

interface Task {
    id: string;
    title: string;
    leadName: string;
    dueDate: string;
    priority: "high" | "medium" | "low";
    completed: boolean;
}

interface Goal {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
    icon: "leads" | "calls" | "meetings" | "sales";
}

interface Activity {
    id: string;
    type: "call" | "email" | "meeting" | "task" | "proposal";
    title: string;
    leadName: string;
    time: string;
    status: "completed" | "scheduled" | "pending";
}

interface PerformanceData {
    month: string;
    leads: number;
    conversions: number;
    value: number;
}

interface PersonalProps {
    userName?: string;
}

export function Personal({ userName = "Usuário" }: PersonalProps) {
    const [metrics, setMetrics] = useState<Metrics>({
        totalLeads: 0,
        contacted: 0,
        averageScore: 0,
        hotLeads: 0,
        totalValue: 0,
        averageTicket: 0,
    });
    const [hotLeads, setHotLeads] = useState<HotLead[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [performance, setPerformance] = useState<PerformanceData[]>([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');

    const fetchData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            const [metricsRes, hotLeadsRes, tasksRes, goalsRes, activityRes, performanceRes] = await Promise.all([
                fetch(`${API_URL}/personal/metrics`, { headers }),
                fetch(`${API_URL}/personal/hot-leads`, { headers }),
                fetch(`${API_URL}/personal/tasks`, { headers }),
                fetch(`${API_URL}/personal/goals`, { headers }),
                fetch(`${API_URL}/personal/activity`, { headers }),
                fetch(`${API_URL}/personal/performance`, { headers }),
            ]);

            if (metricsRes.ok) setMetrics(await metricsRes.json());
            if (hotLeadsRes.ok) setHotLeads(await hotLeadsRes.json());
            if (tasksRes.ok) setTasks(await tasksRes.json());
            if (goalsRes.ok) setGoals(await goalsRes.json());
            if (activityRes.ok) setActivities(await activityRes.json());
            if (performanceRes.ok) setPerformance(await performanceRes.json());
        } catch (error) {
            console.error('Error fetching personal data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleTask = async (taskId: string) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            await fetch(`${API_URL}/personal/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed: !task.completed }),
            });

            setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, completed: !t.completed } : t
            ));
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Carregando...</div>
            </div>
        );
    }

    // Calculate conversion rate for TotalValueCard
    const conversionRate = metrics.totalLeads > 0
        ? Math.round((metrics.contacted / metrics.totalLeads) * 100)
        : 0;

    // Count completed leads/systems for commission (using contacted as proxy)
    const completedSystems = metrics.contacted;

    return (
        <div className="p-8 space-y-8">
            {/* Welcome Section */}
            <WelcomeSection userName={userName} />

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total de Leads"
                    value={metrics.totalLeads}
                    icon={Target}
                    trend={{ value: 15, isPositive: true }}
                    delay={0}
                />
                <MetricCard
                    title="Contatados"
                    value={metrics.contacted}
                    icon={Phone}
                    delay={50}
                />
                <MetricCard
                    title="Média de Acerto"
                    value={`${metrics.averageScore}%`}
                    icon={TrendingUp}
                    trend={{ value: 5, isPositive: true }}
                    delay={100}
                />
                <MetricCard
                    title="Leads Quentes"
                    value={metrics.hotLeads}
                    icon={Flame}
                    delay={150}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hot Leads */}
                <HotLeadsCard leads={hotLeads} />

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Total Value Card */}
                    <TotalValueCard
                        totalValue={metrics.totalValue}
                        leadsCount={metrics.totalLeads}
                        averageValue={metrics.averageTicket}
                        conversionRate={conversionRate}
                    />

                    {/* Pending Tasks */}
                    <PendingTasksCard tasks={tasks} onToggleTask={handleToggleTask} />
                </div>
            </div>

            {/* Commission & Reports Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Commission Card */}
                <CommissionCard
                    totalValue={metrics.totalValue}
                    completedSystems={completedSystems}
                />

                {/* Weekly Goals */}
                <WeeklyGoalsCard goals={goals} />
            </div>

            {/* Charts & Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Chart */}
                <PerformanceChart data={performance} />

                {/* Recent Activity */}
                <RecentActivityCard activities={activities} />
            </div>
        </div>
    );
}

export default Personal;
