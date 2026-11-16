import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'elevated' | 'glass' | 'interactive';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantClasses = {
    default:
      'bg-white border border-lavender-100 shadow-lavender rounded-xl transition-all',
    flat:
      'bg-white border border-lavender-100/80 rounded-xl',
    elevated:
      'bg-white border border-lavender-200/80 shadow-lavender-md rounded-2xl',
    glass:
      'glass-lavender rounded-xl shadow-lavender-sm',
    interactive:
      'bg-white border border-lavender-100 hover:border-lavender-300 shadow-lavender hover:shadow-lavender-md rounded-xl transition-all duration-200 cursor-pointer'
  }[variant];

  return (
    <div className={`${variantClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}> = ({ title, subtitle, action, icon, className = '', children }) => {
  if (children) {
    return (
      <div className={`p-5 pb-3 border-b border-lavender-100/80 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`p-5 pb-3 border-b border-lavender-100/80 flex items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-lavender-50 border border-lavender-200 flex items-center justify-center text-lavender-600 shrink-0">
            {icon}
          </div>
        )}
        <div>
          {title && (
            <h3 className="font-semibold text-lavender-900 text-base leading-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-lavender-text-secondary mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div
      className={`p-4 bg-lavender-50/50 border-t border-lavender-100 rounded-b-xl flex items-center justify-between ${className}`}
    >
      {children}
    </div>
  );
};
