import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";

export default function CustomerPortalSettingsPage() {
  const { auth } = useAuth();
  const [form, setForm] = useState({
    whatsappNumber: "",
    bookingNotes: "",
    cancellationPolicy: ""
  });
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [copiedLink, setCopiedLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/owner/settings").catch(() => ({ data: {} })),
      api.get("/owner/catalog/preview").catch(() => ({ data: null }))
    ]).then(([settingsResponse, previewResponse]) => {
      if (!active) return;
      const settings = settingsResponse.data || {};
      setForm({
        whatsappNumber: settings.whatsappNumber || "",
        bookingNotes: settings.bookingNotes || "",
        cancellationPolicy: settings.cancellationPolicy || ""
      });
      setPreview(previewResponse.data || null);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ error: "", success: "" });
    try {
      await api.post("/owner/settings", form);
      setStatus({ error: "", success: "Customer portal settings saved successfully." });
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save customer portal settings"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const slug = preview?.settings?.customSlug || preview?.salon?.slug || auth?.membership?.salonSlug || "";
  const appBaseUrl = typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:5173";
  const links = useMemo(() => ({
    login: `${appBaseUrl}/customer/login`,
    register: `${appBaseUrl}/customer/register`,
    profile: `${appBaseUrl}/customer/profile`,
    publicBooking: slug ? `${appBaseUrl}/site/${slug}/collections` : `${appBaseUrl}/collections`
  }), [appBaseUrl, slug]);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(""), 3000);
  };

  const featureFlags = auth?.membership?.featureFlags || {};

  return (
    <div style={{ padding: "24px", maxWidth: "1280px", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Header Banner */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)", borderRadius: "20px", padding: "32px 28px", color: "#ffffff", marginBottom: "28px", boxShadow: "0 10px 30px rgba(15,23,42,0.12)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(165,180,252,0.3)", padding: "4px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "700", color: "#c7d2fe", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              🌐 CUSTOMER ENGAGEMENT SUITE
            </div>
            <h1 style={{ margin: "0 0 6px", fontSize: "1.8rem", fontWeight: "800", letterSpacing: "-0.02em" }}>Customer Portal & Booking Settings</h1>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#94a3b8" }}>Control customer-facing access rules, direct links, and booking policy messaging from your central salon panel.</p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ padding: "6px 14px", borderRadius: "999px", background: featureFlags.customerPortal === false ? "#fee2e2" : "#dcfce7", color: featureFlags.customerPortal === false ? "#b91c1c" : "#15803d", fontSize: "0.8rem", fontWeight: "700" }}>
              ● {featureFlags.customerPortal === false ? "Portal Disabled" : "Portal Active"}
            </span>
            <span style={{ padding: "6px 14px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: "0.8rem", fontWeight: "600", border: "1px solid rgba(255,255,255,0.15)" }}>
              Slug: {slug || "Default"}
            </span>
          </div>
        </div>
      </div>

      {copiedLink && (
        <div style={{ marginBottom: "20px", padding: "12px 18px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "12px", color: "#065f46", fontSize: "0.9rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>✅</span> Copied <strong>{copiedLink}</strong> to clipboard!
        </div>
      )}

      {status.error && (
        <div style={{ marginBottom: "20px", padding: "12px 18px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", color: "#991b1b", fontSize: "0.9rem", fontWeight: "600" }}>
          ⚠️ {status.error}
        </div>
      )}

      {status.success && (
        <div style={{ marginBottom: "20px", padding: "12px 18px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", color: "#1e40af", fontSize: "0.9rem", fontWeight: "600" }}>
          🎉 {status.success}
        </div>
      )}

      {loading ? (
        <PageLoader title="Loading customer portal settings" message="Preparing customer links, public booking context, and portal readiness data." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
          
          {/* Column 1: Configuration Form */}
          <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
              <span style={{ fontSize: "1.3rem" }}>⚙️</span>
              <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>Portal Policy & Contact Rules</h2>
            </div>

            <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#334155" }}>Customer Support WhatsApp Number</span>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={form.whatsappNumber}
                  onChange={(event) => setForm((current) => ({ ...current, whatsappNumber: event.target.value }))}
                  style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", width: "100%", outline: "none", transition: "border 0.2s" }}
                />
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Used for customer support buttons on public booking & storefront pages.</span>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#334155" }}>Booking Notes & Client Instructions</span>
                <textarea
                  rows="4"
                  placeholder="e.g. Please arrive 10 minutes prior to your appointment time. Parking is available behind the salon."
                  value={form.bookingNotes}
                  onChange={(event) => setForm((current) => ({ ...current, bookingNotes: event.target.value }))}
                  style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", width: "100%", fontFamily: "inherit", outline: "none", resize: "vertical" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#334155" }}>Cancellation & Reschedule Policy</span>
                <textarea
                  rows="4"
                  placeholder="e.g. Free cancellation up to 4 hours before appointment time. Late cancellations may incur a fee."
                  value={form.cancellationPolicy}
                  onChange={(event) => setForm((current) => ({ ...current, cancellationPolicy: event.target.value }))}
                  style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", width: "100%", fontFamily: "inherit", outline: "none", resize: "vertical" }}
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "#ffffff", padding: "14px 24px", borderRadius: "10px", border: "none", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 12px rgba(79,70,229,0.25)", marginTop: "8px" }}
              >
                {saving ? "Saving Portal Settings..." : "Save Portal Settings"}
              </button>
            </form>
          </div>

          {/* Column 2: Links & Readiness Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Direct Customer Links */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
                <span style={{ fontSize: "1.3rem" }}>🔗</span>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>Direct Customer Access Links</h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Public Booking Link */}
                <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#4f46e5" }}>📅 Public Booking Page</span>
                    <button onClick={() => copyToClipboard(links.publicBooking, "Public Booking Link")} style={{ background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}>Copy Link</button>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", wordBreak: "break-all", fontFamily: "monospace" }}>{links.publicBooking}</div>
                </div>

                {/* Customer Login Link */}
                <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0f172a" }}>🔐 Customer Login</span>
                    <button onClick={() => copyToClipboard(links.login, "Login Link")} style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}>Copy Link</button>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", wordBreak: "break-all", fontFamily: "monospace" }}>{links.login}</div>
                </div>

                {/* Customer Register Link */}
                <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0f172a" }}>📝 Customer Registration</span>
                    <button onClick={() => copyToClipboard(links.register, "Register Link")} style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}>Copy Link</button>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", wordBreak: "break-all", fontFamily: "monospace" }}>{links.register}</div>
                </div>

                {/* Customer Profile Link */}
                <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0f172a" }}>👤 Customer Account Dashboard</span>
                    <button onClick={() => copyToClipboard(links.profile, "Profile Link")} style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}>Copy Link</button>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", wordBreak: "break-all", fontFamily: "monospace" }}>{links.profile}</div>
                </div>

              </div>
            </div>

            {/* Portal Readiness Overview */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ fontSize: "1.3rem" }}>⚡</span>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>Feature Readiness Status</h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { name: "Customer Portal", active: featureFlags.customerPortal !== false },
                  { name: "Digital Catalog", active: featureFlags.digitalCatalog !== false },
                  { name: "Appointments", active: featureFlags.appointments !== false },
                  { name: "E-Commerce Store", active: featureFlags.ecommerce !== false }
                ].map((item, idx) => (
                  <div key={idx} style={{ padding: "10px 14px", borderRadius: "10px", background: item.active ? "#f0fdf4" : "#f8fafc", border: `1px solid ${item.active ? "#bbf7d0" : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "600", color: item.active ? "#166534" : "#64748b" }}>{item.name}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: "800", color: item.active ? "#15803d" : "#94a3b8" }}>{item.active ? "✓ Active" : "Disabled"}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
