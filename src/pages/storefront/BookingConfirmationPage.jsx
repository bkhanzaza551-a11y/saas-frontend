import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { Check, CalendarDays, ArrowRight } from "lucide-react";

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
      <div className="storefront-wrapper" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: 'var(--surface)' }}>
        <div style={{ textAlign: "center", padding: "120px 20px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "1.2rem", fontWeight: 300 }}>Confirming your reservation...</p>
        </div>
      </div>
    );
  }

  if (!orderNumber) {
    return (
      <div className="storefront-wrapper" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: 'var(--surface)' }}>
        <div style={{ textAlign: "center", padding: "120px 20px", maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: "2.5rem", marginBottom: 24, fontFamily: 'var(--font-serif)', fontWeight: 500 }}>Invalid Access</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 40, fontSize: '1.1rem', fontWeight: 300 }}>No booking information found.</p>
          <Link to={`/site/${slug}`} className="sf-btn-primary">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="storefront-wrapper" style={{ background: 'var(--surface)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px' }}>
      <div style={{ maxWidth: 700, width: '100%', margin: '0 auto', background: 'var(--bg-main)', padding: '80px 48px', border: '1px solid var(--border)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        
        {/* Decorative Top Accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--accent)' }} />

        <div style={{ width: 80, height: 80, background: "var(--accent)", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 40px", boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}>
          <Check size={36} strokeWidth={2.5} />
        </div>
        
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3.5rem', margin: '0 0 24px', fontWeight: 500 }}>Reservation Confirmed</h1>
        
        {error ? (
          <p style={{ color: '#be123c', marginBottom: 48, lineHeight: 1.8, fontSize: '1.1rem', background: '#fff1f2', padding: '24px', borderLeft: '4px solid #be123c', fontWeight: 500 }}>{error}</p>
        ) : (
          <div style={{ color: 'var(--text-muted)', marginBottom: 60, lineHeight: 1.8, fontSize: '1.1rem', fontWeight: 300 }}>
            <p style={{ marginBottom: 24 }}>Thank you for your reservation. Your booking reference is <br/><strong style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontFamily: 'var(--font-serif)', display: 'inline-block', marginTop: 12, padding: '8px 24px', border: '1px solid var(--border)', background: 'var(--surface)' }}>{orderNumber}</strong></p>
            
            {booking?.startAt && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'var(--surface)', padding: '16px 32px', border: '1px solid var(--border)', marginTop: 8 }}>
                <CalendarDays size={20} style={{ color: 'var(--accent)' }} />
                <span>
                  <strong style={{ color: 'var(--text-main)', fontWeight: 500 }}>{new Date(booking.startAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong> at <strong style={{ color: 'var(--text-main)', fontWeight: 500 }}>{new Date(booking.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</strong>
                </span>
              </div>
            )}
            <p style={{ marginTop: 40, fontSize: '1rem', borderTop: '1px solid var(--border)', paddingTop: 40 }}>We look forward to seeing you. You can track your booking status anytime using your reference number.</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={`/site/${slug}/my-bookings`} className="sf-btn-primary">Track Reservation <ArrowRight size={16} /></Link>
          <Link to={`/site/${slug}/services`} className="sf-btn-outline">Book Another Service</Link>
        </div>
      </div>
    </div>
  );
}
