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

  useEffect(() => { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem(BRANCH_KEY, selectedBranchId); }, [selectedBranchId]);

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
        serviceId: service.id, name: service.name, price: service.salePrice || service.price,
        duration: service.durationMin, imageUrl: service.imageUrl, date, time, qty: 1,
        branchId: selectedBranchId, createdAt: Date.now(),
      }];
    });
    setCartOpen(true);
  }, []);

  if (loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#d4af37" }}>Loading VIP Experience...</div>;
  if (!salon) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Salon not found</div>;

  return (
    <div className="storefront-wrapper">
      
      {/* PROFESSIONAL NAVBAR */}
      <header className="sf-header">
        <div className="sf-nav-container">
          <Link to={`/site/${slug}`} className="sf-brand">
            {salon.websiteConfig?.logoUrl ? <img src={salon.websiteConfig.logoUrl} alt={salon.name} style={{ height: "40px" }} /> : salon.name}
          </Link>
          
          <nav className="sf-nav-links">
            <Link to={`/site/${slug}`}>Home</Link>
            <Link to={`/site/${slug}/services`}>Services</Link>
            <Link to={`/site/${slug}/my-bookings`}>My Bookings</Link>
          </nav>
          
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            {salon.branches?.length > 0 && (
              <select 
                value={selectedBranchId} 
                onChange={e => setSelectedBranchId(e.target.value)}
                style={{ padding: "8px 15px", background: "transparent", border: "1px solid var(--gold)", color: "var(--gold)", borderRadius: "4px", outline: "none", cursor: "pointer" }}
              >
                <option value="" style={{ background: "#000" }}>All Branches</option>
                {salon.branches.map(b => (
                  <option key={b.id} value={b.id} style={{ background: "#000" }}>{b.name}</option>
                ))}
              </select>
            )}
            <button className="sf-btn-gold" onClick={() => setCartOpen(true)}>
              Cart ({bookings.length})
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <StorefrontErrorBoundary>
          <Outlet context={{ salon, bookings, addBooking, selectedBranchId }} />
        </StorefrontErrorBoundary>
      </main>

      {/* FOOTER */}
      <footer style={{ background: "#050505", padding: "80px 40px", borderTop: "1px solid #222" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "40px" }}>
          <div>
            <h3 style={{ color: "var(--gold)", fontSize: "24px", marginBottom: "20px" }}>{salon.name}</h3>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>Luxury grooming and beauty services tailored for perfection. Experience the difference today.</p>
          </div>
          <div>
            <h4 style={{ color: "#fff", marginBottom: "20px" }}>Contact</h4>
            <p style={{ color: "var(--text-muted)", marginBottom: "10px" }}>Email: {salon.email}</p>
            <p style={{ color: "var(--text-muted)", marginBottom: "10px" }}>Phone: {salon.phone}</p>
            <p style={{ color: "var(--text-muted)" }}>Address: {salon.address}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}