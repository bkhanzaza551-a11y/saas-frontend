import { useEffect, useState, useCallback } from "react";
import { Globe, CheckCircle, XCircle, Copy, Trash2, ExternalLink } from "lucide-react";
import { api } from "../../api/client";

export default function DomainSettingsPage() {
  const [subdomain, setSubdomain] = useState("");
  const [savedSubdomain, setSavedSubdomain] = useState("");
  const [status, setStatus] = useState("NONE");
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [avail, setAvail] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [message, setMessage] = useState({ error: "", success: "" });

  useEffect(() => {
    api.get("/owner/domain/settings").then(({ data }) => {
      setSavedSubdomain(data.subdomain || "");
      setSubdomain(data.subdomain || "");
      setStatus(data.status || "NONE");
      setUrl(data.url || "");
      setSlug(data.salon?.slug || "");
      setLoading(false);
    }).catch(() => { setLoading(false); setMessage({ error: "Failed to load domain settings", success: "" }); });
  }, []);

  const checkAvailability = useCallback((name) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!name || name.length < 3) { setAvail(null); return; }
    const timer = setTimeout(() => {
      setChecking(true);
      api.get(`/owner/domain/check?name=${name}`).then(({ data }) => {
        setAvail(data.available);
        if (!data.available) setMessage({ error: data.message || "Domain not available", success: "" });
      }).catch(() => setAvail(null)).finally(() => setChecking(false));
    }, 400);
    setDebounceTimer(timer);
  }, [debounceTimer]);

  const handleSubdomainChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-").replace(/^-|-$/g, "");
    setSubdomain(clean);
    setAvail(null);
    checkAvailability(clean);
  };

  const handleSave = async () => {
    if (!subdomain.trim() || subdomain.length < 3) return setMessage({ error: "Minimum 3 characters required", success: "" });
    setSaving(true);
    setMessage({ error: "", success: "" });
    try {
      const { data } = await api.post("/owner/domain/set", { subdomain: subdomain.trim() });
      setSavedSubdomain(data.subdomain);
      setStatus(data.status);
      setUrl(data.url);
      setMessage({ error: "", success: `Your website is live at ${data.url}` });
    } catch (err) {
      setMessage({ error: err.response?.data?.message || "Failed to save", success: "" });
    } finally { setSaving(false); }
  };

  const handleRemove = async () => {
    if (!confirm("Remove subdomain? Your site will only be available at the default URL.")) return;
    try {
      await api.delete("/owner/domain/remove");
      setSavedSubdomain(""); setSubdomain(""); setStatus("NONE"); setUrl(""); setAvail(null);
      setMessage({ error: "", success: "Subdomain removed" });
    } catch { setMessage({ error: "Failed to remove", success: "" }); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" /></div>;

  return (
    <div style={{ maxWidth: 672, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24, padding: "10px 0 40px 0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ padding: 12, background: "#fdf2f8", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Globe size={28} color="#db2777" />
        </div>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", margin: 0 }}>Website Subdomain</h2>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: "4px 0 0 0" }}>Get a free subdomain for your salon website</p>
        </div>
      </div>

      {message.error && (
        <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "0.85rem", borderRadius: 8, fontWeight: 500 }}>
          {message.error}
        </div>
      )}
      {message.success && (
        <div style={{ padding: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontSize: "0.85rem", borderRadius: 8, fontWeight: 500 }}>
          {message.success}
        </div>
      )}

      {/* Current Status */}
      {savedSubdomain && (
        <div style={{ background: "linear-gradient(to bottom right, #fdf2f8, #fff1f2)", borderRadius: 16, border: "1px solid #fbcfe8", padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#9d174d" }}>Your Website</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, background: "#d1fae5", color: "#047857" }}>
              <CheckCircle size={14} /> Live
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#ffffff", borderRadius: 12, padding: "12px 16px", border: "1px solid #fbcfe8", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: "0.9rem", fontFamily: "monospace", color: "#be185d", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
              {url} <ExternalLink size={14} style={{ flexShrink: 0 }} />
            </a>
            <button type="button" onClick={() => { navigator.clipboard.writeText(url); setMessage({ error: "", success: "Copied URL to clipboard!" }); }} style={{ background: "transparent", border: "none", color: "#64748b", padding: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background="transparent"} title="Copy link">
              <Copy size={16} />
            </button>
          </div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "#db2777" }}>
            <span style={{ fontWeight: 500 }}>Also available at:</span>
            <button type="button" onClick={() => { navigator.clipboard.writeText(`https://salonnest.in/site/${slug}`); setMessage({ error: "", success: "Copied URL to clipboard!" }); }} style={{ background: "transparent", border: "none", color: "var(--button-bg, #3b82f6)", cursor: "pointer", fontFamily: "monospace", textDecoration: "underline", padding: 0 }}>
              salonnest.in/site/{slug}
            </button>
          </div>
        </div>
      )}

      {/* Subdomain Input */}
      <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", margin: "0 0 16px 0" }}>{savedSubdomain ? "Change Subdomain" : "Set Your Subdomain"}</h3>
        <div style={{ display: "flex", alignItems: "center", border: "1px solid #d1d5db", borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s" }}>
          <input
            value={subdomain}
            onChange={(e) => handleSubdomainChange(e.target.value)}
            placeholder="beautyworld"
            maxLength={63}
            style={{ flex: 1, padding: "12px 16px", fontSize: "0.95rem", border: "none", outline: "none", background: "transparent", fontWeight: 500, minWidth: 0 }}
          />
          <span style={{ padding: "12px 16px", background: "#f9fafb", borderLeft: "1px solid #d1d5db", fontSize: "0.9rem", color: "#6b7280", fontFamily: "monospace", fontWeight: 500, flexShrink: 0 }}>.salonnest.in</span>
        </div>
        
        {/* Availability indicator */}
        <div style={{ marginTop: 10, minHeight: 20 }}>
          {checking && <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: 0 }}>Checking availability...</p>}
          {!checking && avail === true && (
            <p style={{ fontSize: "0.85rem", color: "#059669", margin: 0, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              <CheckCircle size={14} /> Available!
            </p>
          )}
          {!checking && avail === false && subdomain.length >= 3 && (
            <p style={{ fontSize: "0.85rem", color: "#dc2626", margin: 0, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              <XCircle size={14} /> Not available
            </p>
          )}
        </div>
        <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: "8px 0 0 0" }}>Lowercase letters, numbers, and hyphens. 3-63 characters.</p>
        
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button type="button" onClick={handleSave} disabled={saving || !subdomain.trim() || subdomain.length < 3 || avail === false} style={{ padding: "10px 24px", background: "var(--button-bg, #3b82f6)", border: "none", borderRadius: 8, fontWeight: 600, cursor: (saving || !subdomain.trim() || subdomain.length < 3 || avail === false) ? "not-allowed" : "pointer", color: "#fff", fontSize: "0.9rem", transition: "all 0.2s", opacity: (saving || !subdomain.trim() || subdomain.length < 3 || avail === false) ? 0.6 : 1, boxShadow: "0 2px 4px rgba(59,130,246,0.2)" }}>
            {saving ? "Saving..." : savedSubdomain ? "Update" : "Activate"}
          </button>
          {savedSubdomain && (
            <button type="button" onClick={handleRemove} style={{ padding: "10px 20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontWeight: 600, cursor: "pointer", color: "#dc2626", fontSize: "0.9rem", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background="#fee2e2"} onMouseLeave={e => e.currentTarget.style.background="#fef2f2"}>
              <Trash2 size={16} /> Remove
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ background: "#eff6ff", borderRadius: 16, border: "1px solid #bfdbfe", padding: 20 }}>
        <p style={{ fontSize: "0.85rem", color: "#1e3a8a", margin: 0, lineHeight: 1.6 }}>
          <strong style={{ fontWeight: 700 }}>How it works:</strong> Once activated, your salon website will be live at <code style={{ background: "#dbeafe", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", color: "#1d4ed8", fontWeight: 600 }}>https://{subdomain || "yourname"}.salonnest.in</code>. Share this link with your clients to let them browse services and book appointments online. No DNS setup required — it works instantly!
        </p>
      </div>
    </div>
  );
}
