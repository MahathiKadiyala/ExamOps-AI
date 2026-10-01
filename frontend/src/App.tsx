import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { AgentPanel } from './components/AgentPanel';
import { LandingPage } from './components/LandingPage';
import { OverviewView } from './views/OverviewView';
import { ExaminationsView } from './views/ExaminationsView';
import { RoomsView } from './views/RoomsView';
import { FacultyView } from './views/FacultyView';
import { ConflictsView } from './views/ConflictsView';
import { IncidentsView } from './views/IncidentsView';
import { AgentOperationsView } from './views/AgentOperationsView';
import { StudentPortalView } from './views/StudentPortalView';
import { DiagnosticsView } from './views/DiagnosticsView';
import { apiClient } from './services/apiClient';
import { AvyraRobotAssistant } from './components/AvyraRobotAssistant';
import type {
  UserRole,
  ActiveModule,
  DashboardData,
  Exam,
  Room,
  FacultyWorkloadReport,
  ConflictReport,
  Incident,
  HealthResponse,
} from './types';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('examops_theme') as 'dark' | 'light') || 'dark';
  });
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [userRole, setUserRole] = useState<UserRole>('coordinator');
  const [activeModule, setActiveModule] = useState<ActiveModule>('overview');
  const [isAgentOpen, setIsAgentOpen] = useState<boolean>(false);

  // Backend state
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [workloadReport, setWorkloadReport] = useState<FacultyWorkloadReport | null>(null);
  const [conflictReport, setConflictReport] = useState<ConflictReport | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [externalAgentQuery, setExternalAgentQuery] = useState<{ id: string; query: string } | null>(null);

  // Sync theme with DOM root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('examops_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Ping backend health
  const checkHealth = useCallback(async () => {
    const start = performance.now();
    try {
      const data = await apiClient.getHealth();
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setHealthData(data);
    } catch {
      setHealthData(null);
      setLatencyMs(null);
    }
  }, []);

  // Fetch all operational data
  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true);
    await checkHealth();
    try {
      const [dash, ex, rm, wk, cf, inc] = await Promise.all([
        apiClient.getDashboard().catch(() => null),
        apiClient.getExams().catch(() => []),
        apiClient.getRooms().catch(() => []),
        apiClient.getFacultyWorkload().catch(() => null),
        apiClient.getConflicts().catch(() => null),
        apiClient.getIncidents().catch(() => []),
      ]);
      if (dash) setDashboardData(dash);
      setExams(ex);
      setRooms(rm);
      setWorkloadReport(wk);
      setConflictReport(cf);
      setIncidents(inc);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [checkHealth]);

  useEffect(() => {
    fetchAllData();
    // Short-polling refresh interval for resilience (Prompt 13)
    const interval = setInterval(() => {
      fetchAllData();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const [currentUser, setCurrentUser] = useState<{
    email: string;
    full_name: string;
    role: UserRole;
    title?: string;
    department?: string;
  } | null>(() => {
    try {
      const stored = localStorage.getItem('examops_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleEnterDashboard = (role: UserRole, user?: any) => {
    setUserRole(role);
    const norm = (role || 'ADMIN').toLowerCase();
    if (norm.includes('stud')) {
      setActiveModule('student_portal');
    } else {
      setActiveModule('overview');
    }

    if (user) {
      setCurrentUser(user);
    } else {
      const defaultUsers: Record<string, any> = {
        admin: { email: 'admin@examops.demo', full_name: 'Admin Executive', role: 'ADMIN', title: 'Administrator', department: 'Academic Operations' },
        ADMIN: { email: 'admin@examops.demo', full_name: 'Admin Executive', role: 'ADMIN', title: 'Administrator', department: 'Academic Operations' },
        coordinator: { email: 'coordinator@examops.demo', full_name: 'Exam Coordinator', role: 'EXAM_COORDINATOR', title: 'Exam Coordinator', department: 'Examination Command' },
        EXAM_COORDINATOR: { email: 'coordinator@examops.demo', full_name: 'Exam Coordinator', role: 'EXAM_COORDINATOR', title: 'Exam Coordinator', department: 'Examination Command' },
        student: { email: 'ram.kumar@example.edu', full_name: 'Ram Kumar', role: 'STUDENT', title: 'Student', department: 'CSE (Data Science)' },
        STUDENT: { email: 'ram.kumar@example.edu', full_name: 'Ram Kumar', role: 'STUDENT', title: 'Student', department: 'CSE (Data Science)' },
      };
      setCurrentUser(defaultUsers[role] || defaultUsers['ADMIN']);
    }
    setCurrentView('app');
  };

  const handleChangeRole = (role: UserRole) => {
    setUserRole(role);
    const norm = (role || 'ADMIN').toLowerCase();
    if (norm.includes('stud')) {
      setActiveModule('student_portal');
      const studUser = {
        email: 'ram.kumar@example.edu',
        full_name: 'Ram Kumar',
        role: 'STUDENT' as UserRole,
        title: 'Student',
        department: 'CSE (Data Science)',
      };
      setCurrentUser(studUser);
      localStorage.setItem('examops_user', JSON.stringify(studUser));
    } else if (norm.includes('admin')) {
      if (activeModule === 'student_portal') setActiveModule('overview');
      const adminUser = {
        email: 'admin@examops.demo',
        full_name: 'Admin Executive',
        role: 'ADMIN' as UserRole,
        title: 'Administrator',
        department: 'Academic Operations',
      };
      setCurrentUser(adminUser);
      localStorage.setItem('examops_user', JSON.stringify(adminUser));
    } else {
      if (activeModule === 'student_portal' || activeModule === 'diagnostics') setActiveModule('overview');
      const coordUser = {
        email: 'coordinator@examops.demo',
        full_name: 'Exam Coordinator',
        role: 'EXAM_COORDINATOR' as UserRole,
        title: 'Exam Coordinator',
        department: 'Examination Command',
      };
      setCurrentUser(coordUser);
      localStorage.setItem('examops_user', JSON.stringify(coordUser));
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('examops_token');
    localStorage.removeItem('examops_user');
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleTriggerAgentQuery = (query: string) => {
    setIsAgentOpen(true);
    setExternalAgentQuery({ id: `q-${Date.now()}`, query });
  };

  if (currentView === 'landing') {
    return (
      <LandingPage
        onEnterDashboard={handleEnterDashboard}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const conflictCount = conflictReport?.summary.total_conflicts || dashboardData?.metrics.active_conflicts_summary.total_conflicts || 0;
  const incidentCount = incidents.filter((i) => i.status !== 'resolved').length;

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* 1. Persistent Left Sidebar (Prompt 14) */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        userRole={userRole}
        conflictCount={conflictCount}
        incidentCount={incidentCount}
        onOpenLanding={() => setCurrentView('landing')}
        onSignOut={handleSignOut}
        onOpenAgent={() => setIsAgentOpen(true)}
      />

      {/* 2. Main Content Deck */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Top Navigation */}
        <TopNav
          theme={theme}
          onToggleTheme={toggleTheme}
          userRole={userRole}
          onChangeRole={handleChangeRole}
          systemHealthy={!!healthData}
          latencyMs={latencyMs}
          conflictCount={conflictCount}
          onRefreshData={fetchAllData}
          isRefreshing={isRefreshing}
          onOpenLanding={() => setCurrentView('landing')}
          onTriggerAgentQuery={handleTriggerAgentQuery}
          currentUser={currentUser}
          onSignOut={handleSignOut}
        />

        {/* Scrollable Main Area */}
        <main
          id="portal-main-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem 2.25rem',
          }}
        >
          {(userRole.toLowerCase().includes('stud') || activeModule === 'student_portal') && (
            <StudentPortalView onSignOut={handleSignOut} />
          )}

          {activeModule === 'diagnostics' && (
            <DiagnosticsView />
          )}

          {!userRole.toLowerCase().includes('stud') && activeModule === 'overview' && (
            <OverviewView
              data={dashboardData}
              exams={exams}
              rooms={rooms}
              workloadReport={workloadReport}
              conflictReport={conflictReport}
              incidents={incidents}
              onNavigate={setActiveModule}
              onTriggerAgentQuery={handleTriggerAgentQuery}
              onRefreshData={fetchAllData}
            />
          )}

          {!userRole.toLowerCase().includes('stud') && activeModule === 'examinations' && (
            <ExaminationsView
              exams={exams}
              conflictReport={conflictReport}
              onTriggerAgentQuery={handleTriggerAgentQuery}
            />
          )}

          {!userRole.toLowerCase().includes('stud') && activeModule === 'rooms' && (
            <RoomsView
              rooms={rooms}
              exams={exams}
              onRoomStatusChanged={fetchAllData}
              onTriggerAgentQuery={handleTriggerAgentQuery}
            />
          )}

          {!userRole.toLowerCase().includes('stud') && activeModule === 'faculty' && (
            <FacultyView
              workloadReport={workloadReport}
              exams={exams}
              onFacultyDutyChanged={fetchAllData}
              onTriggerAgentQuery={handleTriggerAgentQuery}
            />
          )}

          {!userRole.toLowerCase().includes('stud') && activeModule === 'conflicts' && (
            <ConflictsView
              conflictReport={conflictReport}
              exams={exams}
              rooms={rooms}
              onRefreshData={fetchAllData}
              onTriggerAgentQuery={handleTriggerAgentQuery}
            />
          )}

          {!userRole.toLowerCase().includes('stud') && activeModule === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              onIncidentCreated={fetchAllData}
              onTriggerAgentQuery={handleTriggerAgentQuery}
            />
          )}

          {!userRole.toLowerCase().includes('stud') && activeModule === 'agent' && (
            <AgentOperationsView
              incidents={incidents}
              onTriggerAgentQuery={handleTriggerAgentQuery}
              onRefreshData={fetchAllData}
            />
          )}
        </main>
      </div>

      {/* 3. Floating Futuristic Avyra Robot Assistant (Prompts 6, 7, 8, 9, 20, 21, 22) */}
      <AvyraRobotAssistant
        isOpen={isAgentOpen}
        onClick={() => setIsAgentOpen(true)}
        conflictCount={userRole.toLowerCase().includes('stud') ? 0 : conflictCount}
        onQuickConflictReview={() => {
          setIsAgentOpen(true);
          handleTriggerAgentQuery(
            userRole.toLowerCase().includes('stud')
              ? "When is my next exam?"
              : "What examination issues need attention now?"
          );
        }}
      />

      {/* 4. Floating Avyra Operations Agent Panel / Drawer (Prompts 6, 10, 11) */}
      <AgentPanel
        isOpen={isAgentOpen}
        onClose={() => setIsAgentOpen(false)}
        onAgentRunComplete={fetchAllData}
        externalQuery={externalAgentQuery}
        userRole={userRole}
        onNavigate={(mod) => setActiveModule(mod as any)}
        hasImportantRecommendations={conflictCount > 0}
      />
    </div>
  );
}

export default App;
