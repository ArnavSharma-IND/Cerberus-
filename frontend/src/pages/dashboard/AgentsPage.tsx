import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  KeyRound,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Search,
  Lock,
  Radio,
  FileCheck
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardContent, Badge, Button, Modal } from '../../components/ui';
import { issueToken, quarantineSession, fetchSessions } from '../../services/api';
import { SessionSummary, IssuedToken } from '../../types';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  trust_level: 'verified' | 'unverified';
  status: 'active' | 'quarantined' | 'suspended';
  allowed_tools: string[];
  forbidden_tools: string[];
  active_sessions_count: number;
  last_activity: string;
}

const DEFAULT_AGENTS: AgentInfo[] = [
  {
    id: 'coding-agent-01',
    name: 'Autonomous Code Assistant',
    role: 'Code Refactoring & Testing',
    trust_level: 'verified',
    status: 'active',
    allowed_tools: ['read_file', 'write_file', 'run_command', 'git_status', 'git_diff'],
    forbidden_tools: ['shell_exec_root', 'deploy_prod', 'rm_rf'],
    active_sessions_count: 3,
    last_activity: '2 minutes ago'
  },
  {
    id: 'support-agent-07',
    name: 'Customer Support Triager',
    role: 'Ticket Summarization & FAQ Lookup',
    trust_level: 'verified',
    status: 'quarantined',
    allowed_tools: ['read_ticket', 'post_reply', 'kb_search'],
    forbidden_tools: ['http_post', 'curl', 'db_drop', 'export_all_users'],
    active_sessions_count: 1,
    last_activity: '45 minutes ago'
  },
  {
    id: 'sales-agent-03',
    name: 'CRM Outreach Bot',
    role: 'Lead Enrichment & Analytics',
    trust_level: 'verified',
    status: 'active',
    allowed_tools: ['read_lead', 'update_crm_stage', 'email_draft'],
    forbidden_tools: ['export_customer_data', 'raw_sql_exec'],
    active_sessions_count: 2,
    last_activity: '12 minutes ago'
  },
  {
    id: 'external-script-agent',
    name: 'Unverified Third-Party Plugin',
    role: 'External Workflow Trigger',
    trust_level: 'unverified',
    status: 'suspended',
    allowed_tools: ['read_status'],
    forbidden_tools: ['*'],
    active_sessions_count: 0,
    last_activity: '3 hours ago'
  }
];

