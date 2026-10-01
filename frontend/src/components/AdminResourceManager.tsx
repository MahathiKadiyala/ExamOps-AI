import React, { useState, useEffect } from 'react';
import {
  CalendarPlus,
  BookPlus,
  UserPlus,
  Building,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { Room, Exam } from '../types';
import { INSTITUTIONAL_BHAVANS, INSTITUTIONAL_DEPARTMENTS } from '../services/fallbackData';

interface AdminResourceManagerProps {
  rooms?: Room[];
  exams?: Exam[];
  onRefreshData?: () => void;
  onTriggerAgentQuery?: (query: string) => void;
}

type AdminTab = 'exam' | 'course' | 'student' | 'room' | 'capacity';

export const AdminResourceManager: React.FC<AdminResourceManagerProps> = ({
  rooms = [],
  onRefreshData,
  onTriggerAgentQuery,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('exam');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  // 1. Add Exam
  const [examCode, setExamCode] = useState('EXAM-105');
  const [courseCode, setCourseCode] = useState('CS301');
  const [examDate, setExamDate] = useState('2026-10-18');
  const [examSlot, setExamSlot] = useState<'morning' | 'afternoon'>('morning');
  const [expectedStudents, setExpectedStudents] = useState(50);
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || 'room.101');
  const [facultyList, setFacultyList] = useState<Array<{ id: string; name: string; shift_count?: number }>>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');

  useEffect(() => {
    apiClient.getFacultyWorkload().then((res) => {
      if (res && res.faculty_workloads) {
        const list = res.faculty_workloads.map((fw) => ({
          id: fw.faculty_id,
          name: fw.full_name,
          shift_count: fw.current_shift_count,
        }));
        setFacultyList(list);
      }
    }).catch(() => {});
  }, []);

  // 2. Add Course
  const [newCourseCode, setNewCourseCode] = useState('CS305');
  const [courseName, setCourseName] = useState('Advanced Machine Learning');
  const [courseDept, setCourseDept] = useState<string>(INSTITUTIONAL_DEPARTMENTS[0]);
  const [courseCredits, setCourseCredits] = useState(4);

  // 3. Add Student
  const [studentIdNum, setStudentIdNum] = useState('22CS105');
  const [studentName, setStudentName] = useState('Sneha Reddy');
  const [studentEmail, setStudentEmail] = useState('sneha@klyra.demo');
  const [studentBranch, setStudentBranch] = useState<string>(INSTITUTIONAL_DEPARTMENTS[0]);
  const [studentYear, setStudentYear] = useState(3);

  // 4. Add Room
  const [roomNumber, setRoomNumber] = useState('101');
  const [roomBuilding, setRoomBuilding] = useState<string>(INSTITUTIONAL_BHAVANS[0]);
  const [roomFloor, setRoomFloor] = useState(1);
  const [roomCapacity, setRoomCapacity] = useState(50);

  // 5. Change Room Capacity
  const [capacityTargetRoomId, setCapacityTargetRoomId] = useState(rooms[0]?.id || '');
  const [newCapacity, setNewCapacity] = useState(70);

  const resetMessages = () => {
    setStatusMessage(null);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    resetMessages();
    try {
      const startTime = examSlot === 'morning' ? '09:00:00' : '14:00:00';
      const endTime = examSlot === 'morning' ? '12:00:00' : '17:00:00';

      await apiClient.createExamination({
        exam_code: examCode.trim().toUpperCase(),
        course_id: courseCode.trim().toLowerCase(),
        exam_date: examDate,
        start_time: startTime,
        end_time: endTime,
        expected_students: Number(expectedStudents),
        room_ids: selectedRoomId ? [selectedRoomId] : [],
        invigilator_id: selectedFacultyId || undefined,
      });

      setStatusMessage({
        type: 'success',
        text: `Examination ${examCode.toUpperCase()} successfully scheduled for ${examDate} (${examSlot}).`,
      });
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create examination';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    resetMessages();
    try {
      await apiClient.createCourse({
        course_code: newCourseCode.trim().toUpperCase(),
        course_name: courseName.trim(),
        department: courseDept.trim(),
        credits: Number(courseCredits),
      });

      setStatusMessage({
        type: 'success',
        text: `Course ${newCourseCode.toUpperCase()} (${courseName}) registered in ${courseDept}.`,
      });
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register course';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    resetMessages();
    try {
      await apiClient.createStudent({
        student_id_number: studentIdNum.trim().toUpperCase(),
        full_name: studentName.trim(),
        email: studentEmail.trim().toLowerCase(),
        department: studentBranch.trim(),
        year_of_study: Number(studentYear),
      });

      setStatusMessage({
        type: 'success',
        text: `Student ${studentName} (${studentIdNum.toUpperCase()}) added to ${studentBranch} branch.`,
      });
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add student';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    resetMessages();
    try {
      await apiClient.createRoom({
        room_number: roomNumber.trim().toUpperCase(),
        building: roomBuilding.trim(),
        floor: Number(roomFloor),
        seating_capacity: Number(roomCapacity),
      });

      setStatusMessage({
        type: 'success',
        text: `Examination Room ${roomNumber.toUpperCase()} (${roomCapacity} seats) added to ${roomBuilding}.`,
      });
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add room';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capacityTargetRoomId && rooms.length > 0) {
      setStatusMessage({ type: 'error', text: 'Please select a room' });
      return;
    }
    const targetId = capacityTargetRoomId || rooms[0]?.id;
    setIsSubmitting(true);
    resetMessages();
    try {
      await apiClient.updateRoomCapacity(targetId, Number(newCapacity));
      const rObj = rooms.find((r) => r.id === targetId);
      setStatusMessage({
        type: 'success',
        text: `Seating capacity of ${rObj?.room_number || targetId} successfully updated to ${newCapacity} seats.`,
      });
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update capacity';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-accent)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
              ADMINISTRATIVE GOVERNANCE
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Add & Configure Institutional Resources
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Resource & Examination Management Console
          </h3>
        </div>

        {onTriggerAgentQuery && (
          <button
            onClick={() => onTriggerAgentQuery("What changes should the examination team make now to improve examination operations?")}
            className="btn btn-secondary"
            style={{ fontSize: '0.76rem', fontWeight: 700, gap: '0.4rem', display: 'flex', alignItems: 'center' }}
            title="Ask AI to recommend administrative adjustments"
          >
            <Sparkles size={14} color="var(--accent-cyan)" />
            <span>AI Operations Audit</span>
          </button>
        )}
      </div>

      {/* Action Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.5rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <button
          onClick={() => { setActiveTab('exam'); resetMessages(); }}
          className={`btn ${activeTab === 'exam' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', gap: '0.35rem', display: 'flex', alignItems: 'center' }}
        >
          <CalendarPlus size={14} />
          <span>Add Examination</span>
        </button>

        <button
          onClick={() => { setActiveTab('course'); resetMessages(); }}
          className={`btn ${activeTab === 'course' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', gap: '0.35rem', display: 'flex', alignItems: 'center' }}
        >
          <BookPlus size={14} />
          <span>Add Course</span>
        </button>

        <button
          onClick={() => { setActiveTab('student'); resetMessages(); }}
          className={`btn ${activeTab === 'student' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', gap: '0.35rem', display: 'flex', alignItems: 'center' }}
        >
          <UserPlus size={14} />
          <span>Add Student (Branch)</span>
        </button>

        <button
          onClick={() => { setActiveTab('room'); resetMessages(); }}
          className={`btn ${activeTab === 'room' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', gap: '0.35rem', display: 'flex', alignItems: 'center' }}
        >
          <Building size={14} />
          <span>Add Room</span>
        </button>

        <button
          onClick={() => { setActiveTab('capacity'); resetMessages(); }}
          className={`btn ${activeTab === 'capacity' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', gap: '0.35rem', display: 'flex', alignItems: 'center' }}
        >
          <Sliders size={14} />
          <span>Change Room Capacity</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {statusMessage && (
        <div
          style={{
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            color: statusMessage.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
          }}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tab 1: Add Examination */}
      {activeTab === 'exam' && (
        <form onSubmit={handleCreateExam} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Exam Code
            </label>
            <input
              type="text"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value)}
              required
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Course Code / Title
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              required
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Exam Date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Time Slot
            </label>
            <select
              value={examSlot}
              onChange={(e) => setExamSlot(e.target.value as 'morning' | 'afternoon')}
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            >
              <option value="morning">Morning (09:00 - 12:00)</option>
              <option value="afternoon">Afternoon (14:00 - 17:00)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Expected Students
            </label>
            <input
              type="number"
              min={1}
              value={expectedStudents}
              onChange={(e) => setExpectedStudents(Number(e.target.value))}
              required
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Allocated Room
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} ({r.seating_capacity} seats - {r.building})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Assigned Chief Invigilator
            </label>
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            >
              <option value="">Auto-Assign Proctor (Lowest Workload)</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.shift_count || 0} shifts)
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.84rem', fontWeight: 700 }}
            >
              {isSubmitting ? 'Scheduling...' : 'Confirm Examination'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Add Course */}
      {activeTab === 'course' && (
        <form onSubmit={handleCreateCourse} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Course Code
            </label>
            <input
              type="text"
              value={newCourseCode}
              onChange={(e) => setNewCourseCode(e.target.value)}
              required
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Course Title
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              required
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Department / Branch
            </label>
            <select
              value={courseDept}
              onChange={(e) => setCourseDept(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            >
              {INSTITUTIONAL_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Credits
            </label>
            <input
              type="number"
              min={1}
              max={6}
              value={courseCredits}
              onChange={(e) => setCourseCredits(Number(e.target.value))}
              required
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.84rem', fontWeight: 700 }}
            >
              {isSubmitting ? 'Registering...' : 'Register Course'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Add Student to Branch */}
      {activeTab === 'student' && (
        <form onSubmit={handleCreateStudent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Student Roll / ID
            </label>
            <input
              type="text"
              value={studentIdNum}
              onChange={(e) => setStudentIdNum(e.target.value)}
              required
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Full Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Email Address
            </label>
            <input
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              required
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Branch / Department
            </label>
            <select
              value={studentBranch}
              onChange={(e) => setStudentBranch(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            >
              {INSTITUTIONAL_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Year of Study
            </label>
            <select
              value={studentYear}
              onChange={(e) => setStudentYear(Number(e.target.value))}
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            >
              <option value={1}>Year 1</option>
              <option value={2}>Year 2</option>
              <option value={3}>Year 3</option>
              <option value={4}>Year 4</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.84rem', fontWeight: 700 }}
            >
              {isSubmitting ? 'Adding...' : 'Register Student'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Add Room */}
      {activeTab === 'room' && (
        <form onSubmit={handleCreateRoom} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Room / Venue ID
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              required
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Campus Bhavan / Block
            </label>
            <select
              value={roomBuilding}
              onChange={(e) => setRoomBuilding(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            >
              {INSTITUTIONAL_BHAVANS.map((bhavan) => (
                <option key={bhavan} value={bhavan}>
                  {bhavan}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Floor
            </label>
            <select
              value={roomFloor}
              onChange={(e) => setRoomFloor(Number(e.target.value))}
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            >
              <option value={1}>Floor 1 (Rooms 101–109)</option>
              <option value={2}>Floor 2 (Rooms 201–209)</option>
              <option value={3}>Floor 3 (Rooms 301–309)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Seating Capacity
            </label>
            <input
              type="number"
              min={10}
              max={500}
              value={roomCapacity}
              onChange={(e) => setRoomCapacity(Number(e.target.value))}
              required
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.84rem', fontWeight: 700 }}
            >
              {isSubmitting ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 5: Change Room Capacity */}
      {activeTab === 'capacity' && (
        <form onSubmit={handleUpdateCapacity} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              Select Examination Room
            </label>
            <select
              value={capacityTargetRoomId}
              onChange={(e) => {
                setCapacityTargetRoomId(e.target.value);
                const r = rooms.find((rm) => rm.id === e.target.value);
                if (r) setNewCapacity(r.seating_capacity);
              }}
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} (Current Capacity: {r.seating_capacity} seats • {r.building})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              New Seating Capacity (Seats)
            </label>
            <input
              type="number"
              min={10}
              max={500}
              value={newCapacity}
              onChange={(e) => setNewCapacity(Number(e.target.value))}
              required
              className="input"
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.84rem', fontWeight: 700 }}
            >
              {isSubmitting ? 'Updating...' : 'Update Capacity'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminResourceManager;
