import React, { useState } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Eye,
  GitBranch,
  X,
  Cpu,
  Flame,
  Sparkles,
  FileWarning,
  Fingerprint,
  Gauge,
  ShieldBan,
  FileCode,
  Key
} from 'lucide-react';
import { ToolCallEvent } from '../types';
import { ThreeFirewallCanvas } from './ThreeFirewallCanvas';

interface EventStreamViewProps {
  events: ToolCallEvent[];
  isStreaming: boolean;
  onInjectAttack?: (type: 'taint' | 'canary' | 'shield' | 'dlp' | 'challenge') => void;
  onNavigateTab?: (tab: string) => void;
}

export const EventStreamView: React.FC<EventStreamViewProps> = ({
  events,
  isStreaming,
  onInjectAttack,
  onNavigateTab
}) => {
  const [selectedEvent, setSelectedEvent] = useState<ToolCallEvent | null>(events[0] || null);
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = events.filter((ev) => {
    const matchesDecision =
      filterDecision === 'ALL' || (ev.decision || 'allow').toUpperCase() === filterDecision;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      ev.tool_name.toLowerCase().includes(q) ||
      ev.agent_id.toLowerCase().includes(q) ||
      ev.session_id.toLowerCase().includes(q) ||
      (ev.owasp_tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (ev.taint_tags || []).some((t) => t.toLowerCase().includes(q));
    return matchesDecision && matchesQuery;
  });

  const decisionBadge = (decision?: string | null) => {
    const d = (decision || 'allow').toLowerCase();
    if (d === 'block')
      return 'bg-rose-500/15 text-rose-300 border-rose-500/40 glow-danger';
    if (d === 'quarantine')
      return 'bg-pink-500/20 text-pink-300 border-pink-500/50 glow-canary';
    if (d === 'challenge')
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40 glow-warning';
    if (d === 'flag')
      return 'bg-sky-500/15 text-sky-300 border-sky-500/40';
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
  };

  return (
    <div className="space-y-6">
      {/* Interactive 3D Neural Behavioral Firewall & Provenance Topology */}
      <ThreeFirewallCanvas
        events={events}
        onTriggerSimulatedAttack={onInjectAttack}
        onSelectFeature={(feat) => {
          if (feat === 'taint') {
            const match = events.find((e) => (e.taint_tags && e.taint_tags.length > 0));
            if (match) setSelectedEvent(match);
          } else if (feat === 'canary') {
            const match = events.find((e) => e.canary_tripped);
            if (match) setSelectedEvent(match);
          } else if (feat === 'shield') {
            const match = events.find((e) => e.response_inspection?.inspected);
            if (match) setSelectedEvent(match);
          } else if (feat === 'dlp') {
            const match = events.find((e) => e.dlp_violation);
            if (match) setSelectedEvent(match);
          } else if (feat === 'challenge') {
            const match = events.find((e) => e.decision === 'challenge');
            if (match) setSelectedEvent(match);
          }
        }}
      />

      {/* Search & Filter Bar */}
      <div className="glass-panel rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools, agents, SHA-256 taint hashes, OWASP tags..."
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div className="flex items-center space-x-1 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {['ALL', 'ALLOW', 'CHALLENGE', 'FLAG', 'BLOCK', 'QUARANTINE'].map((dec) => (
              <button
                key={dec}
                onClick={() => setFilterDecision(dec)}
                className={`px-2.5 py-1 rounded-md border transition-all ${
                  filterDecision === dec
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {dec}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-400">
            Captured Events: <strong className="text-white">{filteredEvents.length}</strong>
          </span>
          <span className="flex items-center space-x-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isStreaming ? 'SSE Streaming' : 'Live Buffer Active'}</span>
          </span>
        </div>
      </div>

      {/* Main Split: Live Event Stream Table + Deep Forensics Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-2.5">
          {filteredEvents.map((ev) => {
            const isSelected = selectedEvent?.event_id === ev.event_id;
            const hasTaint = (ev.taint_tags && ev.taint_tags.length > 0) || (ev.owasp_tags || []).some((t) => t.includes('TAINT'));
            const hasDlp = ev.dlp_violation || (ev.owasp_tags || []).some((t) => t.includes('DLP'));
            const hasCanary = ev.canary_tripped || (ev.owasp_tags || []).some((t) => t.includes('ASI10'));
            const hasShield = ev.response_inspection?.inspected || (ev.owasp_tags || []).some((t) => t.includes('RESPONSE_SHIELD'));

            return (
              <div
                key={ev.event_id}
                onClick={() => setSelectedEvent(ev)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900/95 border-cyan-400/50 shadow-lg glow-cyan'
                    : 'bg-[#0A0E17]/90 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase border ${decisionBadge(ev.decision)}`}>
                      {ev.decision || 'ALLOW'}
                    </span>
                    <span className="font-mono text-sm font-semibold text-white">{ev.tool_name}</span>
                    <span className="text-xs font-mono text-slate-400">@{ev.tool_server}</span>
                  </div>

                  <div className="flex items-center space-x-2 font-mono text-xs">
                    {ev.raw_anomaly_score !== undefined && ev.raw_anomaly_score !== null && ev.raw_anomaly_score < 0.5 && ev.risk_score === 1.0 && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/40 text-purple-300 text-[10px]">
                        Mimicry {ev.raw_anomaly_score.toFixed(2)} → Override 1.00
                      </span>
                    )}
                    <span className={`font-bold ${
                      (ev.risk_score || 0) >= 0.85 ? 'text-rose-400' : (ev.risk_score || 0) >= 0.65 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      RISK {(ev.risk_score ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Feature Pill Badges: ⚠️ TAINT, DLP VIOLATION, 🍯 CANARY, 🔍 RESPONSE SHIELD, OWASP */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-400 mr-2">
                    Agent: <strong className="text-slate-200">{ev.agent_id}</strong> • Session: <strong className="text-slate-300">{ev.session_id}</strong>
                  </span>

                  {hasTaint && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/50 flex items-center space-x-1">
                      <span>⚠️ TAINT</span>
                      <span>({(ev.taint_tags || ['UNTRUSTED_WEB'])[0]})</span>
                    </span>
                  )}

                  {hasDlp && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/50">
                      DLP VIOLATION
                    </span>
                  )}

                  {hasCanary && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/50 flex items-center space-x-1">
                      <Key className="w-2.5 h-2.5 mr-0.5" />
                      <span>🍯 ASI10 CANARY TRIPPED</span>
                    </span>
                  )}

                  {hasShield && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/50">
                      🔍 RESPONSE SANITIZED
                    </span>
                  )}

                  {ev.owasp_tags && ev.owasp_tags.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30">
                      {t}
                    </span>
                  ))}
                </div>

                <p className="mt-2 text-xs text-slate-400 line-clamp-1">
                  {ev.decision_reason || ev.risk_factors[0] || 'Evaluated by Cerberus behavioral firewall.'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Event Details & Forensics Drawer */}
        <div className="lg:col-span-5">
          {selectedEvent ? (
            <div className="glass-panel rounded-xl p-5 sticky top-24 space-y-4 border border-slate-800/90">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono uppercase text-cyan-400">Event Forensics Drawer</span>
                    <span className="text-xs font-mono text-slate-500">#{selectedEvent.event_id}</span>
                  </div>
                  <h3 className="text-base font-bold font-mono text-white mt-0.5">
                    {selectedEvent.tool_name} <span className="text-xs text-slate-400">({selectedEvent.tool_server})</span>
                  </h3>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase border ${decisionBadge(selectedEvent.decision)}`}>
                  {selectedEvent.decision || 'ALLOW'}
                </span>
              </div>

              {/* Attribution Meta Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[10px]">AGENT</span>
                  <span className="text-slate-200 font-semibold">{selectedEvent.agent_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">SESSION</span>
                  <span className="text-slate-200 font-semibold truncate block">{selectedEvent.session_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">DESTINATION</span>
                  <span className="text-cyan-400 font-semibold truncate block">{selectedEvent.destination_domain || 'Internal (None)'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ENTROPY / SIZE</span>
                  <span className="text-slate-300 font-semibold">
                    {selectedEvent.parameter_entropy ? `${selectedEvent.parameter_entropy.toFixed(1)} bits` : 'N/A'} • {selectedEvent.parameter_size_bytes || 0}B
                  </span>
                </div>
              </div>

              {/* Enforcing Rule Fired */}
              {(selectedEvent.rule_fired || selectedEvent.decision_reason) && (
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono">
                  <div className="text-slate-400 text-[10px] flex items-center space-x-1 mb-0.5">
                    <FileCode className="w-3 h-3 text-cyan-400 mr-1" />
                    <span>Enforcing Rule / Policy Fired:</span>
                  </div>
                  <div className="text-rose-300 font-semibold">
                    {selectedEvent.rule_fired || selectedEvent.decision_reason}
                  </div>
                </div>
              )}

              {/* Feature 1: Upstream Taint & Provenance Lineage Card */}
              {selectedEvent.taint_lineage && selectedEvent.taint_lineage.length > 0 && (
                <div className="p-3.5 rounded-lg bg-purple-950/25 border border-purple-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-300 flex items-center space-x-1.5">
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>⚠️ UPSTREAM TAINT PROVENANCE LINEAGE</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
                      1.0 BLOCK OVERRIDE
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedEvent.taint_lineage.map((node) => (
                      <div key={node.hop} className="p-2 rounded bg-slate-950/90 border border-purple-500/25 text-xs font-mono">
                        <div className="flex items-center justify-between text-purple-200">
                          <span>Hop {node.hop}: {node.tool_name} ({node.source_type})</span>
                          <span className="text-[10px] text-slate-400">param: {node.parameter_key}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-1">
                          Hash: <span className="text-purple-300">{node.sha256_hash}</span>
                        </div>
                        {node.parent_hash && (
                          <div className="text-[10px] text-slate-500 truncate">
                            Parent: {node.parent_hash}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feature 3: Response Inspection & LLM Adjudicator Card */}
              {selectedEvent.response_inspection && (
                <div className="p-3.5 rounded-lg bg-sky-950/25 border border-sky-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-sky-300 flex items-center space-x-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>🔍 RESPONSE INSPECTION & LLM ADJUDICATOR</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Verdict: {selectedEvent.response_inspection.adjudicator_verdict} ({Math.round((selectedEvent.response_inspection.confidence || 0.96) * 100)}%)
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Prompt Injection Risk Score: <strong className="text-sky-300 font-mono">{selectedEvent.response_inspection.risk_score.toFixed(2)}</strong>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedEvent.response_inspection.detected_heuristics.map((h, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                        {h}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="p-2 rounded bg-rose-950/40 border border-rose-500/30 text-rose-200">
                      <span className="text-[10px] uppercase text-rose-400 block">Before (Raw Tool Output):</span>
                      {selectedEvent.response_inspection.original_snippet}
                    </div>
                    <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                      <span className="text-[10px] uppercase text-emerald-400 block">After (Sanitized Reflection):</span>
                      {selectedEvent.response_inspection.sanitized_snippet}
                    </div>
                  </div>
                </div>
              )}

              {/* Zero-Trust Redaction Vault Section */}
              {selectedEvent.redacted_fields && selectedEvent.redacted_fields.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono font-semibold text-amber-300">
                    <span className="flex items-center space-x-1">
                      <Fingerprint className="w-3.5 h-3.5 mr-1" />
                      <span>Zero-Trust Redaction Vault</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
                      {selectedEvent.redacted_fields.length} SCRUBBED
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedEvent.redacted_fields.map((f) => (
                      <span key={f} className="px-2 py-0.5 rounded bg-slate-950 text-amber-400 border border-amber-600/40 text-[11px] font-mono">
                        [REDACTED: {f}]
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 4-Detector Ensemble Breakdown */}
              {selectedEvent.model_scores && (
                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase text-slate-400">4-Model Ensemble Scores</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {Object.entries(selectedEvent.model_scores).map(([k, v]) => (
                      <div key={k} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <span className="uppercase text-slate-400">{k}</span>
                        <span className="text-cyan-300 font-bold">{Number(v).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Factors */}
              <div className="space-y-1.5">
                <div className="text-xs font-mono uppercase text-slate-400">Triggered Risk Factors</div>
                <ul className="space-y-1 text-xs text-slate-300 font-mono">
                  {selectedEvent.risk_factors.map((rf, i) => (
                    <li key={i} className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-rose-300">
                      • {rf}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Parameters */}
              <div>
                <div className="text-xs font-mono uppercase text-slate-400 mb-1">JSON-RPC Tool Arguments</div>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedEvent.parameters, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-8 text-center text-slate-400 text-sm">
              Select any event from the stream to inspect its SHA-256 taint provenance lineage, LLM adjudication diff, and 4-model score breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
