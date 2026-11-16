import React from 'react';
import { Inbox, Radio, ShieldCheck } from 'lucide-react';
import { ChallengeInboxView } from '../../components/ChallengeInboxView';
import { Badge } from '../../components/ui';
import { useTelemetry } from '../../context/TelemetryContext';

export const ApprovalInboxPage: React.FC = () => {
  const { pendingChallengesCount } = useTelemetry();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-lavender-100 shadow-lavender p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold text-lavender-900">
              Human-in-the-Loop Step-Up Approval Inbox
            </h1>
            <Badge variant={pendingChallengesCount > 0 ? 'warning' : 'neutral'} size="xs">
              {pendingChallengesCount} Pending Action
            </Badge>
          </div>
          <p className="text-xs text-lavender-text-secondary mt-1">
            Real-time countdown timer with 60s fail-closed timeouts, HMAC-SHA256 operator step-up token inspection, and Slack Block-Kit webhook simulation.
          </p>
        </div>
      </div>

      {/* Embedded Component */}
      <div className="bg-white rounded-2xl border border-lavender-100 shadow-lavender p-6">
        <ChallengeInboxView />
      </div>
    </div>
  );
};
