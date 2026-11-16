import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Sliders,
  Lock,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  Globe
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardContent, Badge, Button } from '../../components/ui';
import { fetchSystemConfig, updateSystemConfig, SystemConfig } from '../../services/api';

export const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    fetchSystemConfig().then((cfg) => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await updateSystemConfig(config);
      setConfig(updated);
      success('Settings Applied', 'System runtime policy parameters updated successfully.');
    } catch {
      error('Error', 'Failed to update system parameters.');
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-lavender-100 shadow-lavender p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-display font-bold text-lavender-900">
            Firewall Runtime Settings & Gates
          </h1>
          <p className="text-xs text-lavender-text-secondary mt-1">
            Configure enforcement modes, fail-closed policy gates, risk decision score bands, and runtime defenses.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          isLoading={saving}
          leftIcon={<Save className="w-4 h-4" />}
          onClick={handleSave}
        >
          Save Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Modes & Safety Gates */}
        <Card>
          <CardHeader
            title="Operational Modes & Safety Gates"
            subtitle="Configure interceptor posture and fail-safe defaults"
            icon={<Shield className="w-4 h-4 text-lavender-600" />}
          />
          <CardContent className="space-y-5 text-xs">
            {/* Mode: Enforce vs Monitor */}
            <div className="flex items-center justify-between p-3.5 bg-lavender-50 rounded-xl border border-lavender-200">
              <div>
                <div className="font-semibold text-lavender-900 text-sm">
                  Interception Mode: {config.mode}
                </div>
                <p className="text-lavender-text-secondary mt-0.5">
                  {config.mode === 'ENFORCE'
                    ? 'Active Zero-Trust: tool calls meeting risk thresholds are blocked immediately.'
                    : 'Passive Monitor: telemetry is recorded without dropping tool calls.'}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-lavender-200">
                <button
                  onClick={() => setConfig({ ...config, mode: 'ENFORCE' })}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    config.mode === 'ENFORCE'
                      ? 'bg-lavender-600 text-white shadow-sm'
                      : 'text-lavender-700 hover:text-lavender-900'
                  }`}
                >
                  ENFORCE
                </button>
                <button
                  onClick={() => setConfig({ ...config, mode: 'MONITOR' })}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    config.mode === 'MONITOR'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-lavender-700 hover:text-lavender-900'
                  }`}
                >
                  MONITOR
                </button>
              </div>
            </div>

            {/* Fail-Closed Policy Gate */}
            <div className="flex items-center justify-between p-3.5 bg-lavender-50 rounded-xl border border-lavender-200">
              <div>
                <div className="font-semibold text-lavender-900 text-sm">
                  Fail-Closed Default (Deny on Engine Failure)
                </div>
                <p className="text-lavender-text-secondary mt-0.5">
                  If OPA engine or scoring pipeline errors or times out, reject execution with 1.0 BLOCK.
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.fail_closed}
                onChange={(e) => setConfig({ ...config, fail_closed: e.target.checked })}
                className="w-5 h-5 accent-lavender-600 rounded cursor-pointer"
              />
            </div>

            {/* HMAC Identity Requirement */}
            <div className="flex items-center justify-between p-3.5 bg-lavender-50 rounded-xl border border-lavender-200">
              <div>
                <div className="font-semibold text-lavender-900 text-sm">
                  Require Cryptographic HMAC Identity
                </div>
                <p className="text-lavender-text-secondary mt-0.5">
                  Require valid Bearer token for all MCP client tool invocations.
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.require_signed_identity}
                onChange={(e) => setConfig({ ...config, require_signed_identity: e.target.checked })}
                className="w-5 h-5 accent-lavender-600 rounded cursor-pointer"
              />
            </div>

            {/* Response Shield */}
            <div className="flex items-center justify-between p-3.5 bg-lavender-50 rounded-xl border border-lavender-200">
              <div>
                <div className="font-semibold text-lavender-900 text-sm">
                  Response-Side Inspection & LLM Adjudicator
                </div>
                <p className="text-lavender-text-secondary mt-0.5">
                  Sanitize indirect prompt injection payloads before context reflection.
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.response_inspection_active}
                onChange={(e) => setConfig({ ...config, response_inspection_active: e.target.checked })}
                className="w-5 h-5 accent-lavender-600 rounded cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Behavioral Threshold Sliders */}
        <Card>
          <CardHeader
            title="Decision Threshold Sliders"
            subtitle="Fine-tune sensitivity bands for automated actions"
            icon={<Sliders className="w-4 h-4 text-lavender-600" />}
          />
          <CardContent className="space-y-6 text-xs">
            {/* Block Threshold Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-lavender-900 text-sm">
                    Automated BLOCK Threshold
                  </span>
                  <p className="text-lavender-text-muted mt-0.5">
                    Composite anomaly scores at or above this trigger instant 1.0 BLOCK.
                  </p>
                </div>
                <span className="font-mono text-base font-bold text-rose-600">
                  {((config.block_threshold || 0.70) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={config.block_threshold}
                onChange={(e) => setConfig({ ...config, block_threshold: parseFloat(e.target.value) })}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            {/* Challenge Threshold Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-lavender-900 text-sm">
                    Human CHALLENGE Step-Up Threshold
                  </span>
                  <p className="text-lavender-text-muted mt-0.5">
                    Ambiguous calls between challenge and block enter the Approval Inbox.
                  </p>
                </div>
                <span className="font-mono text-base font-bold text-amber-600">
                  {((config.challenge_threshold || 0.45) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.25"
                max="0.65"
                step="0.05"
                value={config.challenge_threshold}
                onChange={(e) => setConfig({ ...config, challenge_threshold: parseFloat(e.target.value) })}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Rate Limit */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-lavender-900 text-sm">
                    Rate Limit per Minute
                  </span>
                  <p className="text-lavender-text-muted mt-0.5">
                    Maximum allowed MCP tool calls per agent session before throttling.
                  </p>
                </div>
                <span className="font-mono text-base font-bold text-lavender-900">
                  {config.rate_limit_per_minute} calls/min
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="600"
                step="30"
                value={config.rate_limit_per_minute}
                onChange={(e) => setConfig({ ...config, rate_limit_per_minute: parseInt(e.target.value) })}
                className="w-full accent-lavender-600 cursor-pointer"
              />
            </div>

            {/* OPA Server URL */}
            <div>
              <label className="font-semibold text-lavender-900 block mb-1">
                Open Policy Agent (OPA) Endpoint URL:
              </label>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-lavender-400" />
                <input
                  type="text"
                  value={config.opa_url}
                  onChange={(e) => setConfig({ ...config, opa_url: e.target.value })}
                  className="flex-1 p-2 bg-lavender-50 border border-lavender-200 rounded-lg font-mono text-xs text-lavender-900 focus:outline-none focus:ring-2 focus:ring-lavender-500/30"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
