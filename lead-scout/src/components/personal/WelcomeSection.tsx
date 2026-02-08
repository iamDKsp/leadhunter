import { Sparkles } from "lucide-react";

interface WelcomeSectionProps {
    userName: string;
}

const WelcomeSection = ({ userName }: WelcomeSectionProps) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bom dia";
        if (hour < 18) return "Boa tarde";
        return "Boa noite";
    };

    return (
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {getGreeting()}, <span className="text-primary">{userName}</span>!
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Confira seu progresso e metas do dia
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WelcomeSection;
