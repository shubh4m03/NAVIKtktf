import React from 'react';

/**
 * React Error Boundary for 3D and UI components
 * Catches 3D load errors or runtime crashes and renders a fallback without crashing the entire app.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn(`[NAVIK Hero ErrorBoundary] Caught error in ${this.props.name || 'component'}:`, error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '8px',
          color: '#fca5a5',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          margin: '0.5rem'
        }}>
          ⚠️ {this.props.name || 'Component'} failed to render. {this.state.error?.message}
        </div>
      );
    }

    return this.props.children;
  }
}
