from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RoomOut(BaseModel):
    id: str
    room_number: str
    building: str
    floor: int
    seating_capacity: int
    has_projector: bool
    has_audio: bool
    is_accessible: bool
    status: str
    notes: Optional[str] = None

class CourseOut(BaseModel):
    id: str
    course_code: str
    course_name: str
    department: str
    credits: Optional[int] = 4

class ExamRoomAllocationOut(BaseModel):
    id: str
    room_number: str
    building: str
    allocated_seats: int

class ExamInvigilatorOut(BaseModel):
    id: str
    full_name: Optional[str] = None
    faculty_name: Optional[str] = None
    name: Optional[str] = None
    code: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = "Invigilator"

class ExamOut(BaseModel):
    id: str
    exam_code: str
    course_id: str
    exam_date: str
    start_time: str
    end_time: str
    expected_students: int
    status: str
    course: Optional[CourseOut] = None
    allocated_rooms: List[ExamRoomAllocationOut] = []
    invigilators: List[ExamInvigilatorOut] = []

class ConflictItemOut(BaseModel):
    id: str
    conflict_type: str
    severity: str
    title: str
    description: str
    constraint_violated: Optional[str] = None
    recovery_category: Optional[str] = None
    impacted_entities: Dict[str, Any] = {}
    detected_at: Optional[str] = None

class ConflictReportOut(BaseModel):
    timestamp: str
    summary: Dict[str, Any]
    conflicts: List[ConflictItemOut]

class FacultyWorkloadItemOut(BaseModel):
    faculty_id: str
    code: Optional[str] = None
    full_name: str
    department: str
    email: Optional[str] = None
    status: str
    max_weekly_shifts: int
    current_shift_count: int
    remaining_quota: int
    utilization_percentage: float
    is_overloaded: bool
    is_available: bool

class FacultyWorkloadReportOut(BaseModel):
    total_faculty: int
    active_faculty: int
    overloaded_count: int
    average_shift_count: float
    faculty_workloads: List[FacultyWorkloadItemOut]

class IncidentOut(BaseModel):
    id: str
    incident_type: str
    severity: str
    status: str
    description: str
    affected_exam_id: Optional[str] = None
    affected_room_id: Optional[str] = None
    affected_faculty_id: Optional[str] = None
    created_at: str

class AgentEvent(BaseModel):
    timestamp: str
    state: str
    message: str

class AgentRunRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_role: Optional[str] = "ADMIN"

class AgentRunResponse(BaseModel):
    session_id: str
    status: str
    final_result: str
    agent_state: str
    events: List[AgentEvent]
    actions: List[str]
    validation: Dict[str, Any]
    correction_count: int = 0
    information_card: Optional[Dict[str, Any]] = None
    conflict_card: Optional[Dict[str, Any]] = None
    recommendation_card: Optional[Dict[str, Any]] = None
    action_preview: Optional[Dict[str, Any]] = None

class RoomStatusUpdateRequest(BaseModel):
    status: str
    reason: Optional[str] = None

class RoomOutageRequest(BaseModel):
    reason: Optional[str] = "Emergency facility unavailability"

class FacultyAbsenceRequest(BaseModel):
    reason: Optional[str] = "Emergency medical leave"

class CreateExaminationRequest(BaseModel):
    exam_code: str
    course_id: str
    exam_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    expected_students: int = 50
    room_ids: Optional[List[str]] = []
    invigilator_id: Optional[str] = None

class CreateCourseRequest(BaseModel):
    course_code: str
    course_name: str
    department: Optional[str] = None
    credits: Optional[int] = 4

class CreateStudentRequest(BaseModel):
    student_id_number: str
    full_name: str
    email: str
    department: Optional[str] = None
    year_of_study: Optional[int] = 1

class CreateRoomRequest(BaseModel):
    room_number: str
    building: Optional[str] = None
    floor: Optional[int] = 1
    seating_capacity: int = 50

class UpdateCapacityRequest(BaseModel):
    seating_capacity: int

class LoginRequest(BaseModel):
    email: str
    password: str
