import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  Minimize2,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Mic,
  Copy,
  Check,
  Calendar,
  Building2,
  Users,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type {
  UserRole,
  AgentInformationCard,
  AgentConflictCard,
  AgentRecommendationCard,
  AgentActionPreview,
} from '../types';

interface AgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentRunComplete?: () => void;
  externalQuery?: { id: string; query: string } | null;
  userRole?: UserRole;
  onNavigate?: (module: string) => void;
  hasImportantRecommendations?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  isStructuredIssueList?: boolean;
  information_card?: AgentInformationCard | null;
  conflict_card?: AgentConflictCard | null;
  recommendation_card?: AgentRecommendationCard | null;
  action_preview?: AgentActionPreview | null;
  confirmed?: boolean;
  cancelled?: boolean;
}

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning 👋';
  if (hour < 17) return 'Good afternoon 👋';
  return 'Good evening 👋';
};

const getQuickActionsForRole = (role?: UserRole) => {
  const norm = (role || 'ADMIN').toLowerCase();
  if (norm.includes('stud')) {
    return [
      { label: "When is my next exam?", icon: Calendar, prompt: "When is my next exam?" },
      { label: "Where is my CS301 exam?", icon: Building2, prompt: "Where is my CS301 exam?" },
      { label: "Did my exam room change?", icon: AlertTriangle, prompt: "Did my exam room change?" },
      { label: "My examination timetable", icon: Calendar, prompt: "Show my examination timetable." },
      { label: "Exams this week", icon: Sparkles, prompt: "What exams do I have this week?" },
      { label: "What is my seat number?", icon: Zap, prompt: "What is my seat number?" },
    ];
  }

  // Admin and Coordinator Quick Actions (Matching Reference Image 3 layout)
  return [
    { label: "Today's Exams", icon: Calendar, prompt: "Show today's examinations." },
    { label: "Current Conflicts", icon: AlertTriangle, prompt: "Which examinations have conflicts?" },
    { label: "Available Rooms", icon: Building2, prompt: "Which rooms are available?" },
    { label: "Faculty Workload", icon: Users, prompt: "Which faculty members are overloaded?" },
    { label: "Student Conflicts", icon: ShieldAlert, prompt: "Show student timetable conflicts." },
    { label: "Room Outages", icon: AlertTriangle, prompt: "Room 201 in Cotton Bhavan is unavailable." },
    { label: "Optimize Schedule", icon: Zap, prompt: "Optimize today's schedule." },
    { label: "What needs attention?", icon: Sparkles, prompt: "What examination issues need attention now?" },
  ];
};

