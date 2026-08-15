import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import { LayoutTemplate, Info, Image as ImageIcon, Sparkles, Star, Layout, Palette, Store, Smartphone, Monitor } from "lucide-react";
import "./WebsiteEditorPage.css";

const DEFAULT_SECTIONS = [
  { id: "hero", type: "hero", label: "Hero Banner", enabled: true, locked: true },
  { id: "about", type: "about", label: "About Us", enabled: true, locked: true },
  { id: "gallery", type: "gallery", label: "Photo Gallery", enabled: true, locked: true },
  { id: "services", type: "services", label: "Featured Services", enabled: true, locked: true },
  { id: "testimonials", type: "testimonials", label: "Client Reviews", enabled: true, locked: false },
  { id: "contact", type: "contact", label: "Contact Info", enabled: true, locked: false }
];

const iconMap = {
  hero: <LayoutTemplate size={16} />,
  about: <Info size={16} />,
  gallery: <ImageIcon size={16} />,
  services: <Sparkles size={16} />,
  testimonials: <Star size={16} />,
  contact: <Info size={16} />
};

const COLOR_PRESETS = [
  "#c8a97e", "#b08d57", "#d4a574", "#e8c99b", "#a67c52",
  "#1a1a2e", "#16213e", "#0f3460", "#2b2d42", "#1b1b2f",
  "#e94560", "#c2185b", "#d81b60", "#ad1457", "#880e4f",
  "#533483", "#7b1fa2", "#6a1b9a", "#4a148c", "#311b92",
  "#0077b6", "#023e8a", "#001d3d", "#006d77", "#0096c7",
  "#2d6a4f", "#40916c", "#52b788", "#6b705c", "#a5a58d"
];

const emptyConfig = {
  salonName: "",
  logoUrl: "",
  heroTitle: "Experience True Elegance",
  heroSubtitle: "Redefining beauty and grooming. Step into a world of sophisticated care and let our expert stylists craft your perfect look with absolute precision.",
  heroImage: "",
  heroBtnText: "Book Appointment",
  aboutTitle: "The Art of Grooming",
  aboutDescription: "",
  aboutImage: "",
  galleryImages: [],
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  testimonials: [],
  primaryColor: "#c8a97e"
};

function Field({ label, children, hint }) {
  return (
    <div className="we-field">
      {label && <label className="we-label">{label}</label>}
      {children}
      {hint && <span className="we-hint">{hint}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder, ...rest }) {
  return <input className="we-input" value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} {...rest} />;
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return <textarea className="we-input we-textarea" value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
}

function ColorField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label}>
      <div className="we-color-row">
        <div className="we-color-swatch-wrap" onClick={() => setOpen(!open)}>
          <div className="we-color-swatch" style={{ background: value || "#ccc" }} />
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </div>
        <input type="color" className="we-color-native" value={value || "#000000"} onChange={e => onChange(e.target.value)} />
        <input className="we-input we-color-hex" value={value || ""} onChange={e => onChange(e.target.value)} placeholder="#c8a97e" />
      </div>
      {open && (
        <div className="we-color-palette">
          {COLOR_PRESETS.map(c => (
            <button key={c} className="we-color-dot" style={{ background: c, outline: value === c ? "2px solid #111" : "none", outlineOffset: 2 }} onClick={() => { onChange(c); setOpen(false); }} />
          ))}
        </div>
      )}
    </Field>
  );
}

function ImageField({ label, value, onChange, hint }) {
  const ref = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <Field label={label} hint={hint}>
      <div className={`we-image-drop ${dragOver ? "drag-over" : ""}`} onClick={() => ref.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}>
        <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
        {value ? (
          <img src={value} alt="" className="we-image-preview" />
        ) : (
          <div className="we-image-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
            <span>Click or drag image</span>
          </div>
        )}
      </div>
      <input className="we-input" value={value || ""} onChange={e => onChange(e.target.value)} placeholder="https://... or paste URL" style={{ marginTop: 6 }} />
    </Field>
  );
}

