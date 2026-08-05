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
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(loadBranch);

  useEffect(() => {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(BRANCH_KEY, selectedBranchId);
  }, [selectedBranchId]);

  useEffect(() => {
    if (!slug) return;
    api.get(`/public/salon/${slug}`)
      .then(res => {
        const s = res.data.salon;
        setSalon(s);
        if (!selectedBranchId && s.branches && s.branches.length > 0) {
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
        serviceId: service.id,
        name: service.name,
        price: service.salePrice || service.price,
        duration: service.durationMin,
        imageUrl: service.imageUrl,
        date, time, qty: 1,
        branchId: selectedBranchId,
        createdAt: Date.now(),
      }];
    });
    setCartOpen(true);
  }, []);

  const removeBooking = (idx) => setBookings(prev => prev.filter((_, i) => i !== idx));

  if (loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;
  if (!salon) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Salon not found</div>;

  const cartTotal = bookings.reduce((sum, b) => sum + (Number(b.price) * b.qty), 0);

  return (
    <div className="storefront-wrapper">
      <header className="sf-header sf-animate">
        <div className="sf-nav-container">
          <Link to={`/site/${slug}`} className="sf-brand">
            {salon.websiteConfig?.logoUrl && <img src={salon.websiteConfig.logoUrl} alt={salon.name} />}
            {salon.name}
          </Link>
          <nav className="sf-nav-links">
            <Link to={`/site/${slug}`}>Home</Link>
            <Link to={`/site/${slug}/services`}>Our Services</Link>
            <Link to={`/site/${slug}/my-bookings`}>My Bookings</Link>
          </nav>
          
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {salon.branches && salon.branches.length > 0 && (
              <select 
                value={selectedBranchId} 
                onChange={e => setSelectedBranchId(e.target.value)}
                style={{ padding: "12px 20px", borderRadius: 100, border: "1px solid var(--sf-border)", background: "var(--sf-surface)", fontSize: "0.95rem", fontWeight: 500, outline: "none", cursor: "pointer" }}
              >
                <option value="">All Branches</option>
                {salon.branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            
            <button className="sf-btn-dark" onClick={() => setCartOpen(true)}>
              Bookings ({bookings.length})
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <StorefrontErrorBoundary>
          <Outlet context={{ salon, bookings, addBooking, selectedBranchId }} />
        </StorefrontErrorBoundary>
      </main>

      <footer className="sf-footer">
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 60, textAlign: "left", marginBottom: 60 }}>
          <div>
            <h3>{salon.name}</h3>
            <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.6)" }}>
              {salon.websiteConfig?.footerText || "Experience luxury and premium care at our salon. We are dedicated to bringing out your best self."}
            </p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
              <Link to={`/site/${slug}`} style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Home</Link>
              <Link to={`/site/${slug}/services`} style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Our Services</Link>
              <Link to={`/site/${slug}/my-bookings`} style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Track Bookings</Link>
            </div>
          </div>
          <div>
            <h4>Contact Us</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
              <span>{salon.email || "contact@salon.com"}</span>
              <span>{salon.phone || "+1 234 567 8900"}</span>
              <span>{salon.address || "123 Premium Street, Beauty District"}</span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 40, color: "rgba(255,255,255,0.4)", fontSize: "0.95rem", textAlign: "center" }}>
          &copy; {new Date().getFullYear()} {salon.name}. All rights reserved.
        </div>
      </footer>

      {/* Cart Drawer */}
      <div className={`sf-drawer-overlay ${cartOpen ? "open" : ""}`} onClick={() => setCartOpen(false)} />
      <div className={`sf-drawer ${cartOpen ? "open" : ""}`}>
        <div className="sf-drawer-header">
          <h2>Your Bookings</h2>
          <button className="sf-close-btn" onClick={() => setCartOpen(false)}>×</button>
        </div>
        <div className="sf-drawer-body">
          {bookings.length === 0 ? (
            <p style={{ color: "var(--sf-text-muted)", fontSize: "1.1rem" }}>No services selected yet.</p>
          ) : (
            bookings.map((b, i) => (
              <div key={i} className="sf-cart-item">
                <img src={b.imageUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&fit=crop"} alt={b.name} />
                <div className="sf-cart-item-info">
                  <h4>{b.name}</h4>
                  <div className="sf-cart-item-meta">{new Date(b.date).toLocaleDateString()} at {b.time}</div>
                  <div className="sf-cart-item-meta">{b.duration} mins</div>
                  <div className="sf-cart-item-price" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--sf-luxury-gold)" }}>{salon.currency} {Number(b.price).toLocaleString()}</span>
                    <button onClick={() => removeBooking(i)} style={{ color: "#ef4444", fontSize: "0.95rem", fontWeight: "500" }}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="sf-drawer-footer">
          <div className="sf-cart-total">
            <span>Total</span>
            <span style={{ color: "var(--sf-luxury-gold)" }}>{salon.currency} {cartTotal.toLocaleString()}</span>
          </div>
          <Link to={`/site/${slug}/checkout`} style={{ display: "block", textDecoration: "none" }}>
            <button className="sf-btn-block" disabled={bookings.length === 0} onClick={() => setCartOpen(false)}>
              Proceed to Checkout
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}