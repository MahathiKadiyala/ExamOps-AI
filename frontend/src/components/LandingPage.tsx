import React, { useState } from 'react';
import {
  Shield,
  Sparkles,
  GraduationCap,
  Sun,
  Moon,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import type { UserRole } from '../types';
import { InteractiveBackground } from './InteractiveBackground';

interface AuthenticatedUser {
  email: string;
  full_name: string;
  role: UserRole;
  title: string;
  department: string;
}

interface LandingPageProps {
  onEnterDashboard: (role: UserRole, user?: AuthenticatedUser) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

interface DemoAccount {
  role: UserRole;
  label: string;
  email: string;
  password: string;
  name: string;
  title: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'ADMIN',
    label: 'Admin',
    email: 'admin@examops.demo',
    password: 'Admin@12345',
    name: 'Admin Executive',
    title: 'Operations Director',
    icon: Shield,
  },
  {
    role: 'EXAM_COORDINATOR',
    label: 'Coordinator',
    email: 'coordinator@examops.demo',
    password: 'Coordinator@12345',
    name: 'Chief Exam Coordinator',
    title: 'Exam Operations Officer',
    icon: Sparkles,
  },
  {
    role: 'STUDENT',
    label: 'Student',
    email: 'student@examops.demo',
    password: 'Student@12345',
    name: 'Ram Kumar (STU-2026-1001)',
    title: 'Candidate Portal',
    icon: GraduationCap,
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterDashboard,
  theme,
  onToggleTheme,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [emailInput, setEmailInput] = useState('admin@examops.demo');
  const [passwordInput, setPasswordInput] = useState('Admin@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleSelect = (account: DemoAccount) => {
    setSelectedRole(account.role);
    setEmailInput(account.email);
    setPasswordInput(account.password);
    setErrorMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const currentAccount = DEMO_ACCOUNTS.find((a) => a.role === selectedRole) || DEMO_ACCOUNTS[0];
      const userObj: AuthenticatedUser = {
        email: emailInput,
        full_name: currentAccount.name,
        role: selectedRole,
        title: currentAccount.title,
        department: selectedRole === 'STUDENT' ? 'Computer Science & Engineering' : 'Examination Operations Cell',
      };
      localStorage.setItem('examops_token', 'demo-authenticated-jwt-session');
      localStorage.setItem('examops_user', JSON.stringify(userObj));
      onEnterDashboard(selectedRole, userObj);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
      }}
    >
      {/* Interactive Background Canvas */}
      <InteractiveBackground theme={theme} particleCount={65} />

      {/* Theme Toggle Top Right */}
      <div
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.5rem',
          zIndex: 30,
        }}
      >
        <button
          onClick={onToggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: theme === 'dark' ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            boxShadow: 'var(--shadow-card)',
            transition: 'all var(--transition-fast)',
          }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun size={15} color="var(--accent-amber)" />
          ) : (
            <Moon size={15} color="var(--accent-cyan)" />
          )}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* Perfectly Centered Login Container */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          margin: 'auto',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #6366f1 100%)',
              color: '#ffffff',
              marginBottom: '0.75rem',
              boxShadow: '0 8px 24px -2px rgba(56, 189, 248, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Cpu size={28} strokeWidth={2.2} />
          </div>

          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0 0 0.3rem 0',
              background:
                theme === 'dark'
                  ? 'linear-gradient(135deg, #ffffff 40%, var(--accent-cyan) 100%)'
                  : 'linear-gradient(135deg, #0f172a 40%, var(--accent-blue) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ExamOps
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.88rem',
              margin: 0,
              fontWeight: 500,
            }}
          >
            AI-Powered Examination Operations
          </p>
        </div>

        {/* Clean, Compact & Centered Login Box */}
        <div
          className="glass-panel"
          style={{
            width: '100%',
            padding: '1.85rem 1.75rem',
            borderRadius: '20px',
            border: '1px solid var(--border-card)',
            boxShadow: 'var(--shadow-popup)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            background:
              theme === 'dark'
                ? 'rgba(26, 38, 57, 0.85)'
                : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxSizing: 'border-box',
          }}
        >
          {/* Role Selection Tabs */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.45rem',
              }}
            >
              Select Role
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.4rem',
                background: 'var(--bg-tertiary)',
                padding: '0.3rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = selectedRole === acc.role;
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleRoleSelect(acc)}
                    style={{
                      padding: '0.65rem 0.4rem',
                      border: isSelected ? '1.5px solid var(--accent-cyan)' : '1px solid transparent',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--bg-card)' : 'transparent',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      boxShadow: isSelected ? '0 2px 10px rgba(56, 189, 248, 0.2)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon
                      size={18}
                      style={{
                        color: isSelected ? 'var(--accent-cyan)' : 'inherit',
                      }}
                    />
                    <span>{acc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleLoginSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
          >
            {/* Email Address / ID */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.4rem',
                }}
              >
                {selectedRole === 'STUDENT' ? 'Student ID / Email Address' : 'Email Address'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    color: 'var(--accent-cyan)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@university.edu"
                  className="input"
                  style={{
                    paddingLeft: '2.8rem',
                    paddingRight: '1rem',
                    minHeight: '48px',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.4rem',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    color: 'var(--accent-cyan)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password"
                  className="input"
                  style={{
                    paddingLeft: '2.8rem',
                    paddingRight: '2.8rem',
                    minHeight: '48px',
                    fontSize: '0.95rem',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                minHeight: '48px',
                fontSize: '0.98rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.35rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span>{isSubmitting ? 'Logging in...' : 'Login'}</span>
              <ArrowRight size={17} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