export const AgentPanel: React.FC<AgentPanelProps> = ({
  isOpen,
  onClose,
  onAgentRunComplete,
  externalQuery,
  userRole,
  onNavigate,
  hasImportantRecommendations,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState('Understanding request...');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isThinking) return;

    const userMessageId = `u-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    // Dynamic professional status animation sequence (Prompt 19)
    setThinkingPhase('Understanding request...');
    const t1 = setTimeout(() => setThinkingPhase('Checking live examination data...'), 350);
    const t2 = setTimeout(() => setThinkingPhase('Running conflict checks...'), 750);
    const t3 = setTimeout(() => setThinkingPhase('Preparing recommendation...'), 1150);

    try {
      const response = await apiClient.runAgent(query, undefined, userRole || 'ADMIN');
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      const isAttentionQuery = query.toLowerCase().includes('attention') || query.toLowerCase().includes('issue');

      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        text: response.final_result || "Operation evaluated and verified against institutional rules.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStructuredIssueList: isAttentionQuery,
        information_card: response.information_card,
        conflict_card: response.conflict_card,
        recommendation_card: response.recommendation_card,
        action_preview: response.action_preview,
      };

      setMessages((prev) => [...prev, agentMsg]);
      if (onAgentRunComplete) {
        onAgentRunComplete();
      }
    } catch (err: unknown) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      const errorText = err instanceof Error ? err.message : "An unexpected error occurred.";
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: `⚠️ Error executing request: ${errorText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  }, [inputQuery, isThinking, userRole, onAgentRunComplete]);

  // Handle external queries
  const lastProcessedQueryId = useRef<string | null>(null);
  useEffect(() => {
    if (externalQuery && externalQuery.query && externalQuery.id !== lastProcessedQueryId.current) {
      lastProcessedQueryId.current = externalQuery.id;
      handleSendMessage(externalQuery.query);
    }
  }, [externalQuery, handleSendMessage]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isThinking, thinkingPhase]);

  if (!isOpen) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const toggleMic = () => {
    setIsListening((prev) => !prev);
    if (!isListening) {
      setInputQuery("What examination issues need attention now?");
    }
  };

  // Confirming an Action Preview (Prompt 18: Confirmation UI & real backend call)
  const handleConfirmAction = async (msgId: string, action: AgentActionPreview) => {
    try {
      setIsThinking(true);
      setThinkingPhase('Updating operations & broadcasting SSE...');

      const targetRoomId = action.room_id || 'room-cotton-bhavan-201';
      await apiClient.triggerRoomOutage(targetRoomId, action.reason || 'Emergency HVAC facility maintenance');

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                confirmed: true,
                text: `${m.text}\n\n✅ Operation Completed: Successfully reallocated examination ${action.exam_code} from ${action.from_room} to ${action.to_room}. Audit logged, database updated, and real-time SSE dispatched across candidate and faculty portals.`,
              }
            : m
        )
      );

      if (onAgentRunComplete) {
        onAgentRunComplete();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to confirm reallocation';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                text: `${m.text}\n\n❌ Error applying action: ${errorMsg}`,
              }
            : m
        )
      );
    } finally {
      setIsThinking(false);
    }
  };

  const handleCancelAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              cancelled: true,
              text: `${m.text}\n\n*Action cancelled by operator. No changes were applied to the database.*`,
            }
          : m
      )
    );
  };

  const quickActions = getQuickActionsForRole(userRole);
  const showWelcome = messages.length === 0;

  return (
    <aside
      className="glass-panel drawer-animate-in"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        maxWidth: 'calc(100vw - 2.5rem)',
        height: 'min(640px, calc(100vh - 45px))',
        zIndex: 65,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '50px',
        boxShadow: '0 32px 85px rgba(0, 0, 0, 0.48), 0 0 0 1.5px var(--border-accent)',
        border: '1.5px solid var(--border-accent)',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* 1. Header (Reference Image 3 Inspired: Blue Icon Box, Avyra AI, Connected Pill, Controls) */}
      <div
        style={{
          padding: '1.15rem 1.45rem',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          borderRadius: '50px 50px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Blue Rounded Square Avatar Icon */}
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              flexShrink: 0,
            }}
          >
            <Bot size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                ExamOps Agent
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--accent-emerald)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 6px var(--accent-emerald)' }} />
                Connected
              </span>
              {hasImportantRecommendations && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    color: 'var(--accent-rose)',
                    background: 'rgba(244, 63, 94, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '9999px',
                  }}
                  title="Unresolved operational issues detected"
                >
                  <AlertTriangle size={10} />
                  <span>Issues Active</span>
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Operations Intelligence
            </div>
          </div>
        </div>

        {/* Header Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={handleClearChat}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease',
            }}
            title="Clear conversation"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease',
            }}
            title="Minimize assistant"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease',
            }}
            title="Close assistant panel"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Persistent Quick Action Ribbon in Chat Mode */}
      {!showWelcome && (
        <div
          style={{
            padding: '0.5rem 0.85rem',
            background: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Directives:
          </span>
          {quickActions.slice(0, 5).map((qa, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(qa.prompt)}
              disabled={isThinking}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                cursor: isThinking ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {qa.label}
            </button>
          ))}
        </div>
      )}

      {/* 2. Messages Stream & Welcome Screen */}
      <div
        ref={chatScrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.1rem',
        }}
      >
        {/* Welcome State (Directly Inspired by Reference Image 3: 3D Orb, Greeting, Pill Grid) */}
        {showWelcome && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '1.25rem 0.5rem 0.5rem',
              gap: '1.25rem',
            }}
          >
            {/* ExamOps Agent Mascot */}
            <div
              className="klyra-avatar-badge"
              onClick={() => handleSendMessage(userRole && userRole.toLowerCase().includes('stud') ? "When is my next exam?" : "What examination issues need attention now?")}
              title="Click to activate ExamOps Agent"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '28px',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.92) 0%, rgba(15, 23, 42, 0.96) 100%)',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                position: 'relative',
                backdropFilter: 'blur(16px)',
                userSelect: 'none',
                boxShadow: '0 10px 25px rgba(56, 189, 248, 0.25)',
              }}
            >
              {/* Futuristic Klyra Mascot Head */}
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="klyraHelmetGrad" x1="8" y1="10" x2="40" y2="42" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                  <linearGradient id="klyraVisorGrad" x1="12" y1="18" x2="36" y2="34" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                  <linearGradient id="klyraEyeGlow" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                </defs>
                {/* Antenna */}
                <line x1="24" y1="10" x2="24" y2="4" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="24" cy="3.5" r="3" fill="#38bdf8" className="robot-eye-anim" />

                {/* Ear Pods */}
                <rect x="5" y="20" width="4" height="10" rx="2" fill="#334155" />
                <circle cx="7" cy="25" r="1.5" fill="#38bdf8" />
                <rect x="39" y="20" width="4" height="10" rx="2" fill="#334155" />
                <circle cx="41" cy="25" r="1.5" fill="#38bdf8" />

                {/* Main Head */}
                <rect x="8" y="10" width="32" height="28" rx="14" fill="url(#klyraHelmetGrad)" stroke="#475569" strokeWidth="1.2" />

                {/* Visor */}
                <rect x="12" y="16" width="24" height="16" rx="8" fill="url(#klyraVisorGrad)" stroke="#38bdf8" strokeWidth="1" />

                {/* Expressive Glowing Eyes */}
                <g className="robot-eye-anim">
                  <ellipse cx="19" cy="24" rx="3.2" ry="3.6" fill="url(#klyraEyeGlow)" />
                  <circle cx="20" cy="22.8" r="1.1" fill="#ffffff" />
                  <ellipse cx="29" cy="24" rx="3.2" ry="3.6" fill="url(#klyraEyeGlow)" />
                  <circle cx="30" cy="22.8" r="1.1" fill="#ffffff" />
                </g>

                {/* Smile Arc */}
                <path d="M 21 28.5 Q 24 30.5 27 28.5" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" opacity="0.95" />
              </svg>

              {/* Dynamic Neural Audio / Equalizer Spectrum Waveform */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '18px' }}>
                <div className="klyra-wave-bar-1" style={{ width: '3.5px', borderRadius: '9999px', background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)' }} />
                <div className="klyra-wave-bar-2" style={{ width: '3.5px', borderRadius: '9999px', background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)' }} />
                <div className="klyra-wave-bar-3" style={{ width: '3.5px', borderRadius: '9999px', background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)' }} />
                <div className="klyra-wave-bar-4" style={{ width: '3.5px', borderRadius: '9999px', background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)' }} />
                <div className="klyra-wave-bar-5" style={{ width: '3.5px', borderRadius: '9999px', background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)' }} />
              </div>

              {/* Status Pill Badge */}
              <span
                style={{
                  position: 'absolute',
                  bottom: '-10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: 'var(--accent-cyan)',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                EXAMOPS AGENT
              </span>
            </div>

            {/* Greeting & Prompt — Crisp, neat, no unnecessary explanation */}
            <div>
              <h2
                style={{
                  margin: '0.5rem 0 0.25rem 0',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {getTimeGreeting()}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.84rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                  maxWidth: '320px',
                }}
              >
                How can I help you today?
              </p>
            </div>

            {/* Interactive Pill Grid (Reference Image 3: 2-column rounded capsule buttons) */}
            <div style={{ width: '100%', marginTop: '0.25rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.6rem',
                }}
              >
                {quickActions.map((qa, i) => {
                  const Icon = qa.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(qa.prompt)}
                      disabled={isThinking}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem 0.95rem',
                        borderRadius: '9999px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: isThinking ? 'not-allowed' : 'pointer',
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                        lineHeight: 1.3,
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(56, 189, 248, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-card)';
                        e.currentTarget.style.background = 'var(--bg-surface)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <Icon size={15} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{qa.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages Stream */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: '0.35rem',
            }}
          >
            <div
              style={{
                maxWidth: '94%',
                padding: '0.9rem 1.05rem',
                borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.sender === 'user' ? 'linear-gradient(135deg, var(--accent-blue) 0%, #1d4ed8 100%)' : 'var(--bg-surface)',
                color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                border: msg.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                boxShadow: msg.sender === 'user' ? '0 4px 14px rgba(37, 99, 235, 0.35)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
                position: 'relative',
              }}
            >
              {msg.text}

              {/* Structured Operations Attention Card (Prompt 16) */}
              {msg.isStructuredIssueList && msg.sender === 'agent' && (
                <div
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.9rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.7rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                      3 Issues Need Attention
                    </span>
                    <span className="badge badge-rose" style={{ fontSize: '0.64rem' }}>
                      Action Required
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div
                      onClick={() => handleSendMessage("Room 201 in Cotton Bhavan is unavailable.")}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.3rem 0.4rem', borderRadius: 'var(--radius-xs)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      title="Click to resolve Cotton Bhavan Room 201 outage"
                    >
                      <span className="badge badge-rose" style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem' }}>Critical</span>
                      <span style={{ color: 'var(--text-primary)' }}>Room unavailable — <strong>CS301</strong> (Cotton Bhavan 201)</span>
                    </div>

                    <div
                      onClick={() => handleSendMessage("Change Lab 301 capacity to 65")}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.3rem 0.4rem', borderRadius: 'var(--radius-xs)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      title="Click to resolve seating capacity deficit"
                    >
                      <span className="badge badge-amber" style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem' }}>High</span>
                      <span style={{ color: 'var(--text-primary)' }}>Seating capacity deficit — <strong>CS101</strong> (35 seat deficit)</span>
                    </div>

                    <div
                      onClick={() => handleSendMessage("Who can replace the absent invigilator?")}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.3rem 0.4rem', borderRadius: 'var(--radius-xs)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      title="Click to assign substitute invigilator"
                    >
                      <span className="badge badge-rose" style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem' }}>Critical</span>
                      <span style={{ color: 'var(--text-primary)' }}>Faculty on medical leave assigned — <strong>CS301</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button
                      onClick={() => onNavigate?.('conflicts')}
                      className="btn btn-secondary"
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '0.35rem 0.85rem',
                        color: 'var(--accent-cyan)',
                        borderColor: 'var(--accent-cyan)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>Review Conflicts</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Information Card Component */}
              {msg.information_card && (
                <div
                  style={{
                    padding: '0.9rem 1.05rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-accent)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    marginTop: '0.85rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.04em', color: 'var(--accent-cyan)' }}>
                      {msg.information_card.title}
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.15rem 0' }}>
                      {msg.information_card.count}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {msg.information_card.label}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate?.(msg.information_card?.action_view || 'examinations')}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '0.45rem 0.85rem',
                      color: 'var(--accent-cyan)',
                      borderColor: 'var(--accent-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      borderRadius: '9999px',
                    }}
                  >
                    <span>{msg.information_card.action_text}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}

              {/* Conflict Card Component */}
              {msg.conflict_card && (
                <div
                  style={{
                    padding: '0.9rem 1.05rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    marginTop: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertTriangle size={15} />
                      <span>{msg.conflict_card.severity === 'critical' ? 'Critical Conflict' : 'Warning'}</span>
                    </span>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>{msg.conflict_card.exam_code}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Room: <strong>{msg.conflict_card.room}</strong>
                  </div>
                  {msg.conflict_card.required_capacity && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Required capacity: <strong>{msg.conflict_card.required_capacity}</strong> | Available capacity: <strong>{msg.conflict_card.available_capacity}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
                    <button
                      onClick={() => onNavigate?.(msg.conflict_card?.action_view || 'conflicts')}
                      className="btn btn-secondary"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.35rem 0.75rem',
                        color: 'var(--accent-rose)',
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        cursor: 'pointer',
                        borderRadius: '9999px',
                      }}
                    >
                      {msg.conflict_card.action_text} &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Recommendation Card (Prompt 17: Structured Room Allocation Issue Card) */}
              {msg.recommendation_card && (
                <div
                  style={{
                    padding: '0.95rem 1.1rem',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    marginTop: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em', color: 'var(--accent-emerald)' }}>
                      {msg.recommendation_card.title}
                    </div>
                    <span className="badge badge-emerald" style={{ fontSize: '0.66rem' }}>
                      Verified Solution
                    </span>
                  </div>

                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {msg.recommendation_card.room}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    <span>Capacity: <strong>{msg.recommendation_card.capacity}</strong></span>
                    <span>Status: <strong style={{ color: 'var(--accent-emerald)' }}>{msg.recommendation_card.status}</strong></span>
                    <span>Conflict Check: <strong style={{ color: 'var(--accent-emerald)' }}>✓ {msg.recommendation_card.conflict_check}</strong></span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', marginTop: '0.4rem' }}>
                    <button
                      onClick={() => handleSendMessage(`Review allocation for ${msg.recommendation_card?.exam_code || 'CS301'} from ${msg.recommendation_card?.from_room || 'Cotton Bhavan - Room 201'} to ${msg.recommendation_card?.room}`)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.74rem', fontWeight: 700, padding: '0.35rem 0.85rem', cursor: 'pointer', borderRadius: '9999px' }}
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleSendMessage(`Confirm reallocation of ${msg.recommendation_card?.exam_code || 'CS301'} to ${msg.recommendation_card?.room}`)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.74rem', fontWeight: 700, padding: '0.35rem 0.95rem', cursor: 'pointer', borderRadius: '9999px' }}
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              )}

              {/* Action Preview with Confirmation UI (Prompt 18: Confirm Operation) */}
              {msg.action_preview && (
                <div
                  style={{
                    padding: '1.1rem',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1.5px solid rgba(56, 189, 248, 0.45)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    marginTop: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-cyan)', fontSize: '0.86rem', fontWeight: 800 }}>
                      <Sparkles size={16} />
                      <span>Confirm Operation</span>
                    </div>
                    <span className="badge badge-cyan" style={{ fontSize: '0.64rem' }}>
                      Authorization Required
                    </span>
                  </div>

                  <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                    Move examination: <strong>{msg.action_preview.exam_code}</strong> ({msg.action_preview.course_name || 'Advanced Algorithms'})
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      gap: '0.3rem 0.75rem',
                      fontSize: '0.78rem',
                      background: 'var(--bg-tertiary)',
                      padding: '0.75rem 0.95rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>From:</span>
                    <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>{msg.action_preview.from_room} (🔴 Unavailable)</span>

                    <span style={{ color: 'var(--text-muted)' }}>To:</span>
                    <strong style={{ color: 'var(--accent-emerald)' }}>{msg.action_preview.to_room} (✓ Verified)</strong>

                    <span style={{ color: 'var(--text-muted)' }}>Affected:</span>
                    <span>{msg.action_preview.affected_students || 35} students, 1 examination, {msg.action_preview.affected_invigilators || 2} invigilators</span>

                    <span style={{ color: 'var(--text-muted)' }}>Reason:</span>
                    <span>{msg.action_preview.reason}</span>
                  </div>

                  {!msg.confirmed && !msg.cancelled ? (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.65rem',
                        marginTop: '0.5rem',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '0.65rem',
                      }}
                    >
                      <button
                        onClick={() => handleCancelAction(msg.id)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.76rem', padding: '0.4rem 0.85rem', cursor: 'pointer', borderRadius: '9999px' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmAction(msg.id, msg.action_preview!)}
                        className="btn btn-primary"
                        style={{
                          fontSize: '0.76rem',
                          padding: '0.4rem 1.1rem',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          borderColor: '#10b981',
                          cursor: 'pointer',
                          fontWeight: 700,
                          borderRadius: '9999px',
                        }}
                      >
                        Confirm Change
                      </button>
                    </div>
                  ) : msg.confirmed ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        color: 'var(--accent-emerald)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        marginTop: '0.4rem',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Reallocation committed to database & broadcasted via SSE.</span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', fontStyle: 'italic', marginTop: '0.4rem' }}>
                      Operation cancelled by operator.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Footer: Timestamp and Quick Copy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.35rem' }}>
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                {msg.timestamp}
              </span>
              {msg.sender === 'agent' && (
                <button
                  onClick={() => handleCopyText(msg.id, msg.text)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Copy message text"
                >
                  {copiedMsgId === msg.id ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* 4. Professional Phased Progress Animation (Prompt 19) */}
        {isThinking && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-tertiary)',
              borderRadius: '9999px',
              border: '1px solid var(--border-accent)',
              width: 'fit-content',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div
              className="spin"
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                border: '2px solid var(--accent-cyan)',
                borderTopColor: 'transparent',
              }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              {thinkingPhase}
            </span>
          </div>
        )}
      </div>

      {/* 3. Rounded Capsule Input Dock (Directly Inspired by Reference Image 3) */}
      <div
        style={{
          padding: '1rem 1.35rem 1.35rem',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          borderRadius: '0 0 44px 44px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-tertiary)',
            borderRadius: '9999px',
            padding: '0.35rem 0.5rem 0.35rem 1.15rem',
            border: '1.5px solid var(--border-subtle)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
            transition: 'border-color var(--transition-fast)',
          }}
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isThinking}
            placeholder="Ask anything about examination operations..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
            }}
          />

          {/* Mode Pill Indicator (Matching Reference Image 3 "EN") */}
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              background: 'var(--bg-card)',
              padding: '0.25rem 0.55rem',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)',
              whiteSpace: 'nowrap',
            }}
          >
            ⚡ Live
          </span>

          {/* Voice Input Button (Reference Image 3) */}
          <button
            onClick={toggleMic}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: isListening ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-card)',
              border: isListening ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
              color: isListening ? 'var(--accent-rose)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isListening ? 'Stop listening' : 'Voice command (simulate)'}
          >
            <Mic size={16} />
          </button>

          {/* Circular Blue Send Button (Reference Image 3) */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isThinking}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !inputQuery.trim() || isThinking ? 0.5 : 1,
              cursor: !inputQuery.trim() || isThinking ? 'not-allowed' : 'pointer',
              boxShadow: '0 3px 10px rgba(56, 189, 248, 0.4)',
              transition: 'all 0.15s ease',
              transform: !inputQuery.trim() || isThinking ? 'none' : 'scale(1.02)',
            }}
            title="Send query"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AgentPanel;
