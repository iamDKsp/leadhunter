import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, CheckCheck, Phone, MoreVertical } from 'lucide-react';
import { SimulatedCursor } from './SimulatedCursor';

export function WhatsAppChatPreview() {
    // 0: Initial chat with incoming message
    // 1: Move to input
    // 2: Typing response
    // 3: Move to Send button and click
    // 4: Message sent with read ticks
    const [step, setStep] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [cursorPos, setCursorPos] = useState({ x: 40, y: 50 });
    const [isClicking, setIsClicking] = useState(false);

    const messageText = 'Olá Dr. Roberto! Segue nossa demonstração:';

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const runCycle = () => {
            if (!isMounted) return;

            setStep(0);
            setTypedText('');
            setCursorPos({ x: 30, y: 30 });
            setIsClicking(false);

            // 1. Move to input
            timeoutId = setTimeout(() => {
                if (!isMounted) return;
                setStep(1);
                setCursorPos({ x: 120, y: 175 });

                setTimeout(() => {
                    if (!isMounted) return;
                    setStep(2);

                    // Typewriter
                    let current = '';
                    let charIndex = 0;
                    const typeInterval = setInterval(() => {
                        if (!isMounted) {
                            clearInterval(typeInterval);
                            return;
                        }
                        if (charIndex < messageText.length) {
                            current += messageText[charIndex];
                            setTypedText(current);
                            charIndex++;
                        } else {
                            clearInterval(typeInterval);

                            // 3. Move to Send
                            setTimeout(() => {
                                if (!isMounted) return;
                                setStep(3);
                                setCursorPos({ x: 305, y: 175 });

                                setTimeout(() => {
                                    if (!isMounted) return;
                                    setIsClicking(true);

                                    // 4. Send
                                    setTimeout(() => {
                                        if (!isMounted) return;
                                        setIsClicking(false);
                                        setStep(4);
                                        setTypedText('');
                                        setCursorPos({ x: 320, y: 80 });

                                        setTimeout(() => {
                                            if (isMounted) runCycle();
                                        }, 3500);
                                    }, 250);
                                }, 400);
                            }, 400);
                        }
                    }, 50);
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
        <div className="relative w-full h-full p-3 flex flex-col justify-between select-none overflow-hidden font-sans text-xs">
            {/* Simulated Cursor */}
            <SimulatedCursor x={cursorPos.x} y={cursorPos.y} isClicking={isClicking} />

            {/* Chat Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                        DR
                    </div>
                    <div>
                        <p className="font-semibold text-foreground text-xs leading-none">Dr. Roberto Medeiros</p>
                        <p className="text-[9px] text-emerald-400 mt-0.5">Online agora</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 hover:text-foreground cursor-pointer" />
                    <MoreVertical className="w-3.5 h-3.5 hover:text-foreground cursor-pointer" />
                </div>
            </div>

            {/* Message Area */}
            <div className="my-auto py-1 space-y-2">
                {/* Incoming Message */}
                <div className="flex justify-start">
                    <div className="max-w-[78%] bg-secondary/80 border border-border/60 rounded-xl rounded-tl-none p-2 text-[11px] text-foreground space-y-0.5">
                        <p>Boa tarde! Gostaria de receber mais informações sobre os planos.</p>
                        <span className="text-[9px] text-muted-foreground block text-right">14:32</span>
                    </div>
                </div>

                {/* Sent Message */}
                <AnimatePresence>
                    {step === 4 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="flex justify-end"
                        >
                            <div className="max-w-[82%] bg-emerald-600/20 border border-emerald-500/30 rounded-xl rounded-tr-none p-2 text-[11px] text-emerald-100 space-y-0.5">
                                <p>{messageText}</p>
                                <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-400/80">
                                    <span>14:33</span>
                                    <CheckCheck className="w-3 h-3 text-sky-400" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Message Input Bar */}
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/60">
                <div className="flex-1 flex items-center bg-secondary/60 border border-border/60 rounded-md px-2.5 h-7 text-[11px] font-mono text-foreground">
                    {typedText ? (
                        <span>{typedText}</span>
                    ) : (
                        <span className="text-muted-foreground/50">Digite uma mensagem...</span>
                    )}
                    {step === 2 && (
                        <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="inline-block w-1.5 h-3 bg-emerald-400 ml-0.5"
                        />
                    )}
                </div>

                <motion.button
                    animate={{ scale: isClicking && step === 3 ? 0.9 : 1 }}
                    className="w-7 h-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md flex items-center justify-center shadow transition-colors"
                >
                    <Send className="w-3.5 h-3.5" />
                </motion.button>
            </div>
        </div>
    );
}
