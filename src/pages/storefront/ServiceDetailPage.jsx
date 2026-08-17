import { useState, useEffect } from "react";
import { Link, useOutletContext, useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import { useAlert } from "../../context/AlertContext";

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
  const { showAlert } = useAlert();
  const { salon, addBooking, selectedBranchId, setSelectedBranchId } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const currency = salon?.currency || "INR";

  const [service, setService] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [checkingSlots, setCheckingSlots] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!salon?.slug) return;
    setLoading(true);
    const params = selectedBranchId ? { branchId: selectedBranchId } : {};
    api.get(`/public/salon/${salon.slug}/storefront-services`, { params })
      .then(res => {
        const services = res.data?.services || [];
        setAllServices(services);
        const found = services.find(s => String(s.id) === String(id));
        setService(found || null);
      })
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [salon?.slug, id, selectedBranchId]);

  useEffect(() => {
    if (service?.staffAssignments?.length) {
      setSelectedStaff(service.staffAssignments[0]?.user || null);
    }
  }, [service]);

  useEffect(() => {
    if (!selectedDate || !salon?.slug || !salon?.branches?.length) { setBookedSlots([]); return; }
    setCheckingSlots(true);
    const branchId = selectedBranchId || salon.branches[0]?.id;
    api.get(`/public/salon/${salon.slug}/booked-slots`, { 
      params: { 
        branchId, 
        date: selectedDate,
        staffId: selectedStaff?.id || undefined 
      } 
    })
      .then(res => setBookedSlots(res.data?.bookedSlots || []))
      .catch(() => setBookedSlots([]))
      .finally(() => setCheckingSlots(false));
  }, [selectedDate, salon?.slug, salon?.branches, selectedBranchId, selectedStaff?.id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "180px 32px", textAlign: "center", color: "var(--text-muted)" }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 300 }}>Preparing service details...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "180px 32px", textAlign: "center", color: "var(--text-muted)" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", marginBottom: 24, fontSize: '2.5rem' }}>Service Not Found</h2>
        <Link to={`/site/${salon.slug}/collections`} className="sf-btn-outline">
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
  ).slice(0, 3);

  const today = new Date().toISOString().split("T")[0];

  const isSlotBooked = (time) => {
    if (!bookedSlots.length || !time || !selectedDate) return false;
    const userStartMs = new Date(`${selectedDate}T${time}:00Z`).getTime();
    const userEndMs = userStartMs + (service.durationMin || 30) * 60000;
    return bookedSlots.some(slot => {
      if (selectedStaff?.id && slot.staffId && String(slot.staffId) !== String(selectedStaff.id)) {
        return false;
      }
      const slotStart = new Date(slot.startAt).getTime();
      const slotEnd = new Date(slot.endAt).getTime();
      return userStartMs < slotEnd && userEndMs > slotStart;
    });
  };

  const handleBookNow = () => {
    if (!selectedDate) { showAlert("Please select a date."); return; }
    if (!selectedTime) { showAlert("Please select a time."); return; }
    if (isSlotBooked(selectedTime)) { showAlert("This time slot is no longer available. Please choose another."); return; }
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
    <div className="storefront-wrapper" style={{ paddingBottom: 100, background: 'var(--surface)' }}>
      <style>{`
        @media (max-width: 900px) {
          .sf-detail-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .sf-detail-sticky { position: static !important; }
        }
      `}</style>

      {/* Main Content */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "60px 32px 80px" }}>
        
        {/* Breadcrumb */}
        <Link to={`/site/${salon.slug}/collections`} style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.95rem", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 40, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back to Services
        </Link>
        
        <div className="sf-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 440px", gap: 80, alignItems: "start" }}>
          
          {/* Left Column: Details */}
          <div>
            {/* Image Section */}
            <div style={{ position: "relative", marginBottom: 40, borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.08)", background: "var(--surface)", height: 500 }}>
              <img src={service.imageUrl || FALLBACK_IMG} alt={service.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              
              {/* Badges Overlay */}
              <div style={{ position: "absolute", top: 24, left: 24, display: "flex", gap: 12 }}>
                {service.isFeatured && (
                  <span style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", color: "var(--accent)", padding: "8px 16px", borderRadius: "30px", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>★ Featured</span>
                )}
                {service.isPopular && (
                  <span style={{ background: "var(--accent)", color: "#fff", padding: "8px 16px", borderRadius: "30px", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>🔥 Popular</span>
                )}
              </div>
            </div>

            {/* Title & Meta Section */}
            <div style={{ marginBottom: 48, borderBottom: '1px solid var(--border)', paddingBottom: 40 }}>
              {service.category && (
                <div style={{ marginBottom: 16 }}>
                  <span style={{ display: "inline-block", color: "var(--text-muted)", fontSize: "0.95rem", fontWeight: 500, textTransform: 'uppercase', letterSpacing: '2px' }}>
                    {service.category.name}
                  </span>
                </div>
              )}
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "4rem", color: "var(--text-main)", margin: "0 0 24px", lineHeight: 1.1, fontWeight: 500, letterSpacing: '-1px' }}>
                {service.name}
              </h1>
              
              <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 500, color: "var(--text-main)", fontFamily: 'var(--font-serif)' }}>
                    {currency} {price.toFixed(2)}
                  </span>
                  {hasSale && <span style={{ fontSize: "1.2rem", color: "var(--text-muted)", textDecoration: "line-through", fontFamily: 'var(--font-sans)', fontWeight: 400 }}>{currency} {originalPrice.toFixed(2)}</span>}
                </div>
                
                {hasSale && <span style={{ padding: "6px 12px", background: "var(--accent)", color: "#fff", fontSize: "0.85rem", fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '4px' }}>{Math.round((1 - Number(service.salePrice) / originalPrice) * 100)}% OFF</span>}
                
                {service.durationMin && (
                  <span style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted)", fontSize: "1.1rem", borderLeft: '1px solid var(--border)', paddingLeft: 32, fontWeight: 400 }}>
                    <Clock size={20} />
                    {formatDuration(service.durationMin)}
                  </span>
                )}
              </div>
              
              {service.taxRate > 0 && (
                <div style={{ marginTop: 16, fontSize: "0.9rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  * Price is exclusive of {service.taxRate}% tax.
                </div>
              )}
            </div>

            <div style={{ marginBottom: 60 }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: 24, fontWeight: 500 }}>About This Treatment</h2>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.8, fontSize: "1.15rem", margin: 0, whiteSpace: "pre-line", fontWeight: 300 }}>
                {service.description || "Experience a premium service tailored specifically to your needs. Our professionals ensure the highest quality of care and attention to detail."}
              </p>
            </div>

            {staff.length > 0 && (
              <div style={{ marginBottom: 60 }}>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: 32, fontWeight: 500 }}>Select Specialist</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {staff.map((s) => (
                    <div key={s.id} onClick={() => setSelectedStaff(s)} style={{
                      display: "flex", alignItems: "center", gap: 24, padding: "24px",
                      border: selectedStaff?.id === s.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: "var(--bg-main)",
                      cursor: "pointer",
                      transition: "var(--transition)",
                      boxShadow: selectedStaff?.id === s.id ? "var(--shadow-sm)" : "none"
                    }}>
                      <img src={s.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || "")}&background=random&color=fff&size=80`} alt={s.name} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 500, fontSize: "1.2rem", color: "var(--text-main)", fontFamily: 'var(--font-serif)' }}>{s.name}</p>
                        <p style={{ margin: "6px 0 0", fontSize: "0.95rem", color: "var(--text-muted)", fontWeight: 300 }}>{selectedStaff?.id === s.id ? "Preferred specialist" : "Available specialist"}</p>
                      </div>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', border: `1px solid ${selectedStaff?.id === s.id ? 'var(--accent)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedStaff?.id === s.id ? 'var(--accent)' : 'transparent'
                      }}>
                        {selectedStaff?.id === s.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Booking Widget */}
          <div className="sf-detail-sticky" style={{ position: "sticky", top: 120 }}>
            <div style={{ background: "var(--bg-main)", border: "1px solid var(--border)", padding: 48 }}>
              <h3 style={{ margin: "0 0 32px", fontSize: "1.8rem", fontFamily: "var(--font-serif)", fontWeight: 500, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>Reserve Appointment</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                
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
                      style={{ cursor: "pointer", appearance: 'none', background: 'var(--surface) url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right 16px top 50%', backgroundSize: '10px' }}
                    >
                      <option value="">Select a branch</option>
                      {salon.branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sf-form-group" style={{ marginBottom: 0 }}>
                  <label className="sf-form-label">Date</label>
                  <input type="date" min={today} value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedTime(""); }}
                    className="sf-form-input" />
                </div>

                <div className="sf-form-group" style={{ marginBottom: 0 }}>
                  <label className="sf-form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Time</span>
                    {checkingSlots && <span style={{ color: "var(--text-muted)", fontWeight: 300, textTransform: 'none', letterSpacing: 'normal' }}>Checking...</span>}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 12, marginTop: 12 }}>
                    {TIME_OPTIONS.map(t => {
                      const booked = isSlotBooked(t);
                      return (
                         <button
                           key={t}
                           disabled={booked}
                           onClick={() => setSelectedTime(t)}
                           title={booked ? "Already booked" : "Available"}
                           style={{
                             padding: "12px 0",
                             textAlign: "center",
                             border: selectedTime === t ? "1px solid var(--accent)" : "1px solid var(--border)",
                             background: booked ? "#f3f4f6" : (selectedTime === t ? "var(--accent)" : "var(--surface)"),
                             color: booked ? "#9ca3af" : (selectedTime === t ? "#fff" : "var(--text-main)"),
                             cursor: booked ? "not-allowed" : "pointer",
                             fontWeight: 500,
                             fontSize: "0.9rem",
                             borderRadius: "8px",
                             transition: "var(--transition)"
                           }}
                         >
                           {t}
                         </button>
                      );
                    })}
                  </div>
                </div>
                
                {selectedStaff && (
                  <div style={{ padding: "20px", background: "var(--surface)", border: '1px solid var(--border)', display: "flex", alignItems: "center", gap: 16 }}>
                    <img src={selectedStaff.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStaff.name || "")}&background=random&color=fff&size=48`} alt={selectedStaff.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                    <div>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>With Specialist</p>
                      <p style={{ margin: "4px 0 0", fontSize: "1.1rem", fontWeight: 500, fontFamily: 'var(--font-serif)', color: "var(--text-main)" }}>{selectedStaff.name}</p>
                    </div>
                  </div>
                )}
                
                <div style={{ padding: "32px 0 0", borderTop: "1px solid var(--border)", marginTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "1.05rem", fontWeight: 300 }}>Service</span>
                    <span style={{ fontWeight: 500, fontSize: "1.05rem" }}>{service.name}</span>
                  </div>
                  {service.durationMin && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "1.05rem", fontWeight: 300 }}>Duration</span>
                      <span style={{ fontWeight: 500, fontSize: "1.05rem" }}>{formatDuration(service.durationMin)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "1.1rem", textTransform: 'uppercase', letterSpacing: '1px' }}>Total</span>
                    <span style={{ fontWeight: 500, fontSize: "2rem", color: "var(--text-main)", fontFamily: 'var(--font-serif)' }}>{currency} {price.toFixed(2)}</span>
                  </div>
                </div>
                
                <button onClick={handleBookNow} className="sf-btn-primary" style={{ width: "100%", padding: "20px" }}>
                  Add to Booking
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Services */}
        {relatedServices.length > 0 && (
          <section style={{ marginTop: 120, paddingTop: 80, borderTop: "1px solid var(--border)" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", marginBottom: 48, fontWeight: 500, textAlign: 'center' }}>Explore More</h2>
            <div className="sf-services-grid">
              {relatedServices.map(s => {
                const sPrice = Number(s.salePrice && Number(s.salePrice) < Number(s.price) ? s.salePrice : s.price);
                const sHasSale = s.salePrice && Number(s.salePrice) < Number(s.price);
                return (
                  <div key={s.id} className="sf-service-card" onClick={() => navigate(`/site/${salon.slug}/service/${s.id}`)}>
                    <div className="sf-service-img-wrapper">
                      <img src={s.imageUrl || FALLBACK_IMG} alt={s.name} className="sf-service-img" />
                    </div>
                    <div className="sf-service-content">
                      <h3 style={{ fontSize: '1.3rem' }}>{s.name}</h3>
                      <div className="sf-service-footer">
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span className="sf-service-price">{currency} {sPrice.toFixed(2)}</span>
                          {sHasSale && <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", textDecoration: "line-through" }}>{currency} {Number(s.price).toFixed(2)}</span>}
                        </div>
                        <span className="sf-service-btn">Details <ArrowRight size={16} /></span>
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
