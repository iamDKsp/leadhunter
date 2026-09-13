import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CyberRadarLoaderProps {
  /** Size variant: "sm" = 120px, "md" = 200px, "lg" = 300px (default) */
  size?: 'sm' | 'md' | 'lg';
  /** Custom label below the radar. Pass null to hide it. */
  label?: string | null;
  /** Extra className on the wrapper */
  className?: string;
}

/**
 * Lead Hunter – Cyber Radar Loading Animation
 * A fully transparent canvas radar sweep used as the app-wide loading indicator.
 */
export function CyberRadarLoader({
  size = 'lg',
  label = 'RASTREAMENTO ATIVO...',
  className,
}: CyberRadarLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const canvasSize = size === 'sm' ? 120 : size === 'md' ? 200 : 300;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const dpr = window.devicePixelRatio || 1;
    const logical = canvasSize;
    canvas.width = logical * dpr;
    canvas.height = logical * dpr;
    ctx.scale(dpr, dpr);

    const cx = logical / 2;
    const cy = logical / 2;
    const radius = logical * 0.35; // 35% of logical size

    let angle = 0;
    let time = 0;

    // Sonar waves
    const sonarWaves = [
      { r: 0, alpha: 1 },
      { r: radius * 0.32, alpha: 0.6 },
      { r: radius * 0.64, alpha: 0.2 },
    ];

    // Targets (scaled)
    const scale = logical / 400;
    const targets = [
      { angle: 0.7,  dist: 85 * scale, brightness: 0, size: 3.5 * scale, label: 'LEAD #01' },
      { angle: 2.1,  dist: 115 * scale, brightness: 0, size: 4.0 * scale, label: 'HOT LEAD' },
      { angle: 3.6,  dist: 55 * scale,  brightness: 0, size: 3.0 * scale, label: 'LEAD #03' },
      { angle: 4.9,  dist: 95 * scale,  brightness: 0, size: 4.2 * scale, label: 'QUALIFIED' },
      { angle: 5.8,  dist: 70 * scale,  brightness: 0, size: 3.2 * scale, label: 'LEAD #05' },
    ];

    function drawFrame() {
      ctx.clearRect(0, 0, logical, logical);

      time += 0.03;
      angle = (angle + 0.042) % (Math.PI * 2);

      const pulse = Math.sin(time * 2.4) * (3.2 * scale);
      const r = radius + pulse;

      ctx.save();
      ctx.translate(cx, cy);

      // ── 1. Sonar waves ──────────────────────────────────────────
      sonarWaves.forEach(w => {
        w.r += 0.85 * scale;
        if (w.r > r) w.r = 0;
        const progress = w.r / r;
        w.alpha = Math.max(0, (1 - progress) * 0.45);
        ctx.strokeStyle = `rgba(0, 245, 155, ${w.alpha})`;
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.arc(0, 0, w.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // ── 2. Rings & crosshairs ───────────────────────────────────
      const glowPulse = (6 + Math.sin(time * 2.4) * 3) * scale;

      ctx.strokeStyle = 'rgba(0, 212, 200, 0.55)';
      ctx.lineWidth = (2 + Math.sin(time * 2.4) * 0.3) * scale;
      ctx.shadowColor = '#00d4c8';
      ctx.shadowBlur = glowPulse;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(0, 245, 155, 0.22)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, r + 7 * scale, 0, Math.PI * 2);
      ctx.stroke();

      [0.28, 0.52, 0.76].forEach((factor, idx) => {
        ctx.strokeStyle = idx % 2 === 0 ? 'rgba(0, 245, 155, 0.25)' : 'rgba(168, 85, 247, 0.22)';
        ctx.lineWidth = 1 * scale;
        ctx.setLineDash(idx === 1 ? [4 * scale, 4 * scale] : []);
        ctx.beginPath();
        ctx.arc(0, 0, r * factor, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Crosshairs
      ctx.strokeStyle = 'rgba(0, 245, 155, 0.55)';
      ctx.lineWidth = 1.6 * scale;
      const gap = 14 * scale;
      ctx.beginPath();
      ctx.moveTo(-r - 10 * scale, 0); ctx.lineTo(-gap, 0);
      ctx.moveTo(gap, 0);             ctx.lineTo(r + 10 * scale, 0);
      ctx.moveTo(0, -r - 10 * scale); ctx.lineTo(0, -gap);
      ctx.moveTo(0, gap);             ctx.lineTo(0, r + 10 * scale);
      ctx.stroke();

      // Angular ticks
      ctx.strokeStyle = 'rgba(0, 212, 200, 0.4)';
      ctx.lineWidth = 1.2 * scale;
      for (let i = 0; i < 36; i++) {
        const a = (i * Math.PI) / 18;
        const isMajor = i % 9 === 0;
        const len = (isMajor ? 10 : 5) * scale;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r - len), Math.sin(a) * (r - len));
        ctx.lineTo(Math.cos(a) * r,         Math.sin(a) * r);
        ctx.stroke();
      }

      // ── 3. Radar sweep ──────────────────────────────────────────
      const sweepArc = Math.PI * 0.45;
      const grad = ctx.createRadialGradient(0, 0, 5 * scale, 0, 0, r);
      grad.addColorStop(0,   'rgba(0, 245, 155, 0.35)');
      grad.addColorStop(0.7, 'rgba(0, 212, 200, 0.15)');
      grad.addColorStop(1,   'rgba(168, 85, 247, 0.0)');

      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, angle - sweepArc, angle);
      ctx.closePath();
      ctx.fill();

      const frontX = Math.cos(angle) * r;
      const frontY = Math.sin(angle) * r;
      const lineGrad = ctx.createLinearGradient(0, 0, frontX, frontY);
      lineGrad.addColorStop(0,    'rgba(255, 255, 255, 0.9)');
      lineGrad.addColorStop(0.3,  '#00f59b');
      lineGrad.addColorStop(0.85, '#00d4c8');
      lineGrad.addColorStop(1,    '#a855f7');

      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 2.2 * scale;
      ctx.shadowColor = '#00f59b';
      ctx.shadowBlur = 10 * scale;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(frontX, frontY);
      ctx.stroke();
      ctx.restore();

      // ── 4. Detected leads (pings) ───────────────────────────────
      targets.forEach(t => {
        let diff = angle - t.angle;
        while (diff < 0) diff += Math.PI * 2;
        while (diff >= Math.PI * 2) diff -= Math.PI * 2;
        if (diff < 0.12) t.brightness = 1.0;
        else t.brightness *= 0.965;

        if (t.brightness > 0.05) {
          const tx = Math.cos(t.angle) * t.dist;
          const ty = Math.sin(t.angle) * t.dist;

          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00f59b';
          ctx.shadowBlur = 12 * t.brightness * scale;
          ctx.beginPath();
          ctx.arc(tx, ty, t.size * (0.8 + t.brightness * 0.4), 0, Math.PI * 2);
          ctx.fill();

          const pingR = t.size + (1 - t.brightness) * 16 * scale;
          ctx.strokeStyle = `rgba(0, 245, 155, ${t.brightness * 0.8})`;
          ctx.lineWidth = 1.5 * scale;
          ctx.beginPath();
          ctx.arc(tx, ty, pingR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      });

      // ── 5. Center core ──────────────────────────────────────────
      const corePulse = Math.sin(time * 4) * 1.5 * scale;
      ctx.strokeStyle = '#00f59b';
      ctx.lineWidth = 2 * scale;
      ctx.shadowColor = '#00f59b';
      ctx.shadowBlur = 8 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 7 * scale + corePulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, 0, 2.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      // ── 6. Outer arrows & corners ───────────────────────────────
      const arrowFloat = Math.sin(time * 3.0) * 3.5 * scale;
      const arrowDist  = r + (18 + 0) * scale + arrowFloat;
      const arrowAlpha = 0.5 + Math.sin(time * 3.0) * 0.3;

      ctx.save();
      ctx.strokeStyle = `rgba(0, 245, 155, ${arrowAlpha})`;
      ctx.lineWidth = 1.8 * scale;
      ctx.shadowColor = '#00f59b';
      ctx.shadowBlur = 6 * arrowAlpha * scale;

      const dirs = [
        { x: 0,          y: -arrowDist, rot: 0              },
        { x:  arrowDist, y: 0,          rot: Math.PI / 2    },
        { x: 0,          y:  arrowDist, rot: Math.PI        },
        { x: -arrowDist, y: 0,          rot: -Math.PI / 2   },
      ];
      dirs.forEach(d => {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);
        ctx.beginPath();
        ctx.moveTo(-5.5 * scale, -4 * scale);
        ctx.lineTo(0, 2 * scale);
        ctx.lineTo(5.5 * scale, -4 * scale);
        ctx.stroke();
        ctx.restore();
      });

      const cornerDist = r + (22 * scale) + Math.sin(time * 2.4) * 2 * scale;
      const cornerLen  = 10 * scale;
      ctx.strokeStyle = `rgba(0, 212, 200, ${0.35 + Math.sin(time * 2.4) * 0.15})`;
      ctx.lineWidth = 1.5 * scale;
      ctx.shadowBlur = 4 * scale;
      ([
        [-cornerDist, -cornerDist,  1,  1],
        [ cornerDist, -cornerDist, -1,  1],
        [-cornerDist,  cornerDist,  1, -1],
        [ cornerDist,  cornerDist, -1, -1],
      ] as [number, number, number, number][]).forEach(([bx, by, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(bx,              by + dy * cornerLen);
        ctx.lineTo(bx,              by);
        ctx.lineTo(bx + dx * cornerLen, by);
        ctx.stroke();
      });

      ctx.restore();
      ctx.restore(); // translate

      rafRef.current = requestAnimationFrame(drawFrame);
    }

    rafRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasSize]);

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <canvas
        ref={canvasRef}
        style={{ width: canvasSize, height: canvasSize }}
      />
      {label && (
        <p
          className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f59b] via-[#00d4c8] to-[#a855f7] font-semibold uppercase tracking-[0.22em] drop-shadow-[0_0_8px_rgba(0,245,155,0.4)]"
          style={{ fontSize: size === 'sm' ? '0.6rem' : size === 'md' ? '0.65rem' : '0.7rem', marginTop: size === 'sm' ? '4px' : '8px' }}
        >
          {label}
        </p>
      )}
    </div>
  );
}
