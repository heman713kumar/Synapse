import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from './ui/Button';

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRefresh = () => {
    this.setState({ hasError: false }, () => window.location.reload());
  };

  handleHome = () => {
    this.setState({ hasError: false }, () => {
      window.location.href = '/';
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
          <div className="max-w-md w-full surface p-8 animate-fade-in-up">
            <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center bg-destructive/10 text-destructive mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
            <p className="mt-2 text-muted-foreground">
              We're sorry for the inconvenience. The error has been logged.
            </p>
            {this.state.error?.message && (
              <pre className="mt-4 text-left rounded-lg bg-muted/50 p-3 text-xs overflow-auto max-h-32 text-muted-foreground">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Button variant="gradient" onClick={this.handleRefresh} leftIcon={<RotateCcw className="h-4 w-4" />} fullWidth>
                Refresh
              </Button>
              <Button variant="outline" onClick={this.handleHome} leftIcon={<Home className="h-4 w-4" />} fullWidth>
                Go home
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
