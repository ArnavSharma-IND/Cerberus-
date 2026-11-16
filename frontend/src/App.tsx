import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { EventStreamView } from './components/EventStreamView';
import { AttackChainView } from './components/AttackChainView';
import { PolicyManagerView } from './components/PolicyManagerView';
import { BaselineView } from './components/BaselineView';
import { AuditLedgerView } from './components/AuditLedgerView';
import { TelemetryView } from './components/TelemetryView';
import { ChallengeInboxView } from './components/ChallengeInboxView';
import { AttackReplayTheater } from './components/AttackReplayTheater';
import { SecurityMatrixView } from './components/SecurityMatrixView';
import { AgentIdentityView } from './components/AgentIdentityView';
import { ToolCallEvent, MetricsSummary, HealthStatus } from './types';
import {
  fetchMetrics,
  fetchHealth,
  fetchEvents,
  fetchChallenges,
  subscribeToEventStream,
  dispatchLiveMcpCall,
  SEEDED_EVENTS
} from './api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('events');
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [events, setEvents] = useState<ToolCallEvent[]>(SEEDED_EVENTS);
  const [pendingChallengesCount, setPendingChallengesCount] = useState<number>(2);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, h, evs, chs] = await Promise.all([
        fetchMetrics().catch(() => null),
        fetchHealth().catch(() => null),
        fetchEvents(100).catch(() => []),
        fetchChallenges().catch(() => [])
      ]);
      if (m) setMetrics(m);
      if (h) setHealth(h);
      if (evs && evs.length > 0) setEvents(evs);
      if (chs) {
        setPendingChallengesCount(chs.filter((c) => c.status === 'pending').length);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    // Subscribe to live SSE events
    const unsubscribe = subscribeToEventStream((newEvent) => {
      setIsStreaming(true);
      setEvents((prev) => {
        if (prev.some((e) => e.event_id === newEvent.event_id)) return prev;
        return [newEvent, ...prev].slice(0, 200);
      });
      if (newEvent.decision === 'challenge') {
        setPendingChallengesCount((prev) => prev + 1);
      }
    });

    // Refresh telemetry every 10 seconds
    const interval = setInterval(() => {
      fetchMetrics().then((m) => m && setMetrics(m)).catch(() => {});
      fetchHealth().then((h) => h && setHealth(h)).catch(() => {});
      fetchChallenges()
        .then((chs) => setPendingChallengesCount(chs.filter((c) => c.status === 'pending').length))
        .catch(() => {});
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [loadInitialData]);

  const handleInjectAttack = async (type: 'taint' | 'canary' | 'shield' | 'dlp' | 'challenge') => {
    const template = SEEDED_EVENTS.find((e) =>
      type === 'taint'
        ? e.taint_tags && e.taint_tags.length > 0
        : type === 'canary'
        ? e.canary_tripped
        : type === 'shield'
        ? e.response_inspection?.inspected
        : type === 'dlp'
        ? e.dlp_violation
        : e.decision === 'challenge'
    ) || SEEDED_EVENTS[0];

    const synthetic: ToolCallEvent = {
      ...template,
      event_id: `evt-${type}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString()
    };

    setEvents((prev) => [synthetic, ...prev]);

    try {
      await dispatchLiveMcpCall({
        agent_id: synthetic.agent_id,
        session_id: synthetic.session_id,
        tool_name: synthetic.tool_name,
        arguments: synthetic.parameters
      });
    } catch {
      // Offline preview fallback handled by local state injection
    }
  };

  return (
    <div className="min-h-screen bg-soc-bg tactical-grid text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar
        metrics={metrics}
        health={health}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isStreaming={isStreaming}
        onRefresh={loadInitialData}
        loading={loading}
        pendingChallengesCount={pendingChallengesCount}
        onInjectAttack={handleInjectAttack}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'events' && (
          <EventStreamView
            events={events}
            isStreaming={isStreaming}
            onInjectAttack={handleInjectAttack}
            onNavigateTab={setActiveTab}
          />
        )}
        {activeTab === 'challenges' && <ChallengeInboxView />}
        {activeTab === 'timeline' && <AttackChainView events={events} />}
        {activeTab === 'theater' && <AttackReplayTheater />}
        {activeTab === 'scanners' && <SecurityMatrixView />}
        {activeTab === 'identity' && <AgentIdentityView />}
        {activeTab === 'policies' && <PolicyManagerView />}
        {activeTab === 'baselines' && <BaselineView />}
        {activeTab === 'audit' && <AuditLedgerView />}
        {activeTab === 'telemetry' && (
          <TelemetryView metrics={metrics} health={health} events={events} />
        )}
      </main>

      <footer className="border-t border-slate-800/80 py-4 text-center text-xs font-mono text-slate-500 bg-[#05070B]">
        Cerberus v2.0 MCP Behavioral Firewall • 5-Pillar Zero-Trust Runtime Protection for Autonomous Agents
      </footer>
    </div>
  );
};

export default App;