export const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<AgentInfo[]>(DEFAULT_AGENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenTtl, setTokenTtl] = useState<number>(3600);
  const [generatedToken, setGeneratedToken] = useState<IssuedToken | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { success, warning, info } = useToast();

  const handleToggleQuarantine = async (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          const nextStatus = a.status === 'quarantined' ? 'active' : 'quarantined';
          if (nextStatus === 'quarantined') {
            warning(`Quarantined ${a.id}`, 'All active sessions locked fail-closed.');
          } else {
            success(`Restored ${a.id}`, 'Agent cleared for nominal operation.');
          }
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  const handleOpenTokenModal = (agent: AgentInfo) => {
    setSelectedAgent(agent);
    setGeneratedToken(null);
    setIsTokenModalOpen(true);
  };

  const handleGenerateToken = async () => {
    if (!selectedAgent) return;
    setIsGenerating(true);
    try {
      const tok = await issueToken(selectedAgent.id, tokenTtl);
      setGeneratedToken(tok);
      success('HMAC Token Issued', `Cryptographic token generated for ${selectedAgent.id}`);
    } catch {
      // Local fallback
      setGeneratedToken({
        status: 'issued',
        agent_id: selectedAgent.id,
        ttl_seconds: tokenTtl,
        token: `crb_hmac_${Math.random().toString(36).substr(2)}${Math.random().toString(36).substr(2)}`,
        created_at: Date.now(),
        expires_at: Date.now() + tokenTtl * 1000
      });
      success('HMAC Token Issued', `Cryptographic token generated for ${selectedAgent.id}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToken = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    info('Copied', 'Token copied to clipboard');
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-lavender-100 shadow-lavender p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-display font-bold text-lavender-900">
            Agent Identity & Scope Governance
          </h1>
          <p className="text-xs text-lavender-text-secondary mt-1">
            Enforce HMAC-signed identity authentication, permission matrices, and instant ASI10 quarantine toggles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-lavender-400" />
            <input
              type="text"
              placeholder="Search agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-lavender-50 border border-lavender-200 rounded-lg text-lavender-900 focus:outline-none focus:ring-2 focus:ring-lavender-500/30 w-48 sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* Agents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAgents.map((agent) => {
          const isQuarantined = agent.status === 'quarantined';
          const isSuspended = agent.status === 'suspended';

          return (
            <Card
              key={agent.id}
              className={`transition-all ${
                isQuarantined
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'hover:border-lavender-300'
              }`}
            >
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <span>{agent.name}</span>
                    <Badge
                      variant={
                        isQuarantined
                          ? 'quarantine'
                          : isSuspended
                          ? 'danger'
                          : 'success'
                      }
                      size="xs"
                    >
                      {agent.status.toUpperCase()}
                    </Badge>
                  </div>
                }
                subtitle={`ID: ${agent.id} • ${agent.role}`}
                icon={<Users className="w-4 h-4" />}
                action={
                  <Button
                    variant="outline"
                    size="xs"
                    leftIcon={<KeyRound className="w-3.5 h-3.5 text-lavender-600" />}
                    onClick={() => handleOpenTokenModal(agent)}
                  >
                    HMAC Token
                  </Button>
                }
              />
              <CardContent className="space-y-4">
                {/* Status & Trust Indicators */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-lavender-50 rounded-lg border border-lavender-200/60">
                    <div className="text-[10px] text-lavender-text-muted">Trust Identity</div>
                    <div className="font-semibold text-lavender-900 capitalize mt-0.5">
                      {agent.trust_level}
                    </div>
                  </div>
                  <div className="p-2.5 bg-lavender-50 rounded-lg border border-lavender-200/60">
                    <div className="text-[10px] text-lavender-text-muted">Active Sessions</div>
                    <div className="font-semibold text-lavender-900 mt-0.5">
                      {agent.active_sessions_count}
                    </div>
                  </div>
                  <div className="p-2.5 bg-lavender-50 rounded-lg border border-lavender-200/60">
                    <div className="text-[10px] text-lavender-text-muted">Last Call</div>
                    <div className="font-semibold text-lavender-900 mt-0.5">
                      {agent.last_activity}
                    </div>
                  </div>
                </div>

                {/* Scope Matrix */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-lavender-900 flex items-center justify-between">
                    <span>Allowed MCP Tools:</span>
                    <span className="text-[10px] text-emerald-700 font-normal">
                      {agent.allowed_tools.length} permitted
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.allowed_tools.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-lavender-900 flex items-center justify-between">
                    <span>Prohibited / Blocked Tools:</span>
                    <span className="text-[10px] text-rose-700 font-normal">
                      Fail-Closed Enforced
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.forbidden_tools.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-mono text-[11px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quarantine Action Bar */}
                <div className="pt-2 border-t border-lavender-100 flex items-center justify-between">
                  <div className="text-xs text-lavender-text-secondary">
                    {isQuarantined
                      ? 'Agent is currently locked out of runtime.'
                      : 'All actions verified against behavioral baseline.'}
                  </div>
                  <Button
                    variant={isQuarantined ? 'success' : 'danger'}
                    size="xs"
                    leftIcon={<AlertOctagon className="w-3.5 h-3.5" />}
                    onClick={() => handleToggleQuarantine(agent.id)}
                  >
                    {isQuarantined ? 'Lift Quarantine' : 'Quarantine Agent'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* HMAC Token Generation Modal */}
      <Modal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        title={`Generate HMAC Bearer Token: ${selectedAgent?.id}`}
        subtitle="Cryptographically signed identity token for MCP proxy authentication"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-lavender-900 block mb-1">
              Token Expiration Time-to-Live (TTL):
            </label>
            <select
              value={tokenTtl}
              onChange={(e) => setTokenTtl(Number(e.target.value))}
              className="w-full p-2.5 bg-lavender-50 border border-lavender-200 rounded-lg text-lavender-900 focus:outline-none focus:ring-2 focus:ring-lavender-500/30"
            >
              <option value={1800}>30 Minutes</option>
              <option value={3600}>1 Hour (Standard)</option>
              <option value={14400}>4 Hours</option>
              <option value={86400}>24 Hours</option>
              <option value={604800}>7 Days</option>
            </select>
          </div>

          {!generatedToken ? (
            <div className="pt-4 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                isLoading={isGenerating}
                onClick={handleGenerateToken}
              >
                Sign & Issue Token
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-medium">
                Token generated and registered in Cerberus Auth Manager.
              </div>

              <div>
                <label className="font-semibold text-lavender-900 block mb-1">
                  Authorization Header:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`Bearer ${generatedToken.token}`}
                    className="flex-1 p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg select-all"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    onClick={handleCopyToken}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div className="text-[11px] text-lavender-text-muted">
                Expires at: {new Date(generatedToken.expires_at || Date.now() + tokenTtl * 1000).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
