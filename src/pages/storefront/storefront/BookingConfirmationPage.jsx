import { useState, useEffect } from "react";
import { Link, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../../api/client";

const generateIcsFile = (booking, salon) => {
  if (!booking) return;
  const startAt = new Date(booking.startAt);
  const endAt = new Date(booking.endAt);
  const pad = (n) => String(n).padStart(2, "0");
  const formatDate = (d) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const serviceName = booking.items?.[0]?.service?.name || booking.serviceName || "Service";
  const summary = `${serviceName} at ${salon?.name || "Salon"}`;
  const description = `Booking Reference: ${booking.bookingNumber || booking.id}\\nService: ${serviceName}\\nPrice: ${booking.totalAmount || booking.total || ""}`;
  const location = booking.branch?.address || salon?.address || "";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Salon Booking//EN",
    "BEGIN:VEVENT",
    `DTSTART:${formatDate(startAt)}`,
    `DTEND:${formatDate(endAt)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `UID:${booking.id || booking.bookingNumber}@salon`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `booking-${booking.bookingNumber || booking.id}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function BookingConfirmationPage() {
  const { salon } = useOutletContext();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const currency = salon?.currency || "INR";

  useEffect(() => {
    if (!slug || !orderNumber) {
      setLoading(false);
      return;
    }
    api
      .get(`/public/salon/${slug}/track-booking?bookingNumber=${orderNumber}`)
      .then((res) => {
        setBooking(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, orderNumber]);

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 20px", textAlign: "center", color: "#999" }}>
        Loading booking details...
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "2rem" }}>✕</div>
        <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "2.5rem", marginBottom: 16 }}>Booking Not Found</h1>
        <p style={{ color: "#666", fontSize: "1.1rem", marginBottom: 32 }}>We couldn't find a booking with the reference you provided.</p>
        {orderNumber && <p style={{ color: "#999", marginBottom: 24 }}>Reference: <strong>{orderNumber}</strong></p>}
        <Link to={`/site/${slug}`} className="sf-btn sf-btn-primary" style={{ padding: "14px 32px" }}>Back to Home</Link>
      </div>
    );
  }

  const serviceName = booking.items?.[0]?.service?.name || booking.serviceName || "Service";
  const servicePrice = booking.items?.[0]?.service?.price || booking.items?.[0]?.price || booking.totalAmount || booking.total || 0;
  const duration = booking.items?.[0]?.service?.durationMin || booking.durationMin || "";
  const startAt = booking.startAt ? new Date(booking.startAt) : null;
  const endAt = booking.endAt ? new Date(booking.endAt) : null;
  const dateStr = startAt ? startAt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "";
  const timeStr = startAt
    ? `${startAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}${endAt ? ` - ${endAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : ""}`
    : "";
  const paymentStatus = booking.paymentStatus || "PENDING";

  const PAYMENT_BADGE = {
    PAID: { bg: "#dcfce7", color: "#166534" },
    PENDING: { bg: "#fef3c7", color: "#92400e" },
    REFUNDED: { bg: "#dbeafe", color: "#1e40af" },
    FAILED: { bg: "#fee2e2", color: "#991b1b" },
    CANCELLED: { bg: "#f3f4f6", color: "#374151" }
  };
  const badgeStyle = PAYMENT_BADGE[paymentStatus] || PAYMENT_BADGE.PENDING;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 20px" }}>
      {/* Success Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", animation: "sf-check-pop 0.5s ease-out" }}>
          <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>✓</span>
        </div>
        <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "2.5rem", margin: "0 0 8px" }}>Booking Confirmed!</h1>
        <p style={{ color: "#666", fontSize: "1.1rem" }}>Your appointment has been successfully booked.</p>
      </div>

      {/* Booking Details Card */}
      <div style={{ background: "white", padding: 32, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,.06)", marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ margin: 0, color: "#999", fontSize: "0.85rem" }}>Booking Reference</p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1.2rem" }}>{booking.bookingNumber || booking.orderNumber || booking.id}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, color: "#999", fontSize: "0.85rem" }}>Payment Status</p>
            <span style={{ display: "inline-block", padding: "4px 12px", background: badgeStyle.bg, color: badgeStyle.color, borderRadius: 100, fontSize: "0.8rem", fontWeight: 600 }}>{paymentStatus}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #eee", paddingTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, color: "#999", fontSize: "0.85rem" }}>Service</p>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "1.05rem" }}>{serviceName}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, color: "#999", fontSize: "0.85rem" }}>Price</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1.15rem", color: "var(--sf-accent)" }}>{currency} {Number(servicePrice).toFixed(2)}</p>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
            <p style={{ margin: 0, color: "#999", fontSize: "0.85rem" }}>Date & Time</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{dateStr}</p>
            <p style={{ margin: 0, color: "#555" }}>{timeStr}</p>
          </div>

          {duration && (
            <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
              <p style={{ margin: 0, color: "#999", fontSize: "0.85rem" }}>Duration</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{duration} minutes</p>
            </div>
          )}

          {booking.branch && (
            <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
              <p style={{ margin: 0, color: "#999", fontSize: "0.85rem" }}>Location</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{booking.branch.name || salon?.name}</p>
              {booking.branch.address && <p style={{ margin: 0, color: "#555", fontSize: "0.9rem" }}>{booking.branch.address}</p>}
            </div>
          )}

          {booking.staffName && (
            <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
              <p style={{ margin: 0, color: "#999", fontSize: "0.85rem" }}>Staff</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{booking.staffName}</p>
            </div>
          )}

          {(booking.customerName || booking.customerPhone) && (
            <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
              <p style={{ margin: 0, color: "#999", fontSize: "0.85rem" }}>Customer</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{booking.customerName || ""}</p>
              {booking.customerPhone && <p style={{ margin: 0, color: "#555", fontSize: "0.9rem" }}>{booking.customerPhone}</p>}
              {booking.customerEmail && <p style={{ margin: 0, color: "#555", fontSize: "0.9rem" }}>{booking.customerEmail}</p>}
            </div>
          )}
        </div>
      </div>

      {/* What's Next */}
      <div style={{ background: "#f9fafb", padding: 24, borderRadius: 12, marginBottom: 32 }}>
        <p style={{ margin: "0 0 8px", fontWeight: 600 }}>What happens next?</p>
        <ul style={{ margin: 0, paddingLeft: 20, color: "#555", lineHeight: 1.8 }}>
          <li>You'll receive a confirmation shortly</li>
          <li>Please arrive 10 minutes before your appointment</li>
          {paymentStatus === "PAID" ? <li>Payment has been processed</li> : <li>Pay at the salon when you arrive</li>}
        </ul>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          className="sf-btn sf-btn-secondary"
          style={{ padding: "14px 32px" }}
          onClick={() => generateIcsFile(booking, salon)}
        >
          Add to Calendar
        </button>
        <Link to={`/site/${slug}/my-bookings`} className="sf-btn sf-btn-secondary" style={{ padding: "14px 32px" }}>
          View My Bookings
        </Link>
        <Link to={`/site/${slug}/services`} className="sf-btn sf-btn-primary" style={{ padding: "14px 32px" }}>
          Book Another Service
        </Link>
      </div>

      <style>{`
        @keyframes sf-check-pop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
