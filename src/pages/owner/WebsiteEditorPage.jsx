import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import { 
  Palette, 
  LayoutTemplate, 
  Info, 
  Image as ImageIcon, 
  Star, 
  Phone, 
  Clock, 
  Search, 
  Monitor, 
  Tablet, 
  Smartphone, 
  ExternalLink,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  Upload,
  Globe, MessageCircle, FileText, Edit2, CheckCircle, XCircle, Loader2
} from "lucide-react";
import "./WebsiteEditorPage.css";

const LUXURY_THEMES = [
  { name: "Royal Gold", hex: "#c8a97e", desc: "Classic gold luxury" },
  { name: "Rose Blush", hex: "#e07a98", desc: "Warm feminine glow" },
  { name: "Emerald Spa", hex: "#059669", desc: "Fresh organic botanical" },
  { name: "Midnight Luxe", hex: "#1e293b", desc: "Sleek dark modern" },
  { name: "Royal Orchid", hex: "#9333ea", desc: "Deep rich violet" },
  { name: "Ruby Glamour", hex: "#e11d48", desc: "Bold vibrant energy" },
  { name: "Ocean Breeze", hex: "#0284c7", desc: "Crisp contemporary blue" },
  { name: "Obsidian", hex: "#171717", desc: "Minimalist black & white" }
];

const emptyConfig = {
  salonName: "",
  logoUrl: "",
  primaryColor: "#c8a97e",
  heroTitle: "Experience True Elegance",
  heroSubtitle: "Redefining beauty and grooming. Step into a world of sophisticated care and let our expert stylists craft your perfect look with absolute precision.",
  heroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80",
  heroBtnText: "Book Appointment",
  aboutTitle: "The Art of Grooming",
  aboutDescription: "At our salon, we approach self-care with precision and professionalism. Established with the vision of providing a sanctuary for relaxation and transformation, our salon offers a curated menu of premium services.",
  aboutImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1000&q=80",
  galleryImages: [
    "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=800&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
    "https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=600&q=80",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80"
  ],
  testimonials: [
    { author: "Priya Sharma", text: "Absolutely phenomenal service. The attention to detail is unmatched.", rating: 5 },
    { author: "Rahul Verma", text: "A truly premium experience from start to finish. Highly recommend!", rating: 5 },
    { author: "Anjali Patel", text: "I've never felt more pampered. Best salon I've ever visited!", rating: 5 }
  ],
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  socialInstagram: "",
  socialFacebook: "",
  socialWhatsapp: "",
  businessHours: "Mon - Sat: 10:00 AM - 08:00 PM | Sunday: 11:00 AM - 06:00 PM",
  metaTitle: "",
  metaDescription: ""
};

