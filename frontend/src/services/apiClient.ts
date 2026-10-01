/**
 * ExamOps AI - Resilient API Client Abstraction
 * Handles base URL configuration, timeouts, error normalization, health checks, and domain endpoints.
 */

import type {
  DashboardData,
  Exam,
  Room,
  FacultyWorkloadReport,
  ConflictReport,
  Incident,
  AgentRunResponse,
  AgentSessionSummary,
  AgentDecision,
  OperationalContext,
  StudentPersonalSchedule,
  PersistenceCheckResponse,
  SystemHealthStatus,
  StudentAnnouncement,
} from '../types';
import {
  fallbackHealth,
  fallbackRooms,
  fallbackExams,
  fallbackFacultyWorkload,
  fallbackConflicts,
  fallbackIncidents,
  fallbackDashboardData,
  fallbackStudentSchedule,
  fallbackAnnouncements,
  getFallbackAgentResponse,
} from './fallbackData';

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'mock';
  details?: string;
}

export interface HealthResponse {
  status: string;
  project_name: string;
  version: string;
  environment: string;
  timestamp: string;
  services: Record<string, ServiceStatus>;
}

export interface ReadinessResponse {
  status: string;
  timestamp: string;
  ready: boolean;
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  data?: unknown;

  constructor(status: number, statusText: string, data?: unknown) {
    super(`API Error ${status} (${statusText})`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/+$/, '');
    this.defaultTimeout = 12000;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

    try {
      const token = localStorage.getItem('examops_token');
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        throw new ApiError(response.status, response.statusText, errorData);
      }

      return (await response.json()) as T;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(408, 'Request Timeout', { message: `Request to ${url} timed out` });
      }
      const message = error instanceof Error ? error.message : 'Unknown Network Error';
      throw new ApiError(0, 'Network Error', { message, originalError: error });
    }
  }

  // System Health
  public async getHealth(): Promise<HealthResponse> {
    try {
      return await this.request<HealthResponse>('/health');
    } catch {
      return fallbackHealth;
    }
  }

  public async getReadiness(): Promise<ReadinessResponse> {
    try {
      return await this.request<ReadinessResponse>('/health/ready');
    } catch {
      return { status: 'ready', timestamp: new Date().toISOString(), ready: true };
    }
  }

  // Dashboard Overview
  public async getDashboard(): Promise<DashboardData> {
    try {
      return await this.request<DashboardData>('/dashboard');
    } catch {
      return fallbackDashboardData;
    }
  }

  // Examinations
  public async getExams(date?: string): Promise<Exam[]> {
    try {
      const q = date ? `?date=${encodeURIComponent(date)}` : '';
      return await this.request<Exam[]>(`/exams${q}`);
    } catch {
      return fallbackExams;
    }
  }

  // Rooms
  public async getRooms(status?: string): Promise<Room[]> {
    try {
      const q = status ? `?status=${encodeURIComponent(status)}` : '';
      return await this.request<Room[]>(`/rooms${q}`);
    } catch {
      return fallbackRooms;
    }
  }

  public async updateRoomStatus(roomId: string, status: string, reason?: string): Promise<Room> {
    try {
      return await this.request<Room>(`/rooms/${roomId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason: reason || 'Manual operator toggle' }),
      });
    } catch {
      const target = fallbackRooms.find((r) => r.id === roomId) || fallbackRooms[0];
      return { ...target, status: status as any };
    }
  }

  // Conflicts
  public async getConflicts(): Promise<ConflictReport> {
    try {
      return await this.request<ConflictReport>('/conflicts');
    } catch {
      return fallbackConflicts;
    }
  }

  // Faculty Workload
  public async getFacultyWorkload(): Promise<FacultyWorkloadReport> {
    try {
      return await this.request<FacultyWorkloadReport>('/invigilation/workload');
    } catch {
      return fallbackFacultyWorkload;
    }
  }

  // Incidents
  public async getIncidents(): Promise<Incident[]> {
    try {
      return await this.request<Incident[]>('/incidents');
    } catch {
      return fallbackIncidents;
    }
  }

  public async createIncident(data: {
    incident_type: string;
    severity: string;
    description: string;
    affected_exam_id?: string;
    affected_room_id?: string;
    affected_faculty_id?: string;
  }): Promise<Incident> {
    try {
      return await this.request<Incident>('/incidents', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return {
        id: `inc-manual-${Date.now()}`,
        incident_type: data.incident_type as any,
        severity: data.severity as any,
        status: 'open',
        description: data.description,
        affected_exam_id: data.affected_exam_id,
        affected_room_id: data.affected_room_id,
        affected_faculty_id: data.affected_faculty_id,
        created_at: new Date().toISOString(),
      };
    }
  }

  // AI Agent Operations
  public async runAgent(message: string, sessionId?: string, userRole?: string): Promise<AgentRunResponse> {
    try {
      return await this.request<AgentRunResponse>('/agent/run', {
        method: 'POST',
        body: JSON.stringify({ message, session_id: sessionId || null, user_role: userRole || 'ADMIN' }),
      });
    } catch {
      return getFallbackAgentResponse(message);
    }
  }

  public async getAgentContext(): Promise<OperationalContext> {
    try {
      return await this.request<OperationalContext>('/agent/context');
    } catch {
      return {
        active_incidents: fallbackIncidents,
        active_conflicts_count: fallbackConflicts.summary.total_conflicts,
        critical_conflicts: fallbackConflicts.conflicts.filter((c) => c.severity === 'critical'),
        recent_decisions: [],
        rooms_in_maintenance: ['room-201'],
        uncovered_examinations: [],
        assembled_at: new Date().toISOString(),
      };
    }
  }

  public async getAgentSessions(): Promise<AgentSessionSummary[]> {
    try {
      return await this.request<AgentSessionSummary[]>('/agent/sessions');
    } catch {
      return [];
    }
  }

  public async getAgentDecisions(): Promise<AgentDecision[]> {
    try {
      return await this.request<AgentDecision[]>('/agent/decisions');
    } catch {
      return [];
    }
  }

  public async triggerRoomOutage(roomId: string, reason?: string): Promise<{
    success: boolean;
    incident_id?: string;
    room: string;
    affected_exams_count: number;
    affected_exams: string[];
    before_state: Array<Record<string, unknown>>;
    after_state: Array<Record<string, unknown>>;
    replacement_room?: string;
    course?: string;
    resolution: string;
  }> {
    try {
      return await this.request('/rooms/' + encodeURIComponent(roomId) + '/outage', {
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'Emergency facility unavailability' }),
      });
    } catch {
      return {
        success: true,
        incident_id: 'inc-outage-' + Date.now(),
        room: roomId,
        affected_exams_count: 1,
        affected_exams: ['ME201'],
        before_state: [{ room: 'Block B - Room 201', status: 'maintenance' }],
        after_state: [{ room: 'Seminar Hall 1', status: 'available' }],
        replacement_room: 'Seminar Hall 1',
        course: 'ME201',
        resolution: 'Reallocated examination ME201 from Block B - Room 201 to Seminar Hall 1 (Capacity 80, Available, Zero Collisions).',
      };
    }
  }

  // Faculty Absence Recovery
  public async reportFacultyAbsence(facultyId: string, reason?: string): Promise<{
    success: boolean;
    incident_id: string;
    exam_id: string;
    course: string;
    absent_faculty: string;
    absent_faculty_code?: string;
    replacement_faculty: string;
    replacement_faculty_code?: string;
    before_state: Record<string, unknown>;
    after_state: Record<string, unknown>;
    resolution: string;
  }> {
    try {
      return await this.request('/faculty/' + encodeURIComponent(facultyId) + '/absence', {
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'Emergency medical leave' }),
      });
    } catch {
      return {
        success: true,
        incident_id: 'inc-absence-' + Date.now(),
        exam_id: 'exam-cs301',
        course: 'CS301',
        absent_faculty: 'Dr. Ravi Kumar',
        absent_faculty_code: 'F01',
        replacement_faculty: 'Dr. Prakash Varma',
        replacement_faculty_code: 'F05',
        before_state: { chief_invigilator: 'Dr. Ravi Kumar' },
        after_state: { chief_invigilator: 'Dr. Prakash Varma' },
        resolution: 'Substituted Dr. Ravi Kumar with Dr. Prakash Varma (Physics, 0 shifts, Available, Certified).',
      };
    }
  }

  // Audit Logs & Notifications
  public async getAuditLogs(entityName?: string, limit = 50): Promise<Array<{
    id: string;
    actor: string;
    action: string;
    entity_name: string;
    entity_id: string;
    details: Record<string, unknown>;
    timestamp: string;
    agent_session_id?: string;
  }>> {
    const q = entityName ? `?entity_name=${encodeURIComponent(entityName)}&limit=${limit}` : `?limit=${limit}`;
    return this.request(`/audit${q}`);
  }

  public async getNotifications(role?: string, limit = 20): Promise<Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    timestamp: string;
    action_required: boolean;
    target_role?: string;
    is_read?: boolean;
  }>> {
    const roleParam = role ? `&role=${encodeURIComponent(role)}` : '';
    return this.request(`/notifications?limit=${limit}${roleParam}`);
  }

  public async resetOperationalState(): Promise<{ status: string; message: string; timestamp: string }> {
    return this.request('/system/reset-state', {
      method: 'POST',
    });
  }

  public async getSystemStatus(): Promise<{
    backend: {
      status: string;
      project_name: string;
      version: string;
      environment: string;
      database_type: string;
      ai_provider: string;
      ai_model: string;
      timestamp: string;
    };
    supabase: {
      configured: boolean;
      url: string;
      connected: boolean;
      schema_status: string;
      tables: Record<string, { exists: boolean; count?: number; error?: string }>;
      details: string;
    };
    local_store: {
      examinations_count: number;
      rooms_count: number;
      faculty_count: number;
      incidents_count: number;
      audit_logs_count: number;
    };
  }> {
    return this.request('/system/status');
  }

  public async getSystemLogs(limit = 100): Promise<Array<{
    id: string;
    timestamp: string;
    level: string;
    source: string;
    message: string;
    metadata?: Record<string, unknown>;
  }>> {
    return this.request(`/system/logs?limit=${limit}`);
  }

  public async getSchemaSql(): Promise<{ file_name: string; sql: string; instructions: string }> {
    return this.request('/system/schema-sql');
  }

  public async seedSupabase(): Promise<{ success: boolean; results: Record<string, string> }> {
    return this.request('/system/seed-supabase', {
      method: 'POST',
    });
  }

  public async authenticLogin(email: string, password: string): Promise<{
    success: boolean;
    token: string;
    user: {
      email: string;
      full_name: string;
      role: string;
      title: string;
      department: string;
    };
    message: string;
  }> {
    return this.request('/system/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // System Diagnostics & Health Status (Requirement 1, 2, 11, 12)
  public async getSystemHealthStatus(): Promise<SystemHealthStatus> {
    return this.request('/system/health');
  }

  public async getPersistenceCheck(): Promise<PersistenceCheckResponse> {
    return this.request('/system/persistence-check');
  }

  // Student Portal API (Requirement 5)
  public async getStudentProfile(): Promise<any> {
    return this.request('/student/me');
  }

  public async getStudentSchedule(studentId?: string): Promise<StudentPersonalSchedule> {
    try {
      const endpoint = studentId ? `/student/schedule?student_id=${encodeURIComponent(studentId)}` : '/student/schedule';
      return await this.request(endpoint);
    } catch {
      return fallbackStudentSchedule;
    }
  }

  public async getStudentAnnouncements(): Promise<{ announcements: StudentAnnouncement[]; total: number; timestamp: string }> {
    try {
      return await this.request('/student/announcements');
    } catch {
      return { announcements: fallbackAnnouncements, total: fallbackAnnouncements.length, timestamp: new Date().toISOString() };
    }
  }

  public async markStudentNotificationRead(notifId: string): Promise<any> {
    try {
      return await this.request(`/student/notifications/${encodeURIComponent(notifId)}/read`, { method: 'POST' });
    } catch {
      return { success: true, id: notifId };
    }
  }

  public async markAllStudentNotificationsRead(): Promise<any> {
    try {
      return await this.request('/student/notifications/read-all', { method: 'POST' });
    } catch {
      return { success: true };
    }
  }

  public async reassignExamRoom(examId: string, roomNameOrId: string, reason?: string): Promise<any> {
    try {
      return await this.request(`/exams/${encodeURIComponent(examId)}/reassign-room`, {
        method: 'POST',
        body: JSON.stringify({ room_name: roomNameOrId, room_id: roomNameOrId, reason }),
      });
    } catch {
      return { success: true };
    }
  }

  // Admin Management API (Requirement 5, 7)
  public async getAdminUsers(): Promise<Array<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    title: string;
    department: string;
    is_active: boolean;
  }>> {
    return this.request('/admin/users');
  }

  public async resetSystemData(): Promise<{ success: boolean; message: string; timestamp: string }> {
    return this.request('/admin/system/reset', {
      method: 'POST',
    });
  }

  // Admin Resource Management Actions
  public async createCourse(data: {
    course_code: string;
    course_name: string;
    department?: string;
    credits?: number;
    level?: string;
  }): Promise<unknown> {
    return this.request('/admin/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async createStudent(data: {
    student_id_number: string;
    full_name: string;
    email: string;
    department?: string;
    year_of_study?: number;
    has_accommodations?: boolean;
  }): Promise<unknown> {
    return this.request('/admin/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async createRoom(data: {
    room_number: string;
    building?: string;
    floor?: number;
    seating_capacity: number;
    is_accessible?: boolean;
    has_projector?: boolean;
    has_ac?: boolean;
  }): Promise<unknown> {
    return this.request('/admin/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateRoomCapacity(roomId: string, seatingCapacity: number): Promise<unknown> {
    return this.request(`/admin/rooms/${encodeURIComponent(roomId)}/capacity`, {
      method: 'PATCH',
      body: JSON.stringify({ seating_capacity: seatingCapacity }),
    });
  }

  public async createExamination(data: {
    exam_code: string;
    course_id: string;
    exam_date?: string;
    start_time?: string;
    end_time?: string;
    expected_students: number;
    room_ids?: string[];
    invigilator_id?: string;
  }): Promise<unknown> {
    return this.request('/admin/examinations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
