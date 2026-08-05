import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&fit=crop";

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
              <h1>{config.heroTitle || salon.name}</h1>
              <p>{config.heroSubtitle || "Elevate your style with our premium salon experience."}</p>
              <div className="sf-hero-actions">
                <Link to={`/site/${salon.slug}/services`} className="sf-btn-outline">Explore Services</Link>
              </div>
            </div>
            
            <div style={{ position: "absolute", inset: 0, zIndex: 1, overflow: "hidden" }}>
              <video 
                autoPlay loop muted playsInline preload="auto"
                poster={config.heroImage || FALLBACK_IMG}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              >
                <source src="https://cdn.pixabay.com/video/2020/05/26/40141-424888200_large.mp4" type="video/mp4" />
              </video>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8))" }} />
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
                  <Link to={`/site/${salon.slug}/service/${service.id}`} key={service.id}>
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
              <div style={{ textAlign: "center", marginTop: 80 }}>
                <Link to={`/site/${salon.slug}/services`} className="sf-btn-dark">View All Services</Link>
              </div>
            )}
          </section>
        );

      case "about":
        const aboutText = config.aboutText || "Welcome to our premium salon. We are dedicated to providing you with the highest quality of service and care in a relaxing environment.";
        return (
          <section key={sec.id} className="sf-section" style={{ background: "var(--sf-surface)", textAlign: "center", borderRadius: "var(--sf-radius-lg)", margin: "0 20px" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <div className="sf-section-title" style={{ marginBottom: 40 }}>
                <span>Our Story</span>
                <h2>About {salon.name}</h2>
              </div>
              <p style={{ fontSize: "1.25rem", color: "var(--sf-text-muted)", lineHeight: 1.8 }}>
                {aboutText}
              </p>
            </div>
          </section>
        );

      case "gallery":
        const gallery = config.gallery && config.gallery.length > 0 ? config.gallery : [
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&fit=crop",
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&fit=crop",
          "https://images.unsplash.com/photo-1516975080661-46b080516bdc?w=800&fit=crop"
        ];
        return (
          <section key={sec.id} className="sf-section">
            <div className="sf-section-title">
              <span>Portfolio</span>
              <h2>Our Work</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              {gallery.map((img, i) => (
                <div key={i} style={{ borderRadius: "var(--sf-radius-md)", overflow: "hidden", height: 350 }}>
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
          <section key={sec.id} className="sf-section" style={{ background: "var(--sf-bg)" }}>
            <div className="sf-section-title">
              <span>Client Reviews</span>
              <h2>What Our Clients Say</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32 }}>
              {testimonials.map((t, i) => (
                <div key={i} style={{ background: "#fff", padding: 40, borderRadius: "var(--sf-radius-lg)", boxShadow: "var(--sf-shadow-sm)" }}>
                  <div style={{ color: "var(--sf-luxury-gold)", marginBottom: 20, fontSize: "1.2rem" }}>
                    {Array.from({ length: t.rating || 5 }).map((_, j) => (
                      <span key={j}>★</span>
                    ))}
                  </div>
                  <p style={{ fontSize: "1.1rem", fontStyle: "italic", marginBottom: 24, lineHeight: 1.7, color: "var(--sf-text-muted)" }}>"{t.text}"</p>
                  <h4 style={{ fontSize: "1.2rem" }}>{t.author}</h4>
                </div>
              ))}
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