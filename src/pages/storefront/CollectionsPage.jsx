import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function CollectionsPage() {
  const { salon, selectedBranchId } = useOutletContext();
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
    <div className="storefront-wrapper">
      {/* Hero Section */}
      <div className="sf-page-header" style={{
        background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=1600&q=80') center/cover no-repeat`,
        color: "white"
      }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "4.5rem", margin: 0, fontWeight: 500, color: 'white' }}>Our Services</h1>
        <p style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.9)", marginTop: 24, maxWidth: 600, margin: '24px auto 0', fontWeight: 300 }}>
          Discover our full range of premium treatments meticulously crafted for your well-being.
        </p>
      </div>

      <section className="sf-section">
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
                {categoryTabs.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 60, position: "relative", zIndex: 10 }}>
                    <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
                      <div 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "14px 20px",
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                          cursor: "pointer",
                          fontWeight: 500,
                          color: "var(--text-main)",
                          transition: "all 0.2s"
                        }}
                      >
                        <span style={{ textTransform: "capitalize" }}>
                          {activeTab === "all" ? "All Categories" : activeTab}
                        </span>
                        <ChevronDown size={18} style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }} />
                      </div>
                      
                      {dropdownOpen && (
                        <div style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: 8,
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          overflow: "hidden",
                          animation: "fadeInDown 0.2s ease-out"
                        }}>
                          <div 
                            onClick={() => { setActiveTab("all"); setDropdownOpen(false); }}
                            style={{ padding: "12px 20px", cursor: "pointer", background: activeTab === "all" ? "#f8fafc" : "transparent", fontWeight: activeTab === "all" ? 600 : 400, color: "var(--text-main)", transition: "background 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                            onMouseLeave={e => e.currentTarget.style.background = activeTab === "all" ? "#f8fafc" : "transparent"}
                          >
                            All Categories
                          </div>
                          {categoryTabs.map(cat => (
                            <div 
                              key={cat}
                              onClick={() => { setActiveTab(cat); setDropdownOpen(false); }}
                              style={{ padding: "12px 20px", cursor: "pointer", background: activeTab === cat ? "#f8fafc" : "transparent", fontWeight: activeTab === cat ? 600 : 400, color: "var(--text-main)", transition: "background 0.2s", textTransform: "capitalize" }}
                              onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                              onMouseLeave={e => e.currentTarget.style.background = activeTab === cat ? "#f8fafc" : "transparent"}
                            >
                              {cat}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="sf-services-grid">
                  {filteredServices.map(service => (
                    <div key={service.id} className="sf-service-card" onClick={() => window.location.href = `/site/${salon.slug}/service/${service.id}`}>
                      <div className="sf-service-img-wrapper">
                        <img src={service.imageUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80"} alt={service.name} className="sf-service-img" />
                      </div>
                      <div className="sf-service-content">
                        <h3>{service.name}</h3>
                        <p className="sf-service-desc">{service.description || "A premium service tailored for your needs."}</p>
                        <div className="sf-service-footer">
                          <span className="sf-service-price">{salon.currency || "INR"} {service.salePrice || service.price}</span>
                          <span className="sf-service-btn">Details <ArrowRight size={16} /></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
