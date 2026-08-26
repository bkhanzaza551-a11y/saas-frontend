import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { api } from "../../api/client";
import { CalendarSearch, XCircle, Phone, Search, ArrowRight, Clock, CheckCircle2, RefreshCw, Sparkles, MapPin, User, ShieldCheck, ChevronRight } from "lucide-react";

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
    document.title = `My Appointments — ${salon?.name || "Luxury Salon"}`;
    window.scrollTo(0, 0);
  }, [salon?.name]);

  useEffect(() => {
    if (phone && !searched && salon?.slug) {
      handleSearch();
    }
  }, [salon?.slug]);

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!phone) return;
    
    localStorage.setItem("sf_customer_phone", phone);
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/public/salon/${salon.slug}/my-bookings`, { params: { phone } });
      const data = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
      setBookings(data);
      setSearched(true);
    } catch (err) {
      setError("No appointments found associated with this mobile number.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (orderNumber) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setCancellingOrder(orderNumber);
    try {
      await api.patch(`/public/salon/${salon.slug}/my-bookings/${orderNumber}/cancel`, { phone });
      await handleSearch();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel booking. Please contact front desk.");
    } finally {
      setCancellingOrder(null);
    }
  };

  const currency = salon?.currency || "INR";

  return (
    <div className="storefront-wrapper" style={{ background: "#ffffff", minHeight: "80vh", color: "#0f172a", fontFamily: "'Poppins', -apple-system, sans-serif" }}>
      <style>{`
        @media (max-width: 600px) {
          .my-booking-card {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 18px 16px !important;
          }
          .my-booking-card > div:last-child {
            width: 100% !important;
            align-items: flex-start !important;
            border-top: 1px solid #f1f5f9;
            padding-top: 12px;
            margin-top: 6px;
          }
          .my-booking-card > div:last-child > div:first-child {
            text-align: left !important;
          }
          .my-booking-card > div:last-child > div:last-child {
            width: 100% !important;
            justify-content: flex-start !important;
          }
        }
      `}</style>
      
      {/* Luxury Hero Banner */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", padding: "60px 24px 50px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.08, background: "radial-gradient(circle at center, #5eead4 0%, transparent 70%)" }} />
        
        <div style={{ position: "relative", zIndex: 2, maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#5eead4", borderRadius: 100, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            <Sparkles size={13} /> CLIENT APPOINTMENT PORTAL
          </div>
          
          <h1 className="sf-hero-white-title" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2, letterSpacing: "-0.02em", color: "#ffffff" }}>
            Track Your Appointments
          </h1>
          
          <p className="sf-hero-white-desc" style={{ fontSize: "clamp(0.95rem, 2vw, 1.05rem)", color: "rgba(255,255,255,0.9)", margin: "0 auto", lineHeight: 1.6, fontWeight: 400, maxWidth: 520 }}>
            Enter your mobile number to review upcoming reservations, chair bookings, and past service receipts.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 100px" }}>
        
        {!searched ? (
          <form 
            onSubmit={handleSearch} 
            style={{ 
              background: "#ffffff", 
              padding: "40px 32px", 
              borderRadius: 24, 
              boxShadow: "0 10px 30px rgba(0,0,0,0.04)", 
              border: "1px solid #e2e8f0", 
              maxWidth: 480, 
              margin: "0 auto" 
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
                Registered Mobile Number
              </label>
              
              <div style={{ position: "relative" }}>
                <Phone size={18} color="#0d9488" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  style={{ 
                    width: "100%", 
                    padding: "14px 16px 14px 44px", 
                    background: "#f8fafc", 
                    border: "1px solid #cbd5e1", 
                    borderRadius: 12, 
                    color: "#0f172a", 
                    fontSize: 15, 
                    fontWeight: 600, 
                    outline: "none", 
                    boxSizing: "border-box" 
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = "#0d9488"}
                  onBlur={e => e.currentTarget.style.borderColor = "#cbd5e1"}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#e11d48", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: "100%", 
                padding: "14px 20px", 
                background: "#0f172a", 
                color: "#ffffff", 
                border: "none", 
                borderRadius: 12, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                gap: 8, 
                fontWeight: 700, 
                fontSize: 14.5, 
                cursor: loading ? "wait" : "pointer",
                boxShadow: "0 4px 14px rgba(0,0,0,0.12)"
              }}
            >
              {loading ? <RefreshCw size={16} className="sf-spin" /> : <Search size={16} />}
              <span>{loading ? "Searching Reservations..." : "Find My Appointments"}</span>
            </button>
          </form>
        ) : (
          <div>
            
            {/* Phone Lookup Banner */}
            <div 
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 14,
                padding: "16px 20px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                marginBottom: 28
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f0fdfa", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Phone size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", fontWeight: 700 }}>
                    Active Search Number
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                    {phone}
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => { setSearched(false); setBookings([]); }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 100,
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#0d9488"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#cbd5e1"}
              >
                <Search size={13} />
                <span>Search Another Number</span>
              </button>
            </div>

            {/* Bookings List */}
            {bookings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 20px", background: "#f8fafc", borderRadius: 24, border: "1px dashed #cbd5e1" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ffffff", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", border: "1px solid #e2e8f0" }}>
                  <CalendarSearch size={28} />
                </div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                  No Appointments Found
                </h3>
                <p style={{ color: "#64748b", fontSize: 14, maxWidth: 420, margin: "0 auto 24px", lineHeight: 1.6 }}>
                  We couldn't find any confirmed or past reservations under <strong>{phone}</strong>.
                </p>
                <Link 
                  to={`/site/${salon.slug}/services`} 
                  style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: 8, 
                    padding: "12px 28px", 
                    background: "#0f172a", 
                    color: "#ffffff", 
                    borderRadius: 100, 
                    fontWeight: 700, 
                    fontSize: 14, 
                    textDecoration: "none" 
                  }}
                >
                  <span>Book an Appointment</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 18 }}>
                {bookings.map((booking, i) => {
                  const serviceTitle = booking.serviceInfo?.serviceName || booking.serviceName || "Signature Salon Service";
                  const bookingDateTime = booking.serviceInfo?.preferredDate 
                    ? `${booking.serviceInfo.preferredDate} at ${formatTime12Hour(booking.serviceInfo.preferredTime)}`
                    : (booking.startAt ? new Date(booking.startAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : "Scheduled Session");
                  
                  const canCancel = ["PENDING", "CONFIRMED", "NEW"].includes(booking.status);
                  const isCompleted = booking.status === "COMPLETED";
                  const isConfirmed = booking.status === "CONFIRMED";
                  const isCancelled = booking.status === "CANCELLED";
                  const statusLabel = 
                    booking.status === "NEW" ? "Active (New)" :
                    booking.status === "ACCEPTED" ? "Confirmed" :
                    booking.status === "READY" ? "In Progress" :
                    booking.status === "COMPLETED" ? "Completed" :
                    booking.status === "CANCELLED" ? "Cancelled" : booking.status;

                  return (
                    <div 
                      key={i} 
                      className="my-booking-card"
                      style={{
                        background: "#ffffff",
                        borderRadius: 20,
                        border: "1px solid #e2e8f0",
                        padding: "22px 24px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 16,
                        transition: "all 0.25s ease"
                      }}
                    >
                      <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                        {/* Order Number & Clear Status Pill */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11.5, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, fontFamily: "monospace" }}>
                            #{booking.orderNumber}
                          </span>

                          <span 
                            style={{ 
                              padding: "3px 12px", 
                              borderRadius: 100, 
                              fontSize: 11, 
                              fontWeight: 800, 
                              letterSpacing: "0.04em",
                              background: isCompleted ? "#ecfdf5" : (isConfirmed ? "#eff6ff" : (isCancelled ? "#fef2f2" : "#f0fdf4")),
                              color: isCompleted ? "#059669" : (isConfirmed ? "#2563eb" : (isCancelled ? "#e11d48" : "#0d9488")),
                              border: isCompleted ? "1px solid #a7f3d0" : (isConfirmed ? "1px solid #bfdbfe" : (isCancelled ? "1px solid #fecdd3" : "1px solid #a7f3d0"))
                            }}
                          >
                            ● {statusLabel}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                          {serviceTitle}
                        </h4>

                        {/* Time & Branch */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                          <Clock size={14} color="#0d9488" />
                          <span>{bookingDateTime}</span>
                        </div>
                      </div>

                      {/* Right Price, Rebook & Cancel Action */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, minWidth: 160 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Total Paid / Due</div>
                          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
                            {currency} {Number(booking.totalAmount || booking.price || booking.total || 0).toLocaleString()}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => handleCancelBooking(booking.orderNumber)}
                              disabled={cancellingOrder === booking.orderNumber}
                              style={{ 
                                background: "#fff1f2", 
                                border: "1px solid #fecdd3", 
                                color: "#e11d48", 
                                fontSize: 12, 
                                fontWeight: 700, 
                                cursor: "pointer", 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: 4, 
                                padding: "6px 14px",
                                borderRadius: 100,
                                transition: "all 0.2s"
                              }}
                            >
                              <XCircle size={13} /> 
                              <span>{cancellingOrder === booking.orderNumber ? "Cancelling..." : "Cancel"}</span>
                            </button>
                          )}

                          <Link 
                            to={`/site/${salon.slug}/services`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "7px 16px",
                              borderRadius: 100,
                              background: "#0f172a",
                              color: "#ffffff",
                              fontSize: 12,
                              fontWeight: 700,
                              textDecoration: "none",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                            }}
                          >
                            <span>Book Again</span>
                            <ChevronRight size={13} />
                          </Link>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
