import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

export default function HomePage() {
  const { salon, selectedBranchId } = useOutletContext();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="storefront-wrapper">
      <section className="sf-hero">
        <div className="sf-hero-bg"></div>
        <div className="sf-hero-content">
          <h1>Experience True Elegance</h1>
          <p>Redefining beauty and grooming. Step into a world of sophisticated care and let our expert stylists craft your perfect look.</p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <Link to={`/site/${salon.slug}/services`} className="sf-btn-primary">Book Appointment</Link>
          </div>
        </div>
      </section>

      <section className="sf-section">
        <div className="sf-section-title">
          <h2>The Premium Standard</h2>
          <p>Why our clients consistently choose us for their grooming and wellness needs.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
          <div style={{ padding: 40, background: 'var(--surface)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 20 }}>✨</div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: 12, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Expert Stylists</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Our team consists of industry-leading professionals dedicated to bringing your vision to life.</p>
          </div>
          <div style={{ padding: 40, background: 'var(--surface)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 20 }}>🌿</div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: 12, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Premium Products</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>We exclusively utilize top-tier, globally recognized products to ensure the health of your hair and skin.</p>
          </div>
          <div style={{ padding: 40, background: 'var(--surface)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 20 }}>🤍</div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: 12, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Modern Ambiance</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Relax in our carefully designed minimalist lounge while receiving your personalized treatments.</p>
          </div>
        </div>
      </section>

      <section className="sf-section" style={{ background: 'var(--surface)', maxWidth: '100%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 60, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1000&q=80" alt="Salon Interior" style={{ width: '100%', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 300 }}>
            <h2 style={{ fontSize: "2.5rem", marginBottom: "24px", letterSpacing: '-0.5px' }}>The Art of Grooming</h2>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.8", marginBottom: "32px", fontSize: "1.1rem" }}>
              At {salon.name}, we approach self-care with precision and professionalism. Established with the vision of providing a sanctuary for relaxation and transformation, our salon offers a curated menu of premium services. From precision haircuts to advanced skincare regimens, every detail is meticulously tailored to your requirements.
            </p>
            <Link to={`/site/${salon.slug}/services`} className="sf-btn-outline">View Our Services</Link>
          </div>
        </div>
      </section>

      {services.length > 0 && (
        <section className="sf-section">
          <div className="sf-section-title">
            <h2>Featured Services</h2>
            <p>Discover our most popular treatments</p>
          </div>
          <div className="sf-services-grid">
            {services.slice(0, 6).map(service => (
              <div key={service.id} className="sf-service-card">
                <img src={service.imageUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80"} alt={service.name} className="sf-service-img" />
                <div className="sf-service-content">
                  <h3>{service.name}</h3>
                  <p className="sf-service-desc">{service.description || "A premium service tailored for your needs."}</p>
                  <div className="sf-service-footer">
                    <span className="sf-service-price">{salon.currency || "INR"} {service.salePrice || service.price}</span>
                    <Link to={`/site/${salon.slug}/service/${service.id}`} className="sf-btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Details</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <Link to={`/site/${salon.slug}/services`} className="sf-btn-outline" style={{ padding: '16px 40px', fontSize: '1.05rem' }}>View All Services</Link>
          </div>
        </section>
      )}
    </div>
  );
}