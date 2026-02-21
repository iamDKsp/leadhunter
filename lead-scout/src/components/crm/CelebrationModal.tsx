import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { playCelebrationSound } from '@/hooks/useSounds';

interface CelebrationModalProps {
    open: boolean;
    onClose: () => void;
    value?: number;
    leadName?: string;
}

const COMMISSION_RATE = 0.15; // 15%

const CelebrationModal = ({ open, onClose, value, leadName }: CelebrationModalProps) => {
    const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string; size: number; rotate: number }>>([]);

    useEffect(() => {
        if (open) {
            // Play celebration fanfare
            playCelebrationSound();

            // Generate confetti pieces
            const colors = ['#22c55e', '#10b981', '#34d399', '#fbbf24', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4'];
            const pieces = Array.from({ length: 60 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 2,
                duration: 2 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 6 + Math.random() * 10,
                rotate: Math.random() * 360,
            }));
            setConfettiPieces(pieces);

            // Auto-close after 6 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 6000);

            return () => clearTimeout(timer);
        }
    }, [open, onClose]);

    const commission = value ? value * COMMISSION_RATE : 0;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-transparent border-none shadow-none overflow-visible p-0">
                <div className="relative">
                    {/* Confetti */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ height: '500px', top: '-100px', left: '-50px', right: '-50px', width: 'calc(100% + 100px)' }}>
                        {confettiPieces.map((piece) => (
                            <div
                                key={piece.id}
                                className="absolute animate-confetti-fall"
                                style={{
                                    left: `${piece.left}%`,
                                    top: '-20px',
                                    width: `${piece.size}px`,
                                    height: `${piece.size * 0.6}px`,
                                    backgroundColor: piece.color,
                                    borderRadius: '2px',
                                    transform: `rotate(${piece.rotate}deg)`,
                                    animation: `confetti-fall ${piece.duration}s ease-in ${piece.delay}s forwards, confetti-sway ${piece.duration * 0.5}s ease-in-out ${piece.delay}s infinite alternate`,
                                    opacity: 0,
                                }}
                            />
                        ))}
                    </div>

                    {/* Card */}
                    <div className="relative bg-card/95 backdrop-blur-xl border border-green-500/30 rounded-2xl p-8 text-center animate-celebration-pop" style={{ boxShadow: '0 0 40px rgba(34, 197, 94, 0.3), 0 0 80px rgba(34, 197, 94, 0.1)' }}>
                        {/* Clapping emoji */}
                        <div className="text-6xl mb-4 animate-bounce">
                            👏🎉
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-green-400 mb-2">
                            Parabéns pela venda!
                        </h2>

                        {leadName && (
                            <p className="text-sm text-muted-foreground mb-4">
                                {leadName}
                            </p>
                        )}

                        {/* Value + Commission */}
                        {value && value > 0 ? (
                            <div className="space-y-3 mt-4">
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Valor da Venda</p>
                                    <p className="text-3xl font-bold text-green-400">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                    </p>
                                </div>

                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sua Comissão (15%)</p>
                                    <p className="text-2xl font-bold text-yellow-400">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground mt-2">
                                Continue assim! 💪
                            </p>
                        )}

                        <Button
                            onClick={onClose}
                            className="mt-6 bg-green-600 hover:bg-green-700 text-white"
                        >
                            Fechar
                        </Button>
                    </div>
                </div>

                {/* CSS Animations injected via style tag */}
                <style>{`
                    @keyframes confetti-fall {
                        0% {
                            transform: translateY(0) rotate(0deg);
                            opacity: 1;
                        }
                        100% {
                            transform: translateY(500px) rotate(720deg);
                            opacity: 0;
                        }
                    }
                    @keyframes confetti-sway {
                        0% { transform: translateX(-15px); }
                        100% { transform: translateX(15px); }
                    }
                    @keyframes celebration-pop {
                        0% {
                            transform: scale(0.5);
                            opacity: 0;
                        }
                        50% {
                            transform: scale(1.05);
                        }
                        100% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                    .animate-celebration-pop {
                        animation: celebration-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
};

export default CelebrationModal;
