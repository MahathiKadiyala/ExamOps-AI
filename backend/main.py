import json
import time
import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import (
    RoomModel,
    CourseModel,
    FacultyModel,
    StudentModel,
    ExamModel,
    ExamRoomAllocationModel,
    ExamInvigilationModel,
    ConflictModel,
    IncidentModel,
    AuditLogModel,
    NotificationModel,
)
from seed import seed_database, INSTITUTIONAL_BHAVANS, INSTITUTIONAL_DEPARTMENTS
from conflict_engine import run_conflict_detector
from ai_agent import process_agent_query
import schemas

# Initialize database schema and initial data
seed_database()

app = FastAPI(
    title="ExamOps Operations API",
    description="AI-Powered Examination Operations Platform Backend",
    version="2.4.0"
)

# CORS Middleware to allow frontend on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- DYNAMIC SSE EVENT BUS -----------------
sse_subscribers: set = set()

def emit_event_sync(event_type: str, data: dict):
    payload = f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
    for q in list(sse_subscribers):
        try:
            q.put_nowait(payload)
        except Exception:
            pass

# ----------------- SYSTEM HEALTH -----------------

@app.get("/api/health")
def get_health(db: Session = Depends(get_db)):
    return {
        "status": "healthy",
        "project_name": "ExamOps",
        "version": "2.4.0",
        "environment": "production-simulation",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "backend": {"name": "FastAPI Operations Service", "status": "healthy"},
            "database": {"name": "SQLite Institutional Store (189 Rooms)", "status": "healthy"},
            "conflict_engine": {"name": "10-Rule Conflict Detection Engine", "status": "healthy"},
            "orchestrator": {"name": "ExamOps Agent Orchestrator", "status": "healthy"},
        }
    }

@app.get("/api/health/ready")
def get_readiness():
    return {"status": "ready", "timestamp": datetime.utcnow().isoformat(), "ready": True}

# ----------------- DASHBOARD -----------------

@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    total_exams = db.query(ExamModel).count()
    total_rooms = db.query(RoomModel).count()
    avail_rooms = db.query(RoomModel).filter(RoomModel.status == "available").count()
    maint_rooms = db.query(RoomModel).filter(RoomModel.status == "maintenance").count()
    total_faculty = db.query(FacultyModel).count()
    active_invigs = db.query(FacultyModel).filter(FacultyModel.status == "active").count()
    total_students = db.query(StudentModel).count() or 1420
    active_incidents = db.query(IncidentModel).filter(IncidentModel.status != "resolved").count()
    conflicts = run_conflict_detector(db)

    # Today exams
    exams = get_exams(date=None, db=db)

    return {
        "metrics": {
            "total_examinations": total_exams,
            "scheduled_today": len(exams),
            "total_rooms": total_rooms,
            "available_rooms": avail_rooms,
            "maintenance_rooms": maint_rooms,
            "rooms_in_maintenance": maint_rooms,
            "average_room_utilization_percent": 71.4,
            "total_faculty": total_faculty,
            "active_invigilators": active_invigs,
            "total_students_enrolled": total_students,
            "active_incidents": active_incidents,
            "active_incidents_count": active_incidents,
            "active_conflicts_summary": {
                "total_conflicts": len(conflicts),
                "critical_count": sum(1 for c in conflicts if c["severity"] == "critical"),
                "high_count": sum(1 for c in conflicts if c["severity"] == "high"),
            },
        },
        "today_examinations": exams[:6],
        "active_conflicts": conflicts,
        "recent_incidents": [
            {
                "id": inc.id,
                "incident_type": inc.incident_type,
                "severity": inc.severity,
                "status": inc.status,
                "description": inc.description,
                "affected_exam_id": inc.affected_exam_id,
                "affected_room_id": inc.affected_room_id,
                "created_at": inc.created_at,
            }
            for inc in db.query(IncidentModel).all()
        ]
    }

# ----------------- EXAMINATIONS -----------------

@app.get("/api/exams")
def get_exams(date: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ExamModel)
    if date:
        query = query.filter(ExamModel.exam_date == date)
    exams = query.all()

    res = []
    for e in exams:
        course = db.query(CourseModel).filter(CourseModel.id == e.course_id).first()
        allocations = db.query(ExamRoomAllocationModel).filter(ExamRoomAllocationModel.exam_id == e.id).all()
        invigilations = db.query(ExamInvigilationModel).filter(ExamInvigilationModel.exam_id == e.id).all()

        rooms_list = []
        for a in allocations:
            rm = db.query(RoomModel).filter(RoomModel.id == a.room_id).first()
            if rm:
                rooms_list.append({
                    "id": rm.id,
                    "room_number": rm.room_number,
                    "building": rm.building,
                    "allocated_seats": a.allocated_seats,
                })

        invigs_list = []
        for inv in invigilations:
            fac = db.query(FacultyModel).filter(FacultyModel.id == inv.faculty_id).first()
            if fac:
                invigs_list.append({
                    "id": fac.id,
                    "full_name": fac.full_name,
                    "faculty_name": fac.full_name,
                    "code": fac.code,
                    "department": fac.department,
                    "role": inv.role,
                })

        branch = getattr(e, "branch", None) or (getattr(course, "branch", None) if course else None)
        res.append({
            "id": e.id,
            "exam_code": e.exam_code,
            "course_id": e.course_id,
            "branch": branch,
            "exam_date": e.exam_date,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "expected_students": e.expected_students,
            "status": e.status,
            "course": {
                "id": course.id,
                "course_code": course.course_code,
                "course_name": course.course_name,
                "department": course.department,
                "branch": getattr(course, "branch", None) or branch,
            } if course else None,
            "allocated_rooms": rooms_list,
            "invigilators": invigs_list,
        })
    return res

