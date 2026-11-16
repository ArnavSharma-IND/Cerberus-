import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Shield,
  Layers,
  ArrowRight,
  GitFork,
  Cpu,
  Database,
  Lock,
  Zap,
  Server,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Radio,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface NodeDetail {
  title: string;
  category: string;
  latencyBudget: string;
  description: string;
  checkpoints: string[];
  protocol: string;
}

const NODE_DETAILS: Record<string, NodeDetail> = {
  '1': {
    title: 'Autonomous AI Agent',
    category: 'Client Workload',
    latencyBudget: '0.0 ms (Origin)',
    description: 'Anthropic Claude, Cursor, Google Gemini, or custom autonomous agent dispatching tool calls.',
    checkpoints: [
      'HMAC-SHA256 agent identity bearer token in Authorization header',
      'JSON-RPC 2.0 tools/call envelope',
      'Declared session identifier for Markov sequence tracking'
    ],
    protocol: 'HTTP JSON-RPC 2.0 or Stdio pipe'
  },
  '2': {
    title: 'Cerberus Proxy Gateway & Redactor',
    category: 'Ingress & Sanitization',
    latencyBudget: '1.2 ms',
    description: 'Reverse proxy capturing raw payloads, calculating Shannon parameter entropy, and masking API secrets.',
    checkpoints: [
      'Token verification & sliding rate quota validation (120 req/min)',
      'High-entropy parameter calculation (> 4.5 bits/byte flagged)',
      'SecretRedactor regex scanner redacting AWS, OpenAI, GitHub keys'
    ],
    protocol: 'FastAPI ASGI Gateway'
  },
  '3': {
    title: 'Static Security & Schema Pinner',
    category: 'Static Guardrails',
    latencyBudget: '0.6 ms',
    description: 'Pre-baseline tripwires scanning for lethal trifecta combinations and verifying tool schema SHA-256 hashes.',
    checkpoints: [
      'Scope authorization matrix (learn vs strict fail-closed mode)',
      'Tool schema hash pinner preventing rogue parameter additions',
      'Shadow tool detector alerting on unapproved MCP tool registrations'
    ],
    protocol: 'SQLite schema state store'
  },
  '4': {
    title: 'Taint & Provenance DAG Tracker',
    category: 'Deterministic Provenance',
    latencyBudget: '0.45 ms',
    description: 'Tracks data lineage from untrusted sources (GitHub issues, web search) across downstream tool calls.',
    checkpoints: [
      'Fingerprints untrusted inputs with SHA-256 lineage tags',
      'Detects downstream propagation into intermediate tool arguments',
      'Deterministic 1.0 BLOCK override if tainted data touches egress sinks'
    ],
    protocol: 'In-Memory DAG + Redis state'
  },
  '5': {
    title: 'Canary Honeytoken Vault',
    category: 'Zero-Day Tripwire',
    latencyBudget: '< 0.1 ms',
    description: 'Deterministic honeytokens (AWS keys, DB strings, .env.canary) tripping instant auto-quarantine.',
    checkpoints: [
      'O(1) hash table lookup across all tool call arguments',
      'Instant session quarantine on any canary hit (ASI10)',
      'Tamper alert logging into immutable audit ledger'
    ],
    protocol: 'O(1) Cryptographic Hash Registry'
  },
  '6': {
    title: '4-Model Behavioral Ensemble',
    category: 'Statistical ML Core',
    latencyBudget: '3.4 ms',
    description: 'Four complementary models calculating ensemble risk score (0.0 to 1.0).',
    checkpoints: [
      'Rule-based heuristic scorer for rapid edge triggers (0.25 weight)',
      'Markov chain transition matrix evaluating tool sequence surprise (0.35 weight)',
      'Isolation Forest 8-dimensional continuous Z-score features (0.20 weight)',
      'Neural Sequence Transformer with attention window (0.20 weight)'
    ],
    protocol: 'Scikit-learn + PyTorch + Streaming Scaler'
  },
  '7': {
    title: 'Open Policy Agent (OPA) Enforcer',
    category: 'Deterministic Policy Gate',
    latencyBudget: '0.8 ms',
    description: 'Evaluates multi-package Rego v1 policies enforcing fail-closed enterprise boundary constraints.',
    checkpoints: [
      'Evaluates risk_score >= 0.70 -> BLOCK, >= 0.40 -> CHALLENGE, < 0.40 -> ALLOW',
      'Fail-closed circuit breaker on OPA timeout or connection failure',
      'Dynamic policy reload and online synthesized least-privilege rules'
    ],
    protocol: 'OPA v1 REST API / In-Process Go Engine'
  },
  '8': {
    title: 'HITL Cryptographic Challenge Gate',
    category: 'Human-in-the-Loop',
    latencyBudget: 'Real-time webhook + 60s TTL',
    description: 'Dispatches interactive HMAC-signed approval webhooks to Slack or security operators for challenge calls.',
    checkpoints: [
      'Single-use HMAC-SHA256 step-up token generation',
      'Slack Block-Kit webhook dispatcher with payload preview',
      'Strict 60s fail-closed timeout enforcing hard BLOCK on expiration'
    ],
    protocol: 'HMAC-SHA256 Bearer Token Gate'
  },
  '9': {
    title: 'Upstream MCP Tool Servers',
    category: 'Tool Execution',
    latencyBudget: 'Upstream variable',
    description: 'Target MCP servers executing approved tool calls (GitHub, SQLite, Filesystem, Fetch, AWS).',
    checkpoints: [
      'Forwarding sanitized JSON-RPC parameters',
      'Response Shield inspecting tool return payload before reflection',
      'Tamper-evident Merkle SHA-256 audit ledger entry append'
    ],
    protocol: 'Stdio Subprocess or HTTP JSON-RPC 2.0'
  }
};

