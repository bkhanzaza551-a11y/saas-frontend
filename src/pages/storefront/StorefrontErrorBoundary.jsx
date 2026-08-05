import { Component } from "react";
import { Link } from "react-router-dom";

export default class StorefrontErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 20px", textAlign: "center", minHeight: "60vh" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "2rem" }}>!</div>
          <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "2.5rem", marginBottom: 16 }}>Something went wrong</h1>
          <p style={{ color: "#666", fontSize: "1.1rem", marginBottom: 32 }}>An unexpected error occurred. Please try again.</p>
          <Link to={this.props.slug ? `/site/${this.props.slug}` : "/"} className="sf-btn sf-btn-primary" style={{ padding: "14px 32px" }}>
            Back to Home
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}
