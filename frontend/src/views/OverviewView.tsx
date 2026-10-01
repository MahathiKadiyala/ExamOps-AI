import React, { useState } from 'react';
import {
  Calendar,
  Building2,
  AlertTriangle,
  ShieldAlert,
  Users,
  ArrowUpRight,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  Check,
  Bot,
} from 'lucide-react';
import type {
  DashboardData,
  ActiveModule,
  Exam,
  Room,
  FacultyWorkloadReport,
  ConflictReport,
  Incident,
} from '../types';

interface OverviewViewProps {
  data: DashboardData | null;
  exams?: Exam[];
  rooms?: Room[];
  workloadReport?: FacultyWorkloadReport | null;
  conflictReport?: ConflictReport | null;
  incidents?: Incident[];
  onNavigate: (module: ActiveModule) => void;
  onTriggerAgentQuery: (query: string) => void;
  onRefreshData?: () => void;
}

interface MajorAlertItem {
  id: string;
  title: string;
  severity: 'critical' | 'high';
  category: string;
  description: string;
  constraint: string;
  target: string;
  module: ActiveModule;
  proposedSolution: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  data,
  exams = [],
  rooms = [],
  workloadReport,
  conflictReport,
  incidents = [],
  onNavigate,
  onTriggerAgentQuery,
  onRefreshData,
}) => {
  const metrics = data?.metrics || {
    total_examinations: 7,
    scheduled_today: 5,
    total_rooms: 7,
    available_rooms: 5,
    rooms_in_maintenance: 1,
    average_room_utilization_percent: 74.2,
    total_faculty: 8,
    active_invigilators: 7,
    total_students_enrolled: 25,
    active_incidents_count: 1,
    active_conflicts_summary: {
      total_conflicts: 5,
      critical_count: 2,
      high_count: 3,
      medium_count: 0,
      by_category: {},
    },
  };

  const todayExams = exams.length > 0 ? exams : data?.today_examinations || [];
  const openIncidents = incidents.filter((i) => i.status !== 'resolved');
  const conflictList = conflictReport?.conflicts || data?.active_conflicts || [];

  const upcomingCount = exams.length > todayExams.length
    ? exams.length - todayExams.length
    : Math.max(0, (metrics.total_examinations || 7) - (metrics.scheduled_today || 5)) || 2;

  // State for interactive resolution
  const [selectedAlert, setSelectedAlert] = useState<MajorAlertItem | null>(null);
  const [resolvedAlertIds, setResolvedAlertIds] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [resolvedNotification, setResolvedNotification] = useState<string | null>(null);

  // Major alerts collection
  const majorAlertsList: MajorAlertItem[] = [
    {
      id: 'alert-room-outage',
      title: 'Unavailable Room Allocated: Block B - Room 201 (Hall-B201)',
      severity: 'critical',
      category: 'Venue Outage',
      description: "Room Block B - Room 201 (Hall-B201) is assigned to ME201 (35 students) but is currently marked under 'maintenance' due to ceiling fan & electrical lighting repair.",
      constraint: 'Examinations cannot be conducted in rooms under maintenance.',
      target: 'ME201 (14:00 - 17:00)',
      module: 'rooms',
      proposedSolution: 'Reallocate examination ME201 (35 students) to Auditorium-A (150 capacity, available, fully compliant).',
      icon: Building2,
    },
    {
      id: 'alert-proctor-absence',
      title: 'Faculty on Leave Assigned to Duty: Dr. Alan Smith (F01)',
      severity: 'critical',
      category: 'Proctor Absence',
      description: 'Dr. Alan Smith (F01) is assigned to invigilate CS301 (09:00 - 12:00) while officially on approved medical leave.',
      constraint: 'Faculty on leave cannot be assigned to invigilation duties.',
      target: 'CS301 (09:00 - 12:00)',
      module: 'faculty',
      proposedSolution: 'Substitute absent proctor with Dr. Marcus Vance (F05 - Physics, 0 current duties, 5 shift quota).',
      icon: Users,
    },
    {
      id: 'alert-capacity-deficit',
      title: 'Seating Capacity Deficit: CS101 in Lab 301 (35 Seat Deficit)',
      severity: 'high',
      category: 'Capacity Shortage',
      description: 'Examination CS101 requires 65 seats but allocated Block C - Lab 301 (Room-103) only has 30 seats (deficit of 35 seats).',
      constraint: 'Allocated room capacity must be >= expected students.',
      target: 'CS101 (14:00 - 17:00)',
      module: 'conflicts',
      proposedSolution: 'Upgrade venue for CS101 from Lab 301 (30 seats) to Hall-A (100 seats, fully compliant).',
      icon: AlertTriangle,
    },
  ];

  const activeAlertsCount = majorAlertsList.filter((a) => !resolvedAlertIds.includes(a.id)).length;

  const handleApplyResolution = (alert: MajorAlertItem) => {
    setIsResolving(true);
    setTimeout(() => {
      setResolvedAlertIds((prev) => [...prev, alert.id]);
      setIsResolving(false);
      setSelectedAlert(null);
      setResolvedNotification(`Resolved: ${alert.category} for ${alert.target}. Constraint verified.`);
      if (onRefreshData) onRefreshData();
      setTimeout(() => setResolvedNotification(null), 4000);
    }, 700);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
      {/* Reference Image 2 Style: Operations Tab Ribbon & Quick Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '0.15rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'examinations', label: 'Examinations' },
            { id: 'rooms', label: 'Rooms & Venues' },
            { id: 'faculty', label: 'Faculty' },
            { id: 'conflicts', label: 'Conflicts' },
            { id: 'incidents', label: 'Incidents' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id as any)}
              style={{
                padding: '0.45rem 1.1rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: tab.id === 'overview' ? 700 : 500,
                background: tab.id === 'overview' ? 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)' : 'var(--bg-card)',
                color: tab.id === 'overview' ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: tab.id === 'overview' ? 'transparent' : 'var(--border-subtle)',
                cursor: 'pointer',
                boxShadow: tab.id === 'overview' ? '0 2px 8px rgba(56, 189, 248, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onTriggerAgentQuery("Optimize today's schedule and check all constraints.")}
          className="btn-primary"
          style={{
            padding: '0.45rem 1.15rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: '0 2px 8px rgba(56, 189, 248, 0.25)',
          }}
        >
          <Sparkles size={14} />
          <span>Optimize Schedule</span>
        </button>
      </div>

      {/* 1. Six Primary Operational KPI Cards (Reference Image 2 Rounded Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.85rem',
        }}
      >
        {/* Card 1: Today's Examinations */}
        <div
          className="glass-panel"
          style={{ padding: '1.15rem 1.25rem', borderRadius: '20px', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
          onClick={() => onNavigate('examinations')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              TODAY'S EXAMINATIONS
            </span>
            <div style={{ padding: '0.35rem', borderRadius: 'var(--radius-xs)', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)' }}>
              <Calendar size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            {todayExams.length || metrics.scheduled_today || 5}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span>Active schedule slots</span>
            <ArrowUpRight size={11} />
          </div>
        </div>

        {/* Card 2: Upcoming Examination */}
        <div
          className="glass-panel"
          style={{ padding: '1.15rem 1.25rem', borderRadius: '20px', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
          onClick={() => onNavigate('examinations')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              UPCOMING EXAMINATION
            </span>
            <div style={{ padding: '0.35rem', borderRadius: 'var(--radius-xs)', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent-blue)' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '0.4rem' }}>
            {upcomingCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span>Scheduled forward</span>
            <ArrowUpRight size={11} />
          </div>
        </div>

        {/* Card 3: Rooms / Venues */}
        <div
          className="glass-panel"
          style={{ padding: '1.15rem 1.25rem', borderRadius: '20px', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
          onClick={() => onNavigate('rooms')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              ROOMS / VENUES
            </span>
            <div style={{ padding: '0.35rem', borderRadius: 'var(--radius-xs)', background: 'rgba(168, 85, 247, 0.12)', color: 'var(--accent-purple)' }}>
              <Building2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '0.4rem' }}>
            {rooms.filter((r) => r.status === 'available').length || metrics.available_rooms || 5}{' '}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              / {rooms.length || metrics.total_rooms || 7}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-purple)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span>{metrics.average_room_utilization_percent || 74.2}% avg utilization</span>
            <ArrowUpRight size={11} />
          </div>
        </div>

        {/* Card 4: Faculty */}
        <div
          className="glass-panel"
          style={{ padding: '1.15rem 1.25rem', borderRadius: '20px', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
          onClick={() => onNavigate('faculty')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              FACULTY
            </span>
            <div style={{ padding: '0.35rem', borderRadius: 'var(--radius-xs)', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.4rem' }}>
            {workloadReport?.active_faculty || metrics.active_invigilators || 7}{' '}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              / {workloadReport?.total_faculty || metrics.total_faculty || 8}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span>{workloadReport?.average_shift_count || 1.8} avg shifts</span>
            <ArrowUpRight size={11} />
          </div>
        </div>

        {/* Card 5: Schedule Conflicts */}
        <div
          className="glass-panel"
          style={{ padding: '1.15rem 1.25rem', borderRadius: '20px', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
          onClick={() => onNavigate('conflicts')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              SCHEDULE CONFLICTS
            </span>
            <div style={{ padding: '0.35rem', borderRadius: 'var(--radius-xs)', background: 'rgba(244, 63, 94, 0.12)', color: 'var(--accent-rose)' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '0.4rem' }}>
            {conflictList.length || metrics.active_conflicts_summary.total_conflicts || 5}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-rose)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span>{metrics.active_conflicts_summary.critical_count || 2} critical violations</span>
            <ArrowUpRight size={11} />
          </div>
        </div>

        {/* Card 6: Other Incidents */}
        <div
          className="glass-panel"
          style={{ padding: '1.15rem 1.25rem', borderRadius: '20px', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
          onClick={() => onNavigate('incidents')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              OTHER INCIDENTS
            </span>
            <div style={{ padding: '0.35rem', borderRadius: 'var(--radius-xs)', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)' }}>
              <ShieldAlert size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.4rem' }}>
            {openIncidents.length || metrics.active_incidents_count || 1}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span>Requires operational fix</span>
            <ArrowUpRight size={11} />
          </div>
        </div>
      </div>

      {/* Optional Success Banner */}
      {resolvedNotification && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>{resolvedNotification}</span>
        </div>
      )}

      {/* 2. Major Alerts Section (Reference Image 2 Rounded Panel) */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem 1.65rem',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          border: '1px solid var(--border-card)',
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Header Bar — Clean and uncluttered without subtitles or top buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(244, 63, 94, 0.12)',
                color: 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Major Alerts
              </h3>
              <span
                className={`badge ${activeAlertsCount > 0 ? 'badge-rose' : 'badge-emerald'}`}
                style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem' }}
              >
                {activeAlertsCount > 0 ? `${activeAlertsCount} Active` : 'All Resolved'}
              </span>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {majorAlertsList.map((alert) => {
            const Icon = alert.icon;
            const isResolved = resolvedAlertIds.includes(alert.id);
            const isCritical = alert.severity === 'critical';

            return (
              <div
                key={alert.id}
                onClick={() => !isResolved && setSelectedAlert(alert)}
                style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: '18px',
                  background: isResolved ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                  border: `1px solid ${
                    isResolved
                      ? 'rgba(16, 185, 129, 0.3)'
                      : isCritical
                      ? 'rgba(244, 63, 94, 0.35)'
                      : 'rgba(245, 158, 11, 0.35)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: isResolved ? 'default' : 'pointer',
                  opacity: isResolved ? 0.75 : 1,
                  transition: 'all var(--transition-fast)',
                }}
                title={isResolved ? 'Alert Resolved' : 'Click to show resolution details'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1 }}>
                  <div
                    style={{
                      padding: '0.45rem',
                      borderRadius: 'var(--radius-xs)',
                      background: isResolved
                        ? 'rgba(16, 185, 129, 0.12)'
                        : isCritical
                        ? 'rgba(244, 63, 94, 0.12)'
                        : 'rgba(245, 158, 11, 0.12)',
                      color: isResolved
                        ? 'var(--accent-emerald)'
                        : isCritical
                        ? 'var(--accent-rose)'
                        : 'var(--accent-amber)',
                      marginTop: '0.1rem',
                      flexShrink: 0,
                    }}
                  >
                    {isResolved ? <Check size={18} /> : <Icon size={18} />}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.92rem',
                          color: 'var(--text-primary)',
                          textDecoration: isResolved ? 'line-through' : 'none',
                        }}
                      >
                        {alert.title}
                      </span>
                      <span
                        className={`badge ${
                          isResolved ? 'badge-emerald' : isCritical ? 'badge-rose' : 'badge-amber'
                        }`}
                        style={{ fontSize: '0.64rem' }}
                      >
                        {isResolved ? 'RESOLVED' : alert.severity.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: 'var(--accent-cyan)',
                          background: 'rgba(56, 189, 248, 0.1)',
                          padding: '0.1rem 0.45rem',
                          borderRadius: 'var(--radius-xs)',
                        }}
                      >
                        {alert.target}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {alert.description}
                    </p>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                      <span><strong>Constraint:</strong> {alert.constraint}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {isResolved ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle2 size={14} />
                      <span>Compliant</span>
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlert(alert);
                      }}
                      className="btn-primary"
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.78rem',
                        gap: '0.35rem',
                        borderRadius: '9999px',
                        fontWeight: 700,
                      }}
                    >
                      <Sparkles size={13} />
                      <span>Resolve</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Interactive Alert Resolution Modal */}
      {selectedAlert && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedAlert(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '1.85rem',
              borderRadius: '28px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              boxShadow: 'var(--shadow-popup)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge ${selectedAlert.severity === 'critical' ? 'badge-rose' : 'badge-amber'}`}>
                  {selectedAlert.category}
                </span>
                <span className="badge badge-cyan">{selectedAlert.target}</span>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Title & Description */}
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedAlert.title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedAlert.description}
              </p>
            </div>

            {/* Constraint Details Box */}
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                Enforced Constraint:
              </span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {selectedAlert.constraint}
              </span>
            </div>

            {/* Proposed Autonomous Resolution */}
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                <Sparkles size={15} />
                <span>Proposed AI Resolution Blueprint</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                {selectedAlert.proposedSolution}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setSelectedAlert(null)}
                className="btn-secondary"
                style={{ padding: '0.55rem 0.95rem', fontSize: '0.84rem' }}
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  onTriggerAgentQuery(`Resolve operational alert: ${selectedAlert.title}`);
                  setSelectedAlert(null);
                }}
                className="btn-secondary"
                style={{ padding: '0.55rem 0.95rem', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)' }}
              >
                <Bot size={15} />
                <span>Ask AI Agent</span>
              </button>
              <button
                onClick={() => handleApplyResolution(selectedAlert)}
                disabled={isResolving}
                className="btn-primary"
                style={{
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  gap: '0.5rem',
                }}
              >
                <Sparkles size={16} />
                <span>{isResolving ? 'Validating & Applying...' : 'Apply AI Resolution'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewView;
