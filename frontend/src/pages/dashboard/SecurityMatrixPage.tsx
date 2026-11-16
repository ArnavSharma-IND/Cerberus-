import React from 'react';
import { ShieldCheck, Layers, Sparkles } from 'lucide-react';
import { SecurityMatrixView } from '../../components/SecurityMatrixView';
import { Badge } from '../../components/ui';

export const SecurityMatrixPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-lavender-100 shadow-lavender p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold text-lavender-900">
              8-Dimension Runtime Security Matrix
            </h1>
            <Badge variant="primary" size="xs">8 Defense Engines</Badge>
          </div>
          <p className="text-xs text-lavender-text-secondary mt-1">
            Active telemetry across Scope Governance, Schema Pins, Shadow Tool Registry, Redaction Vault, OWASP Heatmap, Canary Vault, Egress DLP, and Response Shield.
          </p>
        </div>
      </div>

      {/* Embedded 8-Matrix Component */}
      <div className="bg-white rounded-2xl border border-lavender-100 shadow-lavender p-6">
        <SecurityMatrixView />
      </div>
    </div>
  );
};
