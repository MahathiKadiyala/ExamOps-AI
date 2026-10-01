import type {
  DashboardData,
  Exam,
  Room,
  FacultyWorkloadReport,
  ConflictReport,
  Incident,
  StudentPersonalSchedule,
  StudentAnnouncement,
  HealthResponse,
  AgentRunResponse,
} from '../types';

export const fallbackHealth: HealthResponse = {
  status: 'healthy',
  project_name: 'ExamOps',
  version: '2.4.0',
  environment: 'production-simulation',
  timestamp: new Date().toISOString(),
  services: {
    backend: { name: 'FastAPI Operations Service', status: 'healthy' },
    conflict_engine: { name: '10-Rule Conflict Detection Engine', status: 'healthy' },
    orchestrator: { name: 'Autonomous Agent Orchestrator', status: 'healthy' },
  },
};

export const INSTITUTIONAL_BHAVANS = [
  'Ratan Tata Bhavan',
  'Aditya Pharmacy College',
  'CV Raman Bhavan',
  'Cotton Bhavan',
  'Bill Gates Bhavan',
  'Ramanujan Bhavan',
  'Einstein Bhavan',
] as const;

export type InstitutionalBhavan = (typeof INSTITUTIONAL_BHAVANS)[number];

export const INSTITUTIONAL_DEPARTMENTS = [
  'Computer Science & Engineering (CSE)',
  'School of Pharmacy',
  'Electrical & Electronics Engineering (EEE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Mining Engineering',
  'Petroleum Technology',
  'Agricultural Engineering',
  'Bachelor of Computer Applications (BCA)',
  'Master of Computer Applications (MCA)',
] as const;

export type InstitutionalDepartment = (typeof INSTITUTIONAL_DEPARTMENTS)[number];

// Generate all 189 institutional venues (7 bhavans * 3 floors * 9 rooms)
const generateInstitutionalRooms = (): Room[] => {
  const roomsList: Room[] = [];
  INSTITUTIONAL_BHAVANS.forEach((bhavan) => {
    const slug = bhavan.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    for (let floor = 1; floor <= 3; floor++) {
      for (let roomIdx = 1; roomIdx <= 9; roomIdx++) {
        const roomCode = `${floor}0${roomIdx}`;
        const id = `room-${slug}-${roomCode}`;
        const roomNumber = `${bhavan} - Room ${roomCode}`;

        // Practical exam hall capacities: corner/prime halls have 60, labs 40, standard 50
        const capacity = roomIdx === 1 || roomIdx === 5 ? 60 : roomIdx === 9 ? 40 : 50;

        let status: 'available' | 'maintenance' = 'available';
        let notes = `Floor ${floor} Examination Hall, CCTV proctor coverage, single-desk seating`;

        if (bhavan === 'Cotton Bhavan' && roomCode === '201') {
          status = 'maintenance';
          notes = 'Ceiling fan motor fault & electrical lighting repair scheduled';
        } else if (bhavan === 'Bill Gates Bhavan' && roomCode === '201') {
          status = 'maintenance';
          notes = 'High-speed LAN terminal & electrical switchboard overhaul';
        } else if (bhavan === 'Ratan Tata Bhavan' && roomCode === '301') {
          status = 'maintenance';
          notes = 'Roof waterproofing inspection in progress';
        }

        roomsList.push({
          id,
          room_number: roomNumber,
          building: bhavan,
          floor,
          seating_capacity: capacity,
          has_projector: true,
          has_audio: roomIdx % 2 === 1,
          is_accessible: floor === 1,
          status,
          notes,
        });
      }
    }
  });
  return roomsList;
};

export const fallbackRooms: Room[] = generateInstitutionalRooms();