function SectionBlock({ icon, title, badge, children, defaultOpen = true, className = "" }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`we-section ${className} ${open ? "open" : ""}`}>
      <button className="we-section-header" onClick={() => setOpen(!open)}>
        <div className="we-section-header-left">
          <span className="we-section-icon">{icon}</span>
          <span className="we-section-title">{title}</span>
          {badge && <span className="we-section-badge">{badge}</span>}
        </div>
        <svg className={`we-section-chevron ${open ? "rotated" : ""}`} width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
      {open && <div className="we-section-body">{children}</div>}
    </div>
  );
}

function LivePreview({ config, slug, device }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_WEBSITE_CONFIG', config }, '*');
    }
  }, [config]);

  if (!slug) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#64748b", background: "#f8fafc", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #cbd5e1", borderTopColor: "#2563eb", animation: "spin 0.8s linear infinite" }} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>Loading live website preview...</div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={`/site/${slug}?preview=true`}
      style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
      onLoad={(e) => {
        if (e.target.contentWindow) {
          e.target.contentWindow.postMessage({ type: 'UPDATE_WEBSITE_CONFIG', config }, '*');
        }
      }}
      title="Live Preview"
    />
  );
}

export default function WebsiteEditorPage() {
  const { auth } = useAuth();
  const [config, setConfig] = useState(emptyConfig);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [saving, setSaving] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [status, setStatus] = useState({ error: "", success: "" });
  const [activeTab, setActiveTab] = useState("sections");
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const slug = config.slug || auth?.membership?.salon?.slug || auth?.membership?.salonSlug || auth?.salon?.slug || auth?.user?.salon?.slug || auth?.user?.salonSlug || "";

  useEffect(() => {
    let active = true;
    api.get("/owner/website/config").then((res) => {
      if (!active) return;
      const d = res.data || {};
      setConfig(prev => {
        const next = { ...prev };
        Object.keys(d).forEach(k => {
          if (d[k] !== undefined && d[k] !== null) next[k] = d[k];
        });
        return next;
      });
      if (d.sections && Array.isArray(d.sections) && d.sections.length > 0) {
        const merged = d.sections.map(s => {
          const def = DEFAULT_SECTIONS.find(ds => ds.type === s.type);
          return { ...def, ...s };
        });
        const newTypes = DEFAULT_SECTIONS.filter(ds => !merged.find(m => m.type === ds.type));
        setSections([...merged, ...newTypes]);
      }
    }).catch(() => {
      if (!active) return;
      setStatus({ error: "Could not load editor settings", success: "" });
    });
    return () => { active = false; };
  }, []);

  const update = (key, val) => setConfig(c => ({ ...c, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setStatus({ error: "", success: "" });
    try {
      await api.post("/owner/website/config", { ...config, sections });
      setIframeKey(Date.now());
      setStatus({ error: "", success: "Published!" });
      setTimeout(() => setStatus({ error: "", success: "" }), 3000);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Publish failed"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (id) => setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));

  const handleDragStart = (idx) => { dragItem.current = idx; };
  const handleDragEnter = (idx) => { dragOverItem.current = idx; };
  const handleDragEnd = () => {
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from !== null && to !== null && from !== to) {
      const copy = [...sections];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      setSections(copy);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const enabledCount = sections.filter(s => s.enabled).length;

  const renderSectionEditor = () => {
    return (
      <>
        {sections.find(s => s.type === "hero")?.enabled && (
          <SectionBlock icon={<LayoutTemplate size={16} />} title="Hero Banner" badge="Main" defaultOpen={true}>
            <Field label="Headline"><Input value={config.heroTitle} onChange={v => update("heroTitle", v)} placeholder="Experience True Elegance" /></Field>
            <Field label="Subtitle"><Textarea value={config.heroSubtitle} onChange={v => update("heroSubtitle", v)} placeholder="Redefining beauty and grooming..." rows={2} /></Field>
            <ImageField label="Background Image" value={config.heroImage} onChange={v => update("heroImage", v)} hint="1920 x 800" />
            <Field label="Button Text"><Input value={config.heroBtnText} onChange={v => update("heroBtnText", v)} placeholder="Book Appointment" /></Field>
          </SectionBlock>
        )}

        {sections.find(s => s.type === "about")?.enabled && (
          <SectionBlock icon={<Info size={16} />} title="About Us" defaultOpen={false}>
            <Field label="Title"><Input value={config.aboutTitle} onChange={v => update("aboutTitle", v)} placeholder="The Art of Grooming" /></Field>
            <Field label="Description"><Textarea value={config.aboutDescription} onChange={v => update("aboutDescription", v)} rows={3} placeholder="At our salon, we approach self-care with precision..." /></Field>
            <ImageField label="About Image" value={config.aboutImage} onChange={v => update("aboutImage", v)} hint="800 x 600" />
          </SectionBlock>
        )}

        {sections.find(s => s.type === "gallery")?.enabled && (
          <SectionBlock icon={<ImageIcon size={16} />} title="Photo Gallery" badge={`${config.galleryImages?.length || 0} photos`} defaultOpen={false}>
            <div className="we-gallery-grid">
              {(config.galleryImages || []).map((img, idx) => (
                <div key={idx} className="we-gallery-thumb">
                  <img src={img} alt="" />
                  <button className="we-gallery-remove" onClick={() => update("galleryImages", config.galleryImages.filter((_, i) => i !== idx))}>&times;</button>
                </div>
              ))}
              <label className="we-gallery-add">
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => update("galleryImages", [...(config.galleryImages || []), ev.target.result]);
                  reader.readAsDataURL(file);
                }} />
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="10" y1="4" x2="10" y2="16" /><line x1="4" y1="10" x2="16" y2="10" /></svg>
              </label>
            </div>
          </SectionBlock>
        )}

        {sections.find(s => s.type === "services")?.enabled && (
          <SectionBlock icon={<Sparkles size={16} />} title="Featured Services" badge="Auto" defaultOpen={false}>
            <div className="we-info-box">Auto-populated from active salon services on your menu.</div>
          </SectionBlock>
        )}

        {sections.find(s => s.type === "testimonials")?.enabled && (
          <SectionBlock icon={<Star size={16} />} title="Client Reviews" badge={config.testimonials?.length || 0} defaultOpen={false}>
            {(config.testimonials || []).map((t, idx) => (
              <div key={idx} className="we-review-item">
                <div className="we-review-header">
                  <span className="we-review-num">#{idx + 1}</span>
                  <button className="we-review-delete" onClick={() => update("testimonials", config.testimonials.filter((_, i) => i !== idx))}>&times;</button>
                </div>
                <Field label="Author"><Input value={t.author} onChange={v => { const c = [...config.testimonials]; c[idx] = { ...c[idx], author: v }; update("testimonials", c); }} placeholder="John D." /></Field>
                <Field label="Review"><Textarea value={t.text} onChange={v => { const c = [...config.testimonials]; c[idx] = { ...c[idx], text: v }; update("testimonials", c); }} rows={2} /></Field>
                <Field label="Rating">
                  <div className="we-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} className={`we-star ${(t.rating || 5) >= star ? "active" : ""}`} onClick={() => { const c = [...config.testimonials]; c[idx] = { ...c[idx], rating: star }; update("testimonials", c); }}>&#9733;</button>
                    ))}
                  </div>
                </Field>
              </div>
            ))}
            <button className="we-add-btn" onClick={() => update("testimonials", [...(config.testimonials || []), { author: "", text: "", rating: 5 }])}>+ Add Review</button>
          </SectionBlock>
        )}

        {sections.find(s => s.type === "contact")?.enabled && (
          <SectionBlock icon={<Info size={16} />} title="Contact & Location" defaultOpen={false}>
            <Field label="Phone"><Input value={config.contactPhone} onChange={v => update("contactPhone", v)} placeholder="+91 98765 43210" /></Field>
            <Field label="Email"><Input value={config.contactEmail} onChange={v => update("contactEmail", v)} placeholder="info@salon.com" /></Field>
            <Field label="Address"><Textarea value={config.contactAddress} onChange={v => update("contactAddress", v)} rows={2} placeholder="123 Elegance Avenue..." /></Field>
          </SectionBlock>
        )}
      </>
    );
  };

  return (
    <div className="we-root">
      <div className="we-sidebar">
        <div className="we-sidebar-header">
          <div className="we-sidebar-title">
            <h2>Website Editor</h2>
            <span className="we-sidebar-slug">{config.salonName || "Salon"} &mdash; {slug}</span>
          </div>
          <button className="we-publish-btn" onClick={handleSave} disabled={saving}>
            {saving ? <span className="we-spinner" /> : null}
            {saving ? "Publishing..." : "Publish"}
          </button>
        </div>

        {status.error && <div className="we-toast we-toast-error">{status.error}</div>}
        {status.success && <div className="we-toast we-toast-success">{status.success}</div>}

        <div className="we-tabs">
          <button className={`we-tab ${activeTab === "sections" ? "active" : ""}`} onClick={() => setActiveTab("sections")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="14" height="4" rx="1" /><rect x="1" y="7" width="14" height="4" rx="1" /><rect x="1" y="13" width="14" height="2" rx="1" /></svg>
            Sections
          </button>
          <button className={`we-tab ${activeTab === "design" ? "active" : ""}`} onClick={() => setActiveTab("design")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="2" /></svg>
            Design
          </button>
        </div>

        <div className="we-sidebar-scroll">
          {activeTab === "sections" ? (
            <div className="we-tab-content">
              <div className="we-section-list-header">
                <span>Section Order</span>
                <span className="we-section-count">{enabledCount} active</span>
              </div>
              <div className="we-section-list">
                {sections.map((sec, idx) => (
                  <div key={sec.id} className={`we-section-item ${!sec.enabled ? "disabled" : ""}`} draggable onDragStart={() => handleDragStart(idx)} onDragEnter={() => handleDragEnter(idx)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}>
                    <span className="we-drag-handle">&#9776;</span>
                    <span className="we-section-item-icon">{iconMap[sec.type]}</span>
                    <span className="we-section-item-label">{sec.label}</span>
                    <button className={`we-toggle ${sec.enabled ? "on" : ""}`} onClick={() => toggleSection(sec.id)}>
                      <span className="we-toggle-knob" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="we-divider" />

              {renderSectionEditor()}

              <SectionBlock icon={<Layout size={16} />} title="Footer" defaultOpen={false}>
                <Field label="Footer Text"><Textarea value={config.footerText} onChange={v => update("footerText", v)} rows={2} placeholder="All rights reserved..." /></Field>
              </SectionBlock>
            </div>
          ) : (
            <div className="we-tab-content">
              <SectionBlock icon={<Palette size={16} />} title="Colors & Branding">
                <div className="we-color-grid">
                  <ColorField label="Accent / Buttons" value={config.primaryColor} onChange={v => update("primaryColor", v)} />
                  <ColorField label="Text / Headings" value={config.secondaryColor} onChange={v => update("secondaryColor", v)} />
                </div>
              </SectionBlock>



              <SectionBlock icon={<Store size={16} />} title="Salon Identity" defaultOpen={false}>
                <Field label="Salon Name"><Input value={config.salonName} onChange={v => update("salonName", v)} placeholder="Your Salon" /></Field>
                <ImageField label="Logo" value={config.logoUrl} onChange={v => update("logoUrl", v)} hint="200 x 200" />
              </SectionBlock>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="we-preview-area">
        <div className="we-preview-toolbar">
          <div className="we-device-toggle">
            <button className={`we-device-btn ${previewDevice === "desktop" ? "active" : ""}`} onClick={() => setPreviewDevice("desktop")}>
              <Monitor size={14} />
              Desktop
            </button>
            <button className={`we-device-btn ${previewDevice === "mobile" ? "active" : ""}`} onClick={() => setPreviewDevice("mobile")}>
              <Smartphone size={14} />
              Mobile
            </button>
          </div>
          {slug && (
            <a href={`/site/${slug}`} target="_blank" rel="noopener noreferrer" className="we-preview-link">
              View Live Site
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 2H3v9h9V8" /><path d="M8 2h4v4" /><path d="M12 2L6 8" /></svg>
            </a>
          )}
        </div>
        <div className={`we-preview-frame ${previewDevice === "mobile" ? "we-mobile-frame" : ""}`}>
          <div className="we-preview-inner" style={{ height: "100%", width: "100%", position: "relative" }}>
            <LivePreview config={config} slug={slug} device={previewDevice} />
          </div>
        </div>
      </div>
    </div>
  );
}
