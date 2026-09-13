import React, { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<any> | void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className,
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 60;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    const container = containerRef.current;
    if (container && container.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      isDraggingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || startYRef.current === null || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      const distance = Math.min(diff * 0.42, 85);
      setPullDistance(distance);

      if (distance >= PULL_THRESHOLD && pullDistance < PULL_THRESHOLD) {
        triggerHaptic('light');
      }
    } else {
      setPullDistance(0);
      isDraggingRef.current = false;
    }
  };

  const handleTouchEnd = async () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    startYRef.current = null;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.85);
      triggerHaptic('medium');

      try {
        await Promise.resolve(onRefresh());
        triggerHaptic('success');
      } catch (err) {
        console.error('Error during pull to refresh:', err);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 300);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn('relative h-full flex flex-col', className)}
    >
      {/* Pull Indicator Pill */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center justify-center',
          !isDraggingRef.current && 'transition-all duration-300'
        )}
        style={{
          top: `${Math.max(pullDistance - 45, -50)}px`,
          opacity: pullDistance > 10 ? Math.min(pullDistance / PULL_THRESHOLD, 1) : 0,
        }}
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/95 border border-border/80 shadow-lg text-xs font-semibold text-primary backdrop-blur-md">
          <RefreshCw
            className={cn(
              'w-3.5 h-3.5',
              isRefreshing
                ? 'animate-spin text-primary'
                : 'transition-transform duration-200'
            )}
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${Math.min(pullDistance * 4, 360)}deg)`,
            }}
          />
          <span>{isRefreshing ? 'Atualizando...' : pullDistance >= PULL_THRESHOLD ? 'Solte para atualizar' : 'Puxe para atualizar'}</span>
        </div>
      </div>

      {/* Main Content with subtle translate during pull */}
      <div
        className={cn(
          'flex-1 flex flex-col',
          !isDraggingRef.current && 'transition-transform duration-300'
        )}
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.5}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