export const fallbackExams: Exam[] = [
  {
    id: 'exam-cs301',
    exam_code: 'CS301-M26',
    course_id: 'course-cs301',
    exam_date: '2026-10-15',
    start_time: '09:00',
    end_time: '12:00',
    expected_students: 55,
    status: 'scheduled',
    course: {
      id: 'course-cs301',
      course_code: 'CS301',
      course_name: 'Advanced Algorithms & Complexity',
      department: 'Computer Science & Engineering (CSE)',
    },
    allocated_rooms: [
      {
        id: 'room-bill-gates-bhavan-101',
        room_number: 'Bill Gates Bhavan - Room 101',
        building: 'Bill Gates Bhavan',
        allocated_seats: 55,
      },
    ],
    invigilators: [
      {
        id: 'fac-f01',
        full_name: 'Dr. Ravi Kumar',
        code: 'F01',
        department: 'Computer Science & Engineering (CSE)',
        role: 'Chief Invigilator',
      },
    ],
  },
  {
    id: 'exam-ph201',
    exam_code: 'PH201-M26',
    course_id: 'course-ph201',
    exam_date: '2026-10-15',
    start_time: '09:00',
    end_time: '12:00',
    expected_students: 50,
    status: 'scheduled',
    course: {
      id: 'course-ph201',
      course_code: 'PH201',
      course_name: 'Pharmaceutics & Biopharmaceutics',
      department: 'School of Pharmacy',
    },
    allocated_rooms: [
      {
        id: 'room-aditya-pharmacy-college-101',
        room_number: 'Aditya Pharmacy College - Room 101',
        building: 'Aditya Pharmacy College',
        allocated_seats: 50,
      },
    ],
    invigilators: [
      {
        id: 'fac-f02',
        full_name: 'Dr. Lakshmi Rao',
        code: 'F02',
        department: 'School of Pharmacy',
        role: 'Chief Invigilator',
      },
    ],
  },
  {
    id: 'exam-ee201',
    exam_code: 'EE201-A26',
    course_id: 'course-ee201',
    exam_date: '2026-10-15',
    start_time: '14:00',
    end_time: '17:00',
    expected_students: 45,
    status: 'needs_attention',
    course: {
      id: 'course-ee201',
      course_code: 'EE201',
      course_name: 'Electrical Circuits & Signal Processing',
      department: 'Electrical & Electronics Engineering (EEE)',
    },
    allocated_rooms: [
      {
        id: 'room-cv-raman-bhavan-101',
        room_number: 'CV Raman Bhavan - Room 101',
        building: 'CV Raman Bhavan',
        allocated_seats: 45,
      },
    ],
    invigilators: [
      {
        id: 'fac-f03',
        full_name: 'Dr. Suresh Reddy',
        code: 'F03',
        department: 'Electrical & Electronics Engineering (EEE)',
        role: 'Chief Invigilator',
      },
    ],
  },
  {
    id: 'exam-cs303',
    exam_code: 'CS303-A26',
    course_id: 'course-cs303',
    exam_date: '2026-10-15',
    start_time: '14:00',
    end_time: '17:00',
    expected_students: 50,
    status: 'needs_attention',
    course: {
      id: 'course-cs303',
      course_code: 'CS303',
      course_name: 'Operating Systems & Systems Programming',
      department: 'Computer Science & Engineering (CSE)',
    },
    allocated_rooms: [
      {
        id: 'room-cv-raman-bhavan-101',
        room_number: 'CV Raman Bhavan - Room 101',
        building: 'CV Raman Bhavan',
        allocated_seats: 50,
      },
    ],
    invigilators: [
      {
        id: 'fac-f03',
        full_name: 'Dr. Suresh Reddy',
        code: 'F03',
        department: 'Electrical & Electronics Engineering (EEE)',
        role: 'Invigilator',
      },
    ],
  },
  {
    id: 'exam-me201',
    exam_code: 'ME201-M26',
    course_id: 'course-me201',
    exam_date: '2026-10-16',
    start_time: '09:00',
    end_time: '12:00',
    expected_students: 50,
    status: 'scheduled',
    course: {
      id: 'course-me201',
      course_code: 'ME201',
      course_name: 'Thermal Engineering & Heat Transfer',
      department: 'Mechanical Engineering (ME)',
    },
    allocated_rooms: [
      {
        id: 'room-ratan-tata-bhavan-101',
        room_number: 'Ratan Tata Bhavan - Room 101',
        building: 'Ratan Tata Bhavan',
        allocated_seats: 50,
      },
    ],
    invigilators: [
      {
        id: 'fac-f04',
        full_name: 'Dr. Emily Watson',
        code: 'F04',
        department: 'Mechanical Engineering (ME)',
        role: 'Chief Invigilator',
      },
    ],
  },
  {
    id: 'exam-ce201',
    exam_code: 'CE201-M26',
    course_id: 'course-ce201',
    exam_date: '2026-10-16',
    start_time: '09:00',
    end_time: '12:00',
    expected_students: 40,
    status: 'scheduled',
    course: {
      id: 'course-ce201',
      course_code: 'CE201',
      course_name: 'Structural Analysis & Design',
      department: 'Civil Engineering (CE)',
    },
    allocated_rooms: [
      {
        id: 'room-cotton-bhavan-101',
        room_number: 'Cotton Bhavan - Room 101',
        building: 'Cotton Bhavan',
        allocated_seats: 40,
      },
    ],
    invigilators: [
      {
        id: 'fac-f05',
        full_name: 'Dr. Prakash Varma',
        code: 'F05',
        department: 'Civil Engineering (CE)',
        role: 'Chief Invigilator',
      },
    ],
  },
  {
    id: 'exam-mn301',
    exam_code: 'MN301-A26',
    course_id: 'course-mn301',
    exam_date: '2026-10-16',
    start_time: '14:00',
    end_time: '17:00',
    expected_students: 35,
    status: 'scheduled',
    course: {
      id: 'course-mn301',
      course_code: 'MN301',
      course_name: 'Surface Mining & Rock Mechanics',
      department: 'Mining Engineering',
    },
    allocated_rooms: [
      {
        id: 'room-ratan-tata-bhavan-201',
        room_number: 'Ratan Tata Bhavan - Room 201',
        building: 'Ratan Tata Bhavan',
        allocated_seats: 35,
      },
    ],
    invigilators: [
      {
        id: 'fac-f06',
        full_name: 'Dr. Sarah Jenkins',
        code: 'F06',
        department: 'Mining Engineering',
        role: 'Chief Invigilator',
      },
    ],
  },
  {
    id: 'exam-pt201',
    exam_code: 'PT201-A26',
    course_id: 'course-pt201',
    exam_date: '2026-10-16',
    start_time: '14:00',
    end_time: '17:00',
    expected_students: 40,
    status: 'scheduled',
    course: {
      id: 'course-pt201',
      course_code: 'PT201',
      course_name: 'Drilling & Reservoir Engineering',
      department: 'Petroleum Technology',
    },
    allocated_rooms: [
      {
        id: 'room-einstein-bhavan-101',
        room_number: 'Einstein Bhavan - Room 101',
        building: 'Einstein Bhavan',
        allocated_seats: 40,
      },
    ],
    invigilators: [
      {
        id: 'fac-f07',
        full_name: 'Dr. Kiran Rao',
        code: 'F07',
        department: 'Petroleum Technology',
        role: 'Chief Invigilator',
      },
    ],
  },
  {
    id: 'exam-ag201',
    exam_code: 'AG201-M26',
    course_id: 'course-ag201',
    exam_date: '2026-10-17',
    start_time: '09:00',
    end_time: '12:00',
    expected_students: 38,
    status: 'scheduled',
    course: {
      id: 'course-ag201',
      course_code: 'AG201',
      course_name: 'Farm Machinery & Soil Dynamics',
      department: 'Agricultural Engineering',
    },
    allocated_rooms: [
      {
        id: 'room-ramanujan-bhavan-101',
        room_number: 'Ramanujan Bhavan - Room 101',
        building: 'Ramanujan Bhavan',
        allocated_seats: 38,
      },
    ],
    invigilators: [
      {
        id: 'fac-f08',
        full_name: 'Dr. Ananya Sharma',
        code: 'F08',
        department: 'Agricultural Engineering',
        role: 'Chief Invigilator',
      },
    ],
  },
  {
    id: 'exam-bca201',
    exam_code: 'BCA201-M26',
    course_id: 'course-bca201',
    exam_date: '2026-10-17',
    start_time: '09:00',
    end_time: '12:00',
    expected_students: 50,
    status: 'scheduled',
    course: {
      id: 'course-bca201',
      course_code: 'BCA201',
      course_name: 'Relational Database Management Systems',
      department: 'Bachelor of Computer Applications (BCA)',
    },
    allocated_rooms: [
      {
        id: 'room-bill-gates-bhavan-202',
        room_number: 'Bill Gates Bhavan - Room 202',
        building: 'Bill Gates Bhavan',
        allocated_seats: 50,
      },
    ],
    invigilators: [
      {
        id: 'fac-f09',
        full_name: 'Dr. Rajiv Nair',
        code: 'F09',
        department: 'Bachelor of Computer Applications (BCA)',
        role: 'Chief Invigilator',
      },
    ],
  },
  {
    id: 'exam-mca301',
    exam_code: 'MCA301-A26',
    course_id: 'course-mca301',
    exam_date: '2026-10-17',
    start_time: '14:00',
    end_time: '17:00',
    expected_students: 45,
    status: 'scheduled',
    course: {
      id: 'course-mca301',
      course_code: 'MCA301',
      course_name: 'Cloud Architecture & Distributed Computing',
      department: 'Master of Computer Applications (MCA)',
    },
    allocated_rooms: [
      {
        id: 'room-bill-gates-bhavan-301',
        room_number: 'Bill Gates Bhavan - Room 301',
        building: 'Bill Gates Bhavan',
        allocated_seats: 45,
      },
    ],
    invigilators: [
      {
        id: 'fac-f10',
        full_name: 'Dr. Meera Deshmukh',
        code: 'F10',
        department: 'Master of Computer Applications (MCA)',
        role: 'Chief Invigilator',
      },
    ],
  },
  {
    id: 'exam-ph202',
    exam_code: 'PH202-A26',
    course_id: 'course-ph202',
    exam_date: '2026-10-17',
    start_time: '14:00',
    end_time: '17:00',
    expected_students: 45,
    status: 'scheduled',
    course: {
      id: 'course-ph202',
      course_code: 'PH202',
      course_name: 'Pharmacology & Clinical Therapeutics',
      department: 'School of Pharmacy',
    },
    allocated_rooms: [
      {
        id: 'room-aditya-pharmacy-college-102',
        room_number: 'Aditya Pharmacy College - Room 102',
        building: 'Aditya Pharmacy College',
        allocated_seats: 45,
      },
    ],
    invigilators: [
      {
        id: 'fac-f02',
        full_name: 'Dr. Lakshmi Rao',
        code: 'F02',
        department: 'School of Pharmacy',
        role: 'Invigilator',
      },
    ],
  },
];

