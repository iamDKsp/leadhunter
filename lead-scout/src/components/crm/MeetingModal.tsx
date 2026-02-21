import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { playMeetingSound } from '@/hooks/useSounds';

interface MeetingModalProps {
    open: boolean;
    onClose: () => void;
    leadName?: string;
}

const MeetingModal = ({ open, onClose, leadName }: MeetingModalProps) => {
    const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string; size: number; rotate: number }>>([]);

    useEffect(() => {
        if (open) {
            // Play meeting celebration sound
            playMeetingSound();

            // Generate confetti pieces — purple/violet palette
            const colors = ['#8b5cf6', '#a78bfa', '#7c3aed', '#6d28d9', '#c084fc', '#ddd6fe', '#4f46e5', '#818cf8', '#e879f9', '#f0abfc'];
            const pieces = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 2,
                duration: 2 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 6 + Math.random() * 10,
                rotate: Math.random() * 360,
            }));
            setConfettiPieces(pieces);

            // Auto-close after 5 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [open, onClose]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-transparent border-none shadow-none overflow-visible p-0">
                <div className="relative">
                    {/* Confetti */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ height: '500px', top: '-100px', left: '-50px', right: '-50px', width: 'calc(100% + 100px)' }}>
                        {confettiPieces.map((piece) => (
                            <div
                                key={piece.id}
                                className="absolute"
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
                    <div className="relative bg-card/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 text-center animate-celebration-pop" style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.3), 0 0 80px rgba(139, 92, 246, 0.1)' }}>
                        {/* Calendar + Handshake emoji */}
                        <div className="text-6xl mb-4 animate-bounce">
                            📅🤝
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-purple-400 mb-2">
                            Reunião Agendada!
                        </h2>

                        {leadName && (
                            <p className="text-sm text-muted-foreground mb-2">
                                {leadName}
                            </p>
                        )}

                        <p className="text-sm text-purple-300/80 mb-4">
                            Você está cada vez mais perto de fechar esse negócio! 🚀
                        </p>

                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                            <p className="text-lg font-bold text-purple-400 flex items-center justify-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                                Em Reunião
                            </p>
                        </div>

                        <Button
                            onClick={onClose}
                            className="mt-2 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            Fechar
                        </Button>
                    </div>
                </div>

                {/* CSS Animations */}
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

export default MeetingModal;
