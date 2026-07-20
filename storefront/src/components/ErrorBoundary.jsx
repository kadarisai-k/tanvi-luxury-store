import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In production you'd wire this to an error-tracking service.
    console.error("Uncaught error in storefront:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <span className="eyebrow">Something went wrong</span>
            <h1 className="font-display text-2xl text-ink mt-2 mb-4">
              We hit a snag loading this page
            </h1>
            <p className="text-sm text-muted mb-6">
              Please refresh the page. If this keeps happening, get in touch with us on
              WhatsApp and we'll sort it out.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-ink text-cream text-sm font-medium px-7 py-3 hover:bg-ink/90 transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
