import React, { useState } from 'react';
import {
  Plus,
  Bot,
  Clock,
} from 'lucide-react';
import type { Incident } from '../types';
import { apiClient } from '../services/apiClient';

interface IncidentsViewProps {
  incidents: Incident[];
  onIncidentCreated: () => void;
  onTriggerAgentQuery: (query: string) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onIncidentCreated,
  onTriggerAgentQuery,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [incidentType, setIncidentType] = useState('room_unavailability');
  const [severity, setSeverity] = useState('high');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await apiClient.createIncident({
        incident_type: incidentType,
        severity,
        description,
      });
      setDescription('');
      setShowCreateModal(false);
      onIncidentCreated();
    } catch (err) {
      console.error('Failed to create incident:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Incidents
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Operational disruptions and incident recovery.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={15} />
          <span>Report Incident</span>
        </button>
      </div>

      {/* Incident Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '1.5rem',
              background: 'var(--bg-surface)',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Report Operational Incident
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Incident Type
                </label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="room_unavailability">Room Unavailability (Leak, Power, Fire)</option>
                  <option value="faculty_absence">Faculty Emergency Absence / Sick Leave</option>
                  <option value="overcrowding">Room Overcrowding / Seating Deficit</option>
                  <option value="technical_failure">AV / Projector / Network Failure</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Severity Level
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="critical">Critical (Immediate exam relocation)</option>
                  <option value="high">High (Disruption within 2 hours)</option>
                  <option value="medium">Medium (Monitor / schedule repair)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Description / Situation
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Room A101 air conditioning unit water leak flooding back 3 rows."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || !description.trim()}
                >
                  <span>Submit Incident</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Incidents List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {incidents.map((inc) => {
          const isCrit = inc.severity === 'critical';
          const isResolved = inc.status === 'resolved';

          return (
            <div
              key={inc.id}
              className="glass-panel"
              style={{
                padding: '1.25rem',
                borderLeft: `4px solid ${
                  isResolved
                    ? 'var(--accent-emerald)'
                    : isCrit
                    ? 'var(--accent-rose)'
                    : 'var(--accent-amber)'
                }`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span
                    className={`badge ${
                      isResolved ? 'badge-emerald' : isCrit ? 'badge-rose' : 'badge-amber'
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <span className="badge badge-cyan">
                    Status: {inc.status}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {inc.incident_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {inc.description}
                </div>

                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={12} />
                  <span>Logged at {inc.created_at.slice(0, 19).replace('T', ' ')} UTC</span>
                </div>
              </div>

              {!isResolved && (
                <button
                  className="btn-primary"
                  onClick={() => onTriggerAgentQuery(`Resolve incident: ${inc.description}`)}
                  style={{ flexShrink: 0, fontSize: '0.78rem' }}
                >
                  <Bot size={13} />
                  <span>Agent Resolve</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
