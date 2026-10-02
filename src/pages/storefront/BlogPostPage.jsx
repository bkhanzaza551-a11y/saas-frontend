import React, { useState, useEffect } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  User, 
  Share2, 
  Check, 
  Copy, 
  MessageCircle, 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  Image as ImageIcon,
  BookOpen
} from "lucide-react";

export default function BlogPostPage() {
  const { salon } = useOutletContext();
  const { slug, blogSlug } = useParams();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);

  const salonSlug = salon?.slug || slug;

  useEffect(() => {
    if (!salonSlug || !blogSlug) return;

    setLoading(true);
    api.get(`/public/salons/${salonSlug}/blogs/${blogSlug}`)
      .then(res => {
        const blogData = res.data?.blog || res.data;
        setBlog(blogData);
        // Normalize images array
        if (blogData) {
          let imgs = [];
          if (Array.isArray(blogData.images)) {
            imgs = blogData.images;
          } else if (typeof blogData.images === "string") {
            try { imgs = JSON.parse(blogData.images); } catch { imgs = [blogData.images]; }
          }
          if (!imgs.length && blogData.imageUrl) {
            imgs = [blogData.imageUrl];
          }
          blogData.allImages = imgs;
        }
      })
      .catch(err => console.error("Error fetching blog:", err))
      .finally(() => setLoading(false));

    // Fetch related blogs
    api.get(`/public/salons/${salonSlug}/blogs`)
      .then(res => {
        const list = res.data?.blogs || res.data || [];
        setRelatedBlogs(list.filter(b => b.slug !== blogSlug).slice(0, 3));
      })
      .catch(() => {});
  }, [salonSlug, blogSlug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Read this article: "${blog?.title}" - ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0d9488", animation: "spin 0.8s linear infinite" }} />
        <p style={{ marginTop: 18, color: "#64748b", fontWeight: 600, fontSize: "0.95rem" }}>Curating article...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <BookOpen size={30} />
        </div>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>Article Not Found</h2>
        <p style={{ color: "#64748b", maxWidth: 420, marginBottom: 24, fontSize: "0.95rem" }}>The article you are looking for may have been moved, unpublished, or does not exist.</p>
        <Link 
          to={`/site/${salonSlug}/blog`} 
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "#0f172a", color: "#ffffff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}
        >
          <ArrowLeft size={16} /> Back to Journal
        </Link>
      </div>
    );
  }

  const allImages = blog.allImages || (blog.imageUrl ? [blog.imageUrl] : []);
  const coverImage = allImages[0] || blog.imageUrl;
  const readTime = Math.max(2, Math.ceil(((blog.content?.length || 800) + (blog.excerpt?.length || 0)) / 500));
  const pubDate = blog.createdAt || blog.date ? new Date(blog.createdAt || blog.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Recent Editorial";

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh" }}>
      
      {/* Top Breadcrumb Navigation */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#64748b", flexWrap: "wrap" }}>
          <Link to={`/site/${salonSlug}`} style={{ color: "#64748b", textDecoration: "none", fontWeight: 600 }}>Home</Link>
          <ChevronRight size={14} />
          <Link to={`/site/${salonSlug}/blog`} style={{ color: "#64748b", textDecoration: "none", fontWeight: 600 }}>Journal</Link>
          <ChevronRight size={14} />
          <span style={{ color: "#0f172a", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>{blog.title}</span>
        </div>
      </div>

      <article style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
        
        {/* Category Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0d9488", borderRadius: 100, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
          <Sparkles size={12} /> THE EDITORIAL JOURNAL
        </div>

        {/* Article Title */}
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, color: "#0f172a", lineHeight: 1.2, margin: "0 0 20px", letterSpacing: "-0.025em" }}>
          {blog.title}
        </h1>

        {/* Author & Meta Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, padding: "20px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, boxShadow: "0 4px 10px rgba(13, 148, 136, 0.2)" }}>
              {(blog.author || "S")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>{blog.author || "Master Stylist"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {pubDate}</span>
                <span>•</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {readTime} min read</span>
              </div>
            </div>
          </div>

          {/* Social Share Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handleWhatsAppShare}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #bbf7d0",
                background: "#f0fdf4",
                color: "#15803d",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <MessageCircle size={15} /> Share on WhatsApp
            </button>

            <button
              onClick={handleCopyLink}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                color: copied ? "#059669" : "#475569",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </div>

        {/* Featured Main Image Banner */}
        {coverImage && (
          <div style={{ width: "100%", borderRadius: 24, overflow: "hidden", marginBottom: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent" }}>
            <img 
              src={coverImage} 
              alt={blog.title} 
              style={{ width: "100%", height: "auto", maxHeight: "600px", objectFit: "contain", borderRadius: 24 }} 
            />
          </div>
        )}

        {/* Excerpt Blockquote / Lead Paragraph */}
        {blog.excerpt && (
          <div style={{ margin: "0 0 32px", padding: "20px 24px", background: "#f8fafc", borderLeft: "4px solid #0d9488", borderRadius: "0 14px 14px 0" }}>
            <p style={{ margin: 0, fontSize: "1.15rem", fontStyle: "italic", color: "#334155", lineHeight: 1.7, fontWeight: 500 }}>
              "{blog.excerpt}"
            </p>
          </div>
        )}

        {/* Main Article Body */}
        <div 
          style={{ 
            fontSize: "1.12rem", 
            lineHeight: 1.85, 
            color: "#334155", 
            whiteSpace: "pre-line", 
            marginBottom: 48,
            fontFamily: "inherit"
          }}
        >
          {blog.content}
        </div>

        {/* Multi-Image Gallery (if article has multiple images) */}
        {allImages.length > 1 && (
          <div style={{ margin: "48px 0", padding: "28px", background: "#f8fafc", borderRadius: 20, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <ImageIcon size={18} color="#0d9488" />
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>Photo Gallery ({allImages.length} Images)</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {allImages.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedGalleryImage(img)}
                  style={{ 
                    position: "relative", 
                    height: 150, 
                    borderRadius: 12, 
                    overflow: "hidden", 
                    cursor: "pointer", 
                    border: "1px solid #cbd5e1",
                    background: "#0f172a",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.06)",
                    transition: "transform 0.2s ease"
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  <img src={img} alt={`Gallery ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s ease" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    <span style={{ background: "rgba(255,255,255,0.9)", color: "#0f172a", padding: "4px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700 }}>Click to Expand</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Lightbox for Gallery Image Click */}
        {selectedGalleryImage && (
          <div 
            onClick={() => setSelectedGalleryImage(null)} 
            style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.9)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
              <img src={selectedGalleryImage} alt="Expanded preview" style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 12, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }} />
              <button 
                onClick={() => setSelectedGalleryImage(null)} 
                style={{ position: "absolute", top: -14, right: -14, width: 36, height: 36, borderRadius: "50%", background: "#ffffff", border: "none", color: "#0f172a", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Appointment CTA Banner */}
        <div style={{ margin: "50px 0", padding: "36px 32px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: 24, color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, boxShadow: "0 20px 35px -10px rgba(15, 23, 42, 0.3)" }}>
          <div style={{ maxWidth: 500 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5eead4" }}>TRANSFORM YOUR LOOK</span>
            <h3 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "6px 0 10px", color: "#ffffff" }}>Ready for Your Luxury Experience?</h3>
            <p style={{ margin: 0, fontSize: "0.92rem", color: "#94a3b8", lineHeight: 1.6 }}>Book your session with our certified stylists today and discover personalized care tailored exclusively for you.</p>
          </div>
          <Link 
            to={`/site/${salonSlug}/book`} 
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)", color: "#ffffff", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: "0.95rem", boxShadow: "0 10px 20px rgba(13, 148, 136, 0.3)" }}
          >
            Book Appointment <ArrowRight size={16} />
          </Link>
        </div>

        {/* Footer Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 30, borderTop: "1px solid #e2e8f0" }}>
          <Link 
            to={`/site/${salonSlug}/blog`} 
            style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#475569", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}
          >
            <ArrowLeft size={16} /> Back to All Articles
          </Link>

          <button
            onClick={handleWhatsAppShare}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#15803d", background: "none", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}
          >
            <Share2 size={16} /> Share Article
          </button>
        </div>

        {/* Related Articles Section */}
        {relatedBlogs.length > 0 && (
          <div style={{ marginTop: 60, paddingTop: 40, borderTop: "2px dashed #e2e8f0" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>More Stories from our Journal</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              {relatedBlogs.map((rel) => {
                let relImg = rel.imageUrl;
                if (!relImg && Array.isArray(rel.images) && rel.images.length > 0) relImg = rel.images[0];
                return (
                  <Link 
                    key={rel.slug || rel.id} 
                    to={`/site/${salonSlug}/blog/${rel.slug}`} 
                    style={{ textDecoration: "none", color: "inherit", background: "#f8fafc", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}
                  >
                    {relImg && (
                      <div style={{ height: 140, background: "#0f172a", overflow: "hidden" }}>
                        <img src={relImg} alt={rel.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                    <div style={{ padding: 16, display: "flex", flexDirection: "column", flex: 1 }}>
                      <h4 style={{ margin: "0 0 8px", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{rel.title}</h4>
                      <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5, flex: 1 }}>
                        {rel.excerpt || (rel.content ? rel.content.replace(/<[^>]*>?/gm, '').substring(0, 80) + '...' : '')}
                      </p>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0d9488", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        Read Article <ArrowRight size={13} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </article>

    </div>
  );
}

