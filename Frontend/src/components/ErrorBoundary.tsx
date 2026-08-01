import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.pageName ? ` — ${this.props.pageName}` : ''}]`,
      error,
      errorInfo.componentStack,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <AlertTriangle className="w-12 h-12 mb-4" style={{ color: 'var(--color-warning)' }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Algo salió mal
          </h2>
          <p className="text-sm mb-6 max-w-md" style={{ color: 'var(--color-muted)' }}>
            {this.props.pageName
              ? `Ocurrió un error en ${this.props.pageName}.`
              : 'Ocurrió un error inesperado.'}
            {' '}Podés intentar nuevamente.
          </p>
          <button onClick={this.handleRetry} className="btn-primary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
