import { useEffect, useState } from "react";
import { Globe, CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink, Trash2, RefreshCw } from "lucide-react";
import { api } from "../../api/client";

const STATUS_COLORS = {
  NONE: { bg: "bg-gray-100", text: "text-gray-600", label: "No Domain" },
  PENDING: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending Verification" },
  ACTIVE: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Active" },
  FAILED: { bg: "bg-red-100", text: "text-red-700", label: "Verification Failed" },
};

export default function DomainSettingsPage() {
  const [domain, setDomain] = useState("");
  const [savedDomain, setSavedDomain] = useState("");
  const [status, setStatus] = useState("NONE");
  const [token, setToken] = useState("");
  const [cnameTarget, setCnameTarget] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ error: "", success: "" });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setFeedback({ error: "", success: "Copied to clipboard!" });
    setTimeout(() => setFeedback(f => ({ ...f, success: "" })), 3000);
  };

  useEffect(() => {
    api.get("/owner/domain/settings").then(({ data }) => {
      setSavedDomain(data.domain || "");
      setDomain(data.domain || "");
      setStatus(data.status || "NONE");
      setToken(data.verificationToken || "");
      setCnameTarget(data.cnameTarget || "cname.vercel-dns.com");
      setSlug(data.salon?.slug || "");
      setLoading(false);
    }).catch(() => { setLoading(false); setFeedback({ error: "Failed to load domain settings", success: "" }); });
  }, []);

  const handleSave = async () => {
    if (!domain.trim()) return setFeedback({ error: "Enter a domain", success: "" });
    setSaving(true);
    setFeedback({ error: "", success: "" });
    try {
      const { data } = await api.post("/owner/domain/set", { domain: domain.trim() });
      setSavedDomain(data.domain);
      setStatus(data.status);
      setToken(data.verificationToken);
      setFeedback({ error: "", success: "Domain saved! Now configure DNS and verify." });
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || "Failed to save domain", success: "" });
    } finally { setSaving(false); }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setFeedback({ error: "", success: "" });
    try {
      const { data } = await api.post("/owner/domain/verify");
      setStatus(data.status);
      if (data.status === "ACTIVE") setFeedback({ error: "", success: "Domain verified! Your website is live." });
      else setFeedback({ error: data.message || "Verification failed", success: "" });
    } catch (err) {
      setStatus("FAILED");
      setFeedback({ error: err.response?.data?.message || "Verification failed", success: "" });
    } finally { setVerifying(false); }
  };

  const handleRemove = async () => {
    if (!confirm("Remove custom domain? Your site will revert to the default URL.")) return;
    try {
      await api.delete("/owner/domain/remove");
      setSavedDomain(""); setDomain(""); setStatus("NONE"); setToken("");
      setFeedback({ error: "", success: "Domain removed" });
    } catch { setFeedback({ error: "Failed to remove domain", success: "" }); }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 250 }}><RefreshCw className="animate-spin" size={24} color="#ec4899" /></div>;

  const statusInfo = STATUS_COLORS[status] || STATUS_COLORS.NONE;
  const defaultUrl = `https://salonnest.in/site/${slug}`;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ padding: 8, background: "#fce7f3", borderRadius: 8 }}><Globe size={20} color="#db2777" /></div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a" }}>Custom Domain</h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Connect your own domain to your salon website</p>
        </div>
      </div>

      {feedback.error && <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{feedback.error}</div>}
      {feedback.success && <div style={{ padding: "10px 14px", background: "#f0fdf4", color: "#16a34a", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{feedback.success}</div>}

      {/* Current Status */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Status</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#f1f5f9", color: "#475569" }}>
            {status === "ACTIVE" ? <CheckCircle size={14} color="#16a34a" /> : status === "FAILED" ? <XCircle size={14} color="#dc2626" /> : <AlertTriangle size={14} color="#f59e0b" />}
            {statusInfo.label}
          </span>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#64748b" }}>Default URL</span>
            <button type="button" onClick={() => copyToClipboard(defaultUrl)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#db2777", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}><Copy size={12} /> Copy</button>
          </div>
          <p style={{ margin: 0, fontSize: 13, fontFamily: "monospace", color: "#1e293b", wordBreak: "break-all" }}>{defaultUrl}</p>
          {savedDomain && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>Custom Domain</span>
                <a href={`https://${savedDomain}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#db2777", textDecoration: "none", fontWeight: 700 }}><ExternalLink size={12} /> Visit</a>
              </div>
              <p style={{ margin: 0, fontSize: 13, fontFamily: "monospace", color: "#1e293b", wordBreak: "break-all" }}>https://{savedDomain}</p>
            </>
          )}
        </div>
      </div>

      {/* Domain Input */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>{savedDomain ? "Update Domain" : "Add Custom Domain"}</h3>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="www.mysalon.com" style={{ flex: 1, padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, outline: "none" }} />
          <button type="button" onClick={handleSave} disabled={saving || !domain.trim()} style={{ padding: "10px 20px", background: "#db2777", color: "white", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", cursor: "pointer", opacity: saving || !domain.trim() ? 0.5 : 1 }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        {savedDomain && status !== "ACTIVE" && (
          <button type="button" onClick={handleVerify} disabled={verifying} style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#16a34a", color: "white", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", cursor: "pointer" }}>
            <RefreshCw size={14} className={verifying ? "animate-spin" : ""} />
            {verifying ? "Verifying..." : "Verify Domain"}
          </button>
        )}
        {savedDomain && (
          <button type="button" onClick={handleRemove} style={{ marginTop: 12, marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", color: "#dc2626", background: "#fef2f2", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", cursor: "pointer" }}>
            <Trash2 size={14} /> Remove Domain
          </button>
        )}
      </div>

      {/* DNS Setup Instructions */}
      {savedDomain && status !== "ACTIVE" && (
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: 18, borderBottom: "1px solid #f1f5f9" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>DNS Setup Instructions</h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>Add these records in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)</p>
          </div>
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Option 1: CNAME */}
            <div style={{ background: "#eff6ff", borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ padding: "2px 6px", background: "#bfdbfe", color: "#1e40af", fontSize: 10, fontWeight: 800, borderRadius: 4 }}>OPTION 1</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a" }}>CNAME Record (Recommended)</span>
              </div>
              <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #bfdbfe", overflow: "hidden" }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead><tr style={{ background: "#eff6ff", borderBottom: "1px solid #bfdbfe" }}>
                    <th style={{ padding: "6px 12px", textAlign: "left", color: "#1d4ed8" }}>Type</th>
                    <th style={{ padding: "6px 12px", textAlign: "left", color: "#1d4ed8" }}>Name</th>
                    <th style={{ padding: "6px 12px", textAlign: "left", color: "#1d4ed8" }}>Value</th>
                  </tr></thead>
                  <tbody><tr>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#1e40af" }}>CNAME</td>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#1e293b" }}>{savedDomain.split(".")[0]}</td>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                      {cnameTarget}
                      <button type="button" onClick={() => copyToClipboard(cnameTarget)} style={{ background: "none", border: "none", cursor: "pointer", color: "#db2777" }}><Copy size={12} /></button>
                    </td>
                  </tr></tbody>
                </table>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: 12, background: "#fffbeb", borderRadius: 8, border: "1px solid #fef3c7" }}>
              <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: "#92400e" }}>
                <p style={{ fontWeight: 700, margin: "0 0 4px" }}>Important Notes:</p>
                <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.5 }}>
                  <li>DNS propagation takes 5-30 minutes (sometimes up to 48 hours)</li>
                  <li>SSL certificate is automatically provisioned by Vercel</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
