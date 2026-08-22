import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { api } from "../../api/client";
import { CalendarSearch, XCircle, Phone, Search, ArrowRight, Clock, CheckCircle2, RefreshCw } from "lucide-react";

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

export default function MyBookingsPage() {
  const { salon } = useOutletContext();
  const [phone, setPhone] = useState(() => localStorage.getItem("sf_customer_phone") || "");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [cancellingOrder, setCancellingOrder] = useState(null);

  useEffect(() => {
    document.title = `My Bookings — ${salon?.name || "Salon"}`;
    window.scrollTo(0, 0);
  }, [salon?.name]);

  // Auto-search if phone is found in localStorage
  useEffect(() => {
    if (phone && !searched && salon?.slug) {
      handleSearch();
    }
  }, [salon?.slug]);

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!phone) return;
    
    // Save to localStorage for future visits
    localStorage.setItem("sf_customer_phone", phone);
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/public/salon/${salon.slug}/my-bookings`, { params: { phone } });
      const data = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
      setBookings(data);
      setSearched(true);
    } catch (err) {
      setError("Could not find any bookings with this phone number.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (orderNumber) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    setCancellingOrder(orderNumber);
    try {
      await api.patch(`/public/salon/${salon.slug}/my-bookings/${orderNumber}/cancel`, { phone });
      await handleSearch();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel booking. Please contact salon.");
    } finally {
      setCancellingOrder(null);
    }
  };

  return (
    <div className="sf-animate sf-bookings-page" style={{ maxWidth: 800, margin: "60px auto", padding: "0 20px" }}>
      <style>{`
        .sf-bookings-title {
          font-family: var(--font-serif);
          font-size: clamp(1.8rem, 5vw, 3.2rem);
          color: var(--text-main);
          margin-bottom: 12px;
          font-weight: 500;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }
        .sf-booking-panel {
          padding: 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--surface);
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .sf-booking-panel:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
        }
        @media (max-width: 650px) {
          .sf-bookings-page { margin: 24px auto !important; padding: 0 14px !important; }
          .sf-bookings-form { padding: 24px 16px !important; }
          .sf-booking-panel {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            padding: 18px 16px !important;
          }
          .sf-booking-price-col {
            width: 100% !important;
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding-top: 14px !important;
            border-top: 1px dashed var(--border) !important;
          }
          .sf-lookup-chip {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
        }
      `}</style>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <h1 className="sf-bookings-title">Track Appointments</h1>
        <p style={{ fontSize: "clamp(0.92rem, 2.5vw, 1.05rem)", color: "var(--text-muted)", fontWeight: 300, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          Enter the mobile number you used during booking to check status and appointment details.
        </p>
      </div>

      {!searched ? (
        <form onSubmit={handleSearch} className="sf-bookings-form" style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 440, margin: "0 auto", background: 'var(--surface)', padding: 36, borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid var(--border)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>Registered Phone Number</label>
            <div style={{ position: "relative" }}>
              <Phone size={18} color="var(--text-muted)" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                required
                style={{ width: "100%", padding: "14px 16px 14px 44px", background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none', boxSizing: "border-box" }}
              />
            </div>
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: "0.85rem", fontWeight: 500 }}>{error}</div>}
          <button type="submit" disabled={loading} className="sf-btn-primary" style={{ width: "100%", marginTop: 4, padding: "14px 20px", border: 'none', borderRadius: '12px', display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: loading ? "wait" : "pointer" }}>
            {loading ? <RefreshCw size={16} className="sf-spin" /> : <Search size={16} />}
            {loading ? "Searching Appointments..." : "Check Booking Status"}
          </button>
        </form>
      ) : (
        <div>
          {/* Sleek Lookup Chip */}
          <div className="sf-lookup-chip" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 18px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            marginBottom: 24,
            gap: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(200, 169, 126, 0.15)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Phone size={16} />
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)", fontWeight: 700 }}>Showing Bookings For</div>
                <div style={{ fontSize: "1.02rem", fontWeight: 700, color: "var(--text-main)" }}>{phone}</div>
              </div>
            </div>
            
            <button 
              onClick={() => { setSearched(false); setBookings([]); }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: "8px",
                background: "var(--bg-main)",
                border: "1px solid var(--border)",
                color: "var(--text-main)",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-main)"; }}
            >
              <Search size={13} /> Check Another Number
            </button>
          </div>

          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--bg-main)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid var(--border)' }}>
                <CalendarSearch size={28} strokeWidth={1.5} />
              </div>
              <h4 style={{ fontSize: '1.35rem', marginBottom: 10, fontFamily: 'var(--font-serif)', fontWeight: 600 }}>No appointments found</h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px', fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.6 }}>We couldn't find any active or past appointments for <strong>{phone}</strong>.</p>
              <Link to={`/site/${salon.slug}/services`} className="sf-btn-primary" style={{ display: 'inline-flex', padding: '12px 28px', borderRadius: '10px', textDecoration: 'none' }}>
                Book Appointment <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {bookings.map((booking, i) => {
                const serviceTitle = booking.serviceInfo?.serviceName || booking.serviceName || "Premium Service";
                const bookingDateTime = booking.serviceInfo?.preferredDate 
                  ? `${booking.serviceInfo.preferredDate} at ${formatTime12Hour(booking.serviceInfo.preferredTime)}`
                  : (booking.startAt ? new Date(booking.startAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : "Scheduled Appointment");
                const canCancel = ["PENDING", "CONFIRMED", "NEW"].includes(booking.status);

                return (
                  <div key={i} className="sf-booking-panel">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Order #{booking.orderNumber}</span>
                        <span style={{ padding: "3px 9px", borderRadius: 100, background: booking.status === "COMPLETED" ? "#ecfdf5" : (booking.status === "CONFIRMED" ? "#e0e7ff" : (booking.status === "CANCELLED" ? "#fef2f2" : "#fef3c7")), color: booking.status === "COMPLETED" ? "#059669" : (booking.status === "CONFIRMED" ? "#4f46e5" : (booking.status === "CANCELLED" ? "#e11d48" : "#d97706")), fontSize: "0.72rem", fontWeight: 700, letterSpacing: '0.4px' }}>
                          {booking.status}
                        </span>
                      </div>
                      <h4 style={{ fontSize: "1.25rem", margin: '0 0 10px', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-main)' }}>{serviceTitle}</h4>
                      <div style={{ color: "var(--text-muted)", fontSize: '0.88rem', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 6, marginBottom: canCancel ? 10 : 0 }}>
                        <Clock size={14} color="var(--accent)" />
                        {bookingDateTime}
                      </div>
                      {canCancel && (
                        <button
                          onClick={() => handleCancelBooking(booking.orderNumber)}
                          disabled={cancellingOrder === booking.orderNumber}
                          style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 0 0" }}
                        >
                          <XCircle size={13} /> {cancellingOrder === booking.orderNumber ? "Cancelling..." : "Cancel Reservation"}
                        </button>
                      )}
                    </div>
                    <div className="sf-booking-price-col" style={{ textAlign: "right", display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                      <div style={{ fontSize: "1.35rem", fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-main)' }}>
                        {salon.currency} {Number(booking.totalAmount || booking.price || booking.total || 0).toLocaleString()}
                      </div>
                      {booking.status === "PENDING" || booking.status === "NEW" ? (
                        <span style={{ fontSize: '0.8rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#f59e0b' }}></span> Awaiting Confirmation</span>
                      ) : booking.status === "CONFIRMED" ? (
                        <span style={{ fontSize: '0.8rem', color: '#059669', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}><CheckCircle2 size={13} /> Confirmed</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
