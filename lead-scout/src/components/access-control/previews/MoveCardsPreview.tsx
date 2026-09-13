import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Kanban, DollarSign, Building2, Check, ArrowRight } from 'lucide-react';
import { SimulatedCursor } from './SimulatedCursor';

export function MoveCardsPreview() {
    // Phases:
    // 0: Initial state (card in Column 1)
    // 1: Cursor moves to card
    // 2: Grab card (hold)
    // 3: Dragging to Column 2
    // 4: Drop in Column 2 with success pulse
    const [phase, setPhase] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: 30, y: 70 });
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const runCycle = () => {
            if (!isMounted) return;

            setPhase(0);
            setCursorPos({ x: 40, y: 40 });
            setIsClicking(false);

            // 1. Move to card
            timeoutId = setTimeout(() => {
                if (!isMounted) return;
                setPhase(1);
                setCursorPos({ x: 90, y: 110 });

                // 2. Grab card
                setTimeout(() => {
                    if (!isMounted) return;
                    setPhase(2);
                    setIsClicking(true);

                    // 3. Drag to Column 2
                    setTimeout(() => {
                        if (!isMounted) return;
                        setPhase(3);
                        setCursorPos({ x: 260, y: 110 });

                        // 4. Drop in Column 2
                        setTimeout(() => {
                            if (!isMounted) return;
                            setPhase(4);
                            setIsClicking(false);

                            // Loop restart
                            setTimeout(() => {
                                if (isMounted) runCycle();
                            }, 3200);
                        }, 900);
                    }, 400);
                }, 600);
            }, 700);
        };

        runCycle();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    const isCardInCol2 = phase >= 3;

    return (
        <div className="relative w-full h-full p-3.5 flex flex-col justify-between select-none overflow-hidden font-sans text-xs">
            {/* Simulated Cursor */}
            <SimulatedCursor x={cursorPos.x} y={cursorPos.y} isClicking={isClicking} />

            {/* Header info */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Kanban className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold text-foreground text-xs">Funil Comercial</span>
                </div>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    Arraste para avançar <ArrowRight className="w-2.5 h-2.5" />
                </span>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-2 gap-2.5 my-auto">
                {/* Column 1: Novos Leads */}
                <div className="bg-secondary/30 border border-border/70 rounded-lg p-2 flex flex-col min-h-[140px]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[11px] text-foreground">Novos Leads</span>
                        <span className="text-[9px] bg-background/80 px-1.5 py-0.5 rounded text-muted-foreground border border-border">
                            {isCardInCol2 ? '0' : '1'}
                        </span>
                    </div>

                    <div className="flex-1 relative flex flex-col justify-start">
                        {!isCardInCol2 ? (
                            <motion.div
                                layoutId="lead-card"
                                animate={{
                                    scale: phase === 2 ? 1.05 : 1,
                                    rotate: phase === 2 ? 2 : 0,
                                    boxShadow: phase === 2 ? '0 10px 25px -5px rgba(0,0,0,0.5)' : 'none',
                                }}
                                className="bg-card border border-primary/30 rounded-md p-2 shadow-sm space-y-1"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-foreground text-[11px] flex items-center gap-1">
                                        <Building2 className="w-3 h-3 text-primary" /> Alfa Seguros
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                                    <span className="flex items-center text-emerald-400 font-medium">
                                        <DollarSign className="w-2.5 h-2.5" /> R$ 8.500
                                    </span>
                                    <span className="text-[9px] bg-primary/10 text-primary px-1 rounded">Contato</span>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full border border-dashed border-border/40 rounded-md flex items-center justify-center text-[10px] text-muted-foreground/40">
                                Coluna vazia
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Proposta Enviada */}
                <div className="bg-secondary/30 border border-border/70 rounded-lg p-2 flex flex-col min-h-[140px]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[11px] text-foreground">Proposta Enviada</span>
                        <span className="text-[9px] bg-background/80 px-1.5 py-0.5 rounded text-muted-foreground border border-border">
                            {isCardInCol2 ? '1' : '0'}
                        </span>
                    </div>

                    <div className="flex-1 relative flex flex-col justify-start">
                        {isCardInCol2 ? (
                            <motion.div
                                layoutId="lead-card"
                                initial={{ scale: 1.05, rotate: 2 }}
                                animate={{
                                    scale: 1,
                                    rotate: 0,
                                    borderColor: phase === 4 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(59, 130, 246, 0.4)',
                                }}
                                transition={{ type: 'spring', damping: 20 }}
                                className="bg-card border rounded-md p-2 shadow-sm space-y-1"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-foreground text-[11px] flex items-center gap-1">
                                        <Building2 className="w-3 h-3 text-emerald-400" /> Alfa Seguros
                                    </span>
                                    {phase === 4 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="text-emerald-400"
                                        >
                                            <Check className="w-3 h-3" />
                                        </motion.span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                                    <span className="flex items-center text-emerald-400 font-medium">
                                        <DollarSign className="w-2.5 h-2.5" /> R$ 8.500
                                    </span>
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1 rounded font-medium">
                                        Proposta OK
                                    </span>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full border border-dashed border-border/40 rounded-md flex items-center justify-center text-[10px] text-muted-foreground/40">
                                Solte aqui
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom notification */}
            <div className="h-5 flex items-center justify-center">
                {phase === 4 && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                    >
                        <Check className="w-3 h-3" /> Negócio atualizado no CRM com sucesso
                    </motion.div>
                )}
            </div>
        </div>
    );
}
