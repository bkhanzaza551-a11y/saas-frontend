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
    <div className="sf-animate">
      <div style={{ background: "var(--sf-text-main)", color: "white", padding: "100px 40px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "4rem", margin: 0 }}>Our Services</h1>
        <p style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.7)", marginTop: 16 }}>
          Discover our full range of premium treatments.
        </p>
      </div>

      <section className="sf-section">
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--sf-text-muted)" }}>Loading services...</div>
        ) : (
          <>
            {allServices.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "var(--sf-text-muted)" }}>
                <p>No services currently available. Please check back later.</p>
              </div>
            ) : (
              <>
                {categoryTabs.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 60, flexWrap: "wrap" }}>
                    <button
                      onClick={() => setActiveTab("all")}
                      style={{
                        padding: "10px 24px",
                        borderRadius: 100,
                        border: "1px solid var(--sf-text-main)",
                        background: activeTab === "all" ? "var(--sf-text-main)" : "transparent",
                        color: activeTab === "all" ? "#fff" : "var(--sf-text-main)",
                        fontWeight: 500,
                        transition: "all 0.3s ease"
                      }}
                    >
                      All Services
                    </button>
                    {categoryTabs.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        style={{
                          padding: "10px 24px",
                          borderRadius: 100,
                          border: "1px solid var(--sf-text-main)",
                          background: activeTab === cat ? "var(--sf-text-main)" : "transparent",
                          color: activeTab === cat ? "#fff" : "var(--sf-text-main)",
                          fontWeight: 500,
                          transition: "all 0.3s ease"
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                <div className="sf-services-grid">
                  {filteredServices.map(service => (
                    <Link to={`/site/${salon.slug}/service/${service.id}`} key={service.id} style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="sf-service-card">
                        <img src={service.imageUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&fit=crop"} alt={service.name} className="sf-service-img" />
                        <div className="sf-service-content">
                          <h3>{service.name}</h3>
                          <p className="sf-service-desc">{service.description || "Experience the ultimate care with our professional staff."}</p>
                          <div className="sf-service-footer">
                            <span className="sf-service-duration">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                              {service.durationMin} min
                            </span>
                            <span className="sf-service-price">{salon.currency} {Number(service.salePrice || service.price).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
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
