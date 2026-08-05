import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { formatDuration, formatPrice } from "./storefrontUtils";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&fit=crop";

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    TIME_OPTIONS.push(label);
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

  useEffect(() => {
    document.title = `Booking Summary — ${salon.name}`;
    return () => { document.title = "ReSpark"; };
  }, [salon.name]);

  const hasIncompleteBookings = bookings.some(b => !b.date || !b.time);
  const total = bookings.reduce((sum, b) => sum + Number(b.price) * b.qty, 0);

  if (bookings.length === 0) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 20px", minHeight: "60vh", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "3rem", margin: "0 0 24px", color: "var(--sf-primary)" }}>Booking Summary</h1>
        <p style={{ color: "#666", fontSize: "1.1rem", marginBottom: 32 }}>No services selected yet. Browse our services and book your appointment.</p>
        <Link to={`/site/${slug}/services`} className="sf-btn sf-btn-primary" style={{ padding: "14px 32px" }}>Browse Services</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 20px", minHeight: "60vh" }}>
      <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "3rem", margin: "0 0 40px", color: "var(--sf-primary)" }}>Booking Summary</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 40 }}>
        {bookings.map((booking, index) => (
          <div
            key={`${booking.serviceId}-${booking.date}-${booking.time}-${index}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: 24,
              border: "1px solid var(--sf-border, #e2e8f0)",
              borderRadius: "var(--sf-radius-md, 12px)",
              background: "#fff",
              flexWrap: "wrap",
            }}
          >
            <img
              src={booking.imageUrl || FALLBACK_IMG}
              style={{ width: 100, height: 100, borderRadius: 12, objectFit: "cover" }}
              alt={booking.name}
            />

            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem" }}>{booking.name}</h3>
              {booking.duration ? (
                <p style={{ margin: "4px 0 0", color: "#666", fontSize: "0.85rem" }}>
                  Duration: {formatDuration(booking.duration)}
                </p>
              ) : null}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <span style={{ fontWeight: 700, color: "var(--sf-accent, #c8a97e)" }}>
                  {formatPrice(booking.price, currency)}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: "0.75rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</label>
                <input
                  type="date"
                  min={`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-${String(new Date().getDate()).padStart(2,"0")}`}
                  value={booking.date || ""}
                  onChange={(e) => updateBookingTime(index, e.target.value, booking.time)}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: "0.75rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Time</label>
                <select
                  value={booking.time || ""}
                  onChange={(e) => updateBookingTime(index, booking.date, e.target.value)}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Select time</option>
                  {TIME_OPTIONS.map((t) => {
                    const booked = isSlotBooked(booking.date, t, booking.duration);
                    return <option key={t} value={t} disabled={booked}>{booked ? `${t} (booked)` : t}</option>;
                  })}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              <button
                onClick={() => updateBookingQty(index, booking.qty - 1)}
                style={{ width: 36, height: 36, border: "none", background: "#f8fafc", cursor: "pointer", fontSize: "1rem" }}
              >
                -
              </button>
              <span style={{ width: 40, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.9rem" }}>
                {booking.qty}
              </span>
              <button
                onClick={() => updateBookingQty(index, booking.qty + 1)}
                disabled={booking.qty >= 10}
                style={{ width: 36, height: 36, border: "none", background: "#f8fafc", cursor: booking.qty >= 10 ? "not-allowed" : "pointer", fontSize: "1rem", opacity: booking.qty >= 10 ? 0.5 : 1 }}
              >
                +
              </button>
            </div>

            <div style={{ fontWeight: 700, fontSize: "1.1rem", minWidth: 80, textAlign: "right" }}>
              {formatPrice(Number(booking.price) * booking.qty, currency)}
            </div>

            <button
              onClick={() => removeBooking(index)}
              style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 8, fontSize: "0.85rem" }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div style={{ background: "#fafafa", padding: 32, borderRadius: "var(--sf-radius-lg, 16px)", textAlign: "right" }}>
        <p style={{ fontSize: "1.2rem", margin: "0 0 4px", color: "#666" }}>
          Total ({bookings.reduce((s, b) => s + b.qty, 0)} {bookings.reduce((s, b) => s + b.qty, 0) === 1 ? "service" : "services"}): {formatPrice(total, currency)}
        </p>
        <p style={{ fontSize: "0.85rem", color: "#aaa", margin: "0 0 24px" }}>
          {hasIncompleteBookings ? "Please select a date and time for all services before checkout." : "Final pricing will be confirmed at checkout."}
        </p>
        <Link
          to={hasIncompleteBookings ? "#" : `/site/${slug}/checkout`}
          onClick={(e) => { if (hasIncompleteBookings) e.preventDefault(); }}
          className="sf-btn sf-btn-primary"
          style={{ padding: "16px 48px", opacity: hasIncompleteBookings ? 0.5 : 1, cursor: hasIncompleteBookings ? "not-allowed" : "pointer", pointerEvents: hasIncompleteBookings ? "none" : "auto" }}
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
