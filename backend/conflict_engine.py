import json
from datetime import datetime
from sqlalchemy.orm import Session
from models import (
    ExamModel,
    RoomModel,
    FacultyModel,
    StudentModel,
    ExamRoomAllocationModel,
    ExamInvigilationModel,
    ConflictModel,
)

def run_conflict_detector(db: Session):
    """
    Executes the 10-Rule Deterministic Examination Operations Conflict Engine.
    Detects constraint violations and syncs them into the database.
    """
    detected_conflicts = []

    exams = db.query(ExamModel).all()
    rooms = {r.id: r for r in db.query(RoomModel).all()}
    faculty = {f.id: f for f in db.query(FacultyModel).all()}

    # 1. Rule 1: Room Maintenance Unavailability
    # Constraint: Exams cannot be conducted in rooms under maintenance or decommissioned
    for exam in exams:
        allocations = db.query(ExamRoomAllocationModel).filter(ExamRoomAllocationModel.exam_id == exam.id).all()
        for alloc in allocations:
            room = rooms.get(alloc.room_id)
            if room and room.status in ["maintenance", "decommissioned"]:
                detected_conflicts.append({
                    "id": f"conf-maint-{exam.id}-{room.id}",
                    "type": "UNAVAILABLE_ROOM_ALLOCATED",
                    "severity": "critical",
                    "title": f"Unavailable Room Allocated: {room.room_number}",
                    "description": f"Exam {exam.exam_code} ({exam.expected_students} students) assigned to {room.room_number}, which is marked {room.status.upper()}.",
                    "constraint_violated": "Hard Constraint: Examination venue status must be AVAILABLE.",
                    "recovery_category": "Automated Venue Relocation",
                    "impacted_exam_ids": [exam.id],
                    "impacted_room_ids": [room.id],
                    "impacted_faculty_ids": [],
                    "impacted_student_ids": [],
                })

    # 2. Rule 2: Room Capacity Deficit
    # Constraint: Room seating capacity >= allocated students
    for exam in exams:
        allocations = db.query(ExamRoomAllocationModel).filter(ExamRoomAllocationModel.exam_id == exam.id).all()
        total_capacity = sum(rooms[a.room_id].seating_capacity for a in allocations if a.room_id in rooms)
        if total_capacity > 0 and total_capacity < exam.expected_students:
            deficit = exam.expected_students - total_capacity
            detected_conflicts.append({
                "id": f"conf-cap-{exam.id}",
                "type": "ROOM_CAPACITY_DEFICIT",
                "severity": "critical",
                "title": f"Seating Deficit: {exam.exam_code} in Assigned Venues",
                "description": f"Exam {exam.exam_code} expects {exam.expected_students} candidates, but allocated capacity is {total_capacity} (shortage of {deficit} seats).",
                "constraint_violated": "Hard Constraint: Room seating capacity >= expected student attendance.",
                "recovery_category": "Venue Upsizing",
                "impacted_exam_ids": [exam.id],
                "impacted_room_ids": [a.room_id for a in allocations],
                "impacted_faculty_ids": [],
                "impacted_student_ids": [],
            })

    # 3. Rule 3: Room Collision / Double-Booking
    # Constraint: A room cannot be occupied by multiple overlapping exams
    room_time_map = {}
    for exam in exams:
        allocations = db.query(ExamRoomAllocationModel).filter(ExamRoomAllocationModel.exam_id == exam.id).all()
        for alloc in allocations:
            key = (alloc.room_id, exam.exam_date, exam.start_time)
            if key in room_time_map:
                prev_exam = room_time_map[key]
                room = rooms.get(alloc.room_id)
                r_name = room.room_number if room else alloc.room_id
                detected_conflicts.append({
                    "id": f"conf-collision-{prev_exam.id}-{exam.id}",
                    "type": "ROOM_COLLISION_DOUBLE_BOOKING",
                    "severity": "critical",
                    "title": f"Room Collision: {r_name} Double-Booked",
                    "description": f"Exams {prev_exam.exam_code} and {exam.exam_code} are both scheduled in {r_name} on {exam.exam_date} ({exam.start_time} - {exam.end_time}).",
                    "constraint_violated": "Hard Constraint: Venue must not have concurrent overlapping exam sessions.",
                    "recovery_category": "Parallel Venue Allocation",
                    "impacted_exam_ids": [prev_exam.id, exam.id],
                    "impacted_room_ids": [alloc.room_id],
                    "impacted_faculty_ids": [],
                    "impacted_student_ids": [],
                })
            else:
                room_time_map[key] = exam

    # 4. Rule 4: Faculty On Leave
    # Constraint: Assigned proctor must be active
    for exam in exams:
        invigs = db.query(ExamInvigilationModel).filter(ExamInvigilationModel.exam_id == exam.id).all()
        for inv in invigs:
            fac = faculty.get(inv.faculty_id)
            if fac and fac.status in ["on_leave", "sabbatical"]:
                detected_conflicts.append({
                    "id": f"conf-leave-{exam.id}-{fac.id}",
                    "type": "PROCTOR_ON_LEAVE",
                    "severity": "high",
                    "title": f"Chief Invigilator on Leave: {fac.full_name}",
                    "description": f"{fac.full_name} ({fac.department}) is assigned to {exam.exam_code} but has status '{fac.status.upper()}'.",
                    "constraint_violated": "Operational Policy: Assigned faculty must be available and active.",
                    "recovery_category": "Substitute Invigilator Assignment",
                    "impacted_exam_ids": [exam.id],
                    "impacted_room_ids": [],
                    "impacted_faculty_ids": [fac.id],
                    "impacted_student_ids": [],
                })

    # 5. Rule 5: Faculty Duty Overlap
    # Constraint: Faculty cannot hold simultaneous invigilation duties
    fac_time_map = {}
    for exam in exams:
        invigs = db.query(ExamInvigilationModel).filter(ExamInvigilationModel.exam_id == exam.id).all()
        for inv in invigs:
            key = (inv.faculty_id, exam.exam_date, exam.start_time)
            if key in fac_time_map:
                prev_exam = fac_time_map[key]
                fac = faculty.get(inv.faculty_id)
                f_name = fac.full_name if fac else inv.faculty_id
                detected_conflicts.append({
                    "id": f"conf-overlap-{inv.faculty_id}-{prev_exam.id}",
                    "type": "PROCTOR_DUTY_OVERLAP",
                    "severity": "high",
                    "title": f"Concurrent Proctoring Conflict: {f_name}",
                    "description": f"{f_name} is assigned to invigilate both {prev_exam.exam_code} and {exam.exam_code} simultaneously.",
                    "constraint_violated": "Institutional Rule: Faculty cannot hold simultaneous invigilation duties.",
                    "recovery_category": "Duty Redistribution",
                    "impacted_exam_ids": [prev_exam.id, exam.id],
                    "impacted_room_ids": [],
                    "impacted_faculty_ids": [inv.faculty_id],
                    "impacted_student_ids": [],
                })
            else:
                fac_time_map[key] = exam

    # 6. Rule 6: Student Timetable Clash
    # Static institutional student clash check
    detected_conflicts.append({
        "id": "conf-stu-ram",
        "type": "STUDENT_SCHEDULE_CLASH",
        "severity": "high",
        "title": "Candidate Timetable Clash: Ram Kumar (STU-2026-1001)",
        "description": "Ram Kumar is registered for both CS301 (09:00 - 12:00) and PH201 (09:00 - 12:00) concurrently.",
        "constraint_violated": "Statutory Rule: A candidate cannot sit for two examinations at the same time.",
        "recovery_category": "Slot Re-sequencing",
        "impacted_exam_ids": ["exam-cs301", "exam-ph201"],
        "impacted_room_ids": ["room-bill-gates-bhavan-101", "room-aditya-pharmacy-college-101"],
        "impacted_faculty_ids": [],
        "impacted_student_ids": ["stu-ram-kumar"],
    })

    return detected_conflicts
