import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { Outlet, Link, useParams, useLocation } from "react-router-dom";
import { CalendarCheck, Menu, X, MapPin, ArrowRight, ChevronDown, Check, Building2, Phone, Sparkles, Home, Mail, Clock, ShieldCheck, MessageCircle, Globe, Star, ChevronRight, Award } from "lucide-react";
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

function getStorefrontWhatsAppUrl(rawPhone, salonName) {
  if (!rawPhone) return null;
  const str = String(rawPhone).trim();
  if (!str) return null;
  if (str.startsWith("http://") || str.startsWith("https://")) {
    return str;
  }
  let digits = str.replace(/\D/g, "");
  if (!digits) return null;
  // If 10-digit number (India default), prepend 91
  if (digits.length === 10) {
    digits = "91" + digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = "91" + digits.slice(1);
  }
  const defaultMsg = encodeURIComponent(`Hi ${salonName || "there"}, I would like to enquire about your salon services.`);
  return `https://wa.me/${digits}?text=${defaultMsg}`;
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
        const isPreview = typeof window !== 'undefined' && window.location.search.includes("preview=true");
        if (isPreview) {
          setInitialLoading(false);
        } else {
          setTimeout(() => setInitialLoading(false), 400);
        }
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

          {/* Mobile Menu Backdrop Overlay */}
          {mobileMenuOpen && (
            <div 
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(4px)",
                zIndex: 998,
                transition: "opacity 0.3s ease"
              }}
            />
          )}

          {/* Mobile Menu Drawer */}
          <div className={`sf-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`} style={{ zIndex: 999 }}>
            <div className="sf-mobile-drawer-header">
              <span className="sf-mobile-drawer-title">{activeSalon?.name || "Navigation"}</span>
              <button 
                type="button"
                className="sf-mobile-drawer-close" 
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                style={{ width: 36, height: 36, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#0f172a", cursor: "pointer", padding: 0 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
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
              <Link to={`/site/${slug}/blog`} className="sf-mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                <Sparkles size={17} /> <span>Blog</span>
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
                <Link to={`/site/${slug}/blog`}>Blog</Link>
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
                  type="button"
                  className="sf-mobile-menu-btn" 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    padding: 0,
                    transition: "all 0.2s ease"
                  }}
                >
                  {mobileMenuOpen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="7" x2="20" y2="7"></line>
                      <line x1="4" y1="12" x2="16" y2="12"></line>
                      <line x1="4" y1="17" x2="20" y2="17"></line>
                    </svg>
                  )}
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

          {/* Premium Luxury Storefront Footer */}
          <footer style={{ background: "linear-gradient(180deg, #090e17 0%, #030712 100%)", color: "#f8fafc", borderTop: "1px solid rgba(255, 255, 255, 0.08)", position: "relative", overflow: "hidden", marginTop: "auto" }}>
            
            {/* Top VIP Concierge / Booking Banner */}
            <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.07)", padding: "40px 24px", background: "rgba(255, 255, 255, 0.02)" }}>
              <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, rgba(13,148,136,0.2), rgba(20,184,166,0.1))", border: "1px solid rgba(45,212,191,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#5eead4", flexShrink: 0 }}>
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>Experience High-Precision Luxury</h4>
                    <p style={{ margin: "3px 0 0", fontSize: "0.88rem", color: "#94a3b8" }}>Step into a world of tailored aesthetics, organic hair care, and bespoke wellness.</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <Link 
                    to={`/site/${slug}/services`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "11px 22px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(13, 148, 136, 0.35)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span>Reserve Appointment</span>
                    <ArrowRight size={15} />
                  </Link>

                  {(() => {
                    const rawPhone = previewConfig?.socialWhatsapp || activeSalon?.websiteConfig?.socialWhatsapp || activeSalon?.websiteConfig?.contactPhone || salon?.phone || "";
                    const waUrl = getStorefrontWhatsAppUrl(rawPhone, activeSalon?.name || salon?.name);
                    if (!waUrl) return null;
                    return (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 7,
                          padding: "11px 20px",
                          borderRadius: 10,
                          background: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          color: "#ffffff",
                          fontWeight: 600,
                          fontSize: "0.88rem",
                          textDecoration: "none",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <MessageCircle size={16} color="#25D366" />
                        <span>WhatsApp VIP</span>
                      </a>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Main 4-Column Luxury Footer */}
            <div style={{ maxWidth: 1240, margin: "0 auto", padding: "64px 24px 44px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 44 }}>
                
                {/* Col 1: Salon Brand & Mission */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    {activeSalon.logoUrl || activeSalon.websiteConfig?.logoUrl ? (
                      <img 
                        src={activeSalon.websiteConfig?.logoUrl || activeSalon.logoUrl} 
                        alt={activeSalon.name} 
                        style={{ height: 40, width: "auto", objectFit: "contain", borderRadius: 8 }} 
                      />
                    ) : (
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem" }}>
                        {(activeSalon.name || "S")[0].toUpperCase()}
                      </div>
                    )}
                    <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
                      {activeSalon.name}
                    </h3>
                  </div>

                  <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.7, margin: "0 0 20px" }}>
                    {activeSalon.websiteConfig?.aboutDescription || "Providing premier hair artistry, skin rejuvenation, and bespoke grooming rituals with uncompromising standards."}
                  </p>

                  {/* Verified Sanctuary Badge */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(255, 255, 255, 0.04)", borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.08)", width: "fit-content", marginBottom: 20 }}>
                    <ShieldCheck size={16} color="#5eead4" />
                    <span style={{ fontSize: "0.78rem", color: "#cbd5e1", fontWeight: 600 }}>Verified Luxury Sanctuary</span>
                  </div>

                  {/* Social Icon Pills */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: "auto" }}>
                    {activeSalon?.websiteConfig?.socialInstagram && (
                      <a 
                        href={activeSalon.websiteConfig.socialInstagram} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        aria-label="Instagram"
                        style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "all 0.2s ease" }}
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                      </a>
                    )}
                    {activeSalon?.websiteConfig?.socialFacebook && (
                      <a 
                        href={activeSalon.websiteConfig.socialFacebook} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        aria-label="Facebook"
                        style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "all 0.2s ease" }}
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                      </a>
                    )}
                    {(() => {
                      const rawPhone = previewConfig?.socialWhatsapp || activeSalon?.websiteConfig?.socialWhatsapp || activeSalon?.websiteConfig?.contactPhone || salon?.phone || "";
                      const waUrl = getStorefrontWhatsAppUrl(rawPhone, activeSalon?.name || salon?.name);
                      if (!waUrl) return null;
                      return (
                        <a 
                          href={waUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          aria-label="WhatsApp"
                          style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "all 0.2s ease" }}
                        >
                          <MessageCircle size={17} />
                        </a>
                      );
                    })()}
                  </div>
                </div>

                {/* Col 2: Navigation & Experiences */}
                <div>
                  <h4 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
                    Experience & Treatments
                  </h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    <li>
                      <Link to={`/site/${slug}`} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s ease", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <ChevronRight size={13} color="#0d9488" /> Sanctuary Home
                      </Link>
                    </li>
                    <li>
                      <Link to={`/site/${slug}/services`} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s ease", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <ChevronRight size={13} color="#0d9488" /> Treatment Menu
                      </Link>
                    </li>
                    <li>
                      <Link to={`/site/${slug}/blog`} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s ease", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <ChevronRight size={13} color="#0d9488" /> Journal & Styling Secrets
                      </Link>
                    </li>
                    <li>
                      <Link to={`/site/${slug}/about`} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s ease", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <ChevronRight size={13} color="#0d9488" /> About Our Heritage
                      </Link>
                    </li>
                    <li>
                      <Link to={`/site/${slug}/contact`} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s ease", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <ChevronRight size={13} color="#0d9488" /> Find Sanctuary Location
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Col 3: Client Portal & Care */}
                <div>
                  <h4 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
                    Client Portal & Bookings
                  </h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    <li>
                      <Link to={`/site/${slug}/cart`} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s ease", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <ChevronRight size={13} color="#0d9488" /> View Reserved Slots ({bookingCount})
                      </Link>
                    </li>
                    <li>
                      <Link to={`/site/${slug}/my-bookings`} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s ease", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <ChevronRight size={13} color="#0d9488" /> Appointment History
                      </Link>
                    </li>
                    <li>
                      <Link to="/customer/login" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s ease", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <ChevronRight size={13} color="#0d9488" /> Customer VIP Account
                      </Link>
                    </li>
                    <li>
                      <Link to={`/site/${slug}/privacy`} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s ease", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <ChevronRight size={13} color="#0d9488" /> Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link to={`/site/${slug}/terms`} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s ease", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <ChevronRight size={13} color="#0d9488" /> Terms & Service Policies
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Col 4: Contact & Concierge */}
                <div>
                  <h4 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
                    Concierge & Hours
                  </h4>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Phone */}
                    {(activeSalon?.websiteConfig?.contactPhone || salon.phone) && (
                      <a 
                        href={`tel:${(activeSalon?.websiteConfig?.contactPhone || salon.phone || "").replace(/\s+/g, '')}`} 
                        style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#cbd5e1", textDecoration: "none", fontSize: "0.88rem" }}
                      >
                        <Phone size={16} color="#5eead4" style={{ flexShrink: 0, marginTop: 3 }} />
                        <span>{activeSalon?.websiteConfig?.contactPhone || salon.phone}</span>
                      </a>
                    )}

                    {/* Email */}
                    {(activeSalon?.websiteConfig?.contactEmail || salon.email) && (
                      <a 
                        href={`mailto:${activeSalon?.websiteConfig?.contactEmail || salon.email}`} 
                        style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#cbd5e1", textDecoration: "none", fontSize: "0.88rem" }}
                      >
                        <Mail size={16} color="#5eead4" style={{ flexShrink: 0, marginTop: 3 }} />
                        <span style={{ wordBreak: "break-all" }}>{activeSalon?.websiteConfig?.contactEmail || salon.email}</span>
                      </a>
                    )}

                    {/* Address */}
                    {(activeSalon?.websiteConfig?.contactAddress || salon.address) && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#cbd5e1", fontSize: "0.88rem", lineHeight: 1.5 }}>
                        <MapPin size={16} color="#5eead4" style={{ flexShrink: 0, marginTop: 3 }} />
                        <span>{activeSalon?.websiteConfig?.contactAddress || salon.address}</span>
                      </div>
                    )}

                    {/* Business Hours */}
                    {activeSalon?.websiteConfig?.businessHours && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "rgba(255, 255, 255, 0.04)", borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.08)", marginTop: 4 }}>
                        <Clock size={16} color="#5eead4" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: "0.72rem", color: "#5eead4", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Visiting Hours</div>
                          <div style={{ fontSize: "0.82rem", color: "#e2e8f0", marginTop: 2 }}>{activeSalon.websiteConfig.businessHours}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Copyright & Guarantee Bar */}
            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)", padding: "24px 24px", background: "rgba(0, 0, 0, 0.4)" }}>
              <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                  &copy; {new Date().getFullYear()} <strong style={{ color: "#cbd5e1" }}>{activeSalon.name}</strong>. All rights reserved.
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: "0.82rem" }}>
                  <Link to={`/site/${slug}/privacy`} style={{ color: "#64748b", textDecoration: "none", transition: "color 0.2s ease" }}>Privacy Policy</Link>
                  <span style={{ color: "#334155" }}>•</span>
                  <Link to={`/site/${slug}/terms`} style={{ color: "#64748b", textDecoration: "none", transition: "color 0.2s ease" }}>Terms of Service</Link>
                  <span style={{ color: "#334155" }}>•</span>
                  <span style={{ color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <ShieldCheck size={14} color="#0d9488" /> 256-Bit SSL Encrypted
                  </span>
                </div>
              </div>
            </div>

          </footer>

          {/* Floating WhatsApp Quick Chat Button (Dynamic from Website Editor, default country code +91) */}
          {(() => {
            const rawPhone = previewConfig?.socialWhatsapp || activeSalon?.websiteConfig?.socialWhatsapp || activeSalon?.websiteConfig?.contactPhone || salon?.phone || "";
            const waUrl = getStorefrontWhatsAppUrl(rawPhone, activeSalon?.name || salon?.name);
            if (!waUrl) return null;
            return (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp"
                title="Chat on WhatsApp"
                className="sf-floating-whatsapp-btn"
                style={{
                  position: "fixed",
                  bottom: "24px",
                  right: "24px",
                  zIndex: 9999,
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                  boxShadow: "0 8px 24px rgba(37, 211, 102, 0.45), 0 2px 8px rgba(0, 0, 0, 0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  textDecoration: "none",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1) translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 28px rgba(37, 211, 102, 0.6), 0 4px 12px rgba(0, 0, 0, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1) translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(37, 211, 102, 0.45), 0 2px 8px rgba(0, 0, 0, 0.18)";
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </a>
            );
          })()}
        </>
      )}
    </div>
  );
}