export const fallbackFacultyWorkload: FacultyWorkloadReport = {
  total_faculty: 10,
  active_faculty: 9,
  overloaded_count: 1,
  average_shift_count: 1.8,
  faculty_workloads: [
    {
      faculty_id: 'fac-f01',
      code: 'F01',
      full_name: 'Dr. Ravi Kumar',
      department: 'Computer Science & Engineering (CSE)',
      email: 'ravi.kumar@klyra.demo',
      status: 'on_leave',
      max_weekly_shifts: 4,
      current_shift_count: 1,
      remaining_quota: 3,
      utilization_percentage: 25,
      is_overloaded: false,
      is_available: false,
    },
    {
      faculty_id: 'fac-f02',
      code: 'F02',
      full_name: 'Dr. Lakshmi Rao',
      department: 'School of Pharmacy',
      email: 'lakshmi.rao@klyra.demo',
      status: 'active',
      max_weekly_shifts: 3,
      current_shift_count: 4,
      remaining_quota: 0,
      utilization_percentage: 133.3,
      is_overloaded: true,
      is_available: true,
    },
    {
      faculty_id: 'fac-f03',
      code: 'F03',
      full_name: 'Dr. Suresh Reddy',
      department: 'Electrical & Electronics Engineering (EEE)',
      email: 'suresh.reddy@klyra.demo',
      status: 'active',
      max_weekly_shifts: 4,
      current_shift_count: 2,
      remaining_quota: 2,
      utilization_percentage: 50,
      is_overloaded: false,
      is_available: true,
    },
    {
      faculty_id: 'fac-f04',
      code: 'F04',
      full_name: 'Dr. Emily Watson',
      department: 'Mechanical Engineering (ME)',
      email: 'emily.watson@klyra.demo',
      status: 'active',
      max_weekly_shifts: 4,
      current_shift_count: 1,
      remaining_quota: 3,
      utilization_percentage: 25,
      is_overloaded: false,
      is_available: true,
    },
    {
      faculty_id: 'fac-f05',
      code: 'F05',
      full_name: 'Dr. Prakash Varma',
      department: 'Civil Engineering (CE)',
      email: 'prakash.varma@klyra.demo',
      status: 'active',
      max_weekly_shifts: 4,
      current_shift_count: 1,
      remaining_quota: 3,
      utilization_percentage: 25,
      is_overloaded: false,
      is_available: true,
    },
    {
      faculty_id: 'fac-f06',
      code: 'F06',
      full_name: 'Dr. Sarah Jenkins',
      department: 'Mining Engineering',
      email: 'sarah.jenkins@klyra.demo',
      status: 'active',
      max_weekly_shifts: 4,
      current_shift_count: 1,
      remaining_quota: 3,
      utilization_percentage: 25,
      is_overloaded: false,
      is_available: true,
    },
    {
      faculty_id: 'fac-f07',
      code: 'F07',
      full_name: 'Dr. Kiran Rao',
      department: 'Petroleum Technology',
      email: 'kiran.rao@klyra.demo',
      status: 'active',
      max_weekly_shifts: 4,
      current_shift_count: 1,
      remaining_quota: 3,
      utilization_percentage: 25,
      is_overloaded: false,
      is_available: true,
    },
    {
      faculty_id: 'fac-f08',
      code: 'F08',
      full_name: 'Dr. Ananya Sharma',
      department: 'Agricultural Engineering',
      email: 'ananya.sharma@klyra.demo',
      status: 'active',
      max_weekly_shifts: 4,
      current_shift_count: 1,
      remaining_quota: 3,
      utilization_percentage: 25,
      is_overloaded: false,
      is_available: true,
    },
    {
      faculty_id: 'fac-f09',
      code: 'F09',
      full_name: 'Dr. Rajiv Nair',
      department: 'Bachelor of Computer Applications (BCA)',
      email: 'rajiv.nair@klyra.demo',
      status: 'active',
      max_weekly_shifts: 4,
      current_shift_count: 1,
      remaining_quota: 3,
      utilization_percentage: 25,
      is_overloaded: false,
      is_available: true,
    },
    {
      faculty_id: 'fac-f10',
      code: 'F10',
      full_name: 'Dr. Meera Deshmukh',
      department: 'Master of Computer Applications (MCA)',
      email: 'meera.deshmukh@klyra.demo',
      status: 'active',
      max_weekly_shifts: 4,
      current_shift_count: 1,
      remaining_quota: 3,
      utilization_percentage: 25,
      is_overloaded: false,
      is_available: true,
    },
  ],
};

