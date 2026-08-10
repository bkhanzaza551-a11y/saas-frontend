import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { api } from "../../api/client";
import { CalendarSearch } from "lucide-react";

export default function MyBookingsPage() {
  const { salon } = useOutletContext();
  const [phone, setPhone] = useState(() => localStorage.getItem("sf_customer_phone") || "");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `My Bookings — ${salon.name}`;
    window.scrollTo(0, 0);
  }, [salon.name]);

  // Auto-search if phone is found in localStorage
  useEffect(() => {
    if (phone && !searched && salon.slug) {
      handleSearch();
    }
  }, [salon.slug]);

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!phone) return;
    
    // Save to localStorage for future visits
    localStorage.setItem("sf_customer_phone", phone);
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/public/salon/${salon.slug}/my-bookings`, { params: { phone } });
      // Depending on API, this might return a single booking or array. 
      // Assuming array for "My Bookings" list or we just show a message.
      const data = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
      setBookings(data);
      setSearched(true);
    } catch (err) {
      setError("Could not find any bookings with this phone number.");
    } finally {
      setLoading(false);
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
              placeholder="e.g. +1234567890" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ width: '100%', padding: "16px 20px", borderRadius: 8, border: "1px solid var(--border)", fontSize: "1.1rem", background: 'var(--bg-main)', color: 'var(--text-main)', transition: 'border-color 0.2s', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <button type="submit" className="sf-btn-primary" disabled={loading} style={{ padding: '16px', fontSize: '1.1rem', borderRadius: 8, marginTop: 8 }}>
            {loading ? "Searching..." : "Track Bookings"}
          </button>
        </form>
      ) : (
        <div className="sf-animate">
          {error && <div style={{ color: "#ef4444", background: '#fef2f2', border: '1px solid #fee2e2', padding: 16, borderRadius: 8, textAlign: "center", marginBottom: 32, fontSize: '0.95rem' }}>{error}</div>}
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: "1.4rem", fontFamily: 'var(--font-serif)', fontWeight: 500, margin: 0 }}>Found {bookings.length} {bookings.length === 1 ? 'Appointment' : 'Appointments'}</h3>
            <button onClick={() => { setSearched(false); setPhone(""); setBookings([]); }} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 500, cursor: "pointer", fontSize: "0.95rem", padding: 0 }}>Search Again</button>
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
              {bookings.map((booking, i) => (
                <div key={i} className="sf-booking-panel" style={{ padding: '32px', display: "flex", justifyContent: "space-between", alignItems: "center", background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 500 }}>Order #{booking.orderNumber}</span>
                      <span style={{ padding: "4px 10px", borderRadius: 100, background: booking.status === "COMPLETED" ? "#ecfdf5" : (booking.status === "CONFIRMED" ? "#e0e7ff" : (booking.status === "CANCELLED" ? "#fef2f2" : "#f1f5f9")), color: booking.status === "COMPLETED" ? "#059669" : (booking.status === "CONFIRMED" ? "#4f46e5" : (booking.status === "CANCELLED" ? "#e11d48" : "#475569")), fontSize: "0.75rem", fontWeight: 600, letterSpacing: '0.5px' }}>
                        {booking.status}
                      </span>
                    </div>
                    <h4 style={{ fontSize: "1.6rem", margin: '0 0 12px', fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--text-main)' }}>{booking.serviceName || "Premium Service"}</h4>
                    <div style={{ color: "var(--text-muted)", fontSize: '1rem', fontWeight: 300, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CalendarSearch size={16} />
                      {booking.startAt ? new Date(booking.startAt).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : (booking.date + " at " + booking.time)}
                    </div>
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
