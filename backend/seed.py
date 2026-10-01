import json
import re
from datetime import datetime
from database import engine, SessionLocal, Base
from models import (
    DepartmentModel,
    BhavanModel,
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

INSTITUTIONAL_BHAVANS = [
    {"name": "Ratan Tata Bhavan", "code": "RTB"},
    {"name": "Aditya Pharmacy College", "code": "APC"},
    {"name": "CV Raman Bhavan", "code": "CVR"},
    {"name": "Cotton Bhavan", "code": "CTB"},
    {"name": "Bill Gates Bhavan", "code": "BGB"},
    {"name": "Ramanujan Bhavan", "code": "RNB"},
    {"name": "Einstein Bhavan", "code": "ESB"},
]

INSTITUTIONAL_DEPARTMENTS = [
    {"code": "CSE", "name": "Computer Science & Engineering (CSE)"},
    {"code": "PHARM", "name": "School of Pharmacy"},
    {"code": "EEE", "name": "Electrical & Electronics Engineering (EEE)"},
    {"code": "ME", "name": "Mechanical Engineering (ME)"},
    {"code": "CE", "name": "Civil Engineering (CE)"},
    {"code": "MINING", "name": "Mining Engineering"},
    {"code": "PETRO", "name": "Petroleum Technology"},
    {"code": "AGRI", "name": "Agricultural Engineering"},
    {"code": "BCA", "name": "Bachelor of Computer Applications (BCA)"},
    {"code": "MCA", "name": "Master of Computer Applications (MCA)"},
]

def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(RoomModel).count() >= 189:
            print("Database already seeded with 189 rooms.")
            return

        print("Seeding database with institutional departments, 7 Bhavans, and 189 rooms...")

        # 1. Departments
        for dept in INSTITUTIONAL_DEPARTMENTS:
            d_obj = DepartmentModel(
                id=f"dept-{dept['code'].lower()}",
                code=dept["code"],
                name=dept["name"],
            )
            db.merge(d_obj)

        # 2. Bhavans
        for bh in INSTITUTIONAL_BHAVANS:
            b_obj = BhavanModel(
                id=f"bhavan-{bh['code'].lower()}",
                name=bh["name"],
                code=bh["code"],
                total_floors=3,
            )
            db.merge(b_obj)

        # 3. 189 Rooms (7 Bhavans * 3 Floors * 9 Rooms)
        for bh in INSTITUTIONAL_BHAVANS:
            bhavan_name = bh["name"]
            slug = slugify(bhavan_name)

            for floor in range(1, 4):
                for room_idx in range(1, 10):
                    room_code = f"{floor}0{room_idx}"
                    room_id = f"room-{slug}-{room_code}"
                    room_number = f"{bhavan_name} - Room {room_code}"

                    capacity = 60 if (room_idx == 1 or room_idx == 5) else (40 if room_idx == 9 else 50)
                    is_accessible = (floor == 1)
                    has_audio = (room_idx % 2 == 1)

                    status = "available"
                    notes = f"Floor {floor} Examination Hall, CCTV proctor coverage, single-desk seating"

                    if bhavan_name == "Cotton Bhavan" and room_code == "201":
                        status = "maintenance"
                        notes = "Ceiling fan motor fault & electrical lighting repair scheduled"
                    elif bhavan_name == "Bill Gates Bhavan" and room_code == "201":
                        status = "maintenance"
                        notes = "High-speed LAN terminal & electrical switchboard overhaul"
                    elif bhavan_name == "Ratan Tata Bhavan" and room_code == "301":
                        status = "maintenance"
                        notes = "Roof waterproofing inspection in progress"

                    r_obj = RoomModel(
                        id=room_id,
                        room_number=room_number,
                        building=bhavan_name,
                        floor=floor,
                        seating_capacity=capacity,
                        has_projector=True,
                        has_audio=has_audio,
                        is_accessible=is_accessible,
                        status=status,
                        notes=notes,
                    )
                    db.merge(r_obj)

        # 4. Courses across 10 Departments
        courses_data = [
            {"id": "course-cs301", "code": "CS301", "name": "Advanced Algorithms & Complexity", "dept": "Computer Science & Engineering (CSE)", "credits": 4},
            {"id": "course-cs303", "code": "CS303", "name": "Operating Systems & Systems Programming", "dept": "Computer Science & Engineering (CSE)", "credits": 4},
            {"id": "course-ph201", "code": "PH201", "name": "Pharmaceutics & Biopharmaceutics", "dept": "School of Pharmacy", "credits": 4},
            {"id": "course-ph202", "code": "PH202", "name": "Pharmacology & Clinical Therapeutics", "dept": "School of Pharmacy", "credits": 4},
            {"id": "course-ee201", "code": "EE201", "name": "Electrical Circuits & Signal Processing", "dept": "Electrical & Electronics Engineering (EEE)", "credits": 4},
            {"id": "course-me201", "code": "ME201", "name": "Thermal Engineering & Heat Transfer", "dept": "Mechanical Engineering (ME)", "credits": 4},
            {"id": "course-ce201", "code": "CE201", "name": "Structural Analysis & Design", "dept": "Civil Engineering (CE)", "credits": 4},
            {"id": "course-mn301", "code": "MN301", "name": "Surface Mining & Rock Mechanics", "dept": "Mining Engineering", "credits": 4},
            {"id": "course-pt201", "code": "PT201", "name": "Drilling & Reservoir Engineering", "dept": "Petroleum Technology", "credits": 4},
            {"id": "course-ag201", "code": "AG201", "name": "Farm Machinery & Soil Dynamics", "dept": "Agricultural Engineering", "credits": 4},
            {"id": "course-bca201", "code": "BCA201", "name": "Relational Database Management Systems", "dept": "Bachelor of Computer Applications (BCA)", "credits": 4},
            {"id": "course-mca301", "code": "MCA301", "name": "Cloud Architecture & Distributed Computing", "dept": "Master of Computer Applications (MCA)", "credits": 4},
        ]
        for c in courses_data:
            db.merge(CourseModel(id=c["id"], course_code=c["code"], course_name=c["name"], department=c["dept"], credits=c["credits"]))

        # 5. Faculty Members
        faculty_data = [
            {"id": "fac-f01", "code": "F01", "name": "Dr. Ravi Kumar", "dept": "Computer Science & Engineering (CSE)", "email": "ravi.kumar@klyra.demo", "status": "on_leave", "shifts": 1},
            {"id": "fac-f02", "code": "F02", "name": "Dr. Lakshmi Rao", "dept": "School of Pharmacy", "email": "lakshmi.rao@klyra.demo", "status": "active", "shifts": 4},
            {"id": "fac-f03", "code": "F03", "name": "Dr. Suresh Reddy", "dept": "Electrical & Electronics Engineering (EEE)", "email": "suresh.reddy@klyra.demo", "status": "active", "shifts": 2},
            {"id": "fac-f04", "code": "F04", "name": "Dr. Emily Watson", "dept": "Mechanical Engineering (ME)", "email": "emily.watson@klyra.demo", "status": "active", "shifts": 1},
            {"id": "fac-f05", "code": "F05", "name": "Dr. Prakash Varma", "dept": "Civil Engineering (CE)", "email": "prakash.varma@klyra.demo", "status": "active", "shifts": 1},
            {"id": "fac-f06", "code": "F06", "name": "Dr. Sarah Jenkins", "dept": "Mining Engineering", "email": "sarah.jenkins@klyra.demo", "status": "active", "shifts": 1},
            {"id": "fac-f07", "code": "F07", "name": "Dr. Kiran Rao", "dept": "Petroleum Technology", "email": "kiran.rao@klyra.demo", "status": "active", "shifts": 1},
            {"id": "fac-f08", "code": "F08", "name": "Dr. Ananya Sharma", "dept": "Agricultural Engineering", "email": "ananya.sharma@klyra.demo", "status": "active", "shifts": 1},
            {"id": "fac-f09", "code": "F09", "name": "Dr. Rajiv Nair", "dept": "Bachelor of Computer Applications (BCA)", "email": "rajiv.nair@klyra.demo", "status": "active", "shifts": 1},
            {"id": "fac-f10", "code": "F10", "name": "Dr. Meera Deshmukh", "dept": "Master of Computer Applications (MCA)", "email": "meera.deshmukh@klyra.demo", "status": "active", "shifts": 1},
        ]
        for f in faculty_data:
            db.merge(FacultyModel(
                id=f["id"],
                code=f["code"],
                full_name=f["name"],
                department=f["dept"],
                email=f["email"],
                status=f["status"],
                max_weekly_shifts=4,
                current_shift_count=f["shifts"]
            ))

        # 6. Students
        students_data = [
            {"id": "stu-ram-kumar", "roll": "STU-2026-1001", "name": "Ram Kumar", "email": "student@klyra.demo", "dept": "Computer Science & Engineering (CSE)", "year": 3},
            {"id": "stu-sneha-reddy", "roll": "22CS105", "name": "Sneha Reddy", "email": "sneha@klyra.demo", "dept": "Computer Science & Engineering (CSE)", "year": 3},
            {"id": "stu-vikram-sharma", "roll": "23PH102", "name": "Vikram Sharma", "email": "vikram@klyra.demo", "dept": "School of Pharmacy", "year": 2},
            {"id": "stu-rohit-varma", "roll": "21EE204", "name": "Rohit Varma", "email": "rohit@klyra.demo", "dept": "Electrical & Electronics Engineering (EEE)", "year": 4},
        ]
        for s in students_data:
            db.merge(StudentModel(
                id=s["id"],
                student_id_number=s["roll"],
                full_name=s["name"],
                email=s["email"],
                department=s["dept"],
                year_of_study=s["year"],
                has_accommodations=False,
            ))

        # 7. Examinations
        exams_data = [
            {"id": "exam-cs301", "code": "CS301-M26", "course_id": "course-cs301", "date": "2026-10-15", "start": "09:00", "end": "12:00", "students": 55, "status": "scheduled", "room_id": "room-bill-gates-bhavan-101", "faculty_id": "fac-f01"},
            {"id": "exam-ph201", "code": "PH201-M26", "course_id": "course-ph201", "date": "2026-10-15", "start": "09:00", "end": "12:00", "students": 50, "status": "scheduled", "room_id": "room-aditya-pharmacy-college-101", "faculty_id": "fac-f02"},
            {"id": "exam-ee201", "code": "EE201-A26", "course_id": "course-ee201", "date": "2026-10-15", "start": "14:00", "end": "17:00", "students": 45, "status": "needs_attention", "room_id": "room-cv-raman-bhavan-101", "faculty_id": "fac-f03"},
            {"id": "exam-cs303", "code": "CS303-A26", "course_id": "course-cs303", "date": "2026-10-15", "start": "14:00", "end": "17:00", "students": 50, "status": "needs_attention", "room_id": "room-cv-raman-bhavan-101", "faculty_id": "fac-f03"},
            {"id": "exam-me201", "code": "ME201-M26", "course_id": "course-me201", "date": "2026-10-16", "start": "09:00", "end": "12:00", "students": 50, "status": "scheduled", "room_id": "room-ratan-tata-bhavan-101", "faculty_id": "fac-f04"},
            {"id": "exam-ce201", "code": "CE201-M26", "course_id": "course-ce201", "date": "2026-10-16", "start": "09:00", "end": "12:00", "students": 40, "status": "scheduled", "room_id": "room-cotton-bhavan-101", "faculty_id": "fac-f05"},
            {"id": "exam-mn301", "code": "MN301-A26", "course_id": "course-mn301", "date": "2026-10-16", "start": "14:00", "end": "17:00", "students": 35, "status": "scheduled", "room_id": "room-ratan-tata-bhavan-201", "faculty_id": "fac-f06"},
            {"id": "exam-pt201", "code": "PT201-A26", "course_id": "course-pt201", "date": "2026-10-16", "start": "14:00", "end": "17:00", "students": 40, "status": "scheduled", "room_id": "room-einstein-bhavan-101", "faculty_id": "fac-f07"},
            {"id": "exam-ag201", "code": "AG201-M26", "course_id": "course-ag201", "date": "2026-10-17", "start": "09:00", "end": "12:00", "students": 38, "status": "scheduled", "room_id": "room-ramanujan-bhavan-101", "faculty_id": "fac-f08"},
            {"id": "exam-bca201", "code": "BCA201-M26", "course_id": "course-bca201", "date": "2026-10-17", "start": "09:00", "end": "12:00", "students": 50, "status": "scheduled", "room_id": "room-bill-gates-bhavan-202", "faculty_id": "fac-f09"},
            {"id": "exam-mca301", "code": "MCA301-A26", "course_id": "course-mca301", "date": "2026-10-17", "start": "14:00", "end": "17:00", "students": 45, "status": "scheduled", "room_id": "room-bill-gates-bhavan-301", "faculty_id": "fac-f10"},
            {"id": "exam-ph202", "code": "PH202-A26", "course_id": "course-ph202", "date": "2026-10-17", "start": "14:00", "end": "17:00", "students": 45, "status": "scheduled", "room_id": "room-aditya-pharmacy-college-102", "faculty_id": "fac-f02"},
        ]

        for e in exams_data:
            db.merge(ExamModel(
                id=e["id"],
                exam_code=e["code"],
                course_id=e["course_id"],
                exam_date=e["date"],
                start_time=e["start"],
                end_time=e["end"],
                expected_students=e["students"],
                status=e["status"],
            ))
            db.merge(ExamRoomAllocationModel(
                id=f"alloc-{e['id']}",
                exam_id=e["id"],
                room_id=e["room_id"],
                allocated_seats=e["students"],
            ))
            db.merge(ExamInvigilationModel(
                id=f"invig-{e['id']}",
                exam_id=e["id"],
                faculty_id=e["faculty_id"],
                role="Chief Invigilator",
            ))

        # 8. Conflicts
        conflicts_data = [
            {
                "id": "conf-01",
                "type": "UNAVAILABLE_ROOM_ALLOCATED",
                "severity": "critical",
                "title": "Unavailable Room Allocated: Cotton Bhavan - Room 201",
                "desc": "Scheduled exam cohort assigned to Cotton Bhavan - Room 201, which is under maintenance due to ceiling fan and electrical lighting repair.",
                "rule": "Hard Constraint: Assigned examination venue must have status AVAILABLE.",
                "rec": "Automated Venue Relocation",
                "exam_ids": ["exam-ce201"],
                "room_ids": ["room-cotton-bhavan-201"],
            },
            {
                "id": "conf-02",
                "type": "ROOM_CAPACITY_DEFICIT",
                "severity": "critical",
                "title": "Seating Deficit: CS301 in Ramanujan Bhavan - Room 109",
                "desc": "CS301 has 65 registered candidates but Ramanujan Bhavan - Room 109 accommodates only 40 students (deficit of 25 seats).",
                "rule": "Hard Constraint: Room seating capacity >= expected student attendance.",
                "rec": "Venue Upsizing",
                "exam_ids": ["exam-cs301"],
                "room_ids": ["room-ramanujan-bhavan-109"],
            },
            {
                "id": "conf-03",
                "type": "ROOM_COLLISION_DOUBLE_BOOKING",
                "severity": "critical",
                "title": "Room Collision: CV Raman Bhavan - Room 101 Double-Booked",
                "desc": "EE201 (45 students) and CS303 (50 students) are both scheduled in CV Raman Bhavan - Room 101 on 2026-10-15 from 14:00 to 17:00.",
                "rule": "Hard Constraint: Venue must not have concurrent overlapping exam sessions.",
                "rec": "Parallel Venue Allocation",
                "exam_ids": ["exam-cs303", "exam-ee201"],
                "room_ids": ["room-cv-raman-bhavan-101"],
            },
            {
                "id": "conf-04",
                "type": "PROCTOR_ON_LEAVE",
                "severity": "high",
                "title": "Chief Invigilator on Medical Leave: Dr. Ravi Kumar",
                "desc": "Dr. Ravi Kumar (F01, CSE) is assigned to CS301 but has approved medical leave registered.",
                "rule": "Operational Policy: Assigned faculty must be available and active.",
                "rec": "Substitute Invigilator Assignment",
                "exam_ids": ["exam-cs301"],
                "faculty_ids": ["fac-f01"],
            },
            {
                "id": "conf-05",
                "type": "PROCTOR_DUTY_OVERLAP",
                "severity": "high",
                "title": "Concurrent Proctoring Conflict: Dr. Suresh Reddy",
                "desc": "Dr. Suresh Reddy is assigned to invigilate both CS303 and EE201 simultaneously (14:00-17:00).",
                "rule": "Institutional Rule: Faculty cannot hold simultaneous invigilation duties.",
                "rec": "Duty Redistribution",
                "exam_ids": ["exam-cs303", "exam-ee201"],
                "faculty_ids": ["fac-f03"],
            },
            {
                "id": "conf-06",
                "type": "STUDENT_SCHEDULE_CLASH",
                "severity": "high",
                "title": "Candidate Timetable Clash: Ram Kumar (STU-2026-1001)",
                "desc": "Ram Kumar is registered for both CS301 (09:00 - 12:00) and PH201 (09:00 - 12:00) concurrently.",
                "rule": "Statutory Rule: A candidate cannot sit for two examinations at the same time.",
                "rec": "Slot Re-sequencing",
                "exam_ids": ["exam-cs301", "exam-ph201"],
                "student_ids": ["stu-ram-kumar"],
            },
        ]
        for cf in conflicts_data:
            db.merge(ConflictModel(
                id=cf["id"],
                conflict_type=cf["type"],
                severity=cf["severity"],
                title=cf["title"],
                description=cf["desc"],
                constraint_violated=cf["rule"],
                recovery_category=cf["rec"],
                impacted_exam_ids=json.dumps(cf.get("exam_ids", [])),
                impacted_room_ids=json.dumps(cf.get("room_ids", [])),
                impacted_faculty_ids=json.dumps(cf.get("faculty_ids", [])),
                impacted_student_ids=json.dumps(cf.get("student_ids", [])),
                detected_at=datetime.utcnow().isoformat(),
            ))

        # 9. Incidents
        db.merge(IncidentModel(
            id="inc-01",
            incident_type="room_unavailability",
            severity="critical",
            status="open",
            description="Ceiling fan malfunction and speed regulator sparking reported in Cotton Bhavan - Room 201 during pre-exam inspection.",
            affected_exam_id="exam-ce201",
            affected_room_id="room-cotton-bhavan-201",
            created_at=datetime.utcnow().isoformat(),
        ))
        db.merge(IncidentModel(
            id="inc-02",
            incident_type="faculty_absence",
            severity="high",
            status="open",
            description="Medical leave certificate submitted for Dr. Ravi Kumar (CSE). Substitute requested.",
            affected_exam_id="exam-cs301",
            affected_faculty_id="fac-f01",
            created_at=datetime.utcnow().isoformat(),
        ))
        db.merge(IncidentModel(
            id="inc-03",
            incident_type="room_unavailability",
            severity="medium",
            status="open",
            description="Tube light fixture ballast failure and emergency lighting repair in progress in Ramanujan Bhavan - Room 104.",
            affected_room_id="room-ramanujan-bhavan-104",
            created_at=datetime.utcnow().isoformat(),
        ))

        # 10. Audit Logs
        db.merge(AuditLogModel(
            id="audit-01",
            actor="Autonomous Agent Engine",
            action="INITIALIZE_INSTITUTIONAL_ROSTER",
            entity_name="Campuses & Bhavans",
            entity_id="ALL_BHAVANS",
            details=json.dumps({"venues_initialized": 189, "departments": 10, "floors_per_bhavan": 3}),
            timestamp=datetime.utcnow().isoformat(),
        ))

        # 11. Notifications
        db.merge(NotificationModel(
            id="notif-01",
            type="announcement",
            severity="high",
            title="Statutory Examination Protocol (Autumn 2026)",
            message="Covers all 10 Departments across 7 Bhavans. Candidates must report 20 minutes before session commencement with identity card & hall ticket.",
            timestamp=datetime.utcnow().isoformat(),
            target_role="ALL",
        ))

        db.commit()
        print("Seeding complete! 189 rooms across 7 Bhavans and 10 departments successfully created in SQLite.")

    except Exception as e:
        db.rollback()
        print("Error during database seeding:", e)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
