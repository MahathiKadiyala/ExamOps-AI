import React, { useState } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';

interface AvyraRobotAssistantProps {
  isOpen: boolean;
  onClick: () => void;
  conflictCount?: number;
  onQuickConflictReview?: () => void;
}

export const AvyraRobotAssistant: React.FC<AvyraRobotAssistantProps> = ({
  isOpen,
  onClick,
  conflictCount = 0,
  onQuickConflictReview,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // When the agent panel is open, the assistant is represented inside the agent header and card
  if (isOpen) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (conflictCount > 0 && onQuickConflictReview) {
      onQuickConflictReview();
    } else {
      onClick();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: '28px',
        bottom: '36px',
        zIndex: 55,
        userSelect: 'none',
      }}
    >
      {/* Interactive Floating Robot Container (Grand Scale Presence) */}
      <div
        className="robot-hover-anim"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label="Open ExamOps Agent"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as any);
          }
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isHovered ? 'scale(1.08)' : 'scale(1)',
          position: 'relative',
        }}
      >
        {/* Soft Ambient Radial Aura Backdrop */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: conflictCount > 0
              ? 'radial-gradient(circle, rgba(244, 63, 94, 0.45) 0%, rgba(244, 63, 94, 0.08) 65%, transparent 75%)'
              : 'radial-gradient(circle, rgba(56, 189, 248, 0.45) 0%, rgba(56, 189, 248, 0.08) 65%, transparent 75%)',
            filter: 'blur(16px)',
            pointerEvents: 'none',
            zIndex: 0,
            transition: 'background 0.3s ease',
          }}
        />

        {/* Prominent Real-time Conflict Notification Badge */}
        {conflictCount > 0 && (
          <div
            style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            zIndex: 10,
            background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
            color: '#ffffff',
            padding: '0.32rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 20px rgba(244, 63, 94, 0.7), 0 0 0 2.5px var(--bg-primary)',
            animation: 'pulse-ring 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1)',
          }}
          title={`${conflictCount} unresolved examination conflicts detected`}
        >
          <AlertTriangle size={14} />
          <span>{conflictCount} issues</span>
        </div>
      )}

        {/* Polished Futuristic Robot SVG Visual (114x114 compact size) */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            filter: isHovered
              ? 'drop-shadow(0 14px 32px rgba(56, 189, 248, 0.65))'
              : 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.35))',
            transition: 'filter 0.3s ease',
          }}
        >
          <svg
            width="114"
            height="114"
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            <defs>
              {/* Metallic Head Body Gradient */}
              <linearGradient id="robotBodyGradLg" x1="16" y1="14" x2="56" y2="58" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="45%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>

              {/* Dark Curved Visor Gradient */}
              <linearGradient id="robotVisorGradLg" x1="18" y1="24" x2="54" y2="42" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#080c14" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Cyber Cyan Glow Gradient */}
              <linearGradient id="robotEyeGradLg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              {/* Antenna Node Pulse Radial */}
              <radialGradient id="antennaNodeGlowLg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="60%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            {/* Antenna Stalk & Glowing Node */}
            <line x1="36" y1="14" x2="36" y2="6" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="36" cy="5" r="4.5" fill="url(#antennaNodeGlowLg)" />
            <circle cx="36" cy="5" r="2.8" fill="#38bdf8" className="robot-eye-anim" />

            {/* Ear Communicator / Sensors */}
            {/* Left Ear */}
            <rect x="7.5" y="27" width="5.5" height="14" rx="2.5" fill="#475569" />
            <circle cx="10" cy="34" r="1.8" fill="#38bdf8" />
            {/* Right Ear */}
            <rect x="59" y="27" width="5.5" height="14" rx="2.5" fill="#475569" />
            <circle cx="62" cy="34" r="1.8" fill="#38bdf8" />

            {/* Main Robot Head */}
            <rect
              x="12"
              y="14"
              width="48"
              height="40"
              rx="20"
              fill="url(#robotBodyGradLg)"
              stroke="#cbd5e1"
              strokeWidth="1.4"
            />

            {/* Top Gloss Arc Highlight */}
            <path
              d="M 22 17 Q 36 15 50 17"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* Deep Glass Visor Screen */}
            <rect
              x="17"
              y="22"
              width="38"
              height="23"
              rx="12"
              fill="url(#robotVisorGradLg)"
              stroke="#334155"
              strokeWidth="1.2"
            />

            {/* Glowing Cyber Eyes with Expressive Pupil Highlights */}
            {/* Left Eye */}
            <g className="robot-eye-anim">
              <ellipse cx="28" cy="33.5" rx="4.8" ry="5.2" fill="url(#robotEyeGradLg)" />
              <circle cx="29.5" cy="31.8" r="1.6" fill="#ffffff" />
            </g>

            {/* Right Eye */}
            <g className="robot-eye-anim">
              <ellipse cx="44" cy="33.5" rx="4.8" ry="5.2" fill="url(#robotEyeGradLg)" />
              <circle cx="45.5" cy="31.8" r="1.6" fill="#ffffff" />
            </g>

            {/* Digital Curved Smile Arc */}
            <path
              d="M 33 40.5 Q 36 42.5 39 40.5"
              stroke="#38bdf8"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.95"
            />

            {/* Floating Thruster Base Collar */}
            <path
              d="M 27 55 L 45 55 L 42 60 L 30 60 Z"
              fill="#475569"
            />
            {/* Energy Particle Glow below thruster */}
            <ellipse cx="36" cy="61.5" rx="7" ry="2.5" fill="#38bdf8" opacity="0.9" className="robot-eye-anim" />
          </svg>
        </div>

        {/* Ground Floating Shadow */}
        <div
          className="robot-shadow-anim"
          style={{
            width: '86px',
            height: '11px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.45)',
            marginTop: '6px',
            filter: 'blur(4px)',
          }}
        />

        {/* Avyra AI Status Badge Pill */}
        <div
          style={{
            marginTop: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.8rem',
            borderRadius: '9999px',
            background: isHovered
              ? 'rgba(56, 189, 248, 0.22)'
              : 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: isHovered
              ? '1px solid var(--accent-cyan)'
              : '1px solid var(--border-subtle)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px #10b981',
            }}
          />
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.03em',
              color: isHovered ? 'var(--accent-cyan)' : 'var(--text-primary)',
            }}
          >
            ExamOps Agent
          </span>
        </div>

        {/* Floating Tooltip on Hover */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              right: 'calc(100% + 14px)',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '0.55rem 0.95rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              backdropFilter: 'blur(14px)',
            }}
          >
            <Sparkles size={14} color="var(--accent-cyan)" />
            <span>{conflictCount > 0 ? `Ask ExamOps (${conflictCount} issues)` : 'Ask ExamOps Agent'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const KlyraRobotAssistant = AvyraRobotAssistant;
export default AvyraRobotAssistant;
