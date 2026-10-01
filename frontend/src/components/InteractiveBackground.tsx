import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  glowColor: string;
  alpha: number;
  pulseSpeed: number;
  pulseOffset: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface InteractiveBackgroundProps {
  theme?: 'dark' | 'light';
  particleCount?: number;
}

export const InteractiveBackground: React.FC<InteractiveBackgroundProps> = ({
  theme = 'dark',
  particleCount = 65,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; isHovering: boolean; targetX: number; targetY: number }>({
    x: -9999,
    y: -9999,
    targetX: -9999,
    targetY: -9999,
    isHovering: false,
  });
  const ripplesRef = useRef<Ripple[]>([]);
  const [activeNodesCount, setActiveNodesCount] = useState(particleCount);
  const [interactionStats, setInteractionStats] = useState({ clicks: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Color palettes tuned for dark and light modes
    const isDark = theme === 'dark';
    const colorPalette = isDark
      ? [
          { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.6)' },   // Cyan
          { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)' },   // Blue
          { color: '#10b981', glow: 'rgba(16, 185, 129, 0.6)' },   // Emerald
          { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' },   // Purple
          { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)' },   // Amber
        ]
      : [
          { color: '#0284c7', glow: 'rgba(2, 132, 199, 0.45)' },   // Dark Sky
          { color: '#2563eb', glow: 'rgba(37, 99, 235, 0.45)' },   // Royal Blue
          { color: '#059669', glow: 'rgba(5, 150, 105, 0.45)' },   // Deep Emerald
          { color: '#7c3aed', glow: 'rgba(124, 58, 237, 0.45)' },  // Deep Violet
          { color: '#d97706', glow: 'rgba(217, 119, 6, 0.45)' },   // Amber
        ];

    // Initialize particles
    const particles: Particle[] = [];
    const count = Math.min(particleCount, Math.floor((width * height) / 14000));
    setActiveNodesCount(count);

    for (let i = 0; i < count; i++) {
      const palette = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      const baseRadius = Math.random() * 2.2 + 1.2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: baseRadius,
        baseRadius,
        color: palette.color,
        glowColor: palette.glow,
        alpha: Math.random() * 0.45 + 0.35,
        pulseSpeed: Math.random() * 0.03 + 0.015,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.isHovering = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.isHovering = false;
      mouseRef.current.targetX = -9999;
      mouseRef.current.targetY = -9999;
    };

    const handleWindowClick = (e: MouseEvent) => {
      // Trigger glowing wave ripple on click
      const isDark = theme === 'dark';
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 5,
        maxRadius: Math.max(width, height) * 0.45,
        alpha: isDark ? 0.7 : 0.5,
        color: isDark ? '56, 189, 248' : '2, 132, 199',
      });
      setInteractionStats((prev) => ({ ...prev, clicks: prev.clicks + 1 }));

      // Push particles outward from click point
      particles.forEach((p) => {
        const dx = p.x - e.clientX;
        const dy = p.y - e.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 220 && dist > 0) {
          const force = (220 - dist) / 220;
          p.vx += (dx / dist) * force * 3;
          p.vy += (dy / dist) * force * 3;
        }
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleWindowClick);

    let time = 0;
    const maxLinkDist = 130;
    const mouseRadius = 180;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      if (mouseRef.current.isHovering) {
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.15;
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.15;
      } else {
        mouseRef.current.x = -9999;
        mouseRef.current.y = -9999;
      }

      // Draw subtle ambient grid lines
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(15, 23, 42, 0.035)';
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update and draw ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += 4;
        r.alpha *= 0.96;

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r.color}, ${r.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        if (r.alpha < 0.01 || r.radius > r.maxRadius) {
          ripplesRef.current.splice(i, 1);
        }
      }

      // Mouse proximity glow field
      if (mouseRef.current.isHovering) {
        const grad = ctx.createRadialGradient(
          mouseRef.current.x,
          mouseRef.current.y,
          0,
          mouseRef.current.x,
          mouseRef.current.y,
          mouseRadius
        );
        grad.addColorStop(0, isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(2, 132, 199, 0.1)');
        grad.addColorStop(0.6, isDark ? 'rgba(56, 189, 248, 0.04)' : 'rgba(2, 132, 199, 0.03)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouseRef.current.x, mouseRef.current.y, mouseRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Connect particles with network lines
      let connectedLines = 0;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxLinkDist) {
            connectedLines++;
            const alpha = (1 - dist / maxLinkDist) * (isDark ? 0.22 : 0.18);
            ctx.strokeStyle = isDark
              ? `rgba(56, 189, 248, ${alpha})`
              : `rgba(2, 132, 199, ${alpha})`;
            ctx.lineWidth = (1 - dist / maxLinkDist) * 1.2;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Connect particle to mouse if nearby
        const p = particles[i];
        if (mouseRef.current.isHovering) {
          const mdx = p.x - mouseRef.current.x;
          const mdy = p.y - mouseRef.current.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mdist < mouseRadius) {
            const mAlpha = (1 - mdist / mouseRadius) * (isDark ? 0.65 : 0.5);
            ctx.strokeStyle = isDark
              ? `rgba(56, 189, 248, ${mAlpha})`
              : `rgba(2, 132, 199, ${mAlpha})`;
            ctx.lineWidth = (1 - mdist / mouseRadius) * 1.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
            ctx.stroke();

            // Subtle mouse repulsion/swirl
            const repelForce = (mouseRadius - mdist) / mouseRadius;
            p.vx += (mdx / mdist) * repelForce * 0.08;
            p.vy += (mdy / mdist) * repelForce * 0.08;
          }
        }
      }

      // Update and draw particles
      particles.forEach((p) => {
        // Natural speed damping
        p.vx *= 0.985;
        p.vy *= 0.985;

        // Minimum drift
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < 0.2) {
          p.vx += (Math.random() - 0.5) * 0.05;
          p.vy += (Math.random() - 0.5) * 0.05;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Bounce gently at screen borders
        if (p.x < 0) {
          p.x = 0;
          p.vx *= -1;
        } else if (p.x > width) {
          p.x = width;
          p.vx *= -1;
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy *= -1;
        } else if (p.y > height) {
          p.y = height;
          p.vy *= -1;
        }

        // Gentle breathing pulse
        const pulse = Math.sin(time * p.pulseSpeed * 60 + p.pulseOffset);
        p.radius = p.baseRadius + pulse * 0.6;

        // Draw particle outer halo
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = p.glowColor;
        ctx.fill();

        // Draw particle core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isDark ? 8 : 4;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleWindowClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, particleCount]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'auto',
          zIndex: 0,
        }}
      />
      {/* Floating Interactive Telemetry HUD (Bottom Left) */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          left: '1.5rem',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.45rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: theme === 'dark' ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          fontSize: '0.74rem',
          color: 'var(--text-muted)',
          userSelect: 'none',
          pointerEvents: 'auto',
        }}
      >
        <span className="pulse-dot pulse-cyan" />
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
          Interactive Neural Grid
        </span>
        <span style={{ opacity: 0.5 }}>•</span>
        <span>{activeNodesCount} Live Nodes</span>
        {interactionStats.clicks > 0 && (
          <>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ color: 'var(--accent-emerald)' }}>
              {interactionStats.clicks} Pulses Triggered
            </span>
          </>
        )}
        <span style={{ opacity: 0.5 }}>•</span>
        <span style={{ color: 'var(--accent-cyan)' }}>Move cursor or click anywhere to interact</span>
      </div>
    </>
  );
};
