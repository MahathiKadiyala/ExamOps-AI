import React, { useEffect, useState } from 'react';
import {
  Bot,
  ArrowDown,
  CheckCircle2,
  Play,
} from 'lucide-react';
import type { Incident, AgentEvent } from '../types';
import { apiClient } from '../services/apiClient';

interface AgentOperationsViewProps {
  incidents?: Incident[];
  onTriggerAgentQuery: (query: string) => void;
  onRefreshData?: () => void;
}

interface StepTraceItem {
  stage: 'REQUEST' | 'GATHERING' | 'ROOM SEARCH' | 'CALCULATING' | 'VALIDATING' | 'CORRECTING' | 'COMPLETED';
  title: string;
  detail: string;
  status: 'passed' | 'rejected' | 'correcting' | 'completed' | 'active';
  timestamp?: string;
}

export const AgentOperationsView: React.FC<AgentOperationsViewProps> = ({
  incidents = [],
  onTriggerAgentQuery,
  onRefreshData,
}) => {
  const [selectedTraceSteps, setSelectedTraceSteps] = useState<StepTraceItem[]>([]);
  const [isRunningTrace, setIsRunningTrace] = useState(false);

  // Default demonstration trace matching Prompt 21 specification
  const defaultPrompt21Trace: StepTraceItem[] = [
    {
      stage: 'REQUEST',
      title: 'REQUEST RECEIVED',
      detail: 'Command: "Room A101 is unavailable. Resolve displaced examinations."',
      status: 'active',
      timestamp: '14:02:01',
    },
    {
      stage: 'GATHERING',
      title: 'GATHERING DISPLACED SESSIONS',
      detail: 'Identified 2 examinations affected: EE201 (40 students), ME201 (35 students).',
      status: 'passed',
      timestamp: '14:02:02',
    },
    {
      stage: 'ROOM SEARCH',
      title: 'ROOM SEARCH',
      detail: '4 candidates found: Room-103 (30 seats), Room-102 (40 seats), Hall-A (100 seats), Auditorium-A (150 seats).',
      status: 'passed',
      timestamp: '14:02:03',
    },
    {
      stage: 'CALCULATING',
      title: 'CALCULATING CONSTRAINTS',
      detail: 'Candidate 1: Evaluating Room-103 for EE201 (40 students required).',
      status: 'active',
      timestamp: '14:02:04',
    },
    {
      stage: 'VALIDATING',
      title: 'VALIDATING CANDIDATE 1',
      detail: 'Room-103 rejected — insufficient capacity (30 seats < 40 required, deficit of 10 seats).',
      status: 'rejected',
      timestamp: '14:02:05',
    },
    {
      stage: 'CORRECTING',
      title: 'CORRECTING & ADAPTIVE RETRY',
      detail: 'Trying secondary candidate: Auditorium-A (Capacity: 150 seats). Time slot 14:00-17:00 open.',
      status: 'correcting',
      timestamp: '14:02:06',
    },
    {
      stage: 'COMPLETED',
      title: 'COMPLETED & COMMITTED',
      detail: 'Auditorium-A assigned to EE201. Hall-A assigned to ME201. All 10 constraints validated.',
      status: 'completed',
      timestamp: '14:02:07',
    },
  ];

  useEffect(() => {
    setSelectedTraceSteps(defaultPrompt21Trace);
  }, []);

  // Run live scenario trace
  const handleRunTrace = async (scenario: 'room' | 'self-correction' | 'faculty') => {
    setIsRunningTrace(true);
    let query = '';
    if (scenario === 'room') {
      query = 'Room A101 is unavailable. Resolve the affected examination.';
    } else if (scenario === 'self-correction') {
      query = 'Candidate room invalid. Run self-correction and recover examination.';
    } else {
      query = 'Faculty F02 is absent. Find a replacement.';
    }

    try {
      const res = await apiClient.runAgent(query);
      if (res.events && res.events.length > 0) {
        // Map real events to clean trace stages
        const steps: StepTraceItem[] = res.events.map((e: AgentEvent) => {
          let stage: StepTraceItem['stage'] = 'CALCULATING';
          let st: StepTraceItem['status'] = 'passed';

          if (e.state === 'REQUEST' || e.state === 'UNDERSTANDING') stage = 'REQUEST';
          else if (e.state === 'GATHERING') stage = 'GATHERING';
          else if (e.state === 'ROOM SEARCH') stage = 'ROOM SEARCH';
          else if (e.state === 'VALIDATING') {
            stage = 'VALIDATING';
            if (e.message.toLowerCase().includes('reject')) st = 'rejected';
          } else if (e.state === 'CORRECTING') {
            stage = 'CORRECTING';
            st = 'correcting';
          } else if (e.state === 'COMPLETED') {
            stage = 'COMPLETED';
            st = 'completed';
          }

          return {
            stage,
            title: e.state,
            detail: e.message,
            status: st,
            timestamp: e.timestamp ? e.timestamp.slice(11, 19) : undefined,
          };
        });
        setSelectedTraceSteps(steps);
      }
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to run trace:', err);
    } finally {
      setIsRunningTrace(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          borderColor: 'var(--border-accent)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Agent Operations
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', marginBottom: 0 }}>
            Incident lifecycle and automated resolution trace.
          </p>
        </div>

        {/* Operational Trigger Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn-secondary"
            onClick={() => handleRunTrace('self-correction')}
            disabled={isRunningTrace}
            style={{ fontSize: '0.74rem' }}
          >
            <Play size={12} />
            <span>Audit: Self-Correction</span>
          </button>
          <button
            className="btn-primary"
            onClick={() => handleRunTrace('room')}
            disabled={isRunningTrace}
            style={{ fontSize: '0.74rem' }}
          >
            <Bot size={13} />
            <span>Resolve: Room Outage</span>
          </button>
        </div>
      </div>

      {/* TWO SECTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '1.25rem' }}>
        {/* =====================================================================
            SECTION 1: INCIDENT SECTION (Prompt 21 Spec)
           ===================================================================== */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Active Incident Registry
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Real-time tracking of disruptions, affected resources, and automated resolutions
              </div>
            </div>
            <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
              {incidents.filter((i) => i.status !== 'resolved').length} Open Incidents
            </span>
          </div>

          {incidents.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={24} color="var(--accent-emerald)" style={{ margin: '0 auto 0.5rem' }} />
              Zero operational disruptions logged. System operating nominally.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {incidents.map((inc) => {
                const isResolved = inc.status === 'resolved';
                const isCrit = inc.severity === 'critical';

                return (
                  <div
                    key={inc.id}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-tertiary)',
                      borderLeft: `4px solid ${
                        isResolved ? 'var(--accent-emerald)' : isCrit ? 'var(--accent-rose)' : 'var(--accent-amber)'
                      }`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    {/* Top Row: Badges & State */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span
                          className={`badge ${
                            isResolved ? 'badge-emerald' : isCrit ? 'badge-rose' : 'badge-amber'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {inc.severity.toUpperCase()}
                        </span>
                        <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                          STATE: {inc.status.toUpperCase()}
                        </span>
                      </div>

                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {inc.created_at.slice(11, 16)} UTC
                      </span>
                    </div>

                    {/* Active Incident Title & Description */}
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {inc.description}
                    </div>

                    {/* Affected Resource & Affected Exam */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.74rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>
                        <strong>Affected Resource:</strong>{' '}
                        <span style={{ color: 'var(--text-primary)' }}>
                          {inc.affected_room_id ? 'Room ' + inc.affected_room_id.slice(0, 8) : inc.affected_faculty_id ? 'Faculty Proctor' : 'Academic Facility'}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        <strong>Affected Exam:</strong>{' '}
                        <span style={{ color: 'var(--text-primary)' }}>
                          {inc.affected_exam_id ? 'Exam ' + inc.affected_exam_id.slice(0, 8) : 'Scheduled Session'}
                        </span>
                      </div>
                    </div>

                    {/* Resolution Section */}
                    <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.74rem' }}>
                      <strong style={{ color: isResolved ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                        Resolution:
                      </strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {isResolved
                          ? 'Incident resolved by agent: Displaced entities reallocated and validated.'
                          : 'Awaiting agent dispatch or administrative override.'}
                      </span>
                    </div>

                    {!isResolved && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
                        <button
                          className="btn-primary"
                          onClick={() => onTriggerAgentQuery(`Resolve incident: ${inc.description}`)}
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
                        >
                          <Bot size={12} />
                          <span>Dispatch Agent</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =====================================================================
            SECTION 2: AGENT EXECUTION SECTION (Prompt 21 Spec)
            REQUEST ↓ GATHERING ↓ ROOM SEARCH ↓ CALCULATING ↓ VALIDATING ↓ CORRECTING ↓ COMPLETED
           ===================================================================== */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Agent Execution Step Trace
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Chronological operational lifecycle (Zero hidden chain-of-thought)
              </div>
            </div>

            <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
              VERIFIED AGENTIC
            </span>
          </div>

          {/* Simple Step-Trace Pipeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
            {selectedTraceSteps.map((step, idx) => {
              const isLast = idx === selectedTraceSteps.length - 1;
              const isRejected = step.status === 'rejected';
              const isCorrecting = step.status === 'correcting';
              const isDone = step.status === 'completed';

              const badgeColor = isRejected
                ? 'var(--accent-rose)'
                : isCorrecting
                ? 'var(--accent-amber)'
                : isDone
                ? 'var(--accent-emerald)'
                : 'var(--accent-cyan)';

              return (
                <React.Fragment key={idx}>
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-tertiary)',
                      border: `1px solid ${
                        isRejected
                          ? 'rgba(244, 63, 94, 0.4)'
                          : isCorrecting
                          ? 'rgba(245, 158, 11, 0.4)'
                          : isDone
                          ? 'rgba(16, 185, 129, 0.4)'
                          : 'var(--border-subtle)'
                      }`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            background: 'var(--bg-card)',
                            color: badgeColor,
                            border: `1px solid ${badgeColor}`,
                          }}
                        >
                          {step.stage}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {step.title}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        {step.detail}
                      </div>
                    </div>

                    {step.timestamp && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {step.timestamp}
                      </span>
                    )}
                  </div>

                  {!isLast && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '0.1rem 0' }}>
                      <ArrowDown size={14} color="var(--border-accent)" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
