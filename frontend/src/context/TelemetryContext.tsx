import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ToolCallEvent, MetricsSummary, HealthStatus } from '../types';
import {
  fetchMetrics,
  fetchHealth,
  fetchEvents,
  fetchChallenges,
  subscribeToEventStream,
  dispatchLiveMcpCall,
  SEEDED_EVENTS
} from '../api';

interface TelemetryContextType {
  events: ToolCallEvent[];
  metrics: MetricsSummary | null;
  health: HealthStatus | null;
  pendingChallengesCount: number;
  isStreaming: boolean;
  loading: boolean;
  refreshData: () => Promise<void>;
  injectAttack: (type: 'taint' | 'canary' | 'shield' | 'dlp' | 'challenge') => Promise<void>;
  decrementChallengeCount: () => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<ToolCallEvent[]>(SEEDED_EVENTS);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [pendingChallengesCount, setPendingChallengesCount] = useState<number>(2);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshData = useCallback(async () => {
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
    refreshData();

    // Subscribe to SSE event stream
    const unsubscribe = subscribeToEventStream((newEvent) => {
      setIsStreaming(true);
      setEvents((prev) => {
        if (prev.some((e) => e.event_id === newEvent.event_id)) return prev;
        return [newEvent, ...prev].slice(0, 300);
      });
      if (newEvent.decision === 'challenge') {
        setPendingChallengesCount((prev) => prev + 1);
      }
    });

    // 10-second heartbeat
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
  }, [refreshData]);

  const injectAttack = useCallback(
    async (type: 'taint' | 'canary' | 'shield' | 'dlp' | 'challenge') => {
      const template =
        SEEDED_EVENTS.find((e) =>
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
        // Handled locally
      }
    },
    []
  );

  const decrementChallengeCount = useCallback(() => {
    setPendingChallengesCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <TelemetryContext.Provider
      value={{
        events,
        metrics,
        health,
        pendingChallengesCount,
        isStreaming,
        loading,
        refreshData,
        injectAttack,
        decrementChallengeCount
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