export const fallbackConflicts: ConflictReport = {
  timestamp: new Date().toISOString(),
  summary: {
    total_conflicts: 6,
    critical_count: 3,
    high_count: 3,
    medium_count: 0,
    by_category: {
      room_maintenance: 1,
      capacity_deficit: 1,
      room_collision: 1,
      faculty_on_leave: 1,
      duty_overlap: 1,
      student_clash: 1,
    },
  },
  conflicts: [
    {
      id: 'conf-01',
      conflict_type: 'UNAVAILABLE_ROOM_ALLOCATED',
      severity: 'critical',
      title: 'Unavailable Room Allocated: Cotton Bhavan - Room 201',
      description: 'Scheduled exam cohort assigned to Cotton Bhavan - Room 201, which is under maintenance due to ceiling fan and electrical lighting repair.',
      constraint_violated: 'Hard Constraint: Assigned examination venue must have status AVAILABLE.',
      recovery_category: 'Automated Venue Relocation',
      impacted_entities: {
        exam_ids: ['exam-ce201'],
        room_ids: ['room-cotton-bhavan-201'],
        faculty_ids: ['fac-f05'],
        student_ids: [],
      },
      detected_at: '2026-10-15T08:15:00Z',
    },
    {
      id: 'conf-02',
      conflict_type: 'ROOM_CAPACITY_DEFICIT',
      severity: 'critical',
      title: 'Seating Deficit: CS301 in Ramanujan Bhavan - Room 109',
      description: 'CS301 has 65 registered candidates but Ramanujan Bhavan - Room 109 accommodates only 40 students (deficit of 25 seats).',
      constraint_violated: 'Hard Constraint: Room seating capacity >= expected student attendance.',
      recovery_category: 'Venue Upsizing',
      impacted_entities: {
        exam_ids: ['exam-cs301'],
        room_ids: ['room-ramanujan-bhavan-109'],
        faculty_ids: ['fac-f01'],
        student_ids: [],
      },
      detected_at: '2026-10-15T08:20:00Z',
    },
    {
      id: 'conf-03',
      conflict_type: 'ROOM_COLLISION_DOUBLE_BOOKING',
      severity: 'critical',
      title: 'Room Collision: CV Raman Bhavan - Room 101 Double-Booked',
      description: 'EE201 (45 students) and CS303 (50 students) are both scheduled in CV Raman Bhavan - Room 101 on 2026-10-15 from 14:00 to 17:00.',
      constraint_violated: 'Hard Constraint: Venue must not have concurrent overlapping exam sessions.',
      recovery_category: 'Parallel Venue Allocation',
      impacted_entities: {
        exam_ids: ['exam-cs303', 'exam-ee201'],
        room_ids: ['room-cv-raman-bhavan-101'],
        faculty_ids: ['fac-f03'],
        student_ids: [],
      },
      detected_at: '2026-10-15T08:22:00Z',
    },
    {
      id: 'conf-04',
      conflict_type: 'PROCTOR_ON_LEAVE',
      severity: 'high',
      title: 'Chief Invigilator on Medical Leave: Dr. Ravi Kumar',
      description: 'Dr. Ravi Kumar (F01, CSE) is assigned to CS301 but has approved medical leave registered.',
      constraint_violated: 'Operational Policy: Assigned faculty must be available and active.',
      recovery_category: 'Substitute Invigilator Assignment',
      impacted_entities: {
        exam_ids: ['exam-cs301'],
        room_ids: ['room-bill-gates-bhavan-101'],
        faculty_ids: ['fac-f01'],
        student_ids: [],
      },
      detected_at: '2026-10-15T08:25:00Z',
    },
    {
      id: 'conf-05',
      conflict_type: 'PROCTOR_DUTY_OVERLAP',
      severity: 'high',
      title: 'Concurrent Proctoring Conflict: Dr. Suresh Reddy',
      description: 'Dr. Suresh Reddy is assigned to invigilate both CS303 and EE201 simultaneously (14:00-17:00).',
      constraint_violated: 'Institutional Rule: Faculty cannot hold simultaneous invigilation duties.',
      recovery_category: 'Duty Redistribution',
      impacted_entities: {
        exam_ids: ['exam-cs303', 'exam-ee201'],
        room_ids: ['room-cv-raman-bhavan-101'],
        faculty_ids: ['fac-f03'],
        student_ids: [],
      },
      detected_at: '2026-10-15T08:26:00Z',
    },
    {
      id: 'conf-06',
      conflict_type: 'STUDENT_SCHEDULE_CLASH',
      severity: 'high',
      title: 'Candidate Timetable Clash: Ram Kumar (STU-2026-1001)',
      description: 'Ram Kumar is registered for both CS301 (09:00 - 12:00) and PH201 (09:00 - 12:00) concurrently.',
      constraint_violated: 'Statutory Rule: A candidate cannot sit for two examinations at the same time.',
      recovery_category: 'Slot Re-sequencing',
      impacted_entities: {
        exam_ids: ['exam-cs301', 'exam-ph201'],
        room_ids: ['room-bill-gates-bhavan-101', 'room-aditya-pharmacy-college-101'],
        faculty_ids: [],
        student_ids: ['STU-2026-1001'],
      },
      detected_at: '2026-10-15T08:30:00Z',
    },
  ],
};

