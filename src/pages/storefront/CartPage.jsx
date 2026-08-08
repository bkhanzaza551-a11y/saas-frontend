import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { formatDuration } from "./storefrontUtils";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&fit=crop";

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

export default function CartPage() {
  const { salon, bookings, removeBooking, updateBookingQty, updateBookingTime, selectedBranchId } = useOutletContext();
  const currency = salon.currency || "INR";
  const slug = salon.slug;

  const [bookedSlotsMap, setBookedSlotsMap] = useState({});

  useEffect(() => {
    const uniqueDates = [...new Set(bookings.map(b => b.date).filter(Boolean))];
    if (!uniqueDates.length || !salon?.slug || !selectedBranchId) return;
    Promise.all(
      uniqueDates.map(date =>
        api.get(`/public/salon/${salon.slug}/booked-slots`, { params: { branchId: selectedBranchId, date } })
          .then(res => ({ date, slots: res.data?.bookedSlots || [] }))
          .catch(() => ({ date, slots: [] }))
      )
    ).then(results => {
      const map = {};
      results.forEach(r => { map[r.date] = r.slots; });
      setBookedSlotsMap(map);
    });
  }, [salon?.slug, selectedBranchId, bookings]);

  const isSlotBooked = (date, time, durationMin) => {
    const slots = bookedSlotsMap[date];
    if (!slots || !time) return false;
    const userStartMs = new Date(`${date}T${time}:00`).getTime();
    const userEndMs = userStartMs + (durationMin || 30) * 60000;
    return slots.some(slot => {
      const slotStart = new Date(slot.startAt).getTime();
      const slotEnd = new Date(slot.endAt).getTime();
      return userStartMs < slotEnd && userEndMs > slotStart;
    });
  };

  const hasIncompleteBookings = bookings.some(b => !b.date || !b.time);
  const total = bookings.reduce((sum, b) => sum + Number(b.price) * b.qty, 0);

  if (bookings.length === 0) {
    return (
      <div className="storefront-wrapper" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: 24, letterSpacing: '-1px' }}>Booking Summary</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '1.1rem' }}>No services selected yet. Browse our services and book your appointment.</p>
          <Link to={`/site/${slug}/services`} className="sf-btn-primary">Browse Services</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-section" style={{ background: 'var(--surface)', minHeight: '100vh', paddingTop: 120 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: 40, letterSpacing: '-1px', color: 'var(--text-main)' }}>Booking Summary</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 40 }}>
          {bookings.map((booking, index) => (
            <div
              key={`${booking.serviceId}-${booking.date}-${booking.time}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: 32,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                background: "var(--bg-main)",
                boxShadow: "var(--shadow-sm)",
                flexWrap: "wrap",
              }}
            >
              <img
                src={booking.imageUrl || FALLBACK_IMG}
                style={{ width: 120, height: 120, borderRadius: "var(--radius-md)", objectFit: "cover", background: "var(--surface)" }}
                alt={booking.name}
              />

              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "1.3rem", fontFamily: "var(--font-sans)", fontWeight: 600 }}>{booking.name}</h3>
                {booking.duration ? (
                  <p style={{ margin: "0 0 16px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    Duration: {formatDuration(booking.duration)}
                  </p>
                ) : null}
                
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <div className="sf-form-group" style={{ marginBottom: 0 }}>
                    <input 
                      type="date" 
                      className="sf-form-input" 
                      value={booking.date || ""}
                      onChange={(e) => updateBookingTime(index, e.target.value, booking.time)}
                      style={{ padding: "8px 12px", fontSize: "0.9rem" }}
                    />
                  </div>
                  <div className="sf-form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch' }}>
                      {TIME_OPTIONS.map(time => {
                        const booked = booking.date && isSlotBooked(booking.date, time, booking.duration);
                        return (
                          <button
                            key={time}
                            disabled={booked}
                            onClick={() => updateBookingTime(index, booking.date, time)}
                            title={booked ? "Already booked" : "Available"}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "100px",
                              border: booking.time === time ? "2px solid var(--accent)" : "1px solid var(--border)",
                              background: booked ? "#f1f5f9" : (booking.time === time ? "var(--surface)" : "#fff"),
                              color: booked ? "#94a3b8" : "var(--text-main)",
                              cursor: booked ? "not-allowed" : "pointer",
                              fontWeight: booking.time === time ? 600 : 500,
                              fontSize: "0.85rem",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                              transition: "all 0.2s"
                            }}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 16, minWidth: 120 }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-main)" }}>
                  {currency} {Number(booking.price).toFixed(2)}
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                    <button 
                      onClick={() => updateBookingQty(index, booking.qty - 1)}
                      style={{ background: "none", border: "none", padding: "8px 12px", cursor: "pointer", fontSize: "1.1rem", color: "var(--text-muted)" }}
                    >-</button>
                    <span style={{ padding: "0 8px", fontWeight: 600, fontSize: "0.95rem" }}>{booking.qty}</span>
                    <button 
                      onClick={() => updateBookingQty(index, booking.qty + 1)}
                      style={{ background: "none", border: "none", padding: "8px 12px", cursor: "pointer", fontSize: "1.1rem", color: "var(--text-muted)" }}
                    >+</button>
                  </div>
                  <button 
                    onClick={() => removeBooking(index)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, textDecoration: "underline" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: 32, gap: 40, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-end" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--text-main)" }}>
              Total: {currency} {total.toFixed(2)}
            </div>
            {hasIncompleteBookings && (
              <p style={{ color: "#ef4444", margin: 0, fontWeight: 500 }}>Please select date and time for all services.</p>
            )}
            <div style={{ display: "flex", gap: 16 }}>
              <Link to={`/site/${slug}/services`} className="sf-btn-outline">Add More Services</Link>
              <Link 
                to={hasIncompleteBookings ? "#" : `/site/${slug}/checkout`} 
                className="sf-btn-primary"
                style={hasIncompleteBookings ? { opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" } : {}}
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
