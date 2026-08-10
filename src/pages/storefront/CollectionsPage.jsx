import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { ArrowRight, Sparkles, Clock } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&fit=crop";

export default function CollectionsPage() {
  const { salon, selectedBranchId } = useOutletContext();
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!salon?.slug) return;
    setLoading(true);
    api
      .get(`/public/salon/${salon.slug}/storefront-services`, { params: { branchId: selectedBranchId } })
      .then(res => {
        setAllServices(res.data.services || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [salon?.slug, selectedBranchId]);

  useEffect(() => {
    document.title = `Services — ${salon?.name || "Premium Salon"}`;
    window.scrollTo(0, 0);
  }, [salon?.name]);

  const categoryTabs = (() => {
    const map = {};
    allServices.forEach(s => {
      const name = s.category?.name;
      if (name && !map[name]) map[name] = name;
    });
    return Object.values(map);
  })();

  const filteredServices =
    activeTab === "all"
      ? allServices
      : allServices.filter(s => s.category?.name === activeTab);

  return (
    <div className="storefront-wrapper" style={{ background: 'var(--surface)' }}>
      {/* Premium Minimalist Header */}
      <div style={{ paddingTop: 160, paddingBottom: 60, textAlign: "center", background: "var(--bg-main)", borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "4.5rem", margin: "0 0 24px", fontWeight: 500, color: "var(--text-main)", letterSpacing: "-1px" }}>Our Treatments</h1>
        <p style={{ fontSize: "1.15rem", color: "var(--text-muted)", maxWidth: 600, margin: '0 auto', fontWeight: 300, lineHeight: 1.6 }}>
          Discover our full range of premium treatments, meticulously crafted for your well-being.
        </p>
      </div>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "60px 32px 120px" }}>
        <style>{`
          .sf-category-pill {
            padding: 12px 28px;
            border-radius: 40px;
            font-size: 0.95rem;
            font-weight: 500;
            text-transform: uppercase;
            letterSpacing: 1px;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
            border: 1px solid var(--border);
            background: var(--bg-main);
            color: var(--text-main);
          }
          .sf-category-pill.active {
            background: var(--text-main);
            color: var(--bg-main);
            border-color: var(--text-main);
          }
          .sf-category-pill:hover:not(.active) {
            border-color: var(--text-main);
          }
          
          .sf-services-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 40px;
          }
          
          .sf-premium-card {
            background: var(--bg-main);
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid var(--border);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
            position: relative;
            display: flex;
            flex-direction: column;
          }
          .sf-premium-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
            border-color: transparent;
          }
          .sf-premium-card-img {
            width: 100%;
            height: 280px;
            object-fit: cover;
            transition: transform 0.6s ease;
          }
          .sf-premium-card:hover .sf-premium-card-img {
            transform: scale(1.05);
          }
          
          @media (max-width: 1024px) {
            .sf-services-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 768px) {
            .sf-services-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        {loading ? (
          <div style={{ textAlign: "center", padding: 120, color: "var(--text-muted)" }}>
             <p style={{ fontSize: '1.2rem', fontWeight: 300 }}>Curating our premium services...</p>
          </div>
        ) : (
          <>
            {allServices.length === 0 ? (
              <div style={{ textAlign: "center", padding: 120, color: "var(--text-muted)" }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 300 }}>No services currently available. Please check back later.</p>
              </div>
            ) : (
              <>
                {/* Horizontal Category Pills */}
                {categoryTabs.length > 0 && (
                  <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16, marginBottom: 60, msOverflowStyle: "none", scrollbarWidth: "none" }} className="hide-scrollbar">
                    <div 
                      className={`sf-category-pill ${activeTab === "all" ? "active" : ""}`}
                      onClick={() => setActiveTab("all")}
                    >
                      All
                    </div>
                    {categoryTabs.map(cat => (
                      <div 
                        key={cat}
                        className={`sf-category-pill ${activeTab === cat ? "active" : ""}`}
                        onClick={() => setActiveTab(cat)}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}

                <div className="sf-services-grid">
                  {filteredServices.map(service => {
                    const price = Number(service.salePrice && Number(service.salePrice) < Number(service.price) ? service.salePrice : service.price);
                    const hasSale = service.salePrice && Number(service.salePrice) < Number(service.price);
                    
                    return (
                      <div key={service.id} className="sf-premium-card" onClick={() => window.location.href = `/site/${salon.slug}/service/${service.id}`}>
                        <div style={{ position: "relative", overflow: "hidden" }}>
                          <img src={service.imageUrl || FALLBACK_IMG} alt={service.name} className="sf-premium-card-img" />
                          
                          {/* Badges Overlay */}
                          <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 8 }}>
                            {service.isFeatured && (
                              <span style={{ background: "rgba(255,255,255,0.95)", color: "var(--accent)", padding: "6px 12px", borderRadius: "30px", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>★ Featured</span>
                            )}
                            {service.isPopular && (
                              <span style={{ background: "var(--accent)", color: "#fff", padding: "6px 12px", borderRadius: "30px", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>🔥 Popular</span>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ padding: 32, display: "flex", flexDirection: "column", flex: 1 }}>
                          <div style={{ marginBottom: 16 }}>
                            <span style={{ display: "inline-block", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 500, textTransform: 'uppercase', letterSpacing: '2px' }}>
                              {service.category?.name || "Treatment"}
                            </span>
                          </div>
                          
                          <h3 style={{ margin: '0 0 16px', fontSize: '1.6rem', color: 'var(--text-main)', fontFamily: 'var(--font-serif)', fontWeight: 500, lineHeight: 1.2 }}>
                            {service.name}
                          </h3>
                          
                          <p style={{ margin: '0 0 32px', fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 300, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {service.description || "Experience a premium service tailored specifically to your needs."}
                          </p>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--text-main)' }}>{salon.currency || "INR"} {price.toFixed(2)}</span>
                              {hasSale && <span style={{ fontSize: "1rem", color: "var(--text-muted)", textDecoration: "line-through" }}>{salon.currency || "INR"} {Number(service.price).toFixed(2)}</span>}
                            </div>
                            
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>
                              Explore <ArrowRight size={16} />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
