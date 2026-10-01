from sqlalchemy import Column, String, Integer, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class DepartmentModel(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True)
    code = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)

class BhavanModel(Base):
    __tablename__ = "bhavans"

    id = Column(String, primary_key=True)
    name = Column(String, unique=True, index=True)
    code = Column(String, nullable=False)
    total_floors = Column(Integer, default=3)

class RoomModel(Base):
    __tablename__ = "rooms"

    id = Column(String, primary_key=True, index=True)
    room_number = Column(String, index=True, nullable=False)
    building = Column(String, index=True, nullable=False)
    floor = Column(Integer, nullable=False)
    seating_capacity = Column(Integer, default=50)
    has_projector = Column(Boolean, default=True)
    has_audio = Column(Boolean, default=True)
    is_accessible = Column(Boolean, default=False)
    status = Column(String, default="available")  # available, maintenance, occupied, decommissioned
    notes = Column(Text, nullable=True)

class CourseModel(Base):
    __tablename__ = "courses"

    id = Column(String, primary_key=True, index=True)
    course_code = Column(String, unique=True, index=True, nullable=False)
    course_name = Column(String, nullable=False)
    department = Column(String, index=True, nullable=False)
    branch = Column(String, index=True, nullable=True)
    credits = Column(Integer, default=4)

class FacultyModel(Base):
    __tablename__ = "faculty"

    id = Column(String, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=False)
    department = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True)
    status = Column(String, default="active")  # active, on_leave, sabbatical
    max_weekly_shifts = Column(Integer, default=4)
    current_shift_count = Column(Integer, default=0)

class StudentModel(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, index=True)
    student_id_number = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    department = Column(String, index=True, nullable=False)
    year_of_study = Column(Integer, default=1)
    has_accommodations = Column(Boolean, default=False)

class ExamModel(Base):
    __tablename__ = "examinations"

    id = Column(String, primary_key=True, index=True)
    exam_code = Column(String, unique=True, index=True, nullable=False)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    branch = Column(String, index=True, nullable=True)
    exam_date = Column(String, nullable=False)   # YYYY-MM-DD
    start_time = Column(String, nullable=False)  # HH:MM
    end_time = Column(String, nullable=False)    # HH:MM
    expected_students = Column(Integer, default=50)
    status = Column(String, default="scheduled")  # scheduled, needs_attention, completed

    course = relationship("CourseModel")

class ExamRoomAllocationModel(Base):
    __tablename__ = "exam_room_allocations"

    id = Column(String, primary_key=True)
    exam_id = Column(String, ForeignKey("examinations.id"), nullable=False)
    room_id = Column(String, ForeignKey("rooms.id"), nullable=False)
    allocated_seats = Column(Integer, default=50)

class ExamInvigilationModel(Base):
    __tablename__ = "exam_invigilations"

    id = Column(String, primary_key=True)
    exam_id = Column(String, ForeignKey("examinations.id"), nullable=False)
    faculty_id = Column(String, ForeignKey("faculty.id"), nullable=False)
    role = Column(String, default="Invigilator")  # Chief Invigilator, Invigilator

class ConflictModel(Base):
    __tablename__ = "conflicts"

    id = Column(String, primary_key=True, index=True)
    conflict_type = Column(String, nullable=False)
    severity = Column(String, default="high")  # critical, high, medium
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    constraint_violated = Column(String, nullable=True)
    recovery_category = Column(String, nullable=True)
    impacted_exam_ids = Column(Text, default="[]")
    impacted_room_ids = Column(Text, default="[]")
    impacted_faculty_ids = Column(Text, default="[]")
    impacted_student_ids = Column(Text, default="[]")
    detected_at = Column(String, default=datetime.utcnow().isoformat)

class IncidentModel(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True)
    incident_type = Column(String, nullable=False)
    severity = Column(String, default="high")
    status = Column(String, default="open")  # open, resolving, resolved
    description = Column(Text, nullable=False)
    affected_exam_id = Column(String, nullable=True)
    affected_room_id = Column(String, nullable=True)
    affected_faculty_id = Column(String, nullable=True)
    created_at = Column(String, default=datetime.utcnow().isoformat)

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    actor = Column(String, default="Autonomous Agent Engine")
    action = Column(String, nullable=False)
    entity_name = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    details = Column(Text, default="{}")
    timestamp = Column(String, default=datetime.utcnow().isoformat)
    agent_session_id = Column(String, nullable=True)

class NotificationModel(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    type = Column(String, default="system")
    severity = Column(String, default="medium")
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(String, default=datetime.utcnow().isoformat)
    action_required = Column(Boolean, default=False)
    target_role = Column(String, default="ALL")
    is_read = Column(Boolean, default=False)
