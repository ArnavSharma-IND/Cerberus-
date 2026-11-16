import React, { useState } from 'react';
import {
  Activity,
  Shield,
  Search,
  Filter,
  Eye,
  Zap,
  Clock,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  GitFork,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileCode,
  Brain,
  Hash
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import { ToolCallEvent } from '../../types';
import { ThreeFirewallCanvas } from '../../components/ThreeFirewallCanvas';
import { Card, CardHeader, CardContent, Badge, Button, Drawer } from '../../components/ui';

export const MonitoringPage: React.FC = () => {
  const { events, isStreaming, injectAttack } = useTelemetry();
  const [selectedEvent, setSelectedEvent] = useState<ToolCallEvent | null>(events[0] || null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filterDecision, setFilterDecision] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeRingFocus, setActiveRingFocus] = useState<'all' | 'taint' | 'canary' | 'shield' | 'dlp' | 'challenge'>('all');

  const filteredEvents = events.filter((e) => {
    const matchesDecision =
      filterDecision === 'all' ||
      (filterDecision === 'blocked' && (e.decision === 'block' || e.decision === 'quarantine')) ||
      (filterDecision === 'challenge' && e.decision === 'challenge') ||
      (filterDecision === 'allow' && (e.decision === 'allow' || !e.decision));

    const matchesSearch =
      !searchQuery ||
      e.event_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.agent_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.session_id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDecision && matchesSearch;
  });

  const handleRowClick = (evt: ToolCallEvent) => {
    setSelectedEvent(evt);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 3D WebGL Behavioral Neural Firewall Core Showcase */}
      <Card className="overflow-hidden border-lavender-200">
        <div className="p-4 bg-white border-b border-lavender-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lavender-100 border border-lavender-200 flex items-center justify-center text-lavender-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lavender-900 text-sm">
                  3D WebGL Neural Behavioral Core
                </h2>
                <Badge variant="primary" size="xs">Three.js Engine</Badge>
              </div>
              <p className="text-xs text-lavender-text-secondary">
                Real-time 5-Ring defense visualization with particle telemetry and orbital radar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-lavender-text-muted">Focus Ring:</span>
            {(['all', 'taint', 'canary', 'shield', 'dlp', 'challenge'] as const).map((ring) => (
              <button
                key={ring}
                onClick={() => setActiveRingFocus(ring)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  activeRingFocus === ring
                    ? 'bg-lavender-600 text-white shadow-sm'
                    : 'bg-lavender-100 text-lavender-800 hover:bg-lavender-200'
                }`}
              >
                {ring.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Canvas Container */}
        <div className="relative h-[340px] sm:h-[400px] w-full bg-[#0A0D18]">
          <ThreeFirewallCanvas
            events={events}
            activeFeatureFocus={activeRingFocus}
            onSelectFeature={(feat) => setActiveRingFocus(feat)}
            onTriggerSimulatedAttack={(type) => injectAttack(type)}
          />
        </div>
      </Card>

      {/* Live SSE Stream & Event Interception Table */}
      <Card>
        <div className="p-5 border-b border-lavender-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
            </div>
            <div>
              <h3 className="font-semibold text-lavender-900 text-base">
                Live Intercepted MCP Events Feed
              </h3>
              <p className="text-xs text-lavender-text-secondary">
                {isStreaming ? 'Streaming live server-sent events (SSE)' : 'Connected to interceptor socket'} • {filteredEvents.length} events matching filter
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-lavender-400" />
              <input
                type="text"
                placeholder="Search event, tool, agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-lavender-50 border border-lavender-200 rounded-lg text-lavender-900 focus:outline-none focus:ring-2 focus:ring-lavender-500/30 w-52"
              />
            </div>

            <div className="flex items-center gap-1 bg-lavender-100 p-1 rounded-lg">
              {['all', 'allow', 'challenge', 'blocked'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterDecision(tab)}
                  className={`px-2.5 py-1 text-xs rounded font-medium capitalize transition-all ${
                    filterDecision === tab
                      ? 'bg-white text-lavender-900 shadow-sm font-semibold'
                      : 'text-lavender-700 hover:text-lavender-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-lavender-50/70 border-b border-lavender-100 text-lavender-text-muted font-semibold">
                <th className="py-3 px-4">Event ID / Time</th>
                <th className="py-3 px-4">Agent & Session</th>
                <th className="py-3 px-4">Tool Target</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Defense Findings</th>
                <th className="py-3 px-4 text-right">Forensics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lavender-100/60">
              {filteredEvents.map((evt) => {
                const isBlocked = evt.decision === 'block' || evt.decision === 'quarantine';
                const isChallenge = evt.decision === 'challenge';
                const isAllow = evt.decision === 'allow' || !evt.decision;

                return (
                  <tr
                    key={evt.event_id}
                    onClick={() => handleRowClick(evt)}
                    className="hover:bg-lavender-50/70 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-medium text-lavender-900">{evt.event_id}</div>
                      <div className="text-[10px] text-lavender-text-muted">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-lavender-900">{evt.agent_id}</div>
                      <div className="text-[10px] font-mono text-lavender-text-muted">{evt.session_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono px-2 py-0.5 rounded bg-lavender-100 text-lavender-800 border border-lavender-200">
                        {evt.tool_name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={isBlocked ? 'block' : isChallenge ? 'challenge' : 'allow'}
                        size="xs"
                        hasDot
                      >
                        {evt.decision ? evt.decision.toUpperCase() : 'ALLOW'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span
                          className={`font-bold ${
                            (evt.risk_score || 0) >= 0.7
                              ? 'text-rose-600'
                              : (evt.risk_score || 0) >= 0.4
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {((evt.risk_score || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-sm truncate text-lavender-text-secondary">
                      {evt.taint_tags && evt.taint_tags.length > 0 && (
                        <span className="mr-1.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium text-[10px]">
                          Taint: {evt.taint_tags[0]}
                        </span>
                      )}
                      {evt.canary_tripped && (
                        <span className="mr-1.5 px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 font-medium text-[10px]">
                          Canary Hit
                        </span>
                      )}
                      {evt.dlp_violation && (
                        <span className="mr-1.5 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium text-[10px]">
                          DLP Quota
                        </span>
                      )}
                      {evt.response_inspection?.inspected && (
                        <span className="mr-1.5 px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 font-medium text-[10px]">
                          Shield Inspected
                        </span>
                      )}
                      {!evt.taint_tags?.length && !evt.canary_tripped && !evt.dlp_violation && !evt.response_inspection?.inspected && (
                        <span className="text-slate-500 font-mono text-[11px]">
                          {evt.risk_factors[0] || 'Nominal behavior'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="xs" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        Inspect
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Forensics Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <span>Event Forensics: {selectedEvent?.event_id}</span>
            {selectedEvent && (
              <Badge
                variant={
                  selectedEvent.decision === 'block'
                    ? 'block'
                    : selectedEvent.decision === 'challenge'
                    ? 'challenge'
                    : 'allow'
                }
                size="xs"
              >
                {selectedEvent.decision ? selectedEvent.decision.toUpperCase() : 'ALLOW'}
              </Badge>
            )}
          </div>
        }
        subtitle={`Session: ${selectedEvent?.session_id} • Intercepted at ${selectedEvent ? new Date(selectedEvent.timestamp).toLocaleString() : ''}`}
        width="2xl"
      >
        {selectedEvent && (
          <div className="space-y-6 text-xs">
            {/* Decision Banner */}
            <div
              className={`p-4 rounded-xl border ${
                selectedEvent.decision === 'block'
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : selectedEvent.decision === 'challenge'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="font-bold text-sm mb-1">
                Enforced Decision: {selectedEvent.decision?.toUpperCase() || 'ALLOW'}
              </div>
              <p className="leading-relaxed">
                {selectedEvent.decision_reason ||
                  (selectedEvent.risk_score && selectedEvent.risk_score >= 0.7
                    ? 'Blocked by deterministic policy gate.'
                    : 'Operation allowed within nominal behavioral thresholds.')}
              </p>
            </div>

            {/* 4-Model Ensemble Score Breakdown */}
            <div className="bg-lavender-50/60 p-4 rounded-xl border border-lavender-200 space-y-3">
              <div className="font-semibold text-lavender-900 text-sm flex items-center justify-between">
                <span>4-Model Ensemble Weights & Scores</span>
                <span className="font-mono font-bold text-sm">
                  Composite: {((selectedEvent.risk_score || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 bg-white rounded-lg border border-lavender-200 shadow-sm">
                  <div className="text-[10px] text-lavender-text-muted">Rule Weight (45%)</div>
                  <div className="text-base font-bold text-lavender-900">
                    {(((selectedEvent.model_scores?.rule ?? (selectedEvent.decision === 'block' ? 1.0 : 0.1)) * 100)).toFixed(0)}%
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-lavender-200 shadow-sm">
                  <div className="text-[10px] text-lavender-text-muted">Markov (25%)</div>
                  <div className="text-base font-bold text-lavender-900">
                    {(((selectedEvent.model_scores?.markov ?? 0.28) * 100)).toFixed(0)}%
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-lavender-200 shadow-sm">
                  <div className="text-[10px] text-lavender-text-muted">Isolation Forest (15%)</div>
                  <div className="text-base font-bold text-lavender-900">
                    {(((selectedEvent.model_scores?.isolation ?? 0.19) * 100)).toFixed(0)}%
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-lavender-200 shadow-sm">
                  <div className="text-[10px] text-lavender-text-muted">Transformer (15%)</div>
                  <div className="text-base font-bold text-lavender-900">
                    {(((selectedEvent.model_scores?.transformer ?? 0.24) * 100)).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Taint Lineage Provenance DAG Section */}
            {selectedEvent.taint_tags && selectedEvent.taint_tags.length > 0 && (
              <div className="border border-purple-200 bg-purple-50/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-900 text-sm flex items-center gap-1.5">
                    <GitFork className="w-4 h-4 text-purple-600" />
                    Taint Lineage DAG (3-Hop Provenance Track)
                  </span>
                  <Badge variant="taint" size="xs">Deterministic 1.0 BLOCK</Badge>
                </div>
                <p className="text-xs text-purple-950/80">
                  Data originating from untrusted origin tagged <span className="font-mono font-bold">UNTRUSTED_WEB</span> was cryptographically tracked into outbound egress parameter.
                </p>

                {/* 3-Step DAG Visualizer */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-purple-200">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <div className="font-semibold text-purple-900">Source: GitHub Issue Comment #74</div>
                      <div className="font-mono text-[10px] text-slate-500">
                        Tag: UNTRUSTED_WEB • SHA-256: 9f86d081884c7d659a2feaa0c55ad015
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center text-purple-400">↓ Propagated across tool call arguments</div>

                  <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-purple-200">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <div className="font-semibold text-purple-900">Transformation: text_summarizer</div>
                      <div className="font-mono text-[10px] text-slate-500">
                        Child Hash: c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa38
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center text-rose-500 font-bold">↓ Egress Sink Intercepted (BLOCK)</div>

                  <div className="flex items-start gap-3 p-2.5 bg-rose-50 rounded-lg border border-rose-300">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <div className="font-semibold text-rose-900">Egress Sink: http_post</div>
                      <div className="text-[10px] text-rose-800">
                        Destination: collector.attacker-c2.io • Statistical Mimicry score (0.24) overridden by deterministic 1.0 BLOCK.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LLM Adjudicator Card */}
            {selectedEvent.response_inspection && (
              <div className="border border-sky-200 bg-sky-50/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sky-900 text-sm flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-sky-600" />
                    LLM Adjudicator & Response Shield
                  </span>
                  <Badge variant="shield" size="xs">
                    Verdict: {selectedEvent.response_inspection.adjudicator_verdict || 'BLOCK'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-white rounded-lg border border-sky-200">
                    <div className="text-[10px] text-slate-500">Confidence Score</div>
                    <div className="text-base font-bold text-sky-900">
                      {((selectedEvent.response_inspection.confidence || 0.98) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-sky-200">
                    <div className="text-[10px] text-slate-500">Sanitization State</div>
                    <div className="text-base font-bold text-emerald-600">
                      {selectedEvent.response_inspection.sanitized ? 'Payload Sanitized' : 'Raw Intercepted'}
                    </div>
                  </div>
                </div>
                {selectedEvent.response_inspection.detected_heuristics && (
                  <div>
                    <span className="font-medium text-sky-900">Detected Injection Delimiters:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedEvent.response_inspection.detected_heuristics.map((h, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono text-[10px]">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tool Arguments JSON Inspector */}
            <div className="space-y-2">
              <span className="font-semibold text-lavender-900 text-sm flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-lavender-600" />
                Tool Call Parameters
              </span>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto max-h-52 leading-relaxed">
                {JSON.stringify(selectedEvent.parameters, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
