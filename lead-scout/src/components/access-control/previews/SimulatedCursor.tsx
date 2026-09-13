import { motion } from 'framer-motion';

interface SimulatedCursorProps {
    x: number;
    y: number;
    isClicking?: boolean;
    visible?: boolean;
}

export function SimulatedCursor({ x, y, isClicking = false, visible = true }: SimulatedCursorProps) {
    if (!visible) return null;

    return (
        <motion.div
            className="absolute top-0 left-0 pointer-events-none z-50 transition-transform"
            animate={{
                x,
                y,
                scale: isClicking ? 0.85 : 1,
            }}
            transition={{
                type: 'spring',
                damping: 24,
                stiffness: 180,
            }}
        >
            {/* Cursor SVG */}
            <div className="relative">
                <svg
                    className="w-5 h-5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] text-primary fill-primary stroke-background stroke-[1.5]"
                    viewBox="0 0 24 24"
                >
                    <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
                </svg>

                {/* Click Ripple Effect */}
                {isClicking && (
                    <motion.span
                        className="absolute -top-1 -left-1 w-7 h-7 rounded-full border-2 border-primary bg-primary/20 pointer-events-none"
                        initial={{ scale: 0.5, opacity: 1 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                    />
                )}
            </div>
        </motion.div>
    );
}
