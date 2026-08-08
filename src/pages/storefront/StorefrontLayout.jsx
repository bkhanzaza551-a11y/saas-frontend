import { useState, useEffect, useCallback } from "react";
import { Outlet, Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import StorefrontErrorBoundary from "./StorefrontErrorBoundary";
import "../../storefront.css";

const BOOKINGS_KEY = "sf_bookings";
const BRANCH_KEY = "sf_branch";

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
  try { return localStorage.getItem(BRANCH_KEY) || ""; } catch { return ""; }
}

export default function StorefrontLayout() {
  const { slug } = useParams();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState(loadBookings);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(loadBranch);

  useEffect(() => { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem(BRANCH_KEY, selectedBranchId); }, [selectedBranchId]);

  useEffect(() => {
    if (!slug) return;
    api.get(`/public/salon/${slug}`)
      .then(res => {
        const s = res.data.salon;
        setSalon(s);
        if (!selectedBranchId && s.branches && s.branches.length === 1) {
          setSelectedBranchId(s.branches[0].id);
        }
      })
      .catch(() => setSalon(null))
      .finally(() => setLoading(false));
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

  if (loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Storefront...</div>;
  if (!salon) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Salon not found</div>;

  return (
    <div className="storefront-wrapper">
      {/* Branch Selection Modal */}
      {salon.branches?.length > 1 && !selectedBranchId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "var(--bg-main)", borderRadius: "var(--radius-lg)", padding: "48px 40px", maxWidth: 600, width: "100%", boxShadow: "var(--shadow-lg)", textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", marginBottom: 16, color: "var(--text-main)", letterSpacing: "-0.5px" }}>Welcome to {salon.name}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", marginBottom: 40, lineHeight: 1.6 }}>Please select a branch location to view available services and book your appointment.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {salon.branches.map(b => (
                <div 
                  key={b.id} 
                  onClick={() => setSelectedBranchId(b.id)} 
                  style={{ padding: "20px 24px", borderRadius: "var(--radius-md)", border: "2px solid var(--border)", cursor: "pointer", transition: "var(--transition)", background: "var(--surface)", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <div>
                    <h3 style={{ margin: "0 0 6px", fontSize: "1.15rem", color: "var(--text-main)", fontWeight: 600 }}>{b.name}</h3>
                    {b.address && <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.4 }}>{b.address}</p>}
                  </div>
                  <div style={{ color: "var(--accent)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <header className="sf-header">
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
            <Link to={`/site/${slug}/cart`} className="sf-btn-dark" style={{ position: "relative", padding: '10px 24px' }}>
              Cart
              {bookingCount > 0 && (
                <span style={{ position: "absolute", top: -8, right: -8, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, border: '2px solid var(--bg-main)' }}>
                  {bookingCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <StorefrontErrorBoundary>
          <Outlet context={{ salon, bookings, addBooking, removeBooking, updateBookingQty, updateBookingTime, clearBookings, bookingCount, selectedBranchId, setSelectedBranchId }} />
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
    </div>
  );
}