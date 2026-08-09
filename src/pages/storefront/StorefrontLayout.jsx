import { useState, useEffect, useCallback, Suspense } from "react";
import { Outlet, Link, useParams, useLocation } from "react-router-dom";
import { CalendarCheck, Menu, X, MapPin, ArrowRight } from "lucide-react";
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
  const location = useLocation();

  useEffect(() => {
    // Show preloader on subpage navigation for 1.5 seconds
    setPageTransitioning(true);
    const timer = setTimeout(() => setPageTransitioning(false), 1500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

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
        setSalon(s);
        let allBranches = [];
        if (s.branches && Array.isArray(s.branches) && s.branches.length > 0) {
          allBranches = s.branches;
        } else {
          const branchMap = new Map();
          if (res.data.services) {
            res.data.services.forEach(item => {
              if (item.branchId && item.branchId !== "seed-main-branch" && item.branchId !== "seed-dha-branch" && item.branchId !== "seed-gulberg-branch" && item.branchId !== "seed-johar-branch") {
                // If it's just ID we can't do much without the full object
              }
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

        // Add mock branches if the DB doesn't return them for some reason but they exist in services
        if (allBranches.length === 0 || allBranches.length === 1) {
             const uniqueBranchIds = new Set();
             if (res.data.services) res.data.services.forEach(srv => { if (srv.branchId) uniqueBranchIds.add(srv.branchId) });
             if (res.data.products) res.data.products.forEach(prod => { if (prod.branchId) uniqueBranchIds.add(prod.branchId) });
             
             if (uniqueBranchIds.size > allBranches.length) {
                 const mockedBranches = [];
                 uniqueBranchIds.forEach(id => {
                     let name = "Branch";
                     if (id === "seed-main-branch") name = "Main Branch";
                     if (id === "seed-dha-branch") name = "DHA Branch";
                     if (id === "seed-gulberg-branch") name = "Gulberg Branch";
                     if (id === "seed-johar-branch") name = "Johar Branch";
                     mockedBranches.push({ id, name });
                 });
                 s.branches = mockedBranches;
                 allBranches = mockedBranches;
             }
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
                background: "linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))", 
                borderRadius: "24px", padding: "48px 40px", maxWidth: 540, width: "100%", 
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)", 
                textAlign: "center", position: "relative",
                border: "1px solid rgba(255,255,255,0.05)",
                transform: "translateY(0)",
                animation: "slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
              }}>
                {selectedBranchId && (
                  <button onClick={() => setShowBranchModal(false)} style={{ 
                    position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.05)", 
                    border: "none", cursor: "pointer", color: "#94a3b8", borderRadius: "50%",
                    width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease"
                  }} onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }} onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94a3b8"; }}>
                    <X size={20} />
                  </button>
                )}
                
                <div style={{ marginBottom: 32 }}>
                  <div style={{ width: 64, height: 64, margin: "0 auto 24px", background: "linear-gradient(135deg, #c8a97e, #b08d5c)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 25px -5px rgba(200, 169, 126, 0.4)" }}>
                    <MapPin size={32} color="#fff" strokeWidth={1.5} />
                  </div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", margin: "0 0 12px", color: "#f8fafc", letterSpacing: "-0.5px" }}>Welcome to <span style={{ color: "#c8a97e" }}>{salon.name}</span></h2>
                  <p style={{ color: "#94a3b8", fontSize: "1.05rem", margin: 0, lineHeight: 1.6, fontWeight: 300 }}>Please select a sanctuary location to experience our premium services.</p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {salon.branches.map((b, i) => (
                    <div 
                      key={b.id} 
                      onClick={() => { setSelectedBranchId(b.id); setShowBranchModal(false); }} 
                      style={{ 
                        padding: "20px 24px", borderRadius: "16px", 
                        border: "1px solid", borderColor: selectedBranchId === b.id ? "#c8a97e" : "rgba(255,255,255,0.08)", 
                        cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", 
                        background: selectedBranchId === b.id ? "rgba(200, 169, 126, 0.05)" : "rgba(255,255,255,0.02)", 
                        textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
                        animation: `fadeInUp 0.4s ease forwards ${i * 0.1}s`,
                        opacity: 0,
                        transform: "translateY(10px)"
                      }}
                      onMouseEnter={e => { 
                        if (selectedBranchId !== b.id) {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; 
                          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }
                      }}
                      onMouseLeave={e => { 
                        if (selectedBranchId !== b.id) {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; 
                          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                          e.currentTarget.style.transform = "translateY(0)";
                        } else {
                          e.currentTarget.style.transform = "translateY(0)";
                        }
                      }}
                    >
                      <div>
                        <h3 style={{ margin: "0 0 6px", fontSize: "1.15rem", color: "#f8fafc", fontWeight: 500, letterSpacing: "0.5px" }}>
                          {b.name} 
                          {selectedBranchId === b.id && <span style={{ fontSize: "0.75rem", color: "#c8a97e", marginLeft: 12, padding: "2px 8px", background: "rgba(200, 169, 126, 0.1)", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Active</span>}
                        </h3>
                        {b.address && <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem", lineHeight: 1.4, display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} /> {b.address}</p>}
                      </div>
                      <div style={{ 
                        color: selectedBranchId === b.id ? "#c8a97e" : "#475569",
                        transform: selectedBranchId === b.id ? "translateX(0)" : "translateX(-5px)",
                        opacity: selectedBranchId === b.id ? 1 : 0.5,
                        transition: "all 0.3s ease"
                      }}>
                        <ArrowRight size={20} strokeWidth={selectedBranchId === b.id ? 2.5 : 1.5} />
                      </div>
                    </div>
                  ))}
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
                {salon.websiteConfig?.logoUrl ? <img src={salon.websiteConfig.logoUrl} alt={salon.name} style={{ height: "32px", borderRadius: 4 }} /> : salon.name}
              </Link>

              <nav className="sf-nav-links">
                <Link to={`/site/${slug}`}>Home</Link>
                <Link to={`/site/${slug}/services`}>Services</Link>
                <Link to={`/site/${slug}/my-bookings`}>My Bookings</Link>
              </nav>
              
              <div className="sf-header-actions" style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                {salon.branches?.length > 0 && (
                  <select 
                    value={selectedBranchId} 
                    onChange={e => setSelectedBranchId(e.target.value)}
                    style={{ padding: "8px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outline: "none", cursor: "pointer", fontSize: "0.9rem", fontWeight: "500", fontFamily: 'inherit' }}
                  >
                    <option value="">All Branches</option>
                    {salon.branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
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
                <Outlet context={{ salon, bookings, addBooking, removeBooking, updateBookingQty, updateBookingTime, clearBookings, bookingCount, selectedBranchId, setSelectedBranchId }} />
              </Suspense>
            </StorefrontErrorBoundary>
          </main>

          <footer className="sf-footer">
            <div className="sf-footer-grid">
              <div>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "16px", fontFamily: 'var(--font-serif)' }}>{salon.name}</h3>
                <p style={{ color: "var(--text-muted)", lineHeight: "1.6", fontSize: "1rem" }}>{salon.websiteConfig?.aboutDescription || "Providing professional grooming and beauty services with uncompromising standards."}</p>
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
                <p style={{ color: "var(--text-muted)", marginBottom: "12px", fontSize: "0.95rem" }}><strong>Email:</strong> {salon.email}</p>
                <p style={{ color: "var(--text-muted)", marginBottom: "12px", fontSize: "0.95rem" }}><strong>Phone:</strong> {salon.phone}</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}><strong>Address:</strong> {salon.address}</p>
              </div>
            </div>
            <div className="sf-footer-bottom">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} {salon.name}. All rights reserved.</p>
                <div style={{ display: "flex", gap: "24px" }}>
                  <span style={{ cursor: 'pointer', transition: 'var(--transition)' }}>Terms of Service</span>
                  <span style={{ cursor: 'pointer', transition: 'var(--transition)' }}>Privacy Policy</span>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}