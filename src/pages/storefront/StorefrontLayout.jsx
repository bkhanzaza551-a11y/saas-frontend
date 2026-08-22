import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { Outlet, Link, useParams, useLocation } from "react-router-dom";
import { CalendarCheck, Menu, X, MapPin, ArrowRight, ChevronDown, Check, Building2, Phone, Sparkles, Home } from "lucide-react";
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
  const { slug: urlSlug } = useParams();
  const [resolvedSlug, setResolvedSlug] = useState(null);
  const [resolving, setResolving] = useState(!urlSlug);
  const slug = urlSlug || resolvedSlug;
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

      if (e.data && e.data.type === 'SCROLL_TO_SECTION') {
        const sectionMap = {
          branding: 'sf-hero-section',
          hero: 'sf-hero-section',
          about: 'sf-about-section',
          gallery: 'sf-gallery-section',
          reviews: 'sf-testimonials-section',
          contact: 'sf-contact-section',
          hours: 'sf-contact-section',
          seo: 'sf-hero-section'
        };
        const targetId = sectionMap[e.data.section] || 'sf-hero-section';
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const cfg = previewConfig || salon?.websiteConfig;
    if (cfg?.metaTitle) {
      document.title = cfg.metaTitle;
    } else if (salon?.name) {
      document.title = `${salon.name} | Luxury Salon & Spa`;
    }

    if (cfg?.metaDescription) {
      let metaTag = document.querySelector('meta[name="description"]');
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.name = 'description';
        document.head.appendChild(metaTag);
      }
      metaTag.content = cfg.metaDescription;
    }
  }, [salon, previewConfig]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  useEffect(() => {
    if (urlSlug) { setResolving(false); return; }
    const host = window.location.hostname.toLowerCase();
    const isSubdomain = host.includes("salonnest.in") && !host.startsWith("www.") && host !== "salonnest.in";
    if (host.includes("vercel.app") || host.includes("localhost") || !isSubdomain) {
      setResolving(false);
      return;
    }
    api.get("/public/domain/resolve")
      .then(({ data }) => {
        if (data.salonSlug) {
          setResolvedSlug(data.salonSlug);
          window.history.replaceState({}, "", `/site/${data.salonSlug}${window.location.search}`);
        }
      })
      .catch(() => {})
      .finally(() => setResolving(false));
  }, [urlSlug]);

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
        <div className="sf-preloader-content">
          <div className="sf-preloader-glow-ring"></div>
          <div className="sf-preloader-text">{displaySalonName}</div>
          <div className="sf-preloader-bar"><span className="sf-preloader-bar-inner"></span></div>
        </div>
      </div>

      {salon && (
        <>
          {/* Premium Branch Selection Modal */}
          {showBranchModal && salon.branches?.length > 1 && (
            <div className="sf-branch-modal-overlay">
              <div className="sf-branch-modal-card">
                {selectedBranchId && (
                  <button className="sf-branch-modal-close" onClick={() => setShowBranchModal(false)}>
                    <X size={16} />
                  </button>
                )}
                
                <div className="sf-branch-modal-header">
                  <div className="sf-branch-modal-icon">
                    <MapPin size={20} color="#fff" strokeWidth={2} />
                  </div>
                  <h2 className="sf-branch-modal-title">
                    Select Sanctuary Location
                  </h2>
                  <p className="sf-branch-modal-desc">
                    Choose your nearest branch to explore specialized services & live stylist availability.
                  </p>
                </div>
                
                {/* Branch Cards List */}
                <div className="sf-branch-modal-list">
                  {salon.branches.map(b => {
                    const isSelected = selectedBranchId === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBranchId(b.id)}
                        className={`sf-branch-modal-item ${isSelected ? 'selected' : ''}`}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 }}>
                          <div className="sf-branch-modal-item-icon">
                            <Building2 size={16} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                              <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
                                {b.name}
                              </h4>
                              {isSelected && (
                                <span style={{ background: "#c8a97e", color: "#fff", fontSize: "0.65rem", fontWeight: 800, padding: "1px 6px", borderRadius: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                  Selected
                                </span>
                              )}
                            </div>
                            {b.address && (
                              <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b", lineHeight: 1.35, wordBreak: "break-word" }}>
                                {b.address}
                              </p>
                            )}
                            {b.phone && (
                              <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                                <Phone size={10} /> {b.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          border: isSelected ? "none" : "2px solid #cbd5e1",
                          background: isSelected ? "#c8a97e" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", flexShrink: 0
                        }}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                  <button 
                    onClick={() => {
                      if (selectedBranchId) setShowBranchModal(false);
                    }}
                    disabled={!selectedBranchId}
                    className="sf-branch-modal-btn"
                    style={{
                      background: selectedBranchId ? "linear-gradient(135deg, #c8a97e 0%, #b08d5c 100%)" : "#e2e8f0",
                      color: selectedBranchId ? "#fff" : "#94a3b8",
                      cursor: selectedBranchId ? "pointer" : "not-allowed",
                      boxShadow: selectedBranchId ? "0 4px 14px rgba(200, 169, 126, 0.35)" : "none",
                    }}
                  >
                    Confirm & View Services <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Menu Drawer */}
          <div className={`sf-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="sf-mobile-drawer-header">
              <span className="sf-mobile-drawer-title">{activeSalon?.name || "Navigation"}</span>
              <button 
                className="sf-mobile-drawer-close" 
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="sf-mobile-nav-links">
              <Link to={`/site/${slug}`} className="sf-mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                <Home size={17} /> <span>Home</span>
              </Link>
              <Link to={`/site/${slug}/services`} className="sf-mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                <Sparkles size={17} /> <span>Services & Prices</span>
              </Link>
              <Link to={`/site/${slug}/my-bookings`} className="sf-mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                <CalendarCheck size={17} /> <span>My Bookings</span>
              </Link>

              {salon.branches?.length > 1 && (
                <div className="sf-mobile-branch-wrapper">
                  <div className="sf-mobile-branch-label">Selected Location</div>
                  <button 
                    onClick={() => { setMobileMenuOpen(false); setShowBranchModal(true); }}
                    className="sf-mobile-branch-card"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div className="sf-mobile-branch-icon">
                        <MapPin size={15} />
                      </div>
                      <div style={{ textAlign: "left", minWidth: 0 }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {selectedBranchId ? salon.branches.find(b => b.id === selectedBranchId)?.name || "All Branches" : "All Branches"}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Tap to switch branch</div>
                      </div>
                    </div>
                    <span className="sf-mobile-branch-tag">Change</span>
                  </button>
                </div>
              )}
            </div>

            <div className="sf-mobile-drawer-footer">
              <Link 
                to={`/site/${slug}/services`} 
                onClick={() => setMobileMenuOpen(false)}
                className="sf-mobile-drawer-cta"
              >
                Book Appointment <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <header className={`sf-header ${scrolled ? 'scrolled' : ''}`}>
            <div className="sf-nav-container">
              <Link to={`/site/${slug}`} className="sf-brand">
                {activeSalon?.websiteConfig?.logoUrl ? (
                  <img src={activeSalon.websiteConfig.logoUrl} alt={activeSalon.name} style={{ height: "36px", maxHeight: "36px", objectFit: "contain", borderRadius: 6 }} onError={e => { e.target.onerror = null; e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline-flex'; }} />
                ) : null}
                <span style={{ display: activeSalon?.websiteConfig?.logoUrl ? 'none' : 'inline-flex', alignItems: "center", gap: 8, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent, #0d9488)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 900 }}>
                    {(activeSalon?.name || "S").charAt(0).toUpperCase()}
                  </span>
                  {activeSalon?.name || "Salon"}
                </span>
              </Link>

              <nav className="sf-nav-links">
                <Link to={`/site/${slug}`}>Home</Link>
                <Link to={`/site/${slug}/services`}>Services & Pricing</Link>
                <Link to={`/site/${slug}/my-bookings`}>My Bookings</Link>
              </nav>
              
              <div className="sf-header-actions">
                {salon.branches?.length > 0 && (
                  <div ref={branchDropdownRef} style={{ position: "relative" }}>
                    <button 
                      onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                      className="sf-branch-btn"
                    >
                      <MapPin size={15} color="var(--accent, #0d9488)" />
                      <span>{selectedBranchId ? salon.branches.find(b => b.id === selectedBranchId)?.name || "All Locations" : "All Locations"}</span>
                      <ChevronDown size={13} color="var(--text-muted)" style={{ transform: branchDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
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
                <Link to={`/site/${slug}/cart`} className="sf-cart-icon-btn" aria-label="Bookings">
                  <CalendarCheck size={18} />
                  {bookingCount > 0 && (
                    <span className="sf-cart-badge">
                      {bookingCount}
                    </span>
                  )}
                </Link>

                <Link to={`/site/${slug}/services`} className="sf-header-cta-btn">
                  <Sparkles size={14} /> Book Appointment
                </Link>
                
                <button 
                  className="sf-mobile-menu-btn" 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
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