export const fallbackIncidents: Incident[] = [
  {
    id: 'inc-01',
    incident_type: 'room_unavailability',
    severity: 'critical',
    status: 'open',
    description: 'Ceiling fan malfunction and speed regulator sparking reported in Cotton Bhavan - Room 201 during pre-exam inspection.',
    affected_exam_id: 'exam-ce201',
    affected_room_id: 'room-cotton-bhavan-201',
    created_at: '2026-10-15T07:45:00Z',
  },
  {
    id: 'inc-02',
    incident_type: 'faculty_absence',
    severity: 'high',
    status: 'open',
    description: 'Medical leave certificate submitted for Dr. Ravi Kumar (CSE). Substitute requested.',
    affected_exam_id: 'exam-cs301',
    affected_faculty_id: 'fac-f01',
    created_at: '2026-10-15T08:05:00Z',
  },
  {
    id: 'inc-03',
    incident_type: 'room_unavailability',
    severity: 'medium',
    status: 'open',
    description: 'Tube light fixture ballast failure and emergency lighting repair in progress in Ramanujan Bhavan - Room 104.',
    affected_room_id: 'room-ramanujan-bhavan-104',
    created_at: '2026-10-15T08:15:00Z',
  },
];

export const fallbackDashboardData: DashboardData = {
  metrics: {
    total_examinations: 12,
    scheduled_today: 8,
    total_rooms: 189,
    available_rooms: 186,
    maintenance_rooms: 3,
    rooms_in_maintenance: 3,
    average_room_utilization_percent: 71.4,
    total_faculty: 10,
    active_invigilators: 9,
    total_students_enrolled: 1420,
    active_incidents: 2,
    active_incidents_count: 2,
    active_conflicts_summary: {
      total_conflicts: 6,
      critical_count: 3,
      high_count: 3,
    },
  },
  today_examinations: fallbackExams.slice(0, 6),
  active_conflicts: fallbackConflicts.conflicts,
  recent_incidents: fallbackIncidents,
};

