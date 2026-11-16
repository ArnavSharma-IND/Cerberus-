import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Lock,
  Unlock,
  AlertOctagon,
  RefreshCw,
  Radio,
  CheckSquare,
  Film,
  Grid,
  Key,
  TrendingUp,
  Cpu,
  Zap,
  Sparkles
} from 'lucide-react';
import { MetricsSummary, HealthStatus } from '../types';
import { HealthTimelineModal } from './HealthTimelineModal';

interface NavbarProps {
  metrics: MetricsSummary | null;
  health: HealthStatus | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isStreaming: boolean;
  onRefresh: () => void;
  loading: boolean;
  pendingChallengesCount?: number;
  onInjectAttack?: (type: 'taint' | 'canary' | 'shield' | 'dlp' | 'challenge') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  metrics,
  health,
  activeTab,
  setActiveTab,
  isStreaming,
  onRefresh,
  loading,
  pendingChallengesCount = 0,
  onInjectAttack
}) => {
  const [isHealthTimelineOpen, setIsHealthTimelineOpen] = useState(false);

  const tabs = [
    { id: 'events', label: 'Live Events & 3D Core', icon: Activity },
    {
      id: 'challenges',
      label: 'Approval Inbox',
      icon: CheckSquare,
      badge: pendingChallengesCount > 0 ? pendingChallengesCount : undefined
    },
    { id: 'timeline', label: 'Attack Chains & Taint DAG', icon: AlertOctagon },
    { id: 'theater', label: 'Attack Theater', icon: Film },
    { id: 'scanners', label: 'Security Matrix', icon: Grid },
    { id: 'identity', label: 'Agent Identity', icon: Key },
    { id: 'policies', label: 'Policy Engine', icon: ShieldAlert },
    { id: 'baselines', label: 'Baselines & Drift', icon: TrendingUp },
    { id: 'audit', label: 'Audit Ledger', icon: Lock },
    { id: 'telemetry', label: 'Telemetry & Benchmarks', icon: Radio }
  ];

  return (
    <>
      <header className="border-b border-slate-800/80 glass-panel sticky top-0 z-40 bg-[#05070B]/90 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Brand Identity */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center glow-cyan shadow-lg border border-cyan-400/30">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold tracking-widest text-white font-mono">CERBERUS</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                    v{health?.version || '2.0.0'}
                  </span>
                  <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
                    5-PILLAR ZERO-TRUST
                  </span>
                </div>
                <p className="text-xs text-slate-400">Autonomous AI Agent Behavioral Firewall & Provenance Engine</p>
              </div>
            </div>

            {/* Tactical Status Pills & Quick Attack Injector */}
            <div className="hidden lg:flex items-center space-x-2 text-xs font-mono">
              {onInjectAttack && (
                <button
                  onClick={() => onInjectAttack('taint')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-purple-500/40 text-purple-200 transition-all"
                  title="Inject live multi-hop MCP attack event into stream"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>INJECT LIVE MCP PACKET</span>
                </button>
              )}

              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800">
                <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
                <span className="text-slate-300">{isStreaming ? 'SSE STREAM' : 'ACTIVE TELEMETRY'}</span>
              </div>

              <div className="px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 text-slate-300">
                MODE: <span className="text-cyan-400 font-semibold">{metrics?.mode?.toUpperCase() || 'ENFORCE'}</span>
              </div>

              <button
                onClick={() => setIsHealthTimelineOpen(true)}
                className="group flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-colors"
              >
                <span>FAIL:</span>
                <span className={`font-semibold ${metrics?.fail_closed !== false ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {metrics?.fail_closed !== false ? 'CLOSED' : 'OPEN'}
                </span>
                <Cpu className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 ml-0.5" />
              </button>

              <button
                onClick={() => setIsHealthTimelineOpen(true)}
                className="px-2.5 py-1 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              >
                OPA: <span className="text-purple-400 font-semibold">{health?.status?.toUpperCase() || 'HEALTHY'}</span>
              </button>

              <div className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800">
                {metrics?.require_signed_identity !== false ? (
                  <>
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">HMAC SIGNED</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-400">PERMISSIVE</span>
                  </>
                )}
              </div>

              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                title="Refresh Telemetry"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Navigation Strip */}
          <div className="flex flex-wrap gap-1.5 py-2.5 border-t border-slate-800/70">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-slate-950">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <HealthTimelineModal
        isOpen={isHealthTimelineOpen}
        onClose={() => setIsHealthTimelineOpen(false)}
        health={health}
        metrics={metrics}
      />
    </>
  );
};
