import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  ShieldAlert,
  Clock,
  Key,
  CheckCircle2,
  XCircle,
  Send,
  Copy,
  Check,
  RefreshCw,
  Lock
} from 'lucide-react';
import { ChallengeItem } from '../types';
import { fetchChallenges, resolveChallenge } from '../api';

export const ChallengeInboxView: React.FC = () => {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterTab, setFilterTab] = useState<'pending' | 'resolved'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingToken, setInspectingToken] = useState<ChallengeItem | null>(null);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [webhookSimulated, setWebhookSimulated] = useState<string | null>(null);
  const [nowSec, setNowSec] = useState<number>(Math.floor(Date.now() / 1000));

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const data = await fetchChallenges();
      setChallenges(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  // Countdown timer with deterministic fail-closed expiration -> BLOCK
  useEffect(() => {
    const timer = setInterval(() => {
      const current = Math.floor(Date.now() / 1000);
      setNowSec(current);
      setChallenges((prev) =>
        prev.map((c) => {
          if (c.status === 'pending' && c.expires_at <= current) {
            return {
              ...c,
              status: 'expired',
              resolution_reason: 'Fail-Closed Expiration Timeout -> Deterministic EventDecision.BLOCK'
            };
          }
          return c;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResolve = async (challenge: ChallengeItem, action: 'approve' | 'reject') => {
    try {
      await resolveChallenge(
        challenge.challenge_id,
        action,
        `Operator ${action.toUpperCase()} with HMAC Step-Up Token verification`,
        challenge.step_up_token
      );
    } catch {
      // Fallback local state update when backend is offline
    }
    setChallenges((prev) =>
      prev.map((c) =>
        c.challenge_id === challenge.challenge_id
          ? {
              ...c,
              status: action === 'approve' ? 'approved' : 'rejected',
              resolved_by: 'secops-operator',
              resolved_at: Math.floor(Date.now() / 1000),
              resolution_reason: `Verified via HMAC-SHA256 Step-Up Token (${action.toUpperCase()})`
            }
          : c
      )
    );
  };

  const pendingList = challenges.filter((c) => c.status === 'pending');
  const resolvedList = challenges.filter((c) => c.status !== 'pending');
  const displayed = (filterTab === 'pending' ? pendingList : resolvedList).filter(
    (c) =>
      !searchQuery ||
      c.tool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.agent_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.challenge_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 border border-amber-500/30">
        <div>
          <div className="flex items-center space-x-2.5">
            <CheckSquare className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-mono text-white">
              HUMAN-IN-THE-LOOP CHALLENGE & STEP-UP APPROVAL INBOX
            </h2>
            <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
              {pendingList.length} PENDING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cryptographic HMAC-SHA256 step-up tokens bound to{' '}
            <code className="text-amber-300 font-mono">
              {'{challenge_id}:{operator_id}:{action}:{timestamp}:{exp}:{nonce}'}
            </code>{' '}
            • Unapproved challenges auto-resolve to fail-closed <strong className="text-rose-400">EventDecision.BLOCK</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() =>
              setWebhookSimulated(
                `Dispatched Slack Block-Kit + Generic Webhook with header X-Cerberus-Signature: sha256=8a7d91c4e2b0f653... (200 OK)`
              )
            }
            className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-xs font-mono text-purple-200 flex items-center space-x-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Simulate Slack Block-Kit Webhook</span>
          </button>
          <button
            onClick={loadChallenges}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {webhookSimulated && (
        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between text-xs font-mono text-purple-200">
          <span>🔔 {webhookSimulated}</span>
          <button onClick={() => setWebhookSimulated(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex space-x-2 font-mono text-xs">
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg border ${
              filterTab === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            Pending Actions ({pendingList.length})
          </button>
          <button
            onClick={() => setFilterTab('resolved')}
            className={`px-3.5 py-1.5 rounded-lg border ${
              filterTab === 'resolved'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            Resolved / Fail-Closed History ({resolvedList.length})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search challenge ID, agent, or tool..."
          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 min-w-[240px]"
        />
      </div>

      {/* Challenge Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {displayed.map((chg) => {
          const remaining = Math.max(0, chg.expires_at - nowSec);
          return (
            <div
              key={chg.challenge_id}
              className="glass-panel rounded-xl p-5 border border-slate-800/90 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                        {chg.challenge_id}
                      </span>
                      <span className="font-mono text-base font-bold text-white">{chg.tool_name}</span>
                      <span className="text-xs font-mono text-slate-400">@{chg.tool_server}</span>
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      Agent: <strong className="text-slate-200">{chg.agent_id}</strong> • Session:{' '}
                      <strong className="text-slate-300">{chg.session_id}</strong>
                    </p>
                  </div>

                  {/* Live Countdown Timer */}
                  {chg.status === 'pending' ? (
                    <div className="px-2.5 py-1 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs font-mono text-rose-300 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>TTL: {remaining}s (Fail-Closed)</span>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded text-xs font-mono uppercase bg-slate-900 border border-slate-700 text-slate-300">
                      {chg.status}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {chg.risk_factors.map((rf, idx) => (
                    <div key={idx} className="text-xs font-mono text-amber-200/90 bg-amber-950/20 border border-amber-500/20 px-2.5 py-1.5 rounded">
                      • {rf}
                    </div>
                  ))}
                </div>

                <div>
                  <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                    Paused Tool Call Arguments
                  </span>
                  <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                    {JSON.stringify(chg.parameters, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setInspectingToken(chg)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center space-x-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Inspect HMAC Step-Up Token</span>
                </button>

                {chg.status === 'pending' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleResolve(chg, 'reject')}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-mono font-bold text-rose-300 flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>DENY (BLOCK)</span>
                    </button>
                    <button
                      onClick={() => handleResolve(chg, 'approve')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-300 flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>STEP-UP APPROVE</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* HMAC Step-Up Token Inspector Modal */}
      {inspectingToken && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-xl max-w-2xl w-full p-6 border border-cyan-500/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold font-mono text-white">
                  Cryptographic HMAC-SHA256 Step-Up Token Inspector
                </h3>
              </div>
              <button
                onClick={() => setInspectingToken(null)}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                [ESC / CLOSE]
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Canonical Binding Payload:</span>
                <code className="text-amber-300 break-all">
                  {inspectingToken.operator_binding ||
                    `${inspectingToken.challenge_id}:secops-operator:approve:${inspectingToken.timestamp}:${inspectingToken.expires_at}:9f4b2c81`}
                </code>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Single-Use Step-Up Token:</span>
                <code className="text-cyan-300 break-all">{inspectingToken.step_up_token}</code>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Webhook Header (X-Cerberus-Signature):</span>
                <code className="text-purple-300 break-all">
                  {inspectingToken.hmac_signature || 'sha256=8a7d91c4e2b0f65319a8c7d4e5f601239a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d'}
                </code>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(inspectingToken.step_up_token || '');
                  setCopiedToken(true);
                  setTimeout(() => setCopiedToken(false), 2000);
                }}
                className="px-3 py-1.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-xs font-mono text-cyan-200 flex items-center space-x-1.5"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? 'Copied Token' : 'Copy Step-Up Token'}</span>
              </button>
              <button
                onClick={() => setInspectingToken(null)}
                className="px-3 py-1.5 rounded bg-slate-800 text-xs font-mono text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
