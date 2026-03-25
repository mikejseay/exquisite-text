import * as React from "react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.setState({ errorInfo });
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        padding: "2rem",
                        fontFamily: "monospace",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        color: "#ff6b6b",
                        backgroundColor: "#1a1a2e",
                        minHeight: "100vh",
                        overflow: "auto",
                    }}
                >
                    <h1 style={{ color: "#ff6b6b" }}>Something went wrong</h1>
                    <h2 style={{ color: "#ffa502" }}>
                        {this.state.error?.name}: {this.state.error?.message}
                    </h2>
                    <details open style={{ marginTop: "1rem" }}>
                        <summary style={{ cursor: "pointer", color: "#70a1ff" }}>Stack Trace</summary>
                        <pre style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#dfe6e9" }}>
                            {this.state.error?.stack}
                        </pre>
                    </details>
                    {this.state.errorInfo && (
                        <details open style={{ marginTop: "1rem" }}>
                            <summary style={{ cursor: "pointer", color: "#70a1ff" }}>Component Stack</summary>
                            <pre style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#dfe6e9" }}>
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: "1.5rem",
                            padding: "0.5rem 1rem",
                            fontSize: "1rem",
                            cursor: "pointer",
                            backgroundColor: "#70a1ff",
                            color: "#1a1a2e",
                            border: "none",
                            borderRadius: "4px",
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
