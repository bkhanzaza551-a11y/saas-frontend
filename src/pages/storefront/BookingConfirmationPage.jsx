import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";

export default function BookingConfirmationPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }
    api.get(`/public/salon/${slug}/track-booking`, { params: { bookingNumber: orderNumber, phone: "" } })
      .then(res => { setBooking(res.data.booking || res.data); })
      .catch(() => setError("Could not load booking details."))
      .finally(() => setLoading(false));
  }, [slug, orderNumber]);

  if (loading) {
    return (
      <div style={{ padding: 120, textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: "4px solid #e5e7eb", borderTopColor: "var(--sf-accent, #c8a97e)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 24px" }} />
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (!orderNumber) {
    return (
      <div style={{ padding: 120, textAlign: "center" }}>
        <h2>Invalid Access</h2>
        <p style={{ color: "var(--sf-text-muted)", marginTop: 16 }}>No booking information found.</p>
        <Link to={`/site/${slug}`} className="sf-btn-dark" style={{ display: "inline-block", marginTop: 24 }}>Back to Home</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh', padding: '80px 20px', textAlign: 'center' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ width: 80, height: 80, background: "#dcfce7", color: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        
        <h1 style={{ fontFamily: 'var(--sf-font-serif)', fontSize: '2.5rem', margin: '0 0 16px' }}>Booking Confirmed!</h1>
        
        {error ? (
          <p style={{ color: '#666', marginBottom: 32, lineHeight: 1.6 }}>{error}</p>
        ) : (
          <p style={{ color: '#666', marginBottom: 32, lineHeight: 1.6 }}>
            Thank you for your booking. Your booking number is <strong style={{ color: 'var(--sf-text-main)' }}>{orderNumber}</strong>.
            {booking?.startAt && <> Your appointment is on <strong>{new Date(booking.startAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong> at <strong>{new Date(booking.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</strong>.</>}
            <br /><br />
            We will send you a confirmation shortly. You can track your booking status anytime.
          </p>
        )}

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={`/site/${slug}/my-bookings`} className="sf-btn sf-btn-primary" style={{ padding: '14px 32px' }}>Track My Booking</Link>
          <Link to={`/site/${slug}/services`} style={{ padding: '14px 32px', border: '2px solid #ddd', borderRadius: 8, textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>Book Another Service</Link>
        </div>
      </div>
    </div>
  );
}
