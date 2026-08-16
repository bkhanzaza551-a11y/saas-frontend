import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { Outlet, Link, useParams, useLocation } from "react-router-dom";
import { CalendarCheck, Menu, X, MapPin, ArrowRight, ChevronDown } from "lucide-react";
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
              position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(12px)", 
              zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
              animation: "fadeIn 0.4s ease-out"
            }}>
              <div style={{ 
                background: "#ffffff", 
                borderRadius: "16px", padding: "32px", maxWidth: 400, width: "100%", 
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)", 
                textAlign: "center", position: "relative",
                border: "1px solid #e2e8f0",
                transform: "translateY(0)",
                animation: "slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
              }}>
                {selectedBranchId && (
                  <button onClick={() => setShowBranchModal(false)} style={{ 
                    position: "absolute", top: 16, right: 16, background: "#f1f5f9", 
                    border: "none", cursor: "pointer", color: "#64748b", borderRadius: "50%",
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease"
                  }} onMouseOver={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#334155"; }} onMouseOut={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}>
                    <X size={18} />
                  </button>
                )}
                
                <div style={{ marginBottom: 24 }}>
                  <div style={{ width: 56, height: 56, margin: "0 auto 16px", background: "linear-gradient(135deg, #c8a97e, #b08d5c)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 25px -5px rgba(200, 169, 126, 0.4)" }}>
                    <MapPin size={28} color="#fff" strokeWidth={1.5} />
                  </div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", margin: "0 0 8px", color: "#0f172a", letterSpacing: "-0.5px" }}>Welcome to <span style={{ color: "#c8a97e" }}>{salon.name}</span></h2>
                  <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0, lineHeight: 1.5 }}>Please select a sanctuary location to experience our premium services.</p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ textAlign: "left" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Select Branch</label>
                    <select 
                      style={{ 
                        width: "100%", padding: "12px 16px", borderRadius: "8px", 
                        border: "1px solid #cbd5e1", background: "#fff", fontSize: "1rem", 
                        color: "#0f172a", outline: "none", cursor: "pointer", appearance: "auto"
                      }}
                      value={selectedBranchId || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setSelectedBranchId(val);
                        }
                      }}
                    >
                      <option value="" disabled>Choose a location...</option>
                      {salon.branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}{b.address ? ` - ${b.address}` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={() => {
                      if (selectedBranchId) setShowBranchModal(false);
                    }}
                    disabled={!selectedBranchId}
                    style={{
                      width: "100%", padding: "14px", borderRadius: "8px", border: "none",
                      background: selectedBranchId ? "#c8a97e" : "#e2e8f0",
                      color: selectedBranchId ? "#fff" : "#94a3b8",
                      fontSize: "1rem", fontWeight: 600, cursor: selectedBranchId ? "pointer" : "not-allowed",
                      transition: "all 0.2s"
                    }}
                  >
                    Continue
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
                <h4 style={{ marginBottom: "20px", fontSize: '1.1rem' }}>Contact</h4>
                <p style={{ color: "var(--text-muted)", marginBottom: "12px", fontSize: "0.95rem" }}><strong>Email:</strong> {activeSalon?.websiteConfig?.contactEmail || salon.email}</p>
                <p style={{ color: "var(--text-muted)", marginBottom: "12px", fontSize: "0.95rem" }}><strong>Phone:</strong> {activeSalon?.websiteConfig?.contactPhone || salon.phone}</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}><strong>Address:</strong> {activeSalon?.websiteConfig?.contactAddress || salon.address}</p>
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