import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            background: "hsl(var(--background, 0 0% 100%))",
            color: "hsl(var(--foreground, 0 0% 3.9%))",
          }}
        >
          <div style={{ maxWidth: "480px", textAlign: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "hsl(var(--destructive, 0 84.2% 60.2%) / 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
                fontSize: "24px",
              }}
            >
              ⚠
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              Something went wrong
            </h1>
            <p style={{ color: "hsl(var(--muted-foreground, 0 0% 45.1%))", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              An unexpected error occurred. Refreshing usually resolves this.
            </p>
            {this.state.error && (
              <pre
                style={{
                  textAlign: "left",
                  fontSize: "0.75rem",
                  background: "hsl(var(--muted, 0 0% 96.1%))",
                  padding: "1rem",
                  borderRadius: "8px",
                  overflow: "auto",
                  maxHeight: "160px",
                  marginBottom: "1.5rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              style={{
                padding: "0.5rem 1.25rem",
                background: "hsl(var(--primary, 262.1 83.3% 57.8%))",
                color: "hsl(var(--primary-foreground, 0 0% 100%))",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