export default function WebsiteEditorPage() {
  const { auth } = useAuth();
  const [config, setConfig] = useState(emptyConfig);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState("branding");
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [status, setStatus] = useState({ error: "", success: "" });
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [forceMobileView, setForceMobileView] = useState(false);
  const iframeRef = useRef(null);

  const slug = config.slug || auth?.membership?.salon?.slug || auth?.membership?.salonSlug || auth?.salon?.slug || auth?.user?.salon?.slug || auth?.user?.salonSlug || "";

  // Load Website Settings
  useEffect(() => {
    let active = true;
    api.get("/owner/website/config").then((res) => {
      if (!active) return;
      const d = res.data || {};
      setConfig(prev => {
        const next = { ...prev };
        Object.keys(d).forEach(k => {
          if (d[k] !== undefined && d[k] !== null && d[k] !== "") next[k] = d[k];
        });
        return next;
      });
    }).catch(() => {
      if (!active) return;
      setStatus({ error: "Could not load website settings", success: "" });
    });
    return () => { active = false; };
  }, []);

  // Update Config Field
  const update = (key, val) => {
    setConfig(prev => {
      const next = { ...prev, [key]: val };
      // Broadcast instant live update to preview iframe
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_WEBSITE_CONFIG', config: next }, '*');
      }
      return next;
    });
  };

  // Helper to ensure any base64 image is uploaded to server CDN
  const ensureUploadedUrl = async (val) => {
    if (typeof val !== "string" || !val.startsWith("data:image/")) return val;
    try {
      const res = await fetch(val);
      const blob = await res.blob();
      const file = new File([blob], "image.jpg", { type: blob.type || "image/jpeg" });
      const formData = new FormData();
      formData.append("image", file);
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return uploadRes.data?.url || val;
    } catch (e) {
      console.warn("Base64 upload conversion fallback:", e);
      return val;
    }
  };

  // Save Website Config
  const handleSave = async () => {
    setSaving(true);
    setStatus({ error: "", success: "" });
    try {
      // Clean and ensure any base64 images are converted to lightweight uploaded URLs
      const cleanConfig = { ...config };
      if (cleanConfig.logoUrl && cleanConfig.logoUrl.startsWith("data:image/")) {
        cleanConfig.logoUrl = await ensureUploadedUrl(cleanConfig.logoUrl);
      }
      if (cleanConfig.heroImage && cleanConfig.heroImage.startsWith("data:image/")) {
        cleanConfig.heroImage = await ensureUploadedUrl(cleanConfig.heroImage);
      }
      if (cleanConfig.aboutImage && cleanConfig.aboutImage.startsWith("data:image/")) {
        cleanConfig.aboutImage = await ensureUploadedUrl(cleanConfig.aboutImage);
      }
      if (Array.isArray(cleanConfig.galleryImages)) {
        cleanConfig.galleryImages = await Promise.all(
          cleanConfig.galleryImages.map(img => ensureUploadedUrl(img))
        );
      }

      await api.post("/owner/website/config", cleanConfig);
      setConfig(cleanConfig);
      setStatus({ error: "", success: "Website changes published successfully!" });
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_WEBSITE_CONFIG', config: cleanConfig }, '*');
      }
      setTimeout(() => setStatus({ error: "", success: "" }), 3000);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Publish failed"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  // Handle Image Upload (Uploads directly to /upload for clean URL)
  const handleFileUpload = async (file, callback) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ error: "Image size should be under 10MB.", success: "" });
      return;
    }
    setStatus({ error: "", success: "Uploading image..." });
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const url = res.data?.url;
      if (url) {
        callback(url);
        setStatus({ error: "", success: "Image uploaded successfully!" });
        setTimeout(() => setStatus({ error: "", success: "" }), 2500);
      } else {
        setStatus({ error: "Failed to get uploaded image URL.", success: "" });
      }
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to upload image. Please try a smaller image."), success: "" });
    }
  };

  // Add Gallery Image from URL
  const addGalleryUrl = () => {
    if (!galleryUrlInput.trim()) return;
    update("galleryImages", [...(config.galleryImages || []), galleryUrlInput.trim()]);
    setGalleryUrlInput("");
  };

  // Switch Category Tab & Auto-Scroll Preview iframe to that section
  const handleSelectCategory = (catId) => {
    setActiveCategory(catId);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SCROLL_TO_SECTION', section: catId }, '*');
    }
  };

  const navCategories = [
    { id: "branding", label: "Theme & Brand", icon: <Palette size={16} /> },
    { id: "hero", label: "Hero Banner", icon: <LayoutTemplate size={16} /> },
    { id: "about", label: "About Story", icon: <Info size={16} /> },
    { id: "blogs", label: "Storefront Blogs", icon: <FileText size={16} /> },
    { id: "gallery", label: "Photo Gallery", icon: <ImageIcon size={16} /> },
    { id: "reviews", label: "Client Reviews", icon: <Star size={16} /> },
    { id: "contact", label: "Contact & Social", icon: <Phone size={16} /> },
    { id: "hours", label: "Business Hours", icon: <Clock size={16} /> },
    { id: "seo", label: "SEO & Meta", icon: <Globe size={16} /> }
  ];

  return (
    <div className="we-root" style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", position: "relative" }}>
      <style>{`
        @media (max-width: 900px) {
          .we-left-panel {
            width: 100% !important;
            flex: 1 1 100% !important;
          }
          .we-right-preview {
            display: none !important;
          }
          .we-mobile-splash {
            display: flex !important;
          }
        }
        @media (min-width: 901px) {
          .we-mobile-splash {
            display: none !important;
          }
        }
      `}</style>

      {/* ── Mobile Notice Overlay Screen (for screens <= 900px) ── */}
      {!forceMobileView && (
        <div 
          className="we-mobile-splash" 
          style={{
            display: "none",
            position: "absolute",
            inset: 0,
            zIndex: 9999,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            padding: "32px 20px",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center"
          }}
        >
          <div style={{ maxWidth: 440, width: "100%", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", backdropFilter: "blur(16px)", padding: "36px 24px", borderRadius: 28, boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(94, 234, 212, 0.15)", border: "1px solid rgba(94, 234, 212, 0.3)", color: "#5eead4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Monitor size={36} />
            </div>

            <div style={{ display: "inline-block", padding: "4px 12px", background: "rgba(255,255,255,0.1)", borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#5eead4", textTransform: "uppercase", marginBottom: 12 }}>
              DESKTOP RECOMMENDED
            </div>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 12px", color: "#ffffff", letterSpacing: "-0.02em" }}>
              Design on Desktop for the Best Experience
            </h2>

            <p style={{ fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.6, margin: "0 0 28px" }}>
              Website Builder includes a live side-by-side interactive storefront preview with theme presets and responsive canvas. For optimal design accuracy, please open this page on a desktop or laptop.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {slug && (
                <a 
                  href={`/site/${slug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "14px 20px",
                    borderRadius: 100,
                    background: "#0d9488",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(13,148,136,0.3)"
                  }}
                >
                  <span>View Live Storefront</span>
                  <ExternalLink size={16} />
                </a>
              )}

              <button
                type="button"
                onClick={() => setForceMobileView(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 20px",
                  borderRadius: 100,
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                Continue & Edit on Mobile Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Left Editor Panel ── */}
      <div className="we-left-panel" style={{ width: "460px", background: "#ffffff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 10, boxShadow: "4px 0 20px rgba(0,0,0,0.03)" }}>
        
        {/* Panel Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>Website Builder</h2>
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>Live Storefront Customizer</span>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            style={{ 
              display: "flex", alignItems: "center", gap: "8px", background: "#0f172a", color: "#ffffff", border: "none", padding: "8px 18px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "all 0.2s" 
            }}
          >
            {saving ? <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> : null}
            {saving ? "Publishing..." : "Publish Changes"}
          </button>
        </div>

        {/* Status Alerts */}
        {status.error && <div style={{ padding: "10px 20px", background: "#fef2f2", color: "#dc2626", fontSize: "0.8rem", fontWeight: 600, borderBottom: "1px solid #fecaca" }}>{status.error}</div>}
        {status.success && <div style={{ padding: "10px 20px", background: "#f0fdf4", color: "#16a34a", fontSize: "0.8rem", fontWeight: 600, borderBottom: "1px solid #bbf7d0" }}>{status.success}</div>}

        {/* Category Tabs (Horizontal Pills) */}
        <div style={{ display: "flex", gap: "6px", padding: "12px 16px", borderBottom: "1px solid #f1f5f9", overflowX: "auto", background: "#f8fafc" }}>
          {navCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "20px",
                border: activeCategory === cat.id ? "1px solid #0f172a" : "1px solid #e2e8f0",
                background: activeCategory === cat.id ? "#0f172a" : "#ffffff",
                color: activeCategory === cat.id ? "#ffffff" : "#475569",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Scrollable Form Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

          {/* 1. BRANDING & THEME */}
          {activeCategory === "branding" && (
            <div style={{ display: "grid", gap: "20px" }}>
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>Curated Theme Presets</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                  {LUXURY_THEMES.map(theme => (
                    <button
                      key={theme.hex}
                      onClick={() => update("primaryColor", theme.hex)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: config.primaryColor === theme.hex ? "2px solid #0f172a" : "1px solid #e2e8f0",
                        background: "#ffffff",
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                    >
                      <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: theme.hex, flexShrink: 0, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)" }} />
                      <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1e293b" }}>{theme.name}</div>
                        <div style={{ fontSize: "0.65rem", color: "#64748b" }}>{theme.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Custom Accent Color (Hex)</label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input 
                    type="color" 
                    value={config.primaryColor || "#c8a97e"} 
                    onChange={e => update("primaryColor", e.target.value)} 
                    style={{ width: "40px", height: "40px", padding: 0, border: "none", borderRadius: "8px", cursor: "pointer", background: "none" }} 
                  />
                  <input 
                    type="text" 
                    value={config.primaryColor || ""} 
                    onChange={e => update("primaryColor", e.target.value)} 
                    placeholder="#c8a97e" 
                    style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Salon Logo</label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "contain", background: "#f1f5f9", padding: "4px", border: "1px solid #cbd5e1" }} />
                  ) : (
                    <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.75rem", border: "1px dashed #cbd5e1" }}>Logo</div>
                  )}
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #cbd5e1", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>
                    <Upload size={14} /> Upload Logo
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files?.[0], url => update("logoUrl", url))} />
                  </label>
                  {config.logoUrl && (
                    <button onClick={() => update("logoUrl", "")} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.8rem", cursor: "pointer" }}>Remove</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. HERO BANNER */}
          {activeCategory === "hero" && (
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Main Headline</label>
                <input 
                  type="text" 
                  value={config.heroTitle || ""} 
                  onChange={e => update("heroTitle", e.target.value)} 
                  placeholder="Experience True Elegance" 
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Subtitle Description</label>
                <textarea 
                  rows={3} 
                  value={config.heroSubtitle || ""} 
                  onChange={e => update("heroSubtitle", e.target.value)} 
                  placeholder="Redefining beauty and grooming..." 
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", resize: "vertical" }} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Hero Background Image</label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #cbd5e1", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>
                    <Upload size={14} /> Upload Banner
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files?.[0], url => update("heroImage", url))} />
                  </label>
                  {config.heroImage && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <img src={config.heroImage} alt="Banner" style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover", border: "1px solid #cbd5e1" }} />
                      <button onClick={() => update("heroImage", "")} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>Remove</button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Primary Button Label</label>
                <input 
                  type="text" 
                  value={config.heroBtnText || ""} 
                  onChange={e => update("heroBtnText", e.target.value)} 
                  placeholder="Book Appointment" 
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} 
                />
              </div>
            </div>
          )}

          {/* 3. ABOUT STORY */}
          {activeCategory === "about" && (
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Section Title</label>
                <input 
                  type="text" 
                  value={config.aboutTitle || ""} 
                  onChange={e => update("aboutTitle", e.target.value)} 
                  placeholder="The Art of Grooming" 
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Salon Story & Philosophy</label>
                <textarea 
                  rows={4} 
                  value={config.aboutDescription || ""} 
                  onChange={e => update("aboutDescription", e.target.value)} 
                  placeholder="At our salon, we approach self-care with precision..." 
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", resize: "vertical" }} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>About Feature Image</label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #cbd5e1", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>
                    <Upload size={14} /> Upload Image
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files?.[0], url => update("aboutImage", url))} />
                  </label>
                  {config.aboutImage && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <img src={config.aboutImage} alt="About" style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover", border: "1px solid #cbd5e1" }} />
                      <button onClick={() => update("aboutImage", "")} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>Remove</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

                    {/* 3.5 STOREFRONT BLOGS */}
          {activeCategory === "blogs" && (
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>Storefront Articles</h3>
                  <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748b" }}>Publish blogs and insights on your mini website.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenBlogModal()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(15,23,42,0.15)"
                  }}
                >
                  <Plus size={15} /> Add Article
                </button>
              </div>

              <div style={{ position: "relative", width: "100%" }}>
                <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="Search articles by title or author..."
                  value={blogSearch}
                  onChange={(e) => setBlogSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 30px 8px 32px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "0.8rem",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                {blogSearch && (
                  <button
                    type="button"
                    onClick={() => setBlogSearch("")}
                    style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}
                  >
                    <XCircle size={14} />
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {blogLoading ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>Loading articles...</div>
                ) : blogs.filter(b => (b.title || "").toLowerCase().includes(blogSearch.toLowerCase()) || (b.author || "").toLowerCase().includes(blogSearch.toLowerCase())).length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                    <FileText size={28} color="#94a3b8" style={{ marginBottom: "6px" }} />
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>No blog articles found</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>Click "Add Article" above to create your first post.</div>
                  </div>
                ) : (
                  blogs
                    .filter(b => (b.title || "").toLowerCase().includes(blogSearch.toLowerCase()) || (b.author || "").toLowerCase().includes(blogSearch.toLowerCase()))
                    .map(blog => (
                      <div
                        key={blog.id}
                        style={{
                          display: "flex",
                          gap: "12px",
                          padding: "12px",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          background: "#ffffff",
                          alignItems: "center",
                          justifyContent: "space-between",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                        }}
                      >
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", minWidth: 0 }}>
                          {blog.imageUrl ? (
                            <img src={blog.imageUrl} alt="" style={{ width: "42px", height: "42px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: "42px", height: "42px", borderRadius: "6px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", flexShrink: 0 }}>
                              <FileText size={18} />
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {blog.title}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{blog.author || "Admin"}</span>
                              <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#cbd5e1" }} />
                              {blog.published ? (
                                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#166534", background: "#dcfce7", padding: "1px 6px", borderRadius: "4px" }}>Published</span>
                              ) : (
                                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#92400e", background: "#fef3c7", padding: "1px 6px", borderRadius: "4px" }}>Draft</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenBlogModal(blog)}
                            style={{ background: "#f1f5f9", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer", color: "#475569" }}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBlog(blog.id)}
                            style={{ background: "#fee2e2", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer", color: "#b91c1c" }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* 4. PHOTO GALLERY */}
          {activeCategory === "gallery" && (
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {(config.galleryImages || []).map((img, idx) => (
                  <div key={idx} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", aspectRatio: "1/1", border: "1px solid #e2e8f0" }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button 
                      onClick={() => update("galleryImages", config.galleryImages.filter((_, i) => i !== idx))} 
                      style={{ position: "absolute", top: "4px", right: "4px", width: "22px", height: "22px", borderRadius: "50%", background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                
                <label style={{ borderRadius: "8px", border: "2px dashed #cbd5e1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", aspectRatio: "1/1", cursor: "pointer", background: "#f8fafc", color: "#64748b" }}>
                  <Upload size={20} />
                  <span style={{ fontSize: "0.7rem", marginTop: "4px", fontWeight: 600 }}>Upload Photo</span>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files?.[0], url => update("galleryImages", [...(config.galleryImages || []), url]))} />
                </label>
              </div>
            </div>
          )}

          {/* 5. CLIENT REVIEWS */}
          {activeCategory === "reviews" && (
            <div style={{ display: "grid", gap: "16px" }}>
              {(config.testimonials || []).map((t, idx) => (
                <div key={idx} style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>Review #{idx + 1}</span>
                    <button 
                      onClick={() => update("testimonials", config.testimonials.filter((_, i) => i !== idx))} 
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={t.author || ""} 
                    onChange={e => {
                      const list = [...config.testimonials];
                      list[idx] = { ...list[idx], author: e.target.value };
                      update("testimonials", list);
                    }} 
                    placeholder="Customer Name (e.g. Priya S.)" 
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", marginBottom: "8px" }} 
                  />
                  <textarea 
                    rows={2} 
                    value={t.text || ""} 
                    onChange={e => {
                      const list = [...config.testimonials];
                      list[idx] = { ...list[idx], text: e.target.value };
                      update("testimonials", list);
                    }} 
                    placeholder="Client Feedback..." 
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", resize: "vertical" }} 
                  />
                  <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star} 
                        onClick={() => {
                          const list = [...config.testimonials];
                          list[idx] = { ...list[idx], rating: star };
                          update("testimonials", list);
                        }}
                        style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: (t.rating || 5) >= star ? "#f59e0b" : "#cbd5e1" }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button 
                onClick={() => update("testimonials", [...(config.testimonials || []), { author: "", text: "", rating: 5 }])} 
                style={{ padding: "10px", borderRadius: "8px", border: "1px dashed #0f172a", background: "#f8fafc", color: "#0f172a", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Plus size={16} /> Add Client Review
              </button>
            </div>
          )}

          {/* 6. CONTACT & SOCIAL */}
          {activeCategory === "contact" && (
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Phone Number</label>
                <input 
                  type="text" 
                  value={config.contactPhone || ""} 
                  onChange={e => update("contactPhone", e.target.value)} 
                  placeholder="+91 98765 43210" 
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Email Address</label>
                <input 
                  type="email" 
                  value={config.contactEmail || ""} 
                  onChange={e => update("contactEmail", e.target.value)} 
                  placeholder="contact@yoursalon.com" 
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Salon Address</label>
                <textarea 
                  rows={2} 
                  value={config.contactAddress || ""} 
                  onChange={e => update("contactAddress", e.target.value)} 
                  placeholder="123 Luxury Boulevard, Bandra West, Mumbai" 
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", resize: "vertical" }} 
                />
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                  <MessageCircle size={16} color="#25D366" /> WhatsApp Floating Chat Button
                </h4>
                <p style={{ margin: "0 0 10px", fontSize: "0.75rem", color: "#64748b" }}>
                  A floating WhatsApp button will appear on the bottom-right corner of your live website.
                </p>
                <div>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", background: "#ffffff" }}>
                    <div style={{ padding: "10px 12px", background: "#f1f5f9", borderRight: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input 
                      type="text" 
                      value={config.socialWhatsapp ? config.socialWhatsapp.replace(/^\+91\s*/, "").replace(/^91(?=\d{10})/, "") : ""} 
                      onChange={e => {
                        let val = e.target.value.trim();
                        val = val.replace(/^\+91\s*/, "").replace(/^91(?=\d{10})/, "");
                        update("socialWhatsapp", val);
                      }} 
                      placeholder="98765 43210" 
                      style={{ flex: 1, padding: "10px 14px", border: "none", fontSize: "0.85rem", outline: "none", background: "transparent" }} 
                    />
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "4px", display: "block" }}>
                    Enter 10-digit WhatsApp number (Fixed country code <strong>+91</strong>). Leave blank to use salon phone number.
                  </span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>Other Social Links</h4>
                <div style={{ display: "grid", gap: "10px" }}>
                  <input 
                    type="text" 
                    value={config.socialInstagram || ""} 
                    onChange={e => update("socialInstagram", e.target.value)} 
                    placeholder="Instagram Profile URL (https://instagram.com/...)" 
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} 
                  />
                  <input 
                    type="text" 
                    value={config.socialFacebook || ""} 
                    onChange={e => update("socialFacebook", e.target.value)} 
                    placeholder="Facebook Page URL (https://facebook.com/...)" 
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. BUSINESS HOURS */}
          {activeCategory === "hours" && (
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Operating Schedule Display</label>
                <textarea 
                  rows={3} 
                  value={config.businessHours || ""} 
                  onChange={e => update("businessHours", e.target.value)} 
                  placeholder="Mon - Sat: 10:00 AM - 08:00 PM | Sunday: 11:00 AM - 06:00 PM" 
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", resize: "vertical" }} 
                />
                <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", display: "block" }}>Displayed in your website footer and contact page.</span>
              </div>
            </div>
          )}

          {/* 8. SEO & META */}
          {activeCategory === "seo" && (
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Page Title Tag</label>
                <input 
                  type="text" 
                  value={config.metaTitle || ""} 
                  onChange={e => update("metaTitle", e.target.value)} 
                  placeholder="Luxury Salon & Spa | Best Grooming in Town" 
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Meta Description</label>
                <textarea 
                  rows={3} 
                  value={config.metaDescription || ""} 
                  onChange={e => update("metaDescription", e.target.value)} 
                  placeholder="Book premier haircuts, styling, facials, and spa treatments..." 
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", resize: "vertical" }} 
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Right Live Preview Area ── */}
      <div className="we-right-preview" style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0f172a", overflow: "hidden" }}>
        
        {/* Preview Top Toolbar */}
        <div style={{ padding: "12px 24px", background: "#1e293b", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          
          {/* Device Switcher */}
          <div style={{ display: "flex", background: "#0f172a", padding: "4px", borderRadius: "8px", border: "1px solid #334155" }}>
            <button 
              onClick={() => setPreviewDevice("desktop")} 
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", border: "none", background: previewDevice === "desktop" ? "#334155" : "none", color: previewDevice === "desktop" ? "#ffffff" : "#94a3b8", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
            >
              <Monitor size={14} /> Desktop
            </button>
            <button 
              onClick={() => setPreviewDevice("tablet")} 
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", border: "none", background: previewDevice === "tablet" ? "#334155" : "none", color: previewDevice === "tablet" ? "#ffffff" : "#94a3b8", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
            >
              <Tablet size={14} /> Tablet
            </button>
            <button 
              onClick={() => setPreviewDevice("mobile")} 
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", border: "none", background: previewDevice === "mobile" ? "#334155" : "none", color: previewDevice === "mobile" ? "#ffffff" : "#94a3b8", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
            >
              <Smartphone size={14} /> Mobile
            </button>
          </div>

          {/* External Live Link */}
          {slug && (
            <a 
              href={`/site/${slug}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ display: "flex", alignItems: "center", gap: "6px", color: "#38bdf8", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}
            >
              Open Live Storefront <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Live Preview Viewport Frame */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", overflow: "hidden" }}>
          <div 
            style={{
              width: previewDevice === "desktop" ? "100%" : (previewDevice === "tablet" ? "768px" : "390px"),
              height: "100%",
              borderRadius: previewDevice === "desktop" ? "0px" : "24px",
              overflow: "hidden",
              boxShadow: previewDevice === "desktop" ? "none" : "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              border: previewDevice === "desktop" ? "none" : "8px solid #334155",
              background: "#ffffff",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            {slug ? (
              <iframe
                ref={iframeRef}
                src={`/site/${slug}?preview=true`}
                style={{ width: "100%", height: "100%", border: "none", background: "#ffffff" }}
                onLoad={(e) => {
                  if (e.target.contentWindow) {
                    const msg = { type: 'UPDATE_WEBSITE_CONFIG', config };
                    e.target.contentWindow.postMessage(msg, '*');
                    const retry = (delay) => setTimeout(() => {
                      try { e.target.contentWindow?.postMessage(msg, '*'); } catch {}
                    }, delay);
                    retry(500);
                    retry(1500);
                    retry(3000);
                  }
                }}
                title="Storefront Live Preview"
              />
            ) : (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Loading Salon Preview...</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Blog Article Editor Modal */}
      {isBlogModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: "14px", width: "100%", maxWidth: "580px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>{editingBlog ? "Edit Blog Article" : "Create Blog Article"}</h2>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748b" }}>Publish on your public storefront blog page.</p>
              </div>
              <button type="button" onClick={() => setIsBlogModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}><XCircle size={22} /></button>
            </div>
            
            <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, color: "#334155", fontSize: "0.85rem" }}>Title *</label>
                <input name="title" value={blogFormData.title} onChange={handleBlogFormChange} placeholder="e.g. 5 Hair Care Secrets for Winter" style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, color: "#334155", fontSize: "0.85rem" }}>Slug *</label>
                <input name="slug" value={blogFormData.slug} onChange={handleBlogFormChange} placeholder="5-hair-care-secrets-for-winter" style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, color: "#334155", fontSize: "0.85rem" }}>Author</label>
                <input name="author" value={blogFormData.author} onChange={handleBlogFormChange} placeholder="e.g. Master Stylist Renu" style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, color: "#334155", fontSize: "0.85rem" }}>Featured Image</label>
                {blogFormData.imageUrl ? (
                  <div style={{ position: "relative", width: "100%", height: "160px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                    <img src={blogFormData.imageUrl} alt="Featured" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => setBlogFormData(prev => ({ ...prev, imageUrl: "" }))}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(15, 23, 42, 0.8)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "5px 10px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px 16px",
                    border: "2px dashed #cbd5e1",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    cursor: blogImageUploading ? "not-allowed" : "pointer",
                    textAlign: "center"
                  }}>
                    {blogImageUploading ? (
                      <>
                        <Loader2 size={22} color="#4f46e5" style={{ animation: "spin 1s linear infinite", marginBottom: "6px" }} />
                        <span style={{ fontSize: "0.8rem", color: "#4f46e5", fontWeight: 600 }}>Uploading image...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={22} color="#64748b" style={{ marginBottom: "6px" }} />
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>Click to upload featured image</span>
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>JPG, PNG, WEBP (Max 10MB)</span>
                        <input type="file" accept="image/*" onChange={handleBlogImageUpload} disabled={blogImageUploading} style={{ display: "none" }} />
                      </>
                    )}
                  </label>
                )}
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, color: "#334155", fontSize: "0.85rem" }}>Excerpt / Summary</label>
                <textarea name="excerpt" value={blogFormData.excerpt} onChange={handleBlogFormChange} rows={2} placeholder="Short summary displayed on cards..." style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, color: "#334155", fontSize: "0.85rem" }}>Content</label>
                <textarea name="content" value={blogFormData.content} onChange={handleBlogFormChange} rows={5} placeholder="Write your article here..." style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0" }}>
                <input type="checkbox" id="we_blog_pub" name="published" checked={blogFormData.published} onChange={handleBlogFormChange} style={{ width: "17px", height: "17px", cursor: "pointer" }} />
                <label htmlFor="we_blog_pub" style={{ fontWeight: 600, color: "#334155", fontSize: "0.85rem", cursor: "pointer" }}>Publish immediately on website</label>
              </div>
            </div>

            <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#f8fafc" }}>
              <button type="button" onClick={() => setIsBlogModalOpen(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={handleSaveBlog} disabled={!blogFormData.title} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#0f172a", color: "#fff", fontWeight: 600, fontSize: "0.82rem", cursor: blogFormData.title ? "pointer" : "not-allowed", opacity: blogFormData.title ? 1 : 0.6 }}>Save Article</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

