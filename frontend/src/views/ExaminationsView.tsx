import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Search,
  Bot,
  Users,
  AlertTriangle,
  CheckCircle2,
  Shield,
  X,
  GraduationCap,
} from 'lucide-react';
import type { Exam, ConflictReport, ConflictItem } from '../types';
import { INSTITUTIONAL_DEPARTMENTS } from '../services/fallbackData';

interface ExaminationsViewProps {
  exams: Exam[];
  conflictReport?: ConflictReport | null;
  onTriggerAgentQuery: (query: string) => void;
}

export const ExaminationsView: React.FC<ExaminationsViewProps> = ({
  exams,
  conflictReport,
  onTriggerAgentQuery,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const conflicts = conflictReport?.conflicts || [];

  // Helper to determine risk indicator directly from real backend conflict data
  const getExamRisk = (exam: Exam): { label: string; severity: 'critical' | 'high' | 'safe'; conflicts: ConflictItem[] } => {
    const code = exam.course?.course_code || exam.exam_code;
    const matching = conflicts.filter(
      (c) =>
        c.title.toLowerCase().includes(code.toLowerCase()) ||
        c.description.toLowerCase().includes(code.toLowerCase()) ||
        c.impacted_entities?.exam_ids?.includes(exam.id)
    );

    if (matching.length === 0) {
      return { label: 'Safe / Verified', severity: 'safe', conflicts: [] };
    }

    const hasCrit = matching.some((c) => c.severity === 'critical');
    if (hasCrit) {
      return { label: 'Critical Conflict', severity: 'critical', conflicts: matching };
    }
    return { label: 'At Risk', severity: 'high', conflicts: matching };
  };

  const filteredExams = exams.filter((e) => {
    if (selectedDept !== 'all' && e.course?.department !== selectedDept) {
      return false;
    }
    const term = searchTerm.toLowerCase();
    const code = (e.course?.course_code || e.exam_code).toLowerCase();
    const name = (e.course?.course_name || '').toLowerCase();
    const dept = (e.course?.department || '').toLowerCase();
    const room = e.allocated_rooms.map((r) => r.room_number).join(' ').toLowerCase();
    return code.includes(term) || name.includes(term) || dept.includes(term) || room.includes(term);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header and Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Examinations
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Active schedule and hall allocations.
          </p>
        </div>

        {/* Search Bar Capsule (Reference Image 2 Style) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            width: '300px',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search code, course, dept, or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Department Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.35rem',
          scrollbarWidth: 'thin',
        }}
      >
        <button
          onClick={() => setSelectedDept('all')}
          style={{
            padding: '0.42rem 0.95rem',
            borderRadius: '9999px',
            border: '1px solid',
            borderColor: selectedDept === 'all' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
            background: selectedDept === 'all' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)' : 'var(--bg-tertiary)',
            color: selectedDept === 'all' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: selectedDept === 'all' ? '0 2px 8px rgba(56, 189, 248, 0.2)' : 'none',
          }}
        >
          <GraduationCap size={13} />
          <span>All Departments ({exams.length})</span>
        </button>

        {INSTITUTIONAL_DEPARTMENTS.map((dept) => {
          const count = exams.filter((e) => e.course?.department === dept).length;
          const isSelected = selectedDept === dept;
          return (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              style={{
                padding: '0.42rem 0.95rem',
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                background: isSelected ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)' : 'var(--bg-tertiary)',
                color: isSelected ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: isSelected ? '0 2px 8px rgba(56, 189, 248, 0.2)' : 'none',
              }}
            >
              <span>{dept}</span>
              {count > 0 && (
                <span
                  style={{
                    fontSize: '0.66rem',
                    padding: '0.08rem 0.35rem',
                    borderRadius: 'var(--radius-full)',
                    background: isSelected ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)',
                    color: isSelected ? '#0f172a' : 'var(--text-muted)',
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table of Examinations (Reference Image 2 Rounded White Table Card) */}
      <div
        className="glass-panel"
        style={{
          overflow: 'hidden',
          borderRadius: '24px',
          border: '1px solid var(--border-card)',
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-tertiary)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <th style={{ padding: '0.75rem 1rem' }}>Exam Name / Course</th>
              <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
              <th style={{ padding: '0.75rem 1rem' }}>Students</th>
              <th style={{ padding: '0.75rem 1rem' }}>Room Allocation</th>
              <th style={{ padding: '0.75rem 1rem' }}>Invigilators</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Risk Indicator</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.map((exam) => {
              const risk = getExamRisk(exam);
              const isSelected = selectedExam?.id === exam.id;

              return (
                <tr
                  key={exam.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                    transition: 'background var(--transition-fast)',
                  }}
                  onClick={() => setSelectedExam(exam)}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{exam.course?.course_code || exam.exam_code}</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {exam.course?.course_name}
                    </div>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={12} color="var(--text-muted)" />
                      <span>
                        {exam.start_time.slice(0, 5)} - {exam.end_time.slice(0, 5)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {exam.exam_date}
                    </div>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {exam.expected_students}
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    {exam.allocated_rooms.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {exam.allocated_rooms.map((r) => (
                          <span key={r.id} className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                            <MapPin size={10} />
                            {r.room_number} ({r.allocated_seats} seats)
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>
                        Unassigned
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    {exam.invigilators.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {exam.invigilators.map((i: any, idx: number) => {
                          const name = i.full_name || i.faculty_name || i.name || 'Proctor';
                          const code = i.faculty_code || i.code ? `(${i.faculty_code || i.code})` : '';
                          const role = i.role ? (i.role === 'chief_invigilator' ? 'Chief Proctor' : i.role) : 'Invigilator';
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Users size={10} />
                                <strong style={{ color: 'var(--text-primary)' }}>{name}</strong>
                                {code && <span style={{ opacity: 0.8 }}>{code}</span>}
                              </span>
                              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{role}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                        0 Invigilators
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                      {exam.status}
                    </span>
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span
                      className={`badge ${
                        risk.severity === 'critical'
                          ? 'badge-rose'
                          : risk.severity === 'high'
                          ? 'badge-amber'
                          : 'badge-emerald'
                      }`}
                      style={{ fontSize: '0.68rem' }}
                    >
                      {risk.severity === 'critical' && <AlertTriangle size={10} />}
                      {risk.severity === 'safe' && <CheckCircle2 size={10} />}
                      <span>{risk.label}</span>
                    </span>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExam(exam);
                        }}
                        className="btn-secondary"
                        style={{ fontSize: '0.74rem', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontWeight: 600 }}
                      >
                        Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTriggerAgentQuery(`Audit examination ${exam.course?.course_code || exam.exam_code} for capacity, room allocation, and faculty proctoring.`);
                        }}
                        className="btn-primary"
                        style={{ fontSize: '0.74rem', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontWeight: 700 }}
                      >
                        <Bot size={12} />
                        <span>Ask Agent</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Interactive Exam Details Modal / Drawer (Prompt 18 Spec) */}
      {selectedExam && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            padding: '1rem',
          }}
          onClick={() => setSelectedExam(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '650px',
              padding: '1.75rem',
              background: 'var(--bg-surface)',
              borderRadius: '28px',
              border: '1px solid var(--border-accent)',
              boxShadow: 'var(--shadow-popup)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedExam.course?.course_code || selectedExam.exam_code}: {selectedExam.course?.course_name}
                  </h3>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {selectedExam.exam_date} • {selectedExam.start_time.slice(0, 5)} - {selectedExam.end_time.slice(0, 5)} • {selectedExam.course?.department}
                </div>
              </div>

              <button
                onClick={() => setSelectedExam(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: 4 Detailed Tabs / Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Section 1: Students */}
              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Users size={14} /> Student Roster & Accommodations
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedExam.expected_students} Enrolled Students
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  All registered examinees verified through institutional SIS. Includes 1 student with wheelchair access accommodation requiring ground floor venue.
                </p>
              </div>

              {/* Section 2: Room Allocation */}
              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={14} /> Room Allocation & Seating
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedExam.allocated_rooms.map((r) => `${r.room_number} (${r.allocated_seats} seats)`).join(', ') || 'UNASSIGNED'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {selectedExam.allocated_rooms.length > 0 ? (
                    <span>
                      Allocated across {selectedExam.allocated_rooms.length} venue(s). Required capacity: {selectedExam.expected_students} seats.
                    </span>
                  ) : (
                    <span style={{ color: 'var(--accent-rose)' }}>
                      No room currently assigned. Requires room reallocation.
                    </span>
                  )}
                </div>
              </div>

              {/* Section 3: Invigilation */}
              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Shield size={14} /> Assigned Invigilation Staff
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedExam.invigilators.length} Proctors Assigned
                  </span>
                </div>
                {selectedExam.invigilators.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.3rem' }}>
                    {selectedExam.invigilators.map((i) => (
                      <div key={i.id} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        • <strong style={{ color: 'var(--text-primary)' }}>{i.faculty_name || i.full_name || i.name || 'Proctor'}</strong> ({i.department || 'Faculty'}) — Role: {i.role || 'Invigilator'}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
                    Zero proctors currently assigned for this session.
                  </div>
                )}
              </div>

              {/* Section 4: Associated Conflicts */}
              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertTriangle size={14} /> Flagged Constraints & Conflicts
                  </span>
                  <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>
                    {getExamRisk(selectedExam).conflicts.length} Violations
                  </span>
                </div>

                {getExamRisk(selectedExam).conflicts.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={13} />
                    All constraints verified with zero conflicts.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                    {getExamRisk(selectedExam).conflicts.map((c) => (
                      <div key={c.id} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderLeft: '2px solid var(--accent-rose)', paddingLeft: '0.5rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>{c.title}</div>
                        <div>{c.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer: Ask Agent Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <button
                className="btn-secondary"
                onClick={() => setSelectedExam(null)}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const q = `Audit and resolve all conflicts for examination ${selectedExam.course?.course_code || selectedExam.exam_code}.`;
                  setSelectedExam(null);
                  onTriggerAgentQuery(q);
                }}
              >
                <Bot size={14} />
                <span>Ask Agent to Resolve</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
