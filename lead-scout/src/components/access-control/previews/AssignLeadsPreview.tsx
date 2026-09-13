import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, UserPlus, Users, Check, Building } from 'lucide-react';
import { SimulatedCursor } from './SimulatedCursor';

export function AssignLeadsPreview() {
    // 0: Initial
    // 1: Move to "Atribuir" button
    // 2: Click to open dropdown
    // 3: Move to salesperson "Mariana Silva"
    // 4: Click to assign
    // 5: Assigned state with badge & check
    const [step, setStep] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: 30, y: 50 });
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const runCycle = () => {
            if (!isMounted) return;

            setStep(0);
            setCursorPos({ x: 40, y: 30 });
            setIsClicking(false);

            // 1. Move to button
            timeoutId = setTimeout(() => {
                if (!isMounted) return;
                setStep(1);
                setCursorPos({ x: 265, y: 75 });

                // 2. Click to open dropdown
                setTimeout(() => {
                    if (!isMounted) return;
                    setIsClicking(true);
                    setStep(2);

                    setTimeout(() => {
                        if (!isMounted) return;
                        setIsClicking(false);

                        // 3. Move to Mariana
                        setTimeout(() => {
                            if (!isMounted) return;
                            setStep(3);
                            setCursorPos({ x: 250, y: 145 });

                            // 4. Click Mariana
                            setTimeout(() => {
                                if (!isMounted) return;
                                setIsClicking(true);
                                setStep(4);

                                // 5. Assigned
                                setTimeout(() => {
                                    if (!isMounted) return;
                                    setIsClicking(false);
                                    setStep(5);
                                    setCursorPos({ x: 300, y: 190 });

                                    setTimeout(() => {
                                        if (isMounted) runCycle();
                                    }, 3500);
                                }, 350);
                            }, 500);
                        }, 500);
                    }, 250);
                }, 500);
            }, 700);
        };

        runCycle();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    const isAssigned = step >= 4;
    const dropdownOpen = step >= 2 && step <= 4;

    return (
        <div className="relative w-full h-full p-4 flex flex-col justify-between select-none overflow-hidden font-sans text-xs">
            {/* Simulated Cursor */}
            <SimulatedCursor x={cursorPos.x} y={cursorPos.y} isClicking={isClicking} />

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-semibold text-foreground text-xs">Distribuição de Oportunidades</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Roleta de Leads</span>
            </div>

            {/* Lead Card Container */}
            <div className="relative my-auto">
                <div className="p-3 bg-card border border-border/80 rounded-lg shadow-sm space-y-2.5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">LEAD #4082</span>
                            <h4 className="font-semibold text-foreground text-xs flex items-center gap-1">
                                <Building className="w-3 h-3 text-primary" /> Hotel & Spa Villa Real
                            </h4>
                            <p className="text-[10px] text-muted-foreground">contato@hotelvillareal.com.br</p>
                        </div>
                        <span className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full border border-primary/20">
                            Novo
                        </span>
                    </div>

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-muted-foreground" /> Vendedor:
                        </span>

                        {isAssigned ? (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded-md text-[11px] font-medium"
                            >
                                <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[9px] font-bold">
                                    MS
                                </span>
                                <span>Mariana Silva</span>
                                <Check className="w-3 h-3 text-emerald-400" />
                            </motion.div>
                        ) : (
                            <motion.button
                                animate={{ scale: isClicking && step === 1 ? 0.94 : 1 }}
                                className="flex items-center gap-1 bg-secondary text-foreground hover:bg-secondary/80 border border-border px-2 py-1 rounded-md text-[11px] font-medium transition-colors"
                            >
                                <UserPlus className="w-3 h-3 text-primary" />
                                <span>Atribuir Vendedor</span>
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Dropdown Menu Mockup */}
                <AnimatePresence>
                    {dropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-24 w-48 bg-popover border border-border rounded-lg shadow-xl p-1.5 z-20 space-y-1"
                        >
                            <p className="text-[9px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                                Selecionar Vendedor
                            </p>

                            <div className="p-1.5 rounded flex items-center justify-between text-[11px] text-muted-foreground hover:bg-secondary/40 cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[9px] font-bold">
                                        CM
                                    </div>
                                    <span>Carlos Mendes</span>
                                </div>
                                <span className="text-[9px] text-muted-foreground">Livre</span>
                            </div>

                            <motion.div
                                animate={{
                                    backgroundColor: step === 3 || step === 4 ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                }}
                                className="p-1.5 rounded flex items-center justify-between text-[11px] text-foreground cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-bold">
                                        MS
                                    </div>
                                    <span className="font-medium">Mariana Silva</span>
                                </div>
                                <span className="text-[9px] text-emerald-400 font-medium">Recomendado</span>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Status */}
            <div className="h-5 flex items-center justify-center">
                {step === 5 && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20"
                    >
                        <Check className="w-3 h-3" /> Notificação enviada para Mariana no WhatsApp
                    </motion.div>
                )}
            </div>
        </div>
    );
}
