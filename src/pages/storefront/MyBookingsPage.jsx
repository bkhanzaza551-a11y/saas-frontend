import { useState, useMemo } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { api } from "../../api/client";
import ConfirmModal from "./ConfirmModal";

const STATUS_STYLES = {
  PENDING: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
  CONFIRMED: { bg: "#dbeafe", color: "#1e40af", label: "Confirmed" },
  IN_PROGRESS: { bg: "#ede9fe", color: "#5b21b6", label: "In Progress" },
  COMPLETED: { bg: "#dcfce7", color: "#166534", label: "Completed" },
  CANCELLED: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { bg: "#f3f4f6", color: "#374151", label: status };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        background: style.bg,
        color: style.color,
        borderRadius: 100,
        fontSize: "0.8rem",
        fontWeight: 600,
      }}
    >
      {style.label}
    </span>
  );
}

function BookingCard({ booking, currency, onCancel, cancellingId }) {
  const canManage = booking.status === "PENDING" || booking.status === "CONFIRMED";

  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,.06)",
        padding: 28,
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ margin: 0, color: "#666", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.5 }}>Order Number</p>
          <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: "1.15rem" }}>{booking.orderNumber}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 16 }}>
        <div>
          <p style={{ margin: 0, color: "#666", fontSize: "0.8rem" }}>Service</p>
          <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{booking.serviceName}</p>
        </div>
        <div>
          <p style={{ margin: 0, color: "#666", fontSize: "0.8rem" }}>Staff</p>
          <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{booking.staffName || "Any available"}</p>
        </div>
        <div>
          <p style={{ margin: 0, color: "#666", fontSize: "0.8rem" }}>Date</p>
          <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
            {booking.date
              ? new Date(booking.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
              : booking.startAt
                ? new Date(booking.startAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                : "—"}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, color: "#666", fontSize: "0.8rem" }}>Time</p>
          <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
            {booking.time
              || (booking.startAt
                ? new Date(booking.startAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                : "—")}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {booking.paymentStatus && (
            <span
              style={{
                fontSize: "0.8rem",
                padding: "4px 10px",
                borderRadius: 8,
                background: booking.paymentStatus === "PAID" ? "#dcfce7" : "#fef3c7",
                color: booking.paymentStatus === "PAID" ? "#166534" : "#92400e",
                fontWeight: 600,
              }}
            >
              Payment: {booking.paymentStatus}
            </span>
          )}
          {(booking.total || booking.totalAmount || booking.price) != null && (
            <span style={{ fontSize: "0.95rem", fontWeight: 700 }}>
              {currency} {Number(booking.total || booking.totalAmount || booking.price || 0).toFixed(2)}
            </span>
          )}
        </div>

        {canManage && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onCancel(booking)}
              disabled={cancellingId === booking.orderNumber}
              className="sf-cancel-btn"
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                fontWeight: 600,
                background: "white",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: 8,
                cursor: cancellingId === booking.orderNumber ? "not-allowed" : "pointer",
                opacity: cancellingId === booking.orderNumber ? 0.6 : 1,
                transition: "all 0.15s",
              }}
            >
              {cancellingId === booking.orderNumber ? "Cancelling..." : "Cancel Booking"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const { salon } = useOutletContext();
  const { slug } = useParams();
  const currency = salon.currency || "INR";

  const [phone, setPhone] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);

  const { activeBookings, historyBookings } = useMemo(() => {
    const active = bookings.filter((b) => b.status !== "COMPLETED" && b.status !== "CANCELLED");
    const history = bookings.filter((b) => b.status === "COMPLETED" || b.status === "CANCELLED");
    return { activeBookings: active, historyBookings: history };
  }, [bookings]);

  useEffect(() => {
    document.title = `My Bookings — ${salon.name}`;
    return () => { document.title = "ReSpark"; };
  }, [salon.name]);

  const fetchBookings = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setError("Please enter your phone number.");
      return;
    }
    setLoading(true);
    setError("");
    setBookings([]);
    setSearched(true);
    try {
      const res = await api.get(`/public/salon/${slug}/my-bookings?phone=${encodeURIComponent(trimmed)}`);
      const data = Array.isArray(res.data) ? res.data : res.data?.bookings || [];
      setBookings(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setBookings([]);
      } else {
        setError(err.response?.data?.message || "Unable to fetch bookings. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") fetchBookings();
  };

  const handleCancel = (booking) => {
    setConfirmCancel(booking);
  };

  const confirmCancelBooking = () => {
    if (!confirmCancel) return;
    setCancellingId(confirmCancel.orderNumber);
    setConfirmCancel(null);
    api
      .patch(`/public/salon/${slug}/my-bookings/${confirmCancel.orderNumber}/cancel`, { phone: phone.trim() })
      .then(() => {
        setBookings((prev) =>
          prev.map((b) => (b.orderNumber === booking.orderNumber ? { ...b, status: "CANCELLED" } : b))
        );
      })
      .catch((err) => {
        alert(err.response?.data?.message || "Failed to cancel booking. Please try again.");
      })
      .finally(() => setCancellingId(null));
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 20px", minHeight: "60vh" }}>
      <h1
        style={{
          fontFamily: "var(--sf-font-serif)",
          fontSize: "3rem",
          margin: "0 0 8px",
          color: "var(--sf-primary)",
        }}
      >
        My Bookings
      </h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Enter your phone number to view your upcoming and past bookings.
      </p>

      {/* Phone lookup form */}
      <div
        style={{
          background: "white",
          padding: 32,
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#555", marginBottom: 6 }}>
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                fontSize: "1rem",
                outline: "none",
                transition: "border 0.15s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--sf-accent, #c8a97e)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }}
            />
          </div>
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="sf-btn sf-btn-primary"
            style={{ padding: "12px 32px", height: 46, opacity: loading ? 0.6 : 1, flexShrink: 0 }}
          >
            {loading ? "Searching..." : "Find Bookings"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#dc2626",
            padding: 16,
            borderRadius: 8,
            marginBottom: 24,
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
          <p>Searching for your bookings...</p>
        </div>
      )}

      {/* Empty state — before search */}
      {!loading && !searched && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#666",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{ margin: "0 0 8px", color: "#555" }}>Enter your phone number to view your bookings</h3>
          <p style={{ margin: 0, fontSize: "0.95rem" }}>
            We'll look up all appointments associated with your number.
          </p>
        </div>
      )}

      {/* Empty state — after search, no results */}
      {!loading && searched && bookings.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h3 style={{ margin: "0 0 8px", color: "#555" }}>No bookings found</h3>
          <p style={{ margin: 0 }}>No appointments are associated with this phone number.</p>
          <Link
            to={`/site/${salon.slug}/book`}
            style={{
              display: "inline-block",
              marginTop: 20,
              padding: "10px 24px",
              background: "var(--sf-accent, #c8a97e)",
              color: "white",
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Book an Appointment
          </Link>
        </div>
      )}

      {/* Active bookings */}
      {!loading && activeBookings.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: "1.4rem", marginBottom: 16, color: "var(--sf-primary)" }}>Upcoming Bookings</h2>
          {activeBookings.map((booking, i) => (
            <BookingCard
              key={booking.orderNumber || booking.id || i}
              booking={booking}
              currency={currency}
              onCancel={handleCancel}
              cancellingId={cancellingId}
            />
          ))}
        </div>
      )}

      {/* Booking history */}
      {!loading && historyBookings.length > 0 && (
        <div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: 16, color: "var(--sf-primary)" }}>Booking History</h2>
          {historyBookings.map((booking, i) => (
            <BookingCard
              key={booking.orderNumber || booking.id || i}
              booking={booking}
              currency={currency}
              onCancel={handleCancel}
              cancellingId={cancellingId}
            />
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link
          to={`/site/${salon.slug}`}
          style={{ color: "var(--sf-accent, #c8a97e)", textDecoration: "none" }}
        >
          &larr; Back to Home
        </Link>
      </div>

      <ConfirmModal
        open={!!confirmCancel}
        title="Cancel Booking"
        message={`Are you sure you want to cancel booking ${confirmCancel?.orderNumber}? This action cannot be undone.`}
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        danger
        onConfirm={confirmCancelBooking}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
}
