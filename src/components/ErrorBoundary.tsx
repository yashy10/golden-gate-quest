import React, { Component, ReactNode } from 'react';
import GoldenGateLogo from '@/components/GoldenGateLogo';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    // Clear localStorage and reload
    localStorage.removeItem('sf-quest-storage');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mobile-container min-h-screen flex flex-col items-center justify-center px-8 bg-background">
          <GoldenGateLogo size={80} />
          <h1 className="text-2xl font-bold text-foreground mt-6 text-center">
            Oops! Something went wrong
          </h1>
          <p className="text-muted-foreground text-center mt-2 mb-6">
            We encountered an unexpected error. Let's get you back on track.
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            Restart SF Quest
          </button>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-6 py-2 text-sm text-muted-foreground underline"
          >
            Try refreshing instead
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
