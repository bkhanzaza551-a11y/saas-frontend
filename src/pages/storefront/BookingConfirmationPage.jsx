import { Link, useParams, useLocation } from "react-router-dom";

export default function BookingConfirmationPage() {
  const { slug } = useParams();
  const location = useLocation();
  const isSuccess = location.state?.success;

  if (!isSuccess) {
    return (
      <div style={{ padding: 120, textAlign: "center" }}>
        <h2>Invalid Access</h2>
        <Link to={`/site/${slug}`} className="sf-btn-dark" style={{ display: "inline-block", marginTop: 24 }}>Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="sf-detail-wrap sf-animate" style={{ gridTemplateColumns: "1fr", margin: "120px auto", textAlign: "center", maxWidth: 800 }}>
      <div style={{ width: 80, height: 80, background: "var(--sf-text-main)", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      
      <h1 style={{ fontSize: "3rem", marginBottom: 24 }}>Booking Confirmed</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--sf-text-muted)", marginBottom: 40, lineHeight: 1.6 }}>
        Thank you for choosing us. Your booking has been successfully received. We will send you an email confirmation shortly with all the details.
      </p>

      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        <Link to={`/site/${slug}`} className="sf-btn-outline">Return to Home</Link>
        <Link to={`/site/${slug}/services`} className="sf-btn-dark">Book Another Service</Link>
      </div>
    </div>
  );
}