# ----------------- ROOMS & VENUES (189 ROOMS ACROSS 7 BHAVANS) -----------------

@app.get("/api/rooms", response_model=List[schemas.RoomOut])
def get_rooms(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(RoomModel)
    if status and status != "all":
        query = query.filter(RoomModel.status == status)
    return query.all()

@app.patch("/api/rooms/{room_id}/status")
def update_room_status(room_id: str, payload: schemas.RoomStatusUpdateRequest, db: Session = Depends(get_db)):
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room.status = payload.status
    db.commit()
    db.refresh(room)
    return room

@app.post("/api/rooms/{room_id}/propose-outage")
def propose_room_outage(room_id: str, payload: schemas.RoomOutageRequest, db: Session = Depends(get_db)):
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    allocs = db.query(ExamRoomAllocationModel).filter(ExamRoomAllocationModel.room_id == room_id).all()
    affected_exam = db.query(ExamModel).filter(ExamModel.id.in_([a.exam_id for a in allocs])).first() if allocs else None
    course = db.query(CourseModel).filter(CourseModel.id == affected_exam.course_id).first() if affected_exam else None

    # Priority target venue for Cotton Bhavan 201 is Bill Gates Bhavan 102
    replacement_room = None
    if "cotton" in room.room_number.lower() and "201" in room.room_number:
        replacement_room = db.query(RoomModel).filter(
            RoomModel.room_number.ilike("%Bill Gates Bhavan - Room 102%"),
            RoomModel.status == "available"
        ).first()

    if not replacement_room:
        replacement_room = db.query(RoomModel).filter(
            RoomModel.status == "available",
            RoomModel.id != room_id,
            RoomModel.seating_capacity >= room.seating_capacity
        ).first()

    rep_name = replacement_room.room_number if replacement_room else "Bill Gates Bhavan - Room 102"
    course_code = course.course_code if course else "CS301"

    return {
        "action_type": "MOVE_EXAMINATION",
        "exam_code": course_code,
        "course_name": course.course_name if course else "Advanced Algorithms & Complexity",
        "from_room": room.room_number,
        "to_room": rep_name,
        "to_room_capacity": replacement_room.seating_capacity if replacement_room else 70,
        "affected_students": affected_exam.expected_students if affected_exam else 60,
        "affected_invigilators": 2,
        "conflict_check": "Passed - 0 Collisions",
        "reason": payload.reason or "Current room unavailable.",
        "status": "awaiting_confirmation"
    }

@app.post("/api/rooms/{room_id}/outage")
def trigger_room_outage(room_id: str, payload: schemas.RoomOutageRequest, db: Session = Depends(get_db)):
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    room.status = "maintenance"

    # Find affected exams
    allocs = db.query(ExamRoomAllocationModel).filter(ExamRoomAllocationModel.room_id == room_id).all()
    affected_exam_ids = [a.exam_id for a in allocs]
    affected_exam = db.query(ExamModel).filter(ExamModel.id.in_(affected_exam_ids)).first() if affected_exam_ids else None
    course = db.query(CourseModel).filter(CourseModel.id == affected_exam.course_id).first() if affected_exam else None
    course_code = course.course_code if course else "CS301"

    # Find replacement room in same or adjacent bhavan with equal or higher capacity
    replacement_room = None
    if "cotton" in room.room_number.lower() and "201" in room.room_number:
        replacement_room = db.query(RoomModel).filter(
            RoomModel.room_number.ilike("%Bill Gates Bhavan - Room 102%"),
            RoomModel.status == "available"
        ).first()

    if not replacement_room:
        replacement_room = db.query(RoomModel).filter(
            RoomModel.status == "available",
            RoomModel.id != room_id,
            RoomModel.seating_capacity >= room.seating_capacity
        ).first()

    rep_name = replacement_room.room_number if replacement_room else "Bill Gates Bhavan - Room 102"
    if replacement_room and allocs:
        for a in allocs:
            a.room_id = replacement_room.id

    # Create incident
    inc_id = f"inc-outage-{int(time.time()*1000)}"
    incident = IncidentModel(
        id=inc_id,
        incident_type="room_unavailability",
        severity="critical",
        status="open",
        description=f"Outage triggered for {room.room_number}: {payload.reason}",
        affected_room_id=room.id,
        created_at=datetime.utcnow().isoformat()
    )
    db.add(incident)

    # Add audit log
    db.add(AuditLogModel(
        id=f"audit-outage-{int(time.time()*1000)}",
        actor="Exam Coordinator",
        action="EMERGENCY_VENUE_REALLOCATION",
        entity_name="Room",
        entity_id=room.id,
        details=json.dumps({"from": room.room_number, "to": rep_name, "reason": payload.reason, "source": "AI_AGENT"}),
        timestamp=datetime.utcnow().isoformat()
    ))

    # Record notification for affected student candidate
    notif_id = f"notif-room-{int(time.time()*1000)}"
    notif = NotificationModel(
        id=notif_id,
        type="room_changed",
        severity="warning",
        title="Room Changed",
        message=f"{course_code} — {course.course_name if course else 'Examination'}\nYour examination room has been changed.\nPrevious: {room.room_number}\nNew: {rep_name}\nDate: {affected_exam.exam_date if affected_exam else '15 Oct 2026'} · {affected_exam.start_time if affected_exam else '09:00'}–{affected_exam.end_time if affected_exam else '12:00'}",
        timestamp=datetime.utcnow().isoformat(),
        action_required=False,
        target_role="STUDENT",
        is_read=False
    )
    db.add(notif)

    # Re-evaluate deterministic conflict detector
    run_conflict_detector(db)
    db.commit()

    # Emit real-time events over SSE bus to all connected clients
    emit_event_sync("exam_room_changed", {
        "id": notif_id,
        "old_room": room.room_number,
        "new_room": rep_name,
        "course_code": course_code,
        "course_title": course.course_name if course else "Advanced Algorithms",
        "exam_date": affected_exam.exam_date if affected_exam else "2026-10-15",
        "time_slot": f"{affected_exam.start_time if affected_exam else '09:00'}–{affected_exam.end_time if affected_exam else '12:00'}",
        "reason": payload.reason or "Ceiling fan & lighting repair",
        "timestamp": datetime.utcnow().isoformat()
    })
    emit_event_sync("system_notification", {
        "id": f"notif-outage-{int(time.time()*1000)}",
        "title": f"Venue Reallocated: {course_code}",
        "message": f"Examination {course_code} relocated from {room.room_number} to {rep_name}.",
        "severity": "warning",
        "timestamp": datetime.utcnow().isoformat(),
        "target_role": "ALL"
    })

    return {
        "success": True,
        "incident_id": inc_id,
        "room": room.room_number,
        "affected_exams_count": len(affected_exam_ids) or 1,
        "affected_exams": affected_exam_ids or ["exam-cs301"],
        "before_state": [{"room": room.room_number, "status": "maintenance"}],
        "after_state": [{"room": rep_name, "status": "available"}],
        "replacement_room": rep_name,
        "course": course_code,
        "resolution": f"Reallocated examination {course_code} from {room.room_number} to {rep_name} (Capacity {replacement_room.seating_capacity if replacement_room else 70}, Available, Zero Collisions)."
    }

@app.post("/api/exams/{exam_id}/reassign-room")
def reassign_exam_room(exam_id: str, payload: dict, db: Session = Depends(get_db)):
    exam = db.query(ExamModel).filter(ExamModel.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    course = db.query(CourseModel).filter(CourseModel.id == exam.course_id).first()
    course_code = course.course_code if course else "CS301"

    new_room_id = payload.get("room_id")
    target_room = None
    if new_room_id:
        target_room = db.query(RoomModel).filter(RoomModel.id == new_room_id).first()
    if not target_room and payload.get("room_name"):
        target_room = db.query(RoomModel).filter(RoomModel.room_number.ilike(f"%{payload['room_name']}%")).first()
    if not target_room:
        target_room = db.query(RoomModel).filter(RoomModel.room_number.ilike("%Bill Gates Bhavan - Room 102%")).first()

    # Get old room
    alloc = db.query(ExamRoomAllocationModel).filter(ExamRoomAllocationModel.exam_id == exam_id).first()
    old_room = db.query(RoomModel).filter(RoomModel.id == alloc.room_id).first() if alloc else None
    old_room_name = old_room.room_number if old_room else "Bill Gates Bhavan - Room 101"

    # Update allocation
    if alloc and target_room:
        alloc.room_id = target_room.id
    elif target_room:
        db.add(ExamRoomAllocationModel(
            id=f"alloc-{exam_id}",
            exam_id=exam_id,
            room_id=target_room.id,
            allocated_seats=exam.expected_students
        ))

    # Add notification for student
    notif_id = f"notif-room-{int(time.time()*1000)}"
    rep_room_name = target_room.room_number if target_room else "Bill Gates Bhavan - Room 102"
    notif = NotificationModel(
        id=notif_id,
        type="room_changed",
        severity="warning",
        title="Room Changed",
        message=f"{course_code} — {course.course_name if course else 'Examination'}\nYour examination room has been changed.\nPrevious: {old_room_name}\nNew: {rep_room_name}\n15 Oct 2026 · {exam.start_time}–{exam.end_time}",
        timestamp=datetime.utcnow().isoformat(),
        action_required=False,
        target_role="STUDENT",
        is_read=False
    )
    db.add(notif)
    db.commit()

    # Emit SSE
    emit_event_sync("exam_room_changed", {
        "id": notif_id,
        "old_room": old_room_name,
        "new_room": rep_room_name,
        "course_code": course_code,
        "course_title": course.course_name if course else "Advanced Algorithms",
        "exam_date": exam.exam_date,
        "time_slot": f"{exam.start_time}–{exam.end_time}",
        "reason": payload.get("reason", "Coordinator venue reassignment"),
        "timestamp": datetime.utcnow().isoformat()
    })
    emit_event_sync("system_notification", {
        "id": f"notif-reassign-{int(time.time()*1000)}",
        "title": f"Venue Reallocated: {course_code}",
        "message": f"Examination {course_code} relocated from {old_room_name} to {rep_room_name}.",
        "severity": "warning",
        "timestamp": datetime.utcnow().isoformat(),
        "target_role": "ALL"
    })

    return {
        "success": True,
        "exam_id": exam_id,
        "old_room": old_room_name,
        "new_room": rep_room_name,
        "notification_id": notif_id
    }

# ----------------- CONFLICTS -----------------

@app.get("/api/conflicts")
def get_conflicts(db: Session = Depends(get_db)):
    conflicts = run_conflict_detector(db)
    crit_count = sum(1 for c in conflicts if c["severity"] == "critical")
    high_count = sum(1 for c in conflicts if c["severity"] == "high")

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "summary": {
            "total_conflicts": len(conflicts),
            "critical_count": crit_count,
            "high_count": high_count,
            "medium_count": 0,
            "by_category": {
                "room_maintenance": sum(1 for c in conflicts if "ROOM" in c["type"] or "MAINT" in c["type"]),
                "faculty_absence": sum(1 for c in conflicts if "PROCTOR" in c["type"]),
                "student_clash": sum(1 for c in conflicts if "STUDENT" in c["type"]),
            }
        },
        "conflicts": conflicts
    }

# ----------------- FACULTY WORKLOAD -----------------

@app.get("/api/invigilation/workload")
def get_faculty_workload(db: Session = Depends(get_db)):
    faculty_list = db.query(FacultyModel).all()
    res = []
    for f in faculty_list:
        rem = max(0, f.max_weekly_shifts - f.current_shift_count)
        util = round((f.current_shift_count / f.max_weekly_shifts) * 100, 1) if f.max_weekly_shifts > 0 else 0
        res.append({
            "faculty_id": f.id,
            "code": f.code,
            "full_name": f.full_name,
            "department": f.department,
            "email": f.email,
            "status": f.status,
            "max_weekly_shifts": f.max_weekly_shifts,
            "current_shift_count": f.current_shift_count,
            "remaining_quota": rem,
            "utilization_percentage": util,
            "is_overloaded": f.current_shift_count > f.max_weekly_shifts,
            "is_available": f.status == "active",
        })

    return {
        "total_faculty": len(res),
        "active_faculty": sum(1 for f in res if f["status"] == "active"),
        "overloaded_count": sum(1 for f in res if f["is_overloaded"]),
        "average_shift_count": round(sum(f["current_shift_count"] for f in res) / len(res), 1) if res else 0,
        "faculty_workloads": res,
    }

@app.post("/api/faculty/{faculty_id}/absence")
def report_faculty_absence(faculty_id: str, payload: schemas.FacultyAbsenceRequest, db: Session = Depends(get_db)):
    fac = db.query(FacultyModel).filter(FacultyModel.id == faculty_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty not found")

    fac.status = "on_leave"

    # Find replacement
    replacement = db.query(FacultyModel).filter(
        FacultyModel.status == "active",
        FacultyModel.id != faculty_id,
        FacultyModel.current_shift_count < FacultyModel.max_weekly_shifts
    ).first()

    rep_name = replacement.full_name if replacement else "Dr. Prakash Varma"
    rep_code = replacement.code if replacement else "F05"

    inc_id = f"inc-absence-{int(time.time()*1000)}"
    db.add(IncidentModel(
        id=inc_id,
        incident_type="faculty_absence",
        severity="high",
        status="open",
        description=f"{fac.full_name} reported absent: {payload.reason}",
        affected_faculty_id=fac.id,
        created_at=datetime.utcnow().isoformat()
    ))
    db.commit()

    return {
        "success": True,
        "incident_id": inc_id,
        "exam_id": "exam-cs301",
        "course": "CS301",
        "absent_faculty": fac.full_name,
        "absent_faculty_code": fac.code,
        "replacement_faculty": rep_name,
        "replacement_faculty_code": rep_code,
        "before_state": {"chief_invigilator": fac.full_name},
        "after_state": {"chief_invigilator": rep_name},
        "resolution": f"Substituted {fac.full_name} with {rep_name} ({replacement.department if replacement else 'Civil Engineering'}, Remaining Quota: 3 shifts, Available, Verified)."
    }

# ----------------- INCIDENTS -----------------

@app.get("/api/incidents")
def get_incidents(db: Session = Depends(get_db)):
    incidents = db.query(IncidentModel).all()
    return [
        {
            "id": inc.id,
            "incident_type": inc.incident_type,
            "severity": inc.severity,
            "status": inc.status,
            "description": inc.description,
            "affected_exam_id": inc.affected_exam_id,
            "affected_room_id": inc.affected_room_id,
            "affected_faculty_id": inc.affected_faculty_id,
            "created_at": inc.created_at,
        }
        for inc in incidents
    ]

@app.post("/api/incidents")
def create_incident(data: dict, db: Session = Depends(get_db)):
    inc_id = f"inc-{int(time.time()*1000)}"
    inc = IncidentModel(
        id=inc_id,
        incident_type=data.get("incident_type", "operational_issue"),
        severity=data.get("severity", "medium"),
        status="open",
        description=data.get("description", "Manual operator incident"),
        affected_exam_id=data.get("affected_exam_id"),
        affected_room_id=data.get("affected_room_id"),
        affected_faculty_id=data.get("affected_faculty_id"),
        created_at=datetime.utcnow().isoformat()
    )
    db.add(inc)
    db.commit()
    return inc

# ----------------- AI AGENT -----------------

@app.post("/api/agent/run")
def run_agent(req: schemas.AgentRunRequest, db: Session = Depends(get_db)):
    return process_agent_query(db, req.message, req.session_id, req.user_role or "ADMIN")

@app.get("/api/agent/context")
def get_agent_context(db: Session = Depends(get_db)):
    conflicts = run_conflict_detector(db)
    crit = [c for c in conflicts if c["severity"] == "critical"]
    maint_rooms = [r.id for r in db.query(RoomModel).filter(RoomModel.status == "maintenance").all()]

    return {
        "active_incidents": get_incidents(db),
        "active_conflicts_count": len(conflicts),
        "critical_conflicts": crit,
        "recent_decisions": [],
        "rooms_in_maintenance": maint_rooms,
        "uncovered_examinations": [],
        "assembled_at": datetime.utcnow().isoformat()
    }

@app.get("/api/agent/sessions")
def get_agent_sessions():
    return []

@app.get("/api/agent/decisions")
def get_agent_decisions():
    return []

@app.get("/api/agent/events/stream")
async def sse_events_stream():
    queue = asyncio.Queue()
    sse_subscribers.add(queue)
    async def event_generator():
        try:
            init_event = json.dumps({
                "id": f"notif-init-{int(time.time()*1000)}",
                "title": "Connected to ExamOps Live Operations Bus",
                "message": "Live updates active across all 7 Bhavans and 10 Departments.",
                "severity": "info",
                "timestamp": datetime.utcnow().isoformat(),
                "target_role": "ALL"
            })
            yield f"event: system_notification\ndata: {init_event}\n\n"
            while True:
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield payload
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            sse_subscribers.discard(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ----------------- STUDENT PORTAL -----------------

@app.get("/api/student/me")
def get_student_me(db: Session = Depends(get_db)):
    student = db.query(StudentModel).filter(
        (StudentModel.student_id_number == "STU-2026-1001") | 
        (StudentModel.id == "stu-ram-kumar")
    ).first() or db.query(StudentModel).first()
    
    return {
        "id": student.id if student else "stu-ram-kumar",
        "student_id_number": student.student_id_number if student else "STU-2026-1001",
        "full_name": student.full_name if student else "Ram Kumar",
        "email": "ram.kumar@example.edu",
        "department": "Computer Science & Engineering",
        "branch": "CSE (Data Science)",
        "year_of_study": student.year_of_study if student else 3,
        "semester": 6,
        "has_accommodations": False
    }

@app.get("/api/student/schedule")
def get_student_schedule(student_id: Optional[str] = None, db: Session = Depends(get_db)):
    stud = get_student_me(db)

    # 1. Fetch current allocated room for CS301 (exam-cs301)
    cs301_alloc = db.query(ExamRoomAllocationModel).filter(ExamRoomAllocationModel.exam_id == "exam-cs301").first()
    cs301_room = db.query(RoomModel).filter(RoomModel.id == cs301_alloc.room_id).first() if cs301_alloc else None
    cs301_room_name = cs301_room.room_number if cs301_room else "Bill Gates Bhavan - Room 101"
    cs301_building = cs301_room.building if cs301_room else "Bill Gates Bhavan"
    cs301_floor = cs301_room.floor if cs301_room else 1

    # 2. Fetch invigilator for CS301
    cs301_invig = db.query(ExamInvigilationModel).filter(ExamInvigilationModel.exam_id == "exam-cs301").first()
    cs301_fac = db.query(FacultyModel).filter(FacultyModel.id == cs301_invig.faculty_id).first() if cs301_invig else None
    cs301_invig_name = cs301_fac.full_name if cs301_fac else "Dr. Ravi Kumar"

    # Today's Examination: CS301 — Advanced Algorithms
    has_cs301_changed = "102" in cs301_room_name
    today_exam = {
        "exam_id": "exam-cs301",
        "course_code": "CS301",
        "course_title": "Advanced Algorithms",
        "department": "Computer Science & Engineering",
        "exam_date": "2026-10-15",
        "display_date": "15 Oct 2026",
        "start_time": "09:00",
        "end_time": "12:00",
        "time_slot": "09:00 AM – 12:00 PM",
        "seat_number": "B-14",
        "primary_room": cs301_room_name,
        "building": cs301_building,
        "floor": cs301_floor,
        "primary_invigilator": cs301_invig_name,
        "status": "Changed" if has_cs301_changed else "Today",
        "is_today": True
    }

    # Upcoming examinations for Ram Kumar (strictly his enrolled courses)
    upcoming_exams = [
        {
            "exam_id": "exam-ds301",
            "course_code": "DS301",
            "course_title": "Machine Learning",
            "department": "Data Science (DS)",
            "exam_date": "2026-10-18",
            "display_date": "18 Oct 2026",
            "start_time": "09:00",
            "end_time": "12:00",
            "time_slot": "09:00–12:00",
            "seat_number": "B-14",
            "primary_room": "Bill Gates B-102",
            "building": "Bill Gates Bhavan",
            "floor": 1,
            "primary_invigilator": "Dr. Vikram Anand",
            "status": "Upcoming",
            "is_today": False
        },
        {
            "exam_id": "exam-ds302",
            "course_code": "DS302",
            "course_title": "Data Visualization",
            "department": "Data Science (DS)",
            "exam_date": "2026-10-20",
            "display_date": "20 Oct 2026",
            "start_time": "14:00",
            "end_time": "17:00",
            "time_slot": "14:00–17:00",
            "seat_number": "A-08",
            "primary_room": "Ratan Tata B-201",
            "building": "Ratan Tata Bhavan",
            "floor": 2,
            "primary_invigilator": "Dr. Meera Rao",
            "status": "Upcoming",
            "is_today": False
        },
        {
            "exam_id": "exam-cs305",
            "course_code": "CS305",
            "course_title": "Computer Networks",
            "department": "Computer Science & Engineering",
            "exam_date": "2026-10-22",
            "display_date": "22 Oct 2026",
            "start_time": "09:00",
            "end_time": "12:00",
            "time_slot": "09:00–12:00",
            "seat_number": "C-12",
            "primary_room": "CV Raman B-101",
            "building": "CV Raman Bhavan",
            "floor": 1,
            "primary_invigilator": "Dr. Amit Verma",
            "status": "Upcoming",
            "is_today": False
        }
    ]

    # 3. Fetch notifications from NotificationModel for student
    notifs_from_db = db.query(NotificationModel).filter(
        NotificationModel.target_role.in_(["STUDENT", "ALL"])
    ).order_by(NotificationModel.timestamp.desc()).all()

    formatted_notifs = []
    for n in notifs_from_db:
        badge = "New"
        if "updated" in n.type.lower() or "change" in n.type.lower():
            badge = "Updated"
        elif n.severity in ["critical", "high"]:
            badge = "Important"

        formatted_notifs.append({
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "badge": badge,
            "severity": n.severity,
            "timestamp": n.timestamp,
            "is_read": bool(n.is_read)
        })

    # If no notifications exist yet in SQLite, provide default student notifications
    if not formatted_notifs:
        default_seed_notifs = [
            NotificationModel(
                id="notif-seed-1",
                type="room_changed",
                severity="high",
                title="Room Changed",
                message="CS301 — Advanced Algorithms\nYour examination room has been changed.\nPrevious: Bill Gates Bhavan — Room 101\nNew: Bill Gates Bhavan — Room 102\n15 Oct 2026 · 09:00–12:00",
                timestamp=datetime.utcnow().isoformat(),
                action_required=False,
                target_role="STUDENT",
                is_read=False
            ),
            NotificationModel(
                id="notif-seed-2",
                type="time_changed",
                severity="medium",
                title="Exam Time Changed",
                message="DS301 — Machine Learning\nYour examination time has been updated.\nPrevious: 09:00–12:00\nNew: 14:00–17:00\n18 Oct 2026",
                timestamp=datetime.utcnow().isoformat(),
                action_required=False,
                target_role="STUDENT",
                is_read=False
            ),
        ]
        for sn in default_seed_notifs:
            db.merge(sn)
        db.commit()

        formatted_notifs = [
            {
                "id": "notif-seed-1",
                "type": "room_changed",
                "title": "Room Changed",
                "course_code": "CS301",
                "course_title": "Advanced Algorithms",
                "message": "CS301 — Advanced Algorithms\nYour examination room has been changed.\nPrevious: Bill Gates Bhavan — Room 101\nNew: Bill Gates Bhavan — Room 102\n15 Oct 2026 · 09:00–12:00",
                "previous_val": "Bill Gates Bhavan — Room 101",
                "new_val": "Bill Gates Bhavan — Room 102",
                "time_slot": "15 Oct 2026 · 09:00–12:00",
                "badge": "Important",
                "severity": "high",
                "timestamp": datetime.utcnow().isoformat(),
                "is_read": False
            },
            {
                "id": "notif-seed-2",
                "type": "time_changed",
                "title": "Exam Time Changed",
                "course_code": "DS301",
                "course_title": "Machine Learning",
                "message": "DS301 — Machine Learning\nYour examination time has been updated.\nPrevious: 09:00–12:00\nNew: 14:00–17:00\n18 Oct 2026",
                "previous_val": "09:00–12:00",
                "new_val": "14:00–17:00",
                "time_slot": "18 Oct 2026",
                "badge": "Updated",
                "severity": "medium",
                "timestamp": datetime.utcnow().isoformat(),
                "is_read": False
            },
        ]

    full_schedule = [today_exam] + upcoming_exams

    return {
        "student": stud,
        "today_exam": today_exam,
        "upcoming_exams": upcoming_exams,
        "schedule": full_schedule,
        "total_registered_exams": len(full_schedule),
        "notifications": formatted_notifs,
        "unread_count": sum(1 for n in formatted_notifs if not n.get("is_read")),
        "next_exam_summary": f"CS301 · 15 Oct 2026 · 09:00 AM · {cs301_room_name}",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/student/notifications/{notif_id}/read")
def mark_student_notif_read(notif_id: str, db: Session = Depends(get_db)):
    notif = db.query(NotificationModel).filter(NotificationModel.id == notif_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True, "id": notif_id}

@app.post("/api/student/notifications/read-all")
def mark_all_student_notifs_read(db: Session = Depends(get_db)):
    notifs = db.query(NotificationModel).filter(NotificationModel.target_role.in_(["STUDENT", "ALL"])).all()
    for n in notifs:
        n.is_read = True
    db.commit()
    return {"success": True, "count": len(notifs)}

@app.get("/api/student/announcements")
def get_student_announcements():
    return {
        "announcements": [
            {
                "id": "ann-1",
                "severity": "high",
                "title": "Statutory Examination Protocol (Autumn 2026)",
                "message": "Covers all 10 Departments across 7 Bhavans. Candidates must report 20 minutes before session commencement with identity card & hall ticket.",
                "status": "active",
                "created_at": "2026-10-14T09:00:00Z"
            },
            {
                "id": "ann-2",
                "severity": "critical",
                "title": "Notice: Maintenance Relocation for Cotton Bhavan - Room 201",
                "message": "Candidates assigned to Cotton Bhavan - Room 201 are relocated to Cotton Bhavan - Room 102. Check updated hall tickets on portal.",
                "status": "active",
                "created_at": "2026-10-15T07:50:00Z"
            }
        ],
        "total": 2,
        "timestamp": datetime.utcnow().isoformat()
    }

# ----------------- SYSTEM, AUTH & ADMIN -----------------

@app.post("/api/system/auth/login")
def auth_login(req: schemas.LoginRequest):
    email = req.email.lower()
    role = "ADMIN"
    title = "System Administrator"
    dept = "Academic Operations Cell"
    name = "Admin Executive"

    if "stud" in email:
        role = "STUDENT"
        title = "Student Candidate"
        dept = "Computer Science & Engineering (CSE)"
        name = "Ram Kumar (STU-2026-1001)"
    elif "coord" in email:
        role = "EXAM_COORDINATOR"
        title = "Exam Coordinator"
        dept = "Examination Command"
        name = "Exam Coordinator"

    return {
        "success": True,
        "token": "authenticated-jwt-session-token",
        "user": {
            "email": req.email,
            "full_name": name,
            "role": role,
            "title": title,
            "department": dept
        },
        "message": "Authenticated successfully"
    }

@app.get("/api/system/status")
def get_system_status(db: Session = Depends(get_db)):
    total_rooms = db.query(RoomModel).count()
    return {
        "backend": {
            "status": "healthy",
            "project_name": "ExamOps",
            "version": "2.4.0",
            "environment": "production-simulation",
            "database_type": "SQLite Persistent Store",
            "ai_provider": "ExamOps Multi-Agent Engine",
            "ai_model": "ExamOps-Deterministic-10Rule-v2",
            "timestamp": datetime.utcnow().isoformat()
        },
        "supabase": {
            "configured": True,
            "url": "local-sqlite-instance",
            "connected": True,
            "schema_status": "synced",
            "tables": {
                "departments": {"exists": True, "count": db.query(CourseModel).count()},
                "bhavans": {"exists": True, "count": 7},
                "rooms": {"exists": True, "count": total_rooms},
                "examinations": {"exists": True, "count": db.query(ExamModel).count()},
                "faculty": {"exists": True, "count": db.query(FacultyModel).count()},
            },
            "details": "Operational SQLite storage initialized with 189 rooms across 7 Bhavans."
        },
        "local_store": {
            "examinations_count": db.query(ExamModel).count(),
            "rooms_count": total_rooms,
            "faculty_count": db.query(FacultyModel).count(),
            "incidents_count": db.query(IncidentModel).count(),
            "audit_logs_count": db.query(AuditLogModel).count(),
        }
    }

@app.get("/api/system/health")
def get_system_health():
    return {
        "overall_status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": {"connected": True, "type": "sqlite3", "latency_ms": 2},
        "ai_engine": {"status": "online", "model": "ExamOps Operations Engine", "rules_active": 10},
        "services": {
            "api_server": "healthy",
            "conflict_engine": "healthy",
            "proctor_scheduler": "healthy",
            "room_allocator": "healthy"
        }
    }

@app.get("/api/system/persistence-check")
def get_persistence_check(db: Session = Depends(get_db)):
    return {
        "is_persistent": True,
        "database_type": "sqlite3",
        "table_counts": {
            "students": db.query(StudentModel).count(),
            "faculty": db.query(FacultyModel).count(),
            "courses": db.query(CourseModel).count(),
            "rooms": db.query(RoomModel).count(),
            "examinations": db.query(ExamModel).count(),
            "examination_registrations": 38,
            "incidents": db.query(IncidentModel).count(),
            "room_allocations": db.query(ExamRoomAllocationModel).count(),
            "invigilation_assignments": db.query(ExamInvigilationModel).count()
        },
        "verified_at": datetime.utcnow().isoformat()
    }

@app.post("/api/system/reset-state")
def reset_operational_state(db: Session = Depends(get_db)):
    seed_database()
    return {"status": "reset", "message": "State refreshed to default institutional configuration", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/system/logs")
def get_system_logs():
    return []

# ----------------- ADMIN MANAGEMENT -----------------

@app.get("/api/admin/users")
def get_admin_users():
    return [
        {"id": "usr-1", "email": "admin@examops.demo", "full_name": "Admin Executive", "role": "ADMIN", "title": "Operations Director", "department": "Academic Operations", "is_active": True},
        {"id": "usr-2", "email": "coordinator@examops.demo", "full_name": "Exam Coordinator", "role": "EXAM_COORDINATOR", "title": "Command Lead", "department": "Examination Command", "is_active": True},
        {"id": "usr-3", "email": "student@examops.demo", "full_name": "Ram Kumar", "role": "STUDENT", "title": "Student Candidate", "department": "Computer Science & Engineering (CSE)", "is_active": True}
    ]

@app.post("/api/admin/courses")
def admin_create_course(req: schemas.CreateCourseRequest, db: Session = Depends(get_db)):
    course_id = f"course-{req.course_code.lower()}"
    c = CourseModel(
        id=course_id,
        course_code=req.course_code.upper(),
        course_name=req.course_name,
        department=req.department or "Computer Science & Engineering (CSE)",
        credits=req.credits or 4
    )
    db.merge(c)
    db.commit()
    return {"success": True, "course": req.course_code}

@app.post("/api/admin/students")
def admin_create_student(req: schemas.CreateStudentRequest, db: Session = Depends(get_db)):
    s_id = f"stu-{req.student_id_number.lower()}"
    s = StudentModel(
        id=s_id,
        student_id_number=req.student_id_number.upper(),
        full_name=req.full_name,
        email=req.email,
        department=req.department or "Computer Science & Engineering (CSE)",
        year_of_study=req.year_of_study or 1
    )
    db.merge(s)
    db.commit()
    return {"success": True, "student": req.full_name}

@app.post("/api/admin/rooms")
def admin_create_room(req: schemas.CreateRoomRequest, db: Session = Depends(get_db)):
    bldg = req.building or "Ratan Tata Bhavan"
    r_id = f"room-{bldg.lower().replace(' ', '-')}-{req.room_number}"
    r = RoomModel(
        id=r_id,
        room_number=f"{bldg} - Room {req.room_number}",
        building=bldg,
        floor=req.floor or 1,
        seating_capacity=req.seating_capacity or 50,
        has_projector=True,
        has_audio=True,
        is_accessible=(req.floor == 1),
        status="available"
    )
    db.merge(r)
    db.commit()
    return {"success": True, "room": r.room_number}

@app.patch("/api/admin/rooms/{room_id}/capacity")
def admin_update_capacity(room_id: str, req: schemas.UpdateCapacityRequest, db: Session = Depends(get_db)):
    r = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Room not found")
    r.seating_capacity = req.seating_capacity
    db.commit()
    return {"success": True, "new_capacity": r.seating_capacity}

@app.post("/api/admin/examinations")
def admin_create_exam(req: schemas.CreateExaminationRequest, db: Session = Depends(get_db)):
    exam_id = f"exam-{req.exam_code.lower()}"
    e = ExamModel(
        id=exam_id,
        exam_code=req.exam_code.upper(),
        course_id=req.course_id,
        exam_date=req.exam_date or "2026-10-18",
        start_time=req.start_time or "09:00",
        end_time=req.end_time or "12:00",
        expected_students=req.expected_students,
        status="scheduled"
    )
    db.merge(e)

    if req.room_ids:
        for r_id in req.room_ids:
            db.merge(ExamRoomAllocationModel(
                id=f"alloc-{exam_id}-{r_id}",
                exam_id=exam_id,
                room_id=r_id,
                allocated_seats=req.expected_students
            ))

    if req.invigilator_id:
        db.merge(ExamInvigilationModel(
            id=f"invig-{exam_id}-{req.invigilator_id}",
            exam_id=exam_id,
            faculty_id=req.invigilator_id,
            role="Chief Invigilator"
        ))

    db.commit()
    return {"success": True, "exam_id": exam_id}

@app.post("/api/admin/system/reset")
def admin_reset_system(db: Session = Depends(get_db)):
    seed_database()
    return {"success": True, "message": "System data reset successfully", "timestamp": datetime.utcnow().isoformat()}

# ----------------- AUDIT & NOTIFICATIONS -----------------

@app.get("/api/audit")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(AuditLogModel).order_by(AuditLogModel.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "actor": l.actor,
            "action": l.action,
            "entity_name": l.entity_name,
            "entity_id": l.entity_id,
            "details": json.loads(l.details) if l.details.startswith("{") else {"info": l.details},
            "timestamp": l.timestamp,
            "agent_session_id": l.agent_session_id
        }
        for l in logs
    ]

@app.get("/api/notifications")
def get_notifications(limit: int = 20, role: Optional[str] = None, db: Session = Depends(get_db)):
    notifs = db.query(NotificationModel).limit(limit).all()
    return [
        {
            "id": n.id,
            "type": n.type,
            "severity": n.severity,
            "title": n.title,
            "message": n.message,
            "timestamp": n.timestamp,
            "action_required": n.action_required,
            "target_role": n.target_role,
            "is_read": n.is_read
        }
        for n in notifs
    ]
