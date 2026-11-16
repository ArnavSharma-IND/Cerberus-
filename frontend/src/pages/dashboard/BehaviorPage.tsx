import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sliders,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
  ArrowRight,
  RefreshCw,
  GitCommit
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardContent, Badge, Button } from '../../components/ui';
import { fetchBehaviorData, BehaviorModelData, promoteBaseline } from '../../services/api';

export const BehaviorPage: React.FC = () => {
  const [data, setData] = useState<BehaviorModelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);
  const { success } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchBehaviorData();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePromote = async (agentId: string) => {
    setPromoting(agentId);
    try {
      await promoteBaseline(agentId);
      success('Baseline Promoted', `New baseline snapshot committed for ${agentId}`);
      await loadData();
    } finally {
      setPromoting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-lavender-100 shadow-lavender p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-display font-bold text-lavender-900">
            Behavioral Intelligence & Ensemble Scorer
          </h1>
          <p className="text-xs text-lavender-text-secondary mt-1">
            Real-time multi-model ensemble weights, first-order Markov tool transitions, and TVD baseline drift tracking.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={loadData}
        >
          Refresh Baselines
        </Button>
      </div>

      {/* 4-Model Ensemble Weights Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Model 1: Rule Engine */}
        <Card className="hover:border-lavender-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-lavender-text-muted uppercase">
                Model 1: Deterministic
              </span>
              <Badge variant="taint" size="xs">45% Weight</Badge>
            </div>
            <div className="text-lg font-bold text-lavender-900">OPA Rego & Lineage</div>
            <p className="text-xs text-lavender-text-secondary mt-1">
              Zero-tolerance deterministic rules, taint lineage sinks, honeytoken matches, and hard security invariants.
            </p>
            <div className="mt-3 w-full bg-lavender-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full w-[45%]" />
            </div>
          </CardContent>
        </Card>

        {/* Model 2: Markov Scorer */}
        <Card className="hover:border-lavender-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-lavender-text-muted uppercase">
                Model 2: Markov Chain
              </span>
              <Badge variant="primary" size="xs">25% Weight</Badge>
            </div>
            <div className="text-lg font-bold text-lavender-900">Tool State Transitions</div>
            <p className="text-xs text-lavender-text-secondary mt-1">
              Computes negative log-likelihood of consecutive tool sequences against calibrated baseline transition graph.
            </p>
            <div className="mt-3 w-full bg-lavender-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-lavender-600 h-full w-[25%]" />
            </div>
          </CardContent>
        </Card>

        {/* Model 3: Isolation Forest */}
        <Card className="hover:border-lavender-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-lavender-text-muted uppercase">
                Model 3: Isolation Forest
              </span>
              <Badge variant="info" size="xs">15% Weight</Badge>
            </div>
            <div className="text-lg font-bold text-lavender-900">Dimensional Outlier</div>
            <p className="text-xs text-lavender-text-secondary mt-1">
              Identifies geometric outliers across parameter entropy, call cadence interval, and payload byte size.
            </p>
            <div className="mt-3 w-full bg-lavender-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full w-[15%]" />
            </div>
          </CardContent>
        </Card>

        {/* Model 4: Transformer */}
        <Card className="hover:border-lavender-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-lavender-text-muted uppercase">
                Model 4: Transformer
              </span>
              <Badge variant="shield" size="xs">15% Weight</Badge>
            </div>
            <div className="text-lg font-bold text-lavender-900">Attention Context</div>
            <p className="text-xs text-lavender-text-secondary mt-1">
              Self-attention embeddings capturing long-range multi-hop intent drift and latent exfiltration plans.
            </p>
            <div className="mt-3 w-full bg-lavender-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-600 h-full w-[15%]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Markov Transition Matrix & TVD Drift */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Markov Transition Matrix */}
        <Card>
          <CardHeader
            title="First-Order Markov Tool Transition Matrix"
            subtitle="Calculated transition probability P(Tool_t | Tool_t-1)"
            icon={<Activity className="w-4 h-4" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-lavender-50/70 border-b border-lavender-100 text-lavender-text-muted font-semibold">
                  <th className="py-2.5 px-4">From Tool</th>
                  <th className="py-2.5 px-4">To Tool</th>
                  <th className="py-2.5 px-4">Probability</th>
                  <th className="py-2.5 px-4">Observed Count</th>
                  <th className="py-2.5 px-4 text-right">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lavender-100/60 font-mono">
                {data?.markov_matrix.map((row, idx) => {
                  const isAnomalous = row.probability < 0.05;
                  return (
                    <tr key={idx} className="hover:bg-lavender-50/50">
                      <td className="py-2.5 px-4 text-lavender-900 font-semibold">{row.from_tool}</td>
                      <td className="py-2.5 px-4 text-lavender-700 flex items-center gap-1.5">
                        <ArrowRight className="w-3 h-3 text-lavender-400" />
                        {row.to_tool}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={isAnomalous ? 'text-rose-600 font-bold' : 'text-emerald-700'}>
                          {(row.probability * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-lavender-text-muted">{row.count}</td>
                      <td className="py-2.5 px-4 text-right">
                        <Badge variant={isAnomalous ? 'danger' : 'success'} size="xs">
                          {isAnomalous ? 'ANOMALOUS' : 'NORMAL'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Total Variation Distance (TVD) Baseline Drift */}
        <Card>
          <CardHeader
            title="Total Variation Distance (TVD) Baseline Drift"
            subtitle="Statistical divergence from promoted golden baseline"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-lavender-50/70 border-b border-lavender-100 text-lavender-text-muted font-semibold">
                  <th className="py-2.5 px-4">Agent ID</th>
                  <th className="py-2.5 px-4">Tracked Metric</th>
                  <th className="py-2.5 px-4">Baseline vs. Current</th>
                  <th className="py-2.5 px-4">Drift %</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lavender-100/60">
                {data?.tvd_drift.map((drift, idx) => {
                  const isCrit = drift.status === 'CRITICAL';
                  const isElev = drift.status === 'ELEVATED';

                  return (
                    <tr key={idx} className="hover:bg-lavender-50/50">
                      <td className="py-2.5 px-4 font-mono font-medium text-lavender-900">
                        {drift.agent_id}
                      </td>
                      <td className="py-2.5 px-4 text-lavender-text-secondary">
                        {drift.metric}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px]">
                        {drift.baseline_value} → {drift.current_value}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`font-mono font-bold ${
                            isCrit ? 'text-rose-600' : isElev ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          +{drift.drift_percent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="xs"
                          isLoading={promoting === drift.agent_id}
                          onClick={() => handlePromote(drift.agent_id)}
                        >
                          Promote
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
