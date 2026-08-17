import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { Outlet, Link, useParams, useLocation } from "react-router-dom";
import { CalendarCheck, Menu, X, MapPin, ArrowRight, ChevronDown, Check, Building2, Phone, Sparkles } from "lucide-react";
import { api } from "../../api/client";
import StorefrontErrorBoundary from "./StorefrontErrorBoundary";
import "../../storefront.css";

const BOOKINGS_KEY = "sf_bookings";
const BRANCH_KEY = "sf_branch_session";

function loadBookings() {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    const now = Date.now();
    return items.filter(b => !b.createdAt || (now - b.createdAt) < 7 * 24 * 60 * 60 * 1000);
  } catch { return []; }
}

function loadBranch() {
  try { return sessionStorage.getItem(BRANCH_KEY) || ""; } catch { return ""; }
}

export default function StorefrontLayout() {
  const { slug } = useParams();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState(loadBookings);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(loadBranch);
  const [scrolled, setScrolled] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [pageTransitioning, setPageTransitioning] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef(null);
  const location = useLocation();
  const [previewConfig, setPreviewConfig] = useState(null);

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'UPDATE_WEBSITE_CONFIG') {
        setPreviewConfig(e.data.config);
        const accent = e.data.config?.primaryColor;
        if (accent) {
          document.documentElement.style.setProperty("--accent", accent);
          document.documentElement.style.setProperty("--accent-hover", accent);
          document.documentElement.style.setProperty("--sf-accent", accent);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // Show preloader on subpage navigation for 1.5 seconds
    setPageTransitioning(true);
    const timer = setTimeout(() => setPageTransitioning(false), 1500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target)) {
        setBranchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { sessionStorage.setItem(BRANCH_KEY, selectedBranchId); }, [selectedBranchId]);

  useEffect(() => {
    if (!slug) return;
    api.get(`/public/salon/${slug}`)
      .then(res => {
        const s = res.data.salon;
        // Merge websiteConfig into salon so child pages can access salon.websiteConfig
        if (res.data.websiteConfig && typeof res.data.websiteConfig === "object") {
          s.websiteConfig = res.data.websiteConfig;
        }
        setSalon(s);
        // Apply accent color from websiteConfig as CSS variable
        const accentColor = s.websiteConfig?.primaryColor;
        if (accentColor) {
          document.documentElement.style.setProperty("--accent", accentColor);
          document.documentElement.style.setProperty("--accent-hover", accentColor);
        }
        let allBranches = [];
        if (s.branches && Array.isArray(s.branches) && s.branches.length > 0) {
          allBranches = s.branches;
        } else {
          const branchMap = new Map();
          if (res.data.services) {
            res.data.services.forEach(item => {
              if (item.branch) branchMap.set(item.branch.id, item.branch);
            });
          }
          if (res.data.products) {
            res.data.products.forEach(item => {
              if (item.branch) branchMap.set(item.branch.id, item.branch);
            });
          }
          allBranches = Array.from(branchMap.values());
          s.branches = allBranches; // Patch the salon object so the rest of the UI works
        }

        let validBranch = selectedBranchId;
        if (selectedBranchId && s.branches && !s.branches.find(b => b.id === selectedBranchId)) {
          validBranch = "";
          setSelectedBranchId("");
        }

        if (!validBranch && s.branches && s.branches.length === 1) {
          setSelectedBranchId(s.branches[0].id);
        } else if (!validBranch && s.branches && s.branches.length > 1) {
          setShowBranchModal(true);
        }
      })
      .catch(() => setSalon(null))
      .finally(() => {
        setLoading(false);
        setTimeout(() => setInitialLoading(false), 2000); // 2000ms minimum preloader time
      });
  }, [slug]);

  const addBooking = useCallback((service, date, time) => {
    setBookings(prev => {
      const existing = prev.find(b => b.serviceId === service.id && b.date === date && b.time === time);
      if (existing) {
        return prev.map(b => b.serviceId === service.id && b.date === date && b.time === time ? { ...b, qty: b.qty + 1 } : b);
      }
      return [...prev, {
        serviceId: service.id, name: service.name, price: service.salePrice || service.price,
        duration: service.durationMin, imageUrl: service.imageUrl, date, time, qty: 1,
        staffId: service.staffId || null, staffName: service.staffName || null,
        branchId: selectedBranchId, createdAt: Date.now(),
      }];
    });
  }, [selectedBranchId]);

  const removeBooking = useCallback((bookingIndex) => {
    setBookings(prev => prev.filter((_, i) => i !== bookingIndex));
  }, []);

  const updateBookingQty = useCallback((bookingIndex, qty) => {
    if (qty <= 0) {
      setBookings(prev => prev.filter((_, i) => i !== bookingIndex));
    } else {
      setBookings(prev => prev.map((b, i) => i === bookingIndex ? { ...b, qty } : b));
    }
  }, []);

  const updateBookingTime = useCallback((bookingIndex, date, time) => {
    setBookings(prev => prev.map((b, i) =>
      i === bookingIndex ? { ...b, date, time } : b
    ));
  }, []);

  const clearBookings = useCallback(() => {
    setBookings([]);
    localStorage.removeItem(BOOKINGS_KEY);
  }, []);

  const bookingCount = bookings.reduce((sum, b) => sum + b.qty, 0);

  // Derive display name for preloader (use slug if salon not loaded yet)
  const displaySalonName = salon ? salon.name : (slug || "").split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (!salon && !loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Salon not found</div>;

  const activeSalon = salon ? { ...salon, websiteConfig: previewConfig || salon.websiteConfig } : null;

  return (
    <div className="storefront-wrapper">
      {/* Premium Preloader */}
      <div className={`sf-preloader ${!initialLoading && !loading && !pageTransitioning ? 'sf-preloader-hidden' : ''}`}>
        <div className="sf-preloader-text">{displaySalonName}</div>
      </div>

      {salon && (
        <>
          {/* Premium Branch Selection Modal */}
          {showBranchModal && salon.branches?.length > 1 && (
            <div style={{ 
              position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(10px)", 
              zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px",
              animation: "fadeIn 0.3s ease-out"
            }}>
              <div style={{ 
                background: "#ffffff", 
                borderRadius: "20px", padding: "28px 24px", width: "100%", maxWidth: 620,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", 
                position: "relative",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                animation: "slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
              }}>
                {selectedBranchId && (
                  <button onClick={() => setShowBranchModal(false)} style={{ 
                    position: "absolute", top: 18, right: 18, background: "#f8fafc", 
                    border: "1px solid #e2e8f0", cursor: "pointer", color: "#64748b", borderRadius: "50%",
                    width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease"
                  }} onMouseOver={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }} onMouseOut={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#64748b"; }}>
                    <X size={18} />
                  </button>
                )}
                
                <div style={{ textAlign: "center", marginBottom: 22 }}>
                  <div style={{ width: 52, height: 52, margin: "0 auto 12px", background: "linear-gradient(135deg, #c8a97e, #b08d5c)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px -4px rgba(200, 169, 126, 0.45)" }}>
                    <MapPin size={24} color="#fff" strokeWidth={2} />
                  </div>
                  <h2 style={{ fontFamily: "var(--font-serif, serif)", fontSize: "1.75rem", margin: "0 0 6px", color: "#0f172a", letterSpacing: "-0.5px", fontWeight: 700 }}>
                    Select Sanctuary Location
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0, lineHeight: 1.4 }}>
                    Choose your nearest branch to explore specialized services & live stylist availability.
                  </p>
                </div>
                
                {/* Branch Cards List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto", paddingRight: 4, marginBottom: 20 }}>
                  {salon.branches.map(b => {
                    const isSelected = selectedBranchId === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBranchId(b.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 14,
                          padding: "14px 18px",
                          borderRadius: "14px",
                          border: isSelected ? "2px solid #c8a97e" : "1px solid #e2e8f0",
                          background: isSelected ? "linear-gradient(135deg, #fffbf5 0%, #fef8f0 100%)" : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: isSelected ? "0 4px 14px rgba(200, 169, 126, 0.18)" : "0 1px 3px rgba(0,0,0,0.02)"
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "#cbd5e1";
                            e.currentTarget.style.background = "#f8fafc";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "#e2e8f0";
                            e.currentTarget.style.background = "#ffffff";
                          }
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            width: 38, height: 38, borderRadius: "10px", 
                            background: isSelected ? "rgba(200, 169, 126, 0.18)" : "#f1f5f9", 
                            color: isSelected ? "#a07c4f" : "#64748b",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2
                          }}>
                            <Building2 size={20} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                              <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                                {b.name}
                              </h4>
                              {isSelected && (
                                <span style={{ background: "#c8a97e", color: "#fff", fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: 12, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                  Selected
                                </span>
                              )}
                            </div>
                            {b.address && (
                              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4, wordBreak: "break-word" }}>
                                {b.address}
                              </p>
                            )}
                            {b.phone && (
                              <p style={{ margin: "3px 0 0", fontSize: "0.78rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                                <Phone size={12} /> {b.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        <div style={{
                          width: 24, height: 24, borderRadius: "50%",
                          border: isSelected ? "none" : "2px solid #cbd5e1",
                          background: isSelected ? "#c8a97e" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", flexShrink: 0
                        }}>
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button 
                    onClick={() => {
                      if (selectedBranchId) setShowBranchModal(false);
                    }}
                    disabled={!selectedBranchId}
                    style={{
                      flex: 1, padding: "13px 20px", borderRadius: "10px", border: "none",
                      background: selectedBranchId ? "linear-gradient(135deg, #c8a97e 0%, #b08d5c 100%)" : "#e2e8f0",
                      color: selectedBranchId ? "#fff" : "#94a3b8",
                      fontSize: "0.95rem", fontWeight: 700, cursor: selectedBranchId ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: selectedBranchId ? "0 4px 14px rgba(200, 169, 126, 0.35)" : "none",
                      transition: "all 0.2s"
                    }}
                  >
                    Confirm & View Services <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Menu Drawer */}
          <div className={`sf-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="sf-mobile-nav-links">
              <Link to={`/site/${slug}`} onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link to={`/site/${slug}/services`} onClick={() => setMobileMenuOpen(false)}>Services</Link>
              <Link to={`/site/${slug}/my-bookings`} onClick={() => setMobileMenuOpen(false)}>My Bookings</Link>
              {salon.branches?.length > 1 && (
                <button 
                  onClick={() => { setMobileMenuOpen(false); setShowBranchModal(true); }}
                  style={{ background: "none", border: "none", padding: "12px 0", textAlign: "left", fontSize: "1.5rem", fontFamily: "var(--font-serif)", color: "var(--text-main)", cursor: "pointer", borderTop: "1px solid var(--border)", marginTop: "16px", paddingTop: "24px" }}
                >
                  Change Branch
                </button>
              )}
            </div>
          </div>

          <header className={`sf-header ${scrolled ? 'scrolled' : ''}`}>
            <div className="sf-nav-container">
              <Link to={`/site/${slug}`} className="sf-brand">
                {activeSalon?.websiteConfig?.logoUrl ? <img src={activeSalon.websiteConfig.logoUrl} alt={activeSalon.name} style={{ height: "32px", borderRadius: 4 }} /> : activeSalon?.name}
              </Link>

              <nav className="sf-nav-links">
                <Link to={`/site/${slug}`}>Home</Link>
                <Link to={`/site/${slug}/services`}>Services</Link>
                <Link to={`/site/${slug}/my-bookings`}>My Bookings</Link>
              </nav>
              
              <div className="sf-header-actions" style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                {salon.branches?.length > 0 && (
                  <div ref={branchDropdownRef} style={{ position: "relative" }}>
                    <button 
                      onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "100px", outline: "none", cursor: "pointer", fontSize: "0.95rem", fontWeight: 500, fontFamily: 'inherit', color: "var(--text-main)", transition: "all 0.2s" }}
                    >
                      <MapPin size={16} color="var(--text-muted)" />
                      {selectedBranchId ? salon.branches.find(b => b.id === selectedBranchId)?.name || "All Branches" : "All Branches"}
                      <ChevronDown size={16} color="var(--text-muted)" style={{ transform: branchDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                    </button>

                    {branchDropdownOpen && (
                      <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", minWidth: 200, zIndex: 1000, overflow: "hidden", animation: "slideUpFade 0.2s ease" }}>
                        <div 
                          onClick={() => { setSelectedBranchId(""); setBranchDropdownOpen(false); }}
                          style={{ padding: "12px 16px", cursor: "pointer", transition: "background 0.2s", background: selectedBranchId === "" ? "var(--bg-main)" : "transparent", fontWeight: selectedBranchId === "" ? 600 : 400, color: selectedBranchId === "" ? "var(--text-main)" : "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"}
                          onMouseLeave={e => e.currentTarget.style.background = selectedBranchId === "" ? "var(--bg-main)" : "transparent"}
                        >
                          All Branches
                        </div>
                        {salon.branches.map(b => (
                          <div 
                            key={b.id}
                            onClick={() => { setSelectedBranchId(b.id); setBranchDropdownOpen(false); }}
                            style={{ padding: "12px 16px", cursor: "pointer", transition: "background 0.2s", background: selectedBranchId === b.id ? "var(--bg-main)" : "transparent", fontWeight: selectedBranchId === b.id ? 600 : 400, color: selectedBranchId === b.id ? "var(--text-main)" : "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"}
                            onMouseLeave={e => e.currentTarget.style.background = selectedBranchId === b.id ? "var(--bg-main)" : "transparent"}
                          >
                            {b.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <Link to={`/site/${slug}/cart`} style={{ position: "relative", padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: 'var(--text-main)', textDecoration: 'none' }}>
                  <CalendarCheck size={20} />
                  <span style={{ display: 'none' }}>Booking</span>
                  {bookingCount > 0 && (
                    <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, border: '2px solid var(--bg-main)' }}>
                      {bookingCount}
                    </span>
                  )}
                </Link>
                
                <button className="sf-mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ zIndex: 999 }}>
                  {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              </div>
            </div>
          </header>

          <main style={{ flex: 1 }}>
            <StorefrontErrorBoundary>
              <Suspense fallback={null}>
                <Outlet context={{ salon: activeSalon, bookings, addBooking, removeBooking, updateBookingQty, updateBookingTime, clearBookings, bookingCount, selectedBranchId, setSelectedBranchId }} />
              </Suspense>
            </StorefrontErrorBoundary>
          </main>

          <footer className="sf-footer">
            <div className="sf-footer-grid">
              <div>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "16px", fontFamily: 'var(--font-serif)' }}>{activeSalon.name}</h3>
                <p style={{ color: "var(--text-muted)", lineHeight: "1.6", fontSize: "1rem" }}>{activeSalon.websiteConfig?.aboutDescription || "Providing professional grooming and beauty services with uncompromising standards."}</p>
              </div>
              <div>
                <h4 style={{ marginBottom: "20px", fontSize: '1.1rem' }}>Quick Links</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Link to={`/site/${slug}/services`} style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.95rem" }}>Services</Link>
                  <Link to={`/site/${slug}/my-bookings`} style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.95rem" }}>My Bookings</Link>
                </div>
              </div>
              <div>
                <h4 style={{ marginBottom: "20px", fontSize: '1.1rem' }}>Contact & Hours</h4>
                <p style={{ color: "var(--text-muted)", marginBottom: "10px", fontSize: "0.95rem" }}><strong>Phone:</strong> {activeSalon?.websiteConfig?.contactPhone || salon.phone}</p>
                <p style={{ color: "var(--text-muted)", marginBottom: "10px", fontSize: "0.95rem" }}><strong>Email:</strong> {activeSalon?.websiteConfig?.contactEmail || salon.email}</p>
                <p style={{ color: "var(--text-muted)", marginBottom: "12px", fontSize: "0.95rem", lineHeight: 1.5 }}><strong>Address:</strong> {activeSalon?.websiteConfig?.contactAddress || salon.address}</p>
                {activeSalon?.websiteConfig?.businessHours && (
                  <p style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 500, marginBottom: "12px" }}>🕒 {activeSalon.websiteConfig.businessHours}</p>
                )}
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  {activeSalon?.websiteConfig?.socialInstagram && (
                    <a href={activeSalon.websiteConfig.socialInstagram} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-main)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>Instagram</a>
                  )}
                  {activeSalon?.websiteConfig?.socialWhatsapp && (
                    <a href={activeSalon.websiteConfig.socialWhatsapp.startsWith("http") ? activeSalon.websiteConfig.socialWhatsapp : `https://wa.me/${activeSalon.websiteConfig.socialWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-main)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>WhatsApp</a>
                  )}
                  {activeSalon?.websiteConfig?.socialFacebook && (
                    <a href={activeSalon.websiteConfig.socialFacebook} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-main)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>Facebook</a>
                  )}
                </div>
              </div>
            </div>
            <div className="sf-footer-bottom">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} {salon.name}. All rights reserved.</p>
                <div style={{ display: "flex", gap: "24px" }}>
                  <Link to={`/site/${slug}/privacy`} style={{ color: "inherit", textDecoration: "none", transition: "var(--transition)" }}>Terms & Privacy</Link>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}