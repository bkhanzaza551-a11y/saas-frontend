import { useState, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { Scissors, Sparkles, Star, Clock, MapPin, Phone, ArrowRight, User } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
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
    document.title = `${salon?.name || "Premium Salon"} - Professional Services`;
    window.scrollTo(0, 0);
  }, [salon?.name]);

  const currency = salon?.currency || "INR";
  const wc = salon?.websiteConfig || {};

  // Section visibility: if sections config exists, respect enabled flags; otherwise show all
  const sectionsConfig = Array.isArray(wc.sections) && wc.sections.length > 0 ? wc.sections : null;
  const isSectionEnabled = (sectionId) => {
    if (!sectionsConfig) return true; // no config = show all
    const found = sectionsConfig.find(s => s.id === sectionId);
    return found ? found.enabled !== false : true; // default to visible
  };

  const galleryImages = Array.isArray(wc.galleryImages) && wc.galleryImages.length > 0
    ? wc.galleryImages
    : [
        "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=800&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
        "https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=600&q=80",
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80",
        "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&q=80"
      ];

  const testimonialsList = Array.isArray(wc.testimonials) && wc.testimonials.length > 0
    ? wc.testimonials
    : [
        { text: "Absolutely phenomenal service. The attention to detail is unmatched.", author: "Priya Sharma", rating: 5 },
        { text: "A truly premium experience from start to finish. Highly recommend!", author: "Rahul Verma", rating: 5 },
        { text: "I've never felt more pampered. Best salon I've ever visited!", author: "Anjali Patel", rating: 5 },
        { text: "Sophisticated, clean, and highly professional. Best styling in years.", author: "Vikram Singh", rating: 5 }
      ];

  return (
    <div className="storefront-wrapper">
      {/* Premium Hero Section */}
      {isSectionEnabled("hero") && (
      <section id="sf-hero-section" className="sf-hero" style={{ overflow: "hidden" }}>
        <div className="sf-hero-bg" style={{
          background: `url('${wc.heroImage || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80"}') center/cover no-repeat`,
        }}></div>
        <div className="sf-hero-content">
          <h1 className="animate-fade-up">{wc.heroTitle || "Experience True Elegance"}</h1>
          <p className="animate-fade-up animate-delay-1">{wc.heroSubtitle || "Redefining beauty and grooming. Step into a world of sophisticated care and let our expert stylists craft your perfect look with absolute precision."}</p>
          <div className="animate-fade-up animate-delay-2" style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
            <Link to={`/site/${salon?.slug}/services`} className="sf-btn-white">
              {wc.heroBtnText || "Book Appointment"}
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* The Premium Standard / Features - always shown */}
      <section id="sf-features-section" className="sf-section">
        <div className="sf-section-title">
          <h2>The Premium Standard</h2>
          <p>Why our clients consistently choose {salon?.name || "us"} for their grooming and wellness needs.</p>
        </div>
        <div className="sf-feature-grid">
          <div className="sf-feature-item">
            <div className="sf-feature-icon">
              <Scissors size={40} strokeWidth={1} />
            </div>
            <h3>Expert Stylists</h3>
            <p>Our team consists of industry-leading professionals dedicated to bringing your vision to life with precision and care.</p>
          </div>
          <div className="sf-feature-item">
            <div className="sf-feature-icon">
              <Sparkles size={40} strokeWidth={1} />
            </div>
            <h3>Premium Products</h3>
            <p>We exclusively utilize top-tier, globally recognized products to ensure the ultimate health of your hair and skin.</p>
          </div>
          <div className="sf-feature-item">
            <div className="sf-feature-icon">
              <Star size={40} strokeWidth={1} />
            </div>
            <h3>Modern Ambiance</h3>
            <p>Relax in our carefully designed minimalist lounge while receiving your personalized treatments and signature services.</p>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      {isSectionEnabled("services") && (
      <section id="sf-services-section" className="sf-section">
        <div className="sf-section-title">
          <h2>Featured Services</h2>
          <p>Discover our most popular treatments curated just for you.</p>
        </div>
        
        {services.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)", fontSize: "1.2rem", fontWeight: 300, border: "1px dashed var(--border)" }}>
            Our premium services menu is currently being updated. Please check back soon!
          </div>
        ) : (
          <>
            <div className="sf-services-grid">
              {services.map(service => (
                <div key={service.id} className="sf-service-card" onClick={() => navigate(`/site/${salon.slug}/service/${service.id}`)}>
                  {service.imageUrl ? (
                    <img src={service.imageUrl} alt={service.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginBottom: 24, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} onError={e => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  ) : null}
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface-alt)', border: '1px solid var(--border)', display: service.imageUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: 'var(--accent)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      <Sparkles size={24} strokeWidth={1.5} />
                    </div>
                  <h3 style={{ margin: '0 0 12px', fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 500 }}>{service.name}</h3>
                  <p className="sf-service-desc" style={{ flex: 1, margin: '0 0 24px', fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 300 }}>
                    {service.description || "A premium service tailored for your needs."}
                  </p>
                  <div className="sf-service-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                    <span className="sf-service-price" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--text-main)' }}>{currency} {service.salePrice || service.price}</span>
                    <span className="sf-service-btn" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      Details <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '80px' }}>
              <Link to={`/site/${salon.slug}/services`} className="sf-btn-primary">
                View All Services
              </Link>
            </div>
          </>
        )}
      </section>
      )}

      {/* About Section */}
      {isSectionEnabled("about") && (
      <section id="sf-about-section" className="sf-section-alt">
        <div className="sf-section-inner" style={{ display: 'flex', flexWrap: 'wrap', gap: '80px', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '320px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100%', height: '100%', border: '1px solid #111', zIndex: 0 }}></div>
            <img 
              src={wc.aboutImage || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1000&q=80"} 
              alt="Salon Interior" 
              style={{ width: '100%', position: 'relative', zIndex: 1, display: 'block', borderRadius: 4 }} 
            />
          </div>
          <div style={{ flex: 1, minWidth: '320px' }}>
            <h2 style={{ fontSize: "3rem", marginBottom: "30px", fontWeight: 500 }}>{wc.aboutTitle || "The Art of Grooming"}</h2>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.8", marginBottom: "40px", fontSize: "1.1rem", fontWeight: 300 }}>
              {wc.aboutDescription || `At ${salon?.name || "our salon"}, we approach self-care with precision and professionalism. Established with the vision of providing a sanctuary for relaxation and transformation, our salon offers a curated menu of premium services.`}
            </p>
            <Link to={`/site/${salon?.slug}/services`} className="sf-btn-outline">
              View Our Services
            </Link>
          </div>
        </div>
      </section>

      )}

      {/* Gallery Section */}
      {isSectionEnabled("gallery") && (
      <section id="sf-gallery-section" className="sf-section">
        <div className="sf-section-title">
          <h2>Signature Styles</h2>
          <p>A glimpse into our world of precision styling and premium care.</p>
        </div>
        <div className="sf-gallery-grid">
          {galleryImages.map((imgUrl, idx) => (
            <div key={idx} className={`sf-gallery-item ${idx === 0 ? "sf-gallery-main" : ""}`}>
              <img src={imgUrl} alt={`Gallery ${idx + 1}`} />
            </div>
          ))}
        </div>
      </section>

      )}

      {/* Testimonials Roller */}
      {isSectionEnabled("testimonials") && (
      <section id="sf-testimonials-section" className="sf-marquee-container" style={{ padding: '60px 0' }}>
        <div className="sf-section-title" style={{ marginBottom: 40 }}>
          <h2>What Our Clients Say</h2>
        </div>
        <div className="sf-marquee-track">
          {[1, 2].map(cycle => (
            <span key={cycle}>
              {testimonialsList.map((t, i) => (
                <div key={`${cycle}-${i}`} className="sf-testimonial-card" style={{ display: 'inline-flex', flexDirection: 'column', padding: '32px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface-alt)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
                      <User size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="sf-testimonial-author" style={{ margin: 0 }}>{t.author || "Valued Client"}</div>
                      <div style={{ color: '#fbbf24', fontSize: '1rem', marginTop: 4, display: 'flex', gap: 2 }}>
                        {[...Array(Number(t.rating || 5))].map((_, i) => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}
                      </div>
                    </div>
                  </div>
                  <div className="sf-testimonial-text" style={{ margin: 0, fontStyle: 'normal', color: 'var(--text-muted)' }}>"{t.text}"</div>
                </div>
              ))}
            </span>
          ))}
        </div>
      </section>

      )}

      {/* Contact Section */}
      {isSectionEnabled("contact") && (
      <section id="sf-contact-section" className="sf-section-alt" style={{ background: '#111111', color: '#ffffff' }}>
        <div className="sf-section-inner" style={{ display: 'flex', flexWrap: 'wrap', gap: '80px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h2 style={{ color: '#ffffff', fontSize: '2.5rem', marginBottom: '30px', fontWeight: 500 }}>Visit Us</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: '40px', fontWeight: 300, fontSize: '1.1rem' }}>
              Experience the difference at our premium salon. We are dedicated to providing you with the highest quality service in a relaxing environment.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', color: '#ffffff' }}>
                <MapPin size={24} style={{ color: 'rgba(255,255,255,0.5)', marginTop: '2px' }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 300 }}>{wc.contactAddress || salon?.address || "123 Elegance Avenue, Style District"}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#ffffff' }}>
                <Phone size={24} style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 300 }}>{wc.contactPhone || salon?.phone || "+1 (555) 123-4567"}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', color: '#ffffff' }}>
                <Clock size={24} style={{ color: 'rgba(255,255,255,0.5)', marginTop: '2px' }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 300, lineHeight: 1.6 }}>{wc.businessHours || "Mon - Sat: 10:00 AM - 08:00 PM | Sunday: 11:00 AM - 06:00 PM"}</span>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '300px', background: 'rgba(255,255,255,0.03)', padding: '50px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: '#ffffff', fontSize: '1.8rem', marginBottom: '20px', fontFamily: 'var(--font-serif)', fontWeight: 500 }}>Ready to transform your look?</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: '40px', fontWeight: 300 }}>
              Book your appointment today and let our expert stylists help you achieve your desired aesthetic.
            </p>
            <Link to={`/site/${salon?.slug}/services`} className="sf-btn-primary" style={{ display: 'flex', background: '#ffffff', color: '#111111', width: '100%', textAlign: 'center', border: 'none' }}>
              Book Now
            </Link>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}