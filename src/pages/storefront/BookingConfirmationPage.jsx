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
    <div className="storefront-wrapper confirmation-page-wrapper">
      <style>{`
        .confirmation-page-wrapper {
          background: var(--surface);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
        }
        .confirmation-card {
          max-width: 650px;
          width: 100%;
          margin: 0 auto;
          background: var(--bg-main, #ffffff);
          padding: 48px 40px;
          border: 1px solid var(--border);
          text-align: center;
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          box-shadow: 0 20px 50px -10px rgba(0,0,0,0.07);
        }
        .confirmation-title {
          font-family: var(--font-serif);
          font-size: clamp(1.8rem, 5vw, 2.6rem);
          margin: 0 0 14px;
          font-weight: 700;
          color: var(--text-main);
          letter-spacing: -0.5px;
        }
        .confirmation-details-box {
          background: var(--surface, #f8fafc);
          border-radius: 20px;
          border: 1px solid var(--border, #e2e8f0);
          padding: 24px 20px;
          margin-bottom: 36px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .booking-ref-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border, #e2e8f0);
          padding-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .booking-ref-badge {
          font-size: 0.95rem;
          font-family: monospace;
          font-weight: 700;
          color: var(--accent, #0f766e);
          background: rgba(15, 118, 110, 0.1);
          padding: 6px 14px;
          border-radius: 100px;
          word-break: break-all;
          max-width: 100%;
          letter-spacing: 0.5px;
        }
        .confirmation-actions {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }
        @media (max-width: 600px) {
          .confirmation-page-wrapper {
            padding: 30px 12px !important;
          }
          .confirmation-card {
            padding: 32px 18px !important;
            border-radius: 20px !important;
          }
          .confirmation-details-box {
            padding: 18px 14px !important;
            margin-bottom: 28px !important;
          }
          .booking-ref-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .booking-ref-badge {
            width: 100% !important;
            text-align: center !important;
            box-sizing: border-box !important;
          }
          .confirmation-actions {
            flex-direction: column !important;
            width: 100% !important;
          }
          .confirmation-actions a {
            width: 100% !important;
            box-sizing: border-box !important;
            text-align: center !important;
            justify-content: center !important;
          }
        }
      `}</style>

      <div className="confirmation-card">
        {/* Decorative Top Accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #10b981, #eab308, #10b981)' }} />

        <div className="sf-animate" style={{ animationDelay: '0.1s' }}>
          <div style={{ width: 80, height: 80, background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: '0 12px 24px rgba(16, 185, 129, 0.25)' }}>
            <Check size={38} strokeWidth={2.8} />
          </div>
          
          <h1 className="confirmation-title">Reservation Confirmed</h1>
          
          {error ? (
            <div style={{ marginTop: 24, padding: '20px', borderRadius: '16px', background: '#fff1f2', border: '1px solid #fda4af', color: '#be123c' }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>{error}</p>
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '1.05rem', fontWeight: 300, marginBottom: 28, lineHeight: 1.6 }}>
                Thank you for your reservation. A confirmation email has been sent to you.
              </p>
              
              <div className="confirmation-details-box">
                <div className="booking-ref-row">
                  <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Booking Reference</span>
                  <span className="booking-ref-badge">{orderNumber}</span>
                </div>
                
                {formattedDisplayDateTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#fff', border: '1px solid var(--border, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                      <CalendarDays size={20} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Date & Time</div>
                      <div style={{ color: 'var(--text-main, #0f172a)', fontSize: '1rem', fontWeight: 600 }}>
                        {formattedDisplayDateTime}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="confirmation-actions">
            <Link to={`/site/${slug}/my-bookings`} className="sf-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px 28px', borderRadius: '100px', fontWeight: 700, fontSize: '0.95rem' }}>
              Track Reservation <ArrowRight size={16} style={{ marginLeft: 8 }} />
            </Link>
            <Link to={`/site/${slug}/services`} className="sf-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px 28px', borderRadius: '100px', fontWeight: 700, fontSize: '0.95rem' }}>
              Book Another Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
