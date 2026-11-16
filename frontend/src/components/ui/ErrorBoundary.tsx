import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Cerberus SOC Dashboard Error Boundary caught error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 shadow-lavender-md text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-lavender-900 mb-2">
            {this.props.fallbackTitle || 'Component Error Intercepted'}
          </h2>
          <p className="text-sm text-lavender-text-secondary mb-4">
            The Cerberus SOC UI caught an unhandled component exception. Your session remains secure.
          </p>
          {this.state.error && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs font-mono text-slate-700 overflow-x-auto mb-6 max-h-36">
              {this.state.error.message}
            </div>
          )}
          <div className="flex justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={this.handleReset}
            >
              Retry View
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload Console
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
