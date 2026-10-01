export type UserRole =
  | 'ADMIN'
  | 'EXAM_COORDINATOR'
  | 'STUDENT'
  | 'admin'
  | 'coordinator'
  | 'faculty'
  | 'student';

export type ActiveModule =
  | 'overview'
  | 'examinations'
  | 'rooms'
  | 'faculty'
  | 'conflicts'
  | 'incidents'
  | 'agent'
  | 'student_portal'
  | 'diagnostics';

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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

export interface Exam {
  id: string;
  exam_code: string;
  course_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  expected_students: number;
  status: string;
  course?: {
    id: string;
    course_code: string;
    course_name: string;
    department: string;
  };
  allocated_rooms: Array<{
    id: string;
    room_number: string;
    building: string;
    allocated_seats: number;
  }>;
  invigilators: Array<{
    id: string;
    full_name?: string;
    faculty_name?: string;
    name?: string;
    department?: string;
    role?: string;
    code?: string;
  }>;
}

export interface Room {
  id: string;
  room_number: string;
  building: string;
  floor: number;
  seating_capacity: number;
  has_projector: boolean;
  has_audio: boolean;
  is_accessible: boolean;
  status: 'available' | 'maintenance' | 'reserved' | 'decommissioned';
  notes?: string;
}

export interface FacultyWorkloadItem {
  faculty_id: string;
  code?: string;
  full_name: string;
  department: string;
  email?: string;
  status: 'active' | 'on_leave' | 'sabbatical';
  max_weekly_shifts: number;
  current_shift_count: number;
  remaining_quota: number;
  utilization_percentage: number;
  is_overloaded: boolean;
  is_available: boolean;
}

export interface FacultyWorkloadReport {
  total_faculty: number;
  active_faculty: number;
  overloaded_count: number;
  average_shift_count: number;
  faculty_workloads: FacultyWorkloadItem[];
}

export interface ConflictItem {
  id: string;
  conflict_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  constraint_violated: string;
  recovery_category: string;
  impacted_entities: {
    exam_ids: string[];
    room_ids: string[];
    faculty_ids: string[];
    student_ids: string[];
  };
  detected_at: string;
}

export interface ConflictReport {
  timestamp: string;
  summary: {
    total_conflicts: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    by_category: Record<string, number>;
  };
  conflicts: ConflictItem[];
}

export interface Incident {
  id: string;
  incident_type: 'room_unavailability' | 'faculty_absence' | 'overcrowding' | 'technical_failure' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolving' | 'resolved';
  description: string;
  affected_exam_id?: string;
  affected_room_id?: string;
  affected_faculty_id?: string;
  created_at: string;
  resolved_at?: string;
}

export interface DashboardMetrics {
  total_examinations: number;
  scheduled_today: number;
  total_rooms: number;
  available_rooms: number;
  maintenance_rooms?: number;
  rooms_in_maintenance?: number;
  average_room_utilization_percent?: number;
  total_faculty: number;
  active_invigilators?: number;
  total_students_enrolled?: number;
  active_incidents?: number;
  active_incidents_count?: number;
  active_conflicts_summary: {
    total_conflicts: number;
    critical_count: number;
    high_count: number;
  };
}

export interface DashboardData {
  metrics: DashboardMetrics;
  today_examinations: Exam[];
  active_conflicts: ConflictItem[];
  recent_incidents: Incident[];
}

export interface AgentEvent {
  id?: string;
  session_id?: string;
  timestamp: string;
  state: string;
  message: string;
  tool_name?: string;
  data?: Record<string, unknown>;
}

export interface AgentDecision {
  decision_id: string;
  session_id?: string;
  incident_id?: string;
  intent: string;
  tools_invoked: string[];
  selected_action: string;
  validation_status: string;
  validation_proof?: Record<string, unknown>;
  reasoning_summary: string;
  executed_at: string;
}

export interface AgentInformationCard {
  type: string;
  title: string;
  count: number;
  label: string;
  action_text: string;
  action_view: string;
}