export const fallbackStudentSchedule: StudentPersonalSchedule = {
  student: {
    id: 'stu-ram-kumar',
    student_id_number: 'STU-2026-1001',
    full_name: 'Ram Kumar',
    email: 'ram.kumar@example.edu',
    department: 'Computer Science & Engineering (CSE)',
    year_of_study: 3,
    has_accommodations: false,
  },
  total_registered_exams: 3,
  schedule: [
    {
      exam_id: 'exam-cs301',
      course_code: 'CS301',
      course_title: 'Advanced Algorithms & Complexity',
      department: 'Computer Science & Engineering (CSE)',
      exam_date: '2026-10-15',
      start_time: '09:00',
      end_time: '12:00',
      seat_number: 'DESK-BGB-14',
      primary_room: 'Bill Gates Bhavan - Room 101',
      primary_room_status: 'available',
      primary_invigilator: 'Dr. Ravi Kumar (F01)',
      rooms: [
        {
          room_number: 'Bill Gates Bhavan - Room 101',
          building: 'Bill Gates Bhavan',
          floor: 1,
          allocated_seats: 55,
          status: 'available',
        },
      ],
      status: 'scheduled',
    },
    {
      exam_id: 'exam-bca201',
      course_code: 'BCA201',
      course_title: 'Relational Database Management Systems',
      department: 'Bachelor of Computer Applications (BCA)',
      exam_date: '2026-10-17',
      start_time: '09:00',
      end_time: '12:00',
      seat_number: 'DESK-BGB-28',
      primary_room: 'Bill Gates Bhavan - Room 202',
      primary_room_status: 'available',
      primary_invigilator: 'Dr. Rajiv Nair (F09)',
      rooms: [
        {
          room_number: 'Bill Gates Bhavan - Room 202',
          building: 'Bill Gates Bhavan',
          floor: 2,
          allocated_seats: 50,
          status: 'available',
        },
      ],
      status: 'scheduled',
    },
    {
      exam_id: 'exam-cs303',
      course_code: 'CS303',
      course_title: 'Operating Systems & Systems Programming',
      department: 'Computer Science & Engineering (CSE)',
      exam_date: '2026-10-15',
      start_time: '14:00',
      end_time: '17:00',
      seat_number: 'DESK-CVR-07',
      primary_room: 'CV Raman Bhavan - Room 101',
      primary_room_status: 'available',
      primary_invigilator: 'Dr. Suresh Reddy (F03)',
      rooms: [
        {
          room_number: 'CV Raman Bhavan - Room 101',
          building: 'CV Raman Bhavan',
          floor: 1,
          allocated_seats: 50,
          status: 'available',
        },
      ],
      status: 'scheduled',
    },
  ],
  personal_conflicts: [
    {
      type: 'DIRECT_SCHEDULE_COLLISION',
      severity: 'critical',
      title: 'Concurrent Timetable Clash: CS301 vs PH201',
      description: 'You are registered for CS301 and PH201 both scheduled on Oct 15, 2026 from 09:00 to 12:00. Examination command has been notified for slot re-sequencing.',
    },
  ],
  close_schedule_warnings: [
    {
      type: 'BACK_TO_BACK_FATIGUE',
      severity: 'medium',
      title: 'Back-to-Back Exam Recovery',
      description: 'You have a morning session ending at 12:00 and an afternoon session at 14:00 in CV Raman Bhavan. Ensure reporting 20 minutes prior.',
    },
  ],
  room_change_alerts: [],
  timestamp: new Date().toISOString(),
};

