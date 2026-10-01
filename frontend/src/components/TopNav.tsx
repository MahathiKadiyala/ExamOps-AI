import React, { useState, useEffect, useRef } from 'react';
import {
  Moon,
  Sun,
  RefreshCw,
  AlertTriangle,
  Bot,
  Bell,
  X,
  Sparkles,
  Search,
} from 'lucide-react';
import type { UserRole } from '../types';
import { apiClient } from '../services/apiClient';

interface CurrentUser {
  email: string;
  full_name: string;
  role: UserRole;
  title?: string;
  department?: string;
}

interface TopNavProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  systemHealthy: boolean;
  latencyMs: number | null;
  conflictCount: number;
  onRefreshData: () => void;
  isRefreshing: boolean;
  onOpenLanding: () => void;
  onTriggerAgentQuery?: (query: string) => void;
  currentUser?: CurrentUser | null;
  onSignOut?: () => void;
}

interface SystemNotificationItem {
  id: string;
  title: string;
  message: string;
  severity: string;
  type?: string;
  timestamp: string;
  target_role?: string;
  is_read?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  theme,
  onToggleTheme,
  userRole,
  conflictCount,
  onRefreshData,
  isRefreshing,
  onOpenLanding,
  onTriggerAgentQuery,
}) => {
  const [notifications, setNotifications] = useState<SystemNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      if (userRole.toLowerCase().includes('stud')) {
        const sched = await apiClient.getStudentSchedule();
        if (sched && sched.notifications) {
          const formatted: SystemNotificationItem[] = sched.notifications.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            severity: n.severity || (n.badge === 'Important' ? 'high' : 'info'),
            type: n.type || 'announcement',
            timestamp: n.timestamp,
            target_role: 'STUDENT',
            is_read: n.is_read || false,
          }));
          setNotifications(formatted);
          setUnreadCount(typeof sched.unread_count === 'number' ? sched.unread_count : formatted.filter((x) => !x.is_read).length);
          return;
        }
      }
      const items = await apiClient.getNotifications(userRole, 20);
      if (Array.isArray(items)) {
        setNotifications(items as SystemNotificationItem[]);
        const unread = items.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread > 0 ? unread : items.length > 0 ? Math.min(items.length, 3) : 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen to live SSE event bus for notifications across roles
    let es: EventSource | null = null;
    try {
      const url = `${apiClient.getBaseUrl()}/agent/events/stream`;
      es = new EventSource(url);

      const handleIncoming = (eventData: any) => {
        const item: SystemNotificationItem = {
          id: eventData.id || `notif-${Date.now()}`,
          title: eventData.title || `Update: ${eventData.exam_code || 'Examination Scheduled'}`,
          message: eventData.message || (eventData.room ? `Exam scheduled in ${eventData.room}. Proctor: ${eventData.invigilator || 'Assigned'}.` : 'Schedule updated.'),
          severity: eventData.severity || 'info',
          type: 'schedule_update',
          timestamp: eventData.timestamp || new Date().toISOString(),
          target_role: eventData.target_role || 'ALL',
          is_read: false,
        };
        setNotifications((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
        setUnreadCount((prev) => prev + 1);
      };

      es.addEventListener('student_notification', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const item: SystemNotificationItem = {
            id: data.id || `notif-${Date.now()}`,
            title: data.title || 'Room Changed',
            message: data.message || 'Your examination room or schedule details have been updated.',
            severity: data.severity || 'high',
            type: data.type || 'room_changed',
            timestamp: data.timestamp || new Date().toISOString(),
            target_role: 'STUDENT',
            is_read: false,
          };
          setNotifications((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
          setUnreadCount((prev) => prev + 1);
        } catch {
          // ignore
        }
      });

      es.addEventListener('system_notification', (e: MessageEvent) => {
        try {
          handleIncoming(JSON.parse(e.data));
        } catch {
          // ignore
        }
      });

      es.addEventListener('exam_scheduled', (e: MessageEvent) => {
        try {
          handleIncoming(JSON.parse(e.data));
        } catch {
          // ignore
        }
      });
    } catch {
      // fallback
    }

    return () => {
      if (es) es.close();
    };
  }, [userRole]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleNotifications = () => {
    setShowDropdown((prev) => !prev);
    if (!showDropdown) {
      // Mark as viewed
      setUnreadCount(0);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <header
      style={{
        height: '60px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left side: Clean Portal Title & Breadcrumbs (Directly Inspired by Reference Image 2) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          onClick={onOpenLanding}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          title="Return to Home"
        >
          <span style={{ fontWeight: 800, fontSize: '1.08rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            ExamOps
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
            {userRole.toLowerCase().includes('stud') ? 'Student Portal' : 'Admin Operations'}
          </span>
        </div>

        {conflictCount > 0 && !userRole.toLowerCase().includes('stud') && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              fontSize: '0.74rem',
              fontWeight: 700,
            }}
          >
            <AlertTriangle size={12} />
            <span>{conflictCount} active conflicts</span>
          </div>
        )}
      </div>

      {/* Center Search Capsule (Reference Image 2 Inspired) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          background: 'var(--bg-tertiary)',
          borderRadius: '9999px',
          padding: '0.4rem 0.85rem 0.4rem 1.1rem',
          border: '1px solid var(--border-subtle)',
          width: '340px',
          maxWidth: '380px',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Search size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search anything — exams, rooms, faculty..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '0.8rem',
            color: 'var(--text-primary)',
            width: '100%',
            fontFamily: 'inherit',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              onTriggerAgentQuery?.(e.currentTarget.value.trim());
              e.currentTarget.value = '';
            }
          }}
        />
        <span
          style={{
            fontSize: '0.66rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            background: 'var(--bg-card)',
            padding: '2px 7px',
            borderRadius: '9999px',
            border: '1px solid var(--border-subtle)',
            whiteSpace: 'nowrap',
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right side controls (Reference Image 2 Rounded Pills) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Refresh Data Button */}
        <button
          onClick={() => {
            onRefreshData();
            fetchNotifications();
          }}
          disabled={isRefreshing}
          className="btn btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
          }}
          title="Refresh live data"
        >
          <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />
          <span>Sync</span>
        </button>

        {/* Real-time Notifications Bell with Popover */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={handleToggleNotifications}
            className="btn btn-secondary"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              position: 'relative',
              cursor: 'pointer',
              border: showDropdown ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
            }}
            title="System & Role Notifications"
          >
            <Bell size={15} color={unreadCount > 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)'} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--accent-rose)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover Dropdown */}
          {showDropdown && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '360px',
                maxHeight: '420px',
                overflowY: 'auto',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                zIndex: 100,
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} color="var(--accent-cyan)" />
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {userRole.toLowerCase().includes('stud') ? 'Notifications & Updates' : 'Role & System Alerts'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowDropdown(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  No recent notifications.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                          {n.title}
                        </span>
                        <span
                          className={`badge ${
                            n.severity === 'critical'
                              ? 'badge-rose'
                              : n.severity === 'high'
                              ? 'badge-amber'
                              : 'badge-cyan'
                          }`}
                          style={{ fontSize: '0.6rem' }}
                        >
                          {n.target_role || 'ALL'}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                        {n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ask Agent Button */}
        <button
          onClick={() => onTriggerAgentQuery?.(userRole.toLowerCase().includes('stud') ? "When is my next exam?" : "What examination issues need attention now?")}
          className="btn btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.95rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
            border: '1.5px solid rgba(56, 189, 248, 0.4)',
            color: 'var(--accent-cyan)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(56, 189, 248, 0.15)',
          }}
          title="Ask ExamOps Agent"
        >
          <Bot size={15} />
          <span>Ask Agent</span>
        </button>

        {/* Theme Toggle Button (Circular) */}
        <button
          onClick={onToggleTheme}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun size={16} color="var(--accent-amber)" /> : <Moon size={16} color="var(--accent-cyan)" />}
        </button>
      </div>
    </header>
  );
};

export default TopNav;
