import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Bell,
  RefreshCw,
  LogOut,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface StudentPortalViewProps {
  onSignOut?: () => void;
}

interface StudentProfile {
  id: string;
  student_id_number: string;
  full_name: string;
  email: string;
  department: string;
  branch: string;
  year_of_study: number;
  semester: number;
}

interface StudentNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  course_code?: string;
  course_title?: string;
  previous_val?: string;
  new_val?: string;
  time_slot?: string;
  badge: 'New' | 'Updated' | 'Important';
  severity?: string;
  timestamp: string;
  is_read: boolean;
}

interface ExamSession {
  exam_id: string;
  course_code: string;
  course_title: string;
  department?: string;
  exam_date: string;
  display_date: string;
  start_time: string;
  end_time: string;
  time_slot: string;
  seat_number: string;
  primary_room: string;
  building?: string;
  floor?: number;
  primary_invigilator?: string;
  status: 'Upcoming' | 'Today' | 'Completed' | 'Changed' | 'Cancelled';
  is_today?: boolean;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({ onSignOut }) => {
  const [profile, setProfile] = useState<StudentProfile>({
    id: 'stu-ram-kumar',
    student_id_number: 'STU-2026-1001',
    full_name: 'Ram Kumar',
    email: 'ram.kumar@example.edu',
    department: 'Computer Science & Engineering',
    branch: 'CSE (Data Science)',
    year_of_study: 3,
    semester: 6,
  });

  const [todayExam, setTodayExam] = useState<ExamSession | null>({
    exam_id: 'exam-cs301',
    course_code: 'CS301',
    course_title: 'Advanced Algorithms',
    department: 'Computer Science & Engineering',
    exam_date: '2026-10-15',
    display_date: '15 Oct 2026',
    start_time: '09:00',
    end_time: '12:00',
    time_slot: '09:00 AM – 12:00 PM',
    seat_number: 'B-14',
    primary_room: 'Bill Gates Bhavan — Room 101',
    building: 'Bill Gates Bhavan',
    floor: 1,
    primary_invigilator: 'Dr. Ravi Kumar',
    status: 'Today',
    is_today: true,
  });

  const [upcomingExams, setUpcomingExams] = useState<ExamSession[]>([
    {
      exam_id: 'exam-ds301',
      course_code: 'DS301',
      course_title: 'Machine Learning',
      department: 'Data Science (DS)',
      exam_date: '2026-10-18',
      display_date: '18 Oct 2026',
      start_time: '09:00',
      end_time: '12:00',
      time_slot: '09:00–12:00',
      seat_number: 'B-14',
      primary_room: 'Bill Gates B-102',
      building: 'Bill Gates Bhavan',
      floor: 1,
      primary_invigilator: 'Dr. Vikram Anand',
      status: 'Upcoming',
      is_today: false,
    },
    {
      exam_id: 'exam-ds302',
      course_code: 'DS302',
      course_title: 'Data Visualization',
      department: 'Data Science (DS)',
      exam_date: '2026-10-20',
      display_date: '20 Oct 2026',
      start_time: '14:00',
      end_time: '17:00',
      time_slot: '14:00–17:00',
      seat_number: 'A-08',
      primary_room: 'Ratan Tata B-201',
      building: 'Ratan Tata Bhavan',
      floor: 2,
      primary_invigilator: 'Dr. Meera Rao',
      status: 'Upcoming',
      is_today: false,
    },
    {
      exam_id: 'exam-cs305',
      course_code: 'CS305',
      course_title: 'Computer Networks',
      department: 'Computer Science & Engineering',
      exam_date: '2026-10-22',
      display_date: '22 Oct 2026',
      start_time: '09:00',
      end_time: '12:00',
      time_slot: '09:00–12:00',
      seat_number: 'C-12',
      primary_room: 'CV Raman B-101',
      building: 'CV Raman Bhavan',
      floor: 1,
      primary_invigilator: 'Dr. Amit Verma',
      status: 'Upcoming',
      is_today: false,
    },
  ]);

  const [notifications, setNotifications] = useState<StudentNotification[]>([
    {
      id: 'notif-1',
      type: 'room_changed',
      title: 'Room Changed',
      course_code: 'CS301',
      course_title: 'Advanced Algorithms',
      message: 'Your examination room has been changed.',
      previous_val: 'Bill Gates Bhavan — Room 101',
      new_val: 'Bill Gates Bhavan — Room 102',
      time_slot: '15 Oct 2026 · 09:00–12:00',
      badge: 'Important',
      timestamp: 'Just now',
      is_read: false,
    },
    {
      id: 'notif-2',
      type: 'time_changed',
      title: 'Exam Time Changed',
      course_code: 'DS301',
      course_title: 'Machine Learning',
      message: 'Your examination time has been updated.',
      previous_val: '09:00–12:00',
      new_val: '14:00–17:00',
      time_slot: '18 Oct 2026',
      badge: 'Updated',
      timestamp: '1 hour ago',
      is_read: false,
    },
  ]);

  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [liveToast, setLiveToast] = useState<{
    title: string;
    message: string;
    type: string;
  } | null>(null);

  const fetchStudentData = useCallback(async () => {
    setIsLoading(true);
    try {
      const scheduleRes: any = await apiClient.getStudentSchedule();
      if (scheduleRes) {
        if (scheduleRes.student) {
          setProfile(scheduleRes.student);
        }
        if (scheduleRes.today_exam !== undefined) {
          setTodayExam(scheduleRes.today_exam);
        }
        if (scheduleRes.upcoming_exams) {
          setUpcomingExams(scheduleRes.upcoming_exams);
        }
        if (scheduleRes.notifications && scheduleRes.notifications.length > 0) {
          setNotifications(scheduleRes.notifications);
        }
      }
    } catch (err) {
      console.error('Error fetching student portal data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentData();

    // Connect to live SSE EventSource stream (Requirement 9 & 15)
    let eventSource: EventSource | null = null;
    try {
      const sseUrl = `${apiClient.getBaseUrl()}/agent/events/stream`;
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener('exam_room_changed', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const oldRoom = data.old_room || 'Previous Room';
          const newRoom = data.new_room || 'Updated Room';
          const courseCode = data.course_code || 'CS301';

          // Instantly update Today's Examination venue
          setTodayExam((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              primary_room: newRoom,
              status: 'Changed',
            };
          });

          // Prepend high-priority notification card
          const newNotif: StudentNotification = {
            id: data.id || `notif-live-${Date.now()}`,
            type: 'room_changed',
            title: 'Room Changed',
            course_code: courseCode,
            course_title: data.course_title || 'Advanced Algorithms',
            message: 'Your examination room has been changed.',
            previous_val: oldRoom,
            new_val: newRoom,
            time_slot: data.time_slot || '15 Oct 2026 · 09:00–12:00',
            badge: 'New',
            timestamp: 'Just now',
            is_read: false,
          };

          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);

          setLiveToast({
            title: `Room Changed: ${courseCode}`,
            message: `New venue: ${newRoom} (Moved from ${oldRoom})`,
            type: 'warning',
          });

          // Auto-hide toast after 8 seconds
          setTimeout(() => setLiveToast(null), 8000);

          // Silently sync latest data from database
          fetchStudentData();
        } catch (err) {
          console.error('Error processing live SSE event:', err);
        }
      });

      eventSource.addEventListener('system_notification', () => {
        fetchStudentData();
      });
    } catch {
      // Fallback
    }

    const interval = setInterval(fetchStudentData, 12000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [fetchStudentData]);

  const handleMarkAsRead = async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );
    try {
      await apiClient.markStudentNotificationRead(notifId);
    } catch {
      // Handled gracefully
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await apiClient.markAllStudentNotificationsRead();
    } catch {
      // Handled gracefully
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayedNotifications = showAllNotifications
    ? notifications
    : notifications.slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1180px', margin: '0 auto', width: '100%' }}>

      {/* Live Room Change Toast Banner */}
      {liveToast && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px solid var(--accent-rose)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 4px 18px rgba(239, 68, 68, 0.2)',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-rose)',
                flexShrink: 0,
              }}
            >
              <AlertCircle size={20} />
            </div>
            <div>
              <strong style={{ color: 'var(--accent-rose)', fontSize: '0.92rem', display: 'block' }}>
                {liveToast.title}
              </strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                {liveToast.message}
              </span>
            </div>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. STUDENT IDENTITY SECTION (Who am I?)                                   */}
      {/* Pristine contrast, large readable name, clean hierarchy                   */}
      {/* ========================================================================= */}
      <section
        style={{
          padding: '1.85rem 2rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.35rem' }}>
          {/* Student Monogram Avatar */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.45rem',
              fontWeight: 800,
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              flexShrink: 0,
            }}
          >
            {profile.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>

          <div>
            {/* Student Name - Highly visible, large, clear contrast */}
            <h1
              style={{
                fontSize: '1.95rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 0.35rem 0',
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
              }}
            >
              {profile.full_name}
            </h1>

            {/* Academic Info - Clean readable secondary hierarchy */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.65rem',
                fontSize: '0.92rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                {profile.branch || 'CSE (Data Science)'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span>Year {profile.year_of_study}</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span>Semester {profile.semester || 6}</span>
            </div>

            {/* Student ID & Email Credentials */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.85rem',
                marginTop: '0.5rem',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
              }}
            >
              <span
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  padding: '2px 9px',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                Student ID: {profile.student_id_number}
              </span>
              <span>{profile.email}</span>
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={fetchStudentData}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', padding: '0.5rem 0.95rem' }}
            title="Refresh Schedule and Notifications"
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            <span>{isLoading ? 'Syncing...' : 'Sync Data'}</span>
          </button>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.82rem',
                padding: '0.5rem 0.95rem',
                color: 'var(--accent-rose)',
                borderColor: 'rgba(244, 63, 94, 0.3)',
                background: 'rgba(244, 63, 94, 0.06)',
                cursor: 'pointer',
              }}
              title="Logout of Student Portal"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. NOTIFICATIONS / IMPORTANT CHANGES SECTION                              */}
      {/* Room Changed, Exam Time Changed, Cancellations (New/Updated/Important)    */}
      {/* ========================================================================= */}
      <section
        id="student-notifications"
        style={{
          padding: '1.6rem 1.85rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <Bell size={17} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.22rem',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Important Notifications
              </h2>
            </div>
            {unreadCount > 0 && (
              <span
                style={{
                  background: 'var(--accent-rose)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                }}
              >
                Mark all as read
              </button>
            )}
            {notifications.length > 3 && (
              <button
                onClick={() => setShowAllNotifications((prev) => !prev)}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                {showAllNotifications ? 'Show Recent' : `View All (${notifications.length})`}
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            No examination changes or operational notifications at this time.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {displayedNotifications.map((n) => {
              const isRoomChange = n.type === 'room_changed' || n.title.toLowerCase().includes('room');
              const isTimeChange = n.type === 'time_changed' || n.title.toLowerCase().includes('time');

              const badgeColor =
                n.badge === 'New'
                  ? 'badge-emerald'
                  : n.badge === 'Important'
                  ? 'badge-rose'
                  : 'badge-amber';

              return (
                <div
                  key={n.id}
                  style={{
                    padding: '1.15rem 1.35rem',
                    borderRadius: 'var(--radius-md)',
                    background: n.is_read ? 'var(--bg-secondary)' : 'var(--bg-card-hover)',
                    border: '1px solid',
                    borderColor: n.is_read ? 'var(--border-subtle)' : 'var(--border-accent)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    transition: 'all var(--transition-fast)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${badgeColor}`} style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                        {n.badge}
                      </span>
                      <strong style={{ fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                        {n.title}
                      </strong>
                      {n.course_code && (
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: 'var(--accent-cyan)',
                            background: 'rgba(56, 189, 248, 0.1)',
                            padding: '1px 7px',
                            borderRadius: '5px',
                          }}
                        >
                          {n.course_code} {n.course_title ? `— ${n.course_title}` : ''}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {n.timestamp.includes('T') ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : n.timestamp}
                      </span>
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                          title="Mark this notice as read"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Clean, concise details */}
                  {isRoomChange && n.previous_val && n.new_val ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                        fontSize: '0.88rem',
                        marginTop: '0.2rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-tertiary)',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>Previous:</span>
                      <del style={{ color: 'var(--text-muted)' }}>{n.previous_val}</del>
                      <ArrowRight size={14} style={{ color: 'var(--accent-cyan)' }} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        New: <strong style={{ color: 'var(--accent-emerald)' }}>{n.new_val}</strong>
                      </span>
                      {n.time_slot && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 'auto' }}>
                          {n.time_slot}
                        </span>
                      )}
                    </div>
                  ) : isTimeChange && n.previous_val && n.new_val ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                        fontSize: '0.88rem',
                        marginTop: '0.2rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-tertiary)',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>Previous Time:</span>
                      <del style={{ color: 'var(--text-muted)' }}>{n.previous_val}</del>
                      <ArrowRight size={14} style={{ color: 'var(--accent-cyan)' }} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        New Time: <strong style={{ color: 'var(--accent-cyan)' }}>{n.new_val}</strong>
                      </span>
                      {n.time_slot && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 'auto' }}>
                          {n.time_slot}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {n.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. TODAY'S EXAMINATION SECTION                                            */}
      {/* Course -> Time -> Room -> Seat -> Invigilator                             */}
      {/* ========================================================================= */}
      <section
        id="today-examination"
        style={{
          padding: '1.6rem 1.85rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-emerald)',
            }}
          >
            <Calendar size={17} />
          </div>
          <h2
            style={{
              fontSize: '1.22rem',
              fontWeight: 800,
              margin: 0,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Today's Examination
          </h2>
        </div>

        {todayExam ? (
          <div
            style={{
              padding: '1.5rem 1.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1.5px solid var(--border-accent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.15rem',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
            }}
          >
            {/* Header: Course Code, Course Title, Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {todayExam.course_code}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {todayExam.department}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    margin: 0,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.015em',
                  }}
                >
                  {todayExam.course_title}
                </h3>
              </div>

              <span
                className={`badge ${todayExam.status === 'Changed' ? 'badge-rose' : 'badge-emerald'}`}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', fontWeight: 800 }}
              >
                {todayExam.status === 'Changed' ? 'Venue Changed' : 'Today'}
              </span>
            </div>

            {/* Core Examination Coordinates Grid: Course -> Time -> Room -> Seat */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              {/* Time */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cyan)',
                    flexShrink: 0,
                  }}
                >
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Examination Time
                  </div>
                  <strong style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                    {todayExam.time_slot}
                  </strong>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    15 Oct 2026
                  </div>
                </div>
              </div>

              {/* Room / Venue */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-emerald)',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Assigned Room
                  </div>
                  <strong style={{ fontSize: '0.98rem', color: 'var(--accent-cyan)' }}>
                    📍 {todayExam.primary_room}
                  </strong>
                  {todayExam.building && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {todayExam.building} • Floor {todayExam.floor || 1}
                    </div>
                  )}
                </div>
              </div>

              {/* Seat */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-purple)',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Desk / Seat
                  </div>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                    Seat {todayExam.seat_number}
                  </strong>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Hall Ticket Confirmed
                  </div>
                </div>
              </div>

              {/* Invigilator */}
              {todayExam.primary_invigilator && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-amber)',
                      flexShrink: 0,
                    }}
                  >
                    <User size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Invigilator
                    </div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {todayExam.primary_invigilator}
                    </strong>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Assigned Proctor
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px dashed var(--border-subtle)',
            }}
          >
            <CheckCircle2 size={36} style={{ color: 'var(--accent-emerald)', margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-primary)' }}>
              No examinations scheduled for today.
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Take time to review your coursework and prepare for your upcoming sessions.
            </p>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. UPCOMING EXAMINATIONS SECTION                                          */}
      {/* Clean list/table: Course, Date, Time, Room, Seat, Status                  */}
      {/* ========================================================================= */}
      <section
        id="upcoming-examinations"
        style={{
          padding: '1.6rem 1.85rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-purple)',
              }}
            >
              <Calendar size={17} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.22rem',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Upcoming Examinations
              </h2>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Registered course examinations for {profile.branch || 'CSE (Data Science)'}
              </p>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.78rem',
              color: 'var(--accent-cyan)',
              background: 'rgba(56, 189, 248, 0.1)',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontWeight: 700,
            }}
          >
            {upcomingExams.length} Upcoming Papers
          </span>
        </div>

        {/* Clean Responsive Examination Table */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0 0.5rem',
              fontSize: '0.88rem',
            }}
          >
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ textAlign: 'left', padding: '0.65rem 1rem', fontWeight: 700 }}>Course</th>
                <th style={{ textAlign: 'left', padding: '0.65rem 1rem', fontWeight: 700 }}>Date</th>
                <th style={{ textAlign: 'left', padding: '0.65rem 1rem', fontWeight: 700 }}>Time</th>
                <th style={{ textAlign: 'left', padding: '0.65rem 1rem', fontWeight: 700 }}>Room</th>
                <th style={{ textAlign: 'left', padding: '0.65rem 1rem', fontWeight: 700 }}>Seat</th>
                <th style={{ textAlign: 'right', padding: '0.65rem 1rem', fontWeight: 700 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcomingExams.map((exam) => (
                <tr
                  key={exam.exam_id}
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background var(--transition-fast)',
                  }}
                >
                  {/* Course */}
                  <td style={{ padding: '0.9rem 1rem', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          color: 'var(--accent-purple)',
                          background: 'rgba(168, 85, 247, 0.1)',
                          padding: '2px 7px',
                          borderRadius: '5px',
                        }}
                      >
                        {exam.course_code}
                      </span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                        {exam.course_title}
                      </strong>
                    </div>
                  </td>

                  {/* Date */}
                  <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} style={{ color: 'var(--accent-cyan)' }} />
                      <strong>{exam.display_date}</strong>
                    </span>
                  </td>

                  {/* Time */}
                  <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                      {exam.time_slot}
                    </span>
                  </td>

                  {/* Room */}
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <MapPin size={13} style={{ color: 'var(--accent-emerald)' }} />
                      {exam.primary_room}
                    </span>
                  </td>

                  {/* Seat */}
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        padding: '2px 8px',
                        borderRadius: '5px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {exam.seat_number}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.9rem 1rem', textAlign: 'right', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                    <span
                      className={`badge ${
                        exam.status === 'Today'
                          ? 'badge-emerald'
                          : exam.status === 'Changed'
                          ? 'badge-rose'
                          : exam.status === 'Completed'
                          ? 'badge-purple'
                          : 'badge-cyan'
                      }`}
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem' }}
                    >
                      {exam.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FOOTER / SUMMARY BAR                                                   */}
      {/* ========================================================================= */}
      <footer
        style={{
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            Next Examination: <strong style={{ color: 'var(--text-primary)' }}>CS301 · 15 Oct 2026 · 09:00 AM</strong> ({todayExam?.primary_room || 'Bill Gates Bhavan'})
          </span>
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          ExamOps • AI-Powered Examination Operations
        </div>
      </footer>
    </div>
  );
};

export default StudentPortalView;
