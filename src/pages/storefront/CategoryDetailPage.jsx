import { useState, useEffect } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { formatDuration, formatPrice, getServicePrice } from "./storefrontUtils";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&fit=crop";

export default function CategoryDetailPage() {
  const { salon, selectedBranchId } = useOutletContext();
  const { slug, categoryId } = useParams();
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("popular");

  useEffect(() => {
    if (!slug) return;
    const params = selectedBranchId ? { branchId: selectedBranchId } : {};
    api.get(`/public/salon/${slug}/storefront-services`, { params })
      .then(res => setAllServices(res.data?.services || []))
      .catch(() => setAllServices([]))
      .finally(() => setLoading(false));
  }, [slug, selectedBranchId]);

  const categoryServices = allServices.filter(
    s => String(s.category?.id) === String(categoryId)
  );

  const categoryName = categoryServices.length > 0
    ? categoryServices[0].category?.name
    : "Category";

  const sorted = [...categoryServices].sort((a, b) => {
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

  const currency = salon.currency || "INR";

  return (
    <div>
      {/* Header */}
      <div style={{ background: "#fafafa", padding: "60px 20px", borderBottom: "1px solid var(--sf-border, #e2e8f0)" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <Link
            to={`/site/${slug}/collections`}
            style={{ color: "var(--sf-text-light, #999)", textDecoration: "none", marginBottom: 16, display: "inline-block" }}
          >
            &larr; Back to Services
          </Link>
          <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "3rem", margin: 0, color: "var(--sf-primary, #111)" }}>
            {categoryName}
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--sf-text-light, #999)", marginTop: 12 }}>
            {categoryServices.length} service{categoryServices.length !== 1 ? "s" : ""} in this category
          </p>
        </div>
      </div>

      {/* Content */}
      <section className="sf-section">
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          {/* Sort Bar */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 24 }}>
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

          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#666" }}>Loading services...</div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: "center", padding: 80, color: "#666" }}>
              <p style={{ fontSize: "1.1rem", margin: 0 }}>No services found in this category.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))", gap: 24 }}>
              {sorted.map(service => {
                const hasSale = service.salePrice && Number(service.salePrice) < Number(service.price);
                const displayPrice = hasSale ? service.salePrice : service.price;

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
                    <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                      <img
                        src={service.imageUrl || FALLBACK_IMG}
                        alt={service.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {hasSale && (
                        <span style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          padding: "4px 10px",
                          background: "#ef4444",
                          color: "#fff",
                          borderRadius: 100,
                          fontSize: "0.72rem",
                          fontWeight: 700
                        }}>
                          {Math.round((1 - Number(service.salePrice) / Number(service.price)) * 100)}% OFF
                        </span>
                      )}
                    </div>

                    {/* Service Details */}
                    <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                      {service.category && (
                        <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "#888", fontWeight: 600 }}>
                          {service.category.name}
                        </p>
                      )}
                      <h3 style={{ margin: "0 0 8px", fontSize: "1.05rem", fontWeight: 600, color: "#1a1a1a" }}>
                        {service.name}
                      </h3>

                      {service.description && (
                        <p style={{
                          margin: "0 0 12px",
                          fontSize: "0.85rem",
                          color: "#666",
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}>
                          {service.description}
                        </p>
                      )}

                      {/* Duration + Price */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {service.durationMin && (
                            <span style={{ fontSize: "0.85rem", color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              {formatDuration(service.durationMin)}
                            </span>
                          )}
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                            <span style={{ fontWeight: 700, color: "var(--sf-accent, #c8a97e)", fontSize: "1.1rem" }}>
                              {formatPrice(displayPrice, currency)}
                            </span>
                            {hasSale && (
                              <span style={{ fontSize: "0.82rem", color: "#888", textDecoration: "line-through" }}>
                                {formatPrice(service.price, currency)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Book Now Button */}
                      <div style={{ marginTop: "auto" }}>
                        <Link
                          to={`/site/${slug}/service/${service.id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <button
                            style={{
                              width: "100%",
                              padding: "12px 0",
                              background: "var(--sf-accent, #c8a97e)",
                              color: "#fff",
                              border: "none",
                              borderRadius: 10,
                              fontWeight: 600,
                              fontSize: "0.9rem",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                          >
                            Book Now
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
