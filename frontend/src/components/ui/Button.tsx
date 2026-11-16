import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'brand';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg select-none focus:outline-none focus:ring-2 focus:ring-lavender-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeClasses = {
    xs: 'text-xs px-2.5 py-1.5 gap-1.5',
    sm: 'text-xs px-3 py-2 gap-2',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5'
  }[size];

  const variantClasses = {
    primary:
      'bg-lavender-600 hover:bg-lavender-700 text-white shadow-lavender shadow-sm hover:shadow-md',
    brand:
      'bg-gradient-to-r from-lavender-600 to-indigo-600 hover:from-lavender-700 hover:to-indigo-700 text-white shadow-lavender shadow-md',
    secondary:
      'bg-lavender-100 hover:bg-lavender-200 text-lavender-900 border border-lavender-200/80',
    outline:
      'bg-white hover:bg-lavender-50 text-lavender-900 border border-lavender-200 hover:border-lavender-300 shadow-sm',
    ghost:
      'bg-transparent hover:bg-lavender-100/70 text-lavender-800 hover:text-lavender-900',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow'
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};
