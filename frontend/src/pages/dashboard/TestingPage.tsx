import React, { useState } from 'react';
import {
  Flame,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardContent, Badge, Button } from '../../components/ui';
import { AttackReplayTheater } from '../../components/AttackReplayTheater';
import { runTestingScenario, ATTACK_THEATER_SCENARIOS } from '../../services/api';

export const TestingPage: React.FC = () => {
  const [activeScenarioId, setActiveScenarioId] = useState(ATTACK_THEATER_SCENARIOS[0].id);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const { success } = useToast();

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    setRunResult(null);
    try {
      const res = await runTestingScenario(activeScenarioId);
      setRunResult(res);
      success('Attack Benchmark Complete', `Attack neutralized in ${res.enforcement_latency_ms} ms`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-lavender-100 shadow-lavender p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold text-lavender-900">
              Testing & Attack-Replay Theater
            </h1>
            <Badge variant="danger" size="xs">5 Attack Scenarios</Badge>
          </div>
          <p className="text-xs text-lavender-text-secondary mt-1">
            Empirical validation against adversarial mimicry, canary token compromise, egress slow-drip, and indirect injection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="brand"
            size="sm"
            isLoading={isRunning}
            leftIcon={<Zap className="w-4 h-4" />}
            onClick={handleRunBenchmark}
          >
            Execute Live Scenario
          </Button>
        </div>
      </div>

      {/* Benchmark Scenarios Grid Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ATTACK_THEATER_SCENARIOS.map((scen, idx) => {
          const isSelected = activeScenarioId === scen.id;
          return (
            <button
              key={scen.id}
              onClick={() => {
                setActiveScenarioId(scen.id);
                setRunResult(null);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-lavender-600 text-white border-lavender-600 shadow-lavender font-medium'
                  : 'bg-white border-lavender-100 hover:border-lavender-200 text-lavender-900 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${isSelected ? 'text-lavender-200' : 'text-lavender-text-muted'}`}>
                    Scenario 0{idx + 1}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-lavender-100 text-lavender-700'}`}>
                    {scen.category}
                  </span>
                </div>
                <h4 className="text-xs font-semibold leading-tight line-clamp-2">
                  {scen.name}
                </h4>
              </div>
              <div className={`text-[10px] mt-2 line-clamp-1 ${isSelected ? 'text-lavender-100' : 'text-lavender-text-muted'}`}>
                {scen.payload_summary}
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Run Execution Result Banner (if run) */}
      {runResult && (
        <Card className="border-emerald-300 bg-emerald-50/40 animate-in fade-in">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-emerald-950">
                      Adversary Defeated: {runResult.verdict}
                    </h3>
                    <Badge variant="success" size="xs">100% Intercept</Badge>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Attacking step blocked fail-closed at step {runResult.blocked_at_step} via {runResult.defense_pillar}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-emerald-700">Latency: </span>
                  <span className="font-bold text-emerald-950">{runResult.enforcement_latency_ms} ms</span>
                </div>
                <div>
                  <span className="text-emerald-700">Steps Checked: </span>
                  <span className="font-bold text-emerald-950">{runResult.steps_executed}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Theater View */}
      <div className="bg-white rounded-2xl border border-lavender-100 shadow-lavender p-6">
        <AttackReplayTheater />
      </div>
    </div>
  );
};
