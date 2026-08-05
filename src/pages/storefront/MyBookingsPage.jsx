import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

export default function MyBookingsPage() {
  const { salon } = useOutletContext();
  const [phone, setPhone] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `My Bookings — ${salon.name}`;
    window.scrollTo(0, 0);
  }, [salon.name]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/public/salon/${salon.slug}/track-booking`, { params: { phone } });
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
    <div className="sf-animate" style={{ maxWidth: 800, margin: "100px auto", padding: "0 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <h1 style={{ fontSize: "3.5rem", marginBottom: 16 }}>My Bookings</h1>
        <p style={{ fontSize: "1.2rem", color: "var(--sf-text-muted)" }}>Enter your phone number to track your appointments.</p>
      </div>

      {!searched ? (
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 16, maxWidth: 500, margin: "0 auto" }}>
          <input 
            type="tel" 
            placeholder="e.g. +1234567890" 
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={{ flex: 1, padding: "16px 24px", borderRadius: 100, border: "1px solid var(--sf-border)", fontSize: "1.1rem" }}
          />
          <button type="submit" className="sf-btn-dark" disabled={loading}>
            {loading ? "Searching..." : "Find Bookings"}
          </button>
        </form>
      ) : (
        <div className="sf-animate">
          {error && <div style={{ color: "#ef4444", textAlign: "center", marginBottom: 32 }}>{error}</div>}
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <h3 style={{ fontSize: "1.5rem" }}>Found {bookings.length} Bookings</h3>
            <button onClick={() => { setSearched(false); setPhone(""); setBookings([]); }} style={{ color: "var(--sf-text-muted)", textDecoration: "underline" }}>Search Again</button>
          </div>

          <div style={{ display: "grid", gap: 24 }}>
            {bookings.map((booking, i) => (
              <div key={i} className="sf-booking-panel" style={{ padding: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--sf-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Order #{booking.orderNumber}</div>
                  <h4 style={{ fontSize: "1.5rem", marginBottom: 8 }}>{booking.serviceName || "Premium Service"}</h4>
                  <div style={{ color: "var(--sf-text-muted)" }}>
                    {booking.startAt ? new Date(booking.startAt).toLocaleString() : (booking.date + " at " + booking.time)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 100, background: booking.status === "CONFIRMED" ? "#000" : "#eaeaea", color: booking.status === "CONFIRMED" ? "#fff" : "#000", fontSize: "0.9rem", fontWeight: 500, marginBottom: 12 }}>
                    {booking.status}
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                    {salon.currency} {Number(booking.totalAmount || booking.price).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
