import React, { useState, useEffect, useMemo } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { Search, Sparkles, Clock, ArrowRight, FileText, BookOpen } from "lucide-react";

export default function BlogListPage() {
  const { salon } = useOutletContext();
  const { slug } = useParams();
  const [blogs, setBlogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const salonSlug = salon?.slug || slug;

  useEffect(() => {
    if (!salonSlug) return;
    
    setLoading(true);
    api.get(`/public/salons/${salonSlug}/blogs`)
      .then(res => {
        setBlogs(res.data?.blogs || res.data || []);
      })
      .catch(err => console.error("Error fetching blogs:", err))
      .finally(() => setLoading(false));
  }, [salonSlug]);

  const filteredBlogs = useMemo(() => {
    if (!searchQuery.trim()) return blogs;
    const q = searchQuery.toLowerCase();
    return blogs.filter(b => 
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.excerpt && b.excerpt.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q)) ||
      (b.content && b.content.toLowerCase().includes(q))
    );
  }, [blogs, searchQuery]);

  if (loading) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0d9488", animation: "spin 0.8s linear infinite" }} />
        <p style={{ marginTop: 18, color: "#64748b", fontWeight: 600, fontSize: "0.95rem" }}>Loading Journal & Articles...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* Editorial Hero Header */}
      <section style={{ padding: "70px 24px 60px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#5eead4", borderRadius: 100, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
            <Sparkles size={12} /> THE EDITORIAL JOURNAL
          </div>
          <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.025em", color: "#ffffff" }}>
            Stories, Trends & Styling Secrets
          </h1>
          <p style={{ fontSize: "1.05rem", color: "#94a3b8", lineHeight: 1.6, maxWidth: 620, margin: "0 auto 32px" }}>
            Explore curated grooming guides, expert salon transformations, and seasonal wellness rituals straight from our master stylists.
          </p>

          {/* Search Box */}
          <div style={{ maxWidth: 460, margin: "0 auto", position: "relative" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text"
              placeholder="Search articles by title, topic, or stylist..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 18px 13px 46px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontSize: "0.92rem",
                outline: "none",
                boxSizing: "border-box",
                backdropFilter: "blur(10px)"
              }}
            />
          </div>
        </div>
      </section>

      {/* Blog Cards Grid */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "60px 24px 100px" }}>
        {filteredBlogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "#ffffff", borderRadius: 20, border: "1px solid #e2e8f0", maxWidth: 600, margin: "0 auto" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <BookOpen size={28} />
            </div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>No Articles Found</h3>
            <p style={{ color: "#64748b", margin: "0 0 20px", fontSize: "0.92rem" }}>
              {searchQuery ? `No articles matching "${searchQuery}". Try a different keyword.` : "Check back soon for new articles and salon stories."}
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                style={{ padding: "8px 18px", borderRadius: 8, background: "#0f172a", color: "#ffffff", border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 380px))", justifyContent: "flex-start", gap: 32 }}>
            {filteredBlogs.map(blog => {
              let coverImg = blog.imageUrl;
              if (!coverImg && Array.isArray(blog.images) && blog.images.length > 0) coverImg = blog.images[0];
              if (!coverImg && typeof blog.images === "string") {
                try { const parsed = JSON.parse(blog.images); if (Array.isArray(parsed)) coverImg = parsed[0]; } catch {}
              }
              if (!coverImg && blog.coverImage) coverImg = blog.coverImage;

              const readTime = Math.max(2, Math.ceil(((blog.content?.length || 600) + (blog.excerpt?.length || 0)) / 500));
              const pubDate = blog.createdAt || blog.date ? new Date(blog.createdAt || blog.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent";

              return (
                <Link 
                  to={`/site/${salonSlug}/blog/${blog.slug}`} 
                  key={blog.id || blog.slug} 
                  style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}
                >
                  <div 
                    style={{ 
                      background: "#ffffff", 
                      borderRadius: 20, 
                      overflow: "hidden", 
                      border: "1px solid #e2e8f0", 
                      boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)", 
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", 
                      display: "flex", 
                      flexDirection: "column",
                      height: "100%",
                      cursor: "pointer"
                    }} 
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                      e.currentTarget.style.boxShadow = "0 20px 30px -10px rgba(0, 0, 0, 0.12)";
                      const img = e.currentTarget.querySelector(".blog-card-img");
                      if (img) img.style.transform = "scale(1.05)";
                    }} 
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 20px -2px rgba(0, 0, 0, 0.05)";
                      const img = e.currentTarget.querySelector(".blog-card-img");
                      if (img) img.style.transform = "scale(1)";
                    }}
                  >
                    <div style={{ width: "100%", height: 230, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
                      {coverImg ? (
                        <img 
                          src={coverImg} 
                          alt={blog.title} 
                          className="blog-card-img"
                          style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000", transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} 
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#cbd5e1" }}>
                          <FileText size={40} style={{ opacity: 0.5, marginBottom: 8 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Editorial</span>
                        </div>
                      )}
                      <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)", color: "#ffffff", padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Style & Care
                      </div>
                    </div>

                    <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 12 }}>
                        <span>{pubDate}</span>
                        <span>•</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {readTime} min read</span>
                      </div>

                      <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {blog.title}
                      </h3>

                      <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65, margin: "0 0 20px", flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {blog.excerpt || (blog.content ? blog.content.replace(/<[^>]*>?/gm, '').substring(0, 130) + '...' : 'Discover expert grooming insights and professional styling trends.')}
                      </p>

                      <div style={{ paddingTop: 16, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e0f2fe", color: "#0369a1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                            {(blog.author || "S")[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>{blog.author || "Master Stylist"}</span>
                        </div>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "#0d9488" }}>
                          Read Story <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}

