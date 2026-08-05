import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

export default function HomePage() {
  const { salon, selectedBranchId } = useOutletContext();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const sections = [
    { id: "hero", type: "hero" },
    { id: "features", type: "features" },
    { id: "about", type: "about" },
    { id: "services", type: "services" },
    { id: "team", type: "team" }
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
    document.title = `${salon?.name || "Premium Salon"} — Professional Services`;
    window.scrollTo(0, 0);
  }, [salon?.name]);

  const renderSection = (sec) => {
    switch (sec.type) {
      case "hero":
        return (
          <section key={sec.id} className="sf-hero">
            <video className="sf-hero-video" autoPlay loop muted playsInline>
              <source src="https://cdn.pixabay.com/video/2021/11/26/99351-651586567_large.mp4" type="video/mp4" />
            </video>
            <div className="sf-hero-overlay"></div>
            
            <div className="sf-hero-content">
              <h1>Experience True Elegance</h1>
              <p>Redefining beauty and grooming. Step into a world of sophisticated care and let our expert stylists craft your perfect look.</p>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
                <Link to={`/site/${salon.slug}/services`} className="sf-btn-dark">Book Appointment</Link>
                <a href="#about" className="sf-btn-outline">Discover More</a>
              </div>
            </div>
          </section>
        );

      case "features":
        return (
          <section key={sec.id} className="sf-section sf-section-surface">
            <div className="sf-section-title">
              <span>Why Choose Us</span>
              <h2>The Premium Standard</h2>
            </div>
            <div className="sf-features">
              <div className="sf-feature-card">
                <div className="sf-feature-icon">✨</div>
                <h3>Expert Stylists</h3>
                <p>Our team consists of industry-leading professionals dedicated to bringing your vision to life.</p>
              </div>
              <div className="sf-feature-card">
                <div className="sf-feature-icon">🌿</div>
                <h3>Premium Products</h3>
                <p>We exclusively utilize top-tier, globally recognized products to ensure the health of your hair and skin.</p>
              </div>
              <div className="sf-feature-card">
                <div className="sf-feature-icon">🤍</div>
                <h3>Modern Ambiance</h3>
                <p>Relax in our carefully designed minimalist lounge while receiving your personalized treatments.</p>
              </div>
            </div>
          </section>
        );

      case "about":
        return (
          <section key={sec.id} id="about" className="sf-section sf-split-section">
            <div className="sf-split-img">
              <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1000&q=80" alt="Salon Interior" />
            </div>
            <div className="sf-split-text">
              <h2 style={{ fontSize: "2.5rem", marginBottom: "20px" }}>The Art of Grooming</h2>
              <p style={{ color: "var(--text-muted)", lineHeight: "1.8", marginBottom: "32px", fontSize: "1.05rem" }}>
                At {salon.name}, we approach self-care with precision and professionalism. Established with the vision of providing a sanctuary for relaxation and transformation, our salon offers a curated menu of premium services. From precision haircuts to advanced skincare regimens, every detail is meticulously tailored to your requirements.
              </p>
              <Link to={`/site/${salon.slug}/services`} className="sf-btn-dark">View Our Services</Link>
            </div>
          </section>
        );

      case "services":
        return (
          <section key={sec.id} className="sf-section sf-section-surface">
            <div className="sf-section-title">
              <span>Our Menu</span>
              <h2>Signature Services</h2>
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>Loading professional services...</div>
            ) : (
              <div className="sf-services-grid">
                {services.slice(0, 6).map(service => (
                  <Link to={`/site/${salon.slug}/service/${service.id}`} key={service.id}>
                    <div className="sf-service-card">
                      <img src={service.imageUrl || "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800"} alt={service.name} className="sf-service-img" />
                      <div className="sf-service-content">
                        <h3>{service.name}</h3>
                        <p className="sf-service-desc">{service.description || "Indulge in our premium signature treatment tailored precisely to your needs."}</p>
                        <div className="sf-service-footer">
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "500" }}>{service.durationMin} MINS</span>
                          <span className="sf-service-price">{salon.currency} {Number(service.salePrice || service.price).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div style={{ textAlign: "center", marginTop: "48px" }}>
              <Link to={`/site/${salon.slug}/services`} className="sf-btn-outline">Explore All Services</Link>
            </div>
          </section>
        );

      case "team":
        return (
          <section key={sec.id} className="sf-section">
            <div className="sf-section-title">
              <span>Meet The Experts</span>
              <h2>Our Professionals</h2>
            </div>
            <div className="sf-team-grid">
              <div className="sf-team-card">
                <img src="https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?w=600" alt="Stylist" />
                <h4>Elena Roberts</h4>
                <p>Senior Hair Director</p>
              </div>
              <div className="sf-team-card">
                <img src="https://images.unsplash.com/photo-1616858557342-6323cf13be87?w=600" alt="Stylist" />
                <h4>Michael Chang</h4>
                <p>Master Barber</p>
              </div>
              <div className="sf-team-card">
                <img src="https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600" alt="Stylist" />
                <h4>Sarah Jenkins</h4>
                <p>Color Specialist</p>
              </div>
            </div>
          </section>
        );

      default: return null;
    }
  };

  return <>{sections.map(sec => renderSection(sec))}</>;
}