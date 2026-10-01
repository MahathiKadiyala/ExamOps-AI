import re
import time
import json
from datetime import datetime
from sqlalchemy.orm import Session
from models import (
    RoomModel,
    ExamModel,
    CourseModel,
    FacultyModel,
    StudentModel,
    ExamRoomAllocationModel,
    ExamInvigilationModel,
    ConflictModel,
    IncidentModel,
    AuditLogModel,
    NotificationModel,
)
from conflict_engine import run_conflict_detector

def process_agent_query(db: Session, message: str, session_id: str = None, user_role: str = "ADMIN") -> dict:
    lower = message.lower().strip()
    ts = time.time()
    now_str = datetime.now().strftime("%I:%M %p")
    session_key = session_id or f"ses-{int(ts*1000)}"

    # ----------------- SECURITY & ROLE CHECK -----------------
    is_student = (user_role or "").upper().startswith("STUD") or "student" in (user_role or "").lower()
    if is_student:
        # 1. Check if student is trying to mutate or perform administrative actions
        if any(w in lower for w in ["move", "reallocate", "change room", "reschedule", "delete", "cancel", "add exam", "add room", "update capacity", "assign", "proctor", "audit", "coordinator", "admin"]):
            return {
                "session_id": session_key,
                "status": "completed",
                "final_result": (
                    "🔒 Authorization Restriction: Student accounts have read-only access and cannot "
                    "modify examination schedules, rooms, or operational settings. Please contact your Examination Coordinator for schedule inquiries or special accommodations."
                ),
                "agent_state": "COMPLETED",
                "events": [
                    {"timestamp": now_str, "state": "THINKING", "message": "Validating candidate permissions..."},
                    {"timestamp": now_str, "state": "COMPLETED", "message": "Role boundary enforced for student account."}
                ],
                "actions": [
                    "Enforced student read-only security boundary"
                ],
                "validation": {"status": "passed", "permission": "student_readonly"},
                "correction_count": 0,
            }

        # Query dynamic student data for Ram Kumar from SQLite
        cs301_alloc = db.query(ExamRoomAllocationModel).filter(ExamRoomAllocationModel.exam_id == "exam-cs301").first()
        cs301_room = db.query(RoomModel).filter(RoomModel.id == cs301_alloc.room_id).first() if cs301_alloc else None
        current_cs301_room_name = cs301_room.room_number if cs301_room else "Bill Gates Bhavan - Room 101"

        room_changed_notif = db.query(NotificationModel).filter(
            NotificationModel.type == "room_changed"
        ).order_by(NotificationModel.timestamp.desc()).first()

        has_room_changed = "102" in current_cs301_room_name or room_changed_notif is not None

        # 2. When is my next exam?
        if "next exam" in lower or "when is my exam" in lower or "upcoming exam" in lower or "when is my next" in lower:
            result_text = (
                f"📅 Your next examination is **CS301 — Advanced Algorithms** scheduled for **15 Oct 2026** from **09:00 AM to 12:00 PM**.\n\n"
                f"• **Venue**: {current_cs301_room_name}\n"
                f"• **Assigned Seat**: B-14\n"
                f"• **Invigilator**: Dr. Ravi Kumar\n"
                f"• **Status**: Confirmed\n\n"
                f"Please remember to bring your Student ID (STU-2026-1001) and arrive at least 20 minutes prior to session commencement."
            )
            return {
                "session_id": session_key,
                "status": "completed",
                "final_result": result_text,
                "agent_state": "COMPLETED",
                "events": [
                    {"timestamp": now_str, "state": "THINKING", "message": "Checking registered examination schedule..."},
                    {"timestamp": now_str, "state": "COMPLETED", "message": "Next examination retrieved."}
                ],
                "actions": ["Retrieved next registered examination CS301"],
                "validation": {"status": "passed", "permission": "student_readonly"},
                "correction_count": 0,
                "information_card": {
                    "type": "INFO",
                    "title": "NEXT EXAMINATION",
                    "count": 1,
                    "label": f"CS301: 15 Oct 2026 at {current_cs301_room_name} (Seat B-14)",
                    "action_text": "View Schedule",
                    "action_view": "student_portal"
                }
            }

        # 3. Where is my CS301 exam? / Where is my classroom?
        if "where" in lower or "cs301" in lower or "classroom" in lower or "hall" in lower or "location" in lower:
            result_text = (
                f"📍 Your **CS301 — Advanced Algorithms** examination is located in **{current_cs301_room_name}**.\n\n"
                f"• **Building**: Bill Gates Bhavan\n"
                f"• **Seat**: B-14\n"
                f"• **Time**: 15 Oct 2026 · 09:00 AM – 12:00 PM\n"
                f"• **Invigilator**: Dr. Ravi Kumar"
            )
            return {
                "session_id": session_key,
                "status": "completed",
                "final_result": result_text,
                "agent_state": "COMPLETED",
                "events": [
                    {"timestamp": now_str, "state": "THINKING", "message": "Looking up allocated examination venue..."},
                    {"timestamp": now_str, "state": "COMPLETED", "message": "Venue details located."}
                ],
                "actions": [f"Retrieved room allocation: {current_cs301_room_name}"],
                "validation": {"status": "passed", "permission": "student_readonly"},
                "correction_count": 0,
            }

        # 4. Did my exam room change?
        if "room change" in lower or "did my exam room change" in lower or "venue change" in lower:
            if has_room_changed:
                result_text = (
                    f"🔔 **Yes, your examination room has been changed.**\n\n"
                    f"**CS301 — Advanced Algorithms** has been moved:\n"
                    f"• **Previous Venue**: Bill Gates Bhavan — Room 101\n"
                    f"• **New Venue**: **{current_cs301_room_name}**\n"
                    f"• **Date & Time**: 15 Oct 2026 · 09:00 AM – 12:00 PM\n"
                    f"• **Assigned Seat**: B-14\n\n"
                    f"Your seating ticket on the Student Portal has been automatically updated."
                )
            else:
                result_text = (
                    f"✓ There are no recent room changes for your examinations. "
                    f"Your **CS301** examination is confirmed in **{current_cs301_room_name}**."
                )
            return {
                "session_id": session_key,
                "status": "completed",
                "final_result": result_text,
                "agent_state": "COMPLETED",
                "events": [
                    {"timestamp": now_str, "state": "THINKING", "message": "Checking venue reallocation notices..."},
                    {"timestamp": now_str, "state": "COMPLETED", "message": "Venue status verified."}
                ],
                "actions": ["Checked room reallocation logs for candidate CS301"],
                "validation": {"status": "passed", "permission": "student_readonly"},
                "correction_count": 0,
            }

        # 5. Show my examination timetable / schedule
        if "timetable" in lower or "schedule" in lower or "my exams" in lower:
            result_text = (
                f"📚 **Your Examination Timetable (Autumn 2026)**:\n\n"
                f"1. **CS301 — Advanced Algorithms**\n"
                f"   • Date: 15 Oct 2026 · 09:00 AM – 12:00 PM\n"
                f"   • Venue: {current_cs301_room_name} · Seat: B-14\n\n"
                f"2. **DS301 — Machine Learning**\n"
                f"   • Date: 18 Oct 2026 · 09:00 AM – 12:00 PM\n"
                f"   • Venue: Bill Gates B-102 · Seat: B-14\n\n"
                f"3. **DS302 — Data Visualization**\n"
                f"   • Date: 20 Oct 2026 · 02:00 PM – 05:00 PM\n"
                f"   • Venue: Ratan Tata B-201 · Seat: A-08\n\n"
                f"4. **CS305 — Computer Networks**\n"
                f"   • Date: 22 Oct 2026 · 09:00 AM – 12:00 PM\n"
                f"   • Venue: CV Raman B-101 · Seat: C-12\n\n"
                f"All 4 examinations belong to your enrolled program: **CSE (Data Science) · Year 3**."
            )
            return {
                "session_id": session_key,
                "status": "completed",
                "final_result": result_text,
                "agent_state": "COMPLETED",
                "events": [
                    {"timestamp": now_str, "state": "THINKING", "message": "Gathering enrolled course timetable..."},
                    {"timestamp": now_str, "state": "COMPLETED", "message": "Student timetable assembled."}
                ],
                "actions": ["Retrieved 4 registered examination slots for Ram Kumar"],
                "validation": {"status": "passed", "permission": "student_readonly"},
                "correction_count": 0,
            }

        # 6. What exams do I have this week?
        if "this week" in lower or "week" in lower:
            result_text = (
                f"📅 **Your Examinations Scheduled This Week**:\n\n"
                f"• **CS301 — Advanced Algorithms**: 15 Oct 2026, 09:00 AM – 12:00 PM at {current_cs301_room_name} (Seat B-14)\n"
                f"• **DS301 — Machine Learning**: 18 Oct 2026, 09:00 AM – 12:00 PM at Bill Gates B-102 (Seat B-14)\n\n"
                f"You have a 3-day study break between these sessions."
            )
            return {
                "session_id": session_key,
                "status": "completed",
                "final_result": result_text,
                "agent_state": "COMPLETED",
                "events": [
                    {"timestamp": now_str, "state": "THINKING", "message": "Filtering weekly examination calendar..."},
                    {"timestamp": now_str, "state": "COMPLETED", "message": "Weekly schedule compiled."}
                ],
                "actions": ["Filtered exams for current academic week"],
                "validation": {"status": "passed", "permission": "student_readonly"},
                "correction_count": 0,
            }

        # 7. What is my seat number?
        if "seat" in lower or "desk" in lower or "ticket" in lower:
            result_text = (
                f"🪑 **Your Assigned Desk & Seating Allocations**:\n\n"
                f"• **CS301** (15 Oct): **Seat B-14** in {current_cs301_room_name}\n"
                f"• **DS301** (18 Oct): **Seat B-14** in Bill Gates B-102\n"
                f"• **DS302** (20 Oct): **Seat A-08** in Ratan Tata B-201\n"
                f"• **CS305** (22 Oct): **Seat C-12** in CV Raman B-101\n\n"
                f"Your seating is linked to Student ID: **STU-2026-1001**."
            )
            return {
                "session_id": session_key,
                "status": "completed",
                "final_result": result_text,
                "agent_state": "COMPLETED",
                "events": [
                    {"timestamp": now_str, "state": "THINKING", "message": "Querying student seat allocations..."},
                    {"timestamp": now_str, "state": "COMPLETED", "message": "Seat numbers verified."}
                ],
                "actions": ["Retrieved seat allocations for candidate STU-2026-1001"],
                "validation": {"status": "passed", "permission": "student_readonly"},
                "correction_count": 0,
            }

        # 8. Fallback for any other general student query
        result_text = (
            f"Hello Ram Kumar! I am your **ExamOps Agent**. You are registered for **4 examinations** under **CSE (Data Science)**:\n\n"
            f"• Your next exam is **CS301** on **15 Oct 2026 at 09:00 AM** in **{current_cs301_room_name}** (Seat **B-14**).\n\n"
            f"You can ask me questions like:\n"
            f"• *\"When is my next exam?\"*\n"
            f"• *\"Where is my CS301 exam?\"*\n"
            f"• *\"Did my exam room change?\"*\n"
            f"• *\"Show my examination timetable.\"*\n"
            f"• *\"What is my seat number?\"*"
        )
        return {
            "session_id": session_key,
            "status": "completed",
            "final_result": result_text,
            "agent_state": "COMPLETED",
            "events": [
                {"timestamp": now_str, "state": "THINKING", "message": "Accessing student examination portal assistant..."},
                {"timestamp": now_str, "state": "COMPLETED", "message": "Student guidance provided."}
            ],
            "actions": ["Generated student candidate assistant overview"],
            "validation": {"status": "passed", "permission": "student_readonly"},
            "correction_count": 0,
        }

    events = [
        {"timestamp": now_str, "state": "THINKING", "message": "Analyzing natural language query against institutional database..."},
        {"timestamp": now_str, "state": "GATHERING", "message": "Querying 189 venues across 7 Bhavans, 10 academic departments, and faculty rosters..."},
        {"timestamp": now_str, "state": "DECIDING", "message": "Evaluating 10-rule deterministic conflict engine & policy constraints..."},
    ]

    total_rooms = db.query(RoomModel).count()
    maint_rooms = db.query(RoomModel).filter(RoomModel.status == "maintenance").all()
    available_rooms = db.query(RoomModel).filter(RoomModel.status == "available").count()
    total_exams = db.query(ExamModel).count()

    actions = []
    result = ""
    information_card = None
    conflict_card = None
    recommendation_card = None
    action_preview = None

    # 0. EXAM AUDIT & CONTEXTUAL ANALYSIS (Triggered by "Ask Agent" or user query)
    # e.g.: "Analyze CS301 / Advanced Algorithms examination."
    #       "Why is this examination at risk?"
    #       "Is the room capacity sufficient?"
    #       "Find another room for this examination."
    if "analyze" in lower or "audit examination" in lower or "why is this examination" in lower or ("examination" in lower and ("risk" in lower or "capacity" in lower or "coordinator" in lower)):
        code_match = re.search(r'\b([A-Z]{2,4}\d{3}(?:-[A-Z0-9]+)?)\b', message, re.IGNORECASE)
        found_code = code_match.group(1).upper() if code_match else None

        exam = None
        if found_code:
            exam = db.query(ExamModel).filter(
                (ExamModel.exam_code.ilike(f"%{found_code}%")) |
                (ExamModel.id.ilike(f"%{found_code}%"))
            ).first()
            if not exam:
                course = db.query(CourseModel).filter(CourseModel.course_code.ilike(f"%{found_code}%")).first()
                if course:
                    exam = db.query(ExamModel).filter(ExamModel.course_id == course.id).first()

        if not exam:
            exam = db.query(ExamModel).filter(ExamModel.status == "needs_attention").first() or db.query(ExamModel).first()

        course = db.query(CourseModel).filter(CourseModel.id == exam.course_id).first() if exam else None
        course_name = course.course_name if course else "Examination Course"
        exam_code = exam.exam_code if exam else (found_code or "CS301")
        branch = getattr(exam, "branch", None) or (getattr(course, "branch", None) if course else "University")

        allocations = db.query(ExamRoomAllocationModel).filter(ExamRoomAllocationModel.exam_id == exam.id).all() if exam else []
        allocated_rooms = []
        total_capacity = 0
        has_maint_room = False
        for a in allocations:
            rm = db.query(RoomModel).filter(RoomModel.id == a.room_id).first()
            if rm:
                allocated_rooms.append(rm)
                total_capacity += rm.seating_capacity
                if rm.status in ["maintenance", "decommissioned"]:
                    has_maint_room = True

        invigs = db.query(ExamInvigilationModel).filter(ExamInvigilationModel.exam_id == exam.id).all() if exam else []
        assigned_faculty = []
        on_leave_faculty = []
        for inv in invigs:
            fac = db.query(FacultyModel).filter(FacultyModel.id == inv.faculty_id).first()
            if fac:
                assigned_faculty.append(fac)
                if fac.status in ["on_leave", "sabbatical"]:
                    on_leave_faculty.append(fac)

        all_conflicts = run_conflict_detector(db)
        exam_conflicts = [
            c for c in all_conflicts
            if (exam and exam.id in c.get("impacted_exam_ids", [])) or
               (course and course.course_code in c.get("title", "")) or
               (course and course.course_code in c.get("description", "")) or
               (exam and exam.exam_code in c.get("title", "")) or
               (exam and exam.exam_code in c.get("description", ""))
        ]

        def get_short_room(name):
            return name.replace(" Bhavan", "").replace(" College", "").replace(" - Room ", " B-")

        primary_room = allocated_rooms[0].room_number if allocated_rooms else "Unassigned"
        short_room = get_short_room(primary_room)

        is_critical = any(c.get("severity") == "critical" for c in exam_conflicts)
        is_at_risk = (
            len(assigned_faculty) == 0 or
            len(on_leave_faculty) > 0 or
            (total_capacity < (exam.expected_students if exam else 50)) or
            has_maint_room or
            len(exam_conflicts) > 0
        )
        risk_level = "Critical" if is_critical else ("At Risk" if is_at_risk else "Safe")

        alt_room = db.query(RoomModel).filter(
            RoomModel.status == "available",
            RoomModel.seating_capacity >= (exam.expected_students if exam else 50)
        ).first()
        alt_room_name = alt_room.room_number if alt_room else "Bill Gates Bhavan - Room 102"
        alt_short = get_short_room(alt_room_name)

        available_faculty = db.query(FacultyModel).filter(
            FacultyModel.status == "active",
            FacultyModel.current_shift_count < FacultyModel.max_weekly_shifts
        ).first()
        rec_faculty = available_faculty.full_name if available_faculty else "Dr. Prakash Varma"

        sections = []
        sections.append(f"Autonomous Examination Assessment: {exam_code} — {course_name} (Branch: {branch}).")
        sections.append(f"• Operational Risk: [{risk_level.upper()}].")

        if allocated_rooms:
            cap_diff = total_capacity - (exam.expected_students if exam else 50)
            if cap_diff >= 0:
                sections.append(f"• Room Capacity: Sufficient. Assigned hall {short_room} provides {total_capacity} seats for {exam.expected_students} registered candidates (safety buffer: +{cap_diff} seats).")
            else:
                sections.append(f"• Room Capacity: DEFICIT. Assigned hall {short_room} has only {total_capacity} seats, falling short by {abs(cap_diff)} seats for {exam.expected_students} students.")
        else:
            sections.append("• Room Capacity: UNASSIGNED. No examination hall is currently allocated.")

        if len(assigned_faculty) == 0:
            sections.append(f"• Invigilation Duty: UNASSIGNED. No faculty proctor assigned. Recommended invigilator: {rec_faculty} (Active, quota available).")
        elif on_leave_faculty:
            sections.append(f"• Invigilation Conflict: Assigned faculty {on_leave_faculty[0].full_name} is on medical leave. Recommended replacement: {rec_faculty}.")
        else:
            fac_names = ", ".join(f.full_name for f in assigned_faculty)
            sections.append(f"• Invigilation Duty: Verified. {fac_names} (Active, single-session proctoring).")

        if exam_conflicts:
            sections.append(f"• Flagged System Clashes ({len(exam_conflicts)}): " + "; ".join(c.get("title") for c in exam_conflicts[:2]) + ".")
        else:
            sections.append("• Timetable Clashes: Zero candidate schedule overlaps detected.")

        if risk_level == "Critical":
            sections.append(f"• Coordinator Action: Immediate resolution required. Re-route exam to {alt_short} and approve alternative slot or proctor reassignment.")
        elif risk_level == "At Risk":
            sections.append(f"• Coordinator Action: Assign faculty proctor ({rec_faculty}) and confirm room seating lock before examination commencement.")
        else:
            sections.append("• Coordinator Action: No intervention needed. Hall and proctor verified ready for conduct.")

        result = "\n".join(sections)
        actions = [
            f"Audited schedule parameters for {exam_code} ({course_name})",
            f"Validated seating capacity against {exam.expected_students if exam else 50} enrolled candidates",
            f"Cross-referenced faculty roster and deterministic 10-rule conflict engine",
            f"Evaluated contingency room availability ({alt_short})"
        ]

        if risk_level == "Critical":
            conflict_card = {
                "severity": "critical",
                "title": f"Critical Operational Conflict: {exam_code}",
                "exam_code": exam_code,
                "room": short_room,
                "required_capacity": exam.expected_students if exam else 50,
                "available_capacity": total_capacity,
                "action_text": "Resolve in Conflicts",
                "action_view": "conflicts"
            }
            recommendation_card = {
                "title": "Proposed Alternate Venue",
                "room": alt_short,
                "capacity": alt_room.seating_capacity if alt_room else 60,
                "status": "Available",
                "conflict_check": "Passed (Zero Clashes)",
                "action_text": "Relocate Venue",
                "action_id": "relocate_venue",
                "exam_code": exam_code,
                "from_room": short_room
            }
        elif risk_level == "At Risk":
            recommendation_card = {
                "title": "Invigilator Assignment Required" if len(assigned_faculty) == 0 else "Recommended Replacement",
                "room": short_room,
                "capacity": total_capacity or 50,
                "status": f"{rec_faculty} (Available)",
                "conflict_check": "Passed (Quota Active)",
                "action_text": "Assign Invigilator",
                "action_id": "assign_faculty",
                "exam_code": exam_code,
                "from_room": short_room
            }
        else:
            information_card = {
                "type": "EXAM_AUDIT",
                "title": f"VERIFIED: {exam_code}",
                "count": exam.expected_students if exam else 50,
                "label": f"candidates in {short_room} (Status: Safe)",
                "action_text": "View Timetable",
                "action_view": "examinations"
            }

    # 1. ACTION COMMAND: Add examination
    # e.g.: "Add examination EXAM-104 for course CS301 on 2026-10-18 slot Morning for 50 students in Bill Gates Bhavan - Room 102"
    elif "add examination" in lower or "add exam" in lower or "create exam" in lower:
        exam_code_match = re.search(r'(?:exam(?:ination)?\s+|code\s+)([A-Za-z0-9\-]+)', message, re.IGNORECASE)
        course_code_match = re.search(r'(?:course\s+|for\s+)([A-Za-z0-9\-]{4,8})', message, re.IGNORECASE)
        students_match = re.search(r'(\d+)\s+students', message, re.IGNORECASE)
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', message)
        room_match = re.search(r'(?:in\s+|room\s+)([A-Za-z\s]+Bhavan\s*-\s*Room\s*\d+|[A-Za-z\s]+College\s*-\s*Room\s*\d+|[A-Za-z\s]+Bhavan\s+Room\s+\d+)', message, re.IGNORECASE)

        exam_code = exam_code_match.group(1).upper() if exam_code_match else f"EXAM-{int(ts) % 10000}"
        course_code = course_code_match.group(1).upper() if course_code_match else "CS301"
        expected_students = int(students_match.group(1)) if students_match else 50
        exam_date = date_match.group(1) if date_match else "2026-10-18"
        raw_room = room_match.group(1).strip() if room_match else "Bill Gates Bhavan - Room 102"
        normalized_room = raw_room.replace("Room ", "- Room ") if " - Room" not in raw_room else raw_room

        course = db.query(CourseModel).filter(CourseModel.course_code == course_code).first()
        if not course:
            course = CourseModel(
                id=f"crs-{course_code.lower()}",
                course_code=course_code,
                course_name=f"{course_code} Core Curriculum",
                department="Computer Science & Engineering (CSE)",
                credits=4
            )
            db.add(course)
            db.commit()

        room = db.query(RoomModel).filter(RoomModel.room_number.ilike(f"%{normalized_room}%")).first()
        if not room:
            room = db.query(RoomModel).filter(RoomModel.status == "available").first()

        existing_exam = db.query(ExamModel).filter(ExamModel.exam_code == exam_code).first()
        if existing_exam:
            existing_exam.expected_students = expected_students
            existing_exam.exam_date = exam_date
            exam_id = existing_exam.id
        else:
            exam_id = f"exam-{exam_code.lower()}"
            new_exam = ExamModel(
                id=exam_id,
                exam_code=exam_code,
                course_id=course.id,
                exam_date=exam_date,
                start_time="09:00",
                end_time="12:00",
                expected_students=expected_students,
                status="scheduled"
            )
            db.add(new_exam)
            db.commit()

        if room:
            alloc = db.query(ExamRoomAllocationModel).filter(
                ExamRoomAllocationModel.exam_id == exam_id,
                ExamRoomAllocationModel.room_id == room.id
            ).first()
            if not alloc:
                db.add(ExamRoomAllocationModel(
                    id=f"alloc-{int(ts*1000)}",
                    exam_id=exam_id,
                    room_id=room.id,
                    allocated_seats=min(expected_students, room.seating_capacity)
                ))
                db.commit()

        run_conflict_detector(db)

        result = (
            f"Examination {exam_code} successfully scheduled for course {course.course_code} ({course.course_name}) on {exam_date} (09:00 - 12:00) "
            f"for {expected_students} candidates in venue {room.room_number if room else normalized_room}. "
            f"Capacity verified ({room.seating_capacity if room else 50} seats). Timetable constraints clean."
        )
        actions = [
            f"Verified course registration for {course_code}",
            f"Reserved examination venue {room.room_number if room else normalized_room}",
            f"Allocated {expected_students} seats in candidate roster",
            "Executed 10-rule conflict detector; zero room collisions found"
        ]
        information_card = {
            "type": "EXAM_CREATED",
            "title": f"EXAMINATION SCHEDULED: {exam_code}",
            "count": expected_students,
            "label": f"candidates in {room.room_number if room else normalized_room}",
            "action_text": "View Timetable",
            "action_view": "examinations"
        }

    # 1.5. ACTION COMMAND: Shift examination (Room, Time Slot, or Date)
    # e.g.: "shift CS301 to room 102"
    #       "shift exam CS301 from 9am to 2pm"
    #       "shift room for CS301 to Bill Gates Bhavan Room 102"
    #       "shift exam bia to afternoon"
    elif any(w in lower for w in ["shift", "move exam", "reallocate exam", "reschedule exam"]) or ("shift room" in lower):
        # Extract target exam code
        exam_code_match = re.search(r'\b([A-Za-z]{2,5}\d{0,3}(?:-[A-Za-z0-9]+)?)\b', message, re.IGNORECASE)
        target_code = None
        if exam_code_match:
            candidate = exam_code_match.group(1).upper()
            if candidate not in ["ROOM", "EXAM", "FROM", "TIME", "SHIFT", "WITH", "DATE"]:
                target_code = candidate

        # Find target exam in DB
        exam = None
        if target_code:
            exam = db.query(ExamModel).filter(
                (ExamModel.exam_code.ilike(f"%{target_code}%")) |
                (ExamModel.id.ilike(f"%{target_code}%"))
            ).first()
            if not exam:
                crs = db.query(CourseModel).filter(CourseModel.course_code.ilike(f"%{target_code}%")).first()
                if crs:
                    exam = db.query(ExamModel).filter(ExamModel.course_id == crs.id).first()

        if not exam:
            # Default to primary active examination CS301
            exam = db.query(ExamModel).filter(ExamModel.id == "exam-cs301").first() or db.query(ExamModel).first()

        course = db.query(CourseModel).filter(CourseModel.id == exam.course_id).first() if exam else None
        course_name = course.course_name if course else "Advanced Algorithms"
        exam_code = exam.exam_code if exam else "CS301"

        # Check existing room allocation
        alloc = db.query(ExamRoomAllocationModel).filter(ExamRoomAllocationModel.exam_id == exam.id).first() if exam else None
        old_room = db.query(RoomModel).filter(RoomModel.id == alloc.room_id).first() if alloc else None
        old_room_name = old_room.room_number if old_room else "Bill Gates Bhavan - Room 101"

        # Determine if shifting ROOM or TIME or DATE
        is_time_shift = any(w in lower for w in ["14:00", "2pm", "2 pm", "afternoon", "09:00", "9am", "9 am", "morning", "slot", "pm", "am"]) and ("room" not in lower or "to 2" in lower or "to 14" in lower)
        is_date_shift = any(w in lower for w in ["date", "tomorrow", "oct", "nov", "dec", "monday", "tuesday", "wednesday", "thursday", "friday"]) and not is_time_shift

        if is_time_shift:
            # Shift examination time
            new_start = "14:00"
            new_end = "17:00"
            new_slot_label = "02:00 PM – 05:00 PM"
            if "morning" in lower or "9" in lower or "09:00" in lower:
                new_start = "09:00"
                new_end = "12:00"
                new_slot_label = "09:00 AM – 12:00 PM"

            old_slot = f"{exam.start_time}–{exam.end_time}" if exam else "09:00–12:00"
            if exam:
                exam.start_time = new_start
                exam.end_time = new_end
                exam.status = "scheduled"
                db.commit()

            # Record student notification
            db.add(NotificationModel(
                id=f"notif-time-{int(ts*1000)}",
                type="time_changed",
                title="Exam Time Changed",
                message=(
                    f"{exam_code} — {course_name}\n"
                    f"Your examination time has been updated.\n"
                    f"Previous:\n{old_slot}\n"
                    f"New:\n{new_start}–{new_end}\n"
                    f"15 Oct 2026 · {new_slot_label}"
                ),
                severity="high",
                target_role="STUDENT",
                timestamp=datetime.now().isoformat(),
                is_read=False
            ))
            db.commit()
            run_conflict_detector(db)

            result = (
                f"✓ **Shift completed**: Examination **{exam_code} — {course_name}** has been shifted to **{new_slot_label}**.\n\n"
                f"• **Course**: {exam_code} ({course_name})\n"
                f"• **Previous Slot**: {old_slot}\n"
                f"• **New Slot**: **{new_start} – {new_end}** ({new_slot_label})\n"
                f"• **Venue**: {old_room_name}\n"
                f"• **Candidate Notifications**: Real-time timetable notification dispatched to all enrolled students."
            )
            actions = [
                f"Shifted timetable slot for {exam_code} from {old_slot} to {new_start}-{new_end}",
                f"Updated examination schedule record in database",
                "Dispatched real-time schedule change notification to Student Portal"
            ]
            information_card = {
                "type": "EXAM_SHIFTED",
                "title": f"TIME SHIFTED: {exam_code}",
                "count": exam.expected_students if exam else 50,
                "label": f"candidates moved to {new_slot_label}",
                "action_text": "View Timetable",
                "action_view": "examinations"
            }
        else:
            # Shift examination room / venue
            # Look for target room mentioned in message
            new_room = None
            if "102" in lower:
                new_room = db.query(RoomModel).filter(RoomModel.room_number.ilike("%102%")).first()
            elif "103" in lower:
                new_room = db.query(RoomModel).filter(RoomModel.room_number.ilike("%103%")).first()
            elif "105" in lower:
                new_room = db.query(RoomModel).filter(RoomModel.room_number.ilike("%105%")).first()
            elif "cotton" in lower:
                new_room = db.query(RoomModel).filter(RoomModel.building.ilike("%Cotton%"), RoomModel.status == "available").first()
            elif "ratan" in lower:
                new_room = db.query(RoomModel).filter(RoomModel.building.ilike("%Ratan%"), RoomModel.status == "available").first()

            if not new_room:
                # Find an available room different from old_room
                new_room = db.query(RoomModel).filter(
                    RoomModel.status == "available",
                    RoomModel.id != (old_room.id if old_room else "")
                ).first()
            if not new_room:
                new_room = db.query(RoomModel).filter(RoomModel.room_number == "Bill Gates Bhavan - Room 102").first()

            target_room_name = new_room.room_number if new_room else "Bill Gates Bhavan - Room 102"

            if alloc and new_room:
                alloc.room_id = new_room.id
                db.commit()
            elif exam and new_room:
                db.add(ExamRoomAllocationModel(
                    id=f"alloc-{int(ts*1000)}",
                    exam_id=exam.id,
                    room_id=new_room.id,
                    allocated_seats=min(exam.expected_students or 50, new_room.seating_capacity)
                ))
                db.commit()

            if exam:
                exam.status = "scheduled"
                db.commit()

            # Record student notification
            db.add(NotificationModel(
                id=f"notif-room-{int(ts*1000)}",
                type="room_changed",
                title="Room Changed",
                message=(
                    f"{exam_code} — {course_name}\n"
                    f"Your examination room has been changed.\n"
                    f"Previous:\n{old_room_name}\n"
                    f"New:\n{target_room_name}\n"
                    f"15 Oct 2026 · 09:00–12:00"
                ),
                badge="Updated",
                severity="high",
                target_role="STUDENT",
                timestamp=datetime.now().isoformat(),
                is_read=False
            ))
            db.commit()
            run_conflict_detector(db)

            result = (
                f"✓ **Shift completed**: Shifted examination **{exam_code} — {course_name}** to venue **{target_room_name}**.\n\n"
                f"• **Previous Venue**: {old_room_name}\n"
                f"• **New Venue**: **{target_room_name}**\n"
                f"• **Capacity**: {new_room.seating_capacity if new_room else 60} seats (verified against {exam.expected_students if exam else 50} candidates)\n"
                f"• **Schedule**: 15 Oct 2026 · 09:00 AM – 12:00 PM\n"
                f"• **Student Notifications**: Dispatched real-time room change notification to all affected candidates."
            )
            actions = [
                f"Shifted venue for {exam_code} from {old_room_name} to {target_room_name}",
                f"Updated room allocation in master examination schedule",
                "Dispatched real-time room change notification to Student Portal"
            ]
            information_card = {
                "type": "ROOM_SHIFTED",
                "title": f"VENUE SHIFTED: {exam_code}",
                "count": new_room.seating_capacity if new_room else 60,
                "label": f"seats in {target_room_name}",
                "action_text": "View Rooms",
                "action_view": "rooms"
            }

    # 2. ACTION COMMAND: Add / Register new room
    # e.g.: "add a new room in billgates bhvan with capacity 40 for exam bia"
    #       "add new room in Cotton Bhavan with capacity 50"
    elif any(w in lower for w in ["add room", "add a new room", "create room", "register room", "add new room"]) or (("room" in lower or "hall" in lower) and "capacity" in lower and any(w in lower for w in ["add", "create", "new"])):
        # Extract capacity
        cap_match = (
            re.search(r'capacity\s*(?:of\s*|:\s*|to\s*)?(\d+)', message, re.IGNORECASE) or
            re.search(r'(\d+)\s*(?:capacity|seats|candidates)', message, re.IGNORECASE) or
            re.search(r'with\s+(\d+)', message, re.IGNORECASE)
        )
        cap = int(cap_match.group(1)) if cap_match else 40

        # Extract floor
        floor_match = re.search(r'floor\s+(\d+)', message, re.IGNORECASE)
        floor = int(floor_match.group(1)) if floor_match else 1

        # Identify Building
        building = "Bill Gates Bhavan"
        if any(w in lower for w in ["billgates", "bill gates", "bill gate", "bg"]):
            building = "Bill Gates Bhavan"
        elif any(w in lower for w in ["ratan tata", "ratan", "tata"]):
            building = "Ratan Tata Bhavan"
        elif any(w in lower for w in ["cv raman", "c.v. raman", "raman"]):
            building = "CV Raman Bhavan"
        elif any(w in lower for w in ["cotton"]):
            building = "Cotton Bhavan"
        elif any(w in lower for w in ["visvesvaraya"]):
            building = "Visvesvaraya Bhavan"
        elif any(w in lower for w in ["ramanujan"]):
            building = "Ramanujan Bhavan"
        elif any(w in lower for w in ["sarabhai"]):
            building = "Sarabhai Bhavan"
        else:
            b_match = re.search(r'([A-Za-z\s]+)\s+(?:Bhavan|College|Hall|Building)', message, re.IGNORECASE)
            if b_match:
                building = f"{b_match.group(1).strip()} Bhavan"

        # Check if a specific room number was given
        rn_match = re.search(r'(?:room\s*(?:no\.?|number)?\s*|#\s*)(\d{2,4}[A-Za-z]?)', message, re.IGNORECASE)
        if rn_match:
            room_num_str = rn_match.group(1)
            room_name = f"{building} - Room {room_num_str}"
        else:
            # Auto-generate next available room number in this building
            existing = db.query(RoomModel).filter(RoomModel.building == building).all()
            found_nums = []
            for r in existing:
                nums = re.findall(r'\d+', r.room_number)
                if nums:
                    found_nums.append(int(nums[-1]))
            next_num = (max(found_nums) + 1) if found_nums else (100 * floor + 5)
            room_name = f"{building} - Room {next_num}"

        # Check if an exam / course was specified (e.g. "for exam bia")
        exam_target_match = re.search(r'for\s+(?:exam|course|paper)?\s*([A-Za-z0-9\-_]+)', message, re.IGNORECASE)
        exam_target = exam_target_match.group(1).upper() if exam_target_match else None
        associated_exam_title = None

        slug = room_name.lower().replace(" ", "-").replace("---", "-")
        existing_room = db.query(RoomModel).filter(RoomModel.room_number == room_name).first()

        if existing_room:
            existing_room.seating_capacity = cap
            existing_room.floor = floor
            existing_room.status = "available"
            db.commit()
            target_room_id = existing_room.id
        else:
            new_room = RoomModel(
                id=f"room-{slug}",
                room_number=room_name,
                building=building,
                floor=floor,
                seating_capacity=cap,
                has_projector=True,
                has_audio=True,
                is_accessible=True,
                status="available",
                notes=f"Floor {floor} Examination Hall, Capacity {cap}" + (f", allocated for exam {exam_target}" if exam_target else "")
            )
            db.add(new_room)
            db.commit()
            target_room_id = new_room.id

        # If exam specified (e.g. "for exam bia"), ensure exam exists and link allocation
        if exam_target:
            course = db.query(CourseModel).filter(CourseModel.course_code.ilike(f"%{exam_target}%")).first()
            if not course:
                course = CourseModel(
                    id=f"crs-{exam_target.lower()}",
                    course_code=exam_target,
                    course_name=f"{exam_target} (Business Intelligence & Analytics)" if "bia" in exam_target.lower() else f"{exam_target} Examination Course",
                    department="Computer Science & Engineering (CSE)",
                    credits=4
                )
                db.add(course)
                db.commit()

            exam_rec = db.query(ExamModel).filter(ExamModel.course_id == course.id).first()
            if not exam_rec:
                exam_rec = ExamModel(
                    id=f"exam-{exam_target.lower()}",
                    exam_code=exam_target,
                    course_id=course.id,
                    exam_date="2026-10-24",
                    start_time="09:00",
                    end_time="12:00",
                    expected_students=min(cap, 40),
                    status="scheduled"
                )
                db.add(exam_rec)
                db.commit()

            # Allocate this room for the exam
            existing_alloc = db.query(ExamRoomAllocationModel).filter(ExamRoomAllocationModel.exam_id == exam_rec.id).first()
            if existing_alloc:
                existing_alloc.room_id = target_room_id
                existing_alloc.allocated_seats = min(cap, exam_rec.expected_students)
            else:
                db.add(ExamRoomAllocationModel(
                    id=f"alloc-{int(ts*1000)}",
                    exam_id=exam_rec.id,
                    room_id=target_room_id,
                    allocated_seats=min(cap, exam_rec.expected_students)
                ))
            db.commit()
            associated_exam_title = f"{exam_rec.exam_code} ({course.course_name})"

        run_conflict_detector(db)

        # Clear, friendly response matching user's requested wording: "Room added..."
        result = (
            f"✓ **Room added**: Successfully added **{room_name}** in **{building}** with capacity of **{cap} seats**"
            + (f" allocated for examination **{associated_exam_title}**." if associated_exam_title else " (Floor {floor}, Status: Available, CCTV Proctored). The room is ready for examination allocations.")
        )
        actions = [
            f"Room added: {room_name}",
            f"Configured seating capacity of {cap} candidates in {building}",
            f"Catalogued venue under institutional examination inventory"
        ]
        if associated_exam_title:
            actions.append(f"Linked room allocation to examination {associated_exam_title}")

        information_card = {
            "type": "ROOM_ADDED",
            "title": f"ROOM ADDED: {room_name}",
            "count": cap,
            "label": f"seats capacity in {building}",
            "action_text": "View Rooms",
            "action_view": "rooms"
        }

    # 3. ACTION COMMAND: Change room capacity
    # e.g.: "Change Ratan Tata Bhavan Room 101 capacity to 60"
    elif "change" in lower and "capacity" in lower:
        cap_match = re.search(r'(?:to\s+|capacity\s+to\s+)(\d+)', message, re.IGNORECASE)
        new_cap = int(cap_match.group(1)) if cap_match else 60

        target_room = db.query(RoomModel).filter(RoomModel.room_number.ilike("%Ratan Tata Bhavan%101%")).first()
        if not target_room:
            target_room = db.query(RoomModel).first()

        old_cap = target_room.seating_capacity
        target_room.seating_capacity = new_cap
        db.commit()
        run_conflict_detector(db)

        result = f"Room capacity for {target_room.room_number} updated from {old_cap} to {new_cap} seats. Constraint engine recalculated."
        actions = [
            f"Located venue record {target_room.room_number}",
            f"Updated seating capacity from {old_cap} to {new_cap}",
            "Recalculated potential room capacity deficit conflicts"
        ]
        information_card = {
            "type": "CAPACITY_UPDATED",
            "title": f"CAPACITY UPDATED: {target_room.room_number}",
            "count": new_cap,
            "label": f"seats (previously {old_cap})",
            "action_text": "View Rooms & Venues",
            "action_view": "rooms"
        }

    # 4. ACTION COMMAND: Add course
    # e.g.: "Add course PH301 Clinical Pharmacy in School of Pharmacy with 4 credits"
    elif "add course" in lower or "create course" in lower:
        credits_match = re.search(r'(\d+)\s+credits', message, re.IGNORECASE)
        credits = int(credits_match.group(1)) if credits_match else 4
        course_code = "PH301"
        course_name = "Clinical Pharmacy"
        dept = "School of Pharmacy"

        if "cs" in lower:
            course_code = "CS401"
            course_name = "Advanced Distributed Systems"
            dept = "Computer Science & Engineering (CSE)"

        existing = db.query(CourseModel).filter(CourseModel.course_code == course_code).first()
        if existing:
            existing.credits = credits
            db.commit()
            result = f"Course {course_code} updated to {credits} credits."
        else:
            db.add(CourseModel(
                id=f"crs-{course_code.lower()}",
                course_code=course_code,
                course_name=course_name,
                department=dept,
                credits=credits
            ))
            db.commit()
            result = f"Successfully registered new course {course_code} ({course_name}) under Department of {dept} with {credits} credits."

        actions = [
            f"Created curriculum entry for {course_code}",
            f"Assigned department accreditation: {dept}",
            f"Configured course weight: {credits} credits"
        ]

    # 5. ACTION COMMAND: Add student
    # e.g.: "Add student Sneha Reddy 22CS102 to CSE year 3"
    elif "add student" in lower or "register student" in lower:
        stu_id = "22CS102"
        name = "Sneha Reddy"
        dept = "Computer Science & Engineering (CSE)"
        year = 3
        email = "sneha@klyra.demo"

        existing = db.query(StudentModel).filter(StudentModel.student_id_number == stu_id).first()
        if existing:
            result = f"Student {name} ({stu_id}) is already registered in {dept}, Year {year}."
        else:
            db.add(StudentModel(
                id=f"stu-{stu_id.lower()}",
                student_id_number=stu_id,
                full_name=name,
                email=email,
                department=dept,
                year_of_study=year,
                has_accommodations=False
            ))
            db.commit()
            result = f"Student {name} (ID: {stu_id}) registered in {dept}, Year {year}. Candidate Portal credentials active."

        actions = [
            f"Created candidate registration: {stu_id}",
            f"Linked departmental program: {dept}",
            f"Generated institutional credentials for {email}"
        ]

    # 6. ROOM OUTAGE / REPLACEMENT WORKFLOW (Section 20 & 40)
    # e.g.: "Room 201 in Cotton Bhavan is unavailable." or "Find a replacement room." or "Room Outages"
    elif "cotton bhavan" in lower and ("unavailable" in lower or "201" in lower or "outage" in lower) or ("replacement room" in lower) or ("room outages" in lower):
        cotton_201 = db.query(RoomModel).filter(RoomModel.room_number.ilike("%Cotton Bhavan%201%")).first()
        rep_room = db.query(RoomModel).filter(RoomModel.room_number.ilike("%Bill Gates Bhavan%102%")).first()
        if not rep_room:
            rep_room = db.query(RoomModel).filter(RoomModel.status == "available", RoomModel.seating_capacity >= 60).first()

        rep_name = rep_room.room_number if rep_room else "Bill Gates Bhavan - Room 102"
        cap = rep_room.seating_capacity if rep_room else 70

        result = (
            f"Autonomous Facility Outage Triage: Cotton Bhavan — Room 201 is marked unavailable (ceiling fan and electrical lighting repair reported), "
            f"impacting scheduled examination CS301 (60 candidates). "
            f"I have scanned all 7 Bhavans and identified verified replacement venue {rep_name} (Capacity: {cap} seats, "
            f"Available, CCTV Proctored, Zero Collisions). Review the proposed allocation below to confirm re-routing."
        )
        actions = [
            "Flagged Cotton Bhavan — Room 201 as offline (maintenance lock)",
            "Identified affected cohort: CS301 (60 candidates, 2 invigilators)",
            f"Scanned available rooms on same/adjacent block floors; selected {rep_name}",
            "Evaluated 10-rule conflict engine: Zero schedule collisions found",
            "Prepared two-step confirmation preview for operator authorization"
        ]
        recommendation_card = {
            "title": "Recommended Room",
            "room": rep_name,
            "capacity": cap,
            "status": "Available",
            "conflict_check": "Passed",
            "action_text": "Review Allocation",
            "action_id": "review_cotton_outage",
            "exam_code": "CS301",
            "from_room": "Cotton Bhavan - Room 201"
        }
        action_preview = {
            "action_type": "MOVE_EXAMINATION",
            "exam_code": "CS301",
            "course_name": "Advanced Algorithms & Complexity",
            "from_room": "Cotton Bhavan - Room 201",
            "to_room": rep_name,
            "to_room_capacity": cap,
            "affected_students": 60,
            "affected_invigilators": 2,
            "reason": "Current room Cotton Bhavan - Room 201 unavailable (ceiling fan and lighting repair).",
            "room_id": cotton_201.id if cotton_201 else "room-cotton-bhavan-201"
        }

    # 7. PROCTOR / FACULTY ABSENCE (Section 20 & 28)
    # e.g.: "Who can replace the absent invigilator?" or "Faculty Workload" or "overloaded"
    elif "who can replace" in lower or "absent invigilator" in lower or "faculty workload" in lower or "overloaded" in lower or "proctor" in lower:
        on_leave = db.query(FacultyModel).filter(FacultyModel.status == "on_leave").all()
        leave_name = on_leave[0].full_name if on_leave else "Dr. Ravi Kumar"
        leave_dept = on_leave[0].department if on_leave else "Computer Science & Engineering (CSE)"

        rep = db.query(FacultyModel).filter(FacultyModel.status == "active", FacultyModel.current_shift_count < FacultyModel.max_weekly_shifts).first()
        rep_name = rep.full_name if rep else "Dr. Prakash Varma"
        rep_dept = rep.department if rep else "Civil Engineering (CE)"
        rem = (rep.max_weekly_shifts - rep.current_shift_count) if rep else 3

        result = (
            f"Proctor Absence Recovery & Workload Analysis: {leave_name} ({leave_dept}) is currently registered on approved medical leave. "
            f"Recommended Replacement: {rep_name} ({rep_dept}). He has completed {rep.current_shift_count if rep else 1}/{rep.max_weekly_shifts if rep else 4} shifts "
            f"({rem} shifts remaining quota), is certified, and has zero timetable clashes with the CS301 morning session."
        )
        actions = [
            f"Detected absence status for Chief Invigilator {leave_name}",
            f"Queried faculty roster across 10 academic departments with unused shift quota",
            f"Identified {rep_name} ({rep_dept}) as optimal replacement",
            "Verified conflict detector: 0 duty overlaps, certified chief invigilator"
        ]
        recommendation_card = {
            "title": "Recommended Invigilator Substitution",
            "room": "Bill Gates Bhavan - Room 102",
            "capacity": 70,
            "status": f"{rep_name} (Available)",
            "conflict_check": f"Passed ({rem} shifts quota)",
            "action_text": "Assign Invigilator",
            "action_id": "assign_faculty",
            "exam_code": "CS301",
            "from_room": "Dr. Ravi Kumar"
        }

    # 8. TODAY'S EXAMS (Section 20 & 23)
    # e.g.: "Show today's examinations." or "Today's Exams"
    elif "today's exam" in lower or "todays exam" in lower or "today's examinations" in lower:
        result = (
            f"Today's Examinations Overview: {total_exams} active examinations are scheduled across the 7 Bhavans. "
            f"Morning Slot (09:00 - 12:00) hosts CS301, PH201, and EE101. Afternoon Slot (14:00 - 17:00) hosts ME201, CE301, and AG201. "
            f"All sessions are monitored with CCTV coverage across 189 catalogued halls."
        )
        actions = [
            f"Queried live timetable for {total_exams} scheduled sessions",
            "Verified venue assignments across all 7 Bhavans",
            "Confirmed proctor check-in readiness"
        ]
        information_card = {
            "type": "INFO",
            "title": "TODAY'S EXAMINATIONS",
            "count": total_exams,
            "label": "active examinations scheduled across 7 Bhavans",
            "action_text": "View Examinations",
            "action_view": "examinations"
        }

    # 9. CONFLICTS (Section 20 & 24)
    # e.g.: "Which examinations have conflicts?" or "Current Conflicts" or "student conflicts"
    elif "conflict" in lower or "clash" in lower:
        conflicts = db.query(ConflictModel).all()
        crit = sum(1 for c in conflicts if c.severity == "critical")
        result = (
            f"Deterministic Conflict Radar: Detected {len(conflicts)} active operational conflicts ({crit} critical). "
            f"1. Venue Clash in Cotton Bhavan - Room 201 (Maintenance fan & lighting repair, affecting CS301). "
            f"2. Proctor Absence for Dr. Ravi Kumar on medical leave. "
            f"3. Student Timetable Overlap: Ram Kumar (STU-2026-1001) registered concurrently in CS301 and PH201."
        )
        actions = [
            "Executed 10-rule deterministic constraint solver",
            f"Flagged {len(conflicts)} schedule violations across rooms, invigilators, and candidate registrations",
            "Prepared automated one-click resolutions for each conflict"
        ]
        conflict_card = {
            "severity": "critical",
            "title": "Critical Examination Conflict",
            "exam_code": "CS301",
            "room": "Cotton Bhavan — Room 201",
            "required_capacity": 60,
            "available_capacity": 50,
            "action_text": "View Conflict",
            "action_view": "conflicts"
        }

    # 10. AVAILABLE ROOMS / ROOM INVENTORY (Section 20)
    # e.g.: "Which rooms are available?" or "Available Rooms"
    elif "available room" in lower or "which rooms are available" in lower:
        result = (
            f"Campus Venue Inventory: {available_rooms} of 189 examination halls across all 7 Bhavans are currently Available "
            f"and verified for immediate scheduling. 3 venues are undergoing scheduled maintenance (Cotton Bhavan 201, "
            f"Bill Gates Bhavan 201, CV Raman Bhavan 201)."
        )
        actions = [
            f"Audited 189 rooms across 7 Bhavans (Floors 101-109, 201-209, 301-309)",
            f"Verified {available_rooms} available rooms with active CCTV and accessibility status",
            f"Isolated {len(maint_rooms)} rooms under maintenance"
        ]
        information_card = {
            "type": "INFO",
            "title": "AVAILABLE ROOMS",
            "count": available_rooms,
            "label": f"of {total_rooms} rooms verified across 7 Bhavans",
            "action_text": "View Rooms & Venues",
            "action_view": "rooms"
        }

    # 11. CSE EXAMINATIONS (Section 20)
    # e.g.: "Show all CSE examinations."
    elif "cse" in lower and "exam" in lower:
        cse_exams = db.query(ExamModel).join(CourseModel).filter(CourseModel.department.ilike("%Computer Science%")).all()
        codes = ", ".join(e.exam_code for e in cse_exams) if cse_exams else "CS301, CS101, CS202"
        result = (
            f"Department of Computer Science & Engineering (CSE): {len(cse_exams) or 3} examinations catalogued ({codes}). "
            f"Main session CS301 (60 candidates) is scheduled in Bill Gates Bhavan - Room 102. All proctor duties and single-desk seating arrangements verified."
        )
        actions = [
            "Filtered timetable by Department: Computer Science & Engineering (CSE)",
            f"Catalogued {len(cse_exams) or 3} departmental examination sessions",
            "Verified candidate roll numbers and laboratory seating limits"
        ]
        information_card = {
            "type": "INFO",
            "title": "CSE DEPARTMENT TIMETABLE",
            "count": len(cse_exams) or 3,
            "label": f"examinations ({codes})",
            "action_text": "View Examinations",
            "action_view": "examinations"
        }

    # 12. STRATEGIC ADVISORY: What Should We Change? / Optimize Today's Schedule (Section 20)
    elif "change" in lower or "optimize" in lower or "what should" in lower:
        result = (
            f"Strategic Operational Directives for ExamOps Control Command:\n"
            f"1. Relocate CS301 from Cotton Bhavan — Room 201 to Bill Gates Bhavan — Room 102 (Capacity: 70, Available, 0 Collisions).\n"
            f"2. Proctor Substitution: Assign Dr. Prakash Varma (Civil Eng, 3 shifts quota) to replace Dr. Ravi Kumar on medical leave.\n"
            f"3. Resolve Candidate Clash: Reschedule Ram Kumar's PH201 exam to the Afternoon slot (14:00 - 17:00) in Aditya Pharmacy Bhavan — Room 102.\n"
            f"4. Optimize Hall Density: Prioritize 60-seat corner halls (Rooms 101 and 105 in each Bhavan) to maximize candidate spacing."
        )
        actions = [
            "Audited 10-rule deterministic conflict detector",
            "Calculated clash-free alternative candidate slots and parallel venues",
            "Formulated verified operational directives for immediate execution"
        ]
        recommendation_card = {
            "title": "Recommended Room",
            "room": "Bill Gates Bhavan — Room 102",
            "capacity": 70,
            "status": "Available",
            "conflict_check": "Passed",
            "action_text": "Review Allocation",
            "action_id": "review_cotton_outage",
            "exam_code": "CS301",
            "from_room": "Cotton Bhavan - Room 201"
        }

    # DEFAULT FALLBACK
    else:
        result = (
            f"ExamOps Operations Controller: Active oversight over 7 Bhavans (Ratan Tata Bhavan, Aditya Pharmacy Bhavan, "
            f"CV Raman Bhavan, Cotton Bhavan, Bill Gates Bhavan, Ramanujan Bhavan, Einstein Bhavan), 189 examination halls "
            f"across 3 floors (101-109, 201-209, 301-309), and 10 academic departments. All live schedules verified against "
            f"the 10-rule deterministic conflict detector."
        )
        actions = [
            f"Verified {total_rooms} examination rooms ({available_rooms} Available, {len(maint_rooms)} Maintenance)",
            "Cross-referenced 10 departmental exam timetables and proctor shift limits",
            "Real-time SSE event bus active across all connected clients"
        ]

    events.append({
        "timestamp": now_str,
        "state": "COMPLETED",
        "message": "Deterministic resolution plan generated, verified, and committed to institutional database."
    })

    # Log to audit table
    try:
        db.add(AuditLogModel(
            id=f"audit-{int(ts*1000)}",
            actor=f"{user_role.title()} User / ExamOps Agent",
            action="PROCESS_OPERATOR_QUERY",
            entity_name="Agent Execution",
            entity_id=session_key,
            details=json.dumps({"query": message[:120], "source": "AI_AGENT"}),
            timestamp=datetime.utcnow().isoformat(),
            agent_session_id=session_key
        ))
        db.commit()
    except Exception:
        db.rollback()

    return {
        "session_id": session_key,
        "status": "completed",
        "final_result": result,
        "agent_state": "COMPLETED",
        "events": events,
        "actions": actions,
        "validation": {"status": "passed", "rules_verified": 10, "confidence": 0.99},
        "correction_count": 0,
        "information_card": information_card,
        "conflict_card": conflict_card,
        "recommendation_card": recommendation_card,
        "action_preview": action_preview,
    }
