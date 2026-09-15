import { useState, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { Scissors, Sparkles, Star, Clock, MapPin, Phone, ArrowRight, User, CheckCircle2, ShieldCheck, Crown, ChevronRight } from "lucide-react";

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
    document.title = `${salon?.name || "Premium Salon"} - Luxury Salon & Spa`;
    window.scrollTo(0, 0);
  }, [salon?.name]);

  const currency = salon?.currency || "INR";
  const wc = salon?.websiteConfig || {};

  const sectionsConfig = Array.isArray(wc.sections) && wc.sections.length > 0 ? wc.sections : null;
  const isSectionEnabled = (sectionId) => {
    if (!sectionsConfig) return true;
    const found = sectionsConfig.find(s => s.id === sectionId);
    return found ? found.enabled !== false : true;
  };

  const galleryImages = Array.isArray(wc.galleryImages) && wc.galleryImages.length > 0
    ? wc.galleryImages
    : [
        "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80"
      ];

  const testimonialsList = Array.isArray(wc.testimonials) && wc.testimonials.length > 0
    ? wc.testimonials
    : [
        { text: "Absolutely phenomenal service. The attention to detail, styling precision, and calm environment are unmatched.", author: "Priya Sharma", rating: 5, role: "Regular Client" },
        { text: "A truly luxury experience from the moment you walk in. My hair color formula was saved and executed flawlessly.", author: "Rahul Verma", rating: 5, role: "Monthly Member" },
        { text: "I've never felt more pampered. The private suites and master estheticians are world-class.", author: "Ananya Patel", rating: 5, role: "Bridal Client" },
        { text: "Sophisticated, impeccably clean, and deeply professional. Best grooming studio in the city.", author: "Vikram Singh", rating: 5, role: "Executive Client" }
      ];

  return (
    <div className="storefront-wrapper" style={{ background: "#ffffff", color: "#0f172a", fontFamily: "'Poppins', -apple-system, sans-serif" }}>
      <style>{`
        .sf-about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          align-items: center;
          max-width: 1240px;
          margin: 0 auto;
        }
        .sf-contact-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
          max-width: 1240px;
          margin: 0 auto;
        }
        @media (max-width: 900px) {
          .sf-contact-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .sf-contact-section {
            padding: 44px 16px !important;
          }
          .sf-contact-card {
            padding: 24px 18px !important;
            border-radius: 18px !important;
          }
          .sf-about-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .sf-about-section {
            padding: 44px 16px !important;
          }
          .sf-about-grid img {
            height: 240px !important;
            width: 100% !important;
          }
        }
      `}</style>
      
      {/* Premium Hero Section */}
      {isSectionEnabled("hero") && (
        <section id="sf-hero-section" className="sf-hero" style={{ position: "relative", minHeight: "82vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", overflow: "hidden", background: "#0f172a" }}>
          <div 
            className="sf-hero-bg" 
            style={{
              position: "absolute",
              inset: 0,
              background: `url('${wc.heroImage || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1800&auto=format&fit=crop&q=85"}') center/cover no-repeat`,
              filter: "brightness(0.55)",
              transform: "scale(1.02)",
              transition: "transform 8s ease"
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, rgba(15,23,42,0.4) 0%, rgba(15,23,42,0.85) 100%)" }} />
          
          <div className="sf-hero-content" style={{ position: "relative", zIndex: 10, maxWidth: 860, padding: "0 24px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)", color: "#5eead4", borderRadius: 100, fontSize: 12.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 22 }}>
              <Sparkles size={13} /> {salon?.name || "BESPOKE LUXURY SANCTUARY"}
            </div>

            <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)", fontWeight: 800, color: "#ffffff", lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              {wc.heroTitle || "The Ultimate Sanctuary for Beauty & Wellness"}
            </h1>

            <p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "rgba(255,255,255,0.85)", lineHeight: 1.7, margin: "0 auto 36px", maxWidth: 640, fontWeight: 400 }}>
              {wc.heroSubtitle || "Step into an oasis of refined grooming and bespoke self-care. Our master stylists craft your signature look with precision and pure luxury."}
            </p>

            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link 
                to={`/site/${salon?.slug}/services`} 
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: 8, 
                  background: "#ffffff", 
                  color: "#0f172a", 
                  padding: "14px 32px", 
                  borderRadius: 100, 
                  fontWeight: 700, 
                  fontSize: 15, 
                  textDecoration: "none",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                  transition: "all 0.25s ease"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.background = "#f0fdfa"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "#ffffff"; }}
              >
                <span>{wc.heroBtnText || "Book Your Appointment"}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* The Premium Standard / Features */}
      <section id="sf-features-section" style={{ padding: "80px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          
          <div style={{ textAlign: "center", marginBottom: 50 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              <Crown size={12} /> UNCOMPROMISING EXCELLENCE
            </div>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>
              The {salon?.name || "Luxury"} Standard
            </h2>
            <p style={{ fontSize: "1.1rem", color: "#64748b", maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>
              Why our distinguished guests trust us with their complete styling, skincare, and wellness journeys.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 28 }}>
            
            {/* Card 1 */}
            <div 
              style={{ 
                background: "#ffffff", 
                borderRadius: 24, 
                padding: "36px 30px", 
                border: "1px solid #e2e8f0", 
                boxShadow: "0 10px 30px rgba(0,0,0,0.03)", 
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(13,148,136,0.1)"; e.currentTarget.style.borderColor = "#99f6e4"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.03)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #f0fdfa, #ccfbf1)", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, border: "1px solid #99f6e4" }}>
                <Scissors size={24} />
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
                Master Stylists & Artists
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, margin: 0 }}>
                Every stylist and therapist is rigorously certified with years of specialized salon and luxury aesthetic experience.
              </p>
            </div>

            {/* Card 2 */}
            <div 
              style={{ 
                background: "#ffffff", 
                borderRadius: 24, 
                padding: "36px 30px", 
                border: "1px solid #e2e8f0", 
                boxShadow: "0 10px 30px rgba(0,0,0,0.03)", 
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(13,148,136,0.1)"; e.currentTarget.style.borderColor = "#99f6e4"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.03)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #f0f9ff, #bae6fd)", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, border: "1px solid #7dd3fc" }}>
                <Sparkles size={24} />
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
                100% Premium Products
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, margin: 0 }}>
                We exclusively use dermatologically approved, globally recognized haircare and skincare product lines for optimal health.
              </p>
            </div>

            {/* Card 3 */}
            <div 
              style={{ 
                background: "#ffffff", 
                borderRadius: 24, 
                padding: "36px 30px", 
                border: "1px solid #e2e8f0", 
                boxShadow: "0 10px 30px rgba(0,0,0,0.03)", 
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(13,148,136,0.1)"; e.currentTarget.style.borderColor = "#99f6e4"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.03)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #fdf2f8, #fbcfe8)", color: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, border: "1px solid #f472b6" }}>
                <Star size={24} />
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
                Serene Private Ambiance
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, margin: 0 }}>
                Unwind in carefully curated, sanitized styling lounges with ambient acoustic relaxation and personalized beverages.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Featured Services */}
      {isSectionEnabled("services") && (
        <section id="sf-services-section" style={{ padding: "90px 24px", background: "#ffffff" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20, marginBottom: 46 }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  <Sparkles size={12} /> CURATED MENU
                </div>
                <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Featured Services & Packages
                </h2>
              </div>

              <Link 
                to={`/site/${salon?.slug}/services`}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14.5, fontWeight: 700, color: "#0d9488", textDecoration: "none" }}
              >
                <span>View Complete Menu</span>
                <ArrowRight size={16} />
              </Link>
            </div>
            
            {services.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "#f8fafc", borderRadius: 20, border: "1px dashed #cbd5e1", color: "#64748b" }}>
                <p style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 8px", color: "#0f172a" }}>Service menu is being refreshed.</p>
                <p style={{ fontSize: 14, margin: 0 }}>Please check back in a few moments or contact our front desk.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 28 }}>
                {services.map(service => (
                  <div 
                    key={service.id} 
                    onClick={() => navigate(`/site/${salon.slug}/service/${service.id}`)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 22,
                      padding: "26px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      position: "relative"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                      e.currentTarget.style.boxShadow = "0 18px 40px rgba(13,148,136,0.12)";
                      e.currentTarget.style.borderColor = "#99f6e4";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.04)";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: "#f0fdfa", border: "1px solid #ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", color: "#0d9488" }}>
                        <Sparkles size={22} />
                      </div>
                      {service.durationMinutes ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: 100, fontSize: 11.5, fontWeight: 600, color: "#64748b" }}>
                          <Clock size={12} /> {service.durationMinutes} mins
                        </span>
                      ) : null}
                    </div>

                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                      {service.name}
                    </h3>
                    
                    <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: "0 0 22px", flex: 1 }}>
                      {service.description || "A tailored luxury experience designed to elevate your personal style."}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 18, marginTop: "auto" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Price</div>
                        <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
                          {currency} {service.salePrice || service.price}
                        </div>
                      </div>

                      <button 
                        type="button" 
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "#0f172a",
                          color: "#ffffff",
                          padding: "10px 18px",
                          borderRadius: 10,
                          fontWeight: 700,
                          fontSize: 13,
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        Book Slot <ArrowRight size={14} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: 50 }}>
              <Link 
                to={`/site/${salon?.slug}/services`} 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 34px",
                  background: "#0f172a",
                  color: "#ffffff",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.12)"
                }}
              >
                <span>View Full Service Catalog</span>
                <ArrowRight size={16} />
              </Link>
            </div>

          </div>
        </section>
      )}

      {/* About Section */}
      {isSectionEnabled("about") && (
        <section id="sf-about-section" className="sf-about-section" style={{ padding: "90px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
          <div className="sf-about-grid">
            
            <div style={{ position: "relative" }}>
              <img 
                src={wc.aboutImage || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80"} 
                alt="Salon Ambience" 
                style={{ width: "100%", height: 420, objectFit: "cover", borderRadius: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }} 
              />
              <div style={{ position: "absolute", bottom: 20, left: 20, background: "rgba(15,23,42,0.88)", backdropFilter: "blur(10px)", padding: "12px 20px", borderRadius: 14, color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div style={{ fontSize: 12, color: "#5eead4", fontWeight: 700 }}>VERIFIED AMBIANCE</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{salon?.name || "Luxury Salon & Spa"}</div>
              </div>
            </div>

            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                <Crown size={12} /> THE ART OF GROOMING
              </div>

              <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px", lineHeight: 1.2 }}>
                {wc.aboutTitle || "Crafting Confidence Through Precision & Care"}
              </h2>

              <p style={{ fontSize: "1.05rem", color: "#64748b", lineHeight: 1.8, margin: "0 0 24px" }}>
                {wc.aboutDescription || `At ${salon?.name || "our salon"}, we believe true beauty begins with personal attention. Established as a sanctuary for total transformation, we blend master artistry with modern client hospitality.`}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {[
                  "Certified Master Stylists & Hair Color Technicians",
                  "100% Organic & Luxury Dermatological Products",
                  "Private, Sanitized Suites for Maximum Comfort"
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "#334155" }}>
                    <CheckCircle2 size={18} color="#0d9488" style={{ flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link 
                to={`/site/${salon?.slug}/services`} 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  background: "#0f172a",
                  color: "#ffffff",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14.5,
                  textDecoration: "none"
                }}
              >
                <span>Explore Full Service Menu</span>
                <ArrowRight size={16} />
              </Link>
            </div>

          </div>
        </section>
      )}

      {/* Gallery Section */}
      {isSectionEnabled("gallery") && (
        <section id="sf-gallery-section" style={{ padding: "90px 24px", background: "#ffffff" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
                Signature Styles & Spaces
              </h2>
              <p style={{ fontSize: "1.05rem", color: "#64748b", maxWidth: 540, margin: "0 auto" }}>
                A visual showcase into our daily world of styling, color art, and tranquil spa suites.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
              {galleryImages.map((imgUrl, idx) => (
                <div 
                  key={idx} 
                  style={{ height: 260, borderRadius: 20, overflow: "hidden", boxShadow: "0 6px 18px rgba(0,0,0,0.06)", position: "relative" }}
                >
                  <img 
                    src={imgUrl} 
                    alt={`Signature style ${idx + 1}`} 
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Marquee Roller */}
      {isSectionEnabled("testimonials") && (
        <section id="sf-testimonials-section" style={{ padding: "80px 0", background: "#f8fafc", borderTop: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px", textAlign: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "#fef3c7", color: "#b45309", borderRadius: 100, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              <Star size={12} fill="#b45309" /> 5-STAR GUEST REVIEWS
            </div>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              What Our Clients Say
            </h2>
            <p style={{ fontSize: 14.5, color: "#64748b", margin: "8px 0 0" }}>
              Real impressions & experiences from our valued guests.
            </p>
          </div>

          <div className="sf-marquee-container">
            <div className="sf-marquee-track">
              {[1, 2, 3].map(cycle => (
                <div key={cycle} style={{ display: "flex", gap: 24, flexShrink: 0 }}>
                  {testimonialsList.map((t, i) => (
                    <div 
                      key={`${cycle}-${i}`} 
                      style={{
                        width: 380,
                        background: "#ffffff",
                        borderRadius: 22,
                        padding: "26px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
                        display: "flex",
                        flexDirection: "column",
                        flexShrink: 0,
                        transition: "all 0.3s ease"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 14px 30px rgba(0,0,0,0.08)";
                        e.currentTarget.style.borderColor = "#cbd5e1";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.04)";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                      }}
                    >
                      <div style={{ display: "flex", gap: 4, color: "#f59e0b", marginBottom: 14 }}>
                        {[...Array(Number(t.rating || 5))].map((_, starIdx) => (
                          <Star key={starIdx} size={15} fill="#f59e0b" strokeWidth={0} />
                        ))}
                      </div>

                      <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, margin: "0 0 20px", flex: 1, fontStyle: "italic" }}>
                        "{t.text}"
                      </p>

                      <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #f1f5f9", paddingTop: 14, marginTop: "auto" }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#f0fdfa", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
                          {t.author?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{t.author}</div>
                          <div style={{ fontSize: 11, color: "#0d9488", fontWeight: 600 }}>✓ Verified Guest</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact / Visit Us */}
      {isSectionEnabled("contact") && (
        <section id="sf-contact-section" className="sf-contact-section" style={{ padding: "80px 24px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff" }}>
          <div className="sf-contact-grid">
            
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#5eead4", borderRadius: 100, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                <MapPin size={12} /> VISIT OUR SANCTUARY
              </div>

              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, color: "#ffffff", margin: "0 0 16px" }}>
                We Look Forward to Welcoming You
              </h2>

              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 520 }}>
                Experience elevated self-care in a peaceful, world-class salon atmosphere. Reach out or reserve your chair online.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <MapPin size={20} color="#5eead4" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span style={{ fontSize: 14.5, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>
                    {wc.contactAddress || salon?.address || "123 Elegance Avenue, Luxury District"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Phone size={20} color="#5eead4" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 14.5, color: "rgba(255,255,255,0.9)" }}>
                    {wc.contactPhone || salon?.phone || "+91 98765 43210"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Clock size={20} color="#5eead4" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
                    {wc.businessHours || "Mon - Sat: 10:00 AM - 08:30 PM | Sunday: 11:00 AM - 07:00 PM"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Card */}
            <div className="sf-contact-card" style={{ background: "rgba(255,255,255,0.06)", borderRadius: 24, padding: "40px 32px", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", margin: "0 0 10px" }}>
                Ready for your transformation?
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: "0 0 28px" }}>
                Choose your preferred branch, stylist, and service to secure your appointment slot instantly.
              </p>
              
              <Link 
                to={`/site/${salon?.slug}/services`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "#ffffff",
                  color: "#0f172a",
                  padding: "16px",
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
                }}
              >
                <span>Book Appointment Online</span>
                <ArrowRight size={17} />
              </Link>
            </div>

          </div>
        </section>
      )}

    </div>
  );
}