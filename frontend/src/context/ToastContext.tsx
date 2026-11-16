import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback(
    (title: string, message?: string) => showToast({ type: 'success', title, message }),
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string) => showToast({ type: 'error', title, message }),
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => showToast({ type: 'warning', title, message }),
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string) => showToast({ type: 'info', title, message }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        error,
        warning,
        info,
        dismissToast
      }}
    >
      {children}

      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const config = {
            success: {
              border: 'border-emerald-200',
              bg: 'bg-emerald-50/95',
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
              title: 'text-emerald-950'
            },
            error: {
              border: 'border-rose-200',
              bg: 'bg-rose-50/95',
              icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
              title: 'text-rose-950'
            },
            warning: {
              border: 'border-amber-200',
              bg: 'bg-amber-50/95',
              icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
              title: 'text-amber-950'
            },
            info: {
              border: 'border-lavender-200',
              bg: 'bg-lavender-50/95',
              icon: <Info className="w-5 h-5 text-lavender-600 shrink-0" />,
              title: 'text-lavender-900'
            }
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-xl border ${config.border} ${config.bg} shadow-lavender-md backdrop-blur-md flex items-start justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200`}
            >
              <div className="flex items-start gap-3">
                {config.icon}
                <div>
                  <h4 className={`text-sm font-semibold ${config.title}`}>{toast.title}</h4>
                  {toast.message && (
                    <p className="text-xs text-lavender-text-secondary mt-0.5 leading-snug">
                      {toast.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-lavender-text-muted hover:text-lavender-900 p-0.5 rounded transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
