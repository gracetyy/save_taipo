import React from 'react';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log the error to console or send to an error tracking service
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-white rounded-xl border border-red-100 text-center">
          <h3 className="text-lg font-bold text-red-700">Something went wrong</h3>
          <p className="text-sm text-gray-600 mt-2">An error occurred while loading this view. You can reload the page to try again.</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
