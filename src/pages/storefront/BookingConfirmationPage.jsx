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
      <div className="storefront-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: "center", padding: "120px 20px" }}>
          <div style={{ width: 48, height: 48, border: "4px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 24px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!orderNumber) {
    return (
      <div className="storefront-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: "center", padding: "120px 20px" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: 16 }}>Invalid Access</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>No booking information found.</p>
          <Link to={`/site/${slug}`} className="sf-btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-section" style={{ background: 'var(--surface)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', background: 'var(--bg-main)', padding: '60px 40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ width: 88, height: 88, background: "rgba(22, 163, 74, 0.1)", color: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', margin: '0 0 24px', letterSpacing: '-1px' }}>Booking Confirmed!</h1>
        
        {error ? (
          <p style={{ color: '#ef4444', marginBottom: 40, lineHeight: 1.6, fontSize: '1.1rem', background: '#fef2f2', padding: 16, borderRadius: 'var(--radius-sm)' }}>{error}</p>
        ) : (
          <div style={{ color: 'var(--text-muted)', marginBottom: 48, lineHeight: 1.8, fontSize: '1.1rem' }}>
            <p style={{ marginBottom: 16 }}>Thank you for your booking. Your booking reference is <strong style={{ color: 'var(--text-main)', fontSize: '1.2rem', padding: '4px 12px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', marginLeft: 8 }}>{orderNumber}</strong>.</p>
            {booking?.startAt && <p>Your appointment is on <strong style={{ color: 'var(--text-main)' }}>{new Date(booking.startAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong> at <strong style={{ color: 'var(--text-main)' }}>{new Date(booking.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</strong>.</p>}
            <p style={{ marginTop: 24, fontSize: '0.95rem' }}>We will send you a confirmation email shortly. You can track your booking status anytime using your reference number.</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={`/site/${slug}/my-bookings`} className="sf-btn-primary" style={{ padding: '16px 32px', fontSize: '1.05rem' }}>Track My Booking</Link>
          <Link to={`/site/${slug}/services`} className="sf-btn-outline" style={{ padding: '16px 32px', fontSize: '1.05rem' }}>Book Another Service</Link>
        </div>
      </div>
    </div>
  );
}
