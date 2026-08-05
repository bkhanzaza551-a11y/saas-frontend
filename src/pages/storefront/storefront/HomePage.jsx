import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

const FALLBACK_SERVICE_IMG = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&fit=crop";

function formatDuration(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

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

  const currency = salon.currency || "INR";

  return (
    <>
      {/* Hero */}
      <section className="sf-hero">
        <div className="sf-hero-content">
          <h1>{config.heroTitle || salon.name}</h1>
          <p>{config.heroSubtitle || "Discover premium salon services."}</p>
          <div className="sf-hero-buttons">
            <Link to={`/site/${salon.slug}/collections`} className="sf-btn sf-btn-primary">Our Services</Link>
            <Link to={`/site/${salon.slug}/book`} className="sf-btn sf-btn-secondary">Book Appointment</Link>
          </div>
        </div>
        <div className="sf-hero-visual">
          {config.heroImage ? (
            <img src={config.heroImage} alt={salon.name} />
          ) : (
            <div className="sf-placeholder-img">Image</div>
          )}
        </div>
      </section>

      {/* Services */}
      <section className="sf-section">
        <div className="sf-section-header">
          <span style={{ color: "var(--sf-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.8rem" }}>What We Offer</span>
          <h2>Our Services</h2>
          <p>Explore our full range of professional services</p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>Loading services...</div>
        ) : services.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>
            <p>No services available yet. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="sf-grid">
              {services.map(service => {
                const price = Number(service.salePrice && Number(service.salePrice) < Number(service.price) ? service.salePrice : service.price);
                const originalPrice = Number(service.price);
                const hasSale = service.salePrice && Number(service.salePrice) < originalPrice;
                const staff = service.staffAssignments?.map(sa => sa.user).filter(Boolean) || [];

                return (
                  <div key={service.id} className="sf-service-card">
                    <div className="sf-service-media">
                      <img src={service.imageUrl || FALLBACK_SERVICE_IMG} alt={service.name} />
                      {hasSale && (
                        <div className="sf-product-badge" style={{ background: "#ef4444" }}>
                          {Math.round((1 - Number(service.salePrice) / originalPrice) * 100)}% OFF
                        </div>
                      )}
                    </div>
                    <div className="sf-service-info">
                      <div className="sf-service-header">
                        <h3 className="sf-service-title">{service.name}</h3>
                        {service.durationMin && (
                          <span className="sf-service-duration">{formatDuration(service.durationMin)}</span>
                        )}
                      </div>
                      {service.description && (
                        <p className="sf-service-desc">
                          {service.description.length > 100
                            ? service.description.slice(0, 100) + "…"
                            : service.description}
                        </p>
                      )}
                      <div className="sf-service-footer">
                        <div className="sf-service-price-row">
                          <span className="sf-service-price">{currency} {price.toFixed(2)}</span>
                          {hasSale && (
                            <span className="sf-service-original-price">{currency} {originalPrice.toFixed(2)}</span>
                          )}
                        </div>
                        {staff.length > 0 && (
                          <div className="sf-service-staff">
                            <div className="sf-service-staff-avatars">
                              {staff.slice(0, 3).map((s, i) => (
                                <img
                                  key={i}
                                  src={s.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop"}
                                  alt={s.name}
                                  className="sf-service-staff-avatar"
                                  title={s.name}
                                />
                              ))}
                              {staff.length > 3 && (
                                <span className="sf-service-staff-more">+{staff.length - 3}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <Link to={`/site/${salon.slug}/book`} className="sf-btn sf-btn-primary sf-service-book-btn">
                        Book Now
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Link to={`/site/${salon.slug}/collections`} className="sf-btn sf-btn-secondary">View All Services</Link>
            </div>
          </>
        )}
      </section>

      {/* About */}
      <section className="sf-section" style={{ background: "#fff" }}>
        <div className="sf-section-header">
          <span style={{ color: "var(--sf-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.8rem" }}>About Us</span>
          <h2>Welcome to {salon.name}</h2>
          <p>Where beauty meets excellence</p>
        </div>
        <div className="sf-about-content">
          <div className="sf-about-image">
            <img src={config.aboutImage || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&fit=crop&sig=100"} alt={salon.name} />
          </div>
          <div className="sf-about-text">
            <p>{config.aboutText || "We are dedicated to providing an exceptional beauty experience. Our team of skilled professionals combines artistry with the highest quality products to help you look and feel your best."}</p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="sf-section" style={{ background: "#fafafa" }}>
        <div className="sf-section-header">
          <span style={{ color: "var(--sf-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.8rem" }}>The {salon.name} Standard</span>
          <h2>Why Choose Us</h2>
          <p>Experience the difference of true professional care.</p>
        </div>
        <div className="sf-features-split">
          <div className="sf-features-image">
            <img src={config.aboutImage || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&fit=crop&sig=100"} alt={salon.name} />
            <div className="sf-features-image-badge">
              <span className="sf-features-badge-number">10+</span>
              <span className="sf-features-badge-text">Years of Excellence</span>
            </div>
          </div>
          <div className="sf-features-list">
            <div className="sf-feature-item">
              <span className="sf-feature-number">01</span>
              <div>
                <h3 className="sf-feature-title">Premium Products</h3>
                <p className="sf-feature-text">We exclusively use top-tier, industry-leading products to ensure the best possible results for your hair and skin.</p>
              </div>
            </div>
            <div className="sf-feature-item">
              <span className="sf-feature-number">02</span>
              <div>
                <h3 className="sf-feature-title">Expert Stylists</h3>
                <p className="sf-feature-text">Our team consists of award-winning professionals continuously trained in the latest global trends and techniques.</p>
              </div>
            </div>
            <div className="sf-feature-item">
              <span className="sf-feature-number">03</span>
              <div>
                <h3 className="sf-feature-title">Serene Atmosphere</h3>
                <p className="sf-feature-text">Step into an oasis of calm. Our salon is designed to provide a relaxing, luxurious retreat from the busy world outside.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="sf-section" style={{ padding: "80px 0", overflow: "hidden" }}>
        <div className="sf-section-header">
          <span style={{ color: "var(--sf-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.8rem" }}>Testimonials</span>
          <h2>Client Stories</h2>
        </div>
        <div className="sf-marquee-container">
          <div className="sf-marquee-content">
            {[1, 2].map((loop) => (
              <div key={loop} style={{ display: "flex", gap: "24px" }}>
                {(config.testimonials?.length > 0 ? config.testimonials : [
                  { author: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&fit=crop", text: "Absolutely the best salon experience I've ever had. The stylists truly listened to what I wanted and delivered perfection.", rating: 5 },
                  { author: "Michael R.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop", text: "The atmosphere is incredibly relaxing. I came in for a massage and facial, and felt like a completely new person leaving.", rating: 5 },
                  { author: "Emma Watson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&fit=crop", text: "Top-notch products and amazing service. They really know how to treat their clients. Highly recommended!", rating: 5 },
                  { author: "Chloe M.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop", text: "I got my bridal makeup done here and it stayed flawless all day. The team was so supportive and professional.", rating: 5 }
                ]).map((review, i) => (
                  <div className="sf-review-card" key={i}>
                    <div className="sf-review-header">
                      <img src={review.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&fit=crop"} className="sf-review-avatar" alt={review.author} />
                      <div>
                        <span className="sf-review-author">{review.author}</span>
                        <div className="sf-review-stars">{"★".repeat(review.rating || 5)}</div>
                      </div>
                    </div>
                    <p className="sf-review-text">"{review.text}"</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      {config.ctaTitle && (
        <section className="sf-section" style={{ background: "var(--sf-accent, #c8a97e)", color: "#fff", textAlign: "center", padding: "80px 20px" }}>
          <h2 style={{ fontSize: "2.5rem", marginBottom: 12, color: "#fff" }}>{config.ctaTitle}</h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.9, marginBottom: 32 }}>{config.ctaSubtitle}</p>
          <Link to={config.ctaBtnLink || `/site/${salon.slug}/book`} className="sf-btn sf-btn-secondary" style={{ borderColor: "#fff", color: "#fff" }}>
            {config.ctaBtnText || "Book Now"}
          </Link>
        </section>
      )}
    </>
  );
}
