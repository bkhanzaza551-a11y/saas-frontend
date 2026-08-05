import { useState, useEffect, useCallback } from "react";
import { Outlet, Link, useParams, useLocation } from "react-router-dom";
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
    const BOOKING_TTL = 7 * 24 * 60 * 60 * 1000;
    return items.filter(b => !b.createdAt || (now - b.createdAt) < BOOKING_TTL);
  } catch { return []; }
}

function saveBookings(items) {
  try { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(items)); } catch {}
}

function loadBranch() {
  try { return localStorage.getItem(BRANCH_KEY) || ""; } catch { return ""; }
}

function saveBranch(id) {
  try { localStorage.setItem(BRANCH_KEY, id); } catch {}
}

export default function StorefrontLayout() {
  const { slug } = useParams();
  const location = useLocation();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState(loadBookings);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(loadBranch);

  useEffect(() => { saveBookings(bookings); }, [bookings]);
  useEffect(() => { saveBranch(selectedBranchId); }, [selectedBranchId]);

  const handleBranchChange = useCallback((e) => {
    const newBranchId = e.target.value;
    setSelectedBranchId(newBranchId);
    setBookings(prev => {
      const filtered = prev.filter(b => b.branchId === newBranchId);
      if (filtered.length < prev.length) {
        return filtered;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  const addBooking = useCallback((service, date, time) => {
    setBookings(prev => {
      const existing = prev.find(
        b => b.serviceId === service.id && b.date === date && b.time === time
      );
      if (existing) {
        return prev.map(b =>
          b.serviceId === service.id && b.date === date && b.time === time
            ? { ...b, qty: b.qty + 1 }
            : b
        );
      }
      return [...prev, {
        serviceId: service.id,
        name: service.name,
        price: service.salePrice && Number(service.salePrice) > 0 ? Number(service.salePrice) : Number(service.price),
        duration: service.durationMin,
        imageUrl: service.imageUrl || "",
        date,
        time,
        qty: 1,
        branchId: selectedBranchId || "",
        staffId: service.staffId || "",
        staffName: service.staffName || "",
        createdAt: Date.now(),
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
  }, []);

  const bookingCount = bookings.reduce((sum, b) => sum + b.qty, 0);

  useEffect(() => {
    const root = document.documentElement;
    const savedProps = {};
    ["--sf-primary", "--sf-accent", "--sf-secondary", "--sf-text", "--button-bg", "--button-bg-hover", "--sidebar-bg", "--navbar-bg", "--font-color"].forEach(p => {
      savedProps[p] = root.style.getPropertyValue(p);
    });
    return () => {
      Object.entries(savedProps).forEach(([p, v]) => {
        if (v) root.style.setProperty(p, v);
        else root.style.removeProperty(p);
      });
    };
  }, []);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      api.get(`/public/salon/${slug}`),
      api.get(`/public/salon/${slug}/storefront-services`)
    ]).then(([salonRes, servicesRes]) => {
      const fullSalon = { ...salonRes.data.salon, websiteConfig: salonRes.data.websiteConfig, uiSettings: salonRes.data.uiSettings, footerContent: salonRes.data.footerContent, ecommerceSettings: salonRes.data.ecommerceSettings };
      setSalon(fullSalon);
      setBranches(servicesRes.data.branches || []);
      const validBranches = servicesRes.data.branches || [];
      if (selectedBranchId && validBranches.some(b => b.id === selectedBranchId)) {
        // stored branch is valid, keep it
      } else if (validBranches.length > 0) {
        setSelectedBranchId(validBranches[0].id);
      } else {
        setSelectedBranchId("");
      }
      setLoading(false);
      const wc = salonRes.data.websiteConfig || {};
      const ui = salonRes.data.uiSettings || {};
      const root = document.documentElement;
      const primaryColor = wc.primaryColor || ui.buttonColor || "#c8a97e";
      const secondaryColor = wc.secondaryColor || "#111111";
      root.style.setProperty("--sf-primary", secondaryColor);
      root.style.setProperty("--sf-accent", primaryColor);
      root.style.setProperty("--sf-secondary", secondaryColor);
      root.style.setProperty("--sf-text", secondaryColor);
      if (ui.buttonColor) root.style.setProperty("--button-bg", ui.buttonColor);
      if (ui.buttonHoverColor) root.style.setProperty("--button-bg-hover", ui.buttonHoverColor);
      if (ui.sidebarColor) root.style.setProperty("--sidebar-bg", ui.sidebarColor);
      if (ui.navbarColor) root.style.setProperty("--navbar-bg", ui.navbarColor);
      if (ui.fontColor) root.style.setProperty("--font-color", ui.fontColor);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    api.post(`/public/salon/${slug}/track`, { path: location.pathname }).catch(() => {});
  }, [slug, location.pathname]);

  if (loading) return (
    <div className="storefront-wrapper">
      <header className="sf-header" style={{ minHeight: 70 }}>
        <div className="sf-nav-container">
          <div className="sf-skeleton" style={{ width: 120, height: 32 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="sf-skeleton" style={{ width: 80, height: 32 }} />
            <div className="sf-skeleton" style={{ width: 80, height: 32 }} />
          </div>
        </div>
      </header>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '40px 20px' }}>
        <div className="sf-skeleton sf-skeleton-title" style={{ width: '30%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, marginTop: 24 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
              <div className="sf-skeleton sf-skeleton-img" />
              <div style={{ padding: 16 }}>
                <div className="sf-skeleton sf-skeleton-text" style={{ width: '70%' }} />
                <div className="sf-skeleton sf-skeleton-text-sm" />
                <div className="sf-skeleton sf-skeleton-text-sm" style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (!salon) return <div className="storefront-wrapper"><div className="sf-placeholder-img">Store Not Found</div></div>;

  return (
    <div className="storefront-wrapper">
      <a href="#sf-main-content" className="sr-only" style={{ position: "absolute", top: -40, left: 0, background: "var(--sf-accent)", color: "#fff", padding: "8px 16px", zIndex: 10000 }}>Skip to content</a>
      <header className="sf-header" role="banner">
        <div className="sf-nav-container">
          <Link to={`/site/${salon.slug}`} className="sf-brand">
            {salon.logoUrl ? <img src={salon.logoUrl} alt={salon.name} /> : <div style={{ width: 40, height: 40, background: '#111', borderRadius: 8 }} />}
            {salon.name}
          </Link>

          {branches.length > 1 && (
            <div className="sf-branch-selector" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <select
                value={selectedBranchId}
                onChange={handleBranchChange}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id} style={{ color: '#111', background: '#fff' }}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <button className="sf-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu" aria-expanded={mobileMenuOpen}>
            <span className={`sf-hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
            <span className={`sf-hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
            <span className={`sf-hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
          </button>
          
          <nav aria-label="Main navigation" className={`sf-nav-links ${mobileMenuOpen ? "sf-nav-open" : ""}`}>
            <Link to={`/site/${salon.slug}`} onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to={`/site/${salon.slug}/services`} onClick={() => setMobileMenuOpen(false)}>Our Services</Link>
            <Link to={`/site/${salon.slug}/my-bookings`} onClick={() => setMobileMenuOpen(false)}>My Bookings</Link>
            <Link to={`/site/${salon.slug}/booking-summary`} onClick={() => setMobileMenuOpen(false)}>
              Booking Summary {bookingCount > 0 ? `(${bookingCount})` : ""}
            </Link>
            <Link to={`/site/${salon.slug}/about`} onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            <Link to={`/site/${salon.slug}/contact`} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          </nav>
          
          <div className="sf-header-actions">
            <Link to={`/site/${salon.slug}/my-bookings`} className="sf-btn sf-btn-secondary" style={{ fontSize: '0.85rem' }}>
              My Bookings
            </Link>
            <Link to={`/site/${salon.slug}/booking-summary`} className="sf-btn sf-btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Booking Summary ({bookingCount})
            </Link>
            <Link to={`/site/${salon.slug}/book`} className="sf-btn sf-btn-primary">
              Book Appointment
            </Link>
          </div>
        </div>
      </header>
      
      <main id="sf-main-content" role="main">
        <StorefrontErrorBoundary slug={salon.slug}>
          <Outlet context={{ salon, bookings, addBooking, removeBooking, updateBookingQty, updateBookingTime, clearBookings, bookingCount, branches, selectedBranchId, setSelectedBranchId }} />
        </StorefrontErrorBoundary>
      </main>
      
      <footer role="contentinfo" style={{ padding: '60px 20px', background: '#111', color: 'white', textAlign: 'center', marginTop: 'auto' }}>
        <p>&copy; {new Date().getFullYear()} {salon.name}. All rights reserved.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <Link to={`/site/${salon.slug}/terms`} style={{ color: "#cbd5e1" }}>Terms</Link>
          <Link to={`/site/${salon.slug}/privacy`} style={{ color: "#cbd5e1" }}>Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
