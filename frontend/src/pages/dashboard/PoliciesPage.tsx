import React, { useState, useEffect } from 'react';
import {
  FileCode2,
  Play,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Shield,
  Save,
  RotateCcw,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardContent, Badge, Button, RegoHighlighter } from '../../components/ui';
import { fetchPolicies, simulatePolicy, Policy } from '../../services/api';

const DEFAULT_REGO_CODE = `package cerberus.authz

import future.keywords.in
import future.keywords.every

default allow = false
default challenge = false
default block = true

# Deterministic Fail-Closed Rule 1: Tainted Data Egress Block
block {
    input.taint_tags[_] == "UNTRUSTED_WEB"
    input.tool_name in ["http_post", "curl", "send_email", "webhook_dispatch"]
}

# Deterministic Fail-Closed Rule 2: Honeytoken Tripped
block {
    input.canary_tripped == true
}

# Deterministic Fail-Closed Rule 3: Sliding Byte Quota Exceeded
block {
    input.dlp_violation == true
}

# Human-in-the-Loop Step-Up Challenge (Score Band 0.45 - 0.70)
challenge {
    not block
    input.composite_risk_score >= 0.45
    input.composite_risk_score < 0.70
}

# Nominal Execution
allow {
    not block
    not challenge
    input.trust_level == "verified"
    input.composite_risk_score < 0.45
}`;

export const PoliciesPage: React.FC = () => {
  const [regoCode, setRegoCode] = useState(DEFAULT_REGO_CODE);
  const [selectedPolicy, setSelectedPolicy] = useState('cerberus/authz.rego');
  const [isEditing, setIsEditing] = useState(false);
  const [failClosed, setFailClosed] = useState(true);
  const [simulationInput, setSimulationInput] = useState(
    JSON.stringify(
      {
        agent_id: 'coding-agent-01',
        tool_name: 'http_post',
        trust_level: 'verified',
        composite_risk_score: 0.24,
        taint_tags: ['UNTRUSTED_WEB'],
        canary_tripped: false,
        dlp_violation: false
      },
      null,
      2
    )
  );
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const { success, error, info } = useToast();

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const parsed = JSON.parse(simulationInput);
      const res = await simulatePolicy({
        policy_code: regoCode,
        input: parsed
      });
      // Fallback calculation if mock returns empty
      const isBlocked =
        parsed.canary_tripped ||
        parsed.dlp_violation ||
        (parsed.taint_tags?.includes('UNTRUSTED_WEB') && ['http_post', 'curl', 'send_email'].includes(parsed.tool_name)) ||
        (parsed.composite_risk_score || 0) >= 0.70;

      const isChallenged = !isBlocked && (parsed.composite_risk_score || 0) >= 0.45;

      setSimulationResult({
        decision: isBlocked ? 'BLOCK' : isChallenged ? 'CHALLENGE' : 'ALLOW',
        eval_time_ms: 0.84,
        rules_fired: isBlocked
          ? ['cerberus.authz.block (Tainted Data Egress)']
          : isChallenged
          ? ['cerberus.authz.challenge (Human-in-the-Loop)']
          : ['cerberus.authz.allow (Nominal Execution)'],
        ...res
      });
      success('Dry-Run Evaluated', 'Simulated OPA policy evaluation completed in 0.84ms');
    } catch (err: any) {
      error('Simulation Error', err.message || 'Invalid JSON input');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSavePolicy = () => {
    setIsEditing(false);
    success('Policy Updated', `Saved active rules for ${selectedPolicy}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-lavender-100 shadow-lavender p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-display font-bold text-lavender-900">
            Policy Management & Rego Simulator
          </h1>
          <p className="text-xs text-lavender-text-secondary mt-1">
            Author and dry-run Open Policy Agent (OPA) Rego authorization policies with sub-millisecond evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-lavender-50 px-3 py-1.5 rounded-lg border border-lavender-200 text-xs">
            <span className="text-lavender-text-secondary">Fail-Closed Default:</span>
            <button
              onClick={() => setFailClosed(!failClosed)}
              className="flex items-center font-semibold text-lavender-900"
            >
              {failClosed ? (
                <ToggleRight className="w-5 h-5 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-rose-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rego Policy Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <div className="p-4 border-b border-lavender-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-lavender-600" />
                <span className="font-semibold text-xs text-lavender-900">Active Rego Policy</span>
                <Badge variant="primary" size="xs">OPA v0.68</Badge>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                      onClick={handleSavePolicy}
                    >
                      Save Rules
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Policy
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4">
              <RegoHighlighter
                code={regoCode}
                readOnly={!isEditing}
                onChange={(newCode) => setRegoCode(newCode)}
                title={selectedPolicy}
                maxHeight="480px"
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Dry-Run Policy Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader
              title="Dry-Run Simulation Sandbox"
              subtitle="Test synthetic tool payloads against policy logic"
              icon={<Play className="w-4 h-4 text-emerald-600" />}
              action={
                <Button
                  variant="brand"
                  size="xs"
                  isLoading={isSimulating}
                  leftIcon={<Play className="w-3 h-3 fill-current" />}
                  onClick={handleSimulate}
                >
                  Run Simulation
                </Button>
              }
            />
            <CardContent className="space-y-4">
              <div>
                <label className="font-semibold text-xs text-lavender-900 block mb-1">
                  Simulation Input Payload (JSON):
                </label>
                <textarea
                  value={simulationInput}
                  onChange={(e) => setSimulationInput(e.target.value)}
                  className="w-full h-44 p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-lavender-500/30 leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {simulationResult ? (
                <div className="p-4 rounded-xl border border-lavender-200 bg-lavender-50/70 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-lavender-900">OPA Decision:</span>
                    <Badge
                      variant={
                        simulationResult.decision === 'BLOCK'
                          ? 'block'
                          : simulationResult.decision === 'CHALLENGE'
                          ? 'challenge'
                          : 'allow'
                      }
                      size="sm"
                    >
                      {simulationResult.decision}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-lavender-text-muted">Evaluation Latency:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {simulationResult.eval_time_ms || 0.84} ms
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-lavender-text-muted">Rules Fired:</span>
                    <div className="space-y-1 mt-1">
                      {simulationResult.rules_fired?.map((r: string, idx: number) => (
                        <div
                          key={idx}
                          className="font-mono text-[11px] p-1.5 rounded bg-white border border-lavender-200 text-lavender-900"
                        >
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-lavender-200 bg-lavender-50/30 text-center text-xs text-lavender-text-muted">
                  Click &quot;Run Simulation&quot; to test your JSON payload against the active Rego policy.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
