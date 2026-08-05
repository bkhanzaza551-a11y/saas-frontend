import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&fit=crop";

export default function HomePage() {
  const { salon, selectedBranchId } = useOutletContext();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const config = salon?.websiteConfig || {};
  const sections = config.sections && config.sections.length > 0 ? config.sections : [
    { id: "hero", type: "hero", label: "Hero", enabled: true },
    { id: "services", type: "services", label: "Services", enabled: true },
    { id: "about", type: "about", label: "About", enabled: true },
    { id: "gallery", type: "gallery", label: "Gallery", enabled: true },
    { id: "testimonials", type: "testimonials", label: "Reviews", enabled: true }
  ];

  useEffect(() => {
    if (!salon?.slug) return;
    setLoading(true);
    api.get(`/public/salon/${salon.slug}/storefront-services`, { params: { branchId: selectedBranchId } })
      .then(res => setServices(res.data?.services || []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [salon?.slug, selectedBranchId]);

  useEffect(() => {
    document.title = `${salon.name} — Premium Salon Services`;
    window.scrollTo(0, 0);
  }, [salon.name]);

  const renderSection = (sec) => {
    if (!sec.enabled) return null;

    switch (sec.type) {
      case "hero":
        return (
          <section key={sec.id} className="sf-hero sf-animate">
            <div className="sf-hero-content">
              <h1 style={{ color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{config.heroTitle || salon.name}</h1>
              <p style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{config.heroSubtitle || "Discover premium salon services."}</p>
              <div className="sf-hero-actions">
                <Link to={`/site/${salon.slug}/services`} className="sf-btn-dark" style={{ background: "#fff", color: "#000" }}>Explore Services</Link>
              </div>
            </div>
            <div style={{
              position: "absolute", inset: 0, zIndex: 1,
              backgroundImage: `url(${config.heroImage || FALLBACK_IMG})`,
              backgroundSize: "cover", backgroundPosition: "center"
            }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))" }} />
            </div>
          </section>
        );

      case "services":
        return (
          <section key={sec.id} className="sf-section sf-animate">
            <div className="sf-section-title">
              <span>Our Selection</span>
              <h2>Signature Services</h2>
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: 100 }}>Loading exclusive services...</div>
            ) : services.length === 0 ? (
              <div style={{ textAlign: "center", padding: 100, color: "var(--sf-text-muted)" }}>No services currently available. Check back soon.</div>
            ) : (
              <div className="sf-services-grid">
                {services.slice(0, 6).map(service => (
                  <Link to={`/site/${salon.slug}/service/${service.id}`} key={service.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="sf-service-card">
                      <img src={service.imageUrl || FALLBACK_IMG} alt={service.name} className="sf-service-img" />
                      <div className="sf-service-content">
                        <h3>{service.name}</h3>
                        <p className="sf-service-desc">{service.description || "Experience the ultimate care with our professional staff."}</p>
                        <div className="sf-service-footer">
                          <span className="sf-service-duration">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            {service.durationMin} min
                          </span>
                          <span className="sf-service-price">{salon.currency} {Number(service.salePrice || service.price).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {services.length > 6 && (
              <div style={{ textAlign: "center", marginTop: 60 }}>
                <Link to={`/site/${salon.slug}/services`} className="sf-btn-outline">View All Services</Link>
              </div>
            )}
          </section>
        );

      case "about":
        const aboutText = config.aboutText || "Welcome to our premium salon. We are dedicated to providing you with the highest quality of service and care in a relaxing environment.";
        return (
          <section key={sec.id} className="sf-section" style={{ background: "var(--sf-surface)", textAlign: "center" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <div className="sf-section-title" style={{ marginBottom: 40 }}>
                <span>Our Story</span>
                <h2>About {salon.name}</h2>
              </div>
              <p style={{ fontSize: "1.2rem", color: "var(--sf-text-muted)", lineHeight: 1.8 }}>
                {aboutText}
              </p>
            </div>
          </section>
        );

      case "gallery":
        const gallery = config.gallery && config.gallery.length > 0 ? config.gallery : [
          "https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?w=400&h=300&fit=crop",
          "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop",
          "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop"
        ];
        return (
          <section key={sec.id} className="sf-section">
            <div className="sf-section-title">
              <span>Portfolio</span>
              <h2>Our Work</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
              {gallery.map((img, i) => (
                <div key={i} style={{ borderRadius: "var(--sf-radius-md)", overflow: "hidden", height: 250 }}>
                  <img src={img} alt={`Gallery ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "var(--sf-transition)" }} className="sf-service-img" />
                </div>
              ))}
            </div>
          </section>
        );

      case "testimonials":
        const testimonials = config.testimonials && config.testimonials.length > 0 ? config.testimonials : [
          { text: "Absolutely wonderful experience. The staff was professional and the service was top-notch.", author: "Sarah M.", rating: 5 },
          { text: "I've never felt more pampered. I highly recommend this salon to anyone looking for premium care.", author: "Jessica T.", rating: 5 },
          { text: "A truly luxurious experience from start to finish. I'll definitely be coming back.", author: "Emily R.", rating: 5 }
        ];
        return (
          <section key={sec.id} className="sf-section" style={{ background: "var(--sf-surface)" }}>
            <div className="sf-section-title">
              <span>Client Reviews</span>
              <h2>What Our Clients Say</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              {testimonials.map((t, i) => (
                <div key={i} style={{ background: "#fff", padding: 32, borderRadius: "var(--sf-radius-md)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                  <div style={{ color: "var(--sf-text-main)", marginBottom: 16 }}>
                    {Array.from({ length: t.rating || 5 }).map((_, j) => (
                      <span key={j}>★</span>
                    ))}
                  </div>
                  <p style={{ fontSize: "1.1rem", fontStyle: "italic", marginBottom: 24, lineHeight: 1.6 }}>"{t.text}"</p>
                  <h4 style={{ fontSize: "1.1rem" }}>{t.author}</h4>
                </div>
              ))}
            </div>
          </section>
        );

      case "contact":
      case "hours":
      case "social":
      case "banner":
      case "cta":
        return (
          <section key={sec.id} className="sf-section" style={{ background: sec.type === 'cta' ? "var(--sf-text-main)" : "transparent", color: sec.type === 'cta' ? "#fff" : "inherit" }}>
            <div className="sf-section-title">
              <h2 style={{ color: sec.type === 'cta' ? "#fff" : "inherit" }}>{sec.label}</h2>
            </div>
            <div style={{ textAlign: "center", color: sec.type === 'cta' ? "rgba(255,255,255,0.8)" : "var(--sf-text-muted)" }}>
              {sec.type === "contact" ? (
                 <p>{salon.email}<br/>{salon.phone}<br/>{salon.address}</p>
              ) : sec.type === "cta" ? (
                 <div>
                   <p style={{ marginBottom: 32 }}>Book your premium experience today.</p>
                   <Link to={`/site/${salon.slug}/services`} className="sf-btn-outline" style={{ borderColor: "#fff", color: "#fff" }}>Book Appointment</Link>
                 </div>
              ) : (
                 <p>Information coming soon.</p>
              )}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {sections.map(sec => renderSection(sec))}
    </>
  );
}
