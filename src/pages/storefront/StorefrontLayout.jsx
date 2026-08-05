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

export default function StorefrontLayout() {
  const { slug } = useParams();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState(loadBookings);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    if (!slug) return;
    api.get(`/public/salon/${slug}`)
      .then(res => setSalon(res.data.salon))
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
            {salon.websiteConfig?.logoUrl ? <img src={salon.websiteConfig.logoUrl} alt={salon.name} /> : <div style={{width: 32, height: 32, background: "#111", borderRadius: 4}}></div>}
            {salon.name}
          </Link>
          <nav className="sf-nav-links">
            <Link to={`/site/${slug}`}>Home</Link>
            <Link to={`/site/${slug}/services`}>Our Services</Link>
            <Link to={`/site/${slug}/my-bookings`}>My Bookings</Link>
          </nav>
          <button className="sf-btn-dark" onClick={() => setCartOpen(true)}>
            Bookings ({bookings.length})
          </button>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <StorefrontErrorBoundary>
          <Outlet context={{ salon, bookings, addBooking }} />
        </StorefrontErrorBoundary>
      </main>

      <footer className="sf-footer">
        <h2>{salon.name}</h2>
        <p>{salon.websiteConfig?.footerText || "Premium Salon Services. All rights reserved."}</p>
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
            <p style={{ color: "var(--sf-text-muted)" }}>No services selected yet.</p>
          ) : (
            bookings.map((b, i) => (
              <div key={i} className="sf-cart-item">
                <img src={b.imageUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&fit=crop"} alt={b.name} />
                <div className="sf-cart-item-info">
                  <h4>{b.name}</h4>
                  <div className="sf-cart-item-meta">{new Date(b.date).toLocaleDateString()} at {b.time}</div>
                  <div className="sf-cart-item-meta">{b.duration} mins</div>
                  <div className="sf-cart-item-price" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {salon.currency} {Number(b.price).toLocaleString()}
                    <button onClick={() => removeBooking(i)} style={{ color: "#ef4444", fontSize: "0.9rem", textDecoration: "underline" }}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="sf-drawer-footer">
          <div className="sf-cart-total">
            <span>Total</span>
            <span>{salon.currency} {cartTotal.toLocaleString()}</span>
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
