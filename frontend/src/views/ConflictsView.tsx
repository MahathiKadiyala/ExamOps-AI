import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  AlertTriangle,
  Building2,
  Users,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import type { ConflictReport, ConflictItem, Exam, Room } from '../types';
import { OperationalProblemsCard } from '../components/OperationalProblemsCard';

interface ConflictsViewProps {
  conflictReport: ConflictReport | null;
  exams?: Exam[];
  rooms?: Room[];
  onRefreshData?: () => void;
  onTriggerAgentQuery: (query: string) => void;
}

export const ConflictsView: React.FC<ConflictsViewProps> = ({
  conflictReport,
  exams = [],
  rooms = [],
  onRefreshData,
  onTriggerAgentQuery,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const conflicts = conflictReport?.conflicts || [];
  const summary = conflictReport?.summary || {
    total_conflicts: conflicts.length,
    critical_count: conflicts.filter((c) => c.severity === 'critical').length,
    high_count: conflicts.filter((c) => c.severity === 'high').length,
    medium_count: conflicts.filter((c) => c.severity === 'medium').length,
    by_category: {},
  };

  const filteredConflicts = conflicts.filter((c) => {
    if (filterSeverity === 'all') return true;
    return c.severity === filterSeverity;
  });

  // Extract affected resource type and string
  const getAffectedResource = (c: ConflictItem): { icon: React.ReactNode; label: string; text: string } => {
    if (c.conflict_type.includes('ROOM')) {
      return {
        icon: <Building2 size={13} color="var(--accent-amber)" />,
        label: 'Affected Room',
        text: c.impacted_entities?.room_ids?.length ? `Room ID: ${c.impacted_entities.room_ids[0].slice(0, 8)}` : 'Room Assignment',
      };
    }
    if (c.conflict_type.includes('STUDENT')) {
      return {
        icon: <GraduationCap size={13} color="var(--accent-rose)" />,
        label: 'Affected Student',
        text: 'Alex Mercer (STU-2026-1000)',
      };
    }
    if (c.conflict_type.includes('INVIGILATOR') || c.conflict_type.includes('FACULTY')) {
      return {
        icon: <Users size={13} color="var(--accent-purple)" />,
        label: 'Affected Faculty',
        text: 'Dr. Alan Smith (F01 — on leave)',
      };
    }
    return {
      icon: <AlertTriangle size={13} color="var(--accent-cyan)" />,
      label: 'Affected Exam',
      text: 'Examination Timetable',
    };
  };

  // Recommended action suggestion
  const getRecommendedAction = (c: ConflictItem): string => {
    switch (c.conflict_type) {
      case 'ROOM_DOUBLE_BOOKING':
        return 'Room optimizer must reassign displaced exam to available secondary hall (Auditorium-A / Hall-A).';
      case 'ROOM_CAPACITY_VIOLATION':
        return 'Reallocate to a larger lecture hall or split exam cohort across adjacent classrooms.';
      case 'STUDENT_EXAM_OVERLAP':
        return 'Reschedule one examination to alternate morning/afternoon slot or authorize isolated makeup session.';
      case 'INVIGILATOR_ON_LEAVE':
        return 'Trigger emergency proctor solver to replace absent faculty with lowest-workload reserve member.';
      case 'EXAM_UNASSIGNED_ROOM':
        return 'Run deterministic room allocator to match expected enrollment with available seating.';
      default:
        return 'Engage constraint solver for closed-loop repair.';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Conflicts
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Active schedule and room allocation conflicts.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => onTriggerAgentQuery('Find all examination conflicts and recommend optimal resolutions.')}
          style={{ borderRadius: '9999px', padding: '0.45rem 1.15rem', fontWeight: 700 }}
        >
          <Sparkles size={15} />
          <span>Scan Conflicts</span>
        </button>
      </div>

      {/* 3 Primary Operational Problems Command Card */}
      <OperationalProblemsCard
        exams={exams}
        rooms={rooms}
        onRefreshData={onRefreshData}
        onTriggerAgentQuery={onTriggerAgentQuery}
      />

      {/* Summary Metrics Bar with Severity Filters (Reference Image 2 Rounded Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.15rem',
            borderRadius: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid',
            borderColor: filterSeverity === 'all' ? 'var(--border-accent)' : 'var(--border-card)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            transition: 'all var(--transition-fast)',
          }}
          onClick={() => setFilterSeverity('all')}
        >
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL CONFLICTS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '0.2rem' }}>
            {summary.total_conflicts}
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.15rem',
            borderRadius: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid',
            borderColor: filterSeverity === 'critical' ? 'var(--accent-rose)' : 'var(--border-card)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            transition: 'all var(--transition-fast)',
          }}
          onClick={() => setFilterSeverity('critical')}
        >
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>CRITICAL VIOLATIONS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '0.2rem' }}>
            {summary.critical_count}
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.15rem',
            borderRadius: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid',
            borderColor: filterSeverity === 'high' ? 'var(--accent-amber)' : 'var(--border-card)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            transition: 'all var(--transition-fast)',
          }}
          onClick={() => setFilterSeverity('high')}
        >
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>HIGH SEVERITY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
            {summary.high_count}
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.15rem',
            borderRadius: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid',
            borderColor: filterSeverity === 'medium' ? 'var(--accent-cyan)' : 'var(--border-card)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            transition: 'all var(--transition-fast)',
          }}
          onClick={() => setFilterSeverity('medium')}
        >
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>MEDIUM / WARNING</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
            {summary.medium_count}
          </div>
        </div>
      </div>

      {/* Conflicts List with Comprehensive Fields (Prompt 18 Spec) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredConflicts.map((c) => {
          const isCrit = c.severity === 'critical';
          const isHigh = c.severity === 'high';
          const res = getAffectedResource(c);
          const recAction = getRecommendedAction(c);

          return (
            <div
              key={c.id}
              className="glass-panel"
              style={{
                padding: '1.35rem',
                borderRadius: '24px',
                border: '1px solid var(--border-card)',
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow-card)',
                borderLeft: `5px solid ${
                  isCrit ? 'var(--accent-rose)' : isHigh ? 'var(--accent-amber)' : 'var(--accent-cyan)'
                }`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              {/* Top Row: Type, Severity, Action Button */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span
                      className={`badge ${isCrit ? 'badge-rose' : isHigh ? 'badge-amber' : 'badge-cyan'}`}
                      style={{ fontSize: '0.68rem', borderRadius: '9999px' }}
                    >
                      {c.severity.toUpperCase()}
                    </span>
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem', borderRadius: '9999px' }}>
                      TYPE: {c.conflict_type}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Category: {c.recovery_category}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {c.title}
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={() => onTriggerAgentQuery(`Resolve conflict: ${c.title}. Issue: ${c.description}.`)}
                  style={{ flexShrink: 0, fontSize: '0.76rem', padding: '0.42rem 0.95rem', borderRadius: '9999px', fontWeight: 700 }}
                >
                  <Bot size={13} />
                  <span>Ask Agent to Resolve</span>
                </button>
              </div>

              {/* Middle Row: Affected Entity & Detected Issue */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {/* Affected Resource */}
                <div style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-xs)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {res.icon}
                    <span>{res.label}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {res.text}
                  </div>
                </div>

                {/* Constraint Violated */}
                <div style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-xs)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <ShieldCheck size={13} color="var(--accent-cyan)" />
                    <span>Rule Violated</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {c.constraint_violated}
                  </div>
                </div>
              </div>

              {/* Detected Issue Description */}
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Detected Issue: </strong>
                {c.description}
              </div>

              {/* Recommended Action */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.95rem',
                  borderRadius: '16px',
                  background: 'rgba(56, 189, 248, 0.06)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: '0.76rem',
                  color: 'var(--text-primary)',
                }}
              >
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                  Recommended Action <ArrowRight size={12} />
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{recAction}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