export const fallbackAnnouncements: StudentAnnouncement[] = [
  {
    id: 'ann-1',
    severity: 'high',
    title: 'Statutory Examination Regulations & Candidate Protocol (Autumn 2026)',
    message: 'Covers all 10 Departments across 7 Bhavans. Candidates must report 20 minutes before session commencement with identity card & hall ticket.',
    status: 'active',
    created_at: '2026-10-14T09:00:00Z',
  },
  {
    id: 'ann-2',
    severity: 'critical',
    title: 'Notice: Maintenance Relocation for Cotton Bhavan - Room 201',
    message: 'Candidates assigned to Cotton Bhavan - Room 201 are relocated to Cotton Bhavan - Room 102. Check updated hall tickets on portal.',
    status: 'active',
    created_at: '2026-10-15T07:50:00Z',
  },
];

export function getFallbackAgentResponse(prompt: string): AgentRunResponse {
  const lower = prompt.toLowerCase();

  let result = 'Autonomous Analysis Complete: Verified operational schedule across all 7 Bhavans (189 examination rooms, 3 floors each) and 10 academic departments. Zero unhandled constraints.';
  let actions = [
    'Queried 189 room venues across 7 Bhavans (Floors 101-109, 201-209, 301-309)',
    'Validated 10 departmental timetables and proctor shift limits',
  ];

  if (lower.includes('room') || lower.includes('outage') || lower.includes('maintenance')) {
    result = 'Room Outage Triage: Cotton Bhavan - Room 201 is marked unavailable due to ceiling fan and lighting repair. Recommended Action: Reassign CE201 (40 candidates) to Cotton Bhavan - Room 102 (Capacity 50, Available, Zero Collisions).';
    actions = [
      'Identified affected exam in Cotton Bhavan - Room 201',
      'Filtered unallocated rooms in Cotton Bhavan & adjacent blocks with capacity >= 40',
      'Evaluated Cotton Bhavan - Room 102 (Capacity 50, Ground Floor, Available)',
      'Prepared closed-loop venue reallocation patch',
    ];
  } else if (lower.includes('proctor') || lower.includes('faculty') || lower.includes('leave') || lower.includes('absence')) {
    result = 'Faculty Absence Recovery: Dr. Ravi Kumar is on medical leave for CS301 (09:00 - 12:00 in Bill Gates Bhavan - Room 101). Recommended Action: Substitute with Dr. Prakash Varma (Civil Engineering, 1 shift allocated, Available, Certified).';
    actions = [
      'Scanned unallocated active invigilators with 0 current clashes',
      'Selected Dr. Prakash Varma (Remaining Quota: 3 shifts)',
      'Verified Departmental and Shift compliance',
      'Generated dispatch roster replacement notice',
    ];
  } else if (lower.includes('conflict') || lower.includes('clash')) {
    result = 'Conflict Engine Report: Detected 3 critical conflicts (Cotton Bhavan - Room 201 maintenance outage, CV Raman Bhavan - Room 101 double-booking between CS303 and EE201, and Student Ram Kumar direct clash between CS301 and PH201).';
    actions = [
      'Ran 10-rule deterministic conflict detector across all 189 venues',
      'Identified 3 hard constraint violations and 3 operational warnings',
      'Generated prioritized automated resolution playbook',
    ];
  }

  return {
    session_id: `ses-${Date.now()}`,
    status: 'completed',
    final_result: result,
    agent_state: 'COMPLETED',
    events: [
      { timestamp: new Date().toLocaleTimeString(), state: 'THINKING', message: 'Analyzing query against live institutional database across 7 Bhavans and 10 Departments...' },
      { timestamp: new Date().toLocaleTimeString(), state: 'GATHERING', message: 'Querying room allocations, proctor quotas, and student enrollments...' },
      { timestamp: new Date().toLocaleTimeString(), state: 'DECIDING', message: 'Evaluating conflict resolution heuristics and institutional policies...' },
      { timestamp: new Date().toLocaleTimeString(), state: 'COMPLETED', message: 'Resolution strategy generated and validated.' },
    ],
    actions,
    validation: { status: 'passed', rules_verified: 10, confidence: 0.98 },
    correction_count: 0,
  };
}
