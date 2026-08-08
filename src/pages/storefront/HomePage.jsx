import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { Scissors, Sparkles, Star, Clock, MapPin, Phone, ArrowRight } from "lucide-react";

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
    document.title = `${salon?.name || "Premium Salon"} - Professional Services`;
    window.scrollTo(0, 0);
  }, [salon?.name]);

  const currency = salon?.currency || "INR";

  return (
    <div className="storefront-wrapper">
      {/* Premium Hero Section */}
      <section className="sf-hero" style={{
        background: `url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80') center/cover no-repeat`,
      }}>
        <div className="sf-hero-content">
          <h1>Experience True Elegance</h1>
          <p>Redefining beauty and grooming. Step into a world of sophisticated care and let our expert stylists craft your perfect look with absolute precision.</p>
          <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
            <Link to={`/site/${salon.slug}/services`} className="sf-btn-white">
              Book Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* The Premium Standard / Features */}
      <section className="sf-section">
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

      {/* About Section */}
      <section className="sf-section-alt">
        <div className="sf-section-inner" style={{ display: 'flex', flexWrap: 'wrap', gap: '80px', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '320px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100%', height: '100%', border: '1px solid var(--accent)', zIndex: 0 }}></div>
            <img 
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1000&q=80" 
              alt="Salon Interior" 
              style={{ width: '100%', position: 'relative', zIndex: 1, display: 'block' }} 
            />
          </div>
          <div style={{ flex: 1, minWidth: '320px' }}>
            <h2 style={{ fontSize: "3rem", marginBottom: "30px", fontWeight: 500 }}>The Art of Grooming</h2>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.8", marginBottom: "40px", fontSize: "1.1rem", fontWeight: 300 }}>
              At {salon?.name || "our salon"}, we approach self-care with precision and professionalism. Established with the vision of providing a sanctuary for relaxation and transformation, our salon offers a curated menu of premium services. From precision haircuts to advanced skincare regimens, every detail is meticulously tailored to your requirements.
            </p>
            <Link to={`/site/${salon.slug}/services`} className="sf-btn-outline">
              View Our Services
            </Link>
          </div>
        </div>
      </section>



      {/* Featured Services */}
      <section className="sf-section">
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
                <div key={service.id} className="sf-service-card" onClick={() => window.location.href = `/site/${salon.slug}/service/${service.id}`}>
                  <div className="sf-service-img-wrapper">
                    <img src={service.imageUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80"} alt={service.name} className="sf-service-img" />
                  </div>
                  <div className="sf-service-content">
                    <h3>{service.name}</h3>
                    <p className="sf-service-desc">{service.description || "A premium service tailored for your needs."}</p>
                    <div className="sf-service-footer">
                      <span className="sf-service-price">{currency} {service.salePrice || service.price}</span>
                      <span className="sf-service-btn">Details <ArrowRight size={16} /></span>
                    </div>
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

      {/* Testimonials Roller */}
      <section className="sf-marquee-container" style={{ padding: '60px 0' }}>
        <div className="sf-section-title" style={{ marginBottom: 40 }}>
          <h2>What Our Clients Say</h2>
        </div>
        <div className="sf-marquee-track">
          {[1, 2].map(cycle => (
            <span key={cycle}>
              {[
                { text: "Absolutely phenomenal service. The attention to detail is unmatched. ✨", author: "Sarah Jenkins", dp: "SJ" },
                { text: "A truly premium experience from start to finish. Highly recommend! 🌟", author: "Michael Chang", dp: "MC" },
                { text: "I've never felt more pampered. Best salon I've ever visited! 💖", author: "Elena Rodriguez", dp: "ER" },
                { text: "Sophisticated, clean, and highly professional. Best styling in years. 💇‍♀️", author: "David Smith", dp: "DS" },
                { text: "Their facial treatments are absolutely divine. My skin is glowing! 🧖‍♀️", author: "Jessica Lee", dp: "JL" },
                { text: "Incredible staff and such a relaxing atmosphere. A perfect 10/10. 🏆", author: "Robert Wilson", dp: "RW" },
                { text: "I always leave feeling like a million bucks. They never disappoint! 💅", author: "Amanda Brown", dp: "AB" },
                { text: "The premium products they use make such a huge difference. Love it! 💫", author: "Christopher Davis", dp: "CD" },
                { text: "Professional, punctual, and extremely talented stylists. ✂️", author: "Olivia Miller", dp: "OM" },
                { text: "My go-to place for self-care. The ambiance is just perfect. 🧘‍♀️", author: "William Taylor", dp: "WT" },
                { text: "They completely transformed my look. I've gotten so many compliments! 😍", author: "Sophia Anderson", dp: "SA" },
                { text: "Every visit is a luxurious escape from reality. Highly recommended. 👑", author: "Daniel Thomas", dp: "DT" },
                { text: "The attention to detail here is second to none. Amazing service. 💯", author: "Isabella Martinez", dp: "IM" },
                { text: "Top-notch facilities and incredibly skilled professionals. 🌟", author: "James Jackson", dp: "JJ" },
                { text: "I wouldn't trust anyone else with my hair. Simply the best. ❤️", author: "Mia White", dp: "MW" }
              ].map((t, i) => (
                <div key={`${cycle}-${i}`} className="sf-testimonial-card" style={{ display: 'inline-flex', flexDirection: 'column', padding: '32px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.2rem', flexShrink: 0 }}>
                      {t.dp}
                    </div>
                    <div>
                      <div className="sf-testimonial-author" style={{ margin: 0 }}>{t.author}</div>
                      <div style={{ color: '#fbbf24', fontSize: '1rem', marginTop: 4 }}>★★★★★</div>
                    </div>
                  </div>
                  <div className="sf-testimonial-text" style={{ margin: 0, fontStyle: 'normal', color: 'var(--text-muted)' }}>"{t.text}"</div>
                </div>
              ))}
            </span>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="sf-section-alt" style={{ background: '#111111', color: '#ffffff' }}>
        <div className="sf-section-inner" style={{ display: 'flex', flexWrap: 'wrap', gap: '80px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h2 style={{ color: '#ffffff', fontSize: '2.5rem', marginBottom: '30px', fontWeight: 500 }}>Visit Us</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: '40px', fontWeight: 300, fontSize: '1.1rem' }}>
              Experience the difference at our premium salon. We are dedicated to providing you with the highest quality service in a relaxing environment.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', color: '#ffffff' }}>
                <MapPin size={24} style={{ color: 'rgba(255,255,255,0.5)', marginTop: '2px' }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 300 }}>{salon?.address || "123 Elegance Avenue, Style District"}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#ffffff' }}>
                <Phone size={24} style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 300 }}>{salon?.phone || "+1 (555) 123-4567"}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', color: '#ffffff' }}>
                <Clock size={24} style={{ color: 'rgba(255,255,255,0.5)', marginTop: '2px' }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 300, lineHeight: 1.6 }}>Mon - Fri: 9:00 AM - 8:00 PM<br/>Sat - Sun: 10:00 AM - 6:00 PM</span>
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
    </div>
  );
}