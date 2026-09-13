import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Phone, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { SimulatedCursor } from './SimulatedCursor';

export function SearchLeadsPreview() {
    // Animation phases:
    // 0: Initial
    // 1: Typing search query
    // 2: Move cursor to search button and click
    // 3: Loading results
    // 4: Show results
    const [step, setStep] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [cursorPos, setCursorPos] = useState({ x: 40, y: 50 });
    const [isClicking, setIsClicking] = useState(false);

    const fullQuery = 'Clínicas Odonto em SP';

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const runCycle = async () => {
            if (!isMounted) return;

            // Step 0: Reset
            setStep(0);
            setTypedText('');
            setCursorPos({ x: 30, y: 45 });
            setIsClicking(false);

            // Step 1: Move to input & type
            timeoutId = setTimeout(() => {
                if (!isMounted) return;
                setStep(1);
                setCursorPos({ x: 100, y: 40 });
                setIsClicking(true);

                setTimeout(() => {
                    if (!isMounted) return;
                    setIsClicking(false);

                    // Typewriter
                    let current = '';
                    let charIndex = 0;
                    const typeInterval = setInterval(() => {
                        if (!isMounted) {
                            clearInterval(typeInterval);
                            return;
                        }
                        if (charIndex < fullQuery.length) {
                            current += fullQuery[charIndex];
                            setTypedText(current);
                            charIndex++;
                        } else {
                            clearInterval(typeInterval);

                            // Step 2: Move to button and click
                            setTimeout(() => {
                                if (!isMounted) return;
                                setStep(2);
                                setCursorPos({ x: 280, y: 40 });

                                setTimeout(() => {
                                    if (!isMounted) return;
                                    setIsClicking(true);

                                    // Step 3: Loading
                                    setTimeout(() => {
                                        if (!isMounted) return;
                                        setIsClicking(false);
                                        setStep(3);
                                        setCursorPos({ x: 310, y: 120 });

                                        // Step 4: Show Results
                                        setTimeout(() => {
                                            if (!isMounted) return;
                                            setStep(4);

                                            // Wait and loop
                                            setTimeout(() => {
                                                if (isMounted) runCycle();
                                            }, 3800);
                                        }, 1000);
                                    }, 400);
                                }, 500);
                            }, 500);
                        }
                    }, 65);
                }, 300);
            }, 800);
        };

        runCycle();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <div className="relative w-full h-full p-4 flex flex-col justify-between select-none overflow-hidden font-sans text-xs">
            {/* Simulated Cursor */}
            <SimulatedCursor x={cursorPos.x} y={cursorPos.y} isClicking={isClicking} />

            {/* Search Input Bar Mockup */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 bg-background/80 border border-border/80 rounded-lg p-1.5 shadow-sm">
                    <div className="flex items-center pl-2 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                    </div>
                    <div className="flex-1 flex items-center text-xs h-7 text-foreground font-mono">
                        {typedText || (
                            <span className="text-muted-foreground/60">Pesquisar no Google Maps...</span>
                        )}
                        {step === 1 && (
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6 }}
                                className="inline-block w-1.5 h-3.5 bg-primary ml-0.5"
                            />
                        )}
                    </div>
                    <motion.button
                        animate={{ scale: isClicking && step === 2 ? 0.92 : 1 }}
                        className="flex items-center gap-1 bg-primary text-primary-foreground px-2.5 py-1 rounded-md font-medium text-[11px] shadow"
                    >
                        {step === 3 ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Search className="w-3 h-3" />
                        )}
                        <span>Buscar</span>
                    </motion.button>
                </div>

                {/* Status bar */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                    <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Filtro ativo: Telefone Obrigatório
                    </span>
                    {step === 4 && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-emerald-400 font-medium"
                        >
                            2 novos leads encontrados
                        </motion.span>
                    )}
                </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 my-2 flex flex-col justify-center space-y-2">
                <AnimatePresence mode="wait">
                    {step === 3 && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-6 text-muted-foreground space-y-2"
                        >
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <p className="text-[11px]">Minerando dados na API do Google...</p>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                        >
                            {/* Result 1 */}
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-foreground text-xs">Clínica Dental Prime</span>
                                        <span className="flex items-center text-[10px] text-amber-400">
                                            <Star className="w-2.5 h-2.5 fill-amber-400 mr-0.5" /> 4.9 (128)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-2.5 h-2.5 text-emerald-400" /> (11) 98765-4321
                                        </span>
                                        <span>São Paulo - SP</span>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                                    <CheckCircle2 className="w-3 h-3" /> Capturado
                                </span>
                            </motion.div>

                            {/* Result 2 */}
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.25 }}
                                className="p-2.5 rounded-lg border border-border bg-card/60 flex items-center justify-between"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-foreground text-xs">Odonto Sul Estética</span>
                                        <span className="flex items-center text-[10px] text-amber-400">
                                            <Star className="w-2.5 h-2.5 fill-amber-400 mr-0.5" /> 4.8 (94)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-2.5 h-2.5 text-emerald-400" /> (11) 97654-3210
                                        </span>
                                        <span>São Paulo - SP</span>
                                    </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded-md">
                                    Disponível
                                </span>
                            </motion.div>
                        </motion.div>
                    )}

                    {step < 3 && (
                        <div className="h-28 flex flex-col items-center justify-center text-muted-foreground/40 border border-dashed border-border/50 rounded-lg">
                            <Search className="w-6 h-6 mb-1 opacity-50" />
                            <p className="text-[11px]">Aguardando pesquisa...</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