const INITIAL_NODES: Node[] = [
  {
    id: '1',
    position: { x: 40, y: 160 },
    data: { label: 'AI Agent\n(Claude / Cursor / Gemini)' },
    style: {
      background: '#FFFFFF',
      color: '#171638',
      border: '2px solid #7C3AED',
      borderRadius: '16px',
      padding: '16px',
      fontWeight: 'bold',
      fontSize: '13px',
      boxShadow: '0 4px 20px -2px rgba(102, 84, 232, 0.15)',
      width: 170,
      textAlign: 'center'
    }
  },
  {
    id: '2',
    position: { x: 260, y: 160 },
    data: { label: 'Cerberus Proxy\nGateway & Redactor' },
    style: {
      background: '#F5F3FF',
      color: '#171638',
      border: '2px solid #6654E8',
      borderRadius: '16px',
      padding: '16px',
      fontWeight: 'bold',
      fontSize: '13px',
      boxShadow: '0 4px 16px -2px rgba(102, 84, 232, 0.12)',
      width: 180,
      textAlign: 'center'
    }
  },
  {
    id: '3',
    position: { x: 490, y: 60 },
    data: { label: 'Static Scanner &\nSchema Pinner' },
    style: {
      background: '#FFFFFF',
      color: '#171638',
      border: '1.5px solid #059669',
      borderRadius: '14px',
      padding: '14px',
      fontSize: '12px',
      fontWeight: '600',
      width: 170,
      textAlign: 'center'
    }
  },
  {
    id: '4',
    position: { x: 490, y: 160 },
    data: { label: 'Taint & Provenance\nDAG Tracker' },
    style: {
      background: '#FFFFFF',
      color: '#171638',
      border: '2px solid #7C3AED',
      borderRadius: '14px',
      padding: '14px',
      fontSize: '12px',
      fontWeight: 'bold',
      width: 170,
      textAlign: 'center',
      boxShadow: '0 2px 10px rgba(124, 58, 237, 0.15)'
    }
  },
  {
    id: '5',
    position: { x: 490, y: 260 },
    data: { label: 'Canary Honeytoken\nVault (ASI10)' },
    style: {
      background: '#FFFFFF',
      color: '#171638',
      border: '1.5px solid #DB2777',
      borderRadius: '14px',
      padding: '14px',
      fontSize: '12px',
      fontWeight: '600',
      width: 170,
      textAlign: 'center'
    }
  },
  {
    id: '6',
    position: { x: 710, y: 160 },
    data: { label: '4-Model Behavioral\nML Ensemble' },
    style: {
      background: '#F5F3FF',
      color: '#171638',
      border: '2px solid #4F46E5',
      borderRadius: '16px',
      padding: '16px',
      fontWeight: 'bold',
      fontSize: '13px',
      boxShadow: '0 4px 18px rgba(79, 70, 229, 0.15)',
      width: 180,
      textAlign: 'center'
    }
  },
  {
    id: '7',
    position: { x: 940, y: 160 },
    data: { label: 'OPA Rego v1\nPolicy Enforcer' },
    style: {
      background: '#FFFFFF',
      color: '#171638',
      border: '2px solid #E11D48',
      borderRadius: '16px',
      padding: '16px',
      fontWeight: 'bold',
      fontSize: '13px',
      boxShadow: '0 4px 20px rgba(225, 29, 72, 0.15)',
      width: 170,
      textAlign: 'center'
    }
  },
  {
    id: '8',
    position: { x: 940, y: 280 },
    data: { label: 'HITL Step-Up Gate\n(Slack HMAC Token)' },
    style: {
      background: '#FFFBEB',
      color: '#92400E',
      border: '1.5px solid #F59E0B',
      borderRadius: '14px',
      padding: '12px',
      fontSize: '12px',
      fontWeight: '600',
      width: 170,
      textAlign: 'center'
    }
  },
  {
    id: '9',
    position: { x: 1160, y: 160 },
    data: { label: 'Upstream MCP Servers\n(GitHub, SQLite, CLI)' },
    style: {
      background: '#ECFDF5',
      color: '#065F46',
      border: '2px solid #10B981',
      borderRadius: '16px',
      padding: '16px',
      fontWeight: 'bold',
      fontSize: '13px',
      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)',
      width: 180,
      textAlign: 'center'
    }
  }
];

