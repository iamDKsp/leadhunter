import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Download, CheckSquare, Check, Sparkles } from 'lucide-react';
import { SimulatedCursor } from './SimulatedCursor';

export function ExportLeadsPreview() {
    // 0: Initial table view with selected rows
    // 1: Move to Export button
    // 2: Click Export button
    // 3: Downloading / Progress bar
    // 4: Download complete notification
    const [step, setStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: 40, y: 50 });
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const runCycle = () => {
            if (!isMounted) return;

            setStep(0);
            setProgress(0);
            setCursorPos({ x: 30, y: 35 });
            setIsClicking(false);

            // 1. Move to Export button
            timeoutId = setTimeout(() => {
                if (!isMounted) return;
                setStep(1);
                setCursorPos({ x: 275, y: 35 });

                // 2. Click Export
                setTimeout(() => {
                    if (!isMounted) return;
                    setIsClicking(true);
                    setStep(2);

                    setTimeout(() => {
                        if (!isMounted) return;
                        setIsClicking(false);
                        setStep(3);

                        // 3. Progress animation
                        let p = 0;
                        const interval = setInterval(() => {
                            if (!isMounted) {
                                clearInterval(interval);
                                return;
                            }
                            p += 25;
                            setProgress(p);

                            if (p >= 100) {
                                clearInterval(interval);
                                setStep(4);
                                setCursorPos({ x: 310, y: 190 });

                                setTimeout(() => {
                                    if (isMounted) runCycle();
                                }, 3500);
                            }
                        }, 200);
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

    const rows = [
        { name: 'Hospital Santa Clara', tel: '(11) 98123-4567', segment: 'Saúde' },
        { name: 'Auto Mecânica Paulista', tel: '(11) 97234-5678', segment: 'Automotivo' },
        { name: 'Escola Aquarela Kids', tel: '(11) 96345-6789', segment: 'Educação' },
    ];

    return (
        <div className="relative w-full h-full p-3.5 flex flex-col justify-between select-none overflow-hidden font-sans text-xs">
            {/* Simulated Cursor */}
            <SimulatedCursor x={cursorPos.x} y={cursorPos.y} isClicking={isClicking} />

            {/* Header with Export Button */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-foreground text-xs">Exportação de Base</span>
                </div>

                <motion.button
                    animate={{ scale: isClicking && step === 2 ? 0.93 : 1 }}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-md text-[11px] font-medium shadow-sm transition-colors"
                >
                    <Download className="w-3 h-3" />
                    <span>Exportar Excel</span>
                </motion.button>
            </div>

            {/* Table Mockup */}
            <div className="my-auto border border-border/70 rounded-lg overflow-hidden bg-card/60">
                <div className="bg-secondary/40 px-2.5 py-1.5 border-b border-border/70 flex items-center text-[10px] font-semibold text-muted-foreground">
                    <span className="w-6 flex items-center">
                        <CheckSquare className="w-3 h-3 text-primary" />
                    </span>
                    <span className="flex-1">EMPRESA</span>
                    <span className="w-24">TELEFONE</span>
                    <span className="w-16 text-right">SETOR</span>
                </div>

                <div className="divide-y divide-border/40">
                    {rows.map((row, idx) => (
                        <div
                            key={idx}
                            className="px-2.5 py-1.5 flex items-center text-[10px] bg-primary/[0.03]"
                        >
                            <span className="w-6 flex items-center">
                                <CheckSquare className="w-2.5 h-2.5 text-primary" />
                            </span>
                            <span className="flex-1 font-medium text-foreground truncate">{row.name}</span>
                            <span className="w-24 text-muted-foreground font-mono text-[9px]">{row.tel}</span>
                            <span className="w-16 text-right text-muted-foreground">{row.segment}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Download Progress or Completion */}
            <div className="h-9 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    {step === 3 && (
                        <motion.div
                            key="downloading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-1"
                        >
                            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                                <span>Gerando planilha formatada...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-emerald-500 rounded-full"
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1.5 rounded-md text-[10px] font-medium"
                        >
                            <span className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5" /> leads_exportados_2026.xlsx
                            </span>
                            <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                                3 linhas
                            </span>
                        </motion.div>
                    )}

                    {step < 3 && (
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                            <span>3 leads selecionados</span>
                            <span className="text-primary font-medium flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> Pronto para exportar
                            </span>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
