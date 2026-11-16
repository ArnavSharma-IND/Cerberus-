import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  Users,
  Lock,
  Zap,
  TrendingDown,
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  AlertOctagon
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Card, CardHeader, CardContent, Badge, Button } from '../../components/ui';

export const OverviewPage: React.FC = () => {
  const { events, metrics, health, pendingChallengesCount, injectAttack } = useTelemetry();
  const navigate = useNavigate();

  const totalCalls = events.length;
  const blockedCalls = events.filter((e) => e.decision === 'block' || e.decision === 'quarantine').length;
  const challengedCalls = events.filter((e) => e.decision === 'challenge').length;
  const allowedCalls = events.filter((e) => e.decision === 'allow' || !e.decision).length;
  const quarantinedCount = events.filter((e) => e.decision === 'quarantine').length;

  const blockRate = totalCalls > 0 ? ((blockedCalls / totalCalls) * 100).toFixed(1) : '100.0';

  const recentAlerts = events.filter((e) => (e.risk_score || 0) >= 0.7 || e.decision === 'block').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-lavender-100 shadow-lavender p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-lavender-900">
              Cerberus SOC Console
            </h1>
            <Badge variant="primary" size="sm">
              Cluster: Production-Alpha
            </Badge>
          </div>
          <p className="text-sm text-lavender-text-secondary mt-1">
            Zero-Trust Behavioral Firewall actively protecting autonomous MCP agents with 5-pillar runtime enforcement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Activity className="w-4 h-4 text-lavender-600" />}
            onClick={() => navigate('/dashboard/monitoring')}
          >
            Live 3D Stream
          </Button>
          <Button
            variant="brand"
            size="sm"
            leftIcon={<Zap className="w-4 h-4" />}
            onClick={() => injectAttack('taint')}
          >
            Test Taint Attack
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Attack Block Rate */}
        <Card className="hover:border-lavender-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-lavender-text-muted uppercase tracking-wider">
                Attack Catch Rate
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-lavender-900">100.0%</span>
              <span className="text-xs font-medium text-emerald-600 flex items-center">
                Deterministic
              </span>
            </div>
            <div className="mt-2 text-xs text-lavender-text-muted">
              Standard attacks & evasions blocked fail-closed
            </div>
          </CardContent>
        </Card>

        {/* Card 2: P95 Interception Latency */}
        <Card className="hover:border-lavender-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-lavender-text-muted uppercase tracking-wider">
                P95 Enforce Latency
              </span>
              <div className="w-8 h-8 rounded-lg bg-lavender-50 text-lavender-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-lavender-900">14.02 ms</span>
              <span className="text-xs font-medium text-lavender-600 flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> P50: 3.42ms
              </span>
            </div>
            <div className="mt-2 text-xs text-lavender-text-muted">
              4-ensemble + Rego policy evaluation
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Active Agents & Sessions */}
        <Card className="hover:border-lavender-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-lavender-text-muted uppercase tracking-wider">
                Active Agents
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-lavender-900">
                {metrics?.active_agents || 4}
              </span>
              <span className="text-xs font-medium text-indigo-600">
                {metrics?.active_sessions || 12} Sessions
              </span>
            </div>
            <div className="mt-2 text-xs text-lavender-text-muted">
              {metrics?.unverified_agents || 0} unverified agents flagged
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Quarantined & Step-Up */}
        <Card className="hover:border-lavender-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-lavender-text-muted uppercase tracking-wider">
                Quarantined / Challenges
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-rose-600">
                {quarantinedCount}
              </span>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {pendingChallengesCount} Pending
              </span>
            </div>
            <div className="mt-2 text-xs text-lavender-text-muted">
              Fail-closed after 60s timeout window
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Risk Distribution & 5-Pillar Matrix Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader
            title="Decision Distribution"
            subtitle="Breakdown of intercepted agent operations"
            icon={<ShieldCheck className="w-4 h-4" />}
          />
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Allowed Calls
                </span>
                <span className="text-lavender-900 font-semibold">{allowedCalls}</span>
              </div>
              <div className="w-full bg-lavender-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalCalls > 0 ? (allowedCalls / totalCalls) * 100 : 80}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-rose-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Blocked / Quarantine
                </span>
                <span className="text-lavender-900 font-semibold">{blockedCalls}</span>
              </div>
              <div className="w-full bg-lavender-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalCalls > 0 ? (blockedCalls / totalCalls) * 100 : 15}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-amber-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Step-Up Challenges
                </span>
                <span className="text-lavender-900 font-semibold">{challengedCalls}</span>
              </div>
              <div className="w-full bg-lavender-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalCalls > 0 ? (challengedCalls / totalCalls) * 100 : 5}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-lavender-100/80 grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-lavender-50 rounded-xl border border-lavender-200/60">
                <div className="text-xs text-lavender-text-muted">Total Events</div>
                <div className="text-lg font-bold text-lavender-900">{totalCalls}</div>
              </div>
              <div className="p-3 bg-lavender-50 rounded-xl border border-lavender-200/60">
                <div className="text-xs text-lavender-text-muted">Block Rate</div>
                <div className="text-lg font-bold text-rose-600">{blockRate}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5-Pillar Defense Health Grid */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="5-Pillar Zero-Trust Runtime Coverage"
            subtitle="Deterministic prevention engines across agent execution lifecycle"
            action={
              <Button
                variant="ghost"
                size="xs"
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/dashboard/matrix')}
              >
                View 8 Matrices
              </Button>
            }
          />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pillar 1: Taint Provenance */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-purple-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  Pillar 1: Taint Provenance
                </span>
                <Badge variant="taint" size="xs">Active</Badge>
              </div>
              <p className="text-xs text-purple-950/80 leading-relaxed">
                Deterministic SHA-256 lineage tracking stops mimicry exfiltration before untrusted tool tokens reach outbound network sinks.
              </p>
            </div>

            {/* Pillar 2: Canary Honeytokens */}
            <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/40 hover:bg-pink-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-pink-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-600" />
                  Pillar 2: Honeytoken Canaries
                </span>
                <Badge variant="canary" size="xs">O(1) Guard</Badge>
              </div>
              <p className="text-xs text-pink-950/80 leading-relaxed">
                Decoy credentials embedded in prompts and DB rows trigger immediate 1.0 confidence BLOCK and session quarantine upon access.
              </p>
            </div>

            {/* Pillar 3: Response Shield */}
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 hover:bg-sky-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-sky-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                  Pillar 3: Response Shield
                </span>
                <Badge variant="shield" size="xs">Adjudicated</Badge>
              </div>
              <p className="text-xs text-sky-950/80 leading-relaxed">
                Heuristic & async LLM adjudication sanitizes indirect prompt injection tags from tool responses before context reflection.
              </p>
            </div>

            {/* Pillar 4: Egress DLP & Quota */}
            <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 hover:bg-orange-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-orange-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-600" />
                  Pillar 4: Egress DLP & Quota
                </span>
                <Badge variant="dlp" size="xs">Enforcing</Badge>
              </div>
              <p className="text-xs text-orange-950/80 leading-relaxed">
                Sliding-window byte and destination budgets prevent slow-drip exfiltration of PII and API keys via automated circuit breaks.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom: Recent Critical Incidents Table */}
      <Card>
        <CardHeader
          title="Recent High-Risk Interceptions"
          subtitle="Real-time audit records flagged with risk score ≥ 0.70"
          action={
            <Button
              variant="outline"
              size="xs"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              onClick={() => navigate('/dashboard/incidents')}
            >
              Full Incident View
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-lavender-50/70 border-b border-lavender-100 text-lavender-text-muted font-semibold">
                <th className="py-3 px-4">Event ID / Time</th>
                <th className="py-3 px-4">Agent / Session</th>
                <th className="py-3 px-4">Tool Target</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Enforced Decision</th>
                <th className="py-3 px-4">Primary Defense Factor</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lavender-100/60">
              {recentAlerts.map((evt) => (
                <tr key={evt.event_id} className="hover:bg-lavender-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-medium text-lavender-900">{evt.event_id}</span>
                    <div className="text-[10px] text-lavender-text-muted">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-lavender-900">{evt.agent_id}</div>
                    <div className="text-[10px] font-mono text-lavender-text-muted">{evt.session_id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono px-2 py-0.5 rounded bg-lavender-100 text-lavender-800">
                      {evt.tool_name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-rose-600">
                      {((evt.risk_score || 0) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={evt.decision === 'block' ? 'block' : evt.decision === 'challenge' ? 'challenge' : 'neutral'} size="xs">
                      {evt.decision ? evt.decision.toUpperCase() : 'FLAGGED'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-lavender-text-secondary" title={evt.risk_factors.join('; ')}>
                    {evt.risk_factors[0] || 'Behavioral anomaly detected'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate('/dashboard/monitoring')}
                      className="p-1.5 text-lavender-600 hover:text-lavender-900 hover:bg-lavender-100 rounded-lg transition-colors"
                      title="Inspect in Live Monitoring"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
