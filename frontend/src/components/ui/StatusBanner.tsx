import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface StatusBannerProps {
  type?: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  description?: string;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  type = 'info',
  title,
  description,
  action,
  onDismiss,
  className = ''
}) => {
  const config = {
    info: {
      bg: 'bg-lavender-50 border-lavender-200 text-lavender-900',
      icon: <Info className="w-5 h-5 text-lavender-600 shrink-0" />,
      descColor: 'text-lavender-text-secondary'
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />,
      descColor: 'text-emerald-800'
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-950',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      descColor: 'text-amber-800'
    },
    danger: {
      bg: 'bg-rose-50 border-rose-200 text-rose-950',
      icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
      descColor: 'text-rose-800'
    }
  }[type];

  return (
    <div
      className={`rounded-xl border p-4 flex items-start justify-between gap-3 shadow-sm ${config.bg} ${className}`}
    >
      <div className="flex items-start gap-3">
        {config.icon}
        <div>
          <div className="font-semibold text-sm">{title}</div>
          {description && (
            <p className={`text-xs mt-0.5 leading-relaxed ${config.descColor}`}>
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
