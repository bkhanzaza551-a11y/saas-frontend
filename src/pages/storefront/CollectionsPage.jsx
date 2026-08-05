import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { formatDuration, formatPrice, getServicePrice } from "./storefrontUtils";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400&h=300&fit=crop"
];

export default function CollectionsPage() {
  const { salon, selectedBranchId, setSelectedBranchId } = useOutletContext();
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  useEffect(() => {
    if (!salon?.slug) return;
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
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = `Browse and book premium salon services at ${salon.name}`;
    return () => { document.title = "ReSpark"; };
  }, [salon.name]);

  const currency = salon.currency || "INR";

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

  const sorted = [...filteredServices].sort((a, b) => {
    if (sortBy === "popular") {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return 0;
    }
    if (sortBy === "price-low")
      return Number(a.salePrice || a.price) - Number(b.salePrice || b.price);
    if (sortBy === "price-high")
      return Number(b.salePrice || b.price) - Number(a.salePrice || a.price);
    if (sortBy === "duration")
      return (a.durationMin || 0) - (b.durationMin || 0);
    return 0;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ background: "#111", color: "white", padding: "80px 20px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "3.5rem", margin: 0 }}>Our Services</h1>
        <p style={{ fontSize: "1.2rem", color: "#aaa", marginTop: 16 }}>
          {allServices.length > 0
            ? `${allServices.length} services across ${categoryTabs.length} categories`
            : "Browse our professional services."}
        </p>
      </div>

      <section className="sf-section">
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#666" }}>Loading services...</div>
        ) : (
          <>
            {allServices.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
                <p>No services available at this branch. Try selecting a different branch.</p>
              </div>
            ) : (
              <>
            {/* Category Tabs */}
            {categoryTabs.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
                <button
                  onClick={() => setActiveTab("all")}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 100,
                    border: "2px solid var(--sf-accent, #c8a97e)",
                    background: activeTab === "all" ? "var(--sf-accent, #c8a97e)" : "transparent",
                    color: activeTab === "all" ? "#fff" : "var(--sf-accent, #c8a97e)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  All ({allServices.length})
                </button>
                {categoryTabs.map(name => {
                  const count = allServices.filter(s => s.category?.name === name).length;
                  return (
                    <button
                      key={name}
                      onClick={() => setActiveTab(name)}
                      style={{
                        padding: "10px 24px",
                        borderRadius: 100,
                        border: "2px solid var(--sf-accent, #c8a97e)",
                        background: activeTab === name ? "var(--sf-accent, #c8a97e)" : "transparent",
                        color: activeTab === name ? "#fff" : "var(--sf-accent, #c8a97e)",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {name} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sort */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <span style={{ color: "#666", fontSize: "0.9rem" }}>
                Showing {sorted.length} service{sorted.length !== 1 ? "s" : ""}
              </span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ padding: "8px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.9rem" }}
              >
                <option value="popular">Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="duration">Duration: Short to Long</option>
              </select>
            </div>

            {/* Service Grid */}
            {sorted.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))",
                  gap: 24
                }}
              >
                {sorted.map(service => {
                  const hasSale =
                    service.salePrice &&
                    Number(service.salePrice) < Number(service.price);

                  return (
                    <div
                      key={service.id}
                      style={{
                        background: "#fff",
                        borderRadius: 16,
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                        border: "1px solid #f1f5f9",
                        transition: "all 0.3s ease",
                        display: "flex",
                        flexDirection: "column"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.12)";
                        e.currentTarget.style.transform = "translateY(-4px)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.06)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {/* Service Image */}
                      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                        <img
                          src={service.imageUrl || FALLBACK_IMAGES[(service.name || "").charCodeAt(0) % FALLBACK_IMAGES.length || 0]}
                          alt={service.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        {service.category && (
                          <span
                            style={{
                              position: "absolute",
                              top: 12,
                              left: 12,
                              padding: "4px 12px",
                              background: "rgba(0,0,0,0.6)",
                              color: "#fff",
                              borderRadius: 100,
                              fontSize: "0.72rem",
                              fontWeight: 600
                            }}
                          >
                            {service.category.name}
                          </span>
                        )}
                      </div>

                      {/* Service Details */}
                      <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 600, color: "#1a1a1a" }}>
                          {service.name}
                        </h3>

                        {service.description && (
                          <p
                            style={{
                              margin: "0 0 12px",
                              fontSize: "0.85rem",
                              color: "#666",
                              lineHeight: 1.5,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden"
                            }}
                          >
                            {service.description}
                          </p>
                        )}

                        {/* Duration + Price */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: "0.85rem", color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              {formatDuration(service.durationMin)}
                            </span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                              <span style={{ fontWeight: 700, color: "var(--sf-accent, #c8a97e)", fontSize: "1.1rem" }}>
                                {formatPrice(getServicePrice(service), currency)}
                              </span>
                              {hasSale && (
                                <span style={{ fontSize: "0.82rem", color: "#999", textDecoration: "line-through" }}>
                                  {formatPrice(service.price, currency)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Staff Avatars */}
                        {service.staffAssignments?.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                            <div style={{ display: "flex", marginRight: 4 }}>
                              {service.staffAssignments.slice(0, 3).map((assignment, i) => (
                                <img
                                  key={assignment.user?.name || i}
                                  src={assignment.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignment.user?.name || "")}&background=c8a97e&color=fff&size=28`}
                                  alt={assignment.user?.name}
                                  title={assignment.user?.name}
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    border: "2px solid #fff",
                                    objectFit: "cover",
                                    marginLeft: i > 0 ? -8 : 0
                                  }}
                                />
                              ))}
                            </div>
                            <span style={{ fontSize: "0.78rem", color: "#888" }}>
                              {service.staffAssignments.length === 1
                                ? service.staffAssignments[0].user?.name
                                : `${service.staffAssignments.length} staff available`}
                            </span>
                          </div>
                        )}

                        {/* Book Now Button */}
                        <div style={{ marginTop: "auto" }}>
                          <Link
                            to={`/site/${salon.slug}/service/${service.id}`}
                            className="sf-btn sf-btn-primary"
                            style={{ display: "block", width: "100%", padding: "12px 0", textAlign: "center", borderRadius: 10, fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
                <p>No services found in this category.</p>
              </div>
            )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
