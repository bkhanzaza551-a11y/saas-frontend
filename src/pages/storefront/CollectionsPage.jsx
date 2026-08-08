import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

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
    document.title = `Services — ${salon.name}`;
    window.scrollTo(0, 0);
  }, [salon.name]);

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
      <div style={{ background: "var(--accent)", color: "white", padding: "120px 40px 80px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "4rem", margin: 0, letterSpacing: '-1px' }}>Our Services</h1>
        <p style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.8)", marginTop: 24, maxWidth: 600, margin: '24px auto 0' }}>
          Discover our full range of premium treatments meticulously crafted for your well-being.
        </p>
      </div>

      <section className="sf-section">
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading services...</div>
        ) : (
          <>
            {allServices.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
                <p>No services currently available. Please check back later.</p>
              </div>
            ) : (
              <>
                {categoryTabs.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 60, flexWrap: "wrap" }}>
                    <button
                      onClick={() => setActiveTab("all")}
                      style={{
                        padding: "12px 28px",
                        borderRadius: 100,
                        border: "1px solid var(--accent)",
                        background: activeTab === "all" ? "var(--accent)" : "transparent",
                        color: activeTab === "all" ? "#fff" : "var(--accent)",
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        transition: "var(--transition)"
                      }}
                    >
                      All Services
                    </button>
                    {categoryTabs.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        style={{
                          padding: "12px 28px",
                          borderRadius: 100,
                          border: "1px solid var(--accent)",
                          background: activeTab === cat ? "var(--accent)" : "transparent",
                          color: activeTab === cat ? "#fff" : "var(--accent)",
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          transition: "var(--transition)"
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                <div className="sf-services-grid">
                  {filteredServices.map(service => (
                    <div key={service.id} className="sf-service-card">
                      <img src={service.imageUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80"} alt={service.name} className="sf-service-img" />
                      <div className="sf-service-content">
                        <h3>{service.name}</h3>
                        <p className="sf-service-desc">{service.description || "A premium service tailored for your needs."}</p>
                        <div className="sf-service-footer">
                          <span className="sf-service-price">{salon.currency || "INR"} {service.salePrice || service.price}</span>
                          <Link to={`/site/${salon.slug}/service/${service.id}`} className="sf-btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>View Details</Link>
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