export interface AgentConflictCard {
  severity: 'critical' | 'high' | 'medium';
  title: string;
  exam_code: string;
  room: string;
  required_capacity?: number;
  available_capacity?: number;
  description?: string;
  action_text: string;
  action_view: string;
}

export interface AgentRecommendationCard {
  title: string;
  room: string;
  capacity: number;
  status: string;
  conflict_check: string;
  action_text: string;
  action_id: string;
  exam_code?: string;
  from_room?: string;
}

export interface AgentActionPreview {
  action_type: string;
  exam_code: string;
  course_name?: string;
  from_room: string;
  to_room: string;
  to_room_capacity?: number;
  affected_students?: number;
  affected_invigilators?: number;
  reason?: string;
  room_id?: string;
}

export interface AgentRunResponse {
  session_id: string;
  status: 'completed' | 'needs_attention' | 'failed';
  final_result: string;
  agent_state: 'IDLE' | 'THINKING' | 'GATHERING' | 'CALCULATING' | 'DECIDING' | 'VALIDATING' | 'CORRECTING' | 'COMPLETED' | 'ERROR';
  events: AgentEvent[];
  actions: string[];
  validation: Record<string, unknown>;
  correction_count: number;
  decision?: AgentDecision | null;
  information_card?: AgentInformationCard | null;
  conflict_card?: AgentConflictCard | null;
  recommendation_card?: AgentRecommendationCard | null;
  action_preview?: AgentActionPreview | null;
}

export interface AgentSessionSummary {
  session_id: string;
  trigger_type: string;
  status: string;
  request_snippet: string;
  incident_id?: string;
  event_count: number;
  created_at: string;
  closed_at?: string;
}

export interface OperationalContext {
  active_incidents: Incident[];
  active_conflicts_count: number;
  critical_conflicts: ConflictItem[];
  recent_decisions: AgentDecision[];
  rooms_in_maintenance: string[];
  uncovered_examinations: string[];
  assembled_at: string;
}

export interface NotificationItem {
  id: string;
  type: 'incident' | 'conflict' | 'audit_event';
  severity: string;
  title: string;
  message: string;
  timestamp: string;
  action_required: boolean;
}

export interface AuditLogItem {
  id: string;
  actor: string;
  action: string;
  entity_name: string;
  entity_id: string;
  details: Record<string, unknown>;
  timestamp: string;
  agent_session_id?: string;
}

export interface StudentExamItem {
  exam_id: string;
  course_code: string;
  course_title: string;
  department: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  seat_number?: string;
  rooms: Array<{
    room_number: string;
    building: string;
    floor: number;
    allocated_seats: number;
    status?: string;
  }>;
  primary_room?: string;
  primary_room_status?: string;
  primary_invigilator?: string;
  invigilators?: Array<{
    faculty_id: string;
    full_name: string;
    code: string;
    status: string;
    role: string;
  }>;
  status: string;
}

export interface StudentPersonalSchedule {
  student: {
    id: string;
    student_id_number: string;
    full_name: string;
    email: string;
    department: string;
    year_of_study: number;
    has_accommodations: boolean;
  };
  total_registered_exams: number;
  schedule: StudentExamItem[];
  examinations?: StudentExamItem[];
  has_conflicts?: boolean;
  conflicts?: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
  }>;
  personal_conflicts: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
  }>;
  close_schedule_warnings: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
  }>;
  room_change_alerts: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
  timestamp: string;
}

export interface PersistenceCheckResponse {
  database_connected: boolean;
  database_provider: string;
  persistence_mode: string;
  tables_checked: number;
  tables_passing: number;
  tables_failed: number;
  table_details: Record<string, boolean>;
  table_counts: Record<string, number>;
  write_test: boolean;
  read_after_write_test: boolean;
  foreign_key_integrity: boolean;
  timestamp: string;
}

export interface SystemHealthStatus {
  backend: string;
  database: string;
  persistence: string;
  ai_provider: string;
  realtime: string;
  timestamp?: string;
}

export interface StudentAnnouncement {
  id: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
}
