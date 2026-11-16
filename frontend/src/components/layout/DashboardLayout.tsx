import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Users,
  BrainCircuit,
  FileCode2,
  GitFork,
  Flame,
  ShieldCheck,
  Inbox,
  KeyRound,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  Zap,
  Radio,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { CerberusLogo } from '../brand/CerberusLogo';
import { Badge, Button, ErrorBoundary } from '../ui';

interface NavItem {
  id: string;
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  highlight?: boolean;
}

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { pendingChallengesCount, isStreaming, injectAttack } = useTelemetry();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [injecting, setInjecting] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleInject = async (type: 'taint' | 'canary' | 'shield' | 'dlp' | 'challenge') => {
    setInjecting(type);
    try {
      await injectAttack(type);
    } finally {
      setTimeout(() => setInjecting(null), 800);
    }
  };

  const navItems: NavItem[] = [
    { id: 'overview', name: 'Overview', path: '/dashboard/overview', icon: LayoutDashboard },
    { id: 'monitoring', name: 'Live Monitoring', path: '/dashboard/monitoring', icon: Activity },
    { id: 'agents', name: 'Agents', path: '/dashboard/agents', icon: Users },
    { id: 'behavior', name: 'Behavioural Intelligence', path: '/dashboard/behavior', icon: BrainCircuit },
    { id: 'policies', name: 'Policy Management', path: '/dashboard/policies', icon: FileCode2 },
    { id: 'incidents', name: 'Incidents & Taint DAG', path: '/dashboard/incidents', icon: GitFork },
    { id: 'testing', name: 'Testing & Attack Theater', path: '/dashboard/testing', icon: Flame },
    { id: 'matrix', name: 'Security Matrix', path: '/dashboard/matrix', icon: ShieldCheck },
    {
      id: 'approvals',
      name: 'Approval Inbox',
      path: '/dashboard/approvals',
      icon: Inbox,
      badgeCount: pendingChallengesCount,
      highlight: pendingChallengesCount > 0
    },
    { id: 'audit', name: 'Audit & Integrity', path: '/dashboard/audit', icon: KeyRound },
    { id: 'analytics', name: 'Performance Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    { id: 'settings', name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-lavender-50 lavender-grid flex flex-col antialiased selection:bg-lavender-500/20 selection:text-lavender-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-lavender-100 shadow-lavender-sm">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-lavender-text-secondary hover:bg-lavender-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div
              onClick={() => navigate('/dashboard/overview')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <CerberusLogo size={38} glow />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-lg text-lavender-900 tracking-tight">
                    CERBERUS
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-lavender-100 text-lavender-700 border border-lavender-200">
                    SOC v2.0
                  </span>
                </div>
                <p className="text-[11px] text-lavender-text-muted hidden sm:block">
                  Runtime Behavioral Firewall for Autonomous Agents
                </p>
              </div>
            </div>
          </div>

          {/* Middle: Live Cluster Telemetry Status & Attack Injection Bar */}
          <div className="hidden xl:flex items-center gap-3">
            {/* Live SSE Streaming Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{isStreaming ? 'Live SSE Stream Active' : 'Cluster Interceptor Connected'}</span>
            </div>

            {/* Mode & Fail-Closed Gate Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lavender-100 border border-lavender-200 text-xs text-lavender-800 font-medium">
              <Lock className="w-3.5 h-3.5 text-lavender-600" />
              <span>Enforce Mode • Fail-Closed</span>
            </div>

            {/* Quick Attack Injection Tooling */}
            <div className="flex items-center gap-1.5 bg-lavender-100/60 p-1 rounded-lg border border-lavender-200/80">
              <span className="text-[10px] font-semibold text-lavender-700 px-1.5 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-lavender-600" /> Inject:
              </span>
              <button
                onClick={() => handleInject('taint')}
                disabled={!!injecting}
                className="px-2 py-1 text-[11px] font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 rounded border border-purple-200 transition-colors"
              >
                {injecting === 'taint' ? 'Injecting...' : 'Taint'}
              </button>
              <button
                onClick={() => handleInject('canary')}
                disabled={!!injecting}
                className="px-2 py-1 text-[11px] font-medium bg-pink-50 hover:bg-pink-100 text-pink-700 rounded border border-pink-200 transition-colors"
              >
                {injecting === 'canary' ? 'Injecting...' : 'Canary'}
              </button>
              <button
                onClick={() => handleInject('shield')}
                disabled={!!injecting}
                className="px-2 py-1 text-[11px] font-medium bg-sky-50 hover:bg-sky-100 text-sky-700 rounded border border-sky-200 transition-colors"
              >
                {injecting === 'shield' ? 'Injecting...' : 'Shield'}
              </button>
              <button
                onClick={() => handleInject('dlp')}
                disabled={!!injecting}
                className="px-2 py-1 text-[11px] font-medium bg-orange-50 hover:bg-orange-100 text-orange-700 rounded border border-orange-200 transition-colors"
              >
                {injecting === 'dlp' ? 'Injecting...' : 'DLP'}
              </button>
              <button
                onClick={() => handleInject('challenge')}
                disabled={!!injecting}
                className="px-2 py-1 text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 transition-colors"
              >
                {injecting === 'challenge' ? 'Injecting...' : 'Challenge'}
              </button>
            </div>
          </div>

          {/* Right: Operator & Quick Links */}
          <div className="flex items-center gap-3">
            {/* Pending Approvals Quick Pill */}
            {pendingChallengesCount > 0 && (
              <NavLink
                to="/dashboard/approvals"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                <span>{pendingChallengesCount} Pending Approval{pendingChallengesCount > 1 ? 's' : ''}</span>
              </NavLink>
            )}

            {/* Operator Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-lavender-200">
              <div className="w-8 h-8 rounded-full bg-lavender-200 border border-lavender-300 flex items-center justify-center font-bold text-xs text-lavender-800 uppercase">
                {user?.username ? user.username.slice(0, 2) : 'OP'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-lavender-900 leading-tight">
                  {user?.username || 'Operator'}
                </div>
                <div className="text-[10px] text-lavender-text-muted capitalize">
                  {user?.role || 'SOC Lead'}
                </div>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-lavender-text-secondary hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-6">
          <div className="bg-white border border-lavender-100 shadow-lavender rounded-2xl p-3 flex flex-col gap-1 sticky top-24">
            <div className="px-3 py-2 text-[11px] font-semibold text-lavender-text-muted uppercase tracking-wider">
              SOC Command Console
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path === '/dashboard/overview' && location.pathname === '/dashboard');

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-lavender-600 text-white shadow-lavender shadow-sm font-semibold'
                      : 'text-lavender-text-secondary hover:text-lavender-900 hover:bg-lavender-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-white' : 'text-lavender-400 group-hover:text-lavender-600'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </NavLink>
              );
            })}

            <div className="my-2 border-t border-lavender-100" />

            <div className="px-3 py-1.5 text-[11px] font-semibold text-lavender-text-muted uppercase tracking-wider">
              Public & Threat Lab
            </div>
            <NavLink
              to="/"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-lavender-text-secondary hover:text-lavender-900 hover:bg-lavender-50 group"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 text-lavender-400 group-hover:text-lavender-600" />
                <span>Public Portal</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-lavender-300 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
            <NavLink
              to="/threat-lab"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-lavender-text-secondary hover:text-lavender-900 hover:bg-lavender-50 group"
            >
              <div className="flex items-center gap-3">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Threat Lab</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-lavender-300 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
            <NavLink
              to="/docs"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-lavender-text-secondary hover:text-lavender-900 hover:bg-lavender-50 group"
            >
              <div className="flex items-center gap-3">
                <FileCode2 className="w-4 h-4 text-lavender-400 group-hover:text-lavender-600" />
                <span>API & Docs</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-lavender-300 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
          </div>
        </aside>

        {/* Mobile Sidebar Modal */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-white h-full shadow-2xl p-4 flex flex-col gap-1 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-lavender-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-lavender-600" />
                  <span className="font-bold text-lavender-900">CERBERUS SOC</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-lavender-text-muted hover:bg-lavender-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                        isActive
                          ? 'bg-lavender-600 text-white'
                          : 'text-lavender-text-secondary hover:bg-lavender-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          {item.badgeCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0">
          <ErrorBoundary fallbackTitle="SOC Console View Error">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
