import React, { useState, useEffect } from 'react';
import {
  GitFork,
  Activity,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Hash,
  Terminal,
  Radio,
  Share2,
  Filter,
  Eye
} from 'lucide-react';
import { Card, CardHeader, CardContent, Badge, Button } from '../../components/ui';
import { fetchIncidents } from '../../services/api';
import { IncidentRecord } from '../../types';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [viewMode, setViewMode] = useState<'dag' | 'mitre'>('dag');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents().then((data) => {
      setIncidents(data);
      if (data.length > 0) setSelectedIncident(data[0]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-lavender-100 shadow-lavender p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-display font-bold text-lavender-900">
            Incidents & Taint Lineage Provenance
          </h1>
          <p className="text-xs text-lavender-text-secondary mt-1">
            Forensic analysis of multi-hop attack chains, MITRE Markov trajectories, and cryptographic taint DAGs.
          </p>
        </div>

        {/* Dual Mode View Switcher */}
        <div className="flex items-center gap-1 bg-lavender-100 p-1 rounded-xl border border-lavender-200">
          <button
            onClick={() => setViewMode('dag')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'dag'
                ? 'bg-white text-lavender-900 shadow-sm'
                : 'text-lavender-700 hover:text-lavender-900'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-purple-600" />
            <span>3-Step Taint Lineage DAG</span>
          </button>
          <button
            onClick={() => setViewMode('mitre')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'mitre'
                ? 'bg-white text-lavender-900 shadow-sm'
                : 'text-lavender-700 hover:text-lavender-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-lavender-600" />
            <span>MITRE Markov Chain</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Incident Selector & Forensics Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incidents List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold text-lavender-text-muted uppercase tracking-wider px-1">
            Active Forensic Incidents ({incidents.length})
          </div>
          {incidents.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;
            return (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-lavender-400 shadow-lavender-md ring-2 ring-lavender-500/20'
                    : 'bg-white/80 border-lavender-100 hover:border-lavender-200 shadow-lavender-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs text-lavender-900">{inc.id}</span>
                  <Badge
                    variant={
                      inc.severity === 'CRITICAL'
                        ? 'danger'
                        : inc.severity === 'HIGH'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="xs"
                  >
                    {inc.severity}
                  </Badge>
                </div>
                <h4 className="text-xs font-semibold text-lavender-900 line-clamp-1 mb-1">
                  {inc.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-lavender-text-muted mt-2">
                  <span className="font-mono">{inc.session_id}</span>
                  <Badge variant={inc.pillar.toLowerCase() as any} size="xs">
                    {inc.pillar}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Visualizer View (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedIncident && (
            <>
              {/* Incident Header Card */}
              <Card>
                <CardHeader
                  title={selectedIncident.title}
                  subtitle={`Session: ${selectedIncident.session_id} • Agent: ${selectedIncident.agent_id}`}
                  action={
                    <Badge variant={selectedIncident.status === 'QUARANTINED' ? 'quarantine' : 'danger'} size="sm">
                      {selectedIncident.status}
                    </Badge>
                  }
                />
                <CardContent className="space-y-4">
                  <p className="text-xs text-lavender-text-secondary leading-relaxed">
                    {selectedIncident.description}
                  </p>

                  <div className="p-3 bg-lavender-50 rounded-xl border border-lavender-200 space-y-2">
                    <span className="text-xs font-semibold text-lavender-900">
                      Remediation Enacted:
                    </span>
                    <p className="text-xs text-emerald-800 font-medium">
                      {selectedIncident.remediation}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* View 1: 3-Step Taint Lineage DAG */}
              {viewMode === 'dag' && (
                <Card>
                  <CardHeader
                    title="3-Step Cryptographic Taint Lineage DAG"
                    subtitle="Deterministic provenance hops defeating mimicry exfiltration"
                    icon={<GitFork className="w-4 h-4 text-purple-600" />}
                  />
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-purple-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                              1
                            </span>
                            Origin Source: Untrusted Web Ingestion
                          </span>
                          <Badge variant="taint" size="xs">Tag: UNTRUSTED_WEB</Badge>
                        </div>
                        <p className="text-xs text-purple-950/80">
                          External data from github_issues #74 ingested into agent context containing hidden exfiltration directive.
                        </p>
                        <div className="font-mono text-[10px] bg-white p-2 rounded border border-purple-200 text-purple-900">
                          Fingerprint: sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
                        </div>
                      </div>

                      <div className="flex items-center justify-center text-xs font-mono font-medium text-purple-500 py-1">
                        ↓ Internal Agent Propagation (Lineage Fingerprint Preserved)
                      </div>

                      {/* Step 2 */}
                      <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-purple-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                              2
                            </span>
                            Propagated Tool Call: format_repo_summary
                          </span>
                          <Badge variant="info" size="xs">Internal Transform</Badge>
                        </div>
                        <p className="text-xs text-purple-950/80">
                          Agent formatted issue summary text. Cerberus TaintTracker detected tainted substring and appended child lineage hop.
                        </p>
                        <div className="font-mono text-[10px] bg-white p-2 rounded border border-purple-200 text-purple-900">
                          Derived Hash: sha256:c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2
                        </div>
                      </div>

                      <div className="flex items-center justify-center text-xs font-mono font-bold text-rose-500 py-1">
                        ↓ Egress Sink Reached (Statistical Score 0.24 Overridden by Hard 1.0 BLOCK)
                      </div>

                      {/* Step 3 */}
                      <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-rose-950 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
                              3
                            </span>
                            Outbound Egress Sink: http_post
                          </span>
                          <Badge variant="danger" size="xs">DETERMINISTIC BLOCK</Badge>
                        </div>
                        <p className="text-xs text-rose-950/90 font-medium">
                          Agent attempted outbound call to external collector. Tainted lineage token triggered instantaneous fail-closed BLOCK.
                        </p>
                        <div className="font-mono text-[10px] bg-white p-2 rounded border border-rose-200 text-rose-900">
                          Destination: https://collector.attacker-c2.io/ingest • Lineage Match Confirmed
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* View 2: MITRE Markov Chain */}
              {viewMode === 'mitre' && (
                <Card>
                  <CardHeader
                    title="MITRE ATT&CK Markov Trajectory Graph"
                    subtitle="State sequence transition graph mapped to adversary tactics"
                    icon={<Activity className="w-4 h-4 text-lavender-600" />}
                  />
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 bg-lavender-50 rounded-xl border border-lavender-200">
                        <div className="text-[10px] text-lavender-text-muted">Tactic 1</div>
                        <div className="font-bold text-lavender-900 text-xs mt-1">Reconnaissance</div>
                        <div className="text-[11px] font-mono text-emerald-700 mt-0.5">P = 0.92</div>
                      </div>
                      <div className="p-3 bg-lavender-50 rounded-xl border border-lavender-200">
                        <div className="text-[10px] text-lavender-text-muted">Tactic 2</div>
                        <div className="font-bold text-lavender-900 text-xs mt-1">Indirect Injection</div>
                        <div className="text-[11px] font-mono text-amber-700 mt-0.5">P = 0.35</div>
                      </div>
                      <div className="p-3 bg-lavender-50 rounded-xl border border-lavender-200">
                        <div className="text-[10px] text-lavender-text-muted">Tactic 3</div>
                        <div className="font-bold text-lavender-900 text-xs mt-1">Credential Probe</div>
                        <div className="text-[11px] font-mono text-rose-600 mt-0.5">P = 0.02 (Anomaly)</div>
                      </div>
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                        <div className="text-[10px] text-rose-600 font-semibold">Tactic 4</div>
                        <div className="font-bold text-rose-900 text-xs mt-1">Exfiltration Sink</div>
                        <div className="text-[11px] font-mono text-rose-700 font-bold mt-0.5">BLOCKED</div>
                      </div>
                    </div>

                    <div className="p-4 bg-lavender-50/60 rounded-xl border border-lavender-200 text-xs space-y-2">
                      <span className="font-semibold text-lavender-900">Observed Trajectory Anomaly Score:</span>
                      <div className="font-mono text-sm font-bold text-rose-600">
                        Negative Log-Likelihood: -ln(P) = 8.42 (Exceeds threshold 3.20)
                      </div>
                      <p className="text-xs text-lavender-text-secondary leading-relaxed">
                        Transition from read_file to http_post with zero intermediate git/compiler commands represents a 99.8% outlier from calibrated baseline.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
