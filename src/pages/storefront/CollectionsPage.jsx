import { useState, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { ArrowRight, Sparkles, Clock, Crown, Scissors, Check, Tag } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80";

export default function CollectionsPage() {
  const navigate = useNavigate();
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
        setAllServices(res.data?.services || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [salon?.slug, selectedBranchId]);

  useEffect(() => {
    document.title = `Services & Pricing — ${salon?.name || "Premium Salon"}`;
    window.scrollTo(0, 0);
  }, [salon?.name]);

  const currency = salon?.currency || "INR";

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
    <div className="storefront-wrapper" style={{ background: "#ffffff", color: "#0f172a", fontFamily: "'Poppins', -apple-system, sans-serif" }}>
      
      {/* Luxury Page Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", padding: "64px 24px 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.08, background: "radial-gradient(circle at center, #5eead4 0%, transparent 70%)" }} />
        
        <div style={{ position: "relative", zIndex: 2, maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#5eead4", borderRadius: 100, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            <Sparkles size={13} /> BESPOKE SALON MENU
          </div>
          
          <h1 className="sf-hero-white-title" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", fontWeight: 800, margin: "0 0 14px", lineHeight: 1.2, letterSpacing: "-0.02em", color: "#ffffff" }}>
            Our Signature Treatments
          </h1>
          
          <p className="sf-hero-white-desc" style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)", color: "rgba(255,255,255,0.9)", margin: "0 auto", lineHeight: 1.7, fontWeight: 400, maxWidth: 580 }}>
            Discover our comprehensive menu of premium hair styling, advanced aesthetic skincare, and revitalizing spa therapies.
          </p>
        </div>
      </div>

      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 24px 100px" }}>
        
        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 20px", color: "#64748b" }}>
            <div style={{ width: 44, height: 44, border: "3px solid #e2e8f0", borderTopColor: "#0d9488", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>Loading treatment catalog...</p>
          </div>
        ) : (
          <>
            {allServices.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px", background: "#f8fafc", borderRadius: 24, border: "1px dashed #cbd5e1" }}>
                <Scissors size={40} color="#94a3b8" style={{ margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>No Services Found</h3>
                <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>This branch's service catalog is currently being updated. Please check back shortly.</p>
              </div>
            ) : (
              <>
                {/* Filter Category Pills */}
                {categoryTabs.length > 0 && (
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 12, marginBottom: 40, msOverflowStyle: "none", scrollbarWidth: "none" }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab("all")}
                      style={{
                        padding: "9px 20px",
                        borderRadius: 100,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: activeTab === "all" ? "none" : "1px solid #e2e8f0",
                        background: activeTab === "all" ? "#0f172a" : "#f8fafc",
                        color: activeTab === "all" ? "#ffffff" : "#475569",
                        transition: "all 0.2s ease",
                        whiteSpace: "nowrap",
                        boxShadow: activeTab === "all" ? "0 4px 12px rgba(0,0,0,0.12)" : "none"
                      }}
                    >
                      All Treatments ({allServices.length})
                    </button>

                    {categoryTabs.map(cat => {
                      const count = allServices.filter(s => s.category?.name === cat).length;
                      const isActive = activeTab === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveTab(cat)}
                          style={{
                            padding: "9px 20px",
                            borderRadius: 100,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            border: isActive ? "none" : "1px solid #e2e8f0",
                            background: isActive ? "#0f172a" : "#f8fafc",
                            color: isActive ? "#ffffff" : "#475569",
                            transition: "all 0.2s ease",
                            whiteSpace: "nowrap",
                            boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.12)" : "none"
                          }}
                        >
                          {cat} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Services Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 30 }}>
                  {filteredServices.map(service => {
                    const price = Number(service.salePrice && Number(service.salePrice) < Number(service.price) ? service.salePrice : service.price);
                    const hasSale = service.salePrice && Number(service.salePrice) < Number(service.price);
                    const hasImage = Boolean(service.imageUrl && (service.imageUrl.startsWith("http") || service.imageUrl.startsWith("data:image/")));

                    return (
                      <div 
                        key={service.id} 
                        onClick={() => navigate(`/site/${salon.slug}/service/${service.id}`)}
                        style={{
                          background: "#ffffff",
                          borderRadius: 22,
                          border: "1px solid #e2e8f0",
                          overflow: "hidden",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                          display: "flex",
                          flexDirection: "column",
                          cursor: "pointer",
                          transition: "all 0.3s ease"
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
                        {/* Header: Uploaded Image OR Clean Luxury Branded Container */}
                        {hasImage ? (
                          <div style={{ height: 210, position: "relative", background: "#f8fafc", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <img 
                              src={service.imageUrl} 
                              alt={service.name} 
                              style={{ width: "100%", height: "100%", objectFit: "contain", padding: 10, transition: "transform 0.3s ease" }}
                            />
                            
                            {/* Badges */}
                            <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {service.category?.name && (
                                <span style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)", color: "#5eead4", padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                  {service.category.name}
                                </span>
                              )}
                              {service.isFeatured && (
                                <span style={{ background: "#fef3c7", color: "#b45309", padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
                                  ★ Featured
                                </span>
                              )}
                            </div>

                            {service.durationMinutes ? (
                              <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)", color: "#0f172a", padding: "4px 10px", borderRadius: 100, fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                                <Clock size={12} color="#0d9488" /> {service.durationMinutes} mins
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div style={{ padding: "24px 24px 16px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 14, background: "#f0fdfa", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #ccfbf1" }}>
                                <Scissors size={20} />
                              </div>
                              {service.category?.name && (
                                <span style={{ background: "#e2e8f0", color: "#334155", padding: "4px 10px", borderRadius: 100, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                  {service.category.name}
                                </span>
                              )}
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              {service.isFeatured && (
                                <span style={{ background: "#fef3c7", color: "#b45309", padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
                                  ★ Featured
                                </span>
                              )}
                              {service.durationMinutes ? (
                                <span style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1", padding: "4px 10px", borderRadius: 100, fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                                  <Clock size={12} color="#0d9488" /> {service.durationMinutes}m
                                </span>
                              ) : null}
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1 }}>
                          <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px", lineHeight: 1.3 }}>
                            {service.name}
                          </h3>

                          <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: "0 0 24px", flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {service.description || "Indulge in an exquisite, tailor-made treatment formulated with premium care."}
                          </p>

                          {/* Footer */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 18, marginTop: "auto" }}>
                            <div>
                              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Price</div>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                                <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
                                  {currency} {price.toFixed(2)}
                                </span>
                                {hasSale && (
                                  <span style={{ fontSize: 13, color: "#94a3b8", textDecoration: "line-through" }}>
                                    {currency} {Number(service.price).toFixed(2)}
                                  </span>
                                )}
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
                              <span>Book Slot</span>
                              <ArrowRight size={14} />
                            </button>
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
