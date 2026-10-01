import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  AlertTriangle,
  ShieldAlert,
  Bot,
  Shield,
  GraduationCap,
  Sparkles,
  LogOut,
  Bell,
} from 'lucide-react';
import type { UserRole, ActiveModule } from '../types';

interface SidebarProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  userRole: UserRole;
  conflictCount: number;
  incidentCount: number;
  onOpenLanding: () => void;
  onSignOut?: () => void;
  onOpenAgent?: () => void;
}

interface NavItem {
  id: ActiveModule;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
  badge?: string | number;
  badgeColor?: string;
  allowedRoles: string[];
  section?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  userRole,
  conflictCount,
  incidentCount,
  onOpenLanding,
  onSignOut,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'student_portal',
      label: 'My Examination Schedule',
      icon: GraduationCap,
      allowedRoles: ['student', 'STUDENT'],
      section: 'CANDIDATE PORTAL',
    },
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'ADMIN', 'coordinator', 'EXAM_COORDINATOR', 'faculty'],
      section: 'OPERATIONS',
    },
    {
      id: 'examinations',
      label: 'Examinations',
      icon: CalendarDays,
      allowedRoles: ['admin', 'ADMIN', 'coordinator', 'EXAM_COORDINATOR', 'faculty'],
      section: 'OPERATIONS',
    },
    {
      id: 'rooms',
      label: 'Rooms & Venues',
      icon: Building2,
      allowedRoles: ['admin', 'ADMIN', 'coordinator', 'EXAM_COORDINATOR'],
      section: 'OPERATIONS',
    },
    {
      id: 'faculty',
      label: 'Faculty & Workload',
      icon: Users,
      allowedRoles: ['admin', 'ADMIN', 'coordinator', 'EXAM_COORDINATOR', 'faculty'],
      section: 'OPERATIONS',
    },
    {
      id: 'conflicts',
      label: 'Conflicts',
      icon: AlertTriangle,
      badge: conflictCount > 0 ? conflictCount : undefined,
      badgeColor: 'badge-rose',
      allowedRoles: ['admin', 'ADMIN', 'coordinator', 'EXAM_COORDINATOR'],
      section: 'GOVERNANCE & AUDIT',
    },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: ShieldAlert,
      badge: incidentCount > 0 ? incidentCount : undefined,
      badgeColor: 'badge-amber',
      allowedRoles: ['admin', 'ADMIN', 'coordinator', 'EXAM_COORDINATOR', 'faculty'],
      section: 'GOVERNANCE & AUDIT',
    },
    {
      id: 'agent',
      label: 'ExamOps Agent',
      icon: Bot,
      badge: 'AI',
      badgeColor: 'badge-cyan',
      allowedRoles: ['admin', 'ADMIN', 'coordinator', 'EXAM_COORDINATOR'],
      section: 'CAMPUS INTELLIGENCE',
    },
  ];

  const roleLabelMap: Record<string, { title: string; color: string; icon: React.ComponentType<{ size?: number }> }> = {
    admin: { title: 'Admin', color: 'var(--accent-purple)', icon: Shield },
    ADMIN: { title: 'Admin', color: 'var(--accent-purple)', icon: Shield },
    coordinator: { title: 'Exam Coordinator', color: 'var(--accent-cyan)', icon: Sparkles },
    EXAM_COORDINATOR: { title: 'Exam Coordinator', color: 'var(--accent-cyan)', icon: Sparkles },
    student: { title: 'Student', color: 'var(--accent-emerald)', icon: GraduationCap },
    STUDENT: { title: 'Student', color: 'var(--accent-emerald)', icon: GraduationCap },
    faculty: { title: 'Faculty Operations', color: 'var(--accent-amber)', icon: Users },
  };

  const roleConfig = roleLabelMap[userRole] || roleLabelMap['ADMIN'];
  const CurrentRoleIcon = roleConfig.icon;

  const normRole = (userRole || 'admin').toLowerCase();
  const visibleItems = navItems.filter((item) =>
    item.allowedRoles.some(
      (r) =>
        r.toLowerCase() === normRole ||
        (normRole.includes('coord') && r.toLowerCase().includes('coord'))
    )
  );

  // Group items by section (Reference Image 2 style)
  let lastSection = '';

  const isStudent = normRole.includes('stud');
  const [activeStudentTab, setActiveStudentTab] = React.useState<'dashboard' | 'examinations' | 'notifications' | 'agent'>('dashboard');

  return (
    <aside
      style={{
        width: '272px',
        minWidth: '272px',
        maxWidth: '280px',
        margin: '14px 0 14px 14px',
        height: 'calc(100vh - 28px)',
        borderRadius: '26px',
        background: 'var(--sidebar-bg, var(--bg-card))',
        border: '1px solid var(--border-card)',
        boxShadow: '0 4px 24px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'sticky',
        top: '14px',
        zIndex: 40,
        userSelect: 'none',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Top Header & Nav Section */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Brand Header */}
        <div
          onClick={onOpenLanding}
          style={{
            padding: '1.35rem 1.35rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            transition: 'opacity var(--transition-fast)',
          }}
          title="Return to ExamOps Landing Page"
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--glow-cyan)',
              flexShrink: 0,
            }}
          >
            <Bot size={22} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: '1.28rem',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                display: 'block',
              }}
            >
              ExamOps
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.01em',
                display: 'block',
              }}
            >
              AI-Powered Examination Operations
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div
          className="sidebar-nav-scroll"
          style={{
            padding: '1rem 0.85rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            scrollbarWidth: 'thin',
            scrollbarColor: '#1e40af transparent',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {isStudent ? (
              <>
                <div
                  style={{
                    padding: '0.85rem 0.75rem 0.35rem',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  STUDENT PORTAL
                </div>

                {/* 1. Dashboard */}
                <button
                  onClick={() => {
                    setActiveStudentTab('dashboard');
                    onSelectModule('student_portal');
                    document.getElementById('portal-main-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '48px',
                    padding: '0.7rem 1rem',
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: activeStudentTab === 'dashboard' ? 'var(--border-accent)' : 'transparent',
                    background: activeStudentTab === 'dashboard' ? 'var(--bg-card-hover)' : 'transparent',
                    color: activeStudentTab === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: activeStudentTab === 'dashboard' ? 700 : 500,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left',
                    boxShadow: activeStudentTab === 'dashboard' ? '0 3px 10px rgba(0, 0, 0, 0.08)' : 'none',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <LayoutDashboard size={18} color={activeStudentTab === 'dashboard' ? 'var(--accent-cyan)' : 'currentColor'} />
                    <span>Dashboard</span>
                  </div>
                  {activeStudentTab === 'dashboard' && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '4px',
                        height: '24px',
                        borderRadius: '9999px',
                        background: 'linear-gradient(180deg, var(--accent-cyan) 0%, #2563eb 100%)',
                        boxShadow: '0 0 8px rgba(56, 189, 248, 0.6)',
                      }}
                    />
                  )}
                </button>

                {/* 2. My Examinations */}
                <button
                  onClick={() => {
                    setActiveStudentTab('examinations');
                    onSelectModule('student_portal');
                    setTimeout(() => {
                      document.getElementById('upcoming-examinations')?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '48px',
                    padding: '0.7rem 1rem',
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: activeStudentTab === 'examinations' ? 'var(--border-accent)' : 'transparent',
                    background: activeStudentTab === 'examinations' ? 'var(--bg-card-hover)' : 'transparent',
                    color: activeStudentTab === 'examinations' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: activeStudentTab === 'examinations' ? 700 : 500,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left',
                    boxShadow: activeStudentTab === 'examinations' ? '0 3px 10px rgba(0, 0, 0, 0.08)' : 'none',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CalendarDays size={18} color={activeStudentTab === 'examinations' ? 'var(--accent-cyan)' : 'currentColor'} />
                    <span>My Examinations</span>
                  </div>
                  {activeStudentTab === 'examinations' && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '4px',
                        height: '24px',
                        borderRadius: '9999px',
                        background: 'linear-gradient(180deg, var(--accent-cyan) 0%, #2563eb 100%)',
                        boxShadow: '0 0 8px rgba(56, 189, 248, 0.6)',
                      }}
                    />
                  )}
                </button>

                {/* 3. Notifications */}
                <button
                  onClick={() => {
                    setActiveStudentTab('notifications');
                    onSelectModule('student_portal');
                    setTimeout(() => {
                      document.getElementById('student-notifications')?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '48px',
                    padding: '0.7rem 1rem',
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: activeStudentTab === 'notifications' ? 'var(--border-accent)' : 'transparent',
                    background: activeStudentTab === 'notifications' ? 'var(--bg-card-hover)' : 'transparent',
                    color: activeStudentTab === 'notifications' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: activeStudentTab === 'notifications' ? 700 : 500,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left',
                    boxShadow: activeStudentTab === 'notifications' ? '0 3px 10px rgba(0, 0, 0, 0.08)' : 'none',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bell size={18} color={activeStudentTab === 'notifications' ? 'var(--accent-cyan)' : 'currentColor'} />
                    <span>Notifications</span>
                  </div>
                  {activeStudentTab === 'notifications' && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '4px',
                        height: '24px',
                        borderRadius: '9999px',
                        background: 'linear-gradient(180deg, var(--accent-cyan) 0%, #2563eb 100%)',
                        boxShadow: '0 0 8px rgba(56, 189, 248, 0.6)',
                      }}
                    />
                  )}
                </button>

                {/* 4. Help / ExamOps Agent */}
                <button
                  onClick={() => {
                    setActiveStudentTab('agent');
                    if (onOpenAgent) {
                      onOpenAgent();
                    } else {
                      onSelectModule('agent');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '48px',
                    padding: '0.7rem 1rem',
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: activeStudentTab === 'agent' ? 'var(--border-accent)' : 'transparent',
                    background: activeStudentTab === 'agent' ? 'var(--bg-card-hover)' : 'transparent',
                    color: activeStudentTab === 'agent' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: activeStudentTab === 'agent' ? 700 : 500,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left',
                    boxShadow: activeStudentTab === 'agent' ? '0 3px 10px rgba(0, 0, 0, 0.08)' : 'none',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bot size={18} color={activeStudentTab === 'agent' ? 'var(--accent-cyan)' : 'currentColor'} />
                    <span>Help / ExamOps Agent</span>
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>AI</span>
                </button>
              </>
            ) : (
              visibleItems.map((item) => {
                const isActive = activeModule === item.id;
              const Icon = item.icon;
              const showSectionHeader = item.section && item.section !== lastSection;
              if (item.section) lastSection = item.section;

              return (
                <React.Fragment key={item.id}>
                  {showSectionHeader && (
                    <div
                      style={{
                        padding: '0.85rem 0.75rem 0.35rem',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.section}
                    </div>
                  )}

                  <button
                    onClick={() => onSelectModule(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minHeight: '48px',
                      padding: '0.7rem 1rem',
                      borderRadius: '14px',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--border-accent)' : 'transparent',
                      background: isActive ? 'var(--bg-card-hover)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      textAlign: 'left',
                      boxShadow: isActive ? '0 3px 10px rgba(0, 0, 0, 0.08)' : 'none',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    {isActive && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '4px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '4px',
                          height: '24px',
                          borderRadius: '9999px',
                          background: 'linear-gradient(180deg, #1e3a8a 0%, #1d4ed8 100%)',
                          boxShadow: '0 0 8px rgba(30, 64, 175, 0.6)',
                        }}
                      />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <Icon
                        size={20}
                        color={isActive ? 'var(--accent-cyan)' : 'currentColor'}
                        style={{ flexShrink: 0 }}
                      />
                      <span style={{ lineHeight: 1.3 }}>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`badge ${item.badgeColor}`}
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.15rem 0.5rem',
                          fontWeight: 700,
                          borderRadius: '9999px',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            }))}
          </nav>
        </div>
      </div>

      {/* Role Profile Card & Logout (Directly Inspired by Reference Image 2) */}
      <div
        style={{
          padding: '1rem 0.95rem 1.15rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.02)',
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.8rem 0.9rem',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: roleConfig.color,
              flexShrink: 0,
            }}
          >
            <CurrentRoleIcon size={18} />
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                lineHeight: 1.3,
              }}
            >
              {roleConfig.title}
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 600,
                marginTop: '2px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--accent-emerald)',
                  boxShadow: '0 0 6px var(--accent-emerald)',
                }}
              />
              <span>RBAC: Active</span>
            </div>
          </div>
        </div>

        <button
          onClick={onSignOut || onOpenLanding}
          style={{
            width: '100%',
            marginTop: '0.75rem',
            minHeight: '38px',
            padding: '0.6rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.28)',
            color: 'var(--accent-rose)',
            fontWeight: 700,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.28)';
          }}
          title={`Sign out of ${roleConfig.title}`}
        >
          <LogOut size={15} />
          <span>Logout ({roleConfig.title})</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
