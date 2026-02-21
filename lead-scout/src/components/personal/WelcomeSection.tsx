import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, Trophy, Target } from "lucide-react";

interface WelcomeSectionProps {
    userName: string;
}

const WelcomeSection = ({ userName }: WelcomeSectionProps) => {
    const [currentPhraseIndex, setCurrentPhraseIndex] = React.useState(0);

    const phrases = [
        { text: "Quanto vamos ganhar hoje?", icon: TrendingUp },
        { text: "Falta pouco pro bonus $$", icon: Trophy },
        { text: "Corrida hoje, vitória amanha", icon: Target },
        { text: "Sua dedicação define seu sucesso", icon: Sparkles },
        { text: "Cada lead é uma nova oportunidade", icon: TrendingUp },
        { text: "Persistência é a chave do resultado", icon: Target },
        { text: "Hoje é dia de bater metas!", icon: Trophy },
        { text: "O sucesso é a soma de pequenos esforços", icon: Sparkles },
    ];

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bom dia";
        if (hour < 18) return "Boa tarde";
        return "Boa noite";
    };

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const CurrentIcon = phrases[currentPhraseIndex].icon;

    return (
        <div className="relative group overflow-hidden rounded-3xl p-[1px]">
            {/* Animated Gradient Border */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-primary opacity-50 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-xy blur-sm"></div>

            <div className="relative bg-card/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10 h-full overflow-hidden">
                {/* Background ambient glow */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    {/* Pulsing Avatar Container */}
                    <div className="relative">
                        <motion.div
                            className="absolute inset-0 rounded-full bg-primary/30 blur-md"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-primary/50"
                            animate={{
                                scale: [1, 1.5],
                                opacity: [1, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeOut",
                            }}
                        />
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary/20 bg-muted flex items-center justify-center relative shadow-2xl z-10">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar.startsWith('http') || user.avatar.startsWith('/')
                                        ? `${user.avatar.startsWith('/') ? import.meta.env.VITE_API_URL || 'http://localhost:3000' : ''}${user.avatar}`
                                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Sparkles className="w-16 h-16 text-primary" />
                            )}
                        </div>
                    </div>

                    {/* Welcome Text */}
                    <div className="flex-1 text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-md">
                                {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400 capitalize">{userName}</span>!
                            </h1>
                            <p className="text-muted-foreground mt-2 text-lg md:text-xl font-light">
                                Vamos quebrar recordes hoje?
                            </p>
                        </motion.div>
                    </div>

                    {/* Rotating Phrases - HUD Style */}
                    <div className="hidden lg:flex flex-col items-end justify-center min-w-[320px]">
                        <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-4 w-full relative overflow-hidden group-hover:border-primary/30 transition-colors duration-500">
                            {/* Scanning line effect */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 blur-[2px] animate-scan-line opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentPhraseIndex}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="flex items-center gap-3 justify-end"
                                >
                                    <div className="flex-1 text-right">
                                        <p className="text-lg font-medium text-emerald-300 drop-shadow-sm italic">
                                            "{phrases[currentPhraseIndex].text}"
                                        </p>
                                    </div>
                                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                                        <CurrentIcon className="w-5 h-5" />
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            <div className="h-1 w-full bg-white/5 mt-3 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeSection;
