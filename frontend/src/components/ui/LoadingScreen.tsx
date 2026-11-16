import React from 'react';
import { Shield, Loader2 } from 'lucide-react';

export interface LoadingScreenProps {
  message?: string;
  subtext?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Initializing Cerberus SOC Console...',
  subtext = 'Connecting to 5-Pillar Behavioral Security Runtime',
  fullScreen = true
}) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 bg-[#F5F3FF] flex flex-col items-center justify-center'
    : 'w-full py-20 flex flex-col items-center justify-center bg-transparent';

  return (
    <div className={containerClasses}>
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-white border border-lavender-200 shadow-lavender flex items-center justify-center text-lavender-600">
          <Shield className="w-8 h-8 text-lavender-600 animate-pulse-slow" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-lavender-600 border-2 border-white flex items-center justify-center text-white">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-lavender-900 tracking-tight">
        {message}
      </h3>
      {subtext && (
        <p className="text-xs text-lavender-text-secondary mt-1 max-w-sm text-center">
          {subtext}
        </p>
      )}
    </div>
  );
};
