import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-background border border-border-subtle rounded text-center">
          <div className="w-12 h-12 rounded-full bg-status-danger/10 flex items-center justify-center text-status-danger mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-ink mb-2">
            Component Failure
          </h2>
          <p className="text-sm text-ink-secondary max-w-md mb-6 leading-relaxed">
            {this.props.fallbackMessage || 
              "We encountered an unexpected error while rendering this view. The issue has been logged."}
          </p>
          
          {this.state.error && (
            <div className="bg-background-raised border border-border-subtle rounded p-3 text-left w-full max-w-lg mb-6 overflow-x-auto">
              <code className="text-[11px] text-status-danger font-mono whitespace-pre-wrap break-words">
                {this.state.error.toString()}
              </code>
            </div>
          )}

          <button
            onClick={this.handleReset}
            className="btn-primary"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
