import { useState, useEffect } from "react";
import { Link, useOutletContext, useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&fit=crop";

const TIME_OPTIONS = [];
for (let h = 9; h <= 20; h++) {
  for (let m = 0; m < 60; m += 30) {
    if (h === 20 && m > 0) break;
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

function formatDuration(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export default function ServiceDetailPage() {
  const { salon, addBooking } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const currency = salon.currency || "INR";

  const [service, setService] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [checkingSlots, setCheckingSlots] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!salon?.slug) return;
    setLoading(true);
    api.get(`/public/salon/${salon.slug}/storefront-services`)
      .then(res => {
        const services = res.data?.services || [];
        setAllServices(services);
        const found = services.find(s => String(s.id) === String(id));
        setService(found || null);
      })
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [salon?.slug, id]);

  useEffect(() => {
    if (service?.staffAssignments?.length) {
      setSelectedStaff(service.staffAssignments[0]?.user || null);
    }
  }, [service]);

  useEffect(() => {
    if (!selectedDate || !salon?.slug || !salon?.branches?.length) { setBookedSlots([]); return; }
    setCheckingSlots(true);
    const branchId = salon.branches[0]?.id;
    api.get(`/public/salon/${salon.slug}/booked-slots`, { params: { branchId, date: selectedDate } })
      .then(res => setBookedSlots(res.data?.bookedSlots || []))
      .catch(() => setBookedSlots([]))
      .finally(() => setCheckingSlots(false));
  }, [selectedDate, salon?.slug, salon?.branches]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "120px 20px", textAlign: "center", color: "#999" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "var(--sf-accent, #c8a97e)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        Loading service details...
      </div>
    );
  }

  if (!service) {
    return (
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "120px 20px", textAlign: "center", color: "#999" }}>
        <h2 style={{ fontFamily: "var(--sf-font-serif)", marginBottom: 16 }}>Service Not Found</h2>
        <Link to={`/site/${salon.slug}/collections`} style={{ padding: "12px 28px", background: "var(--sf-accent, #c8a97e)", color: "#fff", borderRadius: 8, fontWeight: 600, textDecoration: "none" }}>
          Back to Services
        </Link>
      </div>
    );
  }

  const price = Number(service.salePrice && Number(service.salePrice) < Number(service.price) ? service.salePrice : service.price);
  const originalPrice = Number(service.price);
  const hasSale = service.salePrice && Number(service.salePrice) < originalPrice;
  const staff = service.staffAssignments?.map(sa => sa.user).filter(Boolean) || [];
  const relatedServices = allServices.filter(
    s => String(s.id) !== String(service.id) && s.category?.id === service.category?.id
  ).slice(0, 4);

  const today = new Date().toISOString().split("T")[0];

  const isSlotBooked = (time) => {
    if (!bookedSlots.length || !time || !selectedDate) return false;
    const userStartMs = new Date(`${selectedDate}T${time}:00`).getTime();
    const userEndMs = userStartMs + (service.durationMin || 30) * 60000;
    return bookedSlots.some(slot => {
      const slotStart = new Date(slot.startAt).getTime();
      const slotEnd = new Date(slot.endAt).getTime();
      return userStartMs < slotEnd && userEndMs > slotStart;
    });
  };

  const handleBookNow = () => {
    if (!selectedDate) { alert("Please select a date."); return; }
    if (!selectedTime) { alert("Please select a time."); return; }
    if (isSlotBooked(selectedTime)) { alert("This time slot is no longer available. Please choose another."); return; }
    addBooking(
      {
        id: service.id,
        name: service.name,
        price: hasSale ? service.salePrice : service.price,
        duration: service.durationMin,
        imageUrl: service.imageUrl,
        staffId: selectedStaff?.id || null,
        staffName: selectedStaff?.name || null,
      },
      selectedDate,
      selectedTime
    );
    navigate(`/site/${salon.slug}/booking-summary`);
  };

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .sf-detail-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .sf-detail-sticky { position: static !important; }
          .sf-hero-img { height: 280px !important; }
          .sf-hero-title { font-size: 2rem !important; }
          .sf-mobile-bar { display: flex !important; }
        }
      `}</style>

      <div className="sf-hero-img" style={{ position: "relative", height: 400, overflow: "hidden" }}>
        <img src={service.imageUrl || FALLBACK_IMG} alt={service.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, maxWidth: 1300, margin: "0 auto", padding: "0 20px" }}>
          <Link to={`/site/${salon.slug}/collections`} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            &larr; Back to Services
          </Link>
          {service.category && (
            <span style={{ display: "inline-block", padding: "4px 14px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", color: "#fff", borderRadius: 100, fontSize: "0.75rem", fontWeight: 600, marginBottom: 12 }}>
              {service.category.name}
            </span>
          )}
          <h1 className="sf-hero-title" style={{ fontFamily: "var(--sf-font-serif)", fontSize: "3rem", color: "#fff", margin: 0, lineHeight: 1.1 }}>
            {service.name}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "48px 20px" }}>
        <div className="sf-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 60, alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32, flexWrap: "wrap" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--sf-accent, #c8a97e)" }}>
                {currency} {price.toFixed(2)}
                {hasSale && <span style={{ fontSize: "1rem", color: "#999", textDecoration: "line-through", marginLeft: 8 }}>{currency} {originalPrice.toFixed(2)}</span>}
              </div>
              {hasSale && <span style={{ padding: "4px 12px", background: "#ef4444", color: "#fff", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>{Math.round((1 - Number(service.salePrice) / originalPrice) * 100)}% OFF</span>}
              {service.durationMin && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#666", fontSize: "0.95rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {formatDuration(service.durationMin)}
                </span>
              )}
            </div>

            {service.description && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "1.5rem", marginBottom: 12, color: "var(--sf-primary, #111)" }}>About This Service</h2>
                <p style={{ color: "#555", lineHeight: 1.8, fontSize: "1.05rem", margin: 0, whiteSpace: "pre-line" }}>{service.description}</p>
              </div>
            )}

            {staff.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "1.5rem", marginBottom: 20, color: "var(--sf-primary, #111)" }}>Available Staff</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {staff.map((s) => (
                    <div key={s.id} onClick={() => setSelectedStaff(s)} style={{
                      display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                      border: selectedStaff?.id === s.id ? "2px solid var(--sf-accent, #c8a97e)" : "1px solid #e2e8f0",
                      borderRadius: 12, cursor: "pointer",
                      background: selectedStaff?.id === s.id ? "rgba(200,169,126,0.03)" : "#fff",
                      transition: "all 0.2s",
                    }}>
                      <img src={s.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || "")}&background=c8a97e&color=fff&size=56`} alt={s.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #f1f5f9" }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "1rem", color: "#1a1a1a" }}>{s.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#999" }}>{selectedStaff?.id === s.id ? "Preferred stylist" : "Available for this service"}</p>
                      </div>
                      <button style={{
                        padding: "8px 20px", borderRadius: 100,
                        border: selectedStaff?.id === s.id ? "none" : "1px solid var(--sf-accent, #c8a97e)",
                        background: selectedStaff?.id === s.id ? "var(--sf-accent, #c8a97e)" : "transparent",
                        color: selectedStaff?.id === s.id ? "#fff" : "var(--sf-accent, #c8a97e)",
                        fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s",
                      }}>{selectedStaff?.id === s.id ? "Selected" : "Select"}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sf-detail-sticky" style={{ position: "sticky", top: 100 }}>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 10px 40px rgba(0,0,0,0.06)", padding: 32 }}>
              <h3 style={{ margin: "0 0 24px", fontSize: "1.2rem", fontFamily: "var(--sf-font-serif)", color: "var(--sf-primary, #111)" }}>Book This Service</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontWeight: 600 }}>Preferred Date</label>
                  <input type="date" min={today} value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedTime(""); }}
                    style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "0.95rem", fontFamily: "inherit", color: "#333", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontWeight: 600 }}>
                    Preferred Time {checkingSlots && <span style={{ color: "#aaa", fontWeight: 400 }}>(checking availability...)</span>}
                  </label>
                  <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)}
                    style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "0.95rem", fontFamily: "inherit", background: "#fff", cursor: "pointer", color: "#333", outline: "none" }}>
                    <option value="">Select a time</option>
                    {TIME_OPTIONS.map(t => {
                      const booked = isSlotBooked(t);
                      return <option key={t} value={t} disabled={booked}>{booked ? `${t} (booked)` : t}</option>;
                    })}
                  </select>
                </div>
                {selectedStaff && (
                  <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={selectedStaff.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStaff.name || "")}&background=c8a97e&color=fff&size=32`} alt={selectedStaff.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                    <div>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "#999" }}>Preferred Stylist</p>
                      <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#1a1a1a" }}>{selectedStaff.name}</p>
                    </div>
                  </div>
                )}
                <div style={{ padding: "16px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", margin: "4px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#666", fontSize: "0.9rem" }}>Service</span>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{service.name}</span>
                  </div>
                  {service.durationMin && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "#666", fontSize: "0.9rem" }}>Duration</span>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{formatDuration(service.durationMin)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666", fontSize: "0.9rem" }}>Price</span>
                    <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--sf-accent, #c8a97e)" }}>{currency} {price.toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={handleBookNow} style={{ width: "100%", padding: "16px 24px", fontSize: "1.05rem", marginTop: 8, background: "var(--sf-accent, #c8a97e)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                  Book This Service
                </button>
                <p style={{ textAlign: "center", margin: 0, fontSize: "0.8rem", color: "#aaa" }}>You'll be redirected to the booking summary after adding.</p>
              </div>
            </div>
          </div>
        </div>

        {relatedServices.length > 0 && (
          <section style={{ marginTop: 80, paddingTop: 40, borderTop: "1px solid #f1f5f9" }}>
            <h2 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "1.8rem", marginBottom: 32, color: "var(--sf-primary, #111)" }}>Related Services</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
              {relatedServices.map(s => {
                const sPrice = Number(s.salePrice && Number(s.salePrice) < Number(s.price) ? s.salePrice : s.price);
                const sHasSale = s.salePrice && Number(s.salePrice) < Number(s.price);
                return (
                  <Link key={s.id} to={`/site/${salon.slug}/service/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)", border: "1px solid #f1f5f9", transition: "all 0.3s ease" }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.12)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                        <img src={s.imageUrl || FALLBACK_IMG} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {sHasSale && <span style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", background: "#ef4444", color: "#fff", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>{Math.round((1 - Number(s.salePrice) / Number(s.price)) * 100)}% OFF</span>}
                      </div>
                      <div style={{ padding: 16 }}>
                        <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 600 }}>{s.name}</h3>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                            <span style={{ fontWeight: 700, color: "var(--sf-accent, #c8a97e)" }}>{currency} {sPrice.toFixed(2)}</span>
                            {sHasSale && <span style={{ fontSize: "0.82rem", color: "#999", textDecoration: "line-through" }}>{currency} {Number(s.price).toFixed(2)}</span>}
                          </div>
                          {s.durationMin && <span style={{ fontSize: "0.82rem", color: "#888" }}>{formatDuration(s.durationMin)}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="sf-mobile-bar" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", padding: "12px 20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", zIndex: 999 }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem", color: "var(--sf-accent, #c8a97e)" }}>{currency} {price.toFixed(2)}</p>
            {service.durationMin && <p style={{ margin: 0, fontSize: "0.8rem", color: "#999" }}>{formatDuration(service.durationMin)}</p>}
          </div>
          <button onClick={handleBookNow} style={{ padding: "12px 32px", background: "var(--sf-accent, #c8a97e)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Book Now</button>
        </div>
      </div>
    </div>
  );
}
