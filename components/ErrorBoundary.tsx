import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('[calendario.ch] Errore imprevisto intercettato:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[var(--page)] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[var(--cream)] border border-[var(--edge)] rounded-2xl p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h1 className="text-xl font-bold text-[var(--ink)]">
              Si è verificato un errore
            </h1>
            <p className="text-xs text-[var(--muted)]">
              L'applicazione ha riscontrato un problema imprevisto. Nessun dato personale è stato compromesso.
            </p>
            {this.state.error && (
              <pre className="text-[11px] font-mono bg-[var(--paper)] p-3 rounded-lg text-left overflow-auto max-h-32 text-[var(--muted)]">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <button onClick={this.handleReset} className="btn line text-xs h-9">
                Riprova
              </button>
              <button onClick={this.handleReload} className="btn dark text-xs h-9 flex items-center gap-1.5">
                <RefreshCw size={13} />
                Ricarica la pagina
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
