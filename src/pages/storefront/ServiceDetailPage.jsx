import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useOutletContext, useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { ArrowLeft, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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

export function formatTime12Hour(time24) {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

export default function ServiceDetailPage() {
  const { showAlert } = useAlert();
  const { salon, addBooking, selectedBranchId, setSelectedBranchId, bookings } = useOutletContext();
  
  const { id } = useParams();
  const navigate = useNavigate();
  const currency = salon?.currency || "INR";
  const dateScrollRef = useRef(null);

  const scrollDates = (direction) => {
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const [service, setService] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [checkingSlots, setCheckingSlots] = useState(false);

  useEffect(() => {
    if (bookings?.length > 0) {
      if (bookings[0].date && (!selectedDate || selectedDate === new Date().toLocaleDateString('en-CA'))) {
        setSelectedDate(bookings[0].date);
      }
      if (bookings[0].time && !selectedTime) {
        setSelectedTime(bookings[0].time);
      }
    }
  }, [bookings, selectedDate, selectedTime]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!salon?.slug) return;
    setLoading(true);
    const params = selectedBranchId ? { branchId: selectedBranchId } : {};
    api.get(`/public/salon/${salon.slug}/storefront-services`, { params })
      .then(res => {
        const services = Array.isArray(res.data) ? res.data : (res.data?.services || []);
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
    api.get(`/public/salons/${salon.slug}/booked-slots`, { 
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

  const nextDays = useMemo(() => {
    const dates = [];
    const d = new Date();
    for (let i = 0; i < 14; i++) {
      const current = new Date(d);
      current.setDate(d.getDate() + i);
      dates.push(current);
    }
    return dates;
  }, []);

  const morningSlots = useMemo(() => TIME_OPTIONS.filter(t => parseInt(t.split(':')[0], 10) < 12), []);
  const afternoonSlots = useMemo(() => TIME_OPTIONS.filter(t => {
    const h = parseInt(t.split(':')[0], 10);
    return h >= 12 && h < 17;
  }), []);
  const eveningSlots = useMemo(() => TIME_OPTIONS.filter(t => parseInt(t.split(':')[0], 10) >= 17), []);

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

  const today = new Date().toLocaleDateString('en-CA');

  const isSlotBooked = (time) => {
    if (!bookedSlots.length || !time || !selectedDate) return false;
    const userStartMs = new Date(`${selectedDate}T${time}:00`).getTime();
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

  const handleAddToCart = () => {
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
    showAlert("Service added to your cart successfully!");
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
        .sf-detail-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }
        .sf-detail-img-wrap {
          position: relative;
          margin-bottom: 32px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          background: var(--surface);
          height: 460px;
        }
        .sf-detail-title {
          font-family: var(--font-serif);
          font-size: clamp(1.8rem, 5vw, 3.5rem);
          color: var(--text-main);
          margin: 0 0 18px;
          line-height: 1.15;
          font-weight: 500;
          letter-spacing: -0.5px;
          word-break: break-word;
        }
        .sf-detail-price {
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          font-weight: 500;
          color: var(--text-main);
          font-family: var(--font-serif);
        }
        @media (max-width: 900px) {
          .sf-detail-container { padding: 24px 16px 60px; }
          .sf-detail-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .sf-detail-sticky { position: static !important; }
          .sf-detail-img-wrap { height: 260px; border-radius: 16px; margin-bottom: 24px; }
        }
      `}</style>

      {/* Main Content */}
      <div className="sf-detail-container">
        
        {/* Breadcrumb */}
        <Link to={`/site/${salon.slug}/collections`} style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back to Services
        </Link>
        
        <div className="sf-detail-grid">
          
          {/* Left Column: Details */}
          <div>
            {/* Image Section */}
            <div className="sf-detail-img-wrap" style={{ position: "relative", height: 460, background: "#f8fafc", borderRadius: 20, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
              {/* Soft Ambient Backdrop */}
              {service.imageUrl && (
                <div 
                  style={{ 
                    position: "absolute", 
                    inset: -20, 
                    backgroundImage: `url(${service.imageUrl})`, 
                    backgroundSize: "cover", 
                    backgroundPosition: "center", 
                    filter: "blur(30px) opacity(0.2)", 
                    transform: "scale(1.2)" 
                  }} 
                />
              )}
              
              {/* Main Full Image Fitted Perfectly */}
              <img 
                src={service.imageUrl || FALLBACK_IMG} 
                alt={service.name} 
                style={{ 
                  position: "relative", 
                  zIndex: 2, 
                  maxWidth: "100%", 
                  maxHeight: "100%", 
                  width: "auto", 
                  height: "auto", 
                  objectFit: "contain",
                  borderRadius: 12,
                  padding: "16px"
                }} 
                onError={e => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} 
              />
              
              {/* Badges Overlay */}
              <div style={{ position: "absolute", top: 16, left: 16, zIndex: 3, display: "flex", gap: 8 }}>
                {service.isFeatured && (
                  <span style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)", color: "var(--accent)", padding: "6px 14px", borderRadius: "30px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>★ Featured</span>
                )}
                {service.isPopular && (
                  <span style={{ background: "var(--accent)", color: "#fff", padding: "6px 14px", borderRadius: "30px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>🔥 Popular</span>
                )}
              </div>
            </div>

            {/* Title & Meta Section */}
            <div style={{ marginBottom: 36, borderBottom: '1px solid var(--border)', paddingBottom: 28 }}>
              {service.category && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ display: "inline-block", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 500, textTransform: 'uppercase', letterSpacing: '2px' }}>
                    {service.category.name}
                  </span>
                </div>
              )}
              <h1 className="sf-detail-title">
                {service.name}
              </h1>
              
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span className="sf-detail-price">
                    {currency} {price.toFixed(2)}
                  </span>
                  {hasSale && <span style={{ fontSize: "1.1rem", color: "var(--text-muted)", textDecoration: "line-through", fontFamily: 'var(--font-sans)', fontWeight: 400 }}>{currency} {originalPrice.toFixed(2)}</span>}
                </div>
                
                {hasSale && <span style={{ padding: "4px 10px", background: "var(--accent)", color: "#fff", fontSize: "0.75rem", fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '4px' }}>{Math.round((1 - Number(service.salePrice) / originalPrice) * 100)}% OFF</span>}
                
                {service.durationMin && (
                  <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: "0.95rem", borderLeft: '1px solid var(--border)', paddingLeft: 16, fontWeight: 400 }}>
                    <Clock size={16} />
                    {formatDuration(service.durationMin)}
                  </span>
                )}
              </div>
              
              {service.taxRate > 0 && (
                <div style={{ marginTop: 12, fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic" }}>
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
            <div className="sf-booking-widget" style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "36px", borderRadius: "24px", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)" }}>
              <h3 style={{ margin: "0 0 28px", fontSize: "1.6rem", fontWeight: 700, color: "#0f172a", paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>Choose Your Appointment</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                
                <div className="sf-form-group" style={{ marginBottom: 0, position: "relative" }}>
                  <button 
                    onClick={(e) => { e.preventDefault(); scrollDates('left'); }}
                    style={{ position: 'absolute', left: -14, top: '44%', transform: 'translateY(-50%)', zIndex: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>

                  <div ref={dateScrollRef} style={{ display: "flex", overflowX: "auto", gap: "10px", paddingBottom: "12px", margin: "0 8px", padding: "4px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                    {nextDays.map(d => {
                      const dateStr = d.toLocaleDateString('en-CA');
                      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                      const dateNum = d.getDate();
                      const isSelected = selectedDate === dateStr;
                      return (
                        <div 
                          key={dateStr}
                          onClick={() => { setSelectedDate(dateStr); setSelectedTime(""); }}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            minWidth: "56px", height: "72px",
                            borderRadius: "36px",
                            cursor: "pointer",
                            background: isSelected ? "var(--accent)" : "#fff",
                            border: isSelected ? "1px solid var(--accent)" : "1px solid #e2e8f0",
                            color: isSelected ? "#fff" : "var(--text-main)",
                            transition: "all 0.2s",
                            flexShrink: 0
                          }}
                        >
                          <span style={{ fontSize: "0.75rem", fontWeight: 500, marginBottom: "2px", color: isSelected ? "#fff" : "var(--text-muted)" }}>{dayName}</span>
                          <span style={{ fontSize: "1rem", fontWeight: 700 }}>{dateNum}</span>
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={(e) => { e.preventDefault(); scrollDates('right'); }}
                    style={{ position: 'absolute', right: -14, top: '44%', transform: 'translateY(-50%)', zIndex: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>

                <div className="sf-form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontWeight: 600, fontSize: "1.1rem", color: "#0f172a" }}>Available Time</span>
                    {checkingSlots && <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Checking...</span>}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {morningSlots.length > 0 && (
                      <div>
                        <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", color: "var(--text-main)", fontWeight: 600 }}>Morning Time Slots</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {morningSlots.map(t => {
                            const booked = isSlotBooked(t);
                            const isSelected = selectedTime === t;
                            return (
                              <button
                                key={t}
                                disabled={booked}
                                onClick={() => setSelectedTime(t)}
                                title={booked ? "Already booked" : "Available"}
                                style={{
                                  padding: "10px 18px",
                                  textAlign: "center",
                                  border: isSelected ? "1.5px solid var(--accent)" : "1px solid #e2e8f0",
                                  background: "#fff",
                                  color: booked ? "#d1d5db" : (isSelected ? "var(--accent)" : "#64748b"),
                                  cursor: booked ? "not-allowed" : "pointer",
                                  fontWeight: 600,
                                  fontSize: "0.85rem",
                                  borderRadius: "100px",
                                  transition: "all 0.2s",
                                  opacity: booked ? 0.5 : 1
                                }}
                              >
                                {formatTime12Hour(t)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {afternoonSlots.length > 0 && (
                      <div>
                        <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", color: "var(--text-main)", fontWeight: 600 }}>Afternoon Time Slots</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {afternoonSlots.map(t => {
                            const booked = isSlotBooked(t);
                            const isSelected = selectedTime === t;
                            return (
                              <button
                                key={t}
                                disabled={booked}
                                onClick={() => setSelectedTime(t)}
                                title={booked ? "Already booked" : "Available"}
                                style={{
                                  padding: "10px 18px",
                                  textAlign: "center",
                                  border: isSelected ? "1.5px solid var(--accent)" : "1px solid #e2e8f0",
                                  background: "#fff",
                                  color: booked ? "#d1d5db" : (isSelected ? "var(--accent)" : "#64748b"),
                                  cursor: booked ? "not-allowed" : "pointer",
                                  fontWeight: 600,
                                  fontSize: "0.85rem",
                                  borderRadius: "100px",
                                  transition: "all 0.2s",
                                  opacity: booked ? 0.5 : 1
                                }}
                              >
                                {formatTime12Hour(t)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {eveningSlots.length > 0 && (
                      <div>
                        <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", color: "var(--text-main)", fontWeight: 600 }}>Evening Time Slots</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {eveningSlots.map(t => {
                            const booked = isSlotBooked(t);
                            const isSelected = selectedTime === t;
                            return (
                              <button
                                key={t}
                                disabled={booked}
                                onClick={() => setSelectedTime(t)}
                                title={booked ? "Already booked" : "Available"}
                                style={{
                                  padding: "10px 18px",
                                  textAlign: "center",
                                  border: isSelected ? "1.5px solid var(--accent)" : "1px solid #e2e8f0",
                                  background: "#fff",
                                  color: booked ? "#d1d5db" : (isSelected ? "var(--accent)" : "#64748b"),
                                  cursor: booked ? "not-allowed" : "pointer",
                                  fontWeight: 600,
                                  fontSize: "0.85rem",
                                  borderRadius: "100px",
                                  transition: "all 0.2s",
                                  opacity: booked ? 0.5 : 1
                                }}
                              >
                                {formatTime12Hour(t)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
                
                <div style={{ display: 'flex', gap: 12, flexDirection: 'row' }}>
                  <button onClick={handleAddToCart} className="sf-btn-outline" style={{ flex: 1, padding: "16px 8px", background: 'transparent', fontSize: "0.85rem", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    Add to Cart
                  </button>
                  <button onClick={handleBookNow} className="sf-btn-primary" style={{ flex: 1, padding: "16px 8px", fontSize: "0.85rem", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    Book Now
                  </button>
                </div>
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

