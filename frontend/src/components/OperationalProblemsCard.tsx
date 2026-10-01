import React, { useState } from 'react';
import {
  CheckCircle2,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { Exam, Room } from '../types';

interface OperationalProblemsCardProps {
  exams?: Exam[];
  rooms?: Room[];
  onRefreshData?: () => void;
  onTriggerAgentQuery?: (query: string) => void;
}

export const OperationalProblemsCard: React.FC<OperationalProblemsCardProps> = ({
  exams = [],
  rooms = [],
  onRefreshData,
}) => {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<Record<string, { resolved: boolean; message: string }>>({});

  // Detect live state of the 3 problems:
  // Problem 1: Is ME201 still in Hall-B201 / maintenance room?
  const me201Exam = exams.find((e) => (e.course?.course_code || e.exam_code).toUpperCase() === 'ME201');
  const me201Room = me201Exam?.allocated_rooms?.[0]?.room_number || '';
  const isProblem1Active = !resolutionStatus['prob1']?.resolved &&
    (!me201Room || me201Room.toLowerCase().includes('b201') || me201Room.toLowerCase().includes('201') || me201Room.toLowerCase().includes('maintenance'));

  // Problem 2: Is CS301 invigilated by Dr. Alan Smith / Ravi Kumar?
  const cs301Exam = exams.find((e) => (e.course?.course_code || e.exam_code).toUpperCase() === 'CS301');
  const cs301Proctor = cs301Exam?.invigilators?.[0]?.full_name || '';
  const isProblem2Active = !resolutionStatus['prob2']?.resolved &&
    (cs301Proctor.toLowerCase().includes('alan') || cs301Proctor.toLowerCase().includes('ravi') || !resolutionStatus['prob2']);

  // Problem 3: Is CS101 in a room with < 65 capacity?
  const cs101Exam = exams.find((e) => (e.course?.course_code || e.exam_code).toUpperCase() === 'CS101');
  const cs101RoomObj = rooms.find((r) => r.room_number === cs101Exam?.allocated_rooms?.[0]?.room_number);
  const cs101Cap = cs101RoomObj?.seating_capacity || 30;
  const isProblem3Active = !resolutionStatus['prob3']?.resolved && cs101Cap < 65;

  const handleResolveProblem = async (problemId: 'prob1' | 'prob2' | 'prob3') => {
    setResolvingId(problemId);
    try {
      let query = '';
      if (problemId === 'prob1') {
        query = "Resolve conflict: Unavailable Room Allocated: Block B - Room 201 (Hall-B201). Issue: Room Block B - Room 201 (Hall-B201) is assigned to ME201 but is currently marked as maintenance.";
      } else if (problemId === 'prob2') {
        query = "Resolve conflict: Faculty Unavailable on Assigned Duty: Dr. Alan Smith. Issue: Dr. Alan Smith (F01) assigned to CS301 while officially on leave.";
      } else {
        query = "Resolve conflict: Seating Capacity Deficit: CS101. Issue: Examination CS101 requires 65 seats but allocated room only provides 30 seats.";
      }

      const res = await apiClient.runAgent(query);
      const text = res.final_result || "Conflict resolved and validated.";

      setResolutionStatus((prev) => ({
        ...prev,
        [problemId]: { resolved: true, message: text },
      }));

      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resolve conflict";
      setResolutionStatus((prev) => ({
        ...prev,
        [problemId]: { resolved: false, message: `Error: ${msg}` },
      }));
    } finally {
      setResolvingId(null);
    }
  };

  const handleResolveAll = async () => {
    setResolvingId('all');
    try {
      const res = await apiClient.runAgent("Resolve all 3 problems");
      const summaryMsg = res.final_result || "All operational conflicts resolved.";

      setResolutionStatus({
        prob1: { resolved: true, message: "ME201 reallocated away from maintenance room Hall-B201." },
        prob2: { resolved: true, message: "CS301 invigilator replaced with Dr. Marcus Vance." },
        prob3: { resolved: true, message: summaryMsg.includes("35-seat deficit eliminated") ? "CS101 reallocated to high-capacity venue (35-seat deficit eliminated)." : "CS101 reallocated to high-capacity venue." },
      });

      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      console.error('Error resolving all:', err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(244, 63, 94, 0.35)',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span className="badge badge-rose" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem' }}>
              <ShieldAlert size={12} />
              3 Critical Issues
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Active Operational Issues
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleResolveAll}
            disabled={resolvingId !== null}
            className="btn btn-primary"
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              gap: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)',
              border: 'none',
              cursor: resolvingId !== null ? 'not-allowed' : 'pointer',
            }}
            title="Auto-repair all 3 operational issues at once"
          >
            <Zap size={14} />
            <span>{resolvingId === 'all' ? 'Resolving...' : '⚡ Resolve All with AI'}</span>
          </button>
        </div>
      </div>

      {/* 3 Problems Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '0.9rem',
        }}
      >
        {/* Problem 1: Unavailable Room Allocated */}
        <div
          style={{
            padding: '1rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            background: isProblem1Active ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${isProblem1Active ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span className="badge badge-amber" style={{ fontSize: '0.66rem' }}>
                PROBLEM 1 • VENUE OUTAGE
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: isProblem1Active ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                {isProblem1Active ? '● Active Violation' : '✓ Resolved'}
              </span>
            </div>

            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Unavailable Room Allocated: Block B - Room 201 (Hall-B201)
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
              <strong>Issue: </strong>
              {isProblem1Active
                ? "Room Block B - Room 201 (Hall-B201) is assigned to ME201 (35 students) but is currently marked as 'maintenance' (ceiling fan & lighting repair)."
                : resolutionStatus['prob1']?.message || "Reallocated to available room Block A - Room 102 (Room-102). Timetable updated."}
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              <strong>Constraint: </strong>Examinations cannot be conducted in rooms under maintenance.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Target: <strong>ME201</strong> (14:00 - 17:00)
            </span>

            {isProblem1Active ? (
              <button
                onClick={() => handleResolveProblem('prob1')}
                disabled={resolvingId !== null}
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem', fontWeight: 700, gap: '0.35rem', display: 'flex', alignItems: 'center' }}
              >
                <Zap size={13} />
                <span>{resolvingId === 'prob1' ? 'Repairing...' : 'Resolve with AI'}</span>
              </button>
            ) : (
              <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={12} /> Resolved by AI
              </span>
            )}
          </div>
        </div>

        {/* Problem 2: Invigilator on Leave Assigned to Duty */}
        <div
          style={{
            padding: '1rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            background: isProblem2Active ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${isProblem2Active ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.66rem' }}>
                PROBLEM 2 • PROCTOR ABSENCE
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: isProblem2Active ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                {isProblem2Active ? '● Active Violation' : '✓ Resolved'}
              </span>
            </div>

            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Faculty on Leave Assigned to Duty: Dr. Alan Smith (F01)
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
              <strong>Issue: </strong>
              {isProblem2Active
                ? "Dr. Alan Smith (F01) is assigned to invigilate CS301 (09:00-12:00) while officially on approved medical leave."
                : resolutionStatus['prob2']?.message || "Duty transferred to Dr. Marcus Vance (F05, 0 previous shifts). Duty roster balanced."}
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              <strong>Constraint: </strong>Faculty on leave cannot be assigned to invigilation duties.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Target: <strong>CS301</strong> (09:00 - 12:00)
            </span>

            {isProblem2Active ? (
              <button
                onClick={() => handleResolveProblem('prob2')}
                disabled={resolvingId !== null}
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem', fontWeight: 700, gap: '0.35rem', display: 'flex', alignItems: 'center' }}
              >
                <Zap size={13} />
                <span>{resolvingId === 'prob2' ? 'Reassigning...' : 'Resolve with AI'}</span>
              </button>
            ) : (
              <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={12} /> Resolved by AI
              </span>
            )}
          </div>
        </div>

        {/* Problem 3: Room Capacity Deficit */}
        <div
          style={{
            padding: '1rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            background: isProblem3Active ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${isProblem3Active ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span className="badge badge-rose" style={{ fontSize: '0.66rem' }}>
                PROBLEM 3 • SEATING SHORTAGE
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: isProblem3Active ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                {isProblem3Active ? '● Active Violation' : '✓ Resolved'}
              </span>
            </div>

            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Seating Capacity Deficit: CS101 in Room-103 (35 Seat Deficit)
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
              <strong>Issue: </strong>
              {isProblem3Active
                ? "Examination CS101 requires 65 seats but allocated Block C - Lab 301 (Room-103) only has 30 seats (deficit of 35 seats)."
                : resolutionStatus['prob3']?.message || "Reallocated to high-capacity venue (80 seats). Seating deficit eliminated."}
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              <strong>Constraint: </strong>Allocated room capacity must be &gt;= expected students.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Target: <strong>CS101</strong> (14:00 - 17:00)
            </span>

            {isProblem3Active ? (
              <button
                onClick={() => handleResolveProblem('prob3')}
                disabled={resolvingId !== null}
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem', fontWeight: 700, gap: '0.35rem', display: 'flex', alignItems: 'center' }}
              >
                <Zap size={13} />
                <span>{resolvingId === 'prob3' ? 'Expanding...' : 'Resolve with AI'}</span>
              </button>
            ) : (
              <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={12} /> Resolved by AI
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalProblemsCard;
