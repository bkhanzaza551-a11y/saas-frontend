import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

export default function HomePage() {
  const { salon } = useOutletContext();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const config = salon?.websiteConfig || {
    heroTitle: "Elevate Your Beauty Experience",
    heroSubtitle: "Discover premium salon services curated just for you.",
    heroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&fit=crop"
  };

  useEffect(() => {
    if (!salon?.slug) return;
    api.get(`/public/salon/${salon.slug}/storefront-services`)
      .then(res => setServices(res.data?.services || []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [salon?.slug]);

  useEffect(() => {
    document.title = `${salon.name} — Premium Salon Services`;
    window.scrollTo(0, 0);
  }, [salon.name]);

  return (
    <>
      <section className="sf-hero sf-animate">
        <div className="sf-hero-content">
          <h1>{config.heroTitle || salon.name}</h1>
          <p>{config.heroSubtitle || "Discover premium salon services."}</p>
          <div className="sf-hero-actions">
            <Link to={`/site/${salon.slug}/services`} className="sf-btn-dark">Explore Services</Link>
          </div>
        </div>
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          backgroundImage: `url(${config.heroImage})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.15, filter: "grayscale(50%)"
        }} />
      </section>

      <section className="sf-section sf-animate" style={{ animationDelay: "0.2s" }}>
        <div className="sf-section-title">
          <span>Our Selection</span>
          <h2>Signature Services</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 100 }}>Loading exclusive services...</div>
        ) : services.length === 0 ? (
          <div style={{ textAlign: "center", padding: 100, color: "var(--sf-text-muted)" }}>
            No services currently available. Check back soon.
          </div>
        ) : (
          <div className="sf-services-grid">
            {services.slice(0, 6).map(service => (
              <Link to={`/site/${salon.slug}/service/${service.id}`} key={service.id} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="sf-service-card">
                  <img src={service.imageUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&fit=crop"} alt={service.name} className="sf-service-img" />
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
    </>
  );
}
