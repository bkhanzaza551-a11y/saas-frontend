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
  const { salon, addBooking, selectedBranchId, setSelectedBranchId } = useOutletContext();
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
    const branchId = selectedBranchId || salon.branches[0]?.id;
    api.get(`/public/salon/${salon.slug}/booked-slots`, { params: { branchId, date: selectedDate } })
      .then(res => setBookedSlots(res.data?.bookedSlots || []))
      .catch(() => setBookedSlots([]))
      .finally(() => setCheckingSlots(false));
  }, [selectedDate, salon?.slug, salon?.branches, selectedBranchId]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "120px 20px", textAlign: "center", color: "var(--text-muted)" }}>
        <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        Loading service details...
      </div>
    );
  }

  if (!service) {
    return (
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "120px 20px", textAlign: "center", color: "var(--text-muted)" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", marginBottom: 16 }}>Service Not Found</h2>
        <Link to={`/site/${salon.slug}/collections`} className="sf-btn-primary">
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
    navigate(`/site/${salon.slug}/cart`);
  };

  return (
    <div className="storefront-wrapper" style={{ paddingBottom: 60 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .sf-detail-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .sf-detail-sticky { position: static !important; }
        }
      `}</style>

      <div style={{ position: "relative", height: '60vh', minHeight: 400, overflow: "hidden", background: 'var(--surface)' }}>
        <img src={service.imageUrl || FALLBACK_IMG} alt={service.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <Link to={`/site/${salon.slug}/collections`} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "0.95rem", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            &larr; Back to Services
          </Link>
          {service.category && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ display: "inline-block", padding: "6px 16px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", color: "#fff", borderRadius: 100, fontSize: "0.85rem", fontWeight: 600 }}>
                {service.category.name}
              </span>
            </div>
          )}
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "4rem", color: "#fff", margin: 0, lineHeight: 1.1, letterSpacing: '-1px' }}>
            {service.name}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
        <div className="sf-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 80, alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40, flexWrap: "wrap", paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-main)" }}>
                {currency} {price.toFixed(2)}
                {hasSale && <span style={{ fontSize: "1.2rem", color: "var(--text-muted)", textDecoration: "line-through", marginLeft: 12 }}>{currency} {originalPrice.toFixed(2)}</span>}
              </div>
              {hasSale && <span style={{ padding: "6px 16px", background: "var(--accent)", color: "#fff", borderRadius: 100, fontSize: "0.85rem", fontWeight: 700 }}>{Math.round((1 - Number(service.salePrice) / originalPrice) * 100)}% OFF</span>}
              {service.durationMin && (
                <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: "1.1rem", borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {formatDuration(service.durationMin)}
                </span>
              )}
            </div>

            {service.description && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", marginBottom: 16, color: "var(--text-main)" }}>About This Service</h2>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.8, fontSize: "1.1rem", margin: 0, whiteSpace: "pre-line" }}>{service.description}</p>
              </div>
            )}

            {staff.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", marginBottom: 24, color: "var(--text-main)" }}>Select Specialist</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {staff.map((s) => (
                    <div key={s.id} onClick={() => setSelectedStaff(s)} style={{
                      display: "flex", alignItems: "center", gap: 20, padding: "20px 24px",
                      border: selectedStaff?.id === s.id ? "2px solid var(--accent)" : "1px solid var(--border)",
                      borderRadius: 'var(--radius-md)', cursor: "pointer",
                      background: selectedStaff?.id === s.id ? "var(--surface)" : "var(--bg-main)",
                      transition: "var(--transition)",
                    }}>
                      <img src={s.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || "")}&background=random&color=fff&size=64`} alt={s.name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--surface)" }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "1.1rem", color: "var(--text-main)" }}>{s.name}</p>
                        <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "var(--text-muted)" }}>{selectedStaff?.id === s.id ? "Preferred specialist" : "Available for this service"}</p>
                      </div>
                      <button style={{
                        padding: "10px 24px", borderRadius: 100,
                        border: selectedStaff?.id === s.id ? "none" : "1px solid var(--accent)",
                        background: selectedStaff?.id === s.id ? "var(--accent)" : "transparent",
                        color: selectedStaff?.id === s.id ? "#fff" : "var(--text-main)",
                        fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", transition: "var(--transition)",
                      }}>{selectedStaff?.id === s.id ? "Selected" : "Select"}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sf-detail-sticky" style={{ position: "sticky", top: 120 }}>
            <div style={{ background: "var(--bg-main)", borderRadius: 'var(--radius-lg)', border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", padding: 40 }}>
              <h3 style={{ margin: "0 0 32px", fontSize: "1.5rem", fontFamily: "var(--font-serif)", color: "var(--text-main)", paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>Book This Service</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                
                {salon.branches?.length > 1 && (
                  <div className="sf-form-group" style={{ marginBottom: 0 }}>
                    <label className="sf-form-label">Branch</label>
                    <select 
                      value={selectedBranchId || ""} 
                      onChange={e => {
                        setSelectedBranchId(e.target.value);
                        setSelectedTime("");
                      }}
                      className="sf-form-input" 
                      style={{ cursor: "pointer" }}
                    >
                      <option value="">Select a branch</option>
                      {salon.branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sf-form-group" style={{ marginBottom: 0 }}>
                  <label className="sf-form-label">Preferred Date</label>
                  <input type="date" min={today} value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedTime(""); }}
                    className="sf-form-input" />
                </div>
                <div className="sf-form-group" style={{ marginBottom: 0 }}>
                  <label className="sf-form-label">
                    Preferred Time {checkingSlots && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(checking...)</span>}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10, marginTop: 8 }}>
                    {TIME_OPTIONS.map(t => {
                      const booked = isSlotBooked(t);
                      return (
                        <button
                          key={t}
                          disabled={booked}
                          onClick={() => setSelectedTime(t)}
                          title={booked ? "Already booked" : "Available"}
                          style={{
                            padding: "10px 0",
                            textAlign: "center",
                            borderRadius: "var(--radius-sm)",
                            border: selectedTime === t ? "2px solid var(--accent)" : "1px solid var(--border)",
                            background: booked ? "#f1f5f9" : (selectedTime === t ? "var(--surface)" : "#fff"),
                            color: booked ? "#94a3b8" : "var(--text-main)",
                            cursor: booked ? "not-allowed" : "pointer",
                            fontWeight: selectedTime === t ? 700 : 500,
                            fontSize: "0.9rem",
                            transition: "all 0.2s"
                          }}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {selectedStaff && (
                  <div style={{ padding: "16px", background: "var(--surface)", borderRadius: 'var(--radius-sm)', display: "flex", alignItems: "center", gap: 12, border: '1px solid var(--border)' }}>
                    <img src={selectedStaff.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStaff.name || "")}&background=random&color=fff&size=40`} alt={selectedStaff.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                    <div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Specialist</p>
                      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text-main)" }}>{selectedStaff.name}</p>
                    </div>
                  </div>
                )}
                
                <div style={{ padding: "24px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", margin: "8px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "1rem" }}>Service</span>
                    <span style={{ fontWeight: 600, fontSize: "1rem" }}>{service.name}</span>
                  </div>
                  {service.durationMin && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "1rem" }}>Duration</span>
                      <span style={{ fontWeight: 600, fontSize: "1rem" }}>{formatDuration(service.durationMin)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Total Price</span>
                    <span style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--text-main)" }}>{currency} {price.toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={handleBookNow} className="sf-btn-primary" style={{ width: "100%", padding: "18px 24px", fontSize: "1.1rem" }}>
                  Add to Cart
                </button>
                <p style={{ textAlign: "center", margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>You will not be charged yet.</p>
              </div>
            </div>
          </div>
        </div>

        {relatedServices.length > 0 && (
          <section style={{ marginTop: 100, paddingTop: 60, borderTop: "1px solid var(--border)" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", marginBottom: 40, color: "var(--text-main)" }}>More Like This</h2>
            <div className="sf-services-grid">
              {relatedServices.map(s => {
                const sPrice = Number(s.salePrice && Number(s.salePrice) < Number(s.price) ? s.salePrice : s.price);
                const sHasSale = s.salePrice && Number(s.salePrice) < Number(s.price);
                return (
                  <div key={s.id} className="sf-service-card">
                    <img src={s.imageUrl || FALLBACK_IMG} alt={s.name} className="sf-service-img" />
                    <div className="sf-service-content">
                      <h3 style={{ fontSize: '1.25rem' }}>{s.name}</h3>
                      <div className="sf-service-footer">
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span className="sf-service-price">{currency} {sPrice.toFixed(2)}</span>
                          {sHasSale && <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", textDecoration: "line-through" }}>{currency} {Number(s.price).toFixed(2)}</span>}
                        </div>
                        <Link to={`/site/${salon.slug}/service/${s.id}`} className="sf-btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>View Details</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
