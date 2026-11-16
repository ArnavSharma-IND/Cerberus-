import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'neutral'
    | 'primary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'taint'
    | 'canary'
    | 'dlp'
    | 'shield'
    | 'quarantine'
    | 'allow'
    | 'block'
    | 'challenge'
    | 'flag';
  size?: 'xs' | 'sm' | 'md';
  hasDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  hasDot = false,
  className = ''
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 font-medium',
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-sm px-2.5 py-1 font-medium'
  }[size];

  const variantMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    neutral: {
      bg: 'bg-lavender-100/70',
      text: 'text-lavender-900',
      border: 'border-lavender-200',
      dot: 'bg-lavender-500'
    },
    primary: {
      bg: 'bg-lavender-500/10',
      text: 'text-lavender-700',
      border: 'border-lavender-300',
      dot: 'bg-lavender-600'
    },
    success: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500'
    },
    allow: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500'
    },
    danger: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500'
    },
    block: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500'
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500'
    },
    challenge: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500'
    },
    info: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      dot: 'bg-indigo-500'
    },
    flag: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      dot: 'bg-indigo-500'
    },
    taint: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      dot: 'bg-purple-600'
    },
    canary: {
      bg: 'bg-pink-50',
      text: 'text-pink-700',
      border: 'border-pink-200',
      dot: 'bg-pink-600'
    },
    dlp: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-600'
    },
    shield: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      dot: 'bg-sky-600'
    },
    quarantine: {
      bg: 'bg-rose-100',
      text: 'text-rose-800',
      border: 'border-rose-300',
      dot: 'bg-rose-600'
    }
  };

  const style = variantMap[variant] || variantMap.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses} ${className}`}
    >
      {hasDot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      {children}
    </span>
  );
};
