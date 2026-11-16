import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode2,
  Terminal,
  Shield,
  ArrowRight,
  BookOpen,
  Search,
  Copy,
  Check,
  Code,
  Layers,
  Lock,
  Cpu,
  KeyRound,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const DocsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('quickstart');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const navItems = [
    { id: 'quickstart', label: '1. Quickstart & Gateway' },
    { id: 'architecture', label: '2. Interception Model' },
    { id: 'threat-model', label: '3. OWASP ASI Threat Model' },
    { id: 'rego', label: '4. OPA Rego v1 Policies' },
    { id: 'pillars', label: '5. 5 Security Pillars' },
    { id: 'api', label: '6. REST & JSON-RPC API' },
    { id: 'cli', label: '7. CLI & Cryptographic Audit' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="primary" size="sm">Technical Documentation & Threat Model</Badge>
        <h1 className="text-4xl sm:text-5xl font-display font-black text-[#171638] tracking-tight">
          Cerberus Developer & Operator Guide
        </h1>
        <p className="text-base text-[#5B5882] leading-relaxed">
          Comprehensive reference for running, integrating, and configuring the Cerberus runtime behavioral firewall for MCP-based agentic workflows.
        </p>
      </div>

      {/* Main Grid: Sidebar Nav + Doc Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Sidebar */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#EDE9FE] p-4 shadow-sm sticky top-28 space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8E8AA7] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#EDE9FE] bg-[#F5F3FF]/50 text-xs text-[#171638] placeholder-[#8E8AA7] focus:outline-none focus:border-[#C4B5FD]"
            />
          </div>

          <nav className="space-y-1">
            {navItems
              .filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                    activeSection === item.id
                      ? 'bg-[#EDE9FE] text-[#6654E8] font-bold shadow-xs'
                      : 'text-[#5B5882] hover:text-[#171638] hover:bg-[#F5F3FF]'
                  }`}
                >
                  <span>{item.label}</span>
                  {activeSection === item.id && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              ))}
          </nav>

          <div className="pt-3 border-t border-[#EDE9FE]">
            <Button
              variant="outline"
              size="xs"
              className="w-full text-[#6654E8]"
              rightIcon={<ArrowRight className="w-3 h-3" />}
              onClick={() => navigate('/dashboard')}
            >
              Open SOC Console
            </Button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-[#EDE9FE] p-8 shadow-lavender space-y-10 text-xs sm:text-sm text-[#5B5882] leading-relaxed">
          {/* SECTION 1: QUICKSTART */}
          {activeSection === 'quickstart' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#EDE9FE] pb-4">
                <span className="text-[10px] font-mono font-bold text-[#6654E8] uppercase tracking-wider">
                  Getting Started
                </span>
                <h2 className="text-2xl font-bold text-[#171638] mt-1">Quickstart & Reverse Proxy Setup</h2>
              </div>

              <p>
                Cerberus operates as an inline reverse proxy between your AI Agent framework (Anthropic Claude SDK, Cursor, LangChain, or custom LLM client) and upstream MCP servers.
              </p>

              <div className="space-y-3">
                <h4 className="font-bold text-[#171638] text-sm">1. Launch Cerberus HTTP & SOC Gateway</h4>
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs relative overflow-x-auto">
                  <button
                    onClick={() => handleCopy(`cerberus http --host 0.0.0.0 --port 8000`, 'cmd1')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {copiedSnippet === 'cmd1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <pre>
{`# Start Cerberus HTTP JSON-RPC 2.0 Gateway
uv run cerberus http --host 0.0.0.0 --port 8000

# Verify firewall health
curl http://localhost:8000/healthz
# Response: {"status":"healthy","version":"2.0.0","mode":"enforce","fail_closed":true}`}
                  </pre>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-[#171638] text-sm">2. Configure Agent MCP Client</h4>
                <p>
                  Point your MCP client to the Cerberus gateway endpoint. Cerberus inspects all tool calls in real time and proxies allowed calls to the target server specified in <code>x-upstream-url</code>:
                </p>
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs relative overflow-x-auto">
                  <button
                    onClick={() => handleCopy(`curl -X POST http://localhost:8000/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <HMAC_TOKEN>" \\
  -H "x-upstream-url: http://localhost:8001/mcp" \\
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "read_file", "arguments": {"path": "main.py"}}}'`, 'curl1')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {copiedSnippet === 'curl1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <pre>
{`curl -X POST http://localhost:8000/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <HMAC_TOKEN>" \\
  -H "x-upstream-url: http://localhost:8001/mcp" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "read_file",
      "arguments": { "path": "main.py" }
    }
  }'`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: INTERCEPTION MODEL */}
          {activeSection === 'architecture' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#EDE9FE] pb-4">
                <span className="text-[10px] font-mono font-bold text-[#6654E8] uppercase tracking-wider">
                  Protocol Specification
                </span>
                <h2 className="text-2xl font-bold text-[#171638] mt-1">Interception Architecture & Protocol</h2>
              </div>

              <p>
                Cerberus supports both <strong>HTTP JSON-RPC 2.0 transport</strong> and <strong>Stdio subprocess wrapping</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[#F5F3FF] border border-[#EDE9FE]">
                  <h4 className="font-bold text-[#171638] text-sm mb-2">HTTP JSON-RPC Gateway</h4>
                  <p className="text-xs text-[#5B5882]">
                    Listens on <code>:8000/mcp</code> and <code>/api/*</code>. Intercepts JSON-RPC 2.0 envelopes, computes Shannon entropy on parameters, masks sensitive secrets, applies rate limits, and forwards allowed traffic upstream.
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-[#F5F3FF] border border-[#EDE9FE]">
                  <h4 className="font-bold text-[#171638] text-sm mb-2">Stdio Subprocess Proxy</h4>
                  <p className="text-xs text-[#5B5882]">
                    Wraps command-line MCP servers (e.g. <code>npx -y @modelcontextprotocol/server-filesystem</code>), intercepting standard input/output streams and enforcing the same policy and behavioral guarantees.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                <pre>
{`# Run stdio wrapper around an MCP server
cerberus stdio --upstream "npx" "-y" "@modelcontextprotocol/server-filesystem" "/data"`}
                </pre>
              </div>
            </div>
          )}

          {/* SECTION 3: THREAT MODEL */}
          {activeSection === 'threat-model' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#EDE9FE] pb-4">
                <span className="text-[10px] font-mono font-bold text-[#6654E8] uppercase tracking-wider">
                  Threat Matrix
                </span>
                <h2 className="text-2xl font-bold text-[#171638] mt-1">OWASP Top 10 for Agentic Systems (ASI)</h2>
              </div>

              <p>
                Cerberus is built ground-up to map directly to the OWASP Top 10 for Autonomous Systems and Large Language Model Agents:
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[#EDE9FE] bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-[#171638]">ASI01: Indirect Prompt Injection</strong>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-mono font-bold">Ring 3: Response Shield</span>
                  </div>
                  <p className="text-xs text-[#5B5882]">
                    Strips instruction tags (`&lt;instructions&gt;`, `[SYSTEM]`, delimiter overrides) from tool responses before reflection into context.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#EDE9FE] bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-[#171638]">ASI02: Execution Hijacking & Drift</strong>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold">Ring 1: Markov Matrix</span>
                  </div>
                  <p className="text-xs text-[#5B5882]">
                    Detects anomalous state jumps in tool transitions, preventing toxic sequences (e.g. Read → Egress → Execute).
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#EDE9FE] bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-[#171638]">ASI06: Sensitive Data Exfiltration</strong>
                    <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-mono font-bold">Ring 4: Egress DLP</span>
                  </div>
                  <p className="text-xs text-[#5B5882]">
                    Enforces sliding-window byte quotas (500 KB / 60s) and scans outbound arguments for regex PII and private API keys.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#EDE9FE] bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-[#171638]">ASI10: Rogue Agent Blast Radius</strong>
                    <span className="px-2 py-0.5 rounded bg-pink-100 text-pink-700 text-[10px] font-mono font-bold">Ring 2: Honeytoken Vault</span>
                  </div>
                  <p className="text-xs text-[#5B5882]">
                    Decoy AWS keys and `.env.canary` tokens trigger instantaneous O(1) auto-quarantine, terminating the compromised session.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: REGO POLICIES */}
          {activeSection === 'rego' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#EDE9FE] pb-4">
                <span className="text-[10px] font-mono font-bold text-[#6654E8] uppercase tracking-wider">
                  Policy Language
                </span>
                <h2 className="text-2xl font-bold text-[#171638] mt-1">Open Policy Agent (OPA) Rego v1 Syntax</h2>
              </div>

              <p>
                Cerberus evaluates policies written in standard <strong>Rego v1 syntax</strong> with deterministic fail-closed execution.
              </p>

              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs relative overflow-x-auto">
                <pre>
{`package cerberus.policy.base

import rego.v1

# Default to fail-closed
default allow := false
default decision := "block"

# Block toxic flow combinations
allow if {
    input.trust_level == "verified"
    input.risk_score < 0.40
    not input.dlp_violation
    not input.canary_tripped
}

# Require human approval for challenge band
challenge if {
    input.risk_score >= 0.40
    input.risk_score < 0.70
}`}
                </pre>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard/policies')}
                >
                  Open Rego Editor & Simulator in SOC Console
                </Button>
              </div>
            </div>
          )}

          {/* SECTION 5: 5 SECURITY PILLARS */}
          {activeSection === 'pillars' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#EDE9FE] pb-4">
                <span className="text-[10px] font-mono font-bold text-[#6654E8] uppercase tracking-wider">
                  Pillars of Zero-Trust
                </span>
                <h2 className="text-2xl font-bold text-[#171638] mt-1">The 5 Security Pillars Explained</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
                  <h4 className="font-bold text-purple-950 text-sm">Pillar 1: Taint & Provenance DAG</h4>
                  <p className="text-xs text-purple-900 mt-1">
                    Operates in <code>src/cerberus/detectors/taint.py</code>. Fingerprints untrusted data (web, email, issues) with SHA-256 tokens and traces lineage across intermediate tool hops. Deterministically blocks egress mimicry.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/50">
                  <h4 className="font-bold text-pink-950 text-sm">Pillar 2: ASI10 Honeytoken Vault</h4>
                  <p className="text-xs text-pink-900 mt-1">
                    Operates in <code>src/cerberus/detectors/canary.py</code>. Plants decoy credentials (AWS, database, JWT, .env.canary). Any hit triggers immediate 1.0 BLOCK and session quarantine.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50">
                  <h4 className="font-bold text-sky-950 text-sm">Pillar 3: Response Shield & LLM Adjudicator</h4>
                  <p className="text-xs text-sky-900 mt-1">
                    Operates in <code>src/cerberus/proxy/response_inspector.py</code>. Scans tool outputs for indirect injection tags and hidden markdown tracking beacons before reflection into agent context.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50">
                  <h4 className="font-bold text-orange-950 text-sm">Pillar 4: Egress DLP & Sliding Quotas</h4>
                  <p className="text-xs text-orange-900 mt-1">
                    Operates in <code>src/cerberus/detectors/dlp.py</code>. Prevents slow-drip leaks with sliding-window byte quotas (500 KB / 60s) and scans outbound payloads for PII and secrets.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                  <h4 className="font-bold text-amber-950 text-sm">Pillar 5: Cryptographic Step-Up Gate</h4>
                  <p className="text-xs text-amber-900 mt-1">
                    Operates in <code>src/cerberus/proxy/challenge_manager.py</code>. Pauses borderline calls for HMAC-signed operator approval with strict 60s fail-closed timeout.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: API REFERENCE */}
          {activeSection === 'api' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#EDE9FE] pb-4">
                <span className="text-[10px] font-mono font-bold text-[#6654E8] uppercase tracking-wider">
                  API Reference
                </span>
                <h2 className="text-2xl font-bold text-[#171638] mt-1">FastAPI Backend Endpoints</h2>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#F5F3FF] border border-[#EDE9FE] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#6654E8]">POST</span> <span className="text-[#171638]">/mcp</span>
                  </div>
                  <span className="text-[#5B5882]">Core JSON-RPC tool-call proxy gateway</span>
                </div>

                <div className="p-3 rounded-lg bg-[#F5F3FF] border border-[#EDE9FE] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-600">GET</span> <span className="text-[#171638]">/api/events</span>
                  </div>
                  <span className="text-[#5B5882]">Recent tool call events with forensics</span>
                </div>

                <div className="p-3 rounded-lg bg-[#F5F3FF] border border-[#EDE9FE] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-600">GET</span> <span className="text-[#171638]">/api/events/stream</span>
                  </div>
                  <span className="text-[#5B5882]">Server-Sent Events (SSE) live telemetry feed</span>
                </div>

                <div className="p-3 rounded-lg bg-[#F5F3FF] border border-[#EDE9FE] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-600">GET</span> <span className="text-[#171638]">/api/audit/verify</span>
                  </div>
                  <span className="text-[#5B5882]">Cryptographic Merkle hash chain verification</span>
                </div>

                <div className="p-3 rounded-lg bg-[#F5F3FF] border border-[#EDE9FE] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#6654E8]">POST</span> <span className="text-[#171638]">/api/policies/dry-run</span>
                  </div>
                  <span className="text-[#5B5882]">Simulate tool call against OPA Rego rules</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: CLI COMMANDS */}
          {activeSection === 'cli' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#EDE9FE] pb-4">
                <span className="text-[10px] font-mono font-bold text-[#6654E8] uppercase tracking-wider">
                  Command-Line Interface
                </span>
                <h2 className="text-2xl font-bold text-[#171638] mt-1">Cerberus CLI Tools</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto space-y-2">
                  <div className="text-slate-400"># Verify cryptographic integrity of the audit log</div>
                  <div>cerberus verify-log --log-path cerberus_audit.jsonl</div>
                  <div className="text-emerald-400"># [SUCCESS] Audit ledger integrity verified: 120 records valid.</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto space-y-2">
                  <div className="text-slate-400"># Issue HMAC identity token for an agent</div>
                  <div>cerberus issue-token --agent-id coding-agent-01 --ttl 86400</div>
                  <div className="text-purple-300"># Issued Token for Agent 'coding-agent-01' (TTL: 86400s): ...</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};