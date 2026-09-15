import { useState, useEffect, useCallback } from "react";
import { Outlet, Link, useParams, useLocation } from "react-router-dom";
import { api } from "../../api/client";
import "../../storefront.css";

const BOOKINGS_KEY = "sf_bookings";

function loadBookings() {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBookings(items) {
  try { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(items)); } catch {}
}

export default function StorefrontLayout() {
  const { slug } = useParams();
  const location = useLocation();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState(loadBookings);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { saveBookings(bookings); }, [bookings]);

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
        price: service.price,
        duration: service.duration,
        date,
        time,
        qty: 1,
      }];
    });
  }, []);

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
    if (!slug) return;
    api.get(`/public/salon/${slug}`)
      .then(res => {
        const fullSalon = { ...res.data.salon, websiteConfig: res.data.websiteConfig, uiSettings: res.data.uiSettings, footerContent: res.data.footerContent, ecommerceSettings: res.data.ecommerceSettings };
        setSalon(fullSalon);
        setLoading(false);
        const wc = res.data.websiteConfig || {};
        const ui = res.data.uiSettings || {};
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
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    api.post(`/public/salon/${slug}/track`, { path: location.pathname }).catch(() => {});
  }, [slug, location.pathname]);

  if (loading) return <div className="storefront-wrapper"><div className="sf-placeholder-img">Loading...</div></div>;
  if (!salon) return <div className="storefront-wrapper"><div className="sf-placeholder-img">Store Not Found</div></div>;

  return (
    <div className="storefront-wrapper">
      <header className="sf-header">
        <div className="sf-nav-container">
          <Link to={`/site/${salon.slug}`} className="sf-brand">
            {salon.logoUrl ? <img src={salon.logoUrl} alt={salon.name} /> : <div style={{ width: 40, height: 40, background: '#111', borderRadius: 8 }} />}
            {salon.name}
          </Link>

          <button className="sf-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
            <span className={`sf-hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
            <span className={`sf-hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
            <span className={`sf-hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
          </button>
          
          <nav className={`sf-nav-links ${mobileMenuOpen ? "sf-nav-open" : ""}`}>
            <Link to={`/site/${salon.slug}`} onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to={`/site/${salon.slug}/services`} onClick={() => setMobileMenuOpen(false)}>Our Services</Link>
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
      
      <main>
        <Outlet context={{ salon, bookings, addBooking, removeBooking, updateBookingQty, updateBookingTime, clearBookings, bookingCount }} />
      </main>
      
      <footer style={{ padding: '60px 20px', background: '#111', color: 'white', textAlign: 'center', marginTop: 'auto' }}>
        <p>&copy; {new Date().getFullYear()} {salon.name}. All rights reserved.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <Link to={`/site/${salon.slug}/terms`} style={{ color: "#cbd5e1" }}>Terms</Link>
          <Link to={`/site/${salon.slug}/privacy`} style={{ color: "#cbd5e1" }}>Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