const INITIAL_EDGES: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    label: 'JSON-RPC tools/call',
    style: { stroke: '#6654E8', strokeWidth: 2.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6654E8' }
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    label: 'Schema check',
    style: { stroke: '#059669', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#059669' }
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    animated: true,
    label: 'Lineage check',
    style: { stroke: '#7C3AED', strokeWidth: 2.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#7C3AED' }
  },
  {
    id: 'e2-5',
    source: '2',
    target: '5',
    label: 'Canary check',
    style: { stroke: '#DB2777', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#DB2777' }
  },
  {
    id: 'e4-6',
    source: '4',
    target: '6',
    animated: true,
    label: 'Features vector',
    style: { stroke: '#6654E8', strokeWidth: 2.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6654E8' }
  },
  {
    id: 'e6-7',
    source: '6',
    target: '7',
    animated: true,
    label: 'Risk score (0-1)',
    style: { stroke: '#4F46E5', strokeWidth: 2.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#4F46E5' }
  },
  {
    id: 'e7-8',
    source: '7',
    target: '8',
    label: 'Score 0.40 - 0.70',
    style: { stroke: '#F59E0B', strokeWidth: 1.5, strokeDasharray: '4 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' }
  },
  {
    id: 'e7-9',
    source: '7',
    target: '9',
    animated: true,
    label: 'ALLOW (score < 0.40)',
    style: { stroke: '#10B981', strokeWidth: 2.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' }
  },
  {
    id: 'e8-9',
    source: '8',
    target: '9',
    label: 'HMAC Approved',
    style: { stroke: '#10B981', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' }
  }
];

export const ArchitecturePage: React.FC = () => {
  const navigate = useNavigate();
  const [nodes, , onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, , onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('4');

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const activeDetail = NODE_DETAILS[selectedNodeId] || NODE_DETAILS['4'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="primary" size="sm">System Pipeline Architecture</Badge>
        <h1 className="text-4xl sm:text-5xl font-display font-black text-[#171638] tracking-tight">
          Interactive Zero-Trust Pipeline Flow
        </h1>
        <p className="text-base text-[#5B5882] leading-relaxed">
          Click any component in the visual graph below to inspect its security checkpoints, protocol specifications, and latency budgets. Drag nodes or zoom to explore.
        </p>
      </div>

      {/* Main Interactive Flow Canvas */}
      <div className="bg-white rounded-3xl border border-[#EDE9FE] shadow-lavender-lg overflow-hidden">
        {/* Top Control Bar */}
        <div className="px-6 py-4 border-b border-[#EDE9FE] bg-[#F5F3FF]/70 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase text-[#171638] tracking-wider">
              Live Pipeline Topology (@xyflow/react)
            </span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#6654E8] border border-[#DDD6FE]">
              P95 Latency: 14.02 ms
            </span>
          </div>

          <div className="text-xs text-[#5B5882] font-mono flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]" /> Taint Lineage
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E11D48]" /> OPA Gate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Forward Sink
            </span>
          </div>
        </div>

        {/* ReactFlow Viewport */}
        <div className="h-[460px] w-full bg-[#F5F3FF]/40 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            attributionPosition="bottom-left"
          >
            <Background color="#DDD6FE" gap={20} size={1.2} />
            <Controls className="bg-white shadow-md border border-[#EDE9FE] rounded-xl text-[#171638]" />
            <MiniMap
              nodeColor={() => '#C4B5FD'}
              maskColor="rgba(245, 243, 255, 0.7)"
              className="rounded-xl border border-[#EDE9FE] shadow-md bg-white"
            />
          </ReactFlow>
        </div>

        {/* Selected Node Forensics & Spec Inspector Drawer */}
        <div className="border-t border-[#EDE9FE] p-6 bg-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#EDE9FE]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#EDE9FE] text-[#6654E8] border border-[#DDD6FE]">
                  {activeDetail.category}
                </span>
                <span className="text-xs font-mono text-[#8E8AA7]">
                  Latency Budget: <strong className="text-[#171638]">{activeDetail.latencyBudget}</strong>
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#171638]">{activeDetail.title}</h3>
            </div>

            <div className="text-xs font-mono text-[#5B5882] px-3 py-1.5 rounded-lg bg-[#F5F3FF] border border-[#EDE9FE]">
              Protocol: <span className="font-semibold text-[#171638]">{activeDetail.protocol}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-[#8E8AA7] mb-2 tracking-wider">
                Functional Overview
              </h4>
              <p className="text-xs text-[#5B5882] leading-relaxed">
                {activeDetail.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-[#8E8AA7] mb-2 tracking-wider">
                Active Security Checkpoints
              </h4>
              <ul className="space-y-1.5 text-xs text-[#5B5882]">
                {activeDetail.checkpoints.map((cp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{cp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Latency Breakdown Bar */}
      <div className="rounded-2xl border border-[#EDE9FE] bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#171638] mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#6654E8]" />
          <span>Interception Latency Budget Breakdown (P95: 14.02 ms)</span>
        </h3>

        <div className="space-y-2">
          <div className="h-4 rounded-full overflow-hidden flex bg-slate-100">
            <div style={{ width: '8.5%' }} className="bg-[#6654E8]" title="Gateway Redactor: 1.2ms" />
            <div style={{ width: '4.2%' }} className="bg-[#059669]" title="Schema Pinner: 0.6ms" />
            <div style={{ width: '3.2%' }} className="bg-[#7C3AED]" title="Taint DAG: 0.45ms" />
            <div style={{ width: '24.2%' }} className="bg-[#4F46E5]" title="Behavioral Ensemble: 3.4ms" />
            <div style={{ width: '5.7%' }} className="bg-[#E11D48]" title="OPA Gate: 0.8ms" />
            <div style={{ width: '54.2%' }} className="bg-emerald-500" title="Upstream MCP Execution: 7.57ms" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#5B5882] pt-1">
            <span>Proxy Ingress (1.2 ms)</span>
            <span>Static Guard (0.6 ms)</span>
            <span>Taint DAG (0.45 ms)</span>
            <span>Ensemble ML (3.4 ms)</span>
            <span>OPA Gate (0.8 ms)</span>
            <span className="text-emerald-700 font-semibold">Net Interception: 6.45 ms</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <Button
          variant="brand"
          size="lg"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={() => navigate('/dashboard')}
        >
          View Live Pipeline in SOC Console
        </Button>
      </div>
    </div>
  );
};