import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { Check, CalendarDays, ArrowRight } from "lucide-react";

function formatTime12Hour(time24) {
  if (!time24) return "";
  if (time24.includes("AM") || time24.includes("PM")) return time24;
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return time24;
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

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

  const rawDate = booking?.serviceInfo?.preferredDate;
  const rawTime = booking?.serviceInfo?.preferredTime;
  let formattedDisplayDateTime = "";
  if (rawDate) {
    const formattedTime = formatTime12Hour(rawTime);
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const dStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        formattedDisplayDateTime = `${dStr} at ${formattedTime}`;
      } else {
        formattedDisplayDateTime = `${rawDate} at ${formattedTime}`;
      }
    } catch (e) {
      formattedDisplayDateTime = `${rawDate} at ${formattedTime}`;
    }
  } else if (booking?.startAt) {
    formattedDisplayDateTime = `${new Date(booking.startAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date(booking.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return (
    <div className="storefront-wrapper" style={{ background: 'var(--surface)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px' }}>
      <div style={{ maxWidth: 700, width: '100%', margin: '0 auto', background: 'var(--bg-main)', padding: '60px 48px', border: '1px solid var(--border)', textAlign: 'center', position: 'relative', overflow: 'hidden', borderRadius: '32px', boxShadow: '0 24px 64px -12px rgba(0,0,0,0.08)' }}>
        
        {/* Decorative Top Accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: 'linear-gradient(90deg, var(--accent), #eab308, var(--accent))' }} />

        <div className="sf-animate" style={{ animationDelay: '0.1s' }}>
          <div style={{ width: 96, height: 96, background: "linear-gradient(135deg, var(--accent), #eab308)", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", boxShadow: '0 16px 32px rgba(0,0,0,0.1)' }}>
            <Check size={44} strokeWidth={2.5} />
          </div>
          
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', margin: '0 0 16px', fontWeight: 500, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Reservation Confirmed</h1>
          
          {error ? (
            <div style={{ marginTop: 32, padding: '24px', borderRadius: '16px', background: '#fff1f2', border: '1px solid #fda4af', color: '#be123c' }}>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>{error}</p>
            </div>
          ) : (
            <div style={{ marginTop: 24 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', fontWeight: 300, marginBottom: 40, lineHeight: 1.6 }}>
                Thank you for your reservation. A confirmation email has been sent to you.
              </p>
              
              <div style={{ background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)', padding: '32px', marginBottom: 48, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Booking Reference</span>
                  <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--accent)', background: 'rgba(200, 169, 126, 0.1)', padding: '6px 16px', borderRadius: '100px' }}>{orderNumber}</span>
                </div>
                
                {formattedDisplayDateTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                      <CalendarDays size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Date & Time</div>
                      <div style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 500 }}>
                        {formattedDisplayDateTime}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={`/site/${slug}/my-bookings`} className="sf-btn-primary" style={{ display: 'inline-flex', padding: '16px 36px', borderRadius: '100px' }}>Track Reservation <ArrowRight size={18} style={{ marginLeft: 8 }} /></Link>
            <Link to={`/site/${slug}/services`} className="sf-btn-outline" style={{ display: 'inline-flex', padding: '16px 36px', borderRadius: '100px' }}>Book Another Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
