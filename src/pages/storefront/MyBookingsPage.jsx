import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { api } from "../../api/client";
import { CalendarSearch, XCircle } from "lucide-react";

export default function MyBookingsPage() {
  const { salon } = useOutletContext();
  const [phone, setPhone] = useState(() => localStorage.getItem("sf_customer_phone") || "");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [cancellingOrder, setCancellingOrder] = useState(null);

  useEffect(() => {
    document.title = `My Bookings — ${salon.name}`;
    window.scrollTo(0, 0);
  }, [salon.name]);

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
    <div className="sf-animate" style={{ maxWidth: 800, margin: "100px auto", padding: "0 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3.5rem", color: "var(--text-main)", marginBottom: 16, fontWeight: 500, letterSpacing: '-1px' }}>My Appointments</h1>
        <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", fontWeight: 300, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          Enter the phone number you used during checkout to view and track your upcoming salon appointments.
        </p>
      </div>

      {!searched ? (
        <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 440, margin: "0 auto", background: 'var(--surface)', padding: 40, borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid var(--border)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 12, fontSize: '0.9rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              required
              style={{ width: "100%", padding: "16px", background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
            />
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>{error}</div>}
          <button type="submit" disabled={loading} className="sf-btn-primary" style={{ width: "100%", marginTop: 8, padding: 16, border: 'none', borderRadius: '100px' }}>
            {loading ? "Searching..." : "Find My Bookings"}
          </button>
        </form>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <span style={{ color: "var(--text-muted)", fontSize: '1.05rem', fontWeight: 300 }}>Showing bookings for <strong style={{ color: "var(--text-main)", fontWeight: 500 }}>{phone}</strong></span>
            <button onClick={() => { setSearched(false); setBookings([]); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.9rem", textDecoration: "underline", textUnderlineOffset: 4 }}>
              Change Phone Number
            </button>
          </div>

          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-main)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--border)' }}>
                <CalendarSearch size={32} strokeWidth={1.5} />
              </div>
              <h4 style={{ fontSize: '1.5rem', marginBottom: 12, fontFamily: 'var(--font-serif)', fontWeight: 500 }}>No appointments found</h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px', fontWeight: 300, lineHeight: 1.6 }}>We couldn't find any upcoming or past bookings associated with <strong>{phone}</strong>.</p>
              <Link to={`/site/${salon.slug}/services`} className="sf-btn-primary" style={{ display: 'inline-flex', padding: '12px 32px', borderRadius: '100px', textDecoration: 'none' }}>
                Book Now
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 24 }}>
              {bookings.map((booking, i) => {
                const serviceTitle = booking.serviceInfo?.serviceName || booking.serviceName || "Premium Service";
                const bookingDateTime = booking.serviceInfo?.preferredDate 
                  ? `${booking.serviceInfo.preferredDate} at ${booking.serviceInfo.preferredTime || ""}`
                  : (booking.startAt ? new Date(booking.startAt).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : "Scheduled Appointment");
                const canCancel = ["PENDING", "CONFIRMED", "NEW"].includes(booking.status);

                return (
                  <div key={i} className="sf-booking-panel" style={{ padding: '32px', display: "flex", justifyContent: "space-between", alignItems: "center", background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 500 }}>Order #{booking.orderNumber}</span>
                        <span style={{ padding: "4px 10px", borderRadius: 100, background: booking.status === "COMPLETED" ? "#ecfdf5" : (booking.status === "CONFIRMED" ? "#e0e7ff" : (booking.status === "CANCELLED" ? "#fef2f2" : "#f1f5f9")), color: booking.status === "COMPLETED" ? "#059669" : (booking.status === "CONFIRMED" ? "#4f46e5" : (booking.status === "CANCELLED" ? "#e11d48" : "#475569")), fontSize: "0.75rem", fontWeight: 600, letterSpacing: '0.5px' }}>
                          {booking.status}
                        </span>
                      </div>
                      <h4 style={{ fontSize: "1.6rem", margin: '0 0 12px', fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--text-main)' }}>{serviceTitle}</h4>
                      <div style={{ color: "var(--text-muted)", fontSize: '1rem', fontWeight: 300, display: 'flex', alignItems: 'center', gap: 8, marginBottom: canCancel ? 12 : 0 }}>
                        <CalendarSearch size={16} />
                        {bookingDateTime}
                      </div>
                      {canCancel && (
                        <button
                          onClick={() => handleCancelBooking(booking.orderNumber)}
                          disabled={cancellingOrder === booking.orderNumber}
                          style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: 0 }}
                        >
                          <XCircle size={14} /> {cancellingOrder === booking.orderNumber ? "Cancelling..." : "Cancel Reservation"}
                        </button>
                      )}
                    </div>
                    <div style={{ textAlign: "right", display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 500, fontFamily: 'var(--font-serif)', color: 'var(--text-main)' }}>
                        {salon.currency} {Number(booking.totalAmount || booking.price || booking.total || 0).toLocaleString()}
                      </div>
                      {booking.status === "PENDING" || booking.status === "NEW" ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }}></span> Awaiting Confirmation</span>
                      ) : booking.status === "CONFIRMED" ? (
                        <span style={{ fontSize: '0.85rem', color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span> Confirmed</span>
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
