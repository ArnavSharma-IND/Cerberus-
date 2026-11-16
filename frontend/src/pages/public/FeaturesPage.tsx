import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  FileCode2,
  Lock,
  GitFork,
  Radio,
  ArrowRight,
  Database,
  KeyRound,
  Search,
  Filter,
  CheckCircle2,
  Code,
  Shield,
  Eye,
  Sliders,
  Sparkles,
  BarChart3,
  Network
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface FeatureItem {
  id: string;
  category: string;
  title: string;
  desc: string;
  longDesc: string;
  icon: React.ReactNode;
  owaspTag: string;
  latencySpec: string;
  codeSnippet?: string;
  dashboardRoute: string;
  highlight?: boolean;
}

export const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Capabilities' },
    { id: 'runtime', label: 'Runtime Protection' },
    { id: 'static', label: 'Static Security & Schemas' },
    { id: 'behavioral', label: 'Behavioral ML' },
    { id: 'policy', label: 'Dynamic OPA Policies' },
    { id: 'audit', label: 'Forensic Audit' },
    { id: 'hitl', label: 'HITL Approvals' },
    { id: 'analytics', label: 'Security Analytics' },
  ];

  const features: FeatureItem[] = [
    {
      id: 'taint-dag',
      category: 'runtime',
      title: 'Deterministic Taint & Provenance Tracking DAG',
      desc: 'Tags untrusted web, issue, and email inputs with SHA-256 tokens and enforces deterministic 1.0 BLOCK overrides when tainted data reaches outbound egress sinks.',
      longDesc: 'Statistical anomaly scorers can be bypassed by stealth mimicry attacks that format malicious data like normal developer commits. Cerberus maintains a directed acyclic graph (DAG) of SHA-256 fingerprints across multi-hop tool calls. If tainted data touches egress tools (http_post, send_email, slack_webhook), Cerberus overrides statistical scores and blocks the call deterministically.',
      icon: <GitFork className="w-5 h-5 text-purple-600" />,
      owaspTag: 'ASI01 • ASI06',
      latencySpec: '0.45 ms lookup overhead',
      codeSnippet: `// Taint Lineage Verification
const isTainted = taintTracker.isTainted(event.parameters);
if (isTainted && egressSinks.has(event.tool_name)) {
  return { decision: "BLOCK", score: 1.0, reason: "TAINT_EGRESS_VIOLATION" };
}`,
      dashboardRoute: '/dashboard/incidents',
      highlight: true
    },
    {
      id: 'canary-vault',
      category: 'runtime',
      title: 'ASI10 Canary Honeytoken Vault & Auto-Quarantine',
      desc: 'Generates deterministic honeytoken credentials (AWS keys, DB tokens, .env.canary) and triggers instant session quarantine on access.',
      longDesc: 'Any rogue agent or prompt injection attempting to harvest credentials from environment files or tool parameters encounters registered canary tokens (e.g. CERBERUS_CANARY_AWS_...). The O(1) canary scanner immediately flags a 1.0 confidence compromise, quarantining the session and alerting operators.',
      icon: <Lock className="w-5 h-5 text-pink-600" />,
      owaspTag: 'ASI10:Honeytokens',
      latencySpec: '< 0.1 ms hash lookup',
      codeSnippet: `canary = canary_detector.check_parameters(params)
if canary:
    quarantine_session(session_id)
    return Decision.QUARANTINE, 1.0`,
      dashboardRoute: '/dashboard/matrix',
      highlight: true
    },
    {
      id: 'response-shield',
      category: 'runtime',
      title: 'Response-Side Injection Shield & LLM Adjudicator',
      desc: 'Sanitizes tool results for system prompt overrides, delimiter jailbreaks, and hidden markdown tracking beacons before context reflection.',
      longDesc: 'When tools return untrusted outputs (e.g., web search results, issue comments), attackers often embed prompt injection tags like <instructions> or [SYSTEM]. The Response Shield sanitizes outputs and invokes an async LLM adjudicator for ambiguous calls in the challenge band (0.40 - 0.70).',
      icon: <ShieldCheck className="w-5 h-5 text-sky-600" />,
      owaspTag: 'ASI01:PromptInjection',
      latencySpec: '1.2 ms regex + optional async LLM',
      codeSnippet: `result = response_inspector.sanitize(tool_output)
if result.has_injection:
    tool_output = result.sanitized_payload`,
      dashboardRoute: '/dashboard/matrix',
      highlight: true
    },
    {
      id: 'egress-dlp',
      category: 'runtime',
      title: 'Egress DLP & Sliding Window Quotas',
      desc: 'Enforces rolling 500 KB / 60s per-agent byte quotas and max 5 destination caps while scanning outbound traffic for PII and secrets.',
      longDesc: 'Stops slow-drip exfiltration where an attacker attempts to leak private data in tiny chunks over multiple steps. The sliding window quota tracks cumulative egress volumes and blocks calls once thresholds are reached.',
      icon: <Zap className="w-5 h-5 text-orange-600" />,
      owaspTag: 'ASI06:Exfiltration',
      latencySpec: '0.8 ms sliding window check',
      codeSnippet: `allowed, remaining = quota_tracker.check_and_add(agent_id, byte_size)
if not allowed:
    return Decision.BLOCK, "Byte quota exceeded"`,
      dashboardRoute: '/dashboard/matrix',
      highlight: true
    },
    {
      id: 'schema-pinner',
      category: 'static',
      title: 'Tool Schema Pinning & Rug-Pull Diff Detection',
      desc: 'Tracks SHA-256 hashes of tool input schemas across restarts, alerting operators when servers stealthily alter parameter definitions.',
      longDesc: 'Defends against rogue MCP tool servers that alter their schema at runtime to introduce new optional arguments or exfiltration parameters. Side-by-side JSON schema diffs allow operators to review and pin changes.',
      icon: <Layers className="w-5 h-5 text-emerald-600" />,
      owaspTag: 'ASI03:SupplyChain',
      latencySpec: '0.2 ms schema hash check',
      codeSnippet: `diff = schema_pinner.compare(tool_name, new_schema)
if diff.has_breaking_changes:
    flag_schema_drift(tool_name, diff)`,
      dashboardRoute: '/dashboard/matrix'
    },
    {
      id: 'scope-analyzer',
      category: 'static',
      title: 'Scope Analyzer & Shadow Tool Registry',
      desc: 'Validates that agent tool requests match authorized declared scopes, flagging unapproved tool registrations in learn or strict mode.',
      longDesc: 'Prevents privilege escalation where an agent attempts to access tools outside its provisioned boundary (e.g., a documentation agent calling terminal commands). Operates in learn mode during onboarding or strict fail-closed mode in production.',
      icon: <Eye className="w-5 h-5 text-indigo-600" />,
      owaspTag: 'ASI02:PrivilegeEscalation',
      latencySpec: '< 0.1 ms scope set check',
      codeSnippet: `if not scope_analyzer.is_tool_authorized(agent_id, tool_name):
    if strict_mode: return Decision.BLOCK
    else: log_unauthorized_scope(agent_id, tool_name)`,
      dashboardRoute: '/dashboard/agents'
    },
    {
      id: 'behavioral-ensemble',
      category: 'behavioral',
      title: '4-Model Behavioral ML Ensemble',
      desc: 'Ensemble combining Rule Heuristics, Markov Chains, Isolation Forest continuous features, and Neural Sequence Transformers.',
      longDesc: 'Each tool call is evaluated across 4 complementary models: Rule heuristics provide immediate zero-day tripwires; Markov chains model tool sequence probabilities; Isolation Forest models continuous parameter entropy and sizes; Transformer models deep contextual sequences.',
      icon: <Activity className="w-5 h-5 text-violet-600" />,
      owaspTag: 'ASI04:AnomalousBehavior',
      latencySpec: '3.4 ms total ensemble inference',
      codeSnippet: `risk_score = 0.25*rule + 0.35*markov + 0.20*isolation + 0.20*transformer`,
      dashboardRoute: '/dashboard/behavior',
      highlight: true
    },
    {
      id: 'drift-monitor',
      category: 'behavioral',
      title: 'Total Variation Distance (TVD) Baseline Drift',
      desc: 'Measures behavioral divergence against historical agent snapshots, triggering automated alerts when agent patterns drift over time.',
      longDesc: 'Tracks the statistical distance between an agent’s current tool transition distribution and its established baseline. When TVD exceeds tolerance thresholds, operators are prompted to review or refit baselines.',
      icon: <Sliders className="w-5 h-5 text-teal-600" />,
      owaspTag: 'ASI04:ModelDrift',
      latencySpec: 'Background streaming calculation',
      codeSnippet: `tvd = 0.5 * sum(abs(P[t] - Q[t]) for t in tool_vocab)
if tvd > drift_threshold: alert_operator(agent_id, tvd)`,
      dashboardRoute: '/dashboard/behavior'
    },
    {
      id: 'opa-enforcer',
      category: 'policy',
      title: 'Sub-Millisecond OPA Rego v1 Policy Gate',
      desc: 'High-speed Open Policy Agent compiler and engine evaluating granular enterprise security policies with deterministic fail-closed safety.',
      longDesc: 'Every tool invocation must pass through the OPA policy gate before dispatch. Supports multi-package rules, dynamic dry-run simulations, and automatic synthesizer templates for least-privilege policy generation.',
      icon: <FileCode2 className="w-5 h-5 text-rose-600" />,
      owaspTag: 'Zero-Trust Gate',
      latencySpec: '0.8 ms OPA evaluation',
      codeSnippet: `package cerberus.policy
default allow := false
allow if {
    input.trust_level == "verified"
    input.risk_score < 0.70
}`,
      dashboardRoute: '/dashboard/policies',
      highlight: true
    },
    {
      id: 'merkle-ledger',
      category: 'audit',
      title: 'Cryptographic Merkle SHA-256 Audit Ledger',
      desc: 'Tamper-evident append-only log with hash chaining and optional Fernet symmetric encryption, verifiable via CLI or SOC UI.',
      longDesc: 'Every tool call event is cryptographically linked to the preceding entry hash: SHA-256(index : prev_hash : payload). Any unauthorized manual modification or deletion breaks the hash chain and is immediately flagged by the integrity verifier.',
      icon: <KeyRound className="w-5 h-5 text-amber-600" />,
      owaspTag: 'ASI09:AuditFailure',
      latencySpec: '0.3 ms SHA-256 hashing',
      codeSnippet: `entry_hash = hashlib.sha256(f"{idx}:{prev_hash}:{payload}").hexdigest()`,
      dashboardRoute: '/dashboard/audit'
    },
    {
      id: 'hitl-gate',
      category: 'hitl',
      title: 'HMAC Step-Up Challenge Gate & Slack Webhooks',
      desc: 'Pauses suspicious calls with single-use HMAC-SHA256 approval tokens and dispatches interactive webhooks with fail-closed 60s timeouts.',
      longDesc: 'When a tool call falls in the CHALLENGE score band (0.40 - 0.70), Cerberus dispatches a webhook to designated security channels (e.g. Slack Block-Kit). Operators review the sanitized payload and issue an HMAC-signed approval token. If unapproved within 60s, the call deterministically fails closed.',
      icon: <Radio className="w-5 h-5 text-cyan-600" />,
      owaspTag: 'ASI07:UnauthorizedActions',
      latencySpec: 'Real-time webhook + 60s TTL',
      codeSnippet: `challenge = challenge_manager.create_challenge(event)
dispatch_webhook(challenge.slack_payload)
# Fails closed if timeout expires without operator HMAC signature`,
      dashboardRoute: '/dashboard/approvals',
      highlight: true
    },
    {
      id: 'analytics-benchmarks',
      category: 'analytics',
      title: 'Real-Time Telemetry & ROC-AUC Benchmarks',
      desc: 'Live P50, P95, P99 latency percentiles, throughput counters, and empirical confusion matrix metrics across 1,000+ benchmark tool calls.',
      longDesc: 'Provides complete transparency into firewall performance with Prometheus-compatible /metrics endpoints, 95% confidence intervals, and empirical ablation tables showing detector contributions.',
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
      owaspTag: 'Metrics & Observability',
      latencySpec: 'Sub-1ms telemetry buffer',
      codeSnippet: `GET /metrics -> Prometheus exporter
GET /api/analytics -> Live P50/P95/P99 latency & ROC-AUC curves`,
      dashboardRoute: '/dashboard/analytics'
    }
  ];

  const filteredFeatures = features.filter((f) => {
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesQuery =
      searchQuery === '' ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.owaspTag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="primary" size="sm">Enterprise Capabilities</Badge>
        <h1 className="text-4xl sm:text-5xl font-display font-black text-[#171638] tracking-tight">
          Comprehensive Defense for Autonomous AI Agents
        </h1>
        <p className="text-base text-[#5B5882] leading-relaxed">
          From deterministic cryptographic tripwires to deep neural sequence modeling, explore the multi-layered capabilities powering the Cerberus runtime behavioral firewall.
        </p>
      </div>

      {/* Interactive Controls: Search & Category Filter Tabs */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#8E8AA7] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search capabilities, OWASP tags, or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EDE9FE] bg-white text-sm text-[#171638] placeholder-[#8E8AA7] focus:outline-none focus:ring-2 focus:ring-[#6654E8]/20 focus:border-[#C4B5FD] transition-all shadow-xs"
            />
          </div>

          <span className="text-xs font-mono text-[#8E8AA7] shrink-0">
            Showing {filteredFeatures.length} of {features.length} capabilities
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === c.id
                  ? 'bg-[#6654E8] text-white shadow-sm font-semibold'
                  : 'bg-white text-[#5B5882] border border-[#EDE9FE] hover:border-[#DDD6FE] hover:bg-[#F5F3FF]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((f) => {
          const isExpanded = expandedFeature === f.id;
          return (
            <div
              key={f.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all bg-white ${
                f.highlight
                  ? 'border-[#C4B5FD] shadow-lavender hover:shadow-lavender-md'
                  : 'border-[#EDE9FE] shadow-sm hover:border-[#DDD6FE]'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] border border-[#EDE9FE] flex items-center justify-center shadow-xs">
                    {f.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#6654E8] border border-[#DDD6FE]">
                    {f.owaspTag}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#171638] mb-2">{f.title}</h3>
                <p className="text-xs text-[#5B5882] leading-relaxed mb-4">{f.desc}</p>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#EDE9FE] space-y-3 text-xs text-[#5B5882] leading-relaxed animate-fadeIn">
                    <p>{f.longDesc}</p>
                    {f.codeSnippet && (
                      <div className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                        <pre>{f.codeSnippet}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-[#EDE9FE] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#8E8AA7]">
                  {f.latencySpec}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedFeature(isExpanded ? null : f.id)}
                    className="text-xs font-semibold text-[#6654E8] hover:text-[#5543D6] transition-colors"
                  >
                    {isExpanded ? 'Less' : 'Details'}
                  </button>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-[#6654E8] hover:bg-[#EDE9FE]"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => navigate(f.dashboardRoute)}
                  >
                    SOC View
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-[#EDE9FE] via-[#F5F3FF] to-[#EDE9FE] border border-[#DDD6FE] p-8 text-center space-y-4">
        <h3 className="text-xl font-bold text-[#171638]">
          Ready to test these capabilities in real-time?
        </h3>
        <p className="text-xs text-[#5B5882] max-w-xl mx-auto">
          Launch the SOC Console to inspect live SSE telemetry, tune behavioral model weights, dry-run OPA Rego policies, and verify cryptographic Merkle audit logs.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button
            variant="brand"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/dashboard')}
          >
            Open SOC Console
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/architecture')}
          >
            View Pipeline Architecture
          </Button>
        </div>
      </div>
    </div>
  );
};