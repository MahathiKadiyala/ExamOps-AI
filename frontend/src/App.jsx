import React, { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Examinations from './pages/Examinations';
import Students from './pages/Students';
import Rooms from './pages/Rooms';
import Faculty from './pages/Faculty';
import Schedule from './pages/Schedule';
import Conflicts from './pages/Conflicts';
import LiveMonitoring from './pages/LiveMonitoring';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { initialTodaysSchedule, initialNeedsAttentionAlerts } from './data/mockExamData';

const routesMap = {
  dashboard: {
    title: 'Dashboard',
    description: "Monitor today's examinations and resolve operational issues.",
    component: Dashboard
  },
  examinations: {
    title: 'Examinations',
    description: 'Manage course examination schedules, papers, and venue assignments.',
    component: Examinations
  },
  students: {
    title: 'Students',
    description: 'Verify candidate registrations, seating tickets, and accommodations.',
    component: Students
  },
  rooms: {
    title: 'Rooms',
    description: 'Monitor venue seating capacities, CCTV streams, and room availability.',
    component: Rooms
  },
  faculty: {
    title: 'Faculty',
    description: 'Track invigilator allocations, shift quotas, and standby relievers.',
    component: Faculty
  },
  schedule: {
    title: 'Schedule',
    description: 'Master timetable overview and daily examination slot calendar.',
    component: Schedule
  },
  conflicts: {
    title: 'Conflicts',
    description: 'Detect, analyze, and resolve room and invigilator collisions.',
    component: Conflicts
  },
  'live-monitoring': {
    title: 'Live Monitoring',
    description: 'Live attendance feeds, CCTV monitoring, and incident logs.',
    component: LiveMonitoring
  },
  reports: {
    title: 'Reports',
    description: 'Generate statutory attendance sheets and compliance statements.',
    component: Reports
  },
  settings: {
    title: 'Settings',
    description: 'Configure examination regulations, thresholds, and operational rules.',
    component: Settings
  },
};

function getRouteFromHash() {
  const hash = window.location.hash.replace('#', '').trim();
  return routesMap[hash] ? hash : 'dashboard';
}

export default function App() {
  const [activeRoute, setActiveRoute] = useState(getRouteFromHash);
  const [todaysSchedule, setTodaysSchedule] = useState(initialTodaysSchedule);
  const [alerts, setAlerts] = useState(initialNeedsAttentionAlerts);
  const [recommendationApplied, setRecommendationApplied] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveRoute(getRouteFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (routeId) => {
    if (routesMap[routeId]) {
      window.location.hash = routeId;
      setActiveRoute(routeId);
    }
  };

  // Autonomous action application: reassigns EX003 from Room E204 to E301
  const handleApplyRecommendation = () => {
    setTodaysSchedule((prev) =>
      prev.map((item) =>
        item.examId === 'EX003'
          ? { ...item, room: 'E301', status: 'Scheduled' }
          : item
      )
    );

    setAlerts((prev) => prev.filter((a) => a.id !== 'ALT-01'));
    setRecommendationApplied(true);
  };

  const handleResolveWithAI = (alertItem) => {
    // If it's the room issue or a general prompt, automatically execute or highlight recommendation
    handleApplyRecommendation();
  };

  const currentRouteMeta = routesMap[activeRoute] || routesMap.dashboard;
  const ActivePageComponent = currentRouteMeta.component;

  return (
    <Layout
      activeRoute={activeRoute}
      onNavigate={handleNavigate}
      activePageTitle={currentRouteMeta.title}
      contextualDescription={currentRouteMeta.description}
      unresolvedIssuesCount={alerts.length}
      onApplyRecommendation={handleApplyRecommendation}
      recommendationApplied={recommendationApplied}
    >
      <ActivePageComponent
        onNavigate={handleNavigate}
        todaysSchedule={todaysSchedule}
        alerts={alerts}
        onResolveWithAI={handleResolveWithAI}
        recommendationApplied={recommendationApplied}
      />
    </Layout>
  );
}